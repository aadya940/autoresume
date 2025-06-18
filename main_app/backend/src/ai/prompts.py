"""Prompts for various tasks."""


def build_generic_prompt(info, curr_code):
    """Prompt not tied to any particular link."""

    prompt = f"""
    You are an AI assistant specialized in generating LaTeX resumes.

    Task:
    Update the LaTeX resume provided below by incorporating relevant and valuable details from the additional information.

    Instructions:
    - Extract important content such as work experience, education, skills, certifications, interests,
    awards, hobbies and projects.
    - Integrate new information into existing sections wherever applicable.
    - Maintain the document structure and formatting consistency.
    - Avoid duplication; enrich or update existing entries if appropriate.
    - Exclude irrelevant, redundant, or informal content.
    - Ensure the output is valid, standalone, and compilable LaTeX code.
    - Avoid premature pagebreaks and use a latex page efficiently and in a clean way.
    - Return only the updated LaTeX code — no explanations or extra text.

    ### Additional Information:
    {info}

    ### Current LaTeX Resume:
    {curr_code}
    """
    return prompt


def build_editing_prompt(info, curr_code):
    """Prompt for simple direct editing of the latex file."""
    prompt = f"""
    You are an AI assistant specialized in generating LaTeX resumes.

    Task:
    Make changes to the LaTeX resume provided below as per the feedback given below.

    Instructions:
    - Maintain the document structure and formatting consistency.
    - Avoid duplication; enrich or update existing entries if appropriate.
    - Exclude irrelevant, redundant, or informal content.
    - Ensure the output is valid, standalone, and compilable LaTeX code.
    - Avoid premature pagebreaks and use a latex page efficiently and in a clean way.
    - Return only the updated LaTeX code — no explanations or extra text.

    ### Additional Information:
    {info}

    ### Current LaTeX Resume:
    {curr_code}
    """
    return prompt


def build_job_optimize_prompt(job_description, curr_code):
    prompt = f"""
    You are an AI assistant specialized in generating LaTeX resumes.

    Task:
    Make changes to the LaTeX resume provided below to optimize the given resume
    for the given job description. Optimize such that the resume passes the
    Applicant Tracking System.

    Instructions:
    - Maintain the document structure and formatting consistency.
    - Avoid duplication; enrich or update existing entries if appropriate.
    - Exclude irrelevant, redundant, or informal content.
    - Do not write any false or non-valid or hypothetical content.
    - Ensure the output is valid, standalone, and compilable LaTeX code.
    - Avoid premature pagebreaks and use a latex page efficiently and in a clean way.
    - Return only the updated LaTeX code — no explanations or extra text.

    ### Job Description:
    {job_description}

    ### Current LaTeX Resume:
    {curr_code}
    """
    return prompt


SCRAPER_LLM_INSTRUCTION_GENERIC = """
Extract all professional information, skills, experience, and achievements suitable for a resume or CV.
Also include intellectual hobbies (e.g., open source contributions, personal projects, research, reading, writing).
Extract all relevant links (e.g., GitHub, portfolio, publications, LinkedIn, personal website).
Ignore irrelevant links, discussions, ads, navigation, and boilerplate.
Organize results into the following categories:
- Work Experience (company, role, dates, responsibilities)
- Skills (technical and soft skills, tools, languages)
- Education (institution, degree, dates)
- Achievements (awards, publications, notable projects)
- Certifications (name, issuer, date if available)
- Intellectual Hobbies (open source, research, writing, etc.)
- Relevant Links (GitHub, portfolio, publications, etc.)
"""

SCRAPER_LLM_INSTRUCTION_JOB = """
Extract all relevant job details: 
- required skills 
- experience 
- tools and/or tech stack
- portfolio needs
- ideal candidate traits
"""
