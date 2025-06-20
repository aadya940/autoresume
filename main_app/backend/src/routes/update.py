# update.py
"""Route to update the Resume using Dramatiq task queue."""

from fastapi import APIRouter
from fastapi.responses import JSONResponse
import aiofiles
import logging
from pydantic import BaseModel
from typing import List, Optional
from dotenv import load_dotenv

from task_queue import (
    update_resume_with_links_task,
    update_resume_with_feedback_task,
    optimize_resume_for_job_task,
)

load_dotenv()

logger = logging.getLogger(__name__)


class LinkRequest(BaseModel):
    links: List[str]
    feedback: Optional[str] = ""
    joblink: Optional[str] = ""


update_resume_router = APIRouter()

# Store message IDs for tracking
active_tasks = []


@update_resume_router.post("/api/update-resume")
async def update_resume(payload: LinkRequest):
    try:
        # Read existing cached links
        try:
            async with aiofiles.open("assets/link_cache.txt") as f:
                curr_links = [line.strip() async for line in f]
        except FileNotFoundError:
            curr_links = []

        links_in_request = payload.links
        links = list(set(links_in_request) - set(curr_links))
        feedback = payload.feedback
        job_link = payload.joblink

        logger.info(f"Links Received: {links}")

        # Submit tasks to taskiq
        if len(links) > 0:
            message = await update_resume_with_links_task.kiq(links)
            active_tasks.append(message.task_id)
            logger.info(f"Submitted links task: {message}")

        if len(feedback) > 0:
            message = await update_resume_with_feedback_task.kiq(feedback)
            active_tasks.append(message.task_id)
            logger.info(f"Submitted feedback task: {message}")

        if job_link and job_link.strip():
            message = await optimize_resume_for_job_task.kiq(job_link)
            active_tasks.append(message.task_id)
            logger.info(f"Submitted job optimization task: {message}")

        return JSONResponse(
            content={"message": "Resume update tasks submitted to queue."},
            status_code=202,
        )

    except Exception as e:
        logger.error(f"Error in update_resume endpoint: {str(e)}")
        return JSONResponse(content={"error": str(e)}, status_code=500)
