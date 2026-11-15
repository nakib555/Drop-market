import React, { useState } from 'react';
import { ArrowRight, Minus, Plus, ShoppingBag, Tag, Trash2, X } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { formatCurrency } from '../../utils/format';
import { Button } from '../ui/Button';
import { Drawer, EmptyState, ResilientImage } from '../ui/Primitives';

export const CartDrawer: React.FC = () => {
  const {
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
      title={`Shopping Bag (${cart.reduce((s, i) => s + i.quantity, 0)})`}
    >
      {cart.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="w-5 h-5" />}
          title="Your bag is empty"
          description="Explore Electronics, Fashion, Home, Beauty, Sports, Books, and more."
          actionLabel="Browse Products"
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
                ? 'Your order qualifies for complimentary Dhaka Metro standard shipping.'
                : `Add ${formatCurrency(freeShippingRemaining, currency)} more for complimentary Dhaka Metro shipping.`}
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
                  <ResilientImage
                    src={item.image}
                    alt={item.name}
                    className="w-20 h-16 rounded-md object-cover bg-[var(--ks-surface-muted)] shrink-0 cursor-pointer"
                    onClick={() => {
                      setCartDrawerOpen(false);
                      navigate({ name: 'product', slug: item.slug });
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCartDrawerOpen(false);
                          navigate({ name: 'product', slug: item.slug });
                        }}
                        className="text-sm font-medium text-left text-[var(--ks-text-primary)] hover:text-[var(--ks-accent)] truncate cursor-pointer"
                      >
                        {item.name}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.key)}
                        aria-label={`Remove ${item.name}`}
                        className="w-10 h-10 -mr-2 rounded-md flex items-center justify-center text-[var(--ks-text-muted)] hover:text-[var(--ks-error)] cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-[var(--ks-text-secondary)] mt-0.5">
                      {item.color} · {item.size}
                    </p>
                    <p className="text-[11px] font-mono-num text-[var(--ks-text-muted)] mt-0.5">
                      {formatCurrency(item.price, currency)} each
                      {atMaxStock ? ` · Max ${item.stockCount} available` : ''}
                    </p>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="inline-flex items-center border border-[var(--ks-border-strong)] rounded-md h-10 bg-[var(--ks-surface)]">
                        <button
                          type="button"
                          onClick={() => updateCartQty(item.key, item.quantity - 1)}
                          aria-label={item.quantity <= 1 ? `Remove ${item.name}` : 'Decrease quantity'}
                          className="w-10 h-full flex items-center justify-center hover:bg-[var(--ks-surface-muted)] cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center text-xs font-mono-num tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          disabled={atMaxStock}
                          onClick={() => updateCartQty(item.key, item.quantity + 1)}
                          aria-label="Increase quantity"
                          className="w-10 h-full flex items-center justify-center hover:bg-[var(--ks-surface-muted)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
          <div className="p-6 border-t border-[var(--ks-border)] bg-[var(--ks-bg)] space-y-4">
            <form onSubmit={handlePromoSubmit} className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  aria-label="Promo code"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  placeholder="Promo code (STUDIO15, FREESHIP)"
                  className="flex-1 min-w-0 h-10 px-3 text-xs rounded-md bg-[var(--ks-surface)] border border-[var(--ks-border)] uppercase text-[var(--ks-text-primary)] placeholder:text-[var(--ks-text-muted)]"
                />
                <Button type="submit" variant="outline" size="sm">
                  Apply
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
                    aria-label="Remove promo code"
                    className="w-8 h-8 rounded flex items-center justify-center text-[var(--ks-text-secondary)] hover:text-[var(--ks-text-primary)] cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </form>

            <div className="space-y-1.5 text-sm">
              <div className="flex items-baseline justify-between gap-4 text-[var(--ks-text-secondary)]">
                <span className="min-w-0">Subtotal</span>
                <span className="font-mono-num shrink-0 text-right">
                  {formatCurrency(cartSubtotal, currency)}
                </span>
              </div>
              {cartDiscount > 0 && (
                <div className="flex items-baseline justify-between gap-4 text-[var(--ks-success)]">
                  <span className="min-w-0">Discount ({appliedPromo?.code})</span>
                  <span className="font-mono-num shrink-0 text-right">
                    -{formatCurrency(cartDiscount, currency)}
                  </span>
                </div>
              )}
              <div className="flex items-baseline justify-between gap-4 text-[var(--ks-text-secondary)]">
                <span className="min-w-0">Estimated Tax (5%)</span>
                <span className="font-mono-num shrink-0 text-right">
                  {formatCurrency(cartTax, currency)}
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-4 text-[var(--ks-text-secondary)]">
                <span className="min-w-0">Estimated Shipping</span>
                <span className="font-mono-num shrink-0 text-right">
                  {estimatedShipping === 0
                    ? 'Complimentary'
                    : formatCurrency(estimatedShipping, currency)}
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-4 pt-2 border-t border-[var(--ks-border)] font-semibold">
                <span className="min-w-0">Estimated Total</span>
                <span className="font-mono-num shrink-0 text-right">
                  {formatCurrency(cartTotal, currency)}
                </span>
              </div>
              <p className="text-[11px] text-[var(--ks-text-muted)] pt-0.5 leading-snug">
                Shipping and VAT are confirmed by delivery zone at checkout.
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
                View Bag
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  setCartDrawerOpen(false);
                  navigate({ name: 'checkout' });
                }}
              >
                <span>Checkout</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </Drawer>
  );
};
