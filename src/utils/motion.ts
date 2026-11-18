export const MOTION_DURATION = {
  instant: 0.1,
  fast: 0.15,
  standard: 0.2,
  moderate: 0.22,
  emphasis: 0.22,
  reveal: 0.22,
} as const;

export const STUDIO_EASE = [0.2, 0, 0, 1] as const;
export const ENTER_EASE = [0, 0, 0.2, 1] as const;
export const EXIT_EASE = [0.4, 0, 1, 1] as const;

export const STUDIO_TRANSITION = {
  instant: { duration: MOTION_DURATION.instant, ease: STUDIO_EASE },
  fast: { duration: MOTION_DURATION.fast, ease: STUDIO_EASE },
  base: { duration: MOTION_DURATION.standard, ease: STUDIO_EASE },
  drawer: { duration: MOTION_DURATION.moderate, ease: ENTER_EASE },
  sheet: { duration: MOTION_DURATION.moderate, ease: ENTER_EASE },
  accordion: { duration: MOTION_DURATION.standard, ease: STUDIO_EASE },
  reveal: { duration: MOTION_DURATION.reveal, ease: ENTER_EASE },
  springTab: { duration: MOTION_DURATION.fast, ease: STUDIO_EASE } as const,
  springPop: { duration: MOTION_DURATION.fast, ease: STUDIO_EASE } as const,
};

export const PAGE_TRANSITION = {
  duration: 0.18,
  exitDuration: 0.14,
  ease: STUDIO_EASE,
} as const;

export const slideFadeVariants = {
  initial: (direction: number) => ({
    opacity: 0,
    x: direction >= 0 ? 14 : -14,
  }),
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: PAGE_TRANSITION.duration,
      ease: STUDIO_EASE,
    },
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction >= 0 ? -12 : 12,
    transition: {
      duration: PAGE_TRANSITION.exitDuration,
      ease: STUDIO_EASE,
    },
  }),
};

export function getSwipeNavigationDelta(
  startXMinusEndX: number,
  isRtl: boolean,
  threshold = 40
): 1 | -1 | 0 {
  if (Math.abs(startXMinusEndX) <= threshold) return 0;
  const raw = startXMinusEndX > 0 ? 1 : -1;
  return isRtl ? ((raw === 1 ? -1 : 1) as 1 | -1) : raw;
}

export function getDirectionalSlideSign(direction: number, isRtl: boolean): number {
  return isRtl ? -direction : direction;
}

export const CART_SWIPE_CONFIG = {
  revealWidth: 88,
  minCommitDistance: 132,
  maxCommitDistance: 184,
  commitRatio: 0.44,
  flickVelocity: 520,
  flickMinDistance: 64,
  revealThreshold: 40,
  revealVelocity: 240,
  rubberBandLimit: 24,
} as const;

export type CartSwipeOutcome = 'remove' | 'revealed' | 'closed';

export function getCartSwipeCommitThreshold(containerWidth = 340): number {
  const safeWidth = Number.isFinite(containerWidth) && containerWidth > 0 ? containerWidth : 340;
  return Math.max(
    CART_SWIPE_CONFIG.minCommitDistance,
    Math.min(CART_SWIPE_CONFIG.maxCommitDistance, Math.round(safeWidth * CART_SWIPE_CONFIG.commitRatio))
  );
}

export function resolveCartSwipeOutcome(
  offsetX: number,
  velocityX: number,
  isRtl: boolean,
  containerWidth = 340
): CartSwipeOutcome {
  // Trailing-edge swipe distance is positive: leftward in LTR, rightward in RTL
  const trailingDist = isRtl ? offsetX : -offsetX;
  const trailingVel = isRtl ? velocityX : -velocityX;
  const commitThreshold = getCartSwipeCommitThreshold(containerWidth);

  if (
    trailingDist >= commitThreshold ||
    (trailingDist >= CART_SWIPE_CONFIG.flickMinDistance &&
      trailingVel >= CART_SWIPE_CONFIG.flickVelocity)
  ) {
    return 'remove';
  }

  if (
    trailingDist >= CART_SWIPE_CONFIG.revealThreshold ||
    (trailingDist >= 22 && trailingVel >= CART_SWIPE_CONFIG.revealVelocity)
  ) {
    return 'revealed';
  }

  return 'closed';
}

export function getCartSwipeSnapX(outcome: 'revealed' | 'closed', isRtl: boolean): number {
  if (outcome === 'closed') return 0;
  return isRtl ? CART_SWIPE_CONFIG.revealWidth : -CART_SWIPE_CONFIG.revealWidth;
}

export function clampCartSwipeDragX(offsetX: number, isRtl: boolean): number {
  if (isRtl) {
    if (offsetX < 0) {
      return -Math.min(CART_SWIPE_CONFIG.rubberBandLimit, Math.abs(offsetX) * 0.25);
    }
    return offsetX;
  }
  if (offsetX > 0) {
    return Math.min(CART_SWIPE_CONFIG.rubberBandLimit, offsetX * 0.25);
  }
  return offsetX;
}

