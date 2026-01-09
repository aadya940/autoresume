"""ATS Resume Optimizer - Keyword extraction and injection for job-specific resume optimization."""

import logging
from pathlib import Path
from typing import List, Dict, Tuple
import pypandoc
import yake
import re

logger = logging.getLogger(__name__)


class ResumeATSOptimizer:
    """Optimizes resumes for ATS by injecting missing keywords from job descriptions."""

    # Common tech synonyms for semantic matching
    SYNONYMS = {
        "ml": ["machine learning", "machine-learning"],
        "ai": ["artificial intelligence", "artificial-intelligence"],
        "js": ["javascript"],
        "ts": ["typescript"],
        "k8s": ["kubernetes"],
        "react": ["reactjs", "react.js"],
        "node": ["nodejs", "node.js"],
        "ci/cd": ["continuous integration", "continuous deployment"],
        "aws": ["amazon web services"],
        "gcp": ["google cloud platform"],
    }

    # Boilerplate terms to filter out from job descriptions
    BOILERPLATE_TERMS = frozenset(
        [
            "equal opportunity",
            "eeo",
            "accommodation",
            "disability",
            "ada",
            "benefit",
            "insurance",
            "401k",
            "pension",
            "pto",
            "vacation",
            "application process",
            "how to apply",
            "selection process",
            "background check",
            "drug test",
            "e-verify",
            "company culture",
            "why join us",
            "about our company",
            "perks",
            "we offer",
        ]
    )

    def __init__(self, top_keywords: int = 20):
        """
        Initialize ATS optimizer.

        Args:
            top_keywords: Number of top keywords to extract from job description
        """
        self.top_keywords = top_keywords
        self._kw_extractor = yake.KeywordExtractor(
            top=top_keywords, lan="en", n=2, dedupLim=0.8  # Extract 1-2 word phrases
        )

    def optimize(
        self,
        job_description: str,
        company: str,
        title: str,
        resume_path: Path = Path("assets/user_file.tex"),
    ) -> Dict[str, any]:
        """
        Optimize resume for specific job by injecting missing keywords.

        Args:
            job_description: Full job description text
            company: Company name
            title: Job title
            resume_path: Path to original resume .tex file

        Returns:
            Dictionary with:
                - tex_content: Optimized LaTeX resume content
                - keywords_added: List of keywords that were added
                - keywords_matched: List of keywords already in resume
        """
        logger.info(f"Starting ATS optimization for {company} - {title}")

        # 1. Extract keywords from job description
        job_keywords = self._extract_job_keywords(job_description)
        logger.info(f"Extracted {len(job_keywords)} keywords from job description")

        # 2. Parse resume
        resume_text, resume_tex = self._parse_resume_text(resume_path)
        logger.info(f"Parsed resume from {resume_path}")

        # 3. Filter keywords not semantically present
        missing_keywords = []
        matched_keywords = []

        for kw in job_keywords:
            if self._check_semantic_presence(kw, resume_text):
                matched_keywords.append(kw)
            else:
                missing_keywords.append(kw)

        logger.info(
            f"Found {len(missing_keywords)} missing keywords, {len(matched_keywords)} already matched"
        )

        # 4. Inject missing keywords into resume
        if missing_keywords:
            optimized_tex = self._inject_keywords(resume_tex, missing_keywords)
        else:
            optimized_tex = resume_tex
            logger.info(
                "No keywords to add - resume already contains all relevant keywords"
            )

        return {
            "tex_content": optimized_tex,
            "keywords_added": missing_keywords,
            "keywords_matched": matched_keywords,
        }

    def _extract_job_keywords(self, description: str) -> List[str]:
        """
        Extract relevant skills from job description using LLM (with YAKE fallback).
        Wrapper for async implementation.
        """
        import asyncio

        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                import concurrent.futures

                with concurrent.futures.ThreadPoolExecutor() as pool:
                    future = pool.submit(
                        asyncio.run, self._extract_job_keywords_async(description)
                    )
                    return future.result()
            else:
                return loop.run_until_complete(
                    self._extract_job_keywords_async(description)
                )
        except RuntimeError:
            return asyncio.run(self._extract_job_keywords_async(description))

    async def _extract_job_keywords_async(self, description: str) -> List[str]:
        """Async LLM extraction of skills."""
        if not description or len(description) < 50:
            return []

        try:
            # Try LLM extraction first
            return await self._extract_skills_with_llm(description)
        except Exception as e:
            logger.error(f"LLM keyword extraction failed: {e}. Falling back to YAKE.")
            return self._extract_job_keywords_yake(description)

    async def _extract_skills_with_llm(self, description: str) -> List[str]:
        """Extract skills using Google ADK agent."""
        from google.adk.agents import LlmAgent
        from google.adk.sessions import InMemorySessionService
        from google.adk.runners import Runner
        from google.genai import types
        from google.adk.planners.built_in_planner import BuiltInPlanner

        class SkillExtractionAgent(LlmAgent):
            def __init__(self):
                super().__init__(
                    name="skill_extraction_agent",
                    description="Extracts technical skills and tools from job descriptions",
                    model="gemini-3-flash-preview",
                    planner=BuiltInPlanner(
                        thinking_config=types.ThinkingConfig(thinking_budget=-1)
                    ),
                )

        session_service = InMemorySessionService()
        await session_service.create_session(
            app_name="ats_optimizer_app",
            user_id="user_001",
            session_id="skill_extraction_session",
        )

        runner = Runner(
            agent=SkillExtractionAgent(),
            app_name="ats_optimizer_app",
            session_service=session_service,
        )

        prompt = f"""Extract 15-20 most important hard skills, tools, languages, and frameworks from this job description.
        
        INSTRUCTIONS:
        1. Return ONLY a comma-separated list of skills.
        2. Focus on: Programming Languages, Frameworks, Cloud Platforms, Databases, Tools (Git, Docker), Key Technical Concepts (CI/CD, REST APIs).
        3. IGNORE: Soft skills (Communication, Leadership), generic terms (Engineering, Development), and company names.
        4. Normalize terms (e.g. "ReactJS" -> "React", "Amazon Web Services" -> "AWS").
        
        JOB DESCRIPTION:
        {description[:4000]}
        """

        user_message = types.Content(role="user", parts=[types.Part(text=prompt)])

        async for event in runner.run_async(
            user_id="user_001",
            session_id="skill_extraction_session",
            new_message=user_message,
        ):
            if event.is_final_response() and event.content and event.content.parts:
                response = event.content.parts[0].text.strip()
                # Clean up response
                if response.startswith("Skills:"):
                    response = response.replace("Skills:", "")

                skills = [s.strip() for s in response.split(",") if s.strip()]
                return skills[: self.top_keywords]

        return []

    def _extract_job_keywords_yake(self, description: str) -> List[str]:
        """Legacy YAKE extraction fallback."""
        try:
            # Extract keywords using YAKE
            raw_keywords = self._kw_extractor.extract_keywords(description)

            # Filter and clean keywords
            keywords = []
            for kw, score in raw_keywords:
                kw_clean = kw.strip().lower()

                # Skip if too short or too long
                if len(kw_clean) < 2 or len(kw_clean) > 30:
                    continue

                # Skip boilerplate terms
                if any(term in kw_clean for term in self.BOILERPLATE_TERMS):
                    continue

                # Skip if mostly numbers
                if sum(c.isdigit() for c in kw_clean) > len(kw_clean) / 2:
                    continue

                keywords.append(kw_clean)

            return keywords[: self.top_keywords]

        except Exception as e:
            logger.error(f"Error extracting keywords with YAKE: {e}")
            return []

    def _parse_resume_text(self, resume_path: Path) -> Tuple[str, str]:
        """
        Parse resume to extract both plain text and LaTeX content.

        Args:
            resume_path: Path to .tex resume file

        Returns:
            Tuple of (plain_text, latex_content)
        """
        if not resume_path.exists():
            raise FileNotFoundError(f"Resume not found at {resume_path}")

        # Read LaTeX content
        with open(resume_path, "r", encoding="utf-8") as f:
            latex_content = f.read()

        # Convert to plain text for keyword matching
        try:
            plain_text = pypandoc.convert_file(
                str(resume_path), "plain", format="latex"
            )
        except Exception as e:
            logger.error(f"Failed to convert resume to plain text: {e}")
            # Fallback: strip basic LaTeX commands
            plain_text = re.sub(r"\\[a-zA-Z]+(\[.*?\])?(\{.*?\})?", "", latex_content)

        return plain_text, latex_content

    def _check_semantic_presence(self, keyword: str, resume_text: str) -> bool:
        """
        Check if keyword is semantically present in resume.

        Uses exact matching, substring matching, and synonym detection.

        Args:
            keyword: Keyword to check
            resume_text: Resume plain text

        Returns:
            True if keyword is present (semantically)
        """
        keyword_lower = keyword.lower()
        resume_lower = resume_text.lower()

        # Exact match
        if keyword_lower in resume_lower:
            return True

        # Check word boundaries (avoid matching "React" in "Create")
        keyword_words = keyword_lower.split()
        if len(keyword_words) == 1:
            # Single word - check with word boundaries
            pattern = r"\b" + re.escape(keyword_lower) + r"\b"
            if re.search(pattern, resume_lower):
                return True

        # Check synonyms
        for base_term, synonyms in self.SYNONYMS.items():
            if keyword_lower == base_term or keyword_lower in synonyms:
                # Check if any synonym is present
                all_terms = [base_term] + synonyms
                for term in all_terms:
                    if term in resume_lower:
                        return True

        # Check if keyword is substring of existing skill
        # e.g., "React" should match "React.js"
        resume_words = resume_lower.split()
        for word in resume_words:
            if keyword_lower in word or word in keyword_lower:
                # Check if one is substring of other (at least 70% match)
                shorter = min(keyword_lower, word, key=len)
                longer = max(keyword_lower, word, key=len)
                if len(shorter) / len(longer) >= 0.7:
                    return True

        return False

    async def _inject_keywords_with_llm(
        self, resume_tex: str, keywords: List[str]
    ) -> str:
        """
        Use Google ADK to inject keywords into resume intelligently.

        Args:
            resume_tex: Original LaTeX resume content
            keywords: List of keywords to add

        Returns:
            Modified LaTeX content with keywords injected
        """
        from google.adk.agents import LlmAgent
        from google.adk.sessions import InMemorySessionService
        from google.adk.runners import Runner
        from google.genai import types
        from google.adk.planners.built_in_planner import BuiltInPlanner

        keywords_str = ", ".join(keywords)

        # Create ADK agent for keyword injection
        class KeywordInjectionAgent(LlmAgent):
            """Agent for injecting keywords into LaTeX resumes."""

            def __init__(self):
                model_args = types.ThinkingConfig(thinking_budget=-1)
                planner = BuiltInPlanner(thinking_config=model_args)

                super().__init__(
                    name="keyword_injection_agent",
                    description="Injects ATS keywords into LaTeX resumes naturally",
                    model="gemini-3-flash-preview",
                    planner=planner,
                )

        # Create session and runner
        session_service = InMemorySessionService()
        await session_service.create_session(
            app_name="ats_optimizer_app",
            user_id="user_001",
            session_id="keyword_injection_session",
        )

        # Initialize agent and runner
        agent = KeywordInjectionAgent()
        runner = Runner(
            agent=agent,
            app_name="ats_optimizer_app",
            session_service=session_service,
        )

        # Create prompt
        prompt = f"""You are a LaTeX resume expert. Your goal is to subtly optimize the resume for ATS by adding relevant keywords.

KEYWORDS TO ADD: {keywords_str}

INSTRUCTIONS:
1.  **Locate the "Skills" or "Technical Skills" section.**
2.  **Integrate the new keywords into this existing section.**
    *   If the section is a comma-separated list, simply append the new keywords.
    *   If the section is categorized (e.g., "Languages:", "Tools:"), add each keyword to the most relevant category.
    *   Do NOT create a new "Additional Skills" subsection unless the Skills section is missing entirely.
3.  **Be conservative.** Only add keywords that fit naturally. Do not disrupt the layout or make the section overly long.
4.  **Preserve ALL other resume content exactly as-is.** Do not change fonts, margins, or other sections.
5.  If no Skills section exists, create a small \\section{{Skills}} before Education with the keywords.
6.  Return ONLY the complete modified LaTeX code.

ORIGINAL RESUME:
```latex
{resume_tex}
```

Return the modified resume:"""

        user_message = types.Content(role="user", parts=[types.Part(text=prompt)])

        try:
            async for event in runner.run_async(
                user_id="user_001",
                session_id="keyword_injection_session",
                new_message=user_message,
            ):
                if event.is_final_response() and event.content and event.content.parts:
                    modified_tex = event.content.parts[0].text.strip()

                    # Remove markdown code fences if present
                    if modified_tex.startswith("```"):
                        lines = modified_tex.split("\n")
                        lines = lines[1:]  # Remove first line (```latex or ```)
                        if lines and lines[-1].strip() == "```":
                            lines = lines[:-1]  # Remove last line
                        modified_tex = "\n".join(lines)

                    logger.info("ADK agent successfully injected keywords")
                    return modified_tex

        except Exception as e:
            logger.error(f"Error using ADK for keyword injection: {e}", exc_info=True)
            raise

        return resume_tex

    async def _inject_keywords_async(self, resume_tex: str, keywords: List[str]) -> str:
        """
        Inject missing keywords into resume using Google ADK (async).

        Args:
            resume_tex: Original LaTeX resume content
            keywords: List of keywords to add

        Returns:
            Modified LaTeX content with keywords injected
        """
        if not keywords:
            return resume_tex

        # Be conservative: limit to top 15 keywords max to avoid stuffing
        conservative_keywords = keywords[:15]
        keywords_str = ", ".join(conservative_keywords)

        logger.info(
            f"Using Google ADK to inject keywords (conservative): {keywords_str}"
        )

        try:
            return await self._inject_keywords_with_llm(
                resume_tex, conservative_keywords
            )
        except Exception as e:
            logger.error(f"ADK injection failed: {e}", exc_info=True)
            logger.info("Falling back to simple keyword append")
            return self._simple_inject_keywords(resume_tex, conservative_keywords)

    def _inject_keywords(self, resume_tex: str, keywords: List[str]) -> str:
        """
        Synchronous wrapper for _inject_keywords_async.

        Args:
            resume_tex: Original LaTeX resume content
            keywords: List of keywords to add

        Returns:
            Modified LaTeX content with keywords injected
        """
        import asyncio

        # Get or create event loop
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                # If loop is already running, use run_in_executor
                import concurrent.futures

                with concurrent.futures.ThreadPoolExecutor() as pool:
                    future = pool.submit(
                        asyncio.run, self._inject_keywords_async(resume_tex, keywords)
                    )
                    return future.result()
            else:
                return loop.run_until_complete(
                    self._inject_keywords_async(resume_tex, keywords)
                )
        except RuntimeError:
            # No event loop, create new one
            return asyncio.run(self._inject_keywords_async(resume_tex, keywords))

    def _simple_inject_keywords(self, resume_tex: str, keywords: List[str]) -> str:
        """
        Fallback: Simple keyword injection by appending before \\end{document}.

        Args:
            resume_tex: Original LaTeX resume content
            keywords: List of keywords to add

        Returns:
            Modified LaTeX content
        """
        keywords_str = ", ".join(keywords)
        logger.info(f"Simple injection: adding {len(keywords)} keywords")

        # Build keyword section using raw strings to avoid escape sequence issues
        keyword_section = "\n\n% ATS Keywords - Auto-generated\n"
        keyword_section += r"\vspace{0.5em}" + "\n"
        keyword_section += r"\noindent\textbf{Additional Relevant Skills:} "
        keyword_section += keywords_str
        keyword_section += "\n\n"

        # Find \end{document} and insert before it
        end_doc = r"\end{document}"
        if end_doc in resume_tex:
            parts = resume_tex.rsplit(end_doc, 1)
            result = parts[0] + keyword_section + end_doc
            if len(parts) > 1:
                result += parts[1]
            logger.info("Keywords injected successfully")
            return result
        else:
            # Fallback: append to end
            logger.warning("No \\end{document} found, appending to end")
            return resume_tex + keyword_section
