import React from 'react';
import { motion, useScroll, useSpring } from 'motion/react';

interface ScrollRevealProps {
  children: React.ReactNode;
  id?: string;
  className?: string;
  delay?: number;
  yOffset?: number;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  id,
  className = '',
}) => (
  <div id={id} className={className}>
    {children}
  </div>
);

export const StaggerGrid: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <div className={className}>{children}</div>
);

export const StaggerItem: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <div className={className}>{children}</div>
);

export const ScrollProgressHairline: React.FC = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 280,
    damping: 32,
    restDelta: 0.001,
  });

  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX }}
      className="h-[1.5px] w-full origin-left bg-gradient-to-r from-[#8F6438] via-[#C89B67] to-[#8F6438] dark:from-[#C89B67] dark:via-[#E2B887] dark:to-[#C89B67]"
    />
  );
};
