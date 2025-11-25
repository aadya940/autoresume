import { Box, Flex, Button, Spacer, Image, Text, Icon } from '@chakra-ui/react';
import React, { useState } from 'react';
import { FaCog, FaTrash } from 'react-icons/fa';
import { toaster } from './ui/toaster';
import LoginPopup from './loginPopup';

export default function HeaderBar({ onBack, isPdfMode }) {
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const handleLoginClick = () => {
    setIsLoginOpen(prevState => !prevState);
  };

  const handleDeleteClick = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/clear-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error('Failed to clear resume');
      }

      toaster.info({
        title: "Success",
        description: "Resume has been cleared successfully.",
        duration: 3000,
        closable: true,
      });
    } catch (error) {
      console.error('Error clearing resume:', error);
      toaster.error({
        title: "Error",
        description: "Failed to clear resume. Please try again.",
        duration: 3000,
        closable: true,
      });
    }
  }

  const handleExport = async () => {
    try {
      // isPdfMode=true means TeX Editor is visible (confusing variable name)
      // isPdfMode=false means PDF Viewer is visible
      const fileType = isPdfMode ? 'tex' : 'pdf';
      const downloadParam = isPdfMode ? '&download=true' : '';

      const response = await fetch(`http://localhost:8000/api/serve_pdf?file_type=${fileType}${downloadParam}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Failed to download ${fileType.toUpperCase()}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resume.${fileType}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

    } catch (error) {
      console.error('Error downloading file:', error);
      toaster.error({
        title: "Error",
        description: "Failed to download file. Please try again.",
        duration: 3000,
        closable: true,
      });
    }
  }

  return (
    <>
      <Box
        as="header"
        width="100%"
        bg="white"
        boxShadow="sm"
        px={6}
        py={3}
        position="sticky"
        top="0"
        zIndex={1000}
      >
        <Flex align="center">
          {onBack && (
            <Button variant="ghost" onClick={onBack} mr={4}>
              ← Back
            </Button>
          )}
          <Image src="/autoresume-logo.png" alt="AutoResume Logo" height="50px" />
          <Text fontSize="2xl" fontWeight="bold">autoResume</Text>
          <Spacer />

          <Button
            variant="ghost"
            colorScheme="gray"
            mr={3}
            onClick={handleDeleteClick}
            aria-label="Settings"
          >
            <Icon as={FaTrash} boxSize={5} />
          </Button>

          <Button
            variant="ghost"
            colorScheme="gray"
            mr={3}
            onClick={handleLoginClick}
            aria-label="Settings"
          >
            <Icon as={FaCog} boxSize={5} />
          </Button>
          <Button colorScheme="blue" onClick={handleExport}>
            {isPdfMode ? 'Export TeX' : 'Export PDF'}
          </Button>
        </Flex>
      </Box>

      {isLoginOpen && (
        <LoginPopup isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      )}
    </>
  );
}
