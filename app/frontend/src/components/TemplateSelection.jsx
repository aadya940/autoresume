import React, { useState, useEffect } from 'react';
import { Box, SimpleGrid, Text, VStack, Button, Heading, Card, Image, Flex, Spacer } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { templates } from '../data/templates';
import { toaster } from './ui/toaster';

const TemplateSelection = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [checkingQuestionnaire, setCheckingQuestionnaire] = useState(true);

    // Check if questionnaire is completed on mount
    useEffect(() => {
        const checkQuestionnaireStatus = async () => {
            try {
                const response = await fetch('http://localhost:8000/api/background-questionnaire/status');
                if (response.ok) {
                    const data = await response.json();
                    if (!data.completed) {
                        // Redirect to questionnaire page if not completed
                        navigate('/questionnaire');
                    }
                }
            } catch (error) {
                console.error('Error checking questionnaire status:', error);
                // If there's an error checking, allow them to proceed
            } finally {
                setCheckingQuestionnaire(false);
            }
        };

        checkQuestionnaireStatus();
    }, [navigate]);

    const handleSelectTemplate = async (template) => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:8000/api/update-resume', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    links: [],
                    feedback: "",
                    joblink: "",
                    tex_content: template.tex_content,
                    template_id: template.id
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            toaster.success({
                title: "Template Selected",
                description: `Loaded ${template.name} template.`,
                duration: 3000,
                closable: true,
            });

            navigate('/editor');
        } catch (error) {
            console.error('Error selecting template:', error);
            toaster.error({
                title: "Error",
                description: "Failed to load template. Please try again.",
                duration: 3000,
                closable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    // Show loading state while checking questionnaire
    if (checkingQuestionnaire) {
        return (
            <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" bg="gray.50">
                <Text fontSize="xl" color="gray.600">Loading...</Text>
            </Box>
        );
    }

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
                <Box maxW="1400px" mx="auto">
                    <Flex align="center">
                        <Image src="/autoresume-logo.png" alt="AutoResume Logo" height="50px" />
                        <Text fontSize="2xl" fontWeight="bold">autoResume</Text>
                        <Spacer />
                    </Flex>
                </Box>
            </Box>

            <Box p={8}>
                <VStack spacing={8} align="center">
                    <Heading as="h1" size="2xl" color="blue.600">
                        Choose Your Template
                    </Heading>
                    <Text fontSize="xl" color="gray.600">
                        Select a design to get started with your resume.
                    </Text>

                    <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={8} width="100%" maxW="1400px">
                        {templates.map((template) => (
                            <Card.Root key={template.id} variant="elevated" _hover={{ transform: 'scale(1.02)', transition: 'transform 0.2s' }}>
                                <Card.Body>
                                    <Box
                                        height="300px"
                                        bg="gray.200"
                                        mb={4}
                                        borderRadius="md"
                                        display="flex"
                                        alignItems="center"
                                        justifyContent="center"
                                        overflow="hidden"
                                    >
                                        {/* Placeholder for preview image - using text for now */}
                                        <Text fontSize="lg" fontWeight="bold" color="gray.500">
                                            {template.name} Preview
                                        </Text>
                                    </Box>
                                    <Heading size="md" mb={2}>{template.name}</Heading>
                                    <Text color="gray.600">{template.description}</Text>
                                </Card.Body>
                                <Card.Footer>
                                    <Button
                                        colorScheme="blue"
                                        width="100%"
                                        onClick={() => handleSelectTemplate(template)}
                                        loading={loading}
                                        loadingText="Loading..."
                                    >
                                        Use Template
                                    </Button>
                                </Card.Footer>
                            </Card.Root>
                        ))}
                        <Card.Root variant="elevated" _hover={{ transform: 'scale(1.02)', transition: 'transform 0.2s' }} borderStyle="dashed" borderWidth="2px" borderColor="blue.400">
                            <Card.Body display="flex" flexDirection="column" justifyContent="center" alignItems="center">
                                <Box
                                    height="150px"
                                    width="100%"
                                    bg="blue.50"
                                    mb={4}
                                    borderRadius="md"
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="center"
                                >
                                    <Text fontSize="4xl">📤</Text>
                                </Box>
                                <Heading size="md" mb={2}>Custom Template</Heading>
                                <Text color="gray.600" textAlign="center">Upload your own .tex file</Text>
                            </Card.Body>
                            <Card.Footer>
                                <Button
                                    as="label"
                                    htmlFor="file-upload"
                                    colorScheme="blue"
                                    variant="outline"
                                    width="100%"
                                    cursor="pointer"
                                    loading={loading}
                                    loadingText="Uploading..."
                                >
                                    Upload .tex
                                    <input
                                        id="file-upload"
                                        type="file"
                                        accept=".tex"
                                        style={{ display: 'none' }}
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onload = (e) => {
                                                    handleSelectTemplate({
                                                        id: 'custom',
                                                        name: 'Custom Template',
                                                        tex_content: e.target.result
                                                    });
                                                };
                                                reader.readAsText(file);
                                            }
                                        }}
                                    />
                                </Button>
                            </Card.Footer>
                        </Card.Root>
                    </SimpleGrid>
                </VStack>
            </Box>
        </Box>
    );
};

export default TemplateSelection;
