import React, { useEffect, useRef, useState } from 'react';
import { Check, PackageSearch, RotateCcw, Truck, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { trackOrderApi } from '../services/api';
import { Order } from '../types/commerce';
import { formatCurrency, formatDirectCurrency } from '../utils/format';
import { t, translateOrderStage } from '../utils/i18n';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/FormFields';
import { Breadcrumb } from '../components/ui/Primitives';

export const OrderTrackingPage: React.FC = () => {
  const { language, currency, route, orders, navigate, profile, policyFactsPublic } = useStore();
  const [orderIdInput, setOrderIdInput] = useState(route.orderId || orders[0]?.id || '');
  const [contactVerify, setContactVerify] = useState('');
  const contactVerifyRef = useRef('');
  contactVerifyRef.current = contactVerify;
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
        trackOrderApi(route.orderId, contactVerifyRef.current.trim() || undefined)
          .then((ord) => setTrackedOrder(ord))
          .catch((err) => {
            setTrackedOrder(null);
            setLookupError(err instanceof Error ? err.message : t(language, 'trackErrLocate'));
          })
          .finally(() => setLoadingLookup(false));
      }
    } else if (!trackedOrder && orders[0]) {
      setTrackedOrder(orders[0]);
      setOrderIdInput((prev) => prev || orders[0].id);
    }
  }, [route.orderId, orders, language, trackedOrder]);

  const handleTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = orderIdInput.trim();
    const cleanContact = contactVerify.trim();
    if (!cleanId) {
      setLookupError(t(language, 'trackErrEmptyId'));
      return;
    }
    if (!profile.isAuthenticated && !cleanContact) {
      setLookupError(t(language, 'trackErrNeedContact'));
      return;
    }

    setLookupError('');
    setLoadingLookup(true);
    try {
      const remoteOrder = await trackOrderApi(cleanId, cleanContact || undefined);
      setTrackedOrder(remoteOrder);
    } catch (err) {
      const localFound = orders.find((o) => o.id.toLowerCase() === cleanId.toLowerCase());
      if (localFound && profile.isAuthenticated) {
        if (
          cleanContact &&
          localFound.email.toLowerCase() !== cleanContact.toLowerCase() &&
          !localFound.phone.includes(cleanContact)
        ) {
          setLookupError(t(language, 'trackErrMismatch'));
          setTrackedOrder(null);
        } else {
          setTrackedOrder(localFound);
        }
      } else {
        setTrackedOrder(null);
        setLookupError(
          err instanceof Error
            ? err.message
            : t(language, 'trackErrNotFound', { id: cleanId })
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
          { label: t(language, 'home'), onClick: () => navigate({ name: 'home' }) },
          { label: t(language, 'trackOrder') },
        ]}
      />

      <div className="max-w-2xl space-y-2">
        <p className="ks-eyebrow text-[var(--ks-accent)]">
          {t(language, 'logisticsStatus')}
        </p>
        <h1 className="font-display text-3xl sm:text-5xl font-medium">
          {t(language, 'trackYourOrder')}
        </h1>
        <p className="text-sm text-[var(--ks-text-secondary)]">
          {t(language, 'trackOrderDesc')}
        </p>
      </div>

      {/* Lookup Form */}
      <div className="p-5 sm:p-8 rounded-[var(--ks-radius-lg)] bg-[var(--ks-surface)] border border-[var(--ks-border)] space-y-5">
        <form onSubmit={handleTrackSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-5">
            <Input
              label={t(language, 'orderNumber')}
              required
              autoComplete="off"
              value={orderIdInput}
              onChange={(e) => setOrderIdInput(e.target.value)}
              placeholder="KS-10482"
            />
          </div>
          <div className="md:col-span-5">
            <Input
              label={
                profile.isAuthenticated
                  ? t(language, 'verificationOptional')
                  : t(language, 'verificationLabel')
              }
              required={!profile.isAuthenticated}
              value={contactVerify}
              onChange={(e) => setContactVerify(e.target.value)}
              placeholder="buyer@example.com or +880 17XX-XXXXXX"
            />
          </div>
          <div className="md:col-span-2">
            <Button type="submit" variant="primary" size="md" fullWidth disabled={loadingLookup}>
              {loadingLookup ? t(language, 'checking') : t(language, 'trackBtn')}
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
            <span className="text-[var(--ks-text-muted)]">{t(language, 'yourRecentOrders')}</span>
            {orders.slice(0, 4).map((ord) => (
              <button
                key={ord.id}
                type="button"
                onClick={() => {
                  setOrderIdInput(ord.id);
                  setTrackedOrder(ord);
                  setLookupError('');
                }}
                className={`min-h-[36px] px-3 py-1.5 rounded-[var(--ks-radius-md)] font-mono-num border cursor-pointer transition-colors ${
                  trackedOrder?.id === ord.id
                    ? 'bg-[var(--ks-action)] text-[var(--ks-action-text)] border-[var(--ks-action)]'
                    : 'border-[var(--ks-border)] hover:border-[var(--ks-border-strong)]'
                }`}
              >
                #{ord.id} ({translateOrderStage(language, ord.currentStage)})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Visual Progress Timeline */}
      {trackedOrder ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 p-5 sm:p-8 rounded-[var(--ks-radius-lg)] bg-[var(--ks-surface)] border border-[var(--ks-border)] space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-[var(--ks-border)]">
              <div>
                <p className="text-xs text-[var(--ks-text-muted)] font-mono-num">
                  #{trackedOrder.id}
                </p>
                <h2 className="font-display text-2xl sm:text-3xl font-medium mt-0.5">
                  {t(language, 'currentStatus')}:{' '}
                  <span
                    className={
                      trackedOrder.currentStage === 'Cancelled'
                        ? 'text-[var(--ks-error)]'
                        : trackedOrder.currentStage === 'Return Requested'
                        ? 'text-[var(--ks-warning)]'
                        : ''
                    }
                  >
                    {translateOrderStage(language, trackedOrder.currentStage)}
                  </span>
                </h2>
              </div>
              <div className="text-start sm:text-end">
                <p className="text-xs text-[var(--ks-text-muted)]">
                  {trackedOrder.currentStage === 'Cancelled'
                    ? t(language, 'orderStatus')
                    : trackedOrder.currentStage === 'Return Requested'
                    ? t(language, 'returnRma')
                    : t(language, 'estimatedDelivery')}
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
                  ? 'bg-[var(--ks-error)] border-[var(--ks-error)] text-[var(--ks-error-text)]'
                  : isReturnEvent
                  ? 'bg-[var(--ks-warning)] border-[var(--ks-warning)] text-[var(--ks-warning-text)]'
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
                          <span className="text-xs font-mono-num">{index + 1}</span>
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
                          {translateOrderStage(language, event.stage)}
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
              <h3 className="font-semibold">{t(language, 'courierInfo')}</h3>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <p className="text-[var(--ks-text-muted)]">{t(language, 'carrier')}</p>
                <p className="font-medium text-sm mt-0.5">{trackedOrder.courierName}</p>
              </div>
              <div>
                <p className="text-[var(--ks-text-muted)]">{t(language, 'trackingRef')}</p>
                <p className="font-mono-num font-medium text-sm mt-0.5">
                  {trackedOrder.trackingNumber}
                </p>
              </div>
              <div>
                <p className="text-[var(--ks-text-muted)]">{t(language, 'paymentStatusLabel')}</p>
                <p className="font-medium mt-0.5">
                  {trackedOrder.paymentLabel} ·{' '}
                  <span className="uppercase font-mono-num text-[var(--ks-accent)]">
                    {trackedOrder.paymentStatus}
                  </span>
                </p>
                {trackedOrder.transactionRef && (
                  <p className="font-mono-num text-xs text-[var(--ks-text-muted)] mt-0.5">
                    {t(language, 'refShortPrefix', { ref: trackedOrder.transactionRef })}
                  </p>
                )}
              </div>
              <div>
                <p className="text-[var(--ks-text-muted)]">{t(language, 'destination')}</p>
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
                {t(language, 'itemsInShipment')}
              </p>
              {trackedOrder.items.map((item) => (
                <div key={item.key} className="flex items-baseline justify-between text-xs gap-3">
                  <span className="min-w-0 truncate">
                    {item.name} × {item.quantity}
                  </span>
                  <span className="font-mono-num shrink-0 text-end tabular-nums">
                    {formatCurrency(item.price * item.quantity, currency)}
                  </span>
                </div>
              ))}
              <div className="flex items-baseline justify-between gap-3 pt-2 border-t border-[var(--ks-border)] font-semibold">
                <span className="min-w-0">{t(language, 'orderTotal')}</span>
                <span className="font-mono-num shrink-0 text-end tabular-nums">
                  {trackedOrder.currencySnapshot
                    ? formatDirectCurrency(
                        trackedOrder.currencySnapshot.chargedTotal,
                        trackedOrder.currencySnapshot.transactionCurrency
                      )
                    : formatCurrency(trackedOrder.total, currency)}
                </span>
              </div>
              {trackedOrder.currencySnapshot && (
                <p className="text-xs font-mono-num text-[var(--ks-text-muted)]">
                  FX Snapshot: 1 USD = ৳{trackedOrder.currencySnapshot.exchangeRate} ·{' '}
                  {trackedOrder.currencySnapshot.rateSource}
                </p>
              )}
            </div>

            {/* Next-Step Escalation & Order-Time Policy Snapshot */}
            <div className="pt-4 border-t border-[var(--ks-border)] space-y-3 text-xs">
              <div className="space-y-1.5">
                <p className="uppercase tracking-wider text-[var(--ks-text-muted)]">
                  Next Steps &amp; Order Support
                </p>
                {['Confirmed', 'Processing'].includes(trackedOrder.currentStage) ? (
                  <p className="text-[var(--ks-text-secondary)] leading-relaxed">
                    Cancellation available {policyFactsPublic.cancelPreDispatchCutoff.toLowerCase()}.{' '}
                    <button
                      type="button"
                      onClick={() => navigate({ name: 'cancellation-policy' })}
                      className="underline text-[var(--ks-accent)] cursor-pointer"
                    >
                      Cancellation Policy
                    </button>
                  </p>
                ) : trackedOrder.currentStage === 'Delivered' ? (
                  <p className="text-[var(--ks-text-secondary)] leading-relaxed">
                    Eligible items can be returned within {policyFactsPublic.returnWindowDays} days ({policyFactsPublic.defectReportHours}h for transit damage/wrong item).{' '}
                    <button
                      type="button"
                      onClick={() => navigate({ name: 'return-policy' })}
                      className="underline text-[var(--ks-accent)] cursor-pointer"
                    >
                      Return Policy
                    </button>
                    {' · '}
                    <button
                      type="button"
                      onClick={() => navigate({ name: 'warranty-policy' })}
                      className="underline text-[var(--ks-accent)] cursor-pointer"
                    >
                      Warranty
                    </button>
                  </p>
                ) : (
                  <p className="text-[var(--ks-text-secondary)] leading-relaxed">
                    Need help with dispatch, courier handoff, or a complaint?{' '}
                    <button
                      type="button"
                      onClick={() => navigate({ name: 'customer-support-policy' })}
                      className="underline text-[var(--ks-accent)] cursor-pointer"
                    >
                      Dispute &amp; Support Policy
                    </button>
                    {' · '}
                    <button
                      type="button"
                      onClick={() => navigate({ name: 'contact' })}
                      className="underline text-[var(--ks-accent)] cursor-pointer"
                    >
                      Contact Desk
                    </button>
                  </p>
                )}
              </div>

              <div className="p-3 rounded-[var(--ks-radius-md)] bg-[var(--ks-bg)] border border-[var(--ks-border)] space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-[var(--ks-text-primary)]">
                    Order-Time Policy Snapshot
                  </span>
                  <span className="font-mono-num text-xs text-[var(--ks-accent)]">
                    v{trackedOrder.policyAcceptance?.version || '2026-11.1'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  {(['terms', 'return-policy', 'shipping-policy', 'privacy-policy'] as const).map(
                    (pid) => {
                      const ver =
                        trackedOrder.policyAcceptance?.acceptedPolicyVersions?.[pid] ||
                        trackedOrder.policyAcceptance?.version;
                      return (
                        <button
                          key={pid}
                          type="button"
                          onClick={() =>
                            navigate({
                              name: pid,
                              policyVersion: ver,
                            })
                          }
                          className="underline text-xs text-[var(--ks-text-secondary)] hover:text-[var(--ks-accent)] cursor-pointer"
                        >
                          {pid.replace('-policy', '').replace('-', ' ')}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>
            </div>
          </aside>
        </div>
      ) : (
        <div className="p-10 text-center rounded-[var(--ks-radius-lg)] bg-[var(--ks-surface)] border border-[var(--ks-border)]">
          <PackageSearch className="w-7 h-7 mx-auto text-[var(--ks-text-muted)] mb-3" />
          <p className="text-sm text-[var(--ks-text-secondary)]">
            {t(language, 'trackEmptyPrompt')}
          </p>
        </div>
      )}
    </div>
  );
};
