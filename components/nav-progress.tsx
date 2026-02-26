"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function NavProgress() {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);
  const prevPathname = useRef(pathname);

  // Reset when pathname changes
  useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
      // Use timeout to avoid synchronous setState in effect
      const timeoutId = setTimeout(() => {
        setIsNavigating(false);
        setProgress(0);
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [pathname]);

  useEffect(() => {
    if (!isNavigating) return;

    // Simulate progress
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + 10;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [isNavigating]);

  // Listen for navigation start via link clicks
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      const link = target.closest("a");
      if (link && link.href && !link.href.startsWith("#")) {
        const url = new URL(link.href);
        if (url.pathname !== pathname && url.origin === window.location.origin) {
          setIsNavigating(true);
          setProgress(10);
        }
      }
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [pathname]);

  if (!isNavigating) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-1 bg-primary/20">
      <div
        className={cn(
          "h-full bg-primary transition-all duration-300 ease-out"
        )}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
