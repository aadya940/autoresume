import React from 'react';
import Collapsible from 'react-collapsible';
import './styles/FeedbackManager.css';

function FeedbackManager({ feedback, setFeedback, jobLink, setJobLink }) {
  const trigger = (
    <div className="clipboard-header">
      <h3 className="title">Smart Edits & Rewrites</h3>
      <span className="arrow">▼</span>
    </div>
  );

  return (
    <div className="feedback-manager">
      <Collapsible trigger={trigger} transitionTime={200}>
        <div className="feedback-input-row">
          <textarea
            placeholder="Enter feedback for editing..."
            value={feedback || ''}
            onChange={(e) => setFeedback(e.target.value)}
            rows={4}
          />
          <button 
            onClick={() => setFeedback('')} 
            disabled={!feedback || !feedback.trim()}
          >
            Clear
          </button>
        </div>

        <div className="feedback-input-row">
          <input
            type="text"
            placeholder="Paste job link here..."
            value={jobLink || ''}
            onChange={(e) => setJobLink(e.target.value)}
          />
          <button
            onClick={() => setJobLink('')}
            disabled={!jobLink || !jobLink.trim()}
          >
            Clear
          </button>
        </div>
      </Collapsible>
    </div>
  );
}

export default FeedbackManager;
