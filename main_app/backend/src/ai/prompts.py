"""Prompts for various tasks."""


def build_generic_prompt(info, curr_code):
    """Prompt not tied to any particular link."""

    """Resume tips taken from: https://careerservices.fas.harvard.edu/resources/create-a-strong-resume/#tips"""

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

    Resume language should be:
    - Specific rather than general
    - Active rather than passive
    - Written to express not impress
    - Articulate rather than “flowery”
    - Fact-based (quantify and qualify)
    - Written for people who scan quickly

    Resume writing DOs:
    - Be consistent in format and content
    - Make it easy to read and follow, balancing white space
    - Use consistent spacing, underlining, italics, bold, and capitalization for emphasis
    - List headings (such as Experience) in order of importance
    - Within headings, list information in reverse chronological order (most recent first)
    - Avoid information gaps such as a missing summer

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

    Resume language should be:
    - Specific rather than general
    - Active rather than passive
    - Written to express not impress
    - Articulate rather than “flowery”
    - Fact-based (quantify and qualify)
    - Written for people who scan quickly

    Resume writing DOs:
    - Be consistent in format and content
    - Make it easy to read and follow, balancing white space
    - Use consistent spacing, underlining, italics, bold, and capitalization for emphasis
    - List headings (such as Experience) in order of importance
    - Within headings, list information in reverse chronological order (most recent first)
    - Avoid information gaps such as a missing summer


    ### Additional Information:
    {info}


    ### Current LaTeX Resume Code:
    {curr_code}
    """
    return prompt


def build_job_optimize_prompt(job_description, curr_code):
    """Tips taken from:
    https://www.careereducation.columbia.edu/resources/optimizing-your-resume-applicant-tracking-systems
    """
    prompt = f"""
    You are an AI assistant specialized in generating LaTeX resume code.

    Task:
    Make changes to the LaTeX resume provided below to optimize the given resume
    for the given job description. Optimize such that the resume passes the
    Applicant Tracking System.

    Instructions:
    - You are optimizing the resume for the job applicant based on their existing experience 
        only given in the current resume.
    - Maintain the document structure and formatting consistency.
    - Avoid duplication; enrich or update existing entries if appropriate.
    - Exclude irrelevant, redundant, or informal content.
    - Do not write any false or non-valid or hypothetical content.
    - Ensure the output is valid, standalone, and compilable LaTeX code.
    - Avoid premature pagebreaks and use a latex page efficiently and in a clean way.
    - Return only the updated LaTeX code — no explanations or extra text.

    Some tips:
    - Use common names for your section headers (Education, Work Experience, Leadership, Skills).
    - Use keywords and exact phrases from the job description throughout your resume and online application. 
    Keywords are graded both by how often they appear and the extent to which they get used in context. 
    - Do not include any false information. Your sample space is what is given in the Current LaTeX Resume.
    - A summary statement utilizing keywords can be helpful.
    - Include dates wherever possible.


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
- job title
- job description
"""
