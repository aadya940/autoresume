import { Button, Flex } from '@chakra-ui/react';
import { IoIosArrowDown } from 'react-icons/io';
import { useRef } from 'react';

function StartEditingButton() {
  const scrollRef = useRef(null);

  const scrollToNextSection = () => {
    window.scrollTo({
      top: window.innerHeight * 0.4, // Scrolls down 40% of the viewport height
      behavior: 'smooth'
    });
  };

  return (
    <Button
      size="lg"
      color="white"
      bg="linear-gradient(to right, #3B82F6, #60A5FA)" 
      _hover={{
        bg: "linear-gradient(to right, #2563EB, #3B82F6)", 
        boxShadow: "lg",            
      }}
      px={6} 
      py={4} 
      minW="200px"
      maxW="200px"
      minH="50px"
      maxH="50px"
      borderRadius="md" 
      fontWeight="semibold"
      fontSize="md"
      onClick={scrollToNextSection}
      ref={scrollRef}
    >
      <Flex align="center" gap={2}>
        Start Editing
        <IoIosArrowDown size={18} style={{ flexShrink: 0 }} />
      </Flex>
    </Button>
  );
}

export default StartEditingButton;
