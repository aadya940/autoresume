import { Box, Input, Text, Stack, Button, Icon, HStack } from "@chakra-ui/react";
import { MdArrowForwardIos, MdAutoFixHigh, MdBarChart, MdLanguage } from "react-icons/md";

function AISuggestions({ onSuggestionChange, value = '' }) {
    const suggestions = [
        {
            title: "Rewrite for clarity",
            subtitle: "Make it clearer and more concise",
            icon: MdAutoFixHigh,
        },
        {
            title: "Make it more formal",
            subtitle: "Professional tone and language",
            icon: MdLanguage,
        },
        {
            title: "Quantify achievement",
            subtitle: "Add numbers and metrics",
            icon: MdBarChart,
        },
    ];

    return (
        <Box
            borderWidth="1px"
            borderRadius="lg"
            p={4}
            minW="358px"
            boxShadow="md"
            bg="white"
        >

            <Box mt={4} margin={5}>
            <Input 
                placeholder="Need changes/additions? Just type it here ..." 
                value={value}
                onChange={(e) => onSuggestionChange(e.target.value)} 
            />
            </Box>

            <Stack spacing={3}>
                {suggestions.map((item, idx) => (
                    <Button
                        key={idx}
                        variant="outline"
                        justifyContent="space-between"
                        p={4}
                        borderRadius="md"
                        rightIcon={<Icon as={MdArrowForwardIos} boxSize={4} />}
                        textAlign="left"
                        height="auto"
                        whiteSpace="normal"
                        flexDirection="column"
                        alignItems="flex-start"
                        onClick={() => onSuggestionChange(`${item.title}: ${item.subtitle}`)}
                    >
                        <HStack align="start" spacing={3}>
                            <Icon as={item.icon} boxSize={5} mt={1} />
                            <Box textAlign="left">
                                <Text fontWeight="semibold">{item.title}</Text>
                                <Text fontSize="sm" color="gray.600">
                                    {item.subtitle}
                                </Text>
                            </Box>
                        </HStack>
                    </Button>
                ))}
            </Stack>

        </Box>
    );
}

export default AISuggestions;
