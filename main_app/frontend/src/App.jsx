import React, { useState, useEffect } from 'react';
import { MyPdfViewer } from './components/pdfview';
import Button from './components/button';
import LinkManager from './components/LinkManager';
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

  // Poll pdf-status when generating for Button Color.
  useEffect(() => {
    if (!generating) return;
  
    const timeout = setTimeout(() => {
      const interval = setInterval(async () => {
        const res = await fetch("http://localhost:8000/pdf-status");
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
    if (generating) return;  // Prevent double clicks

    setGenerating(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/update-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          'links': links,
          'feedback': feedback,
          'joblink': jobLink,
         }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate resume');
      }

      toast('Your resume is being updated. This may take a while ...');

      // Don't setGenerating(false) here!
      // Wait for polling to detect ready
    } catch (err) {
      console.error('Error:', err);
      toast('There was an error. Please delete and regenerate the Resume!');
      setGenerating(false); // Only set to false on error
    }
  };

  return (
    <div className="app-container">
      <Toaster toastOptions={{ style: { backgroundColor: 'rgba(0, 255, 0, 0.5)' } }} />
      <div className="top-right-container">
        <SettingsPopup apiUrl="http://127.0.0.1:8000/save-settings" />
      </div>
      <div className="header">
        <div className="logo-title">
          <img src="/autoresume-logo.png" alt="Logo" className="logo" />
          <h1>autoResume</h1>
        </div>
        <p>Copy pasting public links is all it takes to get a resume. Let AI handle the rest.</p>
      </div>

      <div className="content">
        <MyPdfViewer pdfUrl={url} />
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
