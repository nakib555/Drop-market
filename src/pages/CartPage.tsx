import React, { useState } from 'react';
import { ArrowRight, Bookmark, Minus, Plus, ShoppingBag, Tag, Trash2, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatCurrency } from '../utils/format';
import { Button } from '../components/ui/Button';
import { Breadcrumb, EmptyState, ResilientImage } from '../components/ui/Primitives';

export const CartPage: React.FC = () => {
  const {
    currency,
    cart,
    savedForLater,
    updateCartQty,
    removeFromCart,
    saveItemForLater,
    moveSavedToCart,
    removeSavedItem,
    appliedPromo,
    applyPromoCode,
    removePromoCode,
    cartSubtotal,
    cartDiscount,
    cartTax,
    estimatedShipping,
    cartTotal,
    navigate,
  } = useStore();

  const [couponInput, setCouponInput] = useState('');
  const [couponMessage, setCouponMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const handleCouponSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = applyPromoCode(couponInput);
    setCouponMessage({ ok: res.ok, text: res.message });
    if (res.ok) setCouponInput('');
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-12 space-y-10">
      <Breadcrumb
        items={[
          { label: 'Home', onClick: () => navigate({ name: 'home' }) },
          { label: 'Shopping Bag' },
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[var(--ks-border)]">
        <h1 className="font-display text-3xl sm:text-5xl font-medium">Shopping Bag</h1>
        <button
          type="button"
          onClick={() => navigate({ name: 'shop', category: 'all' })}
          className="self-start sm:self-auto text-left text-sm font-medium text-[var(--ks-text-secondary)] hover:text-[var(--ks-text-primary)] cursor-pointer"
        >
          Continue Shopping
        </button>
      </div>

      {cart.length === 0 ? (
        <div className="rounded-lg bg-[var(--ks-surface)] border border-[var(--ks-border)]">
          <EmptyState
            icon={<ShoppingBag className="w-6 h-6" />}
            title="Your shopping bag is currently empty"
            description="Browse Electronics, Fashion, Home & Kitchen, Beauty, Sports, Books, and everyday essentials across all departments."
            actionLabel="Browse Products"
            onAction={() => navigate({ name: 'shop', category: 'all' })}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Bag Items */}
          <div className="lg:col-span-8 space-y-4">
            <div className="rounded-lg bg-[var(--ks-surface)] border border-[var(--ks-border)] divide-y divide-[var(--ks-border)]">
              {cart.map((item) => {
                const atMaxStock = item.quantity >= item.stockCount;
                return (
                  <div key={item.key} className="p-4 sm:p-6 flex flex-col sm:flex-row gap-5">
                    <ResilientImage
                      src={item.image}
                      alt={item.name}
                      onClick={() => navigate({ name: 'product', slug: item.slug })}
                      className="w-full sm:w-36 aspect-[4/3] rounded-md object-cover bg-[var(--ks-surface-muted)] shrink-0 cursor-pointer"
                    />

                    <div className="flex-1 flex flex-col justify-between gap-4 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-xs uppercase tracking-wider text-[var(--ks-text-muted)]">
                            {item.brand}
                          </p>
                          <h3
                            onClick={() => navigate({ name: 'product', slug: item.slug })}
                            className="text-base font-semibold mt-0.5 cursor-pointer hover:text-[var(--ks-accent)]"
                          >
                            {item.name}
                          </h3>
                          <p className="text-xs text-[var(--ks-text-secondary)] mt-1 flex items-center gap-2">
                            <span
                              className="inline-block w-3 h-3 rounded-full border border-black/15 shrink-0"
                              style={{ backgroundColor: item.colorHex }}
                            />
                            <span>
                              {item.color} · {item.size}
                            </span>
                          </p>
                          <p className="text-xs font-mono-num text-[var(--ks-text-muted)] mt-1">
                            {formatCurrency(item.price, currency)} each
                            {atMaxStock ? ` · Max ${item.stockCount} available` : ''}
                          </p>
                        </div>
                        <span className="text-base font-mono-num font-semibold shrink-0 tabular-nums">
                          {formatCurrency(item.price * item.quantity, currency)}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                        <div className="inline-flex items-center border border-[var(--ks-border-strong)] rounded-md h-10 bg-[var(--ks-surface)]">
                          <button
                            type="button"
                            onClick={() => updateCartQty(item.key, item.quantity - 1)}
                            aria-label={item.quantity <= 1 ? `Remove ${item.name}` : 'Decrease quantity'}
                            className="w-10 h-full flex items-center justify-center hover:bg-[var(--ks-surface-muted)] cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-9 text-center text-xs font-mono-num tabular-nums">
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

                        <div className="flex items-center gap-3 text-xs">
                          <button
                            type="button"
                            onClick={() => saveItemForLater(item.key)}
                            className="inline-flex items-center gap-1.5 min-h-[36px] py-1.5 px-1 text-[var(--ks-text-secondary)] hover:text-[var(--ks-text-primary)] cursor-pointer"
                          >
                            <Bookmark className="w-3.5 h-3.5" />
                            <span>Save for later</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.key)}
                            className="inline-flex items-center gap-1.5 min-h-[36px] py-1.5 px-1 text-[var(--ks-text-secondary)] hover:text-[var(--ks-error)] cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Order Summary & Promo Code */}
          <aside className="lg:col-span-4 lg:sticky lg:top-28 p-6 rounded-lg bg-[var(--ks-surface)] border border-[var(--ks-border)] space-y-6">
            <h2 className="font-display text-2xl font-medium">Order Summary</h2>

            <form onSubmit={handleCouponSubmit} className="space-y-2">
              <label htmlFor="coupon-code" className="text-xs font-medium block">
                Promo Code
              </label>
              <div className="flex flex-col min-[360px]:flex-row gap-2">
                <input
                  id="coupon-code"
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="Try STUDIO15 or FREESHIP"
                  className="flex-1 min-w-0 h-10 px-3 text-sm rounded-md bg-[var(--ks-bg)] border border-[var(--ks-border)] uppercase text-[var(--ks-text-primary)] placeholder:text-[var(--ks-text-muted)]"
                />
                <Button type="submit" variant="outline" size="sm">
                  Apply
                </Button>
              </div>
              {couponMessage && (
                <p
                  className={`text-xs ${
                    couponMessage.ok ? 'text-[var(--ks-success)]' : 'text-[var(--ks-error)]'
                  }`}
                >
                  {couponMessage.text}
                </p>
              )}
              {appliedPromo && (
                <div className="flex items-center justify-between px-3 py-2 rounded-md bg-[var(--ks-surface-muted)] text-xs">
                  <span className="inline-flex items-center gap-1.5 font-mono-num font-medium">
                    <Tag className="w-3.5 h-3.5 text-[var(--ks-accent)]" />
                    {appliedPromo.code}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      removePromoCode();
                      setCouponMessage(null);
                    }}
                    aria-label="Remove promo code"
                    className="w-8 h-8 rounded flex items-center justify-center text-[var(--ks-text-secondary)] hover:text-[var(--ks-text-primary)] cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </form>

            <div className="space-y-2.5 text-sm pt-4 border-t border-[var(--ks-border)]">
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
              <div className="flex items-baseline justify-between gap-4 pt-3 border-t border-[var(--ks-border)] text-base font-semibold">
                <span className="min-w-0">Estimated Total</span>
                <span className="font-mono-num shrink-0 text-right">
                  {formatCurrency(cartTotal, currency)}
                </span>
              </div>
              <p className="text-xs text-[var(--ks-text-muted)] pt-1 leading-relaxed">
                Shipping and VAT are estimated for Dhaka Metro and confirmed by delivery zone at checkout.
              </p>
            </div>

            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => navigate({ name: 'checkout' })}
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </aside>
        </div>
      )}

      {/* Saved For Later */}
      {savedForLater.length > 0 && (
        <section className="pt-10 border-t border-[var(--ks-border)] space-y-6">
          <h2 className="font-display text-3xl font-medium">
            Saved for Later ({savedForLater.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {savedForLater.map((item) => (
              <div
                key={item.key}
                className="p-4 rounded-lg bg-[var(--ks-surface)] border border-[var(--ks-border)] flex gap-4"
              >
                <ResilientImage
                  src={item.image}
                  alt={item.name}
                  className="w-20 h-16 rounded-md object-cover bg-[var(--ks-surface-muted)] shrink-0"
                />
                <div className="flex-1 min-w-0 space-y-2">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <p className="text-xs text-[var(--ks-text-secondary)] font-mono-num">
                    {formatCurrency(item.price, currency)}
                  </p>
                  <div className="flex items-center gap-3 pt-1">
                    <Button variant="outline" size="xs" onClick={() => moveSavedToCart(item.key)}>
                      Move to Bag
                    </Button>
                    <button
                      type="button"
                      onClick={() => removeSavedItem(item.key)}
                      className="text-xs text-[var(--ks-text-muted)] hover:text-[var(--ks-error)] cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
