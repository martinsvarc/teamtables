'use client'

import React, { useEffect, useRef } from 'react';

interface Props {
  children: React.ReactNode;
}

const AutoHeightContainer: React.FC<Props> = ({ children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isAdjustingRef = useRef(true);
  const lastHeightRef = useRef(0);

  const updateHeight = () => {
    if (!isAdjustingRef.current) return;
    
    const height = document.documentElement.scrollHeight;
    if (height !== lastHeightRef.current) {
      lastHeightRef.current = height;
      window.parent.postMessage({ type: 'setHeight', height }, '*');
    }
  };

  useEffect(() => {
    // First update: immediate
    updateHeight();

    // Second update: after first paint
    requestAnimationFrame(() => {
      updateHeight();

      // Third update: after a brief delay for layout
      setTimeout(() => {
        updateHeight();
        isAdjustingRef.current = false;
      }, 500);
    });

    // Listen for content updates
    const handleContentUpdate = () => {
      isAdjustingRef.current = true;
      requestAnimationFrame(() => {
        updateHeight();
        setTimeout(() => {
          updateHeight();
          isAdjustingRef.current = false;
        }, 100);
      });
    };

    window.addEventListener('content-update', handleContentUpdate);
    
    return () => {
      window.removeEventListener('content-update', handleContentUpdate);
      isAdjustingRef.current = false;
    };
  }, []);

  return <>{children}</>;
};

export default AutoHeightContainer;
