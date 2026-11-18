import React, { useEffect, useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type PanInfo,
} from 'motion/react';
import { CurrencyCode, CartItem, LanguageCode } from '../../types/commerce';
import { formatCurrency } from '../../utils/format';
import { t } from '../../utils/i18n';
import {
  CART_SWIPE_CONFIG,
  getCartSwipeCommitThreshold,
  getCartSwipeSnapX,
  resolveCartSwipeOutcome,
  STUDIO_TRANSITION,
} from '../../utils/motion';
import { QuantityStepper } from '../product/CommercePrimitives';
import { ResilientImage } from '../ui/Primitives';

interface SwipeableCartItemProps {
  item: CartItem;
  language: LanguageCode;
  currency: CurrencyCode;
  isRevealed: boolean;
  onRevealChange: (key: string | null) => void;
  onUpdateQty: (key: string, quantity: number) => void;
  onRemove: (item: CartItem) => void;
  onNavigateProduct: (slug: string) => void;
}

export const SwipeableCartItem: React.FC<SwipeableCartItemProps> = ({
  item,
  language,
  currency,
  isRevealed,
  onRevealChange,
  onUpdateQty,
  onRemove,
  onNavigateProduct,
}) => {
  const isRtl = language === 'ar';
  const reducedMotion = useReducedMotion();
  const rowRef = useRef<HTMLLIElement>(null);
  const isDraggingRef = useRef(false);
  const wasDraggedRef = useRef(false);
  const isRemovingRef = useRef(false);

  const [isCommitReady, setIsCommitReady] = useState(false);

  const x = useMotionValue(0);
  const trailingDist = useTransform(x, (val) => Math.max(0, isRtl ? val : -val));
  const backdropOpacity = useTransform(
    trailingDist,
    [0, 14, CART_SWIPE_CONFIG.revealWidth],
    [0, 0.85, 1]
  );
  const iconScale = useTransform(
    trailingDist,
    [0, CART_SWIPE_CONFIG.revealWidth, CART_SWIPE_CONFIG.minCommitDistance],
    [0.82, 1, 1.1]
  );

  useEffect(() => {
    if (isRemovingRef.current || isDraggingRef.current) return;
    const targetX = getCartSwipeSnapX(isRevealed ? 'revealed' : 'closed', isRtl);
    const controls = animate(
      x,
      targetX,
      reducedMotion
        ? { duration: 0.08 }
        : { type: 'spring', stiffness: 460, damping: 38, mass: 0.9 }
    );
    if (!isRevealed) {
      setIsCommitReady(false);
    }
    return () => controls.stop();
  }, [isRevealed, isRtl, reducedMotion, x]);

  const commitRemoval = () => {
    if (isRemovingRef.current) return;
    isRemovingRef.current = true;
    const width = rowRef.current?.offsetWidth || 360;
    const exitX = isRtl ? width + 24 : -(width + 24);
    animate(x, exitX, reducedMotion ? { duration: 0.06 } : { duration: 0.18, ease: [0.4, 0, 1, 1] }).then(
      () => {
        onRemove(item);
      }
    );
  };

  const handleDragStart = () => {
    if (isRemovingRef.current) return;
    isDraggingRef.current = true;
    wasDraggedRef.current = false;
    if (!isRevealed) {
      onRevealChange(null);
    }
  };

  const handleDrag = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 6) {
      wasDraggedRef.current = true;
    }
    const width = rowRef.current?.offsetWidth || 340;
    const commitThreshold = getCartSwipeCommitThreshold(width);
    const currentTrailing = isRtl ? x.get() : -x.get();
    const nextReady = currentTrailing >= commitThreshold;
    setIsCommitReady((prev) => (prev === nextReady ? prev : nextReady));
  };

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    isDraggingRef.current = false;
    const width = rowRef.current?.offsetWidth || 340;
    const outcome = resolveCartSwipeOutcome(x.get(), info.velocity.x, isRtl, width);

    if (outcome === 'remove') {
      commitRemoval();
    } else if (outcome === 'revealed') {
      setIsCommitReady(false);
      onRevealChange(item.key);
      animate(
        x,
        getCartSwipeSnapX('revealed', isRtl),
        reducedMotion
          ? { duration: 0.08 }
          : { type: 'spring', stiffness: 460, damping: 38, mass: 0.9 }
      );
    } else {
      setIsCommitReady(false);
      if (isRevealed) onRevealChange(null);
      animate(
        x,
        0,
        reducedMotion
          ? { duration: 0.08 }
          : { type: 'spring', stiffness: 460, damping: 38, mass: 0.9 }
      );
    }

    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(() => {
        wasDraggedRef.current = false;
      });
    } else {
      wasDraggedRef.current = false;
    }
  };

  const atMaxStock = item.quantity >= item.stockCount;

  return (
    <motion.li
      ref={rowRef}
      layout={!reducedMotion}
      initial={reducedMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={
        reducedMotion
          ? { opacity: 0 }
          : { opacity: 0, height: 0, transition: { duration: 0.2, ease: [0.2, 0, 0, 1] } }
      }
      transition={STUDIO_TRANSITION.base}
      data-cart-item-key={item.key}
      className="relative overflow-hidden bg-[var(--ks-surface)] select-none"
    >
      {/* Revealed trailing swipe-to-remove track */}
      <motion.div
        style={{ opacity: backdropOpacity }}
        className={`absolute inset-0 flex items-center justify-end transition-colors duration-150 ${
          isCommitReady
            ? 'bg-[var(--ks-error)] text-[var(--ks-error-text)]'
            : 'bg-[var(--ks-error)]/12 text-[var(--ks-error)]'
        } ${isRevealed ? 'pointer-events-auto' : 'pointer-events-none'}`}
      >
        <button
          type="button"
          tabIndex={isRevealed ? 0 : -1}
          aria-hidden={!isRevealed}
          aria-label={t(language, 'removeItemAria', { name: item.name })}
          onClick={commitRemoval}
          className="h-full min-w-[88px] px-4 flex flex-col items-center justify-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-current"
        >
          <motion.span style={{ scale: iconScale }} className="inline-flex">
            <Trash2 className="w-4 h-4" aria-hidden="true" />
          </motion.span>
          <span className="text-[11px] font-semibold tracking-wide whitespace-nowrap">
            {isCommitReady ? t(language, 'releaseToRemove') : t(language, 'remove')}
          </span>
        </button>
      </motion.div>

      {/* Foreground draggable item card */}
      <motion.div
        drag="x"
        dragDirectionLock
        dragElastic={0.14}
        dragMomentum={false}
        dragConstraints={isRtl ? { left: 0, right: 260 } : { left: -260, right: 0 }}
        style={{ x }}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        onClickCapture={(e) => {
          if (wasDraggedRef.current) {
            e.preventDefault();
            e.stopPropagation();
            wasDraggedRef.current = false;
            return;
          }
          if (isRevealed) {
            e.preventDefault();
            e.stopPropagation();
            onRevealChange(null);
          }
        }}
        className="relative z-10 bg-[var(--ks-surface)] px-6 py-5 flex gap-4 touch-pan-y"
      >
        <button
          type="button"
          onClick={() => onNavigateProduct(item.slug)}
          aria-label={t(language, 'viewItemAria', { name: item.name })}
          className="w-20 h-16 rounded-md overflow-hidden bg-[var(--ks-surface-muted)] shrink-0 cursor-pointer block"
        >
          <ResilientImage
            src={item.image}
            alt={item.name}
            draggable={false}
            className="w-full h-full object-cover"
          />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <button
              type="button"
              onClick={() => onNavigateProduct(item.slug)}
              className="text-sm font-medium text-start text-[var(--ks-text-primary)] hover:text-[var(--ks-accent)] truncate cursor-pointer"
            >
              {item.name}
            </button>
            <button
              type="button"
              onClick={commitRemoval}
              aria-label={t(language, 'removeItemAria', { name: item.name })}
              className="w-10 h-10 -me-2 rounded-md flex items-center justify-center text-[var(--ks-text-muted)] hover:text-[var(--ks-error)] cursor-pointer shrink-0 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-[var(--ks-text-secondary)] mt-0.5">
            {item.color} · {item.size}
          </p>
          <p className="text-[11px] font-mono-num text-[var(--ks-text-muted)] mt-0.5">
            {t(language, 'priceEach', { price: formatCurrency(item.price, currency) })}
            {atMaxStock ? ` · ${t(language, 'maxAvailable', { count: item.stockCount })}` : ''}
          </p>
          <div className="mt-3 flex items-center justify-between gap-3">
            <QuantityStepper
              value={item.quantity}
              min={1}
              max={item.stockCount}
              allowRemoveAtMin
              onChange={(next) => onUpdateQty(item.key, next)}
              itemName={item.name}
              size="sm"
            />
            <span className="text-sm font-mono-num font-medium tabular-nums">
              {formatCurrency(item.price * item.quantity, currency)}
            </span>
          </div>
        </div>
      </motion.div>
    </motion.li>
  );
};
