"""Cover letter generation using Google Agent Development Kit and Harvard writing guidelines.

Harvard Guidelines Source:
https://careerservices.fas.harvard.edu/resources/create-a-strong-resume/#covertips
"""

import logging
import asyncio
from pathlib import Path
from datetime import datetime
from typing import Dict
import re

from google.adk.agents import LlmAgent
from google.adk.sessions import InMemorySessionService
from google.adk.runners import Runner
from google.genai import types
from google.adk.planners.built_in_planner import BuiltInPlanner

from ai.jobs import JobMatcher

logger = logging.getLogger(__name__)


HARVARD_GUIDELINES_SYSTEM = """You are an expert cover letter writer following Harvard Career Services guidelines.

CRITICAL RULES (Harvard Guidelines):
- Address letters to a specific person when possible
- Keep concise - single page maximum (400-500 words)
- Avoid flowery language - be direct and professional
- Provide concrete examples with quantifiable achievements
- Minimize "I" pronoun overuse - vary sentence structure
- Use action words and active voice
- Reference specific skills from job description
- Show genuine enthusiasm without being excessive

STRUCTURE (4 Paragraphs):
1. OPENING (2-3 sentences):
   - State the position you're applying for
   - Briefly mention how you found it or relevant connection
   - Express genuine interest in the role/company

2. MISSION CONNECTION (3-4 sentences):
   - Connect your passion/interests to the company's mission or this specific role
   - Show you've researched the company
   - Explain why this opportunity excites you professionally

3. RELEVANT EXPERIENCE (4-5 sentences):
   - Highlight 2-3 specific, quantifiable achievements
   - Use metrics (e.g., "increased engagement by 20%", "led team of 10")
   - Draw clear connections to job requirements
   - Demonstrate how past experience prepares you for this role

4. CLOSING (2 sentences):
   - Thank them for consideration
   - Express enthusiasm for an interview

TONE: Professional, confident, authentic - should NOT feel AI-generated"""


class CoverLetterAgent(LlmAgent):
    """Agent for generating professional cover letters."""
    
    def __init__(self):
        self._model_args = types.ThinkingConfig(thinking_budget=-1)
        self._planner = BuiltInPlanner(thinking_config=self._model_args)
        
        super().__init__(
            name="cover_letter_agent",
            description="Generates professional cover letters following Harvard guidelines",
            model="gemini-2.5-flash",
            planner=self._planner,
        )


