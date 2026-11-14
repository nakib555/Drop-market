import React from 'react';
import { ArrowLeftRight, Plus, Star, Trash2 } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatCurrency } from '../utils/format';
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

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#E5E3DD] dark:border-[#2C2C28]">
        <div>
          <h1 className="font-display text-3xl sm:text-5xl font-medium">Product Comparison</h1>
          <p className="text-sm text-[#5C5B57] dark:text-[#A3A19B] mt-1">
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
        <div className="rounded-lg bg-[#FFFFFF] dark:bg-[#191917] border border-[#E5E3DD] dark:border-[#2C2C28]">
          <EmptyState
            icon={<ArrowLeftRight className="w-6 h-6" />}
            title="No objects selected for comparison"
            description="Select the compare icon on any product card or pick from the catalog below."
            actionLabel="Browse Catalog"
            onAction={() => navigate({ name: 'shop', category: 'all' })}
          />
          <div className="px-6 pb-10 max-w-2xl mx-auto">
            <p className="text-xs uppercase tracking-wider text-[#84827B] text-center mb-3">
              Quick Add to Compare
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {products.slice(0, 4).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggleCompare(p)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-[#E5E3DD] dark:border-[#2C2C28] text-xs font-medium hover:border-[#171716] dark:hover:border-[#F4F3EF] cursor-pointer"
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
              <span className="text-xs text-[#84827B]">Add another object:</span>
              <select
                aria-label="Add object to comparison"
                value=""
                onChange={(e) => {
                  const p = products.find((item) => item.id === e.target.value);
                  if (p) toggleCompare(p);
                }}
                className="h-9 px-3 text-xs rounded-md bg-white dark:bg-[#191917] border border-[#DCD9D0] dark:border-[#2E2E2A]"
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
            {compared.map((item) => (
              <article
                key={item.id}
                className="p-4 rounded-lg border border-[#E5E3DD] dark:border-[#2C2C28] bg-[#FFFFFF] dark:bg-[#191917] space-y-4"
              >
                <div className="flex items-start gap-3">
                  <ResilientImage
                    src={item.images[0]}
                    alt={item.name}
                    onClick={() => navigate({ name: 'product', slug: item.slug })}
                    className="w-24 aspect-[4/3] rounded-md object-cover shrink-0 cursor-pointer"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] uppercase tracking-wider text-[#84827B]">{item.brand}</p>
                    <h3
                      onClick={() => navigate({ name: 'product', slug: item.slug })}
                      className="text-base font-semibold truncate cursor-pointer"
                    >
                      {item.name}
                    </h3>
                    <p className="text-sm font-mono-num font-semibold mt-1">
                      {formatCurrency(item.price, currency)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleCompare(item)}
                    aria-label={`Remove ${item.name} from comparison`}
                    className="w-9 h-9 rounded-md border border-[#E5E3DD] dark:border-[#2C2C28] flex items-center justify-center text-[#5C5B57] hover:text-[#B91C1C] cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <dl className="divide-y divide-[#E5E3DD] dark:divide-[#2C2C28] border-y border-[#E5E3DD] dark:border-[#2C2C28] text-xs">
                  <div className="py-2 flex justify-between gap-3">
                    <dt className="text-[#84827B]">Highlights</dt>
                    <dd className="text-right">{item.cardHighlights?.join(' · ') || '—'}</dd>
                  </div>
                  <div className="py-2 flex justify-between gap-3">
                    <dt className="text-[#84827B]">Rating</dt>
                    <dd className="font-mono-num">
                      {item.rating.toFixed(1)} ({item.reviewCount})
                    </dd>
                  </div>
                  <div className="py-2 flex justify-between gap-3">
                    <dt className="text-[#84827B]">Availability</dt>
                    <dd className="capitalize">{item.availability.replace('-', ' ')}</dd>
                  </div>
                  <div className="py-2 flex justify-between gap-3">
                    <dt className="text-[#84827B]">Key Spec</dt>
                    <dd className="font-mono-num text-right">{item.specifications[0]?.value || '—'}</dd>
                  </div>
                  <div className="py-2 flex justify-between gap-3">
                    <dt className="text-[#84827B]">Warranty</dt>
                    <dd className="text-right">{item.warranty}</dd>
                  </div>
                </dl>

                <Button
                  variant="primary"
                  size="sm"
                  fullWidth
                  onClick={() =>
                    addToCart(
                      item,
                      item.colors[0].name,
                      item.colors[0].hex,
                      item.sizes[0],
                      1,
                      true
                    )
                  }
                >
                  Add to Bag
                </Button>
              </article>
            ))}
          </div>

          {/* Tablet & Desktop Matrix Table (>= 640px) */}
          <div className="hidden sm:block overflow-x-auto rounded-lg border border-[#E5E3DD] dark:border-[#2C2C28] bg-[#FFFFFF] dark:bg-[#191917]">
            <table className="w-full min-w-[680px] text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#E5E3DD] dark:border-[#2C2C28]">
                  <th className="w-44 p-5 text-xs uppercase tracking-wider text-[#84827B] align-top">
                    Object
                  </th>
                  {compared.map((item) => (
                    <th key={item.id} className="p-5 align-top min-w-[210px] font-normal">
                      <div className="space-y-3">
                        <div className="relative aspect-[4/3] rounded-md overflow-hidden bg-[#F2F0EC] dark:bg-[#22221F]">
                          <ResilientImage
                            src={item.images[0]}
                            alt={item.name}
                            className="w-full h-full object-cover cursor-pointer"
                            onClick={() => navigate({ name: 'product', slug: item.slug })}
                          />
                          <button
                            type="button"
                            onClick={() => toggleCompare(item)}
                            aria-label={`Remove ${item.name} from comparison`}
                            className="absolute top-2 right-2 w-8 h-8 rounded-md bg-white/90 dark:bg-[#191917]/90 flex items-center justify-center text-[#5C5B57] hover:text-[#B91C1C] cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-[11px] uppercase tracking-wider text-[#84827B]">
                          {item.brand}
                        </p>
                        <p
                          onClick={() => navigate({ name: 'product', slug: item.slug })}
                          className="font-semibold text-base cursor-pointer hover:text-[#8F6438] dark:hover:text-[#C89B67]"
                        >
                          {item.name}
                        </p>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E3DD] dark:divide-[#2C2C28]">
                <tr>
                  <td className="p-4 px-5 text-xs uppercase tracking-wider text-[#84827B]">Price</td>
                  {compared.map((item) => (
                    <td key={item.id} className="p-4 px-5 font-mono-num font-semibold">
                      {formatCurrency(item.price, currency)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 px-5 text-xs uppercase tracking-wider text-[#84827B]">Rating</td>
                  {compared.map((item) => (
                    <td key={item.id} className="p-4 px-5 font-mono-num">
                      <span className="inline-flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-[#8F6438] text-[#8F6438] dark:fill-[#C89B67] dark:text-[#C89B67]" />
                        {item.rating.toFixed(1)} ({item.reviewCount})
                      </span>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 px-5 text-xs uppercase tracking-wider text-[#84827B]">
                    Availability
                  </td>
                  {compared.map((item) => (
                    <td key={item.id} className="p-4 px-5 capitalize text-xs">
                      {item.availability.replace('-', ' ')}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 px-5 text-xs uppercase tracking-wider text-[#84827B]">
                    Dimensions / Key Spec
                  </td>
                  {compared.map((item) => (
                    <td key={item.id} className="p-4 px-5 text-xs font-mono-num">
                      {item.specifications[0]?.value || '—'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 px-5 text-xs uppercase tracking-wider text-[#84827B]">
                    Finishes
                  </td>
                  {compared.map((item) => (
                    <td key={item.id} className="p-4 px-5 text-xs">
                      {item.colors.map((c) => c.name).join(', ')}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 px-5 text-xs uppercase tracking-wider text-[#84827B]">
                    Warranty
                  </td>
                  {compared.map((item) => (
                    <td key={item.id} className="p-4 px-5 text-xs">
                      {item.warranty}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 px-5 text-xs uppercase tracking-wider text-[#84827B]">Action</td>
                  {compared.map((item) => (
                    <td key={item.id} className="p-4 px-5">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() =>
                          addToCart(
                            item,
                            item.colors[0].name,
                            item.colors[0].hex,
                            item.sizes[0],
                            1,
                            true
                          )
                        }
                      >
                        Add to Bag
                      </Button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
