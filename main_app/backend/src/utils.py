import os
import glob


def clear_pdf():
    files = glob.glob("assets/*")
    for file_path in files:
        try:
            os.remove(file_path)
        except Exception as e:
            print(f"Error deleting {file_path}: {e}")


def clear_link_cache():
    with open("assets/link_cache.txt", "w") as f:
        f.write("")


def initialise_pdf():
    if len(os.listdir("assets")) == 0:
        content = r"""
        \documentclass{article}
        \begin{document}
        \title{Resume}
        \maketitle
        Hello, this is my resume!
        \end{document}
        """
        with open("assets/user_file.tex", "w") as f:
            f.write(content)

        # Compile LaTeX and put all output in assets/
        os.system("pdflatex -output-directory=assets assets/user_file.tex")

        # No need to move or remove files since everything is in assets/
        # Remove aux and log files:
        try:
            os.remove("assets/user_file.aux")
            os.remove("assets/user_file.log")
        except FileNotFoundError:
            pass
