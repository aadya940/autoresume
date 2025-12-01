import './App.css';

import { Box, HStack, Text, Button, Textarea, Input } from '@chakra-ui/react';
import HeaderBar from './components/headerBar';
import PdfViewer from './components/pdfView';
import { useState, useEffect } from 'react';
import { toaster, Toaster } from './components/ui/toaster';
import CodeEditor from './components/codeEditor';

function App() {
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [links, setLinks] = useState([]);
  const [code, setCode] = useState("");
  const [linkInput, setLinkInput] = useState('');

  // Load links from localStorage on initial render
  useEffect(() => {
    const STORAGE_KEY = 'user_links';
    const savedLinks = localStorage.getItem(STORAGE_KEY);
    if (savedLinks) {
      setLinks(JSON.parse(savedLinks));
    }
  }, []);

  const [isGenerating, setIsGenerating] = useState(false);

  const addLink = () => {
    const STORAGE_KEY = 'user_links';
    const trimmed = linkInput.trim();
    if (trimmed && !links.includes(trimmed)) {
      const newLinks = [...links, trimmed];
      setLinks(newLinks);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newLinks));
    }
    setLinkInput('');
  };

  const removeLink = (index) => {
    const STORAGE_KEY = 'user_links';
    const newLinks = links.filter((_, i) => i !== index);
    setLinks(newLinks);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newLinks));
  };

  const handleGenerateResume = async () => {
    if (!links.length && !aiSuggestion && code === '') {
      toaster.error({
        title: "Error",
        description: "Please add some useful content.",
        duration: 3000,
        closable: true,
      });
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch('http://localhost:8000/api/update-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          links: links,
          feedback: aiSuggestion,
          joblink: '',
          tex_content: code || ''
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      toaster.info({
        title: "Started",
        description: "Resume generation has started. This may take a few minutes.",
        duration: 3000,
        closable: true,
      });

      setAiSuggestion('');

    } catch (error) {
      console.error('Error generating resume:', error);
      toaster.error({
        title: "Error",
        description: "Failed to start resume generation. Please try again.",
        duration: 3000,
        closable: true,
      });
    } finally {
      setIsGenerating(false);
    }
  }

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/serve_pdf?file_type=pdf', {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'resume.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toaster.error({
        title: "Error",
        description: "Failed to download PDF. Please try again.",
        duration: 3000,
        closable: true,
      });
    }
  };

  const handleDownloadTeX = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/serve_pdf?file_type=tex&download=true', {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to download TeX');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'resume.tex';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error('Error downloading TeX:', error);
      toaster.error({
        title: "Error",
        description: "Failed to download TeX. Please try again.",
        duration: 3000,
        closable: true,
      });
    }
  };

  return (
    <Box minH="100vh" width="100%" display="flex" flexDirection="column">
      {/* Header Bar */}
      <HeaderBar onBack={() => window.location.href = '/'} isPdfMode={false} />

      {/* Compact Controls Bar - Everything in One Line */}
      <Box
        width="100%"
        bg="gray.50"
        borderY="1px solid"
        borderColor="gray.200"
        px={6}
        py={3}
      >
        <HStack spacing={3} maxW="1400px" mx="auto" align="center">
          {/* Links Input */}
          <HStack spacing={2} flex="1">
            <Input
              placeholder="Paste links (LinkedIn, GitHub, portfolio...)"
              value={linkInput}
              onChange={e => setLinkInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addLink()}
              size="sm"
              bg="white"
            />
            <Button
              onClick={addLink}
              isDisabled={!linkInput.trim()}
              colorScheme="blue"
              size="sm"
              px={4}
            >
              +
            </Button>
          </HStack>

          {/* AI Suggestions */}
          <Textarea
            placeholder="AI suggestions..."
            value={aiSuggestion}
            onChange={(e) => setAiSuggestion(e.target.value)}
            size="sm"
            resize="none"
            rows={1}
            flex="1"
            bg="white"
          />

          {/* Action Buttons */}
          <HStack spacing={2}>
            <Button
              colorScheme="blue"
              onClick={handleGenerateResume}
              isLoading={isGenerating}
              loadingText="Generating..."
              size="sm"
            >
              Build ✨
            </Button>
            <Button
              variant="outline"
              colorScheme="blue"
              onClick={handleDownloadPDF}
              size="sm"
            >
              PDF
            </Button>
            <Button
              variant="outline"
              colorScheme="blue"
              onClick={handleDownloadTeX}
              size="sm"
            >
              TeX
            </Button>
          </HStack>
        </HStack>

        {/* Display added links */}
        {links.length > 0 && (
          <Box mt={2} maxW="1400px" mx="auto">
            <HStack spacing={2} flexWrap="wrap">
              {links.map((link, index) => (
                <Box
                  key={index}
                  bg="blue.50"
                  border="1px solid"
                  borderColor="blue.200"
                  borderRadius="md"
                  px={3}
                  py={1}
                  fontSize="xs"
                  display="flex"
                  alignItems="center"
                  gap={2}
                >
                  <Text color="blue.700" isTruncated maxW="200px">
                    {link}
                  </Text>
                  <Button
                    size="xs"
                    variant="ghost"
                    colorScheme="red"
                    onClick={() => removeLink(index)}
                    px={1}
                    minW="auto"
                    h="auto"
                  >
                    ×
                  </Button>
                </Box>
              ))}
            </HStack>
          </Box>
        )}
      </Box>

      {/* Overleaf-Style Split View - 50/50 */}
      <Box
        flex="1"
        width="100%"
        display="flex"
        overflow="hidden"
        px={12}
        py={4}
      >
        <Box
          display="flex"
          width="100%"
          maxW="1280px"
          mx="auto"
          overflow="hidden"
          gap={4}
        >
          {/* LaTeX Editor - 50% */}
          <Box
            width="50%"
            overflow="hidden"
            display="flex"
            flexDirection="column"
            borderRadius="md"
            border="1px solid"
            borderColor="gray.300"
            boxShadow="sm"
          >
            <CodeEditor code={code} setCode={setCode} />
          </Box>

          {/* PDF Viewer - 50% */}
          <Box
            width="50%"
            overflow="auto"
            display="flex"
            flexDirection="column"
            bg="gray.100"
            borderRadius="md"
            border="1px solid"
            borderColor="gray.300"
            boxShadow="sm"
          >
            <PdfViewer />
          </Box>
        </Box>
      </Box>

      <Toaster />
    </Box>
  );
}

export default App;
