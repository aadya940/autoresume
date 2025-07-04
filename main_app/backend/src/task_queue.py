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
    build_job_optimize_prompt,
)
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


def run_worker():
    """Run taskiq worker in background thread."""
    asyncio.run(broker.startup())


# Auto-start worker when module is imported
worker_thread = threading.Thread(target=run_worker, daemon=True)
worker_thread.start()
time.sleep(1)
