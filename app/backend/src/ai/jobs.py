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




class JobDescriptionCleaner:
    """Cleans job descriptions using keyword extraction to identify relevant content."""

    BOILERPLATE_TERMS = frozenset([
        "equal opportunity", "eeo", "accommodation", "disability", "ada",
        "benefit", "insurance", "401k", "pension", "pto", "vacation",
        "application process", "how to apply", "selection process",
        "background check", "drug test", "e-verify",
        "company culture", "why join us", "about our company",
    ])

    def __init__(self, top_keywords: int = 30):
        """
        Initialize description cleaner.
        
        Args:
            top_keywords: Number of top keywords to extract for relevance scoring
        """
        self.top_keywords = top_keywords
        self._kw_extractor = yake.KeywordExtractor(
            top=top_keywords, lan="en", n=3, dedupLim=0.7
        )

    def clean(self, description: str, max_length: int = 2000) -> str:
        """
        Extract relevant content from job description.
        
        Args:
            description: Full job description text
            max_length: Maximum length of cleaned description
            
        Returns:
            Cleaned description with relevant content
        """
        if not description or len(description) < 100:
            return description

        # Extract keywords to identify important content
        try:
            keywords = self._kw_extractor.extract_keywords(description)
            keyword_set = {kw.lower() for kw, _ in keywords}
        except Exception:
            # Fallback if YAKE fails
            return description[:max_length]

        # Important section indicators (high priority)
        priority_terms = {
            'responsibilities', 'requirements', 'required', 'qualifications',
            'skills', 'experience', 'duties', 'role', 'position', 'minimum',
            'preferred', 'desired', 'must have', 'seeking', 'looking for'
        }

        # Split into lines and group into sections
        lines = description.split('\n')
        sections = []
        current_section = []
        current_header = ""
        
        for line in lines:
            stripped = line.strip()
            
            # Detect section headers (bold text with ** or standalone emphasized text)
            if stripped.startswith('**') or (len(stripped) > 3 and stripped.isupper()):
                # Save previous section
                if current_section:
                    sections.append((current_header, '\n'.join(current_section)))
                current_header = stripped.replace('**', '').replace('*', '').strip()
                current_section = [line]
            else:
                current_section.append(line)
        
        # Add final section
        if current_section:
            sections.append((current_header, '\n'.join(current_section)))

        # Score sections
        scored_sections = []
        for header, content in sections:
            header_lower = header.lower()
            content_lower = content.lower()
            
            # Skip boilerplate sections
            if any(term in header_lower for term in self.BOILERPLATE_TERMS):
                continue
            if any(term in content_lower[:200] for term in ['about our company', 'about peraton', 'about the company', 'why join', 'our culture']):
                continue
            
            # Calculate score based on priority terms and keywords
            score = 0
            
            # High score for priority terms in header
            if any(term in header_lower for term in priority_terms):
                score += 100
            
            # Score based on keyword presence in content
            words = set(content_lower.split())
            keyword_matches = sum(1 for kw in keyword_set if any(kw in word for word in words))
            score += keyword_matches * 5
            
            # Bonus for priority terms in content
            priority_matches = sum(1 for term in priority_terms if term in content_lower)
            score += priority_matches * 10
            
            # Penalty for very short sections (likely not important)
            if len(content) < 50:
                score = score // 2
            
            if score > 0:
                scored_sections.append((score, header, content))

        # Sort by score
        scored_sections.sort(reverse=True, key=lambda x: x[0])
        
        # Combine top sections until we reach max_length
        result = []
        current_length = 0
        
        for score, header, content in scored_sections:
            section_text = content
            if current_length + len(section_text) > max_length:
                break
            result.append(section_text)
            current_length += len(section_text)

        cleaned = '\n\n'.join(result).strip()
        return cleaned if cleaned else description[:max_length]


