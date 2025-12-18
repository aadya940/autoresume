from fastapi import APIRouter
from fastapi.responses import StreamingResponse
import asyncio
import logging
import json
from task_queue import broker
from .update import active_tasks
from .cover_letter import active_cover_letter_tasks

logger = logging.getLogger(__name__)

sse_router = APIRouter()


@sse_router.get("/api/events")
async def sse_endpoint():
    """
    Server-Sent Events endpoint to stream task status updates.
    Yields 'data: ready' when all active tasks are completed.
    """

    async def event_generator():
        iteration = 0
        while True:
            iteration += 1
            logger.info(f"[SSE] Event generator iteration {iteration}")
            
            # Check job search tasks FIRST (independently of other tasks)
            from .job_search import active_job_search_tasks
            logger.info(f"[SSE] Job search tasks: {len(active_job_search_tasks)}")
            
            for task_id in active_job_search_tasks[:]:
                try:
                    logger.info(f"[JOB SEARCH SSE] Checking task {task_id}")
                    
                    try:
                        result = await broker.result_backend.get_result(task_id)
                        logger.info(f"[JOB SEARCH SSE] Got result for {task_id}: {type(result)}")
                    except KeyError as ke:
                        logger.warning(f"[JOB SEARCH SSE] KeyError for {task_id}: {ke}")
                        result = None
                    except Exception as ex:
                        logger.error(f"[JOB SEARCH SSE] Exception getting result for {task_id}: {ex}", exc_info=True)
                        result = None

                    if result is  not None:
                        logger.info(f"[JOB SEARCH SSE] Result found, processing...")
                        
                        # Job search completed, remove from active list and emit event
                        active_job_search_tasks.remove(task_id)
                        
                        if hasattr(result, "is_err") and result.is_err:
                            logger.error(f"Job search task {task_id} failed: {result.error}")
                            payload = {"success": False, "error": str(result.error)}
                        else:
                            logger.info(f"[JOB SEARCH SSE] Extracting return_value")
                            payload = result.return_value
                            logger.info(f"[JOB SEARCH SSE] Payload keys: {payload.keys() if isinstance(payload, dict) else 'N/A'}")
                        
                        logger.info(f"[JOB SEARCH SSE] Emitting job_update event")
                        yield f"event: job_update\ndata: {json.dumps(payload)}\n\n"
                        logger.info(f"[JOB SEARCH SSE] Event emitted successfully")
                    else:
                        logger.info(f"[JOB SEARCH SSE] Result is None, task not complete yet")
                        
                except Exception as e:
                    logger.error(f"[JOB SEARCH SSE] Error: {e}", exc_info=True)
                    if task_id in active_job_search_tasks:
                        active_job_search_tasks.remove(task_id)
            
            # Check cover letter tasks independently
            for task_id in active_cover_letter_tasks[:]:
                try:
                    logger.info(f"[COVER LETTER SSE] Checking task {task_id}")
                    
                    try:
                        result = await broker.result_backend.get_result(task_id)
                        logger.info(f"[COVER LETTER SSE] Got result for {task_id}: {type(result)}")
                    except KeyError as ke:
                        logger.warning(f"[COVER LETTER SSE] KeyError for {task_id}: {ke}")
                        result = None
                    except Exception as ex:
                        logger.error(f"[COVER LETTER SSE] Exception getting result for {task_id}: {ex}", exc_info=True)
                        result = None

                    if result is not None:
                        logger.info(f"[COVER LETTER SSE] Task {task_id} completed, processing...")
                        
                        # Cover letter completed, remove from active list and emit event
                        active_cover_letter_tasks.remove(task_id)
                        
                        if hasattr(result, "is_err") and result.is_err:
                            logger.error(f"Cover letter task {task_id} failed: {result.error}")
                            payload = {"success": False, "error": str(result.error), "task_id": task_id}
                        else:
                            logger.info(f"[COVER LETTER SSE] Extracting return_value")
                            payload = {
                                "success": True,
                                "task_id": task_id,
                                "message": result.return_value.get("message", "Cover letter generated")
                            }
                            logger.info(f"[COVER LETTER SSE] Payload: {payload}")
                        
                        logger.info(f"[COVER LETTER SSE] Emitting cover_letter_update event")
                        yield f"event: cover_letter_update\ndata: {json.dumps(payload)}\n\n"
                        logger.info(f"[COVER LETTER SSE] Event emitted successfully")
                    else:
                        logger.info(f"[COVER LETTER SSE] Result is None, task not complete yet")
                        
                except Exception as e:
                    logger.error(f"[COVER LETTER SSE] Error: {e}", exc_info=True)
                    if task_id in active_cover_letter_tasks:
                        active_cover_letter_tasks.remove(task_id)
            
            # Combine all active tasks from both resume and cover letter
            all_tasks = active_tasks + active_cover_letter_tasks
            
            logger.info(f"[SSE] Resume tasks: {len(active_tasks)}, Cover letter tasks: {len(active_cover_letter_tasks)}")
            
            if not all_tasks:
                # No active resume/cover letter tasks, send ready signal
                logger.info(f"[SSE] No resume/cover tasks, sending ready")
                yield f"data: ready\n\n"
                await asyncio.sleep(2)
                continue

            # Check status of active tasks
            all_completed = True
            completed_tasks = []

            # Check resume tasks
            for task_id in active_tasks[:]:
                try:
                    result = await broker.result_backend.get_result(task_id)

                    if result is not None:
                        completed_tasks.append(('resume', task_id))
                        if hasattr(result, "is_err") and result.is_err:
                            logger.error(f"Resume task {task_id} failed: {result.error}")
                    else:
                        all_completed = False
                except Exception:
                    all_completed = False
            
            # Check cover letter tasks
            for task_id in active_cover_letter_tasks[:]:
                try:
                    result = await broker.result_backend.get_result(task_id)

                    if result is not None:
                        completed_tasks.append(('cover_letter', task_id))
                        if hasattr(result, "is_err") and result.is_err:
                            logger.error(f"Cover letter task {task_id} failed: {result.error}")
                    else:
                        all_completed = False
                except Exception:
                    all_completed = False

            # Clean up completed tasks
            for task_type, task_id in completed_tasks:
                if task_type == 'resume' and task_id in active_tasks:
                    active_tasks.remove(task_id)
                elif task_type == 'cover_letter' and task_id in active_cover_letter_tasks:
                    active_cover_letter_tasks.remove(task_id)

            if all_completed and not all_tasks:
                yield f"data: ready\n\n"
            else:
                yield f"data: processing\n\n"

            await asyncio.sleep(1)

    return StreamingResponse(event_generator(), media_type="text/event-stream")
