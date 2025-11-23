from fastapi import APIRouter
from fastapi.responses import JSONResponse
import logging
from task_queue import broker

from .update import active_tasks

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

polling_router = APIRouter()


@polling_router.get("/api/pdf-status")
async def get_pdf_status():
    """Check if all active tasks are completed."""
    try:
        logger.info(f"Active tasks: {active_tasks}")

        if not active_tasks:
            logger.info("No active tasks - ready")
            return JSONResponse(content={"ready": True})

        # Iterate over a COPY of the list
        completed_tasks = []
        all_completed = True

        for task_id in active_tasks[:]:
            try:
                result = await broker.result_backend.get_result(task_id)

                # Task exists and completed
                if result is not None:
                    logger.info(f"Task {task_id} completed")
                    completed_tasks.append(task_id)

                    # Check if it errored
                    if hasattr(result, "is_err") and result.is_err:
                        logger.error(f"Task {task_id} failed: {result.error}")
                else:
                    # Task still pending
                    logger.info(f"Task {task_id} still pending")
                    all_completed = False

            except Exception as e:
                # Task not found or still processing
                logger.info(f"Task {task_id} not ready: {str(e)}")
                all_completed = False

        # Remove completed tasks after iteration
        for task_id in completed_tasks:
            active_tasks.remove(task_id)
            logger.info(f"Removed task {task_id} from active list")

        logger.info(f"Status - Ready: {all_completed}, Remaining: {len(active_tasks)}")

        return JSONResponse(
            content={
                "ready": all_completed,
                "active_count": len(active_tasks),
                "completed_count": len(completed_tasks),
            }
        )

    except Exception as e:
        logger.error(f"Error checking PDF status: {str(e)}", exc_info=True)
        return JSONResponse(content={"ready": False, "error": str(e)}, status_code=500)
