"""Job search API routes using the JobMatcher library."""

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional
import logging
from pathlib import Path

from ai.jobs import JobMatcher, JobMatcherError, ResumeParseError

logger = logging.getLogger(__name__)

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
            f"Starting job search: title={request.job_title}, "
            f"location={request.location}, max_results={request.max_results}"
        )

        matcher = JobMatcher(resume_path)
        result = matcher.search(
            location=request.location,
            job_title=request.job_title,
            max_results=request.max_results,
            sites=request.sites,
        )

        logger.info(
            f"Job search completed: success={result.success}, "
            f"total_jobs={result.total_jobs}"
        )

        return JSONResponse(content=result.dict())

    except ResumeParseError as e:
        logger.error(f"Resume parse error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except JobMatcherError as e:
        logger.error(f"Job matcher error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error in job search: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Job search failed: {str(e)}")
