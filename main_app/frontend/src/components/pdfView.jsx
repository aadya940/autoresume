import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Box, Spinner, Text } from '@chakra-ui/react';


// Initialize worker once when the module loads
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

function PdfViewer({ endpoint = 'http://localhost:8000/api/serve_pdf?file_type=pdf' }) {
  const [pdfData, setPdfData] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isPdfReady, setIsPdfReady] = useState(false);
  const pdfUrlRef = useRef(null);
  const isMounted = useRef(true);


  const fetchPdf = useCallback(async () => {
    if (!isMounted.current) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(endpoint, { cache: 'no-store' });
      if (!response.ok) throw new Error('Failed to load PDF');

      const blob = await response.blob();

      if (!isMounted.current) return;

      // Create new URL before revoking the old one
      const newUrl = URL.createObjectURL(blob);

      // Only revoke the old URL after we've created the new one
      if (pdfUrlRef.current) {
        URL.revokeObjectURL(pdfUrlRef.current);
      }

      pdfUrlRef.current = newUrl;
      setPdfData(newUrl);
      setLoading(false);
    } catch (err) {
      if (isMounted.current) {
        setError(err.message);
        setLoading(false);
      }
    }
  }, [endpoint]);


  const hasFetchedRef = useRef(false); // Move this outside useEffect, at component level

  useEffect(() => {
    isMounted.current = true;
    hasFetchedRef.current = false;

    // Initialize SSE connection
    const eventSource = new EventSource('http://localhost:8000/api/events');

    eventSource.onmessage = (event) => {
      if (!isMounted.current) return;

      if (event.data === 'ready') {
        setIsPdfReady(true);
        if (!hasFetchedRef.current) {
          hasFetchedRef.current = true;
          fetchPdf();
        }
      } else {
        setIsPdfReady(false);
        hasFetchedRef.current = false;
      }
    };

    eventSource.onerror = (err) => {
      if (isMounted.current) {
        console.error('SSE Error:', err);
        // Optional: setError('Connection lost. Reconnecting...');
      }
    };

    return () => {
      isMounted.current = false;
      eventSource.close();
      if (pdfUrlRef.current) {
        URL.revokeObjectURL(pdfUrlRef.current);
        pdfUrlRef.current = null;
      }
    };
  }, [fetchPdf]);



  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <Spinner size="lg" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4}>
        <Text color="red.500">Error: {error}</Text>
      </Box>
    );
  }

  return (
    <Box display="flex" justifyContent="center" width="100%" height="100%">
      <Box
        overflow="auto"
        width="100%"
        height="100%"
        bg="white"
        p={4}
      >
        <Document
          file={pdfData}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          onLoadError={(error) => setError(`Failed to load PDF: ${error.message}`)}
          loading={<Spinner />}
        >
          {Array.from(
            new Array(numPages),
            (_, index) => (
              <Page
                key={`page_${index + 1}`}
                pageNumber={index + 1}
                width={Math.min(500, window.innerWidth * 0.5)}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                loading={<Spinner />}
              />
            ),
          )}
        </Document>
      </Box>
    </Box>
  );
}

export default PdfViewer;
