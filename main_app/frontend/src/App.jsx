import './App.css';

import { Box, HStack, VStack, Text, Spacer, Button, Input } from '@chakra-ui/react';
import HeaderBar from './components/headerBar';
import StartEditingButton from './components/startEdit';
import LinkManager from './components/LinkManager';
import PdfViewer from './components/pdfView';
import AISuggestions from './components/aiSuggestions';
import ToggleSwitch from './components/toggleSwitch';
import { useState, useEffect } from 'react';
import { toaster, Toaster } from './components/ui/toaster';

import CodeEditor from './components/codeEditor';

function App() {
  const [isPdfMode, setIsPdfMode] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [jobLink, setJobLink] = useState('');
  const [links, setLinks] = useState([]);
  const [code, setCode] = useState("");
  
  // Load links from localStorage on initial render
  useEffect(() => {
    const STORAGE_KEY = 'user_links';
    const savedLinks = localStorage.getItem(STORAGE_KEY);
    if (savedLinks) {
      setLinks(JSON.parse(savedLinks));
    }
  }, []);
  
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateResume = async () => {
    if (!links.length && !jobLink && !aiSuggestion && code === '') {
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
          joblink: jobLink,
          tex_content: code || ''
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // The PdfViewer component will handle the polling and update automatically
      toaster.info({
        title: "Started",
        description: "Resume generation has started. This may take a few minutes.",
        duration: 3000,
        closable: true,
      });

      setAiSuggestion('');
      setJobLink('');
      
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
  
  return (
    <Box minH="100vh" width="100%" display="flex" flexDirection="column" alignItems="center">
      <Box width="100%" flex="1" display="flex" flexDirection="column" alignItems="center">
        {/* The heading Bar */}
        <HeaderBar />

        {/* The title slogan */}
        <Text
          fontSize={{ base: '2xl', md: '4xl', lg: '5xl' }}
          fontWeight="extrabold"
          lineHeight="short"
          textAlign="center"
          margin={10}
        >
          Your Smartest Resume, Built in{' '}
          <Box as="span" color="blue.500">
            Minu
          </Box>
          <Box as="span" color="blue.800">
            tes
          </Box>
          .
        </Text>
        <Text mb={4}>Paste Links. Write a few lines. Let AI build the rest.</Text>

        <StartEditingButton />

        <Box width="100%" padding={10} alignItems="center">
          <HStack alignItems="flex-start" spacing={6}>
            {/* Box for Smart Editor for showing PDFs and adding Links. */}
            <Box bg="white" borderRadius="lg" boxShadow="md" p={6} flex="1">
              <VStack align="stretch" spacing={4}>

                <HStack width="100%" position="relative">
                  <Box flex="1" display="flex" justifyContent="center">
                    <Text fontSize="2xl" fontWeight="bold">
                      Smart Editor
                    </Text>
                  </Box>
                  <Box position="absolute" right="0">
                    <ToggleSwitch isPdfMode={isPdfMode} setIsPdfMode={setIsPdfMode}/>
                  </Box>
                </HStack>

                <LinkManager links={links} setLinks={setLinks} />
                {!isPdfMode ? <PdfViewer /> : <CodeEditor code={code} setCode={setCode} />}
                
              </VStack>
            </Box>

            {/* Box for AI Editor */}
            <Box bg="white" borderRadius="lg" boxShadow="md" p={6} flex="1">
              <VStack align="stretch" spacing={4}>
                <Text fontSize="2xl" fontWeight="bold">AI Suggestions</Text>
                <AISuggestions onSuggestionChange={setAiSuggestion} value={aiSuggestion} />
                <Spacer />

                {/* Job specific rewrites */}
                <Input placeholder="Paste a job link ..." onChange={(e) => setJobLink(e.target.value)} />
                
                <Spacer />
                <Button 
                  colorScheme="blue" 
                  onClick={handleGenerateResume}
                  isLoading={isGenerating}
                  loadingText="Generating..."
                >
                  Build Resume ✨
                </Button>
              </VStack>
            </Box>
          </HStack>
        </Box>
      </Box>
      <Toaster />
    </Box>
  );
}

export default App;
