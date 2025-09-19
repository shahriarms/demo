
'use client';

import { useState, useEffect } from 'react';

export function LiveClock() {
  const [currentTime, setCurrentTime] = useState<string | null>(null);

  useEffect(() => {
    // This function will only run on the client, after initial hydration.
    const updateClock = () => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
      }));
    };

    // Set the initial time on mount
    updateClock(); 
    
    // Set up the interval to update the time every second
    const timerId = setInterval(updateClock, 1000);

    // Clean up the interval when the component unmounts
    return () => clearInterval(timerId);
  }, []); // The empty dependency array ensures this effect runs only once on mount.

  // Render a placeholder on the server and during initial client render
  if (currentTime === null) {
    return <div className="flex items-center justify-center p-2 rounded-md w-[110px] h-9 border bg-background shadow-inner">&nbsp;</div>;
  }

  // Render the actual clock only on the client after hydration
  return (
    <div className="flex items-center justify-center p-2 rounded-md border bg-background text-foreground font-mono text-sm shadow-inner">
        {currentTime}
    </div>
  );
}
