import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, RotateCcw, ShoppingBag, Tag, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useStore } from '../../context/StoreContext';
import { CartItem } from '../../types/commerce';
import { formatCurrency } from '../../utils/format';
import { t } from '../../utils/i18n';
import { STUDIO_TRANSITION } from '../../utils/motion';
import { Button } from '../ui/Button';
import { Drawer, EmptyState } from '../ui/Primitives';
import { SwipeableCartItem } from './SwipeableCartItem';

interface UndoRemovedEntry {
  item: CartItem;
  index: number;
}

export const CartDrawer: React.FC = () => {
  const {
    language,
    currency,
    shippingConfig,
    cart,
    cartDrawerOpen,
    setCartDrawerOpen,
    updateCartQty,
    removeFromCart,
    restoreCartItem,
    appliedPromo,
    applyPromoCode,
    removePromoCode,
    cartSubtotal,
    cartTax,
    estimatedShipping,
    cartDiscount,
    cartTotal,
    navigate,
    profile,
    openAuthModal,
  } = useStore();

  const [promoInput, setPromoInput] = useState('');
  const [promoFeedback, setPromoFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [revealedItemKey, setRevealedItemKey] = useState<string | null>(null);
  const [undoEntry, setUndoEntry] = useState<UndoRemovedEntry | null>(null);
  const undoTimerRef = useRef<number | null>(null);

  const clearUndoTimer = () => {
    if (undoTimerRef.current !== null && typeof window !== 'undefined') {
      window.clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
  };

  useEffect(() => {
    if (!cartDrawerOpen) {
      setRevealedItemKey(null);
      setUndoEntry(null);
      clearUndoTimer();
    }
  }, [cartDrawerOpen]);

  useEffect(() => () => clearUndoTimer(), []);

  const dhakaThresholdUsd =
    shippingConfig.zones.find((z) => z.zoneId === 'dhaka_metro')?.freeThresholdUsd ?? 120;
  const freeShippingRemaining = Math.max(0, dhakaThresholdUsd - cartSubtotal);

  const handlePromoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = applyPromoCode(promoInput);
    setPromoFeedback({ ok: res.ok, text: res.message });
    if (res.ok) setPromoInput('');
  };

  const handleRemoveWithUndo = (item: CartItem) => {
    const index = cart.findIndex((c) => c.key === item.key);
    setRevealedItemKey((prev) => (prev === item.key ? null : prev));
    removeFromCart(item.key, { silent: true });
    clearUndoTimer();
    setUndoEntry({ item, index: index >= 0 ? index : 0 });
    if (typeof window !== 'undefined') {
      undoTimerRef.current = window.setTimeout(() => {
        setUndoEntry(null);
        undoTimerRef.current = null;
      }, 5500);
    }
  };

  const handleUndoRemove = () => {
    if (!undoEntry) return;
    clearUndoTimer();
    restoreCartItem(undoEntry.item, undoEntry.index);
    setUndoEntry(null);
  };

  const renderUndoBanner = () => (
    <AnimatePresence>
      {undoEntry && (
        <motion.div
          key={`undo-${undoEntry.item.key}`}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={STUDIO_TRANSITION.fast}
          role="status"
          aria-live="polite"
          data-cart-undo-banner="true"
          className="mx-6 mt-3 px-3.5 py-2.5 rounded-[var(--ks-radius-md)] bg-[var(--ks-bg-secondary)] border border-[var(--ks-border-strong)] flex items-center justify-between gap-3"
        >
          <p className="text-xs text-[var(--ks-text-primary)] truncate min-w-0">
            {t(language, 'removedItemUndo', { name: undoEntry.item.name })}
          </p>
          <button
            type="button"
            onClick={handleUndoRemove}
            className="inline-flex items-center gap-1.5 min-h-[36px] px-2.5 -my-1.5 -me-1 rounded-[var(--ks-radius-sm)] text-xs font-semibold text-[var(--ks-accent)] hover:bg-[var(--ks-surface)] cursor-pointer shrink-0 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{t(language, 'undoAction')}</span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <Drawer
      open={cartDrawerOpen}
      onClose={() => setCartDrawerOpen(false)}
      title={`${t(language, 'shoppingBag')} (${cart.reduce((s, i) => s + i.quantity, 0)})`}
      side={language === 'ar' ? 'left' : 'right'}
    >
      {cart.length === 0 ? (
        <div className="flex flex-col min-h-full">
          {renderUndoBanner()}
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon={<ShoppingBag className="w-5 h-5" />}
              title={t(language, 'yourBagEmpty')}
              description={t(language, 'yourBagEmptyDesc')}
              actionLabel={t(language, 'browseProducts')}
              onAction={() => {
                setCartDrawerOpen(false);
                navigate({ name: 'shop', category: 'all' });
              }}
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col min-h-full">
          {/* Free shipping progress */}
          <div className="px-6 py-3.5 bg-[var(--ks-bg)] border-b border-[var(--ks-border)]">
            <p className="text-xs text-[var(--ks-text-secondary)]">
              {freeShippingRemaining === 0
                ? t(language, 'freeShippingQualified')
                : t(language, 'freeShippingRemaining', {
                    amount: formatCurrency(freeShippingRemaining, currency),
                  })}
            </p>
            <div className="mt-2 h-1.5 w-full rounded-full bg-[var(--ks-border)] overflow-hidden">
              <div
                className="h-full bg-[var(--ks-accent)] transition-all duration-300"
                style={{
                  width: `${Math.min(100, (cartSubtotal / dhakaThresholdUsd) * 100)}%`,
                }}
              />
            </div>
            <p className="sm:hidden text-[11px] text-[var(--ks-text-muted)] mt-2">
              {t(language, 'swipeLeftToRemove')}
            </p>
          </div>

          {renderUndoBanner()}

          {/* Swipeable items list */}
          <ul className="flex-1 divide-y divide-[var(--ks-border)]">
            <AnimatePresence initial={false}>
              {cart.map((item) => (
                <SwipeableCartItem
                  key={item.key}
                  item={item}
                  language={language}
                  currency={currency}
                  isRevealed={revealedItemKey === item.key}
                  onRevealChange={setRevealedItemKey}
                  onUpdateQty={updateCartQty}
                  onRemove={handleRemoveWithUndo}
                  onNavigateProduct={(slug) => {
                    setCartDrawerOpen(false);
                    navigate({ name: 'product', slug });
                  }}
                />
              ))}
            </AnimatePresence>
          </ul>

          {/* Summary footer */}
          <div className="p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] border-t border-[var(--ks-border)] bg-[var(--ks-bg)] space-y-4">
            <form onSubmit={handlePromoSubmit} className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  aria-label={t(language, 'promoCode')}
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  placeholder={t(language, 'promoPlaceholder')}
                  className="flex-1 min-w-0 min-h-[44px] px-3 text-base sm:text-xs rounded-md bg-[var(--ks-surface)] border border-[var(--ks-border-strong)] uppercase text-[var(--ks-text-primary)] placeholder:text-[var(--ks-text-muted)]"
                />
                <Button type="submit" variant="outline" size="md">
                  {t(language, 'apply')}
                </Button>
              </div>
              {promoFeedback && (
                <p
                  className={`text-[11px] ${
                    promoFeedback.ok ? 'text-[var(--ks-success)]' : 'text-[var(--ks-error)]'
                  }`}
                >
                  {promoFeedback.text}
                </p>
              )}
              {appliedPromo && (
                <div className="flex items-center justify-between px-2.5 py-1.5 rounded-md bg-[var(--ks-surface-muted)] text-xs">
                  <span className="inline-flex items-center gap-1.5 font-mono-num font-medium">
                    <Tag className="w-3.5 h-3.5 text-[var(--ks-accent)]" />
                    {appliedPromo.code}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      removePromoCode();
                      setPromoFeedback(null);
                    }}
                    aria-label={t(language, 'remove')}
                    className="w-11 h-11 sm:w-8 sm:h-8 rounded flex items-center justify-center text-[var(--ks-text-secondary)] hover:text-[var(--ks-text-primary)] cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </form>

            <div className="space-y-1.5 text-sm">
              <div className="flex items-baseline justify-between gap-4 text-[var(--ks-text-secondary)]">
                <span className="min-w-0">{t(language, 'subtotal')}</span>
                <span className="font-mono-num shrink-0 text-end tabular-nums">
                  {formatCurrency(cartSubtotal, currency)}
                </span>
              </div>
              {cartDiscount > 0 && (
                <div className="flex items-baseline justify-between gap-4 text-[var(--ks-success)]">
                  <span className="min-w-0">
                    {t(language, 'discountCodeLabel', { code: appliedPromo?.code || '' })}
                  </span>
                  <span className="font-mono-num shrink-0 text-end tabular-nums">
                    -{formatCurrency(cartDiscount, currency)}
                  </span>
                </div>
              )}
              <div className="flex items-baseline justify-between gap-4 text-[var(--ks-text-secondary)]">
                <span className="min-w-0">{t(language, 'estimatedTax')}</span>
                <span className="font-mono-num shrink-0 text-end tabular-nums">
                  {formatCurrency(cartTax, currency)}
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-4 text-[var(--ks-text-secondary)]">
                <span className="min-w-0">{t(language, 'estimatedShipping')}</span>
                <span className="font-mono-num shrink-0 text-end tabular-nums">
                  {estimatedShipping === 0
                    ? t(language, 'complimentary')
                    : formatCurrency(estimatedShipping, currency)}
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-4 pt-2 border-t border-[var(--ks-border)] font-semibold">
                <span className="min-w-0">{t(language, 'estimatedTotal')}</span>
                <span className="font-mono-num shrink-0 text-end tabular-nums">
                  {formatCurrency(cartTotal, currency)}
                </span>
              </div>
              <p className="text-[11px] text-[var(--ks-text-muted)] pt-0.5 leading-snug">
                {t(language, 'shippingEstimateNote')}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  setCartDrawerOpen(false);
                  navigate({ name: 'cart' });
                }}
              >
                {t(language, 'viewBag')}
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  setCartDrawerOpen(false);
                  navigate({ name: 'checkout' });
                }}
              >
                <span>{t(language, 'checkout')}</span>
                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </Button>
            </div>

            {!profile.isAuthenticated && (
              <div className="pt-2 border-t border-[var(--ks-border)] text-[11px] text-[var(--ks-text-muted)] leading-snug flex flex-wrap items-center justify-between gap-2">
                <span>{t(language, 'cartGuestSyncHint')}</span>
                <button
                  type="button"
                  onClick={() => {
                    setCartDrawerOpen(false);
                    openAuthModal('signin', { stayOnPage: true });
                  }}
                  className="font-medium text-[var(--ks-accent)] hover:underline cursor-pointer shrink-0"
                >
                  {t(language, 'signIn')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </Drawer>
  );
};
