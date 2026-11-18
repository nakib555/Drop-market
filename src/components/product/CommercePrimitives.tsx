import React from 'react';
import { Heart, Loader2, Minus, Plus, Star } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { CurrencyCode } from '../../types/commerce';
import { formatCurrency, getDiscountPercent } from '../../utils/format';
import { t } from '../../utils/i18n';

interface PriceDisplayProps {
  price: number;
  originalPrice?: number;
  currency: CurrencyCode;
  size?: 'sm' | 'md' | 'lg';
  showSavings?: boolean;
  className?: string;
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({
  price,
  originalPrice,
  currency,
  size = 'md',
  showSavings = false,
  className = '',
}) => {
  const { language } = useStore();
  const discount = getDiscountPercent(price, originalPrice);
  const hasDiscount = Boolean(originalPrice && originalPrice > price && discount > 0);

  const primaryClass =
    size === 'lg'
      ? 'text-2xl sm:text-3xl font-mono-num font-semibold tabular-nums text-[var(--ks-text-primary)]'
      : size === 'sm'
      ? 'text-[15px] font-mono-num font-semibold tabular-nums text-[var(--ks-text-primary)]'
      : 'text-base sm:text-xl font-mono-num font-semibold tabular-nums text-[var(--ks-text-primary)]';

  const compareClass =
    size === 'lg'
      ? 'text-base font-mono-num line-through text-[var(--ks-text-muted)] tabular-nums'
      : size === 'sm'
      ? 'text-[11px] font-mono-num line-through text-[var(--ks-text-muted)] tabular-nums'
      : 'text-xs font-mono-num line-through text-[var(--ks-text-muted)] tabular-nums';

  return (
    <div className={`flex flex-wrap items-baseline gap-x-2 gap-y-0.5 min-w-0 ${className}`}>
      <span className={primaryClass}>{formatCurrency(price, currency)}</span>
      {hasDiscount && originalPrice !== undefined && (
        <>
          <span className={compareClass}>{formatCurrency(originalPrice, currency)}</span>
          {showSavings && (
            <span className="text-xs font-mono-num font-medium text-[var(--ks-accent)]">
              {t(language, 'savePercent', { percent: discount })}
            </span>
          )}
        </>
      )}
    </div>
  );
};

interface RatingSummaryProps {
  rating?: number;
  reviewCount?: number;
  compact?: boolean;
  showCount?: boolean;
  fallbackLabel?: string | null;
  onClick?: () => void;
  className?: string;
}

export const RatingSummary: React.FC<RatingSummaryProps> = ({
  rating,
  reviewCount,
  compact = false,
  showCount = true,
  fallbackLabel = null,
  onClick,
  className = '',
}) => {
  const { language } = useStore();
  const hasVerifiedRatings =
    typeof rating === 'number' &&
    rating > 0 &&
    typeof reviewCount === 'number' &&
    reviewCount > 0;

  if (!hasVerifiedRatings) {
    if (!fallbackLabel) return null;
    if (onClick) {
      return (
        <button
          type="button"
          onClick={onClick}
          className={`text-xs text-[var(--ks-text-secondary)] hover:underline cursor-pointer ${className}`}
        >
          {fallbackLabel}
        </button>
      );
    }
    return (
      <span className={`text-xs text-[var(--ks-text-muted)] ${className}`}>
        {fallbackLabel}
      </span>
    );
  }

  const content = (
    <>
      <Star
        className={`${
          compact ? 'w-3 h-3' : 'w-3.5 h-3.5'
        } fill-[var(--ks-accent)] text-[var(--ks-accent)] translate-y-[-0.5px] shrink-0`}
      />
      <span>{rating.toFixed(1)}</span>
      {showCount && (
        <span className="text-[var(--ks-text-secondary)]">
          {compact
            ? `(${reviewCount})`
            : t(language, reviewCount === 1 ? 'reviewCountSingle' : 'reviewCountPlural', {
                count: reviewCount ?? 0,
              })}
        </span>
      )}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1 text-xs font-mono-num text-[var(--ks-text-primary)] hover:underline cursor-pointer ${className}`}
      >
        {content}
      </button>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-mono-num text-[var(--ks-text-secondary)] ${className}`}
    >
      {content}
    </span>
  );
};

