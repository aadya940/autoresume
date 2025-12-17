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
        while True:
            # Combine all active tasks from both resume and cover letter
            all_tasks = active_tasks + active_cover_letter_tasks
            
            if not all_tasks:
                # No active tasks, send ready signal
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

            # Check job search tasks independently
            from .job_search import active_job_search_tasks
            for task_id in active_job_search_tasks[:]:
                try:
                    try:
                        result = await broker.result_backend.get_result(task_id)
                    except KeyError:
                        result = None

                    if result is not None:
                        # Job search completed, remove from active list and emit event
                        active_job_search_tasks.remove(task_id)
                        
                        if hasattr(result, "is_err") and result.is_err:
                            logger.error(f"Job search task {task_id} failed: {result.error}")
                            payload = {"success": False, "error": str(result.error)}
                        else:
                            payload = result.return_value
                        
                        yield f"event: job_update\ndata: {json.dumps(payload)}\n\n"
                        
                except Exception as e:
                    logger.error(f"Error executing job task check: {e}")
                    active_job_search_tasks.remove(task_id)

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
