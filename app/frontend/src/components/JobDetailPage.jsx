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
    Badge,
    Image,
    Flex,
    Spacer,
    Textarea,
    Spinner,
} from '@chakra-ui/react';
import { toaster } from '../components/ui/toaster';
import Editor from '@monaco-editor/react';
import PdfViewer from './PdfView';

const JobDetailPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const job = location.state?.job;

    const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(true);
    const [coverLetter, setCoverLetter] = useState('');
    const [aiSuggestions, setAiSuggestions] = useState('');
    const [showFullDescription, setShowFullDescription] = useState(false);
    const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);
    const [generatingCoverLetter, setGeneratingCoverLetter] = useState(false);
    const [coverLetterTex, setCoverLetterTex] = useState('');
    const [coverLetterPdfKey, setCoverLetterPdfKey] = useState(0); // For forcing PDF refresh
    const [pdfGenerated, setPdfGenerated] = useState(false); // Track if PDF exists

    // Load cover letter from sessionStorage on mount
    useEffect(() => {
        if (!job) return;

        const storageKey = `cover_letter_${job.job_url || job.id}`;
        const saved = sessionStorage.getItem(storageKey);

        if (saved) {
            try {
                const { tex, generated } = JSON.parse(saved);
                setCoverLetterTex(tex);
                setPdfGenerated(generated);
            } catch (e) {
                console.error('Error loading saved cover letter:', e);
            }
        }
    }, [job]);

    // Save cover letter to sessionStorage when it changes
    useEffect(() => {
        if (!job || !coverLetterTex) return;

        const storageKey = `cover_letter_${job.job_url || job.id}`;
        sessionStorage.setItem(storageKey, JSON.stringify({
            tex: coverLetterTex,
            generated: pdfGenerated
        }));
    }, [coverLetterTex, pdfGenerated, job]);

    // If no job data, redirect back to job search
    if (!job) {
        navigate('/jobs');
        return null;
    }

    // Backend provides cleaned description by default, and full description if available
    const displayDescription = showFullDescription ?
        (job.description_full || job.description) :
        job.description;

    /**
     * Parse and format job description with proper styling
     * Handles **headers**, bullet points, and sections
     */
    const parseAndFormatDescription = (text) => {
        if (!text) return null;

        const lines = text.split('\n');
        const elements = [];
        let currentList = [];
        let listKey = 0;

        const flushList = () => {
            if (currentList.length > 0) {
                elements.push(
                    <Box as="ul" key={`list-${listKey++}`} pl={6} mb={3} styleType="disc">
                        {currentList.map((item, i) => (
                            <Box as="li" key={i} mb={1} color="gray.700">
                                {item}
                            </Box>
                        ))}
                    </Box>
                );
                currentList = [];
            }
        };

        lines.forEach((line, index) => {
            const trimmed = line.trim();

            // Skip empty lines
            if (!trimmed) {
                flushList();
                return;
            }

            // Handle headers (text between ** **)
            if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
                flushList();
                const headerText = trimmed.replace(/\*\*/g, '').trim();
                elements.push(
                    <Heading
                        key={`header-${index}`}
                        size="sm"
                        mt={elements.length > 0 ? 4 : 0}
                        mb={2}
                        color="blue.700"
                        borderBottom="2px solid"
                        borderColor="blue.100"
                        pb={1}
                    >
                        {headerText}
                    </Heading>
                );
            }
            // Handle bullet points (lines starting with * or •)
            else if (trimmed.match(/^[\*\•\-]\s+/)) {
                const content = trimmed.replace(/^[\*\•\-]\s+/, '');
                currentList.push(content);
            }
            // Regular text
            else {
                flushList();
                elements.push(
                    <Text key={`text-${index}`} mb={2} color="gray.700" lineHeight="tall">
                        {trimmed}
                    </Text>
                );
            }
        });

        flushList();
        return elements;
    };

    const getJobTypeColor = (type) => {
        const typeMap = {
            fulltime: 'green',
            'full-time': 'green',
            parttime: 'blue',
            'part-time': 'blue',
            contract: 'purple',
            remote: 'orange',
            internship: 'pink',
        };
        return typeMap[type?.toLowerCase()] || 'gray';
    };

    const handleApplyNow = () => {
        if (job.job_url_direct) {
            window.open(job.job_url_direct, '_blank');
        }
    };

    const downloadCoverLetter = () => {
        const blob = new Blob([coverLetter], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cover_letter_${job.company?.replace(/\s+/g, '_') || 'job'}.txt`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    };

    const generateCoverLetter = async () => {
        setGeneratingCoverLetter(true);

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
                throw new Error('Failed to generate cover letter');
            }

            const data = await response.json();

            if (data.success) {
                setCoverLetterTex(data.tex_content);
                // Extract just the body paragraphs for the preview
                const texContent = data.tex_content;
                const bodyStart = texContent.indexOf('Dear');
                const bodyEnd = texContent.indexOf('Sincerely');
                if (bodyStart !== -1 && bodyEnd !== -1) {
                    const body = texContent.substring(bodyStart, bodyEnd).trim();
                    setCoverLetter(body);
                }

                // Force PDF refresh
                setCoverLetterPdfKey(prev => prev + 1);
                setPdfGenerated(true);

                // Assuming 'toaster' is imported or globally available
                // If not, you'll need to import it, e.g., import { toaster } from 'path/to/toaster';
                toaster.success({
                    title: 'Success',
                    description: 'Cover letter generated successfully!',
                    duration: 3000,
                });
            } else {
                throw new Error(data.error || 'Generation failed');
            }
        } catch (error) {
            console.error('Error generating cover letter:', error);
            // Assuming 'toaster' is imported or globally available
            toaster.error({
                title: 'Generation Failed',
                description: error.message || 'Could not generate cover letter. Please try again.',
                duration: 5000,
            });
            setGeneratingCoverLetter(false);
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
                description: 'Could not download PDF. Make sure you generated a cover letter first.',
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
                description: 'Could not download TeX file. Make sure you generated a cover letter first.',
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
                        <Button
                            colorScheme="blue"
                            onClick={handleApplyNow}
                            size="md"
                        >
                            Apply Now →
                        </Button>
                    </Flex>
                </Container>
            </Box>

            <Container maxW="1200px" py={8}>
                {/* Job Header Section */}
                <Box
                    bg="white"
                    p={8}
                    borderRadius="lg"
                    boxShadow="md"
                    border="1px solid"
                    borderColor="gray.200"
                    mb={6}
                >
                    <HStack align="start" spacing={4} mb={4}>
                        {/* Company Logo/Icon */}
                        <Box
                            w="80px"
                            h="80px"
                            bg="blue.500"
                            borderRadius="md"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            flexShrink={0}
                            fontSize="3xl"
                            fontWeight="bold"
                            color="white"
                        >
                            {job.company ? job.company.charAt(0).toUpperCase() : '?'}
                        </Box>

                        {/* Job Title and Company */}
                        <VStack align="start" spacing={1} flex={1}>
                            <Heading size="lg" lineHeight="short">
                                {job.title || 'Untitled Position'}
                            </Heading>
                            <Text fontSize="xl" color="gray.600" fontWeight="medium">
                                {job.company || 'Company not specified'}
                            </Text>
                            {job.location && (
                                <HStack spacing={1}>
                                    <Text fontSize="md" color="gray.600">📍</Text>
                                    <Text fontSize="md" color="gray.600">{job.location}</Text>
                                </HStack>
                            )}
                        </VStack>
                    </HStack>

                    {/* Job Metadata Badges */}
                    <HStack spacing={3} flexWrap="wrap" mb={4}>
                        {job.job_type && (
                            <Badge
                                colorScheme={getJobTypeColor(job.job_type)}
                                fontSize="sm"
                                px={3}
                                py={1}
                                borderRadius="md"
                            >
                                {job.job_type}
                            </Badge>
                        )}
                        {job.match_score && (
                            <Badge
                                colorScheme="green"
                                fontSize="sm"
                                px={3}
                                py={1}
                                borderRadius="md"
                            >
                                {job.match_score} match
                            </Badge>
                        )}
                    </HStack>

                    {/* Salary Information */}
                    {job.min_amount && job.max_amount && (
                        <Text fontWeight="bold" color="green.600" fontSize="lg" mb={4}>
                            ${job.min_amount?.toLocaleString()} - ${job.max_amount?.toLocaleString()}
                            {job.interval && ` / ${job.interval}`}
                        </Text>
                    )}

                    {/* Job Description - Collapsible */}
                    <Box mb={6}>
                        <Flex
                            align="center"
                            justify="space-between"
                            mb={3}
                            cursor="pointer"
                            onClick={() => setIsDescriptionOpen(!isDescriptionOpen)}
                            p={3}
                            bg="gray.50"
                            borderRadius="md"
                            _hover={{ bg: 'gray.100' }}
                        >
                            <Flex align="center" gap={2}>
                                <Heading size="md">About this position</Heading>
                                <Text fontSize="xl" color="gray.500">
                                    {isDescriptionOpen ? '▼' : '▶'}
                                </Text>
                            </Flex>
                            {job.description_full && isDescriptionOpen && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowFullDescription(!showFullDescription);
                                    }}
                                    colorScheme="blue"
                                >
                                    {showFullDescription ? 'Show Summary' : 'Show Full Description'}
                                </Button>
                            )}
                        </Flex>

                        {isDescriptionOpen && displayDescription && (
                            <Box
                                maxH="500px"
                                overflowY="auto"
                                p={5}
                                bg="white"
                                borderRadius="md"
                                border="1px solid"
                                borderColor="gray.200"
                                css={{
                                    '&::-webkit-scrollbar': {
                                        width: '8px',
                                    },
                                    '&::-webkit-scrollbar-track': {
                                        background: '#f1f1f1',
                                        borderRadius: '4px',
                                    },
                                    '&::-webkit-scrollbar-thumb': {
                                        background: '#cbd5e0',
                                        borderRadius: '4px',
                                    },
                                    '&::-webkit-scrollbar-thumb:hover': {
                                        background: '#a0aec0',
                                    },
                                }}
                            >
                                {parseAndFormatDescription(displayDescription)}
                                <Text fontSize="sm" color="gray.500" mt={4}>
                                    Click "Apply Now" above to view the complete job posting.
                                </Text>
                            </Box>
                        )}
                    </Box>
                </Box>

                {/* Application Workspace */}
                <Box
                    mt={6}
                    p={6}
                    bg="white"
                    borderRadius="lg"
                    border="1px solid"
                    borderColor="gray.200"
                    boxShadow="sm"
                >
                    <Flex align="center" justify="space-between" mb={4}>
                        <Flex align="center" gap={2} cursor="pointer" onClick={() => setIsWorkspaceOpen(!isWorkspaceOpen)}>
                            <Heading size="md">Cover Letter Builder</Heading>
                            <Text fontSize="xl" color="gray.500">
                                {isWorkspaceOpen ? '▼' : '▶'}
                            </Text>
                        </Flex>
                        {isWorkspaceOpen && (
                            <HStack spacing={2}>
                                <Button
                                    colorScheme="blue"
                                    size="sm"
                                    onClick={generateCoverLetter}
                                    isLoading={generatingCoverLetter}
                                    loadingText="Generating..."
                                >
                                    ✨ Generate with AI
                                </Button>
                                <Button
                                    variant="outline"
                                    colorScheme="blue"
                                    onClick={downloadCoverLetterPDF}
                                    size="sm"
                                >
                                    PDF
                                </Button>
                                <Button
                                    variant="outline"
                                    colorScheme="blue"
                                    onClick={downloadCoverLetterTeX}
                                    size="sm"
                                >
                                    TeX
                                </Button>
                            </HStack>
                        )}
                    </Flex>

                    {isWorkspaceOpen && (
                        <Box>
                            {/* Split-view editor like resume builder */}
                            <HStack
                                align="stretch"
                                spacing={4}
                                minH="calc(100vh - 500px)"
                            >
                                {/* Left: LaTeX Editor */}
                                <Box
                                    flex="1"
                                    minW="0"
                                    border="1px solid"
                                    borderColor="gray.200"
                                    borderRadius="md"
                                    overflow="hidden"
                                >
                                    <Editor
                                        height="100%"
                                        language="latex"
                                        value={coverLetterTex}
                                        onChange={(value) => setCoverLetterTex(value || '')}
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
                                            readOnly: !pdfGenerated, // Read-only until generated
                                        }}
                                        theme="vs-light"
                                    />
                                </Box>

                                {/* Right: PDF Preview */}
                                <Box flex="1" minW="0" border="1px solid" borderColor="gray.200" borderRadius="md" bg="gray.50">
                                    {pdfGenerated ? (
                                        <iframe
                                            key={coverLetterPdfKey}
                                            src={`http://localhost:8000/api/serve_pdf?file_type=pdf&cover_letter=true&t=${coverLetterPdfKey}`}
                                            width="100%"
                                            height="100%"
                                            style={{ border: 'none', minHeight: 'calc(100vh - 500px)', borderRadius: '6px' }}
                                            title="Cover Letter PDF Preview"
                                        />
                                    ) : (
                                        <Flex
                                            align="center"
                                            justify="center"
                                            minH="calc(100vh - 500px)"
                                            direction="column"
                                            gap={3}
                                        >
                                            <Text fontSize="4xl">📄</Text>
                                            <Text color="gray.500" textAlign="center" px={8}>
                                                Click "Generate with AI" to create a professional cover letter
                                            </Text>
                                        </Flex>
                                    )}
                                </Box>
                            </HStack>

                            {/* Notes section below */}
                            <Box mt={4}>
                                <Text fontWeight="medium" color="gray.700" mb={2} fontSize="sm">
                                    Notes & Keywords
                                </Text>
                                <Textarea
                                    value={aiSuggestions}
                                    onChange={(e) => setAiSuggestions(e.target.value)}
                                    placeholder="Add notes, keywords from job description, or ideas to customize your cover letter..."
                                    minH="80px"
                                    fontSize="sm"
                                    resize="vertical"
                                />
                            </Box>
                        </Box>
                    )}
                </Box>
            </Container>
        </Box>
    );
};

export default JobDetailPage;
