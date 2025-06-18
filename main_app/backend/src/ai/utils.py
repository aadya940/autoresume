"""Optimized utility functions."""

import re
import subprocess
from pathlib import Path


def read_file(path):
    """Optimized file reading with pathlib."""
    return Path(path).read_text(encoding="utf-8").splitlines(keepends=True)


def write_file(path, content):
    """Optimized file writing with pathlib."""
    if isinstance(content, list):
        content = "".join(content)
    Path(path).write_text(content, encoding="utf-8")


def compile_tex(output_dir, file_path):
    """Synchronous wrapper for backward compatibility."""
    try:
        subprocess.run(
            [
                "pdflatex",
                "-interaction=nonstopmode",
                f"-output-directory={output_dir}",
                file_path,
            ],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
    except subprocess.CalledProcessError as e:
        print(f"Error compiling {file_path}: {e}")
        raise


# Compiled regex for better performance
LATEX_BLOCK_PATTERN = re.compile(r"^```(?:\w+)?\s*|```$", re.MULTILINE)


def clean_latex_block(text: str) -> str:
    """Optimized LaTeX block cleaning with compiled regex."""
    return LATEX_BLOCK_PATTERN.sub("", text.strip()).strip()
