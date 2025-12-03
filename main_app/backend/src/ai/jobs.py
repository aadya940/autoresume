from typing import List, Dict, Optional, Union, Any
from pathlib import Path
from enum import Enum
from datetime import date, datetime
import logging
from dataclasses import dataclass, field, asdict

import pandas as pd
import pypandoc
import yake
from jobspy import scrape_jobs

# Configure logging
logger = logging.getLogger(__name__)


class JobSite(str, Enum):
    """Supported job sites."""

    INDEED = "indeed"
    ZIP_RECRUITER = "zip_recruiter"
    GOOGLE = "google"
    LINKEDIN = "linkedin"


class JobMatcherError(Exception):
    """Base exception for JobMatcher library."""

    pass


class ResumeParseError(JobMatcherError):
    """Raised when resume parsing fails."""

    pass


@dataclass
class SearchParams:
    """Search parameters configuration."""

    location: str = "United States"
    max_results: int = 50
    job_title: str = "software engineer"
    sites: List[str] = field(
        default_factory=lambda: ["indeed", "linkedin", "zip_recruiter", "google"]
    )
    hours_old: Optional[int] = None
    country: str = "USA"


@dataclass
class SearchResult:
    """
    Structured search result compatible with FastAPI response models.

    Attributes:
        success: Whether the search succeeded
        total_jobs: Number of jobs found
        skills_used: Skills extracted from resume
        search_params: Parameters used for search
        jobs: List of job postings
        error: Error message if search failed
    """

    success: bool
    total_jobs: int
    skills_used: List[str]
    search_params: Dict[str, Any]
    jobs: List[Dict[str, Any]]
    error: Optional[str] = None

    def model_dump(self) -> Dict[str, Any]:
        """FastAPI v2 compatibility."""
        return asdict(self)

    def dict(self) -> Dict[str, Any]:
        """FastAPI v1 compatibility."""
        return asdict(self)


class SkillExtractor:
    """Extracts technical skills from resume text."""

    EXCLUDED_TERMS = frozenset(
        [
            "experience",
            "company",
            "month",
            "year",
            "job",
            "title",
            "state",
            "city",
            "orchestrated",
            "deployment",
            "education",
            "university",
            "degree",
            "present",
            "previous",
            "responsibilities",
            "aadya",
            "chinubhai",
        ]
    )

    def __init__(self, top_n: int = 10):
        self.top_n = top_n
        self._kw_extractor = yake.KeywordExtractor(
            top=top_n * 2, lan="en", n=1, dedupLim=0.9
        )

    def extract(self, text: str) -> List[str]:
        """
        Extract skills from resume text.

        Args:
            text: Resume text content

        Returns:
            List of extracted skills
        """
        skills = self._extract_structured(text)

        if not skills:
            logger.debug("Structured extraction failed, falling back to YAKE")
            skills = self._extract_yake(text)

        return skills[: self.top_n]

    def _extract_structured(self, text: str) -> List[str]:
        """Extract from structured resume sections."""
        skills = []

        if "Technical Skills" not in text:
            return skills

        try:
            section = text.split("Technical Skills")[1].split("\n\n")[0]
            for line in section.split("\n"):
                if ":" in line:
                    tech_list = line.split(":", 1)[1].strip()
                    skills.extend(t.strip() for t in tech_list.split(","))
        except IndexError:
            logger.warning("Failed to parse Technical Skills section")

        return skills

    def _extract_yake(self, text: str) -> List[str]:
        """Extract using YAKE algorithm."""
        keywords = self._kw_extractor.extract_keywords(text)
        filtered = [
            kw
            for kw, _ in keywords
            if not any(term in kw.lower() for term in self.EXCLUDED_TERMS)
        ]
        return filtered[: self.top_n]


