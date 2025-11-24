"""Update endpoint with logging"""

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
    update_resume_with_tex,
)

load_dotenv()

logger = logging.getLogger(__name__)


class LinkRequest(BaseModel):
    links: List[str]
    feedback: Optional[str] = ""
    joblink: Optional[str] = ""
    tex_content: Optional[str] = ""
    template_id: Optional[str] = ""


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
        _tex_content = payload.tex_content
        template_id = payload.template_id

        logger.info(
            f"Received request - Links: {len(links)}, Feedback: {bool(feedback)}, "
            f"JobLink: {bool(job_link)}, TeX: {bool(_tex_content)}, TemplateID: {template_id}"
        )

        # Save template preference if provided
        if template_id:
            async with aiofiles.open("assets/template_preference.txt", "w") as f:
                await f.write(template_id)

        tasks_submitted = 0

        if _tex_content:
            message = await update_resume_with_tex.kiq(_tex_content)
            active_tasks.append(message.task_id)
            logger.info(f"✓ Submitted tex task: {message.task_id}")
            tasks_submitted += 1

        if len(links) > 0:
            message = await update_resume_with_links_task.kiq(links)
            active_tasks.append(message.task_id)
            logger.info(f"✓ Submitted links task: {message.task_id}")
            tasks_submitted += 1

        if len(feedback) > 0:
            message = await update_resume_with_feedback_task.kiq(feedback)
            active_tasks.append(message.task_id)
            logger.info(f"✓ Submitted feedback task: {message.task_id}")
            tasks_submitted += 1

        if job_link and job_link.strip():
            message = await optimize_resume_for_job_task.kiq(job_link)
            active_tasks.append(message.task_id)
            logger.info(f"✓ Submitted job task: {message.task_id}")
            tasks_submitted += 1

        logger.info(
            f"Total tasks submitted: {tasks_submitted}, "
            f"Total active: {len(active_tasks)}"
        )
        logger.info(f"Active task IDs: {active_tasks}")

        return JSONResponse(
            content={
                "message": "Resume update tasks submitted to queue.",
                "tasks_submitted": tasks_submitted,
                "active_count": len(active_tasks),
            },
            status_code=202,
        )

    except Exception as e:
        logger.error(f"Error in update_resume endpoint: {str(e)}", exc_info=True)
        return JSONResponse(content={"error": str(e)}, status_code=500)
