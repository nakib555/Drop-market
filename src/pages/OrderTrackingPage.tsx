import React, { useMemo, useState } from 'react';
import { Check, PackageSearch, RotateCcw, Truck, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatCurrency } from '../utils/format';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/FormFields';
import { Breadcrumb } from '../components/ui/Primitives';

export const OrderTrackingPage: React.FC = () => {
  const { currency, route, orders, navigate } = useStore();
  const [orderIdInput, setOrderIdInput] = useState(route.orderId || orders[0]?.id || 'KS-10482');
  const [contactVerify, setContactVerify] = useState('');
  const [lookupError, setLookupError] = useState('');
  const [activeOrderId, setActiveOrderId] = useState(route.orderId || orders[0]?.id || 'KS-10482');

  const trackedOrder = useMemo(
    () => orders.find((o) => o.id.toLowerCase() === activeOrderId.trim().toLowerCase()) || null,
    [orders, activeOrderId]
  );

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = orderIdInput.trim();
    if (!cleanId) {
      setLookupError('Please enter an Order ID (e.g., KS-10482).');
      return;
    }
    const found = orders.find((o) => o.id.toLowerCase() === cleanId.toLowerCase());
    if (!found) {
      setLookupError(`No order found matching "${cleanId}". Try selecting one of your recent orders below.`);
      setActiveOrderId('');
      return;
    }
    if (
      contactVerify.trim() &&
      found.email.toLowerCase() !== contactVerify.trim().toLowerCase() &&
      !found.phone.includes(contactVerify.trim())
    ) {
      setLookupError('Verification email or phone does not match this order record.');
      return;
    }
    setLookupError('');
    setActiveOrderId(found.id);
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-12 space-y-10">
      <Breadcrumb
        items={[
          { label: 'Home', onClick: () => navigate({ name: 'home' }) },
          { label: 'Order Tracking' },
        ]}
      />

      <div className="max-w-2xl space-y-2">
        <p className="text-xs uppercase tracking-wider text-[#8F6438] dark:text-[#C89B67]">
          Logistics &amp; White-Glove Status
        </p>
        <h1 className="font-display text-3xl sm:text-5xl font-medium">Track Your Order</h1>
        <p className="text-sm text-[#5C5B57] dark:text-[#B4B2AC]">
          Enter your Kinto Studio order number to view live fulfillment milestones, courier details, and delivery estimates.
        </p>
      </div>

      {/* Lookup Form */}
      <div className="p-6 sm:p-8 rounded-lg bg-[#FFFFFF] dark:bg-[#191917] border border-[#E5E3DD] dark:border-[#2C2C28] space-y-5">
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
              placeholder="alex.mercer@studio.example"
            />
          </div>
          <div className="md:col-span-2">
            <Button type="submit" variant="primary" size="md" fullWidth>
              Track
            </Button>
          </div>
        </form>

        {lookupError && (
          <p className="text-xs text-[#B91C1C] dark:text-[#F87171]">{lookupError}</p>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#E5E3DD] dark:border-[#2C2C28] text-xs">
          <span className="text-[#84827B]">Recent studio orders:</span>
          {orders.slice(0, 4).map((ord) => (
            <button
              key={ord.id}
              type="button"
              onClick={() => {
                setOrderIdInput(ord.id);
                setActiveOrderId(ord.id);
                setLookupError('');
              }}
              className={`px-2.5 py-1 rounded-md font-mono-num border cursor-pointer transition-colors ${
                trackedOrder?.id === ord.id
                  ? 'bg-[#171716] text-white border-[#171716] dark:bg-[#F4F3EF] dark:text-[#171716] dark:border-[#F4F3EF]'
                  : 'border-[#E5E3DD] dark:border-[#2C2C28] hover:border-[#171716] dark:hover:border-[#F4F3EF]'
              }`}
            >
              #{ord.id} ({ord.currentStage})
            </button>
          ))}
        </div>
      </div>

      {/* Visual Progress Timeline */}
      {trackedOrder ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 p-6 sm:p-8 rounded-lg bg-[#FFFFFF] dark:bg-[#191917] border border-[#E5E3DD] dark:border-[#2C2C28] space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-[#E5E3DD] dark:border-[#2C2C28]">
              <div>
                <p className="text-xs text-[#84827B] font-mono-num">ORDER #{trackedOrder.id}</p>
                <h2 className="font-display text-2xl sm:text-3xl font-medium mt-0.5">
                  Current Status:{' '}
                  <span
                    className={
                      trackedOrder.currentStage === 'Cancelled'
                        ? 'text-[#B91C1C] dark:text-[#F87171]'
                        : trackedOrder.currentStage === 'Return Requested'
                        ? 'text-[#B45309] dark:text-[#FBBF24]'
                        : ''
                    }
                  >
                    {trackedOrder.currentStage}
                  </span>
                </h2>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-xs text-[#84827B]">
                  {trackedOrder.currentStage === 'Cancelled'
                    ? 'Order Status'
                    : trackedOrder.currentStage === 'Return Requested'
                    ? 'Return RMA'
                    : 'Estimated Delivery'}
                </p>
                <p
                  className={`text-sm font-semibold ${
                    trackedOrder.currentStage === 'Cancelled'
                      ? 'text-[#B91C1C] dark:text-[#F87171]'
                      : trackedOrder.currentStage === 'Return Requested'
                      ? 'text-[#B45309] dark:text-[#FBBF24]'
                      : 'text-[#8F6438] dark:text-[#C89B67]'
                  }`}
                >
                  {trackedOrder.estimatedArrival}
                </p>
              </div>
            </div>

            {/* Progress Timeline */}
            <ol className="space-y-6">
              {trackedOrder.timeline.map((event, index) => {
                const isCancelledEvent = event.stage === 'Cancelled';
                const isReturnEvent = event.stage === 'Return Requested';
                const markerClass = isCancelledEvent
                  ? 'bg-[#B91C1C] border-[#B91C1C] text-white dark:bg-[#DC2626] dark:border-[#DC2626]'
                  : isReturnEvent
                  ? 'bg-[#B45309] border-[#B45309] text-white dark:bg-[#D97706] dark:border-[#D97706]'
                  : event.completed
                  ? 'bg-[#171716] border-[#171716] text-white dark:bg-[#F4F3EF] dark:border-[#F4F3EF] dark:text-[#171716]'
                  : 'bg-[#F9F8F6] dark:bg-[#141413] border-[#DCD9D0] dark:border-[#2E2E2A] text-[#84827B]';

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
                              ? 'bg-[#171716] dark:bg-[#F4F3EF]'
                              : 'bg-[#E5E3DD] dark:bg-[#2C2C28]'
                          }`}
                        />
                      )}
                    </div>
                    <div className="pb-2 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p
                          className={`text-sm font-semibold ${
                            isCancelledEvent
                              ? 'text-[#B91C1C] dark:text-[#F87171]'
                              : isReturnEvent
                              ? 'text-[#B45309] dark:text-[#FBBF24]'
                              : event.completed
                              ? 'text-[#171716] dark:text-[#F4F3EF]'
                              : 'text-[#84827B]'
                          }`}
                        >
                          {event.stage}
                        </p>
                        <span className="text-xs font-mono-num text-[#84827B]">{event.timestamp}</span>
                      </div>
                      <p className="text-xs text-[#5C5B57] dark:text-[#A3A19B] mt-1">{event.note}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* Courier & Shipment Summary */}
          <aside className="lg:col-span-4 p-6 rounded-lg bg-[#FFFFFF] dark:bg-[#191917] border border-[#E5E3DD] dark:border-[#2C2C28] space-y-5 text-sm">
            <div className="flex items-center gap-2.5 pb-3 border-b border-[#E5E3DD] dark:border-[#2C2C28]">
              <Truck className="w-4 h-4 text-[#8F6438] dark:text-[#C89B67]" />
              <h3 className="font-semibold">Courier Information</h3>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <p className="text-[#84827B]">Carrier</p>
                <p className="font-medium text-sm mt-0.5">{trackedOrder.courierName}</p>
              </div>
              <div>
                <p className="text-[#84827B]">Tracking Reference</p>
                <p className="font-mono-num font-medium text-sm mt-0.5">
                  {trackedOrder.trackingNumber}
                </p>
              </div>
              <div>
                <p className="text-[#84827B]">Destination</p>
                <p className="font-medium mt-0.5">{trackedOrder.shippingAddress.streetAddress}</p>
                <p className="text-[#5C5B57] dark:text-[#A3A19B]">
                  {trackedOrder.shippingAddress.city}, {trackedOrder.shippingAddress.state}{' '}
                  {trackedOrder.shippingAddress.postalCode}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E5E3DD] dark:border-[#2C2C28] space-y-2.5">
              <p className="text-xs uppercase tracking-wider text-[#84827B]">Items in Shipment</p>
              {trackedOrder.items.map((item) => (
                <div key={item.key} className="flex justify-between text-xs gap-3">
                  <span className="truncate">
                    {item.name} × {item.quantity}
                  </span>
                  <span className="font-mono-num shrink-0">
                    {formatCurrency(item.price * item.quantity, currency)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between pt-2 border-t border-[#E5E3DD] dark:border-[#2C2C28] font-semibold">
                <span>Order Total</span>
                <span className="font-mono-num">{formatCurrency(trackedOrder.total, currency)}</span>
              </div>
            </div>
          </aside>
        </div>
      ) : (
        <div className="p-10 text-center rounded-lg bg-[#FFFFFF] dark:bg-[#191917] border border-[#E5E3DD] dark:border-[#2C2C28]">
          <PackageSearch className="w-7 h-7 mx-auto text-[#84827B] mb-3" />
          <p className="text-sm text-[#5C5B57] dark:text-[#A3A19B]">
            Enter a valid order number above to inspect its fulfillment timeline.
          </p>
        </div>
      )}
    </div>
  );
};
