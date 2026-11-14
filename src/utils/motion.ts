export const MOTION_DURATION = {
  instant: 0.1,
  fast: 0.15,
  standard: 0.22,
  moderate: 0.3,
  emphasis: 0.45,
  reveal: 0.55,
} as const;

export const STUDIO_EASE = [0.2, 0, 0, 1] as const;
export const ENTER_EASE = [0, 0, 0.2, 1] as const;
export const EXIT_EASE = [0.4, 0, 1, 1] as const;

export const STUDIO_TRANSITION = {
  instant: { duration: MOTION_DURATION.instant, ease: STUDIO_EASE },
  fast: { duration: MOTION_DURATION.fast, ease: STUDIO_EASE },
  base: { duration: MOTION_DURATION.standard, ease: STUDIO_EASE },
  drawer: { duration: MOTION_DURATION.moderate, ease: ENTER_EASE },
  reveal: { duration: MOTION_DURATION.reveal, ease: ENTER_EASE },
  springTab: { type: 'spring', stiffness: 460, damping: 38 } as const,
  springPop: { type: 'spring', stiffness: 520, damping: 28 } as const,
};
