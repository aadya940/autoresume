import React, { useState, useEffect } from 'react';
import { MyPdfViewer } from './components/pdfview';
import Button from './components/button';
import LinkManager from './components/LinkManager';
import LatexCodeEditor from './components/codeEditor';
import SwitchWrapper from './components/toggleSwitch';
import FeedbackManager from './components/feedback';
import ClearResumeButton from './components/clearbutton';
import SettingsPopup from './components/settings';
import toast, { Toaster } from 'react-hot-toast';
import './App.css';

function App({ url }) {
  const [links, setLinks] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [jobLink, setJobLink] = useState('');
  const [code, setCode] = useState("");
  const [isPdfView, setIsPdfView] = useState(false); // <-- Add this

  useEffect(() => {
    if (!generating) return;
  
    const timeout = setTimeout(() => {
      const interval = setInterval(async () => {
        const res = await fetch("/api/pdf-status");
        if (!res.ok) return;
        const { ready } = await res.json();
        if (ready) {
          setGenerating(false);
          clearInterval(interval);
          toast('Your resume was updated.');
        }
      }, 1000);
  
      return () => clearInterval(interval);
    }, 500); // Wait 500ms before polling
  
    return () => clearTimeout(timeout);
  }, [generating]);

  const handleGenerate = async () => {
    if (generating) return;
    setGenerating(true);
    try {
      const response = await fetch('/api/update-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          links: links,
          feedback: feedback,
          joblink: jobLink,
          tex_content: code,
        }),
      });
      if (!response.ok) throw new Error('Failed to generate resume');
      toast('Your resume is being updated. This may take a while ...');
    } catch (err) {
      console.error('Error:', err);
      toast('There was an error. Please delete and regenerate the Resume!');
      setGenerating(false);
    }
  };

  return (
    <div className="app-container">
      <Toaster toastOptions={{ style: { backgroundColor: 'rgba(0, 255, 0, 0.5)' } }} />
      <div className="top-right-container">
        <a
          href="https://medium.com/@aadyachinubhai/autoresume-copy-and-paste-links-its-that-simple-8e50e6d155a1"
          target="_blank"
          rel="noopener noreferrer"
        >
        <Button>How to Use autoResume?</Button>
      </a>
      <SettingsPopup apiUrl="/api/save-settings" />
      </div>

      <div className="header">
        <div className="logo-title">
          <img src="/autoresume-logo.png" alt="Logo" className="logo" />
          <h1>autoResume</h1>
        </div>
        <p>Copy pasting public links is all it takes to get a resume. Let AI handle the rest.</p>
      </div>
      <div className="content">
        <SwitchWrapper
          isOn={isPdfView}
          handleToggle={() => setIsPdfView(!isPdfView)}
          leftLabel="PDF Viewer"
          rightLabel="TeX Editor"
        />
        
        {isPdfView ? <LatexCodeEditor code={code} setCode={setCode} /> : <MyPdfViewer pdfUrl={url} />}

        <div className="right-panel">
          <Button onClick={handleGenerate} disabled={generating}>
            {generating ? 'Generating...' : 'Generate Resume'}
          </Button>
   
          <ClearResumeButton />
          <LinkManager links={links} setLinks={setLinks} />
   
          <FeedbackManager 
            feedback={feedback} 
            setFeedback={setFeedback} 
            jobLink={jobLink}             
            setJobLink={setJobLink}        
          />
   
        </div>
      </div>
    </div>
  );
}

export default App;
