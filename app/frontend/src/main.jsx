import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from "./components/ui/provider"
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import TemplateSelection from './components/TemplateSelection';
import BackgroundQuestionnaire from './components/BackgroundQuestionnaire';
import JobSearch from './components/JobSearch';
import JobDetailPage from './components/JobDetailPage';
import './index.css';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <StrictMode>
    <Provider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<TemplateSelection />} />
          <Route path="/questionnaire" element={<BackgroundQuestionnaire />} />
          <Route path="/editor" element={<App />} />
          <Route path="/jobs" element={<JobSearch />} />
          <Route path="/jobs/:jobId" element={<JobDetailPage />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  </StrictMode>
);