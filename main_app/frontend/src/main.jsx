import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

function Main() {
  return (
    <StrictMode>
      <App url="http://127.0.0.1:8000/serve_pdf" />
    </StrictMode>
  );
}

createRoot(document.getElementById('root')).render(<Main />);