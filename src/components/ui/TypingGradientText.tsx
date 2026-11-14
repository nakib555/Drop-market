import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { STUDIO_TRANSITION } from '../../utils/motion';

interface TypingGradientTextProps {
  phrases: string[];
  className?: string;
  typingSpeedMs?: number;
  erasingSpeedMs?: number;
  pauseMs?: number;
}

type TypingPhase = 'typing' | 'pausing' | 'erasing' | 'waiting';

/**
 * Editorial typing gradient display phrase calibrated for warm architectural contrast
 * (bronze-espresso shimmer in light mode, champagne-gold shimmer in dark mode)
 * with reduced-motion fallback and screen-reader-safe rendering.
 */
export const TypingGradientText: React.FC<TypingGradientTextProps> = ({
  phrases,
  className = '',
  typingSpeedMs = 58,
  erasingSpeedMs = 32,
  pauseMs = 1900,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const safePhrases = phrases.length > 0 ? phrases : [''];
  const firstPhrase = safePhrases[0] || '';

  const [phraseIndex, setPhraseIndex] = useState(0);
  const [charCount, setCharCount] = useState(firstPhrase.length);
  const [phase, setPhase] = useState<TypingPhase>('pausing');

  const phrasesKey = safePhrases.join('\u0000');

  useEffect(() => {
    setPhraseIndex(0);
    setCharCount((safePhrases[0] || '').length);
    setPhase('pausing');
  }, [phrasesKey]);

  useEffect(() => {
    if (shouldReduceMotion || safePhrases.length <= 1) return;

    const currentPhrase = safePhrases[phraseIndex % safePhrases.length] || '';
    let delay = typingSpeedMs;

    if (phase === 'pausing') {
      delay = pauseMs;
    } else if (phase === 'erasing') {
      delay = erasingSpeedMs;
    } else if (phase === 'waiting') {
      delay = 260;
    }

    const timer = window.setTimeout(() => {
      if (phase === 'pausing') {
        setPhase('erasing');
      } else if (phase === 'erasing') {
        if (charCount > 0) {
          setCharCount((c) => Math.max(0, c - 1));
        } else {
          setPhraseIndex((idx) => (idx + 1) % safePhrases.length);
          setPhase('waiting');
        }
      } else if (phase === 'waiting') {
        setPhase('typing');
      } else if (phase === 'typing') {
        if (charCount < currentPhrase.length) {
          setCharCount((c) => Math.min(currentPhrase.length, c + 1));
        } else {
          setPhase('pausing');
        }
      }
    }, delay);

    return () => window.clearTimeout(timer);
  }, [
    charCount,
    erasingSpeedMs,
    pauseMs,
    phase,
    phraseIndex,
    safePhrases,
    shouldReduceMotion,
    typingSpeedMs,
  ]);

  const activePhrase = safePhrases[phraseIndex % safePhrases.length] || '';
  const visibleText = shouldReduceMotion ? firstPhrase : activePhrase.slice(0, charCount);
  const gradientClasses =
    'bg-gradient-to-r from-[#6E4924] via-[#B87D43] via-50% to-[#56381A] dark:from-[#E6C296] dark:via-[#FFF0D8] dark:to-[#C89B67] bg-clip-text text-transparent';

  if (shouldReduceMotion || safePhrases.length <= 1) {
    return (
      <span className={`inline-block ${gradientClasses} ${className}`}>
        {firstPhrase}
      </span>
    );
  }

  return (
    <motion.span
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={STUDIO_TRANSITION.base}
      className={`inline [text-wrap:normal] ${className}`}
    >
      <span className="sr-only">{firstPhrase}</span>
      <span aria-hidden="true" className="inline">
        <span className={`${gradientClasses} typing-gradient-shimmer`}>
          {visibleText || '\u200B'}
        </span>
        <span
          className={`inline-block w-[2px] h-[0.84em] ml-1 align-[-0.08em] bg-[#8F6438] dark:bg-[#C89B67] ${
            phase === 'pausing' || phase === 'waiting' ? 'typing-caret-blink' : ''
          }`}
        />
      </span>
    </motion.span>
  );
};
