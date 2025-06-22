import React, { useState, useEffect, useRef } from 'react';
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
  const [code, setCode] = useState('');
  const [isPdfView, setIsPdfView] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);
  const [pdfUrl, setPdfUrl] = useState(() => {
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}v=${Date.now()}`;
  });
  const lastReadyRef = useRef(false);


  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch("/api/pdf-status");
      if (!res.ok) {
        console.error("Error checking status");
        return;
      }
      const { ready } = await res.json();

      if (ready && !lastReadyRef.current) {
        // Transition from false -> true
        const newUrl = (() => {
          const separator = url.includes("?") ? "&" : "?";
          return `${url}${separator}v=${Date.now()}`;
        })();
        setPdfUrl(newUrl);
        setRefreshCount((count) => count + 1);
        toast("Your resume was updated.");
      }

      lastReadyRef.current = ready;

      // If generating, stop it when ready
      if (generating && ready) {
        setGenerating(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [url, generating]);

  // handleGenerate remains the same
  const handleGenerate = async () => {
    if (generating) return;
    setGenerating(true);
    try {
      const response = await fetch("/api/update-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          links,
          feedback,
          joblink: jobLink,
          tex_content: code,
        }),
      });
      if (!response.ok) throw new Error("Failed to generate resume");
      toast("Your resume is being updated. This may take a while ...");
    } catch (err) {
      console.error("Error:", err);
      toast("There was an error. Please delete and regenerate the Resume!");
      setGenerating(false);
    }
  };

  return (
    <div className="app-container">
      <Toaster toastOptions={{ style: { backgroundColor: 'rgba(0, 255, 0, 0.5)' } }} />
      <div className="top-right-container">
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
        
        {isPdfView ? <LatexCodeEditor code={code} setCode={setCode} refreshKey={refreshCount} /> : <MyPdfViewer pdfUrl={url} onReload={() => setRefreshCount((count) => count + 1)}  />}

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
