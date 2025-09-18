
import { useState, useEffect } from "react";

const MOBILE_BREAKPOINT = 1024; // Changed to lg breakpoint

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
        setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    }
    
    // Set the initial value
    checkIsMobile();
    
    // Add event listener for window resize
    window.addEventListener("resize", checkIsMobile);
    
    // Cleanup event listener on component unmount
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  return isMobile;
}
