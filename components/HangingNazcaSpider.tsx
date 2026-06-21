"use client";

import { useEffect, useRef } from "react";

export function HangingNazcaSpider() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const maxScroll = Math.max(document.documentElement.scrollHeight - innerHeight, 1);
      const progress = Math.min(scrollY / maxScroll, 1);
      ref.current?.style.setProperty("--spider-drop", `${progress * 110}px`);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    return () => { removeEventListener("scroll", onScroll); removeEventListener("resize", onScroll); if (frame) cancelAnimationFrame(frame); };
  }, []);

  return <div ref={ref} className="nazca-spider" aria-hidden="true">
    <span className="nazca-thread" />
    <svg viewBox="0 0 100 135" role="presentation">
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <path d="M46 44C40 41 38 36 38 30L38 24C38 20 41 17 44 20C46 22 46 25 46 29L46 34C46 37 49 38 50 35L50 27" />
        <path d="M54 44C60 41 62 36 62 30L62 24C62 20 59 17 56 20C54 22 54 25 54 29L54 34C54 37 51 38 50 35" />
        <path d="M45 55C35 52 25 49 21 44C17 39 17 34 18 28L20 5C20 2 24 2 24 5L22 27C21 33 23 38 27 42C32 46 39 48 46 50" />
        <path d="M44 60C31 56 19 53 14 46C9 39 11 32 11 26L13 5C13 2 17 2 17 5L15 27C14 35 16 42 22 47C28 52 37 54 45 57" />
        <path d="M43 64C27 59 15 56 9 48C3 40 6 31 6 24L8 5C8 2 12 2 12 5L10 26C9 36 11 44 18 50C25 56 35 59 44 62" />
        <path d="M55 55C65 52 75 49 79 44C83 39 83 34 82 28L80 5C80 2 76 2 76 5L78 27C79 33 77 38 73 42C68 46 61 48 54 50" />
        <path d="M56 60C69 56 81 53 86 46C91 39 89 32 89 26L87 5C87 2 83 2 83 5L85 27C86 35 84 42 78 47C72 52 63 54 55 57" />
        <path d="M57 64C73 59 85 56 91 48C97 40 94 31 94 24L92 5C92 2 88 2 88 5L90 26C91 36 89 44 82 50C75 56 65 59 56 62" />
        <path d="M44 68C30 70 20 72 16 79C12 86 14 96 12 104L10 130C10 133 6 133 6 130L8 104C10 96 7 87 10 79C14 70 26 67 43 65" />
        <path d="M45 72C34 75 27 76 24 82C21 88 23 97 21 105L19 130C19 133 15 133 15 130L17 104C19 96 16 87 20 80C24 73 33 71 44 69" />
        <path d="M56 68C70 70 80 72 84 79C88 86 86 96 88 104L90 130C90 133 94 133 94 130L92 104C90 96 93 87 90 79C86 70 74 67 57 65" />
        <path d="M55 72C66 75 73 76 76 82C79 88 77 97 79 105L81 130C81 133 85 133 85 130L83 104C81 96 84 87 80 80C76 73 67 71 56 69" />
        <path d="M45 73C38 79 35 88 36 99C37 114 43 124 50 124C57 124 63 114 64 99C65 88 62 79 55 73" />
      </g>
    </svg>
  </div>;
}
