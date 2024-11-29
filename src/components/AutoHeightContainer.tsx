'use client'

import React, { useEffect, useRef } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";

const AutoHeightContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const height = containerRef.current.scrollHeight;
        window.parent.postMessage({ type: 'setHeight', height }, '*');
      }
    };

    // Create ResizeObserver to watch for content changes
    const resizeObserver = new ResizeObserver(() => {
      updateHeight();
    });

    // Start observing the container
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Initial height update
    updateHeight();

    // Cleanup
    return () => {
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
