import React from 'react';
import { motion, useScroll, useSpring } from 'motion/react';
import { MOTION_DURATION, ENTER_EASE } from '../../utils/motion';

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  yOffset?: number;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  className = '',
  delay = 0,
  yOffset = 12,
}) => (
  <motion.div
    initial={{ opacity: 0, y: yOffset }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 'some' }}
    transition={{ duration: MOTION_DURATION.moderate, ease: ENTER_EASE, delay }}
    className={className}
  >
    {children}
  </motion.div>
);

export const StaggerGrid: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <motion.div
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, amount: 'some' }}
    variants={{
      hidden: {},
      visible: {
        transition: {
          staggerChildren: 0.05,
        },
      },
    }}
    className={className}
  >
    {children}
  </motion.div>
);

export const StaggerItem: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, y: 12 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: MOTION_DURATION.moderate, ease: ENTER_EASE },
      },
    }}
    className={className}
  >
    {children}
  </motion.div>
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
