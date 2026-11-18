import React, { useState } from 'react';
import { ArrowRight, ShoppingBag, Tag, Trash2, X } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { formatCurrency } from '../../utils/format';
import { t } from '../../utils/i18n';
import { QuantityStepper } from '../product/CommercePrimitives';
import { Button } from '../ui/Button';
import { Drawer, EmptyState, ResilientImage } from '../ui/Primitives';

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

  const dhakaThresholdUsd =
    shippingConfig.zones.find((z) => z.zoneId === 'dhaka_metro')?.freeThresholdUsd ?? 120;
  const freeShippingRemaining = Math.max(0, dhakaThresholdUsd - cartSubtotal);

  const handlePromoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = applyPromoCode(promoInput);
    setPromoFeedback({ ok: res.ok, text: res.message });
    if (res.ok) setPromoInput('');
  };

  return (
    <Drawer
      open={cartDrawerOpen}
      onClose={() => setCartDrawerOpen(false)}
      title={`${t(language, 'shoppingBag')} (${cart.reduce((s, i) => s + i.quantity, 0)})`}
      side={language === 'ar' ? 'left' : 'right'}
    >
      {cart.length === 0 ? (
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
          </div>

          {/* Items list */}
          <ul className="flex-1 divide-y divide-[var(--ks-border)] px-6">
            {cart.map((item) => {
              const atMaxStock = item.quantity >= item.stockCount;
              return (
                <li key={item.key} className="py-5 flex gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setCartDrawerOpen(false);
                      navigate({ name: 'product', slug: item.slug });
                    }}
                    aria-label={t(language, 'viewItemAria', { name: item.name })}
                    className="w-20 h-16 rounded-md overflow-hidden bg-[var(--ks-surface-muted)] shrink-0 cursor-pointer block"
                  >
                    <ResilientImage
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCartDrawerOpen(false);
                          navigate({ name: 'product', slug: item.slug });
                        }}
                        className="text-sm font-medium text-start text-[var(--ks-text-primary)] hover:text-[var(--ks-accent)] truncate cursor-pointer"
                      >
                        {item.name}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.key)}
                        aria-label={t(language, 'removeItemAria', { name: item.name })}
                        className="w-10 h-10 -me-2 rounded-md flex items-center justify-center text-[var(--ks-text-muted)] hover:text-[var(--ks-error)] cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-[var(--ks-text-secondary)] mt-0.5">
                      {item.color} · {item.size}
                    </p>
                    <p className="text-[11px] font-mono-num text-[var(--ks-text-muted)] mt-0.5">
                      {t(language, 'priceEach', { price: formatCurrency(item.price, currency) })}
                      {atMaxStock
                        ? ` · ${t(language, 'maxAvailable', { count: item.stockCount })}`
                        : ''}
                    </p>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <QuantityStepper
                        value={item.quantity}
                        min={1}
                        max={item.stockCount}
                        allowRemoveAtMin
                        onChange={(next) => updateCartQty(item.key, next)}
                        itemName={item.name}
                        size="sm"
                      />
                      <span className="text-sm font-mono-num font-medium tabular-nums">
                        {formatCurrency(item.price * item.quantity, currency)}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
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
