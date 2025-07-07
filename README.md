
<div align="right">
  <details>
    <summary >🌐 Language</summary>
    <div>
      <div align="right">
        <p><a href="https://openaitx.github.io/view.html?user=aadya940&project=autoresume&lang=en">English</a></p>
        <p><a href="https://openaitx.github.io/view.html?user=aadya940&project=autoresume&lang=zh-CN">简体中文</a></p>
        <p><a href="https://openaitx.github.io/view.html?user=aadya940&project=autoresume&lang=zh-TW">繁體中文</a></p>
        <p><a href="https://openaitx.github.io/view.html?user=aadya940&project=autoresume&lang=ja">日本語</a></p>
        <p><a href="https://openaitx.github.io/view.html?user=aadya940&project=autoresume&lang=ko">한국어</a></p>
        <p><a href="https://openaitx.github.io/view.html?user=aadya940&project=autoresume&lang=hi">हिन्दी</a></p>
        <p><a href="https://openaitx.github.io/view.html?user=aadya940&project=autoresume&lang=th">ไทย</a></p>
        <p><a href="https://openaitx.github.io/view.html?user=aadya940&project=autoresume&lang=fr">Français</a></p>
        <p><a href="https://openaitx.github.io/view.html?user=aadya940&project=autoresume&lang=de">Deutsch</a></p>
        <p><a href="https://openaitx.github.io/view.html?user=aadya940&project=autoresume&lang=es">Español</a></p>
        <p><a href="https://openaitx.github.io/view.html?user=aadya940&project=autoresume&lang=it">Itapano</a></p>
        <p><a href="https://openaitx.github.io/view.html?user=aadya940&project=autoresume&lang=ru">Русский</a></p>
        <p><a href="https://openaitx.github.io/view.html?user=aadya940&project=autoresume&lang=pt">Português</a></p>
        <p><a href="https://openaitx.github.io/view.html?user=aadya940&project=autoresume&lang=nl">Nederlands</a></p>
        <p><a href="https://openaitx.github.io/view.html?user=aadya940&project=autoresume&lang=pl">Polski</a></p>
        <p><a href="https://openaitx.github.io/view.html?user=aadya940&project=autoresume&lang=ar">العربية</a></p>
        <p><a href="https://openaitx.github.io/view.html?user=aadya940&project=autoresume&lang=fa">فارسی</a></p>
        <p><a href="https://openaitx.github.io/view.html?user=aadya940&project=autoresume&lang=tr">Türkçe</a></p>
        <p><a href="https://openaitx.github.io/view.html?user=aadya940&project=autoresume&lang=vi">Tiếng Việt</a></p>
        <p><a href="https://openaitx.github.io/view.html?user=aadya940&project=autoresume&lang=id">Bahasa Indonesia</a></p>
      </div>
    </div>
  </details>
</div>

<p align="center">
  <img src="main_app/frontend/public/autoresume-logo.png" alt="autoResume Logo" title="autoResume Logo" width="180"/>
</p>

<h1 align="center">autoResume</h1>

<p align="center">
  <b>Open‑source resume builder, paste your links, edit manually, and let AI lend a hand with polishing, updating, and tailoring your resume.</b>
</p>

---

### How to use this?

[Medium Blog Link](https://medium.com/@aadyachinubhai/autoresume-copy-and-paste-links-its-that-simple-8e50e6d155a1)

The Blog is outdated with respect to the User Interface and Template used.

## Features

- <b>Easy Link Import:</b> Paste links from websites, and quickly build a PDF resume.
- <b>Manual Editor Included:</b> Fine‑tune or build your resume from scratch with an embedded code editor.
- <b>Smart Suggestions:</b>  Share feedback or new links, and smartedits will help refine and update your resume.
- <b>Tailored for Jobs:</b> Paste a job description, and get recommendations for aligning your resume.
- <b>LaTeX Quality:</b> All resumes are generated using LaTeX for a clean, professional layout.
- <b>Instant Preview:</b> See your resume as a PDF in real time.
- <b>Easy Reset:</b> Clear and restart your resume in a click.
- <b>Local:</b> Runs fully on your machine using Docker.

---

## Getting Started

### Prerequisites
- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/)

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/aadya940/autoresume.git
   cd autoresume
   ```
2. Build and start the app:
   ```bash
   docker compose up --build
   ```
3. Access the apps:
   
   [_http://localhost:5173_](http://localhost:5173)
---

## Usage

1. Open autoResume in your browser.
2. Click on the :gear: icon, paste in your [GOOGLE API KEY](https://aistudio.google.com/) and your Email. 
3. Paste links to your professional information (e.g., Github, Personal Website, etc.).
4. Optionally, add feedback or a job posting link for further customization.
5. Click <b>Generate Resume</b> and let the AI do the rest!

---

## License

This project is licensed under the Apache 2.0 License.

## Contributing Guide

### Frontend
- Implement React components in the `frontend/src/components/` folder
- We use Chakra UI to implement components.
- Import and use your components in `frontend/src/App.jsx`

### Backend
- Implement API routes in the `backend/src/routes/` directory
- Add AI functionality in the `backend/src/ai/` directory
- We use the `black` code formatter for Python code
- Keep route handlers clean and logic separate

### General Guidelines
- Create a new branch for your feature/fix: `git checkout -b your-branch-name`
- Write clear commit messages
- Test your changes before submitting a PR

### Submitting Changes
1. Create a Pull Request
2. In your PR description, include:
   - What changes you made
   - Why you made them
   - Any relevant screenshots or test results
   - Any breaking changes or migration steps needed

We appreciate your contributions and will review your PR as soon as possible!
