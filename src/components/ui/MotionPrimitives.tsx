import React from 'react';
import { motion, useReducedMotion, useScroll, useSpring } from 'motion/react';
import { STUDIO_TRANSITION } from '../../utils/motion';

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
  delay = 0,
  yOffset = 14,
}) => {
  const reducedMotion = useReducedMotion();
  return (
    <motion.div
      id={id}
      initial={reducedMotion ? false : { opacity: 0, y: yOffset }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ ...STUDIO_TRANSITION.reveal, delay: reducedMotion ? 0 : delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const StaggerGrid: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  const reducedMotion = useReducedMotion();
  return (
    <motion.div
      initial={reducedMotion ? false : 'hidden'}
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: reducedMotion ? 0 : 0.04,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const StaggerItem: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  const reducedMotion = useReducedMotion();
  return (
    <motion.div
      variants={
        reducedMotion
          ? undefined
          : {
              hidden: { opacity: 0, y: 10 },
              visible: { opacity: 1, y: 0, transition: STUDIO_TRANSITION.reveal },
            }
      }
      className={className}
    >
      {children}
    </motion.div>
  );
};

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
      className="h-[1.5px] w-full origin-left rtl:origin-right bg-gradient-to-r from-[#8F6438] via-[#C89B67] to-[#8F6438] dark:from-[#C89B67] dark:via-[#E2B887] dark:to-[#C89B67]"
    />
  );
};
