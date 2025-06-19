from fastapi import APIRouter
from fastapi.responses import JSONResponse
import logging

from task_queue import clear_resume_task  # Import actor

from . import update

# Create router
clear_resume_router = APIRouter()

logger = logging.getLogger(__name__)


@clear_resume_router.post("/clear-resume")
async def clear_resume():
    """Route to clear and reset the resume PDF using Dramatiq task queue."""
    message = await clear_resume_task.kiq()  # Send task to Dramatiq

    update.active_tasks.append(message.task_id)

    return JSONResponse(
        content={"message": "Resume clear task queued."}, status_code=202
    )
