import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Box,
    Button,
    Container,
    Heading,
    Text,
    HStack,
    VStack,
    Spinner,
    Image,
    Flex,
    Spacer,
} from '@chakra-ui/react';
import { toaster } from './ui/toaster';
import CodeEditor from './CodeEditor';
import PdfViewer from './PdfView';

const CoverLetterEditor = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const job = location.state?.job;

    const [code, setCode] = useState('');
    const [taskId, setTaskId] = useState(null);
    const [generating, setGenerating] = useState(false);
    const [generated, setGenerated] = useState(false);
    const [pdfRefreshKey, setPdfRefreshKey] = useState(0);

    // If no job data, redirect back to job search
    if (!job) {
        navigate('/jobs');
        return null;
    }

    // SSE listener for cover letter updates
    useEffect(() => {
        const eventSource = new EventSource('http://localhost:8000/api/events');

        eventSource.addEventListener('cover_letter_update', (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('[Cover Letter] Received SSE event:', data);

                if (data.task_id === taskId) {
                    if (data.success) {
                        setGenerated(true);
                        setGenerating(false);

                        toaster.success({
                            title: 'Success',
                            description: 'Cover letter generated successfully!',
                            duration: 3000,
                        });
                    } else {
                        setGenerating(false);
                        toaster.error({
                            title: 'Generation Failed',
                            description: data.error || 'Could not generate cover letter',
                            duration: 5000,
                        });
                    }
                }
            } catch (error) {
                console.error('[Cover Letter] Error parsing SSE event:', error);
            }
        });

        eventSource.onerror = (err) => {
            console.error('[Cover Letter] SSE Error:', err);
        };

        return () => {
            eventSource.close();
        };
    }, [taskId]);

    // Auto-generate on mount
    useEffect(() => {
        if (job && !generated && !generating) {
            handleGenerate();
        }
    }, [job]);

    const handleGenerate = async () => {
        setGenerating(true);

        try {
            const response = await fetch('http://localhost:8000/api/cover-letter/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    job_description: job.description || job.description_full || '',
                    company: job.company || 'the company',
                    title: job.title || 'this position',
                    job_url: job.job_url || job.job_url_direct || '',
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to submit cover letter generation task');
            }

            const data = await response.json();
            console.log('[Cover Letter] Task submitted:', data);
            setTaskId(data.task_id);
        } catch (error) {
            console.error('[Cover Letter] Error:', error);
            setGenerating(false);
            toaster.error({
                title: 'Failed to Start',
                description: error.message || 'Could not start cover letter generation',
                duration: 5000,
            });
        }
    };

    const handleApplyChanges = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/cover-letter/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    tex_content: code
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to update cover letter');
            }

            // Force PDF refresh after successful update
            setPdfRefreshKey(prev => prev + 1);

            toaster.success({
                title: 'Updated',
                description: 'Cover letter recompiled successfully!',
                duration: 3000,
            });
        } catch (error) {
            console.error('[Cover Letter] Update error:', error);
            toaster.error({
                title: 'Update Failed',
                description: error.message || 'Could not update cover letter',
                duration: 5000,
            });
        }
    };

    const downloadCoverLetterPDF = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/serve_pdf?file_type=pdf&cover_letter=true&download=true');

            if (!response.ok) {
                throw new Error('Failed to download PDF');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `cover_letter_${job.company?.replace(/\s+/g, '_') || 'job'}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Error downloading PDF:', error);
            toaster.error({
                title: 'Download Failed',
                description: 'Could not download PDF',
                duration: 5000,
            });
        }
    };

    const downloadCoverLetterTeX = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/serve_pdf?file_type=tex&cover_letter=true&download=true');

            if (!response.ok) {
                throw new Error('Failed to download TeX');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `cover_letter_${job.company?.replace(/\s+/g, '_') || 'job'}.tex`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Error downloading TeX:', error);
            toaster.error({
                title: 'Download Failed',
                description: 'Could not download TeX file',
                duration: 5000,
            });
        }
    };

    return (
        <Box minH="100vh" bg="gray.50">
            {/* Header */}
            <Box
                bg="white"
                borderBottom="1px"
                borderColor="gray.200"
                py={3}
                px={6}
                boxShadow="sm"
                position="sticky"
                top="0"
                zIndex={1000}
            >
                <Container maxW="1200px">
                    <Flex align="center">
                        <Image src="/autoresume-logo.png" alt="AutoResume Logo" height="50px" />
                        <Text fontSize="2xl" fontWeight="bold">autoResume</Text>
                        <Spacer />
                        <Button
                            variant="ghost"
                            onClick={() => navigate('/jobs')}
                            mr={3}
                        >
                            ← Back to Jobs
                        </Button>
                    </Flex>
                </Container>
            </Box>

            <Container maxW="1200px" py={8}>
                {/* Job Info Card */}
                <Box
                    bg="white"
                    p={6}
                    borderRadius="lg"
                    boxShadow="md"
                    border="1px solid"
                    borderColor="gray.200"
                    mb={6}
                >
                    <VStack align="start" spacing={2}>
                        <Heading size="lg">{job.title}</Heading>
                        <Text fontSize="lg" color="gray.600">
                            {job.company} • {job.location}
                        </Text>
                    </VStack>
                </Box>

                {/* Loading State */}
                {generating && !generated && (
                    <Box
                        bg="white"
                        p={12}
                        borderRadius="lg"
                        boxShadow="md"
                        textAlign="center"
                    >
                        <Spinner size="xl" color="blue.500" mb={4} />
                        <Text fontSize="xl" fontWeight="medium">Generating your cover letter...</Text>
                        <Text color="gray.600" mt={2}>This may take a minute</Text>
                    </Box>
                )}

                {/* Editor - Only show when generated */}
                {generated && (
                    <Box>
                        {/* Editor Header with Actions */}
                        <Box
                            bg="white"
                            p={4}
                            borderRadius="lg"
                            border="1px solid"
                            borderColor="gray.200"
                            mb={4}
                        >
                            <Flex align="center" justify="space-between">
                                <Heading size="md">Cover Letter Editor</Heading>
                                <HStack spacing={2}>
                                    <Button
                                        colorScheme="blue"
                                        onClick={handleApplyChanges}
                                        size="sm"
                                    >
                                        Apply Changes
                                    </Button>
                                    <Button
                                        variant="outline"
                                        colorScheme="blue"
                                        onClick={downloadCoverLetterPDF}
                                        size="sm"
                                    >
                                        Download PDF
                                    </Button>
                                    <Button
                                        variant="outline"
                                        colorScheme="blue"
                                        onClick={downloadCoverLetterTeX}
                                        size="sm"
                                    >
                                        Download TeX
                                    </Button>
                                </HStack>
                            </Flex>
                        </Box>

                        {/* Split View */}
                        <HStack
                            align="stretch"
                            spacing={4}
                            minH="calc(100vh - 400px)"
                        >
                            {/* LaTeX Editor */}
                            <Box
                                flex="1"
                                minW="0"
                                border="1px solid"
                                borderColor="gray.200"
                                borderRadius="md"
                                overflow="hidden"
                                bg="white"
                            >
                                <CodeEditor
                                    code={code}
                                    setCode={setCode}
                                    endpoint="http://localhost:8000/api/serve_pdf?file_type=tex&cover_letter=true"
                                />
                            </Box>

                            {/* PDF Preview */}
                            <Box
                                flex="1"
                                minW="0"
                                border="1px solid"
                                borderColor="gray.200"
                                borderRadius="md"
                                bg="gray.50"
                                overflow="hidden"
                            >
                                <PdfViewer
                                    key={pdfRefreshKey}
                                    endpoint={`http://localhost:8000/api/serve_pdf?file_type=pdf&cover_letter=true&t=${pdfRefreshKey}`}
                                />
                            </Box>
                        </HStack>
                    </Box>
                )}
            </Container>
        </Box>
    );
};

export default CoverLetterEditor;