class CoverLetterGenerator:
    """Generates professional cover letters using Google ADK and Harvard guidelines."""
    
    def __init__(self):
        """Initialize the cover letter generator."""
        self._runner = None
        self._session_initialized = False
        
    async def _get_runner(self):
        """Get or create runner instance."""
        if self._runner is None:
            session_service = InMemorySessionService()
            await session_service.create_session(
                app_name="cover_letter_app",
                user_id="user_001",
                session_id="cover_letter_session"
            )
            agent = CoverLetterAgent()
            self._runner = Runner(
                agent=agent,
                session_service=session_service,
                app_name="cover_letter_app"
            )
            self._session_initialized = True
        
        return self._runner
    
    def _extract_resume_info(self, resume_text: str) -> Dict[str, str]:
        """Extract key information from resume text."""
        info = {
            'name': '',
            'email': '',
            'phone': '',
            'location': '',
            'linkedin': '',
            'github': ''
        }
        
        lines = resume_text.split('\n')
        for line in lines:
            line = line.strip()
            
            # Extract email
            if '@' in line and not info['email']:
                email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', line)
                if email_match:
                    info['email'] = email_match.group()
            
            # Extract phone
            if '(' in line and ')' in line and not info['phone']:
                phone_match = re.search(r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', line)
                if phone_match:
                    info['phone'] = phone_match.group()
        
        return info
    
    async def _get_llm_response(self, prompt: str) -> str:
        """Get LLM response using ADK runner."""
        runner = await self._get_runner()
        user_message = types.Content(role="user", parts=[types.Part(text=prompt)])
        
        try:
            async for event in runner.run_async(
                user_id="user_001",
                session_id="cover_letter_session",
                new_message=user_message
            ):
                if event.is_final_response() and event.content and event.content.parts:
                    return event.content.parts[0].text
        except Exception as e:
            logger.error(f"Error getting LLM response: {e}")
            raise
        
        return ""
    
    async def generate(
        self,
        job_description: str,
        company: str,
        title: str,
        resume_path: Path = Path("assets/user_file.tex")
    ) -> Dict[str, any]:
        """
        Generate a professional cover letter for a specific job.
        
        Args:
            job_description: Full job description text
            company: Company name
            title: Job title
            resume_path: Path to resume file
            
        Returns:
            Dictionary with tex_content, keywords_matched, and resume_info
        """
        return await self._generate_async(job_description, company, title, resume_path)
    
    async def _generate_async(
        self,
        job_description: str,
        company: str,
        title: str,
        resume_path: Path
    ) -> Dict[str, any]:
        """Async implementation of cover letter generation."""
        
        # Get resume text and info
        if not resume_path.exists():
            raise FileNotFoundError("Resume not found")
        
        matcher = JobMatcher(resume_path)
        resume_text = matcher.text
        resume_info = self._extract_resume_info(resume_text)
        resume_skills = matcher.skills[:10]
        
        # Create generation prompt
        user_prompt = f"""{HARVARD_GUIDELINES_SYSTEM}

Generate a professional cover letter following the guidelines above.

JOB DETAILS:
- Company: {company}
- Position: {title}
- Job Description: {job_description[:1500]}

RESUME HIGHLIGHTS:
{resume_text[:1000]}

KEY SKILLS FROM RESUME:
{', '.join(resume_skills)}

Generate ONLY the 4 paragraphs (Opening, Mission Connection, Experience, Closing).
Do NOT include date, address, salutation, or signature - just the body paragraphs.
Keep total output to 400-500 words."""

        # Generate with ADK
        generated_text = await self._get_llm_response(user_prompt)
        
        # Split into paragraphs
        paragraphs = [p.strip() for p in generated_text.split('\n\n') if p.strip()]
        
        # Load or create template
        template_path = Path("assets/cover_letter.tex")
        
        if not template_path.exists():
            # Create default template if missing (Docker environment)
            logger.warning(f"Template not found at {template_path}, creating default template")
            template_path.parent.mkdir(parents=True, exist_ok=True)
            
            default_template = r"""\documentclass[11pt,a4paper]{article}
\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
\usepackage{helvet}
\renewcommand{\familydefault}{\sfdefault}
\usepackage{geometry}
\usepackage{hyperref}

\geometry{top=1in, bottom=1in, left=1in, right=1in}
\pagestyle{empty}

\begin{document}

\begin{flushleft}
{\Large\textbf{{{APPLICANT_NAME}}}} \\[0.5em]
{{APPLICANT_EMAIL}} $\mid$ {{APPLICANT_PHONE}} \\
{{APPLICANT_LOCATION}}
\end{flushleft}

\vspace{1em}
{{DATE}}

\vspace{1em}
{{COMPANY_NAME}}

\vspace{1em}
Dear {{SALUTATION}},

\vspace{1em}
{{OPENING_PARAGRAPH}}

\vspace{1em}
{{BODY_PARAGRAPH_1}}

\vspace{1em}
{{BODY_PARAGRAPH_2}}

\vspace{1em}
{{CLOSING_PARAGRAPH}}

\vspace{1em}
Sincerely,

\vspace{2em}
{{APPLICANT_NAME}}

\end{document}
"""
            with open(template_path, 'w') as f:
                f.write(default_template)
        
        with open(template_path, 'r') as f:
            template = f.read()
        
        # Prepare replacements
        today = datetime.now().strftime("%B %d, %Y")
        replacements = {
            '{{APPLICANT_NAME}}': resume_info.get('name', 'Your Name'),
            '{{APPLICANT_EMAIL}}': resume_info.get('email', 'your.email@example.com'),
            '{{APPLICANT_PHONE}}': resume_info.get('phone', '(555) 123-4567'),
            '{{APPLICANT_LOCATION}}': resume_info.get('location', 'City, State'),
            '{{APPLICANT_LINKEDIN}}': resume_info.get('linkedin', ''),
            '{{APPLICANT_GITHUB}}': resume_info.get('github', ''),
            '{{DATE}}': today,
            '{{HIRING_MANAGER_NAME}}': 'Hiring Manager',
            '{{HIRING_MANAGER_TITLE}}': 'Hiring Manager',
            '{{COMPANY_NAME}}': company,
            '{{COMPANY_ADDRESS}}': '',
            '{{SALUTATION}}': 'Hiring Manager',
            '{{OPENING_PARAGRAPH}}': paragraphs[0] if len(paragraphs) > 0 else '',
            '{{BODY_PARAGRAPH_1}}': paragraphs[1] if len(paragraphs) > 1 else '',
            '{{BODY_PARAGRAPH_2}}': paragraphs[2] if len(paragraphs) > 2 else '',
            '{{CLOSING_PARAGRAPH}}': paragraphs[3] if len(paragraphs) > 3 else '',
        }
        
        # Generate final TeX content
        tex_content = template
        for placeholder, value in replacements.items():
            tex_content = tex_content.replace(placeholder, value)
        
        logger.info(f"Generated cover letter for {company} - {title}")
        
        return {
            "tex_content": tex_content,
            "keywords_matched": resume_skills,
            "resume_info": resume_info
        }

