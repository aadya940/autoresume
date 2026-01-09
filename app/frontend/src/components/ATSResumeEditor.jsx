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
    Badge,
} from '@chakra-ui/react';
import { toaster } from './ui/toaster';
import CodeEditor from './CodeEditor';
import PdfViewer from './PdfView';

const ATSResumeEditor = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const job = location.state?.job;

    const [code, setCode] = useState('');
    const [taskId, setTaskId] = useState(null);
    const [generating, setGenerating] = useState(false);
    const [generated, setGenerated] = useState(false);
    const [pdfRefreshKey, setPdfRefreshKey] = useState(0);
    const [keywordsAdded, setKeywordsAdded] = useState([]);
    const [keywordsMatched, setKeywordsMatched] = useState([]);

    // If no job data, redirect back to job search
    if (!job) {
        navigate('/jobs');
        return null;
    }

    // SSE listener for ATS resume updates
    useEffect(() => {
        const eventSource = new EventSource('http://localhost:8000/api/events');

        eventSource.addEventListener('ats_resume_update', (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('[ATS Resume] Received SSE event:', data);

                if (data.task_id === taskId) {
                    if (data.success) {
                        setGenerated(true);
                        setGenerating(false);
                        setKeywordsAdded(data.keywords_added || []);
                        setKeywordsMatched(data.keywords_matched || []);

                        toaster.success({
                            title: 'Success',
                            description: 'ATS-optimized resume generated successfully!',
                            duration: 3000,
                        });
                    } else {
                        setGenerating(false);
                        toaster.error({
                            title: 'Generation Failed',
                            description: data.error || 'Could not generate ATS resume',
                            duration: 5000,
                        });
                    }
                }
            } catch (error) {
                console.error('[ATS Resume] Error parsing SSE event:', error);
            }
        });

        eventSource.onerror = (err) => {
            console.error('[ATS Resume] SSE Error:', err);
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
            const response = await fetch('http://localhost:8000/api/ats-resume/generate', {
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
                throw new Error('Failed to submit ATS resume generation task');
            }

            const data = await response.json();
            console.log('[ATS Resume] Task submitted:', data);
            setTaskId(data.task_id);
        } catch (error) {
            console.error('[ATS Resume] Error:', error);
            setGenerating(false);
            toaster.error({
                title: 'Failed to Start',
                description: error.message || 'Could not start ATS resume generation',
                duration: 5000,
            });
        }
    };

    const handleApplyChanges = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/ats-resume/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    tex_content: code
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to update ATS resume');
            }

            // Force PDF refresh after successful update
            setPdfRefreshKey(prev => prev + 1);

            toaster.success({
                title: 'Updated',
                description: 'ATS resume recompiled successfully!',
                duration: 3000,
            });
        } catch (error) {
            console.error('[ATS Resume] Update error:', error);
            toaster.error({
                title: 'Update Failed',
                description: error.message || 'Could not update ATS resume',
                duration: 5000,
            });
        }
    };

    const downloadResumePDF = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/serve_pdf?file_type=pdf&ats_resume=true&download=true');

            if (!response.ok) {
                throw new Error('Failed to download PDF');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `optimized_resume_${job.company?.replace(/\s+/g, '_') || 'job'}.pdf`;
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

    const downloadResumeTeX = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/serve_pdf?file_type=tex&ats_resume=true&download=true');

            if (!response.ok) {
                throw new Error('Failed to download TeX');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `optimized_resume_${job.company?.replace(/\s+/g, '_') || 'job'}.tex`;
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
                            onClick={() => navigate(-1)}
                            mr={3}
                        >
                            ← Back to Job Details
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => navigate('/jobs')}
                        >
                            All Jobs
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
                        <HStack>
                            <Heading size="lg">{job.title}</Heading>
                            <Badge colorScheme="green" fontSize="md" px={3} py={1}>
                                ATS Optimized
                            </Badge>
                        </HStack>
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
                        <Spinner size="xl" color="green.500" mb={4} />
                        <Text fontSize="xl" fontWeight="medium">Optimizing your resume for ATS...</Text>
                        <Text color="gray.600" mt={2}>Extracting keywords and enhancing match</Text>
                    </Box>
                )}

                {/* Editor - Only show when generated */}
                {generated && (
                    <Box>
                        {/* Keyword Stats Panel */}
                        <Box p={4} bg="green.50" borderRadius="md" mb={4} border="1px solid" borderColor="green.200">
                            <HStack spacing={6} justify="space-around">
                                <VStack align="center" flex="1">
                                    <Text fontSize="sm" color="gray.600" fontWeight="medium">Keywords Added</Text>
                                    <Text fontSize="3xl" fontWeight="bold" color="green.600">
                                        {keywordsAdded.length}
                                    </Text>
                                </VStack>
                                <VStack align="center" flex="1">
                                    <Text fontSize="sm" color="gray.600" fontWeight="medium">Already Matched</Text>
                                    <Text fontSize="3xl" fontWeight="bold" color="blue.600">
                                        {keywordsMatched.length}
                                    </Text>
                                </VStack>
                                <VStack align="center" flex="1">
                                    <Text fontSize="sm" color="gray.600" fontWeight="medium">Total Coverage</Text>
                                    <Text fontSize="3xl" fontWeight="bold" color="purple.600">
                                        {keywordsAdded.length + keywordsMatched.length}
                                    </Text>
                                </VStack>
                            </HStack>
                            {keywordsAdded.length > 0 && (
                                <Box mt={4} pt={4} borderTop="1px solid" borderColor="green.200">
                                    <Text fontSize="xs" color="gray.600" mb={2} fontWeight="bold">Added Keywords:</Text>
                                    <Flex flexWrap="wrap" gap={2}>
                                        {keywordsAdded.map((keyword, idx) => (
                                            <Badge key={idx} colorScheme="green" fontSize="xs" px={2} py={1}>
                                                {keyword}
                                            </Badge>
                                        ))}
                                    </Flex>
                                </Box>
                            )}
                        </Box>

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
                                <Heading size="md">ATS Resume Editor</Heading>
                                <HStack spacing={2}>
                                    <Button
                                        colorScheme="green"
                                        onClick={handleApplyChanges}
                                        size="sm"
                                    >
                                        Apply Changes
                                    </Button>
                                    <Button
                                        variant="outline"
                                        colorScheme="green"
                                        onClick={downloadResumePDF}
                                        size="sm"
                                    >
                                        Download PDF
                                    </Button>
                                    <Button
                                        variant="outline"
                                        colorScheme="green"
                                        onClick={downloadResumeTeX}
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
                            minH="calc(100vh - 500px)"
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
                                    endpoint="http://localhost:8000/api/serve_pdf?file_type=tex&ats_resume=true"
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
                                    endpoint={`http://localhost:8000/api/serve_pdf?file_type=pdf&ats_resume=true&t=${pdfRefreshKey}`}
                                />
                            </Box>
                        </HStack>
                    </Box>
                )}
            </Container>
        </Box>
    );
};

export default ATSResumeEditor;
