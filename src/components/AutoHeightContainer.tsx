'use client'

import React, { useEffect, useRef, useState } from 'react';

const AutoHeightContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState('100vh');

  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const contentHeight = containerRef.current.scrollHeight;
        setHeight(`${contentHeight}px`);
        window.parent.postMessage({ type: 'setHeight', height: contentHeight }, '*');
      }
    };

    // Update on mount
    updateHeight();

    // Update on content change
    const observer = new MutationObserver(updateHeight);
    if (containerRef.current) {
      observer.observe(containerRef.current, {
        childList: true,
        subtree: true
      });
    }

    // Update on window resize
    window.addEventListener('resize', updateHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateHeight);
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      style={{ minHeight: height }}
      className="w-full bg-[#f0f1f7]"
    >
      {children}
    </div>
  );
};

export default AutoHeightContainer;
