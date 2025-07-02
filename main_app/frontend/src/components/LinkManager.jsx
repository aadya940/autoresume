import React, { useState } from 'react';
import {
  Box,
  HStack,
  Input,
  Link,
  CloseButton,
  Text,
  Button,
} from '@chakra-ui/react';

function truncate(str, maxLength = 40) {
  return str.length <= maxLength ? str : str.slice(0, maxLength) + '…';
}

const STORAGE_KEY = 'user_links';

function LinkManager({ links = [], setLinks = () => {} }) {
  const [input, setInput] = useState('');

  // Save to localStorage and update parent component
  const updateLinks = (newLinks) => {
    setLinks(newLinks);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newLinks));
  };

  const addLink = () => {
    const trimmed = input.trim();
    if (trimmed && !links.includes(trimmed)) {
      const newLinks = [...links, trimmed];
      updateLinks(newLinks);
    }
    setInput('');
  };

  return (
    <Box
      width="800px"  
      maxW="90%"
      mx="auto"
      px={6}
      py={2}
      bg="white"
      borderRadius="0"
      border="0px"
    >

      <HStack mb={4} spacing={2}>
        <Input
          placeholder="Paste a LinkedIn, GitHub, or portfolio link..."
          value={input}
          onChange={e => setInput(e.target.value)}
          bg="white"
        />
        <Button
          onClick={addLink}
          isDisabled={!input.trim()}
          colorScheme="blue"
          px={4}
          py={2}
        >
          +
        </Button>
      </HStack>

      {/* Horizontally scrollable chips */}
      <Box overflowX="auto" pb={2}> 
        <HStack spacing={3} minW="max-content">
          {links.map((link, idx) => (
            <Box
              key={idx}
              px={3}
              py={1}
              bg="gray.100"
              borderRadius="full"
              display="flex"
              alignItems="center"
              whiteSpace="nowrap"
              maxW="100%"
            >
              <Link href={link} isExternal fontSize="sm">
                {truncate(link)}
              </Link>
              <CloseButton
                size="sm"
                ml={2}
                onClick={() => {
                  const newLinks = links.filter((_, i) => i !== idx);
                  updateLinks(newLinks);
                }}
              />
            </Box>
          ))}
        </HStack>
      </Box>

      <Text fontSize="sm" color="gray.500" mt={2}>
        💡 Tip: Paste your LinkedIn, GitHub, or portfolio links above. AI will
        automatically extract the content available.
      </Text>
    </Box>
  );
}

export default LinkManager;
