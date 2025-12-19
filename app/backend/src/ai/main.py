"""Optimized LaTeX agent with performance improvements."""

import os
import asyncio
from functools import lru_cache

from .prompts import *
from .utils import read_file, write_file, compile_tex, clean_latex_block

from google.adk.agents import LlmAgent
from google.adk.sessions import InMemorySessionService
from google.adk.runners import Runner
from google.genai import types

from google.adk.planners.built_in_planner import BuiltInPlanner

APP_NAME = "latex_agent_app"
USER_ID = "user_001"
SESSION_ID = "session_001"

# Global runner instance to avoid repeated setup
_runner_instance = None
_runner_lock = asyncio.Lock()


class LatexCoderAgent(LlmAgent):
    def __init__(self):
        self._model_args = types.ThinkingConfig(
            thinking_budget=-1
        )  # Enable dynamic thinking.

        self._planner = BuiltInPlanner(thinking_config=self._model_args)

        super().__init__(
            name="latex_coder_agent",
            description="Updates the LaTeX code for a resume with additional information",
            model="gemini-3-flash-preview",
            planner=self._planner,
        )


async def get_runner():
    """Get or create a singleton runner instance."""
    global _runner_instance

    if _runner_instance is None:
        async with _runner_lock:
            if _runner_instance is None:  # Double-check pattern
                session_service = InMemorySessionService()
                await session_service.create_session(
                    app_name=APP_NAME, user_id=USER_ID, session_id=SESSION_ID
                )
                coder_agent = LatexCoderAgent()
                _runner_instance = Runner(
                    agent=coder_agent,
                    session_service=session_service,
                    app_name=APP_NAME,
                )

    return _runner_instance


async def get_llm_response(prompt: str, runner: Runner) -> str:
    """Get LLM response with improved error handling."""
    user_message = types.Content(role="user", parts=[types.Part(text=prompt)])

    try:
        async for event in runner.run_async(
            user_id=USER_ID, session_id=SESSION_ID, new_message=user_message
        ):
            if event.is_final_response() and event.content and event.content.parts:
                return event.content.parts[0].text
    except Exception as e:
        print(f"Error getting LLM response: {e}")
        raise

    return ""


@lru_cache(maxsize=1)
def validate_assets_directory():
    """Cached validation of assets directory."""
    if "assets" not in os.listdir(os.getcwd()):
        raise FileNotFoundError("The 'assets' directory is missing.")


async def append_and_compile(info, file_path, output_dir, prompt=None):
    """Append new content to the LaTeX file and compile it. Handles status updates internally."""

    # Start validation early (cached after first call)
    validate_assets_directory()

    # Concurrent file read and runner init
    current_code_task = asyncio.create_task(asyncio.to_thread(read_file, file_path))
    runner_task = asyncio.create_task(get_runner())
    current_code, runner = await asyncio.gather(current_code_task, runner_task)

    # Prompt construction
    if prompt is None:
        prompt = build_generic_prompt(info, current_code)

    # Get LLM response
    llm_response = await get_llm_response(prompt, runner)
    cleaned_response = clean_latex_block(llm_response)

    # Write and compile
    await asyncio.to_thread(write_file, file_path, cleaned_response)
    await asyncio.to_thread(compile_tex, output_dir, file_path)
