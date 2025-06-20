import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { FaFileDownload } from 'react-icons/fa';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';


pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export function MyPdfViewer({ pdfUrl }) {
  const [numPages, setNumPages] = useState(null);
  const [shouldReload, setShouldReload] = useState(false);
  const [wasReady, setWasReady] = useState(false); // Track previous ready state

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch("/api/pdf-status");
      if (!res.ok) throw new Error("Server Error!");
      const { ready } = await res.json();

      // Only reload when ready transitions from false to true
      if (ready && !wasReady) {
        setShouldReload(true);
      }
      setWasReady(ready);
    }, 1000);

    return () => clearInterval(interval);
  }, [wasReady]);

  // Reset shouldReload after reload
  useEffect(() => {
    if (shouldReload) {
      const timeout = setTimeout(() => setShouldReload(false), 100); // short delay to allow reload
      return () => clearTimeout(timeout);
    }
  }, [shouldReload]);

  return (
    <div style={{
      border: '2px solid #000',
      borderRadius: '8px',
      padding: '10px',
      width: 'fit-content',
      margin: 'auto'
    }}>
      <Document
        key={shouldReload ? Date.now() : undefined}
        file={shouldReload ? `${pdfUrl}?v=${Date.now()}` : pdfUrl}
        onLoadSuccess={onDocumentLoadSuccess}
      >
        {Array.from(new Array(numPages), (el, index) => (
          <Page key={`page_${index + 1}`} pageNumber={index + 1} />
        ))}
      </Document>

      {/* Download button */}
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
      <a
      href={shouldReload ? `${pdfUrl}?v=${Date.now()}` : pdfUrl}
      download="resume.pdf"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        background: '#007bff',
        color: 'white',
        padding: '10px 20px',
        borderRadius: '5px',
        textDecoration: 'none',
        cursor: 'pointer',
      }}>
      <FaFileDownload /> Download PDF
    </a>
      </div>
    </div>
  );
}
