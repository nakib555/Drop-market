import React, { useEffect, useState } from 'react';
import { useReducedMotion } from 'motion/react';

interface TypingGradientTextProps {
  phrases: string[];
  className?: string;
  typingSpeedMs?: number;
  erasingSpeedMs?: number;
  pauseMs?: number;
}

/**
 * Editorial gradient typing animation calibrated for warm architectural contrast
 * (bronze-espresso in light mode, champagne-gold in dark mode) with reduced-motion fallback.
 */
export const TypingGradientText: React.FC<TypingGradientTextProps> = ({
  phrases,
  className = '',
  typingSpeedMs = 46,
  erasingSpeedMs = 26,
  pauseMs = 2400,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [visibleChars, setVisibleChars] = useState(phrases[0]?.length || 0);
  const [isDeleting, setIsDeleting] = useState(false);

  const currentPhrase = phrases[phraseIndex] || '';

  useEffect(() => {
    if (shouldReduceMotion || phrases.length <= 1) return;

    let timerId: number;
    if (!isDeleting && visibleChars < currentPhrase.length) {
      timerId = window.setTimeout(() => {
        setVisibleChars((c) => c + 1);
      }, typingSpeedMs);
    } else if (!isDeleting && visibleChars === currentPhrase.length) {
      timerId = window.setTimeout(() => {
        setIsDeleting(true);
      }, pauseMs);
    } else if (isDeleting && visibleChars > 0) {
      timerId = window.setTimeout(() => {
        setVisibleChars((c) => c - 1);
      }, erasingSpeedMs);
    } else {
      timerId = window.setTimeout(() => {
        setIsDeleting(false);
        setPhraseIndex((idx) => (idx + 1) % phrases.length);
      }, 240);
    }

    return () => window.clearTimeout(timerId);
  }, [
    shouldReduceMotion,
    phrases.length,
    isDeleting,
    visibleChars,
    currentPhrase.length,
    typingSpeedMs,
    erasingSpeedMs,
    pauseMs,
  ]);

  const displayedText = shouldReduceMotion ? phrases[0] || '' : currentPhrase.slice(0, visibleChars);

  return (
    <span className={`inline-flex items-baseline ${className}`}>
      <span className="bg-gradient-to-r from-[#6E4924] via-[#A4713B] to-[#56381A] dark:from-[#E6C296] dark:via-[#F4DEC0] dark:to-[#C89B67] bg-clip-text text-transparent">
        {displayedText}
      </span>
      {!shouldReduceMotion && (
        <span
          aria-hidden="true"
          className="inline-block w-[2px] h-[0.82em] ml-1 translate-y-[0.06em] bg-[#8F6438] dark:bg-[#E2B887] animate-pulse"
        />
      )}
    </span>
  );
};
