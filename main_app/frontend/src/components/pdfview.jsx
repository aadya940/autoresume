import React, { useState, useEffect, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { FaFileDownload } from "react-icons/fa";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

function buildUrl(baseUrl) {
  const separator = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${separator}v=${Date.now()}`;
}

export function MyPdfViewer({ pdfUrl }) {
  const [numPages, setNumPages] = useState(null);
  const [url, setUrl] = useState(buildUrl(pdfUrl));
  const [lastReady, setLastReady] = useState(false);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };
  
  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch("/api/pdf-status");
      if (!res.ok) {
        console.error("Error checking status");
        return;
      }
      const { ready } = await res.json();

      if (ready && !lastReady) {
        // Status just switched from false -> true
        setUrl(buildUrl(pdfUrl));
      }
      setLastReady(ready);
    }, 1000);

    return () => clearInterval(interval);
  }, [lastReady, pdfUrl]); // `url` intentionally NOT in the deps

  return (
    <div style={{
      border: '2px solid #000',
      borderRadius: '8px',
      padding: '10px',
      width: 'fit-content',
      margin: 'auto',
    }}>
      <Document file={url} onLoadSuccess={onDocumentLoadSuccess}>
        {Array.from(new Array(numPages), (_, index) => (
          <Page key={`page_${index + 1}`} pageNumber={index + 1} />
        ))}
      </Document>

      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <a
          href={url}
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
          }}
        >
          <FaFileDownload /> Download PDF
        </a>
      </div>
    </div>
  );
}
