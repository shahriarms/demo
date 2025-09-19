
import { useState, useEffect } from "react";

const MOBILE_BREAKPOINT = 1024; 

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(true); // Default to true

  useEffect(() => {
    const checkIsMobile = () => {
        // This will only run on the client
        setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    }
    
    // Set the initial value on client-side mount
    checkIsMobile();
    
    // Add event listener for window resize
    window.addEventListener("resize", checkIsMobile);
    
    // Cleanup event listener on component unmount
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  return isMobile;
}