interface QuantityStepperProps {
  value: number;
  min?: number;
  max?: number;
  disabled?: boolean;
  allowRemoveAtMin?: boolean;
  onChange: (nextValue: number) => void;
  itemName?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const QuantityStepper: React.FC<QuantityStepperProps> = ({
  value,
  min = 1,
  max,
  disabled = false,
  allowRemoveAtMin = false,
  onChange,
  itemName,
  size = 'md',
  className = '',
}) => {
  const atMin = !allowRemoveAtMin && value <= min;
  const atMax = typeof max === 'number' && value >= Math.max(min, max);

  const heightClass = size === 'lg' ? 'h-12' : size === 'sm' ? 'h-11 sm:h-10' : 'h-11';
  const btnWidthClass = size === 'lg' ? 'w-11 min-[430px]:w-10' : 'w-11 sm:w-10';

  return (
    <div
      className={`inline-flex items-center justify-between border border-[var(--ks-border-strong)] bg-[var(--ks-surface)] rounded-[var(--ks-radius-md)] shrink-0 ${heightClass} ${className}`}
    >
      <button
        type="button"
        disabled={disabled || atMin}
        onClick={() => onChange(allowRemoveAtMin ? value - 1 : Math.max(min, value - 1))}
        aria-label={
          allowRemoveAtMin && value <= 1 && itemName
            ? `Remove ${itemName}`
            : itemName
            ? `Decrease ${itemName} quantity`
            : 'Decrease quantity'
        }
        className={`${btnWidthClass} h-full flex items-center justify-center hover:bg-[var(--ks-surface-muted)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer`}
      >
        <Minus className="w-3.5 h-3.5" />
      </button>
      <span className="w-9 text-center text-xs sm:text-sm font-mono-num tabular-nums">
        {disabled ? 0 : value}
      </span>
      <button
        type="button"
        disabled={disabled || atMax}
        onClick={() =>
          onChange(typeof max === 'number' ? Math.min(Math.max(min, max), value + 1) : value + 1)
        }
        aria-label={itemName ? `Increase ${itemName} quantity` : 'Increase quantity'}
        className={`${btnWidthClass} h-full flex items-center justify-center hover:bg-[var(--ks-surface-muted)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer`}
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

interface WishlistButtonProps {
  active: boolean;
  pending?: boolean;
  onToggle: (e: React.MouseEvent<HTMLButtonElement>) => void;
  productName: string;
  variant?: 'icon' | 'overlay' | 'full';
  className?: string;
}

export const WishlistButton: React.FC<WishlistButtonProps> = ({
  active,
  pending = false,
  onToggle,
  productName,
  variant = 'icon',
  className = '',
}) => {
  const { language } = useStore();
  const label = active
    ? `Remove ${productName} from wishlist`
    : `Save ${productName} to wishlist`;

  if (variant === 'full') {
    return (
      <button
        type="button"
        disabled={pending}
        aria-busy={pending}
        onClick={onToggle}
        aria-pressed={active}
        aria-label={label}
        className={`inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 rounded-[var(--ks-radius-md)] border text-xs font-medium tracking-wide transition-colors disabled:opacity-60 cursor-pointer ${
          active
            ? 'border-[var(--ks-accent)] text-[var(--ks-accent)] bg-[var(--ks-surface-muted)]'
            : 'border-[var(--ks-border-strong)] bg-transparent text-[var(--ks-text-primary)] hover:bg-[var(--ks-surface-muted)]'
        } ${className}`}
      >
        {pending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Heart className={`w-4 h-4 ${active ? 'fill-current text-[var(--ks-accent)]' : ''}`} />
        )}
        <span>{active ? t(language, 'saved') : t(language, 'wishlist')}</span>
      </button>
    );
  }

  if (variant === 'overlay') {
    return (
      <button
        type="button"
        disabled={pending}
        aria-busy={pending}
        onClick={onToggle}
        aria-pressed={active}
        aria-label={label}
        className={`pointer-events-auto w-11 h-11 sm:w-9 sm:h-9 rounded-[var(--ks-radius-md)] flex items-center justify-center border transition-[color,background-color,transform] duration-[var(--ks-duration-fast)] active:scale-[0.88] disabled:opacity-60 cursor-pointer ${
          active
            ? 'bg-[var(--ks-action)] text-[var(--ks-action-text)] border-[var(--ks-action)]'
            : 'bg-[var(--ks-surface)]/95 text-[var(--ks-text-primary)] border-[var(--ks-border)] hover:bg-[var(--ks-surface)]'
        } ${className}`}
      >
        {pending ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Heart className={`w-3.5 h-3.5 ${active ? 'fill-current' : ''}`} />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={pending}
      aria-busy={pending}
      onClick={onToggle}
      aria-pressed={active}
      aria-label={label}
      className={`w-11 h-11 sm:w-10 sm:h-10 rounded-[var(--ks-radius-md)] border flex items-center justify-center shrink-0 transition-colors disabled:opacity-60 cursor-pointer ${
        active
          ? 'border-[var(--ks-accent)] text-[var(--ks-accent)]'
          : 'border-[var(--ks-border-strong)] text-[var(--ks-text-secondary)] hover:text-[var(--ks-text-primary)] hover:border-[var(--ks-action)]'
      } ${className}`}
    >
      {pending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Heart className={`w-4 h-4 ${active ? 'fill-current' : ''}`} />
      )}
    </button>
  );
};
