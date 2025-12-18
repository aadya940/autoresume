import { useState } from 'react';
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
} from '@chakra-ui/react';
import { toaster } from '../components/ui/toaster';

const JobDetailPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const job = location.state?.job;

    const [showFullDescription, setShowFullDescription] = useState(false);
    const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);



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

                {/* Cover Letter Section */}
                <Box
                    mt={6}
                    p={6}
                    bg="white"
                    borderRadius="lg"
                    border="1px solid"
                    borderColor="gray.200"
                    boxShadow="sm"
                >
                    <VStack align="stretch" spacing={5}>
                        {/* Header */}
                        <HStack spacing={3} align="center">
                            <Box
                                p={2}
                                bg="blue.50"
                                borderRadius="md"
                            >
                                <Text fontSize="2xl">✨</Text>
                            </Box>
                            <Heading size="md" color="gray.800">
                                Cover Letter
                            </Heading>
                        </HStack>

                        {/* Features Grid */}
                        <HStack
                            spacing={4}
                            p={4}
                            bg="gray.50"
                            borderRadius="md"
                            justify="space-around"
                        >
                            <VStack spacing={1} flex={1}>
                                <Text fontSize="xl">📝</Text>
                                <Text color="gray.700" fontSize="xs" fontWeight="medium" textAlign="center">
                                    Tailored Content
                                </Text>
                            </VStack>
                            <VStack spacing={1} flex={1}>
                                <Text fontSize="xl">🎯</Text>
                                <Text color="gray.700" fontSize="xs" fontWeight="medium" textAlign="center">
                                    Keyword Match
                                </Text>
                            </VStack>
                            <VStack spacing={1} flex={1}>
                                <Text fontSize="xl">⚡</Text>
                                <Text color="gray.700" fontSize="xs" fontWeight="medium" textAlign="center">
                                    Instant Results
                                </Text>
                            </VStack>
                        </HStack>

                        {/* CTA Button */}
                        <Button
                            colorScheme="blue"
                            size="lg"
                            height="56px"
                            fontSize="md"
                            fontWeight="semibold"
                            onClick={() => navigate('/cover-letter', { state: { job } })}
                            _hover={{
                                transform: 'translateY(-1px)',
                                boxShadow: 'md',
                            }}
                            transition="all 0.2s"
                        >
                            Generate Cover Letter with AI
                        </Button>
                    </VStack>
                </Box>
            </Container>
        </Box>
    );
};

export default JobDetailPage;
