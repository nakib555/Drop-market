import React from 'react';

interface TypingGradientTextProps {
  phrases: string[];
  className?: string;
  typingSpeedMs?: number;
  erasingSpeedMs?: number;
  pauseMs?: number;
}

/**
 * Editorial gradient display phrase calibrated for warm architectural contrast
 * without continuous animation distractions.
 */
export const TypingGradientText: React.FC<TypingGradientTextProps> = ({
  phrases,
  className = '',
}) => {
  const firstPhrase = phrases[0] || '';
  const gradientClasses =
    'bg-gradient-to-r from-[#6E4924] via-[#7A532E] via-50% to-[#56381A] dark:from-[#E6C296] dark:via-[#FFF0D8] dark:to-[#C89B67] bg-clip-text text-transparent';

  return (
    <span className={`inline-block ${gradientClasses} ${className}`}>
      {firstPhrase}
    </span>
  );
};
