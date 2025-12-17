"""Simple task queue using Taskiq with in-memory broker - zero external setup needed."""

from taskiq import InMemoryBroker
import concurrent
import asyncio
import logging
from pathlib import Path
import threading
import time
import aiofiles
from dotenv import load_dotenv

from ai.prompts import (
    build_generic_prompt,
    build_editing_prompt,
    build_editing_prompt,
    build_job_optimize_prompt,
)
from ai.jobs import JobMatcher, JobMatcherError, ResumeParseError
from ai import append_and_compile
from ai.utils import read_file, compile_tex
from utils import initialise_pdf, clear_pdf, clear_link_cache, _extract_relevant_info

logger = logging.getLogger(__name__)

# Create assets directory if it doesn't exist
Path("assets").mkdir(exist_ok=True)

broker = InMemoryBroker()

load_dotenv()


@broker.task
def update_resume_with_links_task(links):
    """Update resume with extracted information from links."""
    try:
        logger.info(f"Processing links: {links}")

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop=loop)

        with concurrent.futures.ProcessPoolExecutor() as pool:
            relevant_info = loop.run_until_complete(
                loop.run_in_executor(pool, _extract_relevant_info, links)
            )

        loop.close()

        # Build prompt
        curr_code = read_file("assets/user_file.tex")
        curr_prompt = build_generic_prompt(relevant_info, curr_code)

        # Update resume
        asyncio.run(
            append_and_compile(
                relevant_info, "assets/user_file.tex", "assets", prompt=curr_prompt
            )
        )

        # Cache links
        asyncio.run(_cache_links(links))

        logger.info("Resume update with links completed successfully")
        return {"status": "completed", "message": "Resume updated with links"}

    except Exception as e:
        logger.error(f"Error in update_resume_with_links_task: {str(e)}")
        raise


@broker.task
def update_resume_with_feedback_task(feedback):
    """Update resume with user feedback."""
    try:
        logger.info(f"Processing feedback: {feedback}")

        # Build editing prompt
        curr_code = read_file("assets/user_file.tex")
        curr_prompt = build_editing_prompt(feedback, curr_code)

        # Update resume
        relevant_info = {}  # No crawled info for feedback updates
        asyncio.run(
            append_and_compile(
                relevant_info, "assets/user_file.tex", "assets", prompt=curr_prompt
            )
        )

        logger.info("Resume update with feedback completed successfully")
        return {"status": "completed", "message": "Resume updated with feedback"}

    except Exception as e:
        logger.error(f"Error in update_resume_with_feedback_task: {str(e)}")
        raise


@broker.task
def optimize_resume_for_job_task(job_link):
    """Optimize resume for specific job posting."""
    try:
        logger.info(f"Processing job link: {job_link}")

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop=loop)

        with concurrent.futures.ProcessPoolExecutor() as pool:
            mode = "job_desc"
            job_description = loop.run_until_complete(
                loop.run_in_executor(pool, _extract_relevant_info, job_link, mode)
            )

        loop.close()

        # Build optimization prompt
        curr_code = read_file("assets/user_file.tex")
        curr_prompt = build_job_optimize_prompt(job_description, curr_code)

        # Update resume
        asyncio.run(
            append_and_compile(
                job_description, "assets/user_file.tex", "assets", prompt=curr_prompt
            )
        )

        logger.info("Resume optimization for job completed successfully")
        return {"status": "completed", "message": "Resume optimized for job"}

    except Exception as e:
        logger.error(f"Error in optimize_resume_for_job_task: {str(e)}")
        raise


@broker.task
def update_resume_with_tex(tex_content):
    """Update resume with manually edited LaTeX content."""
    try:
        logger.info("Updating resume with manual LaTeX edits")

        # Write the new LaTeX content to the file
        with open("assets/user_file.tex", "w", encoding="utf-8") as f:
            f.write(tex_content)

        # Compile the LaTeX to PDF
        compile_tex("assets", "assets/user_file.tex")

        logger.info("Resume updated with manual LaTeX edits")
        return {
            "status": "completed",
            "message": "Resume updated with manual LaTeX edits",
        }

    except Exception as e:
        logger.error(f"Error in update_resume_with_tex: {str(e)}")
        raise


async def _cache_links(links):
    """Helper function to cache processed links."""
    async with aiofiles.open("assets/link_cache.txt", mode="a") as f:
        for link in links:
            await f.write(link + "\n")


@broker.task
def generate_cover_letter_task(job_description: str, company: str, title: str):
    """Task to generate a job-specific cover letter."""
    
    async def _generate_async():
        """Async implementation with concurrent operations."""
        logger.info(f"Generating cover letter for {company} - {title}")
        
        try:
            # Import here to avoid circular imports
            from ai.cover_letter import CoverLetterGenerator
            
            # Concurrent: Create generator and validate paths
            generator = CoverLetterGenerator()
            
            # Generate cover letter (already async)
            result = await generator.generate(
                job_description=job_description,
                company=company,
                title=title
            )
            
            # Write and compile using asyncio.to_thread for I/O
            tex_path = "assets/generated_cover_letter.tex"
            
            await asyncio.to_thread(
                lambda: open(tex_path, "w", encoding="utf-8").write(result["tex_content"])
            )
            
            await asyncio.to_thread(compile_tex, "assets", tex_path)
            
            logger.info(f"Cover letter generated and compiled successfully for {company}")
            
            return {
                "status": "completed",
                "message": f"Cover letter generated for {company}",
                "keywords_matched": result["keywords_matched"]
            }
            
        except Exception as e:
            logger.error(f"Error in cover letter generation: {str(e)}", exc_info=True)
            raise
    
    # Run in new event loop (same as other tasks)
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            return loop.run_until_complete(_generate_async())
        finally:
            loop.close()
    except Exception as e:
        logger.error(f"Error in generate_cover_letter_task: {str(e)}", exc_info=True)
        raise


@broker.task
def clear_resume_task():
    """Task to reset the PDF and link cache."""
    try:
        logger.info("PDF status set to False")
        time.sleep(1)
        clear_pdf()
        initialise_pdf()
        clear_link_cache()
        logger.info("Cleared and re-initialized resume.")
    except Exception as e:
        logger.error(f"[Clear Resume Error] {e}", exc_info=True)
    finally:
        logger.info("PDF status set to True")


@broker.task
def job_search_task(resume_path: str, location: str, job_title: str, max_results: int, sites: list):
    """
    Async task for job search.
    """
    try:
        logger.info(
            f"Starting async job search: title={job_title}, location={location}, "
            f"max_results={max_results}"
        )

        matcher = JobMatcher(Path(resume_path))
        result = matcher.search(
            location=location,
            job_title=job_title,
            max_results=max_results,
            sites=sites,
        )

        logger.info(
            f"Job search task completed: success={result.success}, "
            f"total_jobs={result.total_jobs}"
        )

        return result.dict()

    except Exception as e:
        logger.error(f"Error in job_search_task: {str(e)}", exc_info=True)
        # Return error structure so frontend can handle it
        return {
            "success": False,
            "jobs": [],
            "total_jobs": 0,
            "error": str(e)
        }



def run_worker():
    """Run taskiq worker in background thread."""
    logger.info("Starting taskiq worker thread...")
    asyncio.run(broker.startup())
    logger.info("Taskiq worker started successfully")


# Auto-start worker when module is imported
logger.info("Initializing task queue worker...")
worker_thread = threading.Thread(target=run_worker, daemon=True)
worker_thread.start()
time.sleep(1)
logger.info("Task queue worker thread started")