class JobMatcher:
    """
    Main interface for resume-to-job matching.

    Thread-safe for FastAPI background tasks and concurrent requests.

    Example:
        >>> matcher = JobMatcher("resume.tex")
        >>> result = matcher.search(location="California", max_results=50)
        >>> return result.dict()  # FastAPI compatible
    """

    def __init__(
        self,
        resume_path: Union[str, Path],
        skill_extractor: Optional[SkillExtractor] = None,
    ):
        """
        Initialize JobMatcher.

        Args:
            resume_path: Path to resume file (.tex, .pdf, .docx)
            skill_extractor: Custom skill extractor (optional)

        Raises:
            ResumeParseError: If resume cannot be parsed
        """
        self.resume_path = Path(resume_path)
        self._text = self._parse_resume()
        self._extractor = skill_extractor or SkillExtractor()
        self._skills = self._extractor.extract(self._text)

        logger.info(f"Initialized JobMatcher with {len(self._skills)} skills")

    @property
    def skills(self) -> List[str]:
        """Get extracted skills."""
        return self._skills.copy()

    @property
    def text(self) -> str:
        """Get resume text."""
        return self._text

    def _parse_resume(self) -> str:
        """Parse resume to plain text."""
        if not self.resume_path.exists():
            raise ResumeParseError(f"Resume file not found: {self.resume_path}")

        try:
            return pypandoc.convert_file(str(self.resume_path), "plain", format="latex")
        except Exception as e:
            logger.error(f"Failed to parse resume: {e}")
            raise ResumeParseError(f"Failed to parse resume: {e}") from e

    def _scrape_jobs(self, params: SearchParams) -> pd.DataFrame:
        """Execute job scraping."""
        search_term = f"{params.job_title}"
        skills_str = " ".join(self._skills[:5])

        logger.info(
            f"Searching for: {search_term} with skills: {skills_str} "
            f"in {params.location}"
        )

        kwargs = {
            "site_name": params.sites,
            "search_term": search_term,
            "google_search_term": f"{search_term} jobs {params.location} {skills_str}",
            "location": params.location,
            "results_wanted": params.max_results,
            "country_indeed": params.country,
        }

        if params.hours_old:
            kwargs["hours_old"] = params.hours_old

        return scrape_jobs(**kwargs)

    def search(
        self,
        location: str = "United States",
        max_results: int = 50,
        job_title: str = "software engineer",
        sites: Optional[List[str]] = None,
        hours_old: Optional[int] = None,
    ) -> SearchResult:
        """
        Search for jobs matching the resume.

        Args:
            location: Job location
            max_results: Maximum number of results
            job_title: Base job title to search for
            sites: List of job sites to search
            hours_old: Only jobs posted within this many hours

        Returns:
            SearchResult compatible with FastAPI response models
        """
        params = SearchParams(
            location=location,
            max_results=max_results,
            job_title=job_title,
            sites=sites or ["indeed", "linkedin", "zip_recruiter", "google"],
            hours_old=hours_old,
        )

        try:
            jobs_df = self._scrape_jobs(params)

            # Convert to JSON-serializable format - handle date objects
            jobs_list = []
            for record in jobs_df.to_dict("records"):
                cleaned_record = {}
                for key, value in record.items():
                    if pd.isna(value):
                        cleaned_record[key] = None
                    elif isinstance(value, (date, datetime)):
                        cleaned_record[key] = value.isoformat()
                    else:
                        cleaned_record[key] = value
                jobs_list.append(cleaned_record)

            logger.info(f"Successfully found {len(jobs_list)} jobs")

            return SearchResult(
                success=True,
                total_jobs=len(jobs_list),
                skills_used=self._skills[:5],
                search_params={
                    "location": location,
                    "job_title": job_title,
                    "max_results": max_results,
                    "sites": params.sites,
                },
                jobs=jobs_list,
            )

        except Exception as e:
            logger.error(f"Job search failed: {e}", exc_info=True)
            return SearchResult(
                success=False,
                total_jobs=0,
                skills_used=self._skills[:5],
                search_params={"location": location, "job_title": job_title},
                jobs=[],
                error=str(e),
            )

    async def search_async(self, **kwargs) -> SearchResult:
        """
        Async wrapper for FastAPI background tasks.

        Note: Actual scraping is still synchronous; this just provides
        an async interface for FastAPI compatibility.
        """
        return self.search(**kwargs)
