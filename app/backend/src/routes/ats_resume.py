"""ATS Resume API routes."""

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel
from typing import Optional
import logging
from pathlib import Path

from task_queue import generate_ats_resume_task

logger = logging.getLogger(__name__)

ats_resume_router = APIRouter()

# Store active ATS resume tasks (similar to cover_letter.py)
active_ats_tasks = []


class ATSResumeRequest(BaseModel):
    """ATS resume generation request model."""

    job_description: str
    company: str
    title: str
    job_url: Optional[str] = None


class ATSResumeUpdateRequest(BaseModel):
    """ATS resume update request model."""

    tex_content: str


@ats_resume_router.post("/api/ats-resume/generate")
async def generate_ats_resume(request: ATSResumeRequest):
    """
    Submit ATS resume generation task to queue.

    Args:
        request: ATS resume generation parameters

    Returns:
        JSON with task submission status (202 Accepted)
    """
    try:
        logger.info(
            f"Submitting ATS resume task for {request.company} - {request.title}"
        )

        # Submit task to queue
        message = await generate_ats_resume_task.kiq(
            request.job_description, request.company, request.title
        )

        # Track task
        active_ats_tasks.append(message.task_id)
        logger.info(f"✓ Submitted ATS resume task: {message.task_id}")
        logger.info(f"Active ATS tasks: {active_ats_tasks}")
        logger.info(f"Task message: {message}")

        return JSONResponse(
            content={
                "message": "ATS resume generation task submitted to queue",
                "task_id": message.task_id,
                "success": True,
            },
            status_code=202,  # Accepted
        )

    except FileNotFoundError as e:
        logger.error(f"Resume not found: {e}")
        raise HTTPException(
            status_code=404, detail="Resume not found. Please build your resume first."
        )
    except Exception as e:
        logger.error(f"Error generating ATS resume: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Failed to generate ATS resume: {str(e)}"
        )


@ats_resume_router.post("/api/ats-resume/update")
async def update_ats_resume(request: ATSResumeUpdateRequest):
    """
    Update ATS resume with edited LaTeX content and recompile.

    Args:
        request: ATS resume update request with tex_content

    Returns:
        JSON with success status
    """
    try:
        logger.info("Updating ATS resume with edited content")

        # Ensure assets directory exists
        assets_dir = Path("assets")
        assets_dir.mkdir(parents=True, exist_ok=True)

        tex_path = assets_dir / "optimized_resume.tex"

        # Write new content
        with open(tex_path, "w", encoding="utf-8") as f:
            f.write(request.tex_content)

        # Recompile
        from ai.utils import compile_tex

        compile_tex(str(assets_dir), str(tex_path))

        logger.info("ATS resume updated and recompiled successfully")

        return JSONResponse({"success": True, "message": "ATS resume updated"})

    except Exception as e:
        logger.error(f"Error updating ATS resume: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Failed to update ATS resume: {str(e)}"
        )
