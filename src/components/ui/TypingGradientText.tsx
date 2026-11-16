import React, { useEffect, useState } from 'react';

interface TypingGradientTextProps {
  phrases: string[];
  className?: string;
  typingSpeedMs?: number;
  erasingSpeedMs?: number;
  pauseMs?: number;
  singleLine?: boolean;
}

/**
 * Editorial typing + satin metallic gradient display headline.
 * Keeps caret solid while typing/erasing, pulses gently when paused,
 * and honors prefers-reduced-motion with an accessible static screen-reader label.
 */
export const TypingGradientText: React.FC<TypingGradientTextProps> = ({
  phrases,
  className = '',
  typingSpeedMs = 58,
  erasingSpeedMs = 30,
  pauseMs = 2400,
  singleLine = false,
}) => {
  const safePhrases = phrases.length > 0 ? phrases : ['Crafted to endure.'];
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(safePhrases[0].length);
  const [isDeleting, setIsDeleting] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const currentPhrase = safePhrases[phraseIndex % safePhrases.length];
  const isPausedAtEnd = !isDeleting && charIndex === currentPhrase.length;

  useEffect(() => {
    if (reducedMotion || safePhrases.length <= 1) return;

    let delay = typingSpeedMs;
    if (isPausedAtEnd) {
      delay = pauseMs;
    } else if (isDeleting && charIndex === 0) {
      delay = 340;
    } else if (isDeleting) {
      delay = erasingSpeedMs;
    }

    const timer = window.setTimeout(() => {
      if (!isDeleting) {
        if (charIndex < currentPhrase.length) {
          setCharIndex((prev) => prev + 1);
        } else {
          setIsDeleting(true);
        }
      } else if (charIndex > 0) {
        setCharIndex((prev) => prev - 1);
      } else {
        setIsDeleting(false);
        setPhraseIndex((prev) => (prev + 1) % safePhrases.length);
      }
    }, delay);

    return () => window.clearTimeout(timer);
  }, [
    charIndex,
    currentPhrase.length,
    erasingSpeedMs,
    isDeleting,
    isPausedAtEnd,
    pauseMs,
    phraseIndex,
    reducedMotion,
    safePhrases,
    typingSpeedMs,
  ]);

  const activePhrase = reducedMotion
    ? safePhrases[0]
    : currentPhrase.slice(0, charIndex);

  const gradientClasses =
    'bg-gradient-to-r from-[#3B2512] via-[#8F6438] via-50% to-[#2A1B0E] dark:from-[#D5A874] dark:via-[#FFF4E2] dark:via-50% to-[#B88854] bg-clip-text text-transparent ks-typing-gradient';

  return (
    <span
      className={`inline-flex items-baseline ${
        singleLine ? 'whitespace-nowrap max-w-full' : 'flex-wrap'
      } ${className}`}
    >
      <span className="sr-only">{safePhrases[0]}</span>
      <span
        aria-hidden="true"
        className={`inline-block pb-[0.06em] ${singleLine ? 'truncate' : ''} ${gradientClasses}`}
      >
        {activePhrase || '\u00A0'}
      </span>
      {!reducedMotion && safePhrases.length > 1 && (
        <span
          aria-hidden="true"
          className={`inline-block shrink-0 w-[1.5px] h-[0.8em] ms-1.5 translate-y-[0.04em] rounded-full bg-gradient-to-b from-[#8F6438] to-[#3B2512] dark:from-[#FFF4E2] dark:to-[#B88854] ${
            isPausedAtEnd ? 'ks-typing-caret' : 'opacity-90'
          }`}
        />
      )}
    </span>
  );
};
