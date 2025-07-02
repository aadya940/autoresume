import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Box, Spinner, Text } from '@chakra-ui/react';
import { startPolling } from '../services/pollingService';

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
    hasFetchedRef.current = false; // Reset on each mount
    
    const handleStatusUpdate = (isReady) => {
    if (isMounted.current) {
      setIsPdfReady(isReady);
      
      // Only fetch if PDF is ready AND we haven't fetched yet
      if (isReady && !hasFetchedRef.current) {
        hasFetchedRef.current = true;
        fetchPdf();
      }
      
      // Reset the flag if PDF becomes not ready (for future state changes)
      if (!isReady) {
        hasFetchedRef.current = false;
      }
    }
  };

  const handleError = (error) => {
    if (isMounted.current) {
      setError(`Error checking PDF status: ${error.message}`);
    }
  };

  const stopPolling = startPolling(handleStatusUpdate, handleError);

  return () => {
    isMounted.current = false;
    stopPolling();
    if (pdfUrlRef.current) {
      URL.revokeObjectURL(pdfUrlRef.current);
      pdfUrlRef.current = null;
    }
  };
  }, [fetchPdf]);

  
  
  if (loading) {
    return <Spinner size="lg" />;
  }

  if (error) {
    return <Text color="red.500">Error: {error}</Text>;
  }

  return (
    <Box display="flex" justifyContent="center" width="90%">
      <Box border="2px solid black" borderRadius="md" p={4} overflow="auto" width="100%" maxW="800px">
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
                width={600}
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
