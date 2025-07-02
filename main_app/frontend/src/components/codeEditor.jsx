import React, { useEffect, useState, useRef, useCallback } from "react";
import { Box, Spinner, Text } from "@chakra-ui/react";
import Editor from "@monaco-editor/react";
import { startPolling } from '../services/pollingService';

function LaTeXEditor({ code, setCode, endpoint = 'http://localhost:8000/api/serve_pdf?file_type=tex' }) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditorReady, setIsEditorReady] = useState(false);
  const isMounted = useRef(true);
  const hasFetchedRef = useRef(false);

  const fetchLaTeX = useCallback(async () => {
    if (!isMounted.current) return;
    
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(endpoint, { cache: 'no-store' });
      if (!response.ok) throw new Error('Failed to load LaTeX code');
      const data = await response.json();
      
      if (!isMounted.current) return;
      
      setCode(data.code);
      setIsLoading(false);
    } catch (err) {
      if (isMounted.current) {
        setError(err.message);
        setIsLoading(false);
      }
    }
  }, [endpoint]);

  useEffect(() => {
    isMounted.current = true;
    hasFetchedRef.current = false;
    
    const handleStatusUpdate = (isReady) => {
      if (isMounted.current) {
        setIsEditorReady(isReady);
        
        // Only fetch if editor is ready AND we haven't fetched yet
        if (isReady && !hasFetchedRef.current) {
          hasFetchedRef.current = true;
          fetchLaTeX();
        }
        
        // Reset the flag if editor becomes not ready (for future state changes)
        if (!isReady) {
          hasFetchedRef.current = false;
        }
      }
    };

    const handleError = (error) => {
      if (isMounted.current) {
        setError(`Error checking editor status: ${error.message}`);
      }
    };

    const stopPolling = startPolling(handleStatusUpdate, handleError);

    return () => {
      isMounted.current = false;
      stopPolling();
    };
  }, [fetchLaTeX]);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minH="100vh">
        <Spinner size="xl" />
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
    <Box minH="100vh" bg="white" border="2px solid black" color="black" p={6}>
      <Editor
        height="90vh"
        language="latex"
        value={code}
        onChange={(value) => setCode(value || "")}
        loading={
          <Box display="flex" justifyContent="center" alignItems="center" height="100%">
            <Spinner size="xl" />
          </Box>
        }
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          wordWrap: 'on',
          automaticLayout: true,
        }}
      />
    </Box>
  );
}

export default LaTeXEditor;
