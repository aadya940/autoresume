"""Job search API routes using the JobMatcher library."""

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional
import logging
from pathlib import Path

from ai.jobs import JobMatcher, JobMatcherError, ResumeParseError
from task_queue import job_search_task

logger = logging.getLogger(__name__)


# Store active job search tasks
active_job_search_tasks = []


job_search_router = APIRouter()


class JobSearchRequest(BaseModel):
    """Job search request model."""

    location: str = "United States"
    job_title: str = "software engineer"
    max_results: int = 50
    sites: List[str] = ["indeed", "linkedin", "zip_recruiter", "google"]


@job_search_router.get("/api/jobs/skills")
async def get_resume_skills():
    """
    Extract skills from the user's resume.

    Returns:
        JSON with extracted skills
    """
    resume_path = Path("assets/user_file.tex")

    if not resume_path.exists():
        raise HTTPException(
            status_code=404, detail="Resume not found. Please build your resume first."
        )

    try:
        matcher = JobMatcher(resume_path)
        skills = matcher.skills

        logger.info(f"Extracted {len(skills)} skills from resume")

        return JSONResponse(
            content={"success": True, "skills": skills, "total_skills": len(skills)}
        )

    except ResumeParseError as e:
        logger.error(f"Resume parse error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error extracting skills: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Failed to extract skills: {str(e)}"
        )


@job_search_router.post("/api/jobs/search")
async def search_jobs(request: JobSearchRequest):
    """
    Search for jobs based on resume and search parameters.

    Args:
        request: Job search parameters

    Returns:
        JSON with job search results
    """
    resume_path = Path("assets/user_file.tex")

    if not resume_path.exists():
        raise HTTPException(
            status_code=404, detail="Resume not found. Please build your resume first."
        )

    try:
        logger.info(
            f"Dispatching job search task: title={request.job_title}, "
            f"location={request.location}, max_results={request.max_results}"
        )

        message = await job_search_task.kiq(
            resume_path=str(resume_path),
            location=request.location,
            job_title=request.job_title,
            max_results=request.max_results,
            sites=request.sites,
        )

        active_job_search_tasks.append(message.task_id)
        logger.info(f"Job search task dispatched with ID: {message.task_id}")

        return JSONResponse(
            content={
                "message": "Job search started",
                "task_id": message.task_id,
                "status": "processing",
            },
            status_code=202,
        )

    except Exception as e:
        logger.error(f"Error dispatching job search: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Job search failed to start: {str(e)}"
        )
