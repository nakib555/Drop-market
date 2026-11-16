import React from 'react';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { isProductOutOfStock } from '../utils/format';
import { t } from '../utils/i18n';
import { PriceDisplay } from '../components/product/CommercePrimitives';
import { Button } from '../components/ui/Button';
import {
  Breadcrumb,
  EmptyState,
  ProductGridSkeleton,
  ResilientImage,
} from '../components/ui/Primitives';

export const WishlistPage: React.FC = () => {
  const {
    language,
    currency,
    products,
    wishlistIds,
    toggleWishlist,
    addToCart,
    navigate,
    storefrontLoading,
  } = useStore();
  const savedProducts = products.filter((p) => wishlistIds.includes(p.id));

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-12 space-y-10">
      <Breadcrumb
        items={[
          { label: t(language, 'home'), onClick: () => navigate({ name: 'home' }) },
          { label: t(language, 'wishlist') },
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[var(--ks-border)]">
        <div>
          <h1 className="font-display text-3xl sm:text-5xl font-medium">
            {t(language, 'savedWishlist')}
          </h1>
          <p className="text-sm text-[var(--ks-text-secondary)] mt-1 font-mono-num">
            {savedProducts.length === 1
              ? t(language, 'productsCountSingle', { count: savedProducts.length })
              : t(language, 'productsCountPlural', { count: savedProducts.length })}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate({ name: 'shop', category: 'all' })}>
          {t(language, 'browseMoreProducts')}
        </Button>
      </div>

      {storefrontLoading ? (
        <ProductGridSkeleton
          count={3}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          label="Loading saved wishlist"
        />
      ) : savedProducts.length === 0 ? (
        <div className="rounded-lg bg-[var(--ks-surface)] border border-[var(--ks-border)]">
          <EmptyState
            icon={<Heart className="w-6 h-6" />}
            title={t(language, 'wishlistEmpty')}
            description={t(language, 'wishlistEmptyDesc')}
            actionLabel={t(language, 'exploreCatalog')}
            onAction={() => navigate({ name: 'shop', category: 'all' })}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedProducts.map((product) => {
            const outOfStock = isProductOutOfStock(product);
            const primaryColor = product.colors[0] || { name: 'Standard', hex: '#84827B' };
            const primarySize = product.sizes[0] || 'Standard';
            return (
              <article
                key={product.id}
                className="rounded-lg bg-[var(--ks-surface)] border border-[var(--ks-border)] overflow-hidden flex flex-col"
              >
                <button
                  type="button"
                  onClick={() => navigate({ name: 'product', slug: product.slug })}
                  aria-label={`View ${product.name}`}
                  className="aspect-[4/3] w-full bg-[var(--ks-surface-muted)] overflow-hidden cursor-pointer block text-start"
                >
                  <ResilientImage
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover hover:scale-[1.03] transition-transform duration-300"
                  />
                </button>

                <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                  <div>
                    <div className="flex items-baseline justify-between gap-2 text-xs text-[var(--ks-text-muted)]">
                      <span className="uppercase tracking-wider min-w-0 truncate">{product.brand}</span>
                      <span
                        className={`shrink-0 text-end ${
                          outOfStock
                            ? 'text-[var(--ks-error)]'
                            : product.availability === 'low-stock'
                            ? 'text-[var(--ks-warning)]'
                            : 'text-[var(--ks-success)]'
                        }`}
                      >
                        {outOfStock
                          ? t(language, 'outOfStock')
                          : product.availability === 'in-stock'
                          ? t(language, 'inStock')
                          : product.availability === 'low-stock'
                          ? t(language, 'lowStockCount', { count: product.stockCount })
                          : t(language, 'madeToOrder')}
                      </span>
                    </div>
                    <h2 className="text-base font-semibold mt-1">
                      <button
                        type="button"
                        onClick={() => navigate({ name: 'product', slug: product.slug })}
                        className="text-start hover:text-[var(--ks-accent)] cursor-pointer"
                      >
                        {product.name}
                      </button>
                    </h2>
                    <PriceDisplay
                      price={product.price}
                      originalPrice={product.originalPrice}
                      currency={currency}
                      size="sm"
                      className="mt-2"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-[var(--ks-border)]">
                    <Button
                      variant="primary"
                      size="sm"
                      fullWidth
                      disabled={outOfStock}
                      onClick={() =>
                        addToCart(
                          product,
                          primaryColor.name,
                          primaryColor.hex,
                          primarySize,
                          1,
                          true
                        )
                      }
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>{outOfStock ? t(language, 'outOfStock') : t(language, 'addToBag')}</span>
                    </Button>
                    <button
                      type="button"
                      onClick={() => toggleWishlist(product)}
                      aria-label={`Remove ${product.name} from wishlist`}
                      className="w-11 h-11 rounded-md border border-[var(--ks-border)] flex items-center justify-center text-[var(--ks-text-secondary)] hover:text-[var(--ks-error)] cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
