import React, { useEffect, useState } from 'react';
import { Check, PackageSearch, RotateCcw, Truck, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { trackOrderApi } from '../services/api';
import { Order } from '../types/commerce';
import { formatCurrency, formatDirectCurrency } from '../utils/format';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/FormFields';
import { Breadcrumb } from '../components/ui/Primitives';

export const OrderTrackingPage: React.FC = () => {
  const { currency, route, orders, navigate } = useStore();
  const [orderIdInput, setOrderIdInput] = useState(route.orderId || orders[0]?.id || '');
  const [contactVerify, setContactVerify] = useState('');
  const [lookupError, setLookupError] = useState('');
  const [loadingLookup, setLoadingLookup] = useState(false);
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(() => {
    if (route.orderId) {
      return orders.find((o) => o.id.toLowerCase() === route.orderId?.toLowerCase()) || null;
    }
    return orders[0] || null;
  });

  useEffect(() => {
    if (route.orderId) {
      setOrderIdInput(route.orderId);
      setLookupError('');
      const localMatch = orders.find(
        (o) => o.id.toLowerCase() === route.orderId?.toLowerCase()
      );
      if (localMatch) {
        setTrackedOrder(localMatch);
      } else {
        setLoadingLookup(true);
        trackOrderApi(route.orderId)
          .then((ord) => setTrackedOrder(ord))
          .catch((err) => {
            setTrackedOrder(null);
            setLookupError(err instanceof Error ? err.message : 'Unable to locate this order.');
          })
          .finally(() => setLoadingLookup(false));
      }
    }
  }, [route.orderId, orders]);

  const handleTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = orderIdInput.trim();
    if (!cleanId) {
      setLookupError('Please enter an Order Number (e.g. KS-10482).');
      return;
    }

    setLookupError('');
    setLoadingLookup(true);
    try {
      const remoteOrder = await trackOrderApi(cleanId, contactVerify.trim() || undefined);
      setTrackedOrder(remoteOrder);
    } catch (err) {
      const localFound = orders.find((o) => o.id.toLowerCase() === cleanId.toLowerCase());
      if (localFound) {
        if (
          contactVerify.trim() &&
          localFound.email.toLowerCase() !== contactVerify.trim().toLowerCase() &&
          !localFound.phone.includes(contactVerify.trim())
        ) {
          setLookupError('Verification email or phone does not match this order record.');
          setTrackedOrder(null);
        } else {
          setTrackedOrder(localFound);
        }
      } else {
        setTrackedOrder(null);
        setLookupError(
          err instanceof Error
            ? err.message
            : `No order found matching "${cleanId}". Verify your Order Number and contact email/phone.`
        );
      }
    } finally {
      setLoadingLookup(false);
    }
  };

  return (
    <div className="ks-container py-8 lg:py-12 space-y-10">
      <Breadcrumb
        items={[
          { label: 'Home', onClick: () => navigate({ name: 'home' }) },
          { label: 'Order Tracking' },
        ]}
      />

      <div className="max-w-2xl space-y-2">
        <p className="ks-eyebrow text-[var(--ks-accent)]">
          Logistics &amp; Courier Status
        </p>
        <h1 className="font-display text-3xl sm:text-5xl font-medium">Track Your Order</h1>
        <p className="text-sm text-[var(--ks-text-secondary)]">
          Enter your Kinto Studio order number to view live fulfillment milestones, Bangladesh courier details, and delivery estimates.
        </p>
      </div>

      {/* Lookup Form */}
      <div className="p-6 sm:p-8 rounded-[var(--ks-radius-lg)] bg-[var(--ks-surface)] border border-[var(--ks-border)] space-y-5">
        <form onSubmit={handleTrackSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-5">
            <Input
              label="Order Number"
              required
              value={orderIdInput}
              onChange={(e) => setOrderIdInput(e.target.value)}
              placeholder="KS-10482"
            />
          </div>
          <div className="md:col-span-5">
            <Input
              label="Email or Phone Verification (Optional)"
              value={contactVerify}
              onChange={(e) => setContactVerify(e.target.value)}
              placeholder="buyer@example.com or +880 17XX-XXXXXX"
            />
          </div>
          <div className="md:col-span-2">
            <Button type="submit" variant="primary" size="md" fullWidth disabled={loadingLookup}>
              {loadingLookup ? 'Checking...' : 'Track'}
            </Button>
          </div>
        </form>

        {lookupError && (
          <p className="text-xs text-[var(--ks-error)]" role="alert">
            {lookupError}
          </p>
        )}

        {orders.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[var(--ks-border)] text-xs">
            <span className="text-[var(--ks-text-muted)]">Your recent orders:</span>
            {orders.slice(0, 4).map((ord) => (
              <button
                key={ord.id}
                type="button"
                onClick={() => {
                  setOrderIdInput(ord.id);
                  setTrackedOrder(ord);
                  setLookupError('');
                }}
                className={`px-2.5 py-1 rounded-[var(--ks-radius-md)] font-mono-num border cursor-pointer transition-colors ${
                  trackedOrder?.id === ord.id
                    ? 'bg-[var(--ks-action)] text-[var(--ks-action-text)] border-[var(--ks-action)]'
                    : 'border-[var(--ks-border)] hover:border-[var(--ks-border-strong)]'
                }`}
              >
                #{ord.id} ({ord.currentStage})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Visual Progress Timeline */}
      {trackedOrder ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 p-6 sm:p-8 rounded-[var(--ks-radius-lg)] bg-[var(--ks-surface)] border border-[var(--ks-border)] space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-[var(--ks-border)]">
              <div>
                <p className="text-xs text-[var(--ks-text-muted)] font-mono-num">
                  ORDER #{trackedOrder.id}
                </p>
                <h2 className="font-display text-2xl sm:text-3xl font-medium mt-0.5">
                  Current Status:{' '}
                  <span
                    className={
                      trackedOrder.currentStage === 'Cancelled'
                        ? 'text-[var(--ks-error)]'
                        : trackedOrder.currentStage === 'Return Requested'
                        ? 'text-[var(--ks-warning)]'
                        : ''
                    }
                  >
                    {trackedOrder.currentStage}
                  </span>
                </h2>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-xs text-[var(--ks-text-muted)]">
                  {trackedOrder.currentStage === 'Cancelled'
                    ? 'Order Status'
                    : trackedOrder.currentStage === 'Return Requested'
                    ? 'Return RMA'
                    : 'Estimated Delivery'}
                </p>
                <p
                  className={`text-sm font-semibold ${
                    trackedOrder.currentStage === 'Cancelled'
                      ? 'text-[var(--ks-error)]'
                      : trackedOrder.currentStage === 'Return Requested'
                      ? 'text-[var(--ks-warning)]'
                      : 'text-[var(--ks-accent)]'
                  }`}
                >
                  {trackedOrder.estimatedArrival}
                </p>
              </div>
            </div>

            <ol className="space-y-6">
              {trackedOrder.timeline.map((event, index) => {
                const isCancelledEvent = event.stage === 'Cancelled';
                const isReturnEvent = event.stage === 'Return Requested';
                const markerClass = isCancelledEvent
                  ? 'bg-[var(--ks-error)] border-[var(--ks-error)] text-white'
                  : isReturnEvent
                  ? 'bg-[var(--ks-warning)] border-[var(--ks-warning)] text-white'
                  : event.completed
                  ? 'bg-[var(--ks-action)] border-[var(--ks-action)] text-[var(--ks-action-text)]'
                  : 'bg-[var(--ks-bg)] border-[var(--ks-border-strong)] text-[var(--ks-text-muted)]';

                return (
                  <li key={`${event.stage}-${index}`} className="relative flex gap-4">
                    <div className="flex flex-col items-center">
                      <span
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border ${markerClass}`}
                      >
                        {isCancelledEvent ? (
                          <X className="w-3.5 h-3.5" />
                        ) : isReturnEvent ? (
                          <RotateCcw className="w-3.5 h-3.5" />
                        ) : event.completed ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <span className="text-[11px] font-mono-num">{index + 1}</span>
                        )}
                      </span>
                      {index < trackedOrder.timeline.length - 1 && (
                        <span
                          className={`w-px flex-1 mt-1.5 min-h-[28px] ${
                            event.completed
                              ? 'bg-[var(--ks-action)]'
                              : 'bg-[var(--ks-border)]'
                          }`}
                        />
                      )}
                    </div>
                    <div className="pb-2 flex-1 min-w-0">
                      <div className="min-h-7 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 pt-0.5">
                        <p
                          className={`text-sm font-semibold ${
                            isCancelledEvent
                              ? 'text-[var(--ks-error)]'
                              : isReturnEvent
                              ? 'text-[var(--ks-warning)]'
                              : event.completed
                              ? 'text-[var(--ks-text-primary)]'
                              : 'text-[var(--ks-text-muted)]'
                          }`}
                        >
                          {event.stage}
                        </p>
                        <span className="text-xs font-mono-num text-[var(--ks-text-muted)] shrink-0">
                          {event.timestamp}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--ks-text-secondary)] mt-1 leading-snug">
                        {event.note}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          <aside className="lg:col-span-4 p-6 rounded-[var(--ks-radius-lg)] bg-[var(--ks-surface)] border border-[var(--ks-border)] space-y-5 text-sm">
            <div className="flex items-center gap-2.5 pb-3 border-b border-[var(--ks-border)]">
              <Truck className="w-4 h-4 text-[var(--ks-accent)]" />
              <h3 className="font-semibold">Courier Information</h3>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <p className="text-[var(--ks-text-muted)]">Carrier</p>
                <p className="font-medium text-sm mt-0.5">{trackedOrder.courierName}</p>
              </div>
              <div>
                <p className="text-[var(--ks-text-muted)]">Tracking Reference</p>
                <p className="font-mono-num font-medium text-sm mt-0.5">
                  {trackedOrder.trackingNumber}
                </p>
              </div>
              <div>
                <p className="text-[var(--ks-text-muted)]">Payment &amp; Gateway Status</p>
                <p className="font-medium mt-0.5">
                  {trackedOrder.paymentLabel} ·{' '}
                  <span className="uppercase font-mono-num text-[var(--ks-accent)]">
                    {trackedOrder.paymentStatus}
                  </span>
                </p>
                {trackedOrder.transactionRef && (
                  <p className="font-mono-num text-[11px] text-[var(--ks-text-muted)] mt-0.5">
                    Ref: {trackedOrder.transactionRef}
                  </p>
                )}
              </div>
              <div>
                <p className="text-[var(--ks-text-muted)]">Destination</p>
                <p className="font-medium mt-0.5">{trackedOrder.shippingAddress.streetAddress}</p>
                <p className="text-[var(--ks-text-secondary)]">
                  {[
                    trackedOrder.shippingAddress.area,
                    trackedOrder.shippingAddress.upazila,
                    trackedOrder.shippingAddress.city,
                    trackedOrder.shippingAddress.state,
                    trackedOrder.shippingAddress.postalCode,
                  ]
                    .filter(Boolean)
                    .join(', ')}{' '}
                  · {trackedOrder.shippingAddress.country}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--ks-border)] space-y-2.5">
              <p className="text-xs uppercase tracking-wider text-[var(--ks-text-muted)]">
                Items in Shipment
              </p>
              {trackedOrder.items.map((item) => (
                <div key={item.key} className="flex items-baseline justify-between text-xs gap-3">
                  <span className="min-w-0 truncate">
                    {item.name} × {item.quantity}
                  </span>
                  <span className="font-mono-num shrink-0 text-right">
                    {formatCurrency(item.price * item.quantity, currency)}
                  </span>
                </div>
              ))}
              <div className="flex items-baseline justify-between gap-3 pt-2 border-t border-[var(--ks-border)] font-semibold">
                <span className="min-w-0">Order Total</span>
                <span className="font-mono-num shrink-0 text-right">
                  {trackedOrder.currencySnapshot
                    ? formatDirectCurrency(
                        trackedOrder.currencySnapshot.chargedTotal,
                        trackedOrder.currencySnapshot.transactionCurrency
                      )
                    : formatCurrency(trackedOrder.total, currency)}
                </span>
              </div>
              {trackedOrder.currencySnapshot && (
                <p className="text-[11px] font-mono-num text-[var(--ks-text-muted)]">
                  FX Snapshot: 1 USD = ৳{trackedOrder.currencySnapshot.exchangeRate} ·{' '}
                  {trackedOrder.currencySnapshot.rateSource}
                </p>
              )}
            </div>
          </aside>
        </div>
      ) : (
        <div className="p-10 text-center rounded-[var(--ks-radius-lg)] bg-[var(--ks-surface)] border border-[var(--ks-border)]">
          <PackageSearch className="w-7 h-7 mx-auto text-[var(--ks-text-muted)] mb-3" />
          <p className="text-sm text-[var(--ks-text-secondary)]">
            Enter a valid order number above to inspect its live fulfillment timeline.
          </p>
        </div>
      )}
    </div>
  );
};
