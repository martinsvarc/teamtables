'use client'
import React, { useEffect, useRef } from 'react';

const AutoHeightContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const contentHeight = containerRef.current.scrollHeight;
        // Only update if height actually changed
        if (contentHeight !== containerRef.current.clientHeight) {
          window.parent.postMessage({ type: 'setHeight', height: contentHeight }, '*');
        }
      }
    };

    // Debounce the resize observer callback
    let timeoutId: NodeJS.Timeout;
    const debouncedUpdate = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateHeight, 100);
    };

    const resizeObserver = new ResizeObserver(debouncedUpdate);

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Initial height update
    updateHeight();

    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} className="min-h-screen bg-[#f0f1f7]">
      <div className="relative w-full">
        <div className="max-w-7xl mx-auto p-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AutoHeightContainer;
