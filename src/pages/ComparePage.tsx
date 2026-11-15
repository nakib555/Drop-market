import React from 'react';
import { ArrowLeftRight, Plus, Trash2 } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatCurrency, isProductOutOfStock } from '../utils/format';
import { PriceDisplay, RatingSummary } from '../components/product/CommercePrimitives';
import { Button } from '../components/ui/Button';
import { Breadcrumb, EmptyState, ResilientImage } from '../components/ui/Primitives';

export const ComparePage: React.FC = () => {
  const { currency, products, compareIds, toggleCompare, clearCompare, addToCart, navigate } = useStore();
  const compared = products.filter((p) => compareIds.includes(p.id));
  const addable = products.filter((p) => !compareIds.includes(p.id));

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-12 space-y-10">
      <Breadcrumb
        items={[
          { label: 'Home', onClick: () => navigate({ name: 'home' }) },
          { label: 'Compare Specifications' },
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[var(--ks-border)]">
        <div>
          <h1 className="font-display text-3xl sm:text-5xl font-medium">Product Comparison</h1>
          <p className="text-sm text-[var(--ks-text-muted)] mt-1">
            Evaluate dimensions, materials, warranties, and pricing side by side (up to 4 objects).
          </p>
        </div>
        {compared.length > 0 && (
          <Button variant="outline" size="sm" onClick={clearCompare}>
            Clear All ({compared.length})
          </Button>
        )}
      </div>

      {compared.length === 0 ? (
        <div className="rounded-[var(--ks-radius-lg)] bg-[var(--ks-surface)] border border-[var(--ks-border)]">
          <EmptyState
            icon={<ArrowLeftRight className="w-6 h-6" />}
            title="No objects selected for comparison"
            description="Select the compare icon on any product card or pick from the catalog below."
            actionLabel="Browse Catalog"
            onAction={() => navigate({ name: 'shop', category: 'all' })}
          />
          <div className="px-6 pb-10 max-w-2xl mx-auto">
            <p className="text-xs uppercase tracking-wider text-[var(--ks-text-muted)] text-center mb-3">
              Quick Add to Compare
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {products.slice(0, 4).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggleCompare(p)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[var(--ks-radius-md)] border border-[var(--ks-border)] text-xs font-medium hover:border-[var(--ks-text)] cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{p.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {compared.length < 4 && addable.length > 0 && (
            <div className="flex flex-wrap items-center gap-3">
              <label htmlFor="compare-add-select" className="text-xs text-[var(--ks-text-muted)]">
                Add another object:
              </label>
              <select
                id="compare-add-select"
                aria-label="Add object to comparison"
                value=""
                onChange={(e) => {
                  const p = products.find((item) => item.id === e.target.value);
                  if (p) toggleCompare(p);
                }}
                className="h-9 px-3 text-xs rounded-[var(--ks-radius-md)] bg-[var(--ks-surface)] border border-[var(--ks-border)]"
              >
                <option value="">Select piece...</option>
                {addable.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({formatCurrency(p.price, currency)})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Mobile Stacked Cards (< 640px) */}
          <div className="sm:hidden space-y-4">
            {compared.map((item) => {
              const outOfStock = isProductOutOfStock(item);
              const primaryColor = item.colors[0] || { name: 'Standard', hex: '#84827B' };
              const primarySize = item.sizes[0] || 'Standard';
              return (
                <article
                  key={item.id}
                  className="p-4 rounded-[var(--ks-radius-lg)] border border-[var(--ks-border)] bg-[var(--ks-surface)] space-y-4"
                >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => navigate({ name: 'product', slug: item.slug })}
                      aria-label={`View ${item.name}`}
                      className="w-24 aspect-[4/3] rounded-[var(--ks-radius-md)] overflow-hidden shrink-0 cursor-pointer block"
                    >
                      <ResilientImage
                        src={item.images[0]}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] uppercase tracking-wider text-[var(--ks-text-muted)]">
                        {item.brand}
                      </p>
                      <h2 className="text-base font-semibold truncate">
                        <button
                          type="button"
                          onClick={() => navigate({ name: 'product', slug: item.slug })}
                          className="truncate max-w-full text-left cursor-pointer hover:text-[var(--ks-accent)]"
                        >
                          {item.name}
                        </button>
                      </h2>
                      <PriceDisplay
                        price={item.price}
                        originalPrice={item.originalPrice}
                        currency={currency}
                        size="sm"
                        className="mt-1"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleCompare(item)}
                      aria-label={`Remove ${item.name} from comparison`}
                      className="w-10 h-10 rounded-[var(--ks-radius-md)] border border-[var(--ks-border)] flex items-center justify-center text-[var(--ks-text-muted)] hover:text-[var(--ks-error)] cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <dl className="divide-y divide-[var(--ks-border)] border-y border-[var(--ks-border)] text-xs">
                    <div className="py-2 flex items-baseline justify-between gap-3">
                      <dt className="text-[var(--ks-text-muted)] shrink-0">Highlights</dt>
                      <dd className="text-right leading-snug">{item.cardHighlights?.join(' · ') || '—'}</dd>
                    </div>
                    <div className="py-2 flex items-baseline justify-between gap-3">
                      <dt className="text-[var(--ks-text-muted)] shrink-0">Rating</dt>
                      <dd className="text-right">
                        <RatingSummary
                          rating={item.rating}
                          reviewCount={item.reviewCount}
                          compact
                          showCount
                          fallbackLabel="Unreviewed"
                        />
                      </dd>
                    </div>
                    <div className="py-2 flex items-baseline justify-between gap-3">
                      <dt className="text-[var(--ks-text-muted)] shrink-0">Availability</dt>
                      <dd
                        className={`text-right ${
                          outOfStock ? 'text-[var(--ks-error)] font-medium' : 'capitalize'
                        }`}
                      >
                        {outOfStock ? 'Out of Stock' : item.availability.replace('-', ' ')}
                      </dd>
                    </div>
                    <div className="py-2 flex items-baseline justify-between gap-3">
                      <dt className="text-[var(--ks-text-muted)] shrink-0">Shipping &amp; COD</dt>
                      <dd className="font-mono-num text-right leading-snug">
                        {item.weightKg ? `${item.weightKg} kg · ` : ''}
                        {item.codEligible === false ? 'Prepaid Only' : 'COD Eligible'}
                      </dd>
                    </div>
                    <div className="py-2 flex items-baseline justify-between gap-3">
                      <dt className="text-[var(--ks-text-muted)] shrink-0">Key Spec</dt>
                      <dd className="font-mono-num text-right leading-snug">
                        {item.specifications[0]
                          ? `${item.specifications[0].label}: ${item.specifications[0].value}`
                          : '—'}
                      </dd>
                    </div>
                    <div className="py-2 flex items-baseline justify-between gap-3">
                      <dt className="text-[var(--ks-text-muted)] shrink-0">Warranty</dt>
                      <dd className="text-right leading-snug">{item.warranty}</dd>
                    </div>
                  </dl>

                  <Button
                    variant="primary"
                    size="sm"
                    fullWidth
                    disabled={outOfStock}
                    onClick={() =>
                      addToCart(item, primaryColor.name, primaryColor.hex, primarySize, 1, true)
                    }
                  >
                    {outOfStock ? 'Out of Stock' : 'Add to Bag'}
                  </Button>
                </article>
              );
            })}
          </div>

          {/* Tablet & Desktop Matrix Table (>= 640px) */}
          <div className="hidden sm:block overflow-x-auto rounded-[var(--ks-radius-lg)] border border-[var(--ks-border)] bg-[var(--ks-surface)]">
            <table className="w-full min-w-[680px] text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-[var(--ks-border)]">
                  <th className="w-44 p-5 text-xs uppercase tracking-wider text-[var(--ks-text-muted)] align-top">
                    Object
                  </th>
                  {compared.map((item) => (
                    <th key={item.id} className="p-5 align-top min-w-[210px] font-normal">
                      <div className="space-y-3">
                        <div className="relative aspect-[4/3] rounded-[var(--ks-radius-md)] overflow-hidden bg-[var(--ks-surface-muted)]">
                          <button
                            type="button"
                            onClick={() => navigate({ name: 'product', slug: item.slug })}
                            aria-label={`View ${item.name}`}
                            className="w-full h-full block cursor-pointer"
                          >
                            <ResilientImage
                              src={item.images[0]}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleCompare(item)}
                            aria-label={`Remove ${item.name} from comparison`}
                            className="absolute top-2 right-2 w-10 h-10 rounded-[var(--ks-radius-md)] bg-[var(--ks-surface)]/95 flex items-center justify-center text-[var(--ks-text-muted)] hover:text-[var(--ks-error)] cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-[11px] uppercase tracking-wider text-[var(--ks-text-muted)]">
                          {item.brand}
                        </p>
                        <button
                          type="button"
                          onClick={() => navigate({ name: 'product', slug: item.slug })}
                          className="font-semibold text-base text-left cursor-pointer hover:text-[var(--ks-accent)]"
                        >
                          {item.name}
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--ks-border)] [&_td]:align-top">
                <tr>
                  <td className="p-4 px-5 text-xs uppercase tracking-wider text-[var(--ks-text-muted)]">
                    Price
                  </td>
                  {compared.map((item) => (
                    <td key={item.id} className="p-4 px-5">
                      <PriceDisplay
                        price={item.price}
                        originalPrice={item.originalPrice}
                        currency={currency}
                        size="md"
                      />
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 px-5 text-xs uppercase tracking-wider text-[var(--ks-text-muted)]">
                    Rating
                  </td>
                  {compared.map((item) => (
                    <td key={item.id} className="p-4 px-5">
                      <RatingSummary
                        rating={item.rating}
                        reviewCount={item.reviewCount}
                        compact
                        showCount
                        fallbackLabel="Unreviewed"
                      />
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 px-5 text-xs uppercase tracking-wider text-[var(--ks-text-muted)]">
                    Availability
                  </td>
                  {compared.map((item) => {
                    const outOfStock = isProductOutOfStock(item);
                    return (
                      <td key={item.id} className="p-4 px-5 text-xs leading-snug">
                        <span
                          className={
                            outOfStock ? 'text-[var(--ks-error)] font-medium' : 'capitalize'
                          }
                        >
                          {outOfStock ? 'Out of Stock' : item.availability.replace('-', ' ')}
                        </span>
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td className="p-4 px-5 text-xs uppercase tracking-wider text-[var(--ks-text-muted)]">
                    Parcel &amp; COD
                  </td>
                  {compared.map((item) => (
                    <td key={item.id} className="p-4 px-5 text-xs font-mono-num leading-snug">
                      {item.weightKg ? `${item.weightKg} kg` : 'Standard'} ·{' '}
                      {item.sizeTier || 'medium'} ·{' '}
                      {item.codEligible === false ? 'Prepaid Only' : 'COD Eligible'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 px-5 text-xs uppercase tracking-wider text-[var(--ks-text-muted)]">
                    Key Specifications
                  </td>
                  {compared.map((item) => (
                    <td key={item.id} className="p-4 px-5 text-xs font-mono-num leading-snug">
                      {item.specifications.length > 0
                        ? item.specifications
                            .slice(0, 2)
                            .map((s) => `${s.label}: ${s.value}`)
                            .join(' · ')
                        : '—'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 px-5 text-xs uppercase tracking-wider text-[var(--ks-text-muted)]">
                    Finishes
                  </td>
                  {compared.map((item) => (
                    <td key={item.id} className="p-4 px-5 text-xs leading-snug">
                      {item.colors.map((c) => c.name).join(', ')}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 px-5 text-xs uppercase tracking-wider text-[var(--ks-text-muted)]">
                    Warranty
                  </td>
                  {compared.map((item) => (
                    <td key={item.id} className="p-4 px-5 text-xs leading-snug">
                      {item.warranty}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 px-5 text-xs uppercase tracking-wider text-[var(--ks-text-muted)]">
                    Action
                  </td>
                  {compared.map((item) => {
                    const outOfStock = isProductOutOfStock(item);
                    const primaryColor = item.colors[0] || { name: 'Standard', hex: '#84827B' };
                    const primarySize = item.sizes[0] || 'Standard';
                    return (
                      <td key={item.id} className="p-4 px-5">
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={outOfStock}
                          onClick={() =>
                            addToCart(
                              item,
                              primaryColor.name,
                              primaryColor.hex,
                              primarySize,
                              1,
                              true
                            )
                          }
                        >
                          {outOfStock ? 'Out of Stock' : 'Add to Bag'}
                        </Button>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
