'use client'
import React, { useEffect, useRef } from 'react';

const AutoHeightContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        // Add some padding to the height to ensure content is fully visible
        const contentHeight = containerRef.current.scrollHeight + 32;
        window.parent.postMessage({ type: 'setHeight', height: contentHeight }, '*');
      }
    };

    // Update height on both load and resize
    const debouncedUpdate = () => {
      requestAnimationFrame(updateHeight);
    };

    const resizeObserver = new ResizeObserver(debouncedUpdate);

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Initial height setup
    debouncedUpdate();

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full bg-[#f0f1f7]">
      <div className="relative w-full">
        <div className="max-w-7xl mx-auto p-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AutoHeightContainer;
