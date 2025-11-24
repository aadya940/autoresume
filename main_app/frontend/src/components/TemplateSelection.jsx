import React, { useState } from 'react';
import { Box, SimpleGrid, Text, VStack, Button, Heading, Card } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { templates } from '../data/templates';
import { toaster } from './ui/toaster';

const TemplateSelection = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

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

    return (
        <Box minH="100vh" p={8} bg="gray.50">
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
                </SimpleGrid>
            </VStack>
        </Box>
    );
};

export default TemplateSelection;
