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
          description="Explore electronics, fashion, home & kitchen, beauty, tools, and wellness across all 10 departments."
          actionLabel="Explore Catalog"
          onAction={() => {
            setCartDrawerOpen(false);
            navigate({ name: 'shop', category: 'all' });
          }}
        />
      ) : (
        <div className="flex flex-col min-h-full">
          {/* Free shipping progress */}
          <div className="px-6 py-3.5 bg-[#F9F8F6] dark:bg-[#141413] border-b border-[#E5E3DD] dark:border-[#2C2C28]">
            <p className="text-xs text-[#5C5B57] dark:text-[#B4B2AC]">
              {freeShippingRemaining === 0
                ? 'Your order qualifies for complimentary Dhaka Metro standard shipping.'
                : `Add ${formatCurrency(freeShippingRemaining, currency)} more for complimentary Dhaka Metro shipping.`}
            </p>
            <div className="mt-2 h-1.5 w-full rounded-full bg-[#E5E3DD] dark:bg-[#2C2C28] overflow-hidden">
              <div
                className="h-full bg-[#8F6438] dark:bg-[#C89B67] transition-all duration-300"
                style={{
                  width: `${Math.min(100, (cartSubtotal / dhakaThresholdUsd) * 100)}%`,
                }}
              />
            </div>
          </div>

          {/* Items list */}
          <ul className="flex-1 divide-y divide-[#E5E3DD] dark:divide-[#2C2C28] px-6">
            {cart.map((item) => (
              <li key={item.key} className="py-5 flex gap-4">
                <ResilientImage
                  src={item.image}
                  alt={item.name}
                  className="w-20 h-16 rounded-md object-cover bg-[#F2F0EC] dark:bg-[#22221F] shrink-0 cursor-pointer"
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
                      className="text-sm font-medium text-left hover:text-[#8F6438] dark:hover:text-[#C89B67] truncate cursor-pointer"
                    >
                      {item.name}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.key)}
                      aria-label={`Remove ${item.name}`}
                      className="w-10 h-10 -mr-2 rounded-md flex items-center justify-center text-[#84827B] hover:text-[#B91C1C] dark:hover:text-[#F87171] cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-[#5C5B57] dark:text-[#A3A19B] mt-0.5">
                    {item.color} · {item.size}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="inline-flex items-center border border-[#DCD9D0] dark:border-[#2E2E2A] rounded-md h-10">
                      <button
                        type="button"
                        onClick={() => updateCartQty(item.key, item.quantity - 1)}
                        aria-label="Decrease quantity"
                        className="w-10 h-full flex items-center justify-center hover:bg-[#F2F0EC] dark:hover:bg-[#22221F] cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-xs font-mono-num">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateCartQty(item.key, item.quantity + 1)}
                        aria-label="Increase quantity"
                        className="w-10 h-full flex items-center justify-center hover:bg-[#F2F0EC] dark:hover:bg-[#22221F] cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="text-sm font-mono-num font-medium">
                      {formatCurrency(item.price * item.quantity, currency)}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {/* Summary footer */}
          <div className="p-6 border-t border-[#E5E3DD] dark:border-[#2C2C28] bg-[#F9F8F6] dark:bg-[#141413] space-y-4">
            <form onSubmit={handlePromoSubmit} className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  aria-label="Promo code"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  placeholder="Promo code (STUDIO15, FREESHIP)"
                  className="flex-1 min-w-0 h-10 px-3 text-xs rounded-md bg-white dark:bg-[#191917] border border-[#E5E3DD] dark:border-[#2C2C28] uppercase"
                />
                <Button type="submit" variant="outline" size="sm">
                  Apply
                </Button>
              </div>
              {promoFeedback && (
                <p
                  className={`text-[11px] ${
                    promoFeedback.ok
                      ? 'text-[#1F6E43] dark:text-[#4ADE80]'
                      : 'text-[#B91C1C] dark:text-[#F87171]'
                  }`}
                >
                  {promoFeedback.text}
                </p>
              )}
              {appliedPromo && (
                <div className="flex items-center justify-between px-2.5 py-1.5 rounded-md bg-[#F2F0EC] dark:bg-[#22221F] text-xs">
                  <span className="inline-flex items-center gap-1.5 font-mono-num font-medium">
                    <Tag className="w-3.5 h-3.5 text-[#8F6438] dark:text-[#C89B67]" />
                    {appliedPromo.code}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      removePromoCode();
                      setPromoFeedback(null);
                    }}
                    aria-label="Remove promo code"
                    className="w-8 h-8 rounded flex items-center justify-center text-[#5C5B57] hover:text-[#171716] dark:hover:text-[#F4F3EF] cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </form>

            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-[#5C5B57] dark:text-[#A3A19B]">
                <span>Subtotal</span>
                <span className="font-mono-num">{formatCurrency(cartSubtotal, currency)}</span>
              </div>
              {cartDiscount > 0 && (
                <div className="flex justify-between text-[#1F6E43] dark:text-[#4ADE80]">
                  <span>Discount ({appliedPromo?.code})</span>
                  <span className="font-mono-num">-{formatCurrency(cartDiscount, currency)}</span>
                </div>
              )}
              <div className="flex justify-between text-[#5C5B57] dark:text-[#A3A19B]">
                <span>Estimated Tax (5%)</span>
                <span className="font-mono-num">{formatCurrency(cartTax, currency)}</span>
              </div>
              <div className="flex justify-between text-[#5C5B57] dark:text-[#A3A19B]">
                <span>Estimated Shipping</span>
                <span className="font-mono-num">
                  {estimatedShipping === 0
                    ? 'Complimentary'
                    : formatCurrency(estimatedShipping, currency)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#E5E3DD] dark:border-[#2C2C28] font-semibold">
                <span>Estimated Total</span>
                <span className="font-mono-num">{formatCurrency(cartTotal, currency)}</span>
              </div>
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
