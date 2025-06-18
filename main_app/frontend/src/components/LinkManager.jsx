import React, { useState, useEffect } from 'react';
import Collapsible from 'react-collapsible';
import Button from './button';
import './styles/LinkManager.css';

function LinkManager({ links, setLinks }) {  // ✅ take from parent
  const [input, setInput] = useState('');

  useEffect(() => {
    try {
      const storedLinks = localStorage.getItem('savedLinks');
      if (storedLinks) {
        const parsedLinks = JSON.parse(storedLinks);
        if (Array.isArray(parsedLinks)) {
          setLinks(parsedLinks);   // ✅ update parent's links state
        }
      }
    } catch (err) {
      console.error('Failed to load savedLinks', err);
      localStorage.removeItem('savedLinks');
    }
  }, [setLinks]);

  useEffect(() => {
    localStorage.setItem('savedLinks', JSON.stringify(links));
  }, [links]);

  const handleAddLink = () => {
    const trimmed = input.trim();
    const normalized = trimmed.toLowerCase();

    setLinks(prev => {
      if (!trimmed || prev.some(l => l.toLowerCase() === normalized)) return prev;
      return [...prev, trimmed];
    });
    setInput('');
  };

  const handleRemoveLink = (indexToRemove) => {
    setLinks(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleAddLink();
  };

  const trigger = (
    <div className="clipboard-header">
      <h3 className="title">Clipboard</h3>
      <span className="arrow">▼</span>
    </div>
  );

  return (
    <div className="link-manager">
      <Collapsible trigger={trigger} transitionTime={200}>
        <div className="link-input-row">
          <input
            type="url"
            placeholder="Paste a link..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
          />
          <Button onClick={handleAddLink} disabled={!input.trim()}>Add</Button>
        </div>
        <ul className="link-list">
          {links.map((link, index) => (
            <li key={index} className="link-item">
              <a href={link} target="_blank" rel="noopener noreferrer" title={link}>
                {link}
              </a>
              <button
                className="remove-button"
                onClick={() => handleRemoveLink(index)}
                aria-label="Remove link"
                title="Remove link"
              >
                &times;
              </button>
            </li>
          ))}
        </ul>
      </Collapsible>
    </div>
  );
}

export default LinkManager;
