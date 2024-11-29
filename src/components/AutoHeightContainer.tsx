'use client'

import React, { useEffect, useRef } from 'react';

interface Props {
  children: React.ReactNode;
}

const AutoHeightContainer: React.FC<Props> = ({ children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isAdjustingRef = useRef(true);

  useEffect(() => {
    const handleResize = () => {
      if (!isAdjustingRef.current) return;
      
      // Get the actual document height
      const height = document.documentElement.scrollHeight;
      // Send message to parent with current height
      window.parent.postMessage({ type: 'setHeight', height }, '*');
    };

    // Add resize listener
    window.addEventListener('resize', handleResize);
    
    // Initial height adjustment
    handleResize();

    // Poll for changes every 100ms for the first 3 seconds
    const interval = setInterval(handleResize, 100);

    // Stop adjusting height after 3 seconds
    setTimeout(() => {
      isAdjustingRef.current = false;
      clearInterval(interval);
    }, 1500);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearInterval(interval);
      isAdjustingRef.current = false;
    };
  }, []);

  return <>{children}</>;
};

export default AutoHeightContainer;
