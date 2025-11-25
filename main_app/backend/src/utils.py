import os
import glob
import asyncio

from templates_data import templates, basic_template


def clear_pdf():
    files = glob.glob("assets/*")
    for file_path in files:
        # Preserve template preference file and custom template
        if "template_preference.txt" in file_path or "custom_template.tex" in file_path:
            continue
            
        try:
            os.remove(file_path)
        except Exception as e:
            print(f"Error deleting {file_path}: {e}")


def clear_link_cache():
    with open("assets/link_cache.txt", "w") as f:
        f.write("")


# Extract job description in new process to avoid event loop issues
def _extract_relevant_info(link, task=None):
    if task is not None:
        mode = "job_desc"
    else:
        mode = task

    from ai.crawl import InfoExtractor

    _link = [link] if not isinstance(link, list) else link
    extractor = InfoExtractor(mode=mode)
    return asyncio.run(extractor.get_extracted_text(_link))


def initialise_pdf():
    if len(os.listdir("assets")) <= 2: # Allow for template_preference.txt, custom_template.tex
        content = basic_template
        
        # Check for template preference
        try:
            if os.path.exists("assets/template_preference.txt"):
                with open("assets/template_preference.txt", "r") as f:
                    template_id = f.read().strip()
                    
                    if template_id == "custom":
                        if os.path.exists("assets/custom_template.tex"):
                            with open("assets/custom_template.tex", "r") as custom_f:
                                content = custom_f.read()
                    elif template_id in templates:
                        content = templates[template_id]
        except Exception as e:
            print(f"Error reading template preference: {e}")

        with open("assets/user_file.tex", "w") as f:
            f.write(content)

        # Compile LaTeX and put all output in assets/
        os.system("pdflatex -output-directory=assets assets/user_file.tex")

        # No need to move or remove files since everything is in assets/
        # Remove aux and log files:
        try:
            os.remove("assets/user_file.aux")
            os.remove("assets/user_file.log")
        except Exception as e:
            pass


def read_file(file_path):
    with open(file_path, "r") as f:
        return f.read()
