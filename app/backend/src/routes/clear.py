from fastapi import APIRouter
from fastapi.responses import JSONResponse
import logging
from task_queue import clear_resume_task

from .update import active_tasks

clear_resume_router = APIRouter()
logger = logging.getLogger(__name__)


@clear_resume_router.post("/api/clear-resume")
async def clear_resume():
    """Route to clear and reset the resume PDF using Taskiq task queue."""
    message = await clear_resume_task.kiq()

    active_tasks.append(message.task_id)
    logger.info(f"Added clear task {message.task_id}. Active: {len(active_tasks)}")

    return JSONResponse(
        content={"message": "Resume clear task queued.", "task_id": message.task_id},
        status_code=202,
    )
