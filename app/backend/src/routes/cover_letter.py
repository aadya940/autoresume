"""Cover letter API routes."""

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel
from typing import Optional
import logging
from pathlib import Path

from task_queue import generate_cover_letter_task

logger = logging.getLogger(__name__)

cover_letter_router = APIRouter()

# Store active cover letter tasks (similar to update.py)
active_cover_letter_tasks = []


class CoverLetterRequest(BaseModel):
    """Cover letter generation request model."""

    job_description: str
    company: str
    title: str
    job_url: Optional[str] = None


class CoverLetterUpdateRequest(BaseModel):
    """Cover letter update request model."""

    tex_content: str


@cover_letter_router.post("/api/cover-letter/generate")
async def generate_cover_letter(request: CoverLetterRequest):
    """
    Submit cover letter generation task to queue.

    Args:
        request: Cover letter generation parameters

    Returns:
        JSON with task submission status (202 Accepted)
    """
    try:
        logger.info(
            f"Submitting cover letter task for {request.company} - {request.title}"
        )

        # Submit task to queue
        message = await generate_cover_letter_task.kiq(
            request.job_description, request.company, request.title
        )

        # Track task
        active_cover_letter_tasks.append(message.task_id)
        logger.info(f"✓ Submitted cover letter task: {message.task_id}")
        logger.info(f"Active cover letter tasks: {active_cover_letter_tasks}")
        logger.info(f"Task message: {message}")

        return JSONResponse(
            content={
                "message": "Cover letter generation task submitted to queue",
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
        logger.error(f"Error generating cover letter: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Failed to generate cover letter: {str(e)}"
        )


@cover_letter_router.post("/api/cover-letter/update")
async def update_cover_letter(request: CoverLetterUpdateRequest):
    """
    Update cover letter with edited LaTeX content and recompile.

    Args:
        request: Cover letter update request with tex_content

    Returns:
        JSON with success status
    """
    try:
        logger.info("Updating cover letter with edited content")

        # Ensure assets directory exists
        assets_dir = Path("assets")
        assets_dir.mkdir(parents=True, exist_ok=True)

        tex_path = assets_dir / "generated_cover_letter.tex"

        # Write new content
        with open(tex_path, "w", encoding="utf-8") as f:
            f.write(request.tex_content)

        # Recompile
        from ai.utils import compile_tex

        compile_tex(str(assets_dir), str(tex_path))

        logger.info("Cover letter updated and recompiled successfully")

        return JSONResponse({"success": True, "message": "Cover letter updated"})

    except Exception as e:
        logger.error(f"Error updating cover letter: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Failed to update cover letter: {str(e)}"
        )
