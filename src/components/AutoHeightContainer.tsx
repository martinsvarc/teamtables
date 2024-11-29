'use client'

import React, { useEffect, useRef } from 'react';

interface Props {
  children: React.ReactNode;
}

const MIN_HEIGHT = 800; // Minimum height in pixels

const AutoHeightContainer: React.FC<Props> = ({ children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastHeight = useRef<number>(MIN_HEIGHT);

  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        // Get the content height and ensure it's at least MIN_HEIGHT
        let newHeight = Math.max(
          containerRef.current.scrollHeight,
          MIN_HEIGHT
        );

        // Add padding to prevent scrollbar
        newHeight += 100;

        // Only update if height has changed significantly (more than 10px)
        if (Math.abs(newHeight - lastHeight.current) > 10) {
          lastHeight.current = newHeight;
          window.parent.postMessage({ type: 'setHeight', height: newHeight }, '*');
        }
      }
    };

    // Delayed update to ensure content is rendered
    const delayedUpdate = () => {
      setTimeout(updateHeight, 100);
    };

    // Create ResizeObserver to watch for content changes
    const resizeObserver = new ResizeObserver(() => {
      delayedUpdate();
    });

    // Start observing the container
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Set initial height
    delayedUpdate();

    // Cleanup
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="w-full bg-[#f0f1f7]"
      style={{ minHeight: MIN_HEIGHT }}
    >
      <div className="w-full h-full">
        <div className="max-w-[1400px] mx-auto p-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AutoHeightContainer;
