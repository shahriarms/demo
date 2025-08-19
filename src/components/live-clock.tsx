
'use client';

import { useState, useEffect } from 'react';

export function LiveClock() {
  const [currentTime, setCurrentTime] = useState<string | null>(null);

  useEffect(() => {
    const updateClock = () => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
      }));
    };

    updateClock(); 
    const timerId = setInterval(updateClock, 1000);

    return () => clearInterval(timerId);
  }, []);

  if (currentTime === null) {
    return <div className="hidden sm:flex items-center justify-center p-2 rounded-md w-[110px] h-9">&nbsp;</div>;
  }

  return (
    <div className="hidden sm:flex items-center justify-center p-2 rounded-md border bg-background text-foreground font-mono text-sm shadow-inner">
        {currentTime}
    </div>
  );
}
