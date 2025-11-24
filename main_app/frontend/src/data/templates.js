export const templates = [
    {
        id: "Basic",
        name: "Basic",
        description: "A clean, simple template suitable for any profession.",
        tex_content: String.raw`\documentclass[11pt,a4paper]{article}
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

% Section formatting
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

\textit{Brief description of the project and your role. Technologies used and key outcomes.}

\end{document}
`
    },
    {
        id: "Modern",
        name: "Modern",
        description: "A stylish template with blue accents and modern fonts.",
        tex_content: String.raw`\documentclass[11pt,a4paper]{article}
\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
\usepackage{helvet} % Helvetica font
\renewcommand{\familydefault}{\sfdefault}
\usepackage{geometry}
\usepackage{titlesec}
\usepackage{enumitem}
\usepackage{hyperref}
\usepackage{xcolor}

% Colors
\definecolor{primary}{RGB}{0, 102, 204} % Brighter blue
\definecolor{text}{RGB}{30, 30, 30}

% Page setup
\geometry{margin=0.75in}
\pagestyle{empty}
\color{text}

% Hyperlinks
\hypersetup{
    colorlinks=true,
    linkcolor=primary,
    filecolor=primary,
    urlcolor=primary,
}

% Section formatting
\titleformat{\section}
{\Large\bfseries\color{primary}}
{}
{0em}
{}[\vspace{2pt}\color{primary}\hrule\vspace{8pt}]

% List spacing
\setlist{nosep}

% Spacing
\setlength{\parindent}{0pt}
\setlength{\parskip}{8pt}

\begin{document}

% Header - Left Aligned for Modern Look
\begin{flushleft}
    {\Huge\textbf{\color{primary}Your Name}} \\ \vspace{6pt}
    \href{mailto:your.email@example.com}{your.email@example.com} $\cdot$ (555) 123-4567 $\cdot$ City, State \\
    \href{https://linkedin.com/in/yourprofile}{linkedin.com/in/yourprofile} $\cdot$ \href{https://github.com/yourusername}{github.com/yourusername}
\end{flushleft}

\vspace{16pt}

\section{Experience}

\textbf{\large Job Title} \hfill \textbf{Month Year -- Present} \\
\textit{\color{primary}Company Name} $\cdot$ City, State

\begin{itemize}[leftmargin=15pt, label={\color{primary}\small\textbullet}]
    \item Spearheaded the development of a new feature that increased user engagement by 20\%.
    \item Collaborated with cross-functional teams to define requirements and deliver high-quality software.
    \item Refactored legacy code, improving maintainability and reducing technical debt.
\end{itemize}

\vspace{8pt}

\textbf{\large Previous Job Title} \hfill \textbf{Month Year -- Month Year} \\
\textit{\color{primary}Previous Company} $\cdot$ City, State

\begin{itemize}[leftmargin=15pt, label={\color{primary}\small\textbullet}]
    \item Designed and implemented scalable backend services using Python and Django.
    \item Optimized SQL queries, reducing page load times by 30\%.
    \item Conducted code reviews and provided mentorship to junior engineers.
\end{itemize}

\section{Education}

\textbf{\large Degree Name} \hfill \textbf{Month Year} \\
\textit{University Name} $\cdot$ City, State

\section{Skills}

\textbf{Languages:} Python, JavaScript, SQL, C++ \\
\textbf{Frameworks:} React, Django, FastAPI, Flask \\
\textbf{Tools:} Git, Docker, AWS, Linux

\section{Projects}

\textbf{\large Project Name} \hfill \textbf{Month Year} \\
\textit{A brief description of the project. Highlight the problem solved and the technologies used.}

\end{document}
`
    },
    {
        id: "Classic",
        name: "Classic",
        description: "A traditional, professional layout using serif fonts.",
        tex_content: String.raw`\documentclass[11pt,a4paper]{article}
\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
\usepackage{mathptmx} % Times New Roman-like font
\usepackage{geometry}
\usepackage{titlesec}
\usepackage{enumitem}
\usepackage{hyperref}

% Page setup
\geometry{margin=1in}
\pagestyle{empty}

% Hyperlinks
\hypersetup{
    colorlinks=false,
    pdfborder={0 0 0}
}

% Section formatting
\titleformat{\section}
{\center\large\bfseries\uppercase}
{}
{0em}
{}[\vspace{2pt}\hrule\vspace{8pt}]

% List spacing
\setlist{nosep}

% Spacing
\setlength{\parindent}{0pt}
\setlength{\parskip}{6pt}

\begin{document}

% Header
\begin{center}
    {\Huge\textbf{\textsc{Your Name}}} \\ \vspace{6pt}
    your.email@example.com $\cdot$ (555) 123-4567 $\cdot$ City, State \\
    linkedin.com/in/yourprofile $\cdot$ github.com/yourusername
\end{center}

\vspace{12pt}

\section{Professional Experience}

\textbf{Company Name} \hfill City, State \\
\textit{Job Title} \hfill Month Year -- Present

\begin{itemize}[leftmargin=20pt]
    \item Orchestrated the deployment of cloud infrastructure, ensuring 99.9\% uptime.
    \item Analyzed user data to identify trends and drive product decisions.
    \item Managed a budget of \$50,000 for external vendor contracts.
\end{itemize}

\vspace{8pt}

\textbf{Previous Company} \hfill City, State \\
\textit{Previous Job Title} \hfill Month Year -- Month Year

\begin{itemize}[leftmargin=20pt]
    \item Developed and maintained critical business applications using Java.
    \item Resolved high-priority production incidents within SLA timelines.
    \item Authored technical documentation for internal and external stakeholders.
\end{itemize}

\section{Education}

\textbf{University Name} \hfill City, State \\
\textit{Degree Name} \hfill Month Year

\section{Technical Skills}

\textbf{Programming:} Python, Java, C\#, Ruby \\
\textbf{Web Technologies:} HTML5, CSS3, JavaScript, React \\
\textbf{Databases:} PostgreSQL, MongoDB, Redis

\section{Key Projects}

\textbf{Project Name} \\
Developed a machine learning model to predict customer churn with 85\% accuracy. Used Python, Scikit-learn, and Pandas.

\end{document}
`
    },
    {
        id: "Minimalist",
        name: "Minimalist",
        description: "A clean, high-contrast design with distinct sections.",
        tex_content: String.raw`\documentclass[11pt,a4paper]{article}
\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
\usepackage{geometry}
\usepackage{titlesec}
\usepackage{enumitem}
\usepackage{hyperref}
\usepackage{xcolor}

% Page setup
\geometry{margin=1in}
\pagestyle{empty}

% Colors
\definecolor{darkgray}{gray}{0.2}

% Hyperlinks
\hypersetup{
    colorlinks=true,
    linkcolor=darkgray,
    urlcolor=darkgray,
}

% Section formatting - Simple and Clean
\titleformat{\section}
{\large\bfseries\sffamily\color{darkgray}}
{}
{0em}
{}
\titlespacing{\section}{0pt}{12pt}{6pt}

% List spacing
\setlist{nosep}

% Spacing
\setlength{\parindent}{0pt}
\setlength{\parskip}{6pt}

\begin{document}

% Header - Simple Block
{\huge\textbf{\sffamily Your Name}}

\vspace{4pt}
{\color{darkgray}
your.email@example.com $\cdot$ (555) 123-4567 \\
\href{https://linkedin.com/in/yourprofile}{linkedin.com/in/yourprofile} $\cdot$ City, State
}

\vspace{20pt}

\section{EXPERIENCE}

\textbf{Job Title} \hfill Month Year -- Present \\
\textit{Company Name}

\begin{itemize}[leftmargin=15pt]
    \item Engineered a high-throughput data pipeline processing 1TB+ daily.
    \item Implemented automated testing, increasing code coverage by 40\%.
    \item Collaborated with product managers to define roadmap and milestones.
\end{itemize}

\vspace{12pt}

\textbf{Previous Job Title} \hfill Month Year -- Month Year \\
\textit{Previous Company}

\begin{itemize}[leftmargin=15pt]
    \item Built a responsive web application using React and Redux.
    \item Integrated third-party APIs for payment processing and authentication.
    \item Optimized frontend performance, achieving a Lighthouse score of 95+.
\end{itemize}

\section{EDUCATION}

\textbf{Degree Name} \hfill Month Year \\
\textit{University Name}

\section{SKILLS}

\textbf{Tech:} JavaScript, TypeScript, Node.js, GraphQL, Docker, Kubernetes \\
\textbf{Soft Skills:} Leadership, Communication, Problem Solving, Agile Methodology

\section{PROJECTS}

\textbf{Project Name:} A full-stack e-commerce platform built with MERN stack. Features include user authentication, product search, and shopping cart.

\end{document}
`
    }
];
