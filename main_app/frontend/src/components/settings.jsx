import React, { useState, useEffect } from 'react';
import { FaCog } from "react-icons/fa";
import './styles/settings.css'

const SettingsPopup = ({ apiUrl }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [googleApiKey, setGoogleApiKey] = useState('');
  const [email, setEmail] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check if user is logged in.
  useEffect(() => {
    const storedLogin = localStorage.getItem('isLoggedIn');
    setIsLoggedIn(storedLogin === 'true');
  }, []);

  const openPopup = () => setIsOpen(true);
  const closePopup = () => setIsOpen(false);

  const handleSave = () => {
    if (isLoggedIn) {
      localStorage.setItem('googleApiKey', googleApiKey);
      localStorage.setItem('email', email);
    }

    fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ google_api_key: googleApiKey, email: email }),
    })
    .then(response => response.json())
    .then(data => {
      console.log('Success:', data);
      closePopup();
    })
    .catch(error => console.error('Error:', error));
  };


  return (
    <div>
      <button className="settings-icon-button" onClick={openPopup}>
        <FaCog />
      </button>
      {isOpen && (
        <div className="popup">
          <div className="popup-inner">
            <button className="close-btn" onClick={closePopup}>&times;</button>
            <h2>Settings</h2>
            <form style={{width: '100%'}} onSubmit={e => {e.preventDefault(); handleSave();}}>
              <div className="form-group">
                <label htmlFor="googleApiKey">Google API Key</label>
                <input
                  id="googleApiKey"
                  type="password"
                  value={googleApiKey}
                  onChange={(e) => setGoogleApiKey(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email ID</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <button type="submit" className="save-btn">Save</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPopup;
