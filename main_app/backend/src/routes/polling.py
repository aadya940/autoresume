from fastapi import APIRouter
from fastapi.responses import JSONResponse
import logging
from task_queue import broker  # Make sure broker is the Taskiq broker instance

from .update import active_tasks

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

polling_router = APIRouter()


@polling_router.get("/api/pdf-status")
async def get_pdf_status():
    """Check if all active tasks are completed."""
    try:
        logger.info("Active tasks: %s", active_tasks)
        if not active_tasks:
            logger.info("The code is here.")
            return JSONResponse(content={"ready": True})

        ready = True
        for task_id in active_tasks:  # Iterate over a copy to safely modify
            try:
                result = await broker.result_backend.get_result(task_id)
                logger.info("The logger is in try.")
                # Task completed, remove from active set
                active_tasks.remove(task_id)
                logger.info(f"Task ID {task_id} discarded.")
            except Exception as e:
                # Task not found or not completed
                logger.info(f"The following exception occured {str(e)}")
                ready = False
                break

        logger.info(f"Status: {ready}")

        return JSONResponse(content={"ready": ready})
    except Exception as e:
        logger.error(f"Error checking PDF status: {str(e)}")
        return JSONResponse(content={"ready": False, "error": str(e)}, status_code=500)