class SkillExtractor:
    """Extracts skills from resume by intelligently parsing relevant sections."""

    def __init__(self, top_n: int = 10):
        self.top_n = top_n
        # Allow 2-word phrases for better skill extraction (e.g., "machine learning")
        self._kw_extractor = yake.KeywordExtractor(
            top=top_n * 2,
            lan="en",
            n=2,  # 1-2 word phrases
            dedupLim=0.8
        )

    def extract(self, text: str) -> List[str]:
        """
        Extract skills from resume text using section-aware approach.

        Args:
            text: Resume text content

        Returns:
            List of extracted skills from relevant sections
        """
        # Try structured extraction from explicit Skills section first
        skills = self._extract_from_skills_section(text)
        
        if len(skills) < self.top_n:
            # Supplement with YAKE extraction from relevant sections only
            additional = self._extract_from_relevant_sections(text)
            skills.extend(additional)
            
        # Deduplicate and return
        seen = set()
        result = []
        for skill in skills:
            skill_lower = skill.lower()
            if skill_lower not in seen and len(skill_lower) > 1:
                seen.add(skill_lower)
                result.append(skill_lower)
                
        return result[:self.top_n]

    def _extract_from_skills_section(self, text: str) -> List[str]:
        """Extract from explicit Skills or Technical Skills section."""
        skills = []
        
        # Look for Skills section
        for header in ["Technical Skills", "Skills", "Core Competencies", "Technologies"]:
            if header in text:
                try:
                    # Get text between this header and next section (or double newline)
                    section_start = text.index(header) + len(header)
                    remaining = text[section_start:]
                    
                    # Find section end (double newline or next major section)
                    section_end = len(remaining)
                    for next_header in ["\n\n", "Experience", "Education", "Projects"]:
                        pos = remaining.find(next_header)
                        if pos > 0 and pos < section_end:
                            section_end = pos
                    
                    section_text = remaining[:section_end].strip()
                    
                    # Parse skills - check for colon-separated format first
                    for line in section_text.split("\n"):
                        if ":" in line:
                            # Format: "Category: skill1, skill2, skill3"
                            tech_list = line.split(":", 1)[1].strip()
                            skills.extend(s.strip() for s in tech_list.split(",") if s.strip())
                        elif line.strip() and not line.strip().startswith("•"):
                            # Plain list of skills
                            skills.extend(s.strip() for s in line.split(",") if s.strip())
                    
                    if skills:
                        break  # Found skills, no need to check other headers
                        
                except (ValueError, IndexError):
                    continue
        
        return skills

    def _extract_from_relevant_sections(self, text: str) -> List[str]:
        """Extract keywords using YAKE but only from Experience section."""
        # Find Experience section
        experience_text = ""
        
        for header in ["Experience", "Work Experience", "Professional Experience"]:
            if header in text:
                try:
                    section_start = text.index(header) + len(header)
                    remaining = text[section_start:]
                    
                    # Find section end
                    section_end = len(remaining)
                    for next_header in ["Education", "Projects", "Publications", "Awards", "Certifications"]:
                        pos = remaining.find(next_header)
                        if pos > 0 and pos < section_end:
                            section_end = pos
                    
                    experience_text = remaining[:section_end].strip()
                    break
                    
                except (ValueError, IndexError):
                    continue
        
        if not experience_text:
            return []
        
        # Run YAKE on experience section only
        try:
            keywords = self._kw_extractor.extract_keywords(experience_text)
            # Return just the keyword strings, limit to reasonable length
            return [kw for kw, _ in keywords if 2 < len(kw) < 25]
        except Exception:
            return []


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
        description_cleaner: Optional[JobDescriptionCleaner] = None,
    ):
        """
        Initialize JobMatcher.

        Args:
            resume_path: Path to resume file (.tex, .pdf, .docx)
            skill_extractor: Custom skill extractor (optional)
            description_cleaner: Custom description cleaner (optional)

        Raises:
            ResumeParseError: If resume cannot be parsed
        """
        self.resume_path = Path(resume_path)
        self._text = self._parse_resume()
        self._extractor = skill_extractor or SkillExtractor()
        self._skills = self._extractor.extract(self._text)
        self._desc_cleaner = description_cleaner or JobDescriptionCleaner()

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

            # Convert to JSON-serializable format - handle date objects and clean descriptions
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
                
                # Clean job description if present
                if cleaned_record.get('description'):
                    original_desc = cleaned_record['description']
                    cleaned_record['description_full'] = original_desc
                    cleaned_record['description'] = self._desc_cleaner.clean(original_desc)
                    logger.debug(f"Cleaned description from {len(original_desc)} to {len(cleaned_record['description'])} chars")
                
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
