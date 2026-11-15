"use client";

import { useEffect } from "react";

/*
 * Fades `[data-reveal]` blocks in as they enter the viewport. The server
 * renders everything visible; blocks are only hidden once this code runs,
 * and never for visitors who ask for reduced motion.
 */
export function LandingMotion() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-landing]");
    if (!root || !("IntersectionObserver" in window)) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const blocks = [...root.querySelectorAll<HTMLElement>("[data-reveal]")];
    // Anything already on screen stays as it is, so nothing blinks.
    for (const block of blocks) {
      if (block.getBoundingClientRect().top < window.innerHeight * 0.95)
        block.setAttribute("data-shown", "");
    }
    root.setAttribute("data-motion", "");

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute("data-shown", "");
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.06 },
    );
    for (const block of blocks)
      if (!block.hasAttribute("data-shown")) observer.observe(block);

    return () => {
      observer.disconnect();
      root.removeAttribute("data-motion");
    };
  }, []);
  return null;
}
