'use client'

import React, { useEffect } from 'react';

interface Props {
  children: React.ReactNode;
}

const AutoHeightContainer: React.FC<Props> = ({ children }) => {
  useEffect(() => {
    const handleResize = () => {
      // Get the actual document height
      const height = document.documentElement.scrollHeight;
      // Send message to parent with current height
      window.parent.postMessage({ type: 'setHeight', height }, '*');
    };

    // Add resize listener
    window.addEventListener('resize', handleResize);
    
    // Set initial height
    handleResize();

    // Poll for changes in height for the first few seconds
    const interval = setInterval(handleResize, 1000);
    setTimeout(() => clearInterval(interval), 5000);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearInterval(interval);
    };
  }, []);

  return <>{children}</>;
};

export default AutoHeightContainer;
