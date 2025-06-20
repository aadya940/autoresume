import React from 'react';
import { Trash2 } from 'lucide-react';
import './styles/ClearButton.css';
import toast from 'react-hot-toast';


function ClearResumeButton() {
  const handleClick = async () => {
    try {
      const response = await fetch('/api/clear-resume', {
        method: 'POST', // Use POST if your backend expects POST
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to clear resume');
      }

      if (response.ok) {
      toast('Resume reset succesfully.');
      }

    } catch (error) {
      console.error(error);
    }
  };

  return (
    <button
      onClick={handleClick}
      title="Clear Resume"
    >
      <Trash2 size={16} color="#fff" />
    </button>
  );
}

export default ClearResumeButton;
