import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { STUDIO_TRANSITION } from '../../utils/motion';

interface TypingGradientTextProps {
  phrases: string[];
  className?: string;
  typingSpeedMs?: number;
  erasingSpeedMs?: number;
  pauseMs?: number;
}

/**
 * Calm editorial gradient display phrase calibrated for warm architectural contrast
 * (bronze-espresso in light mode, champagne-gold in dark mode) without shifting layout height.
 */
export const TypingGradientText: React.FC<TypingGradientTextProps> = ({
  phrases,
  className = '',
}) => {
  const shouldReduceMotion = useReducedMotion();
  const displayPhrase = phrases[0] || '';

  return (
    <motion.span
      initial={shouldReduceMotion ? false : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={STUDIO_TRANSITION.base}
      className={`inline-block bg-gradient-to-r from-[#6E4924] via-[#A4713B] to-[#56381A] dark:from-[#E6C296] dark:via-[#F4DEC0] dark:to-[#C89B67] bg-clip-text text-transparent ${className}`}
    >
      {displayPhrase}
    </motion.span>
  );
};
