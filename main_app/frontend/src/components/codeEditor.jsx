import React, { useEffect, useState, useRef, useCallback } from "react";
import { Box, Spinner, Text } from "@chakra-ui/react";
import Editor from "@monaco-editor/react";


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

    // Initialize SSE connection
    const eventSource = new EventSource('http://localhost:8000/api/events');

    eventSource.onmessage = (event) => {
      if (!isMounted.current) return;

      if (event.data === 'ready') {
        setIsEditorReady(true);
        if (!hasFetchedRef.current) {
          hasFetchedRef.current = true;
          fetchLaTeX();
        }
      } else {
        setIsEditorReady(false);
        hasFetchedRef.current = false;
      }
    };

    eventSource.onerror = (err) => {
      if (isMounted.current) {
        console.error('SSE Error:', err);
      }
    };

    return () => {
      isMounted.current = false;
      eventSource.close();
    };
  }, [fetchLaTeX]);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
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
    <Box height="100%" width="100%" bg="white" color="black">
      <Editor
        height="100%"
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
