basic_template = r"""
\documentclass[11pt,a4paper]{article}
\usepackage[utf8]{inputenc}
\usepackage{geometry}
\usepackage{titlesec}
\usepackage{enumitem}
\usepackage{hyperref}

% Page setup
\geometry{margin=1in}
\pagestyle{empty}

% Clean hyperlinks
\hypersetup{
    colorlinks=false,
    pdfborder={0 0 0}
}

% Minimal section formatting
\titleformat{\section}
{\large\bfseries}
{}
{0em}
{}[\vspace{2pt}\hrule\vspace{8pt}]

% Remove default list spacing
\setlist{nosep}

% Custom spacing
\setlength{\parindent}{0pt}
\setlength{\parskip}{6pt}

\begin{document}

% Header
\begin{center}
    {\LARGE\textbf{Your Name}}
    
    your.email@example.com $\cdot$ (555) 123-4567 $\cdot$ City, State
    
    linkedin.com/in/yourprofile $\cdot$ github.com/yourusername
\end{center}

\vspace{12pt}

\section{Experience}

\textbf{Job Title} \hfill Month Year -- Present

\textit{Company Name, City, State}

\begin{itemize}[leftmargin=20pt]
    \item Led team of 5 to deliver project 15\% under budget
    \item Improved process efficiency by 25\%, saving 2 hours daily
    \item Managed \$X budget across multiple projects
\end{itemize}

\textbf{Previous Job Title} \hfill Month Year -- Month Year

\textit{Previous Company, City, State}

\begin{itemize}[leftmargin=20pt]
    \item Developed applications serving 10,000+ daily users
    \item Optimized database performance by 40\%
    \item Mentored 3 junior developers
\end{itemize}

\section{Education}

\textbf{Degree Name} \hfill Month Year

\textit{University Name, City, State}

\section{Skills}

\textbf{Technical:} Programming Languages, Frameworks, Tools

\textbf{Languages:} English (Native), Spanish (Conversational)

\section{Projects}

\textbf{Project Name} \hfill Month Year

Brief description of the project and your role. Technologies used and key outcomes.

\end{document}
"""
