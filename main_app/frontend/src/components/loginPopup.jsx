import { Button, Input, VStack, Box, Text } from "@chakra-ui/react";
import { useState } from "react";
import { toaster } from "./ui/toaster";


const PopupStyleForm = () => {
  const [apiKey, setApiKey] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/save-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          google_api_key: apiKey,
          email: email
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to save settings');
      }

      toaster.create({
        title: 'Success',
        description: data.message || 'Settings saved successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

    } catch (error) {
      toaster.create({
        title: 'Error',
        description: error.message || 'An error occurred while saving settings',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minH="100vh"
    >
      <Box
        border="1px solid"
        borderColor="gray.200"
        borderRadius="none" // Square border (no rounding)
        boxShadow="md"
        p={8}
        width={{ base: "90%", md: "400px" }}
        bg="white"
      >
        <VStack spacing={4}>
          <form onSubmit={handleSubmit} style={{ width: "100%" }}>
            <VStack spacing={4}>
              <Text fontSize="2xl" fontWeight="bold">Login</Text>
              <Input
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                type="password"
                placeholder="Enter your Google API Key"
              />
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="Enter your email"
              />
              <Button 
                type="submit" 
                colorScheme="blue" 
                width="100%"
                isLoading={isLoading}
                loadingText="Saving..."
              >
                Save Settings
              </Button>
            </VStack>
          </form>
        </VStack>
      </Box>
    </Box>
  );
};

export default PopupStyleForm;
