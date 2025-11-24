import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from "./components/ui/provider"
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import TemplateSelection from './components/TemplateSelection';
import './index.css';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <StrictMode>
    <Provider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<TemplateSelection />} />
          <Route path="/editor" element={<App />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  </StrictMode>
);