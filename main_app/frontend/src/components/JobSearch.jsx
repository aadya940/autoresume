import { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Container,
    Heading,
    Input,
    Text,
    HStack,
    VStack,
    Badge,
    Spinner,
    Image,
    Flex,
    Spacer,
} from '@chakra-ui/react';
import { toaster } from './ui/toaster';
import { useNavigate } from 'react-router-dom';

const JobSearch = () => {
    const navigate = useNavigate();
    const [skills, setSkills] = useState([]);
    const [loadingSkills, setLoadingSkills] = useState(true);
    const [jobs, setJobs] = useState([]);
    const [searching, setSearching] = useState(false);

    // Fetch skills when component mounts
    useEffect(() => {
        fetchSkills();
    }, []);

    const fetchSkills = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/jobs/skills');

            if (!response.ok) {
                throw new Error('Failed to fetch skills');
            }

            const data = await response.json();
            if (data.success) {
                setSkills(data.skills || []);
                // Automatically search for jobs after skills are loaded
                if (data.skills && data.skills.length > 0) {
                    handleSearch();
                }
            }
        } catch (error) {
            console.error('Error fetching skills:', error);
            toaster.error({
                title: 'Error',
                description: 'Could not load resume skills. Please build your resume first.',
                duration: 5000,
            });
        } finally {
            setLoadingSkills(false);
        }
    };

    const handleSearch = async () => {
        setSearching(true);

        try {
            const response = await fetch('http://localhost:8000/api/jobs/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    location: 'United States',
                    job_title: 'software engineer',
                    max_results: 50,
                    sites: ['indeed', 'linkedin', 'zip_recruiter', 'google'],
                }),
            });

            if (!response.ok) {
                throw new Error('Search failed');
            }

            const data = await response.json();

            if (data.success) {
                setJobs(data.jobs || []);
                toaster.success({
                    title: 'Success',
                    description: `Found ${data.total_jobs} jobs matching your skills!`,
                    duration: 3000,
                });
            } else {
                throw new Error(data.error || 'Search failed');
            }
        } catch (error) {
            console.error('Error searching jobs:', error);
            toaster.error({
                title: 'Search Failed',
                description: error.message || 'Could not search for jobs. Please try again.',
                duration: 5000,
            });
        } finally {
            setSearching(false);
        }
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
                    </Flex>
                </Container>
            </Box>

            <Container maxW="1200px" py={8}>
                {/* Skills Section */}
                <Box mb={8}>
                    <Heading size="md" mb={4}>
                        Your Skills
                    </Heading>
                    {loadingSkills ? (
                        <HStack>
                            <Spinner size="sm" />
                            <Text color="gray.600">Loading skills from your resume...</Text>
                        </HStack>
                    ) : skills.length > 0 ? (
                        <HStack spacing={2} flexWrap="wrap">
                            {skills.map((skill, index) => (
                                <Badge
                                    key={index}
                                    px={3}
                                    py={1}
                                    borderRadius="full"
                                    colorScheme="blue"
                                    fontSize="sm"
                                    fontWeight="medium"
                                    cursor="pointer"
                                    transition="all 0.2s"
                                    _hover={{
                                        transform: 'translateY(-2px)',
                                        boxShadow: 'md',
                                    }}
                                >
                                    {skill}
                                </Badge>
                            ))}
                        </HStack>
                    ) : (
                        <Text color="gray.600">
                            No skills found. Please build your resume first.
                        </Text>
                    )}
                </Box>

                {/* Job Results */}
                {searching && (
                    <Box textAlign="center" py={12}>
                        <Spinner size="xl" color="blue.500" thickness="4px" mb={4} />
                        <Text fontSize="lg" color="gray.600">
                            Searching for the best jobs for you...
                        </Text>
                    </Box>
                )}

                {!searching && !loadingSkills && jobs.length === 0 && (
                    <Box textAlign="center" py={12}>
                        <Text fontSize="6xl" mb={4}>
                            😔
                        </Text>
                        <Heading size="md" mb={2}>
                            No Jobs Found
                        </Heading>
                        <Text color="gray.600">
                            Try adjusting your search filters or location.
                        </Text>
                    </Box>
                )}

                {!searching && jobs.length > 0 && (
                    <>
                        <Heading size="md" mb={4}>
                            Found {jobs.length} jobs
                        </Heading>
                        <VStack spacing={4} align="stretch">
                            {jobs.map((job, index) => (
                                <Box
                                    key={index}
                                    p={6}
                                    bg="white"
                                    borderRadius="lg"
                                    boxShadow="sm"
                                    border="1px solid"
                                    borderColor="gray.200"
                                    transition="all 0.2s"
                                    _hover={{
                                        boxShadow: 'md',
                                        borderColor: 'blue.300',
                                    }}
                                >
                                    <HStack align="start" spacing={4}>
                                        {/* Company Logo/Icon */}
                                        <Box
                                            w="56px"
                                            h="56px"
                                            bg="blue.500"
                                            borderRadius="md"
                                            display="flex"
                                            alignItems="center"
                                            justifyContent="center"
                                            flexShrink={0}
                                            fontSize="2xl"
                                            fontWeight="bold"
                                            color="white"
                                        >
                                            {job.company ? job.company.charAt(0).toUpperCase() : '?'}
                                        </Box>

                                        {/* Job Details */}
                                        <VStack align="start" spacing={2} flex={1}>
                                            <Text fontWeight="bold" fontSize="lg" lineHeight="short">
                                                {job.title || 'Untitled Position'}
                                            </Text>
                                            <Text color="gray.600" fontSize="sm">
                                                {job.company || 'Company not specified'}
                                            </Text>

                                            <HStack spacing={3} flexWrap="wrap">
                                                {job.location && (
                                                    <HStack spacing={1}>
                                                        <Text fontSize="sm" color="gray.600">📍</Text>
                                                        <Text fontSize="sm" color="gray.600">{job.location}</Text>
                                                    </HStack>
                                                )}
                                                {job.job_type && (
                                                    <Badge
                                                        colorScheme={getJobTypeColor(job.job_type)}
                                                        fontSize="xs"
                                                        px={2}
                                                        py={1}
                                                        borderRadius="md"
                                                    >
                                                        {job.job_type}
                                                    </Badge>
                                                )}
                                                {job.match_score && (
                                                    <Badge
                                                        colorScheme="green"
                                                        fontSize="xs"
                                                        px={2}
                                                        py={1}
                                                        borderRadius="md"
                                                    >
                                                        {job.match_score} match
                                                    </Badge>
                                                )}
                                            </HStack>

                                            {job.min_amount && job.max_amount && (
                                                <Text fontWeight="semibold" color="green.600" fontSize="sm">
                                                    ${job.min_amount?.toLocaleString()} - $
                                                    {job.max_amount?.toLocaleString()}
                                                    {job.interval && ` / ${job.interval}`}
                                                </Text>
                                            )}
                                        </VStack>

                                        {/* Apply Button */}
                                        <Button
                                            as="a"
                                            href={job.job_url_direct}
                                            target="_blank"
                                            colorScheme="blue"
                                            size="md"
                                            flexShrink={0}
                                            minW="120px"
                                        >
                                            Apply Now
                                        </Button>
                                    </HStack>
                                </Box>
                            ))}
                        </VStack>
                    </>
                )}
            </Container>
        </Box>
    );
};

export default JobSearch;
