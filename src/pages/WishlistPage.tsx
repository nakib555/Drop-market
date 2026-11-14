import React from 'react';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatCurrency, isProductOutOfStock } from '../utils/format';
import { Button } from '../components/ui/Button';
import {
  Breadcrumb,
  EmptyState,
  ProductGridSkeleton,
  ResilientImage,
} from '../components/ui/Primitives';

export const WishlistPage: React.FC = () => {
  const {
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
          { label: 'Home', onClick: () => navigate({ name: 'home' }) },
          { label: 'Wishlist' },
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#E5E3DD] dark:border-[#2C2C28]">
        <div>
          <h1 className="font-display text-3xl sm:text-5xl font-medium">Saved Wishlist</h1>
          <p className="text-sm text-[#5C5B57] dark:text-[#A3A19B] mt-1 font-mono-num">
            {savedProducts.length} saved {savedProducts.length === 1 ? 'product' : 'products'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate({ name: 'shop', category: 'all' })}>
          Browse More Products
        </Button>
      </div>

      {storefrontLoading ? (
        <ProductGridSkeleton
          count={3}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          label="Loading saved wishlist"
        />
      ) : savedProducts.length === 0 ? (
        <div className="rounded-lg bg-[#FFFFFF] dark:bg-[#191917] border border-[#E5E3DD] dark:border-[#2C2C28]">
          <EmptyState
            icon={<Heart className="w-6 h-6" />}
            title="Your wishlist is empty"
            description="Save audio gear, garments, botanical skincare, coffee sets, and living pieces as you browse."
            actionLabel="Explore Catalog"
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
                className="rounded-lg bg-[#FFFFFF] dark:bg-[#191917] border border-[#E5E3DD] dark:border-[#2C2C28] overflow-hidden flex flex-col"
              >
                <div
                  onClick={() => navigate({ name: 'product', slug: product.slug })}
                  className="aspect-[4/3] bg-[#F2F0EC] dark:bg-[#22221F] overflow-hidden cursor-pointer"
                >
                  <ResilientImage
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover hover:scale-[1.03] transition-transform duration-300"
                  />
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                  <div>
                    <div className="flex items-baseline justify-between gap-2 text-xs text-[#84827B]">
                      <span className="uppercase tracking-wider min-w-0 truncate">{product.brand}</span>
                      <span
                        className={`shrink-0 text-right ${
                          outOfStock
                            ? 'text-[#B91C1C] dark:text-[#F87171]'
                            : product.availability === 'low-stock'
                            ? 'text-[#B45309] dark:text-[#FBBF24]'
                            : 'text-[#1F6E43] dark:text-[#4ADE80]'
                        }`}
                      >
                        {outOfStock
                          ? 'Out of Stock'
                          : product.availability === 'in-stock'
                          ? 'In Stock'
                          : product.availability === 'low-stock'
                          ? `Low Stock (${product.stockCount})`
                          : 'Made to Order'}
                      </span>
                    </div>
                    <h3
                      onClick={() => navigate({ name: 'product', slug: product.slug })}
                      className="text-base font-semibold mt-1 cursor-pointer hover:text-[#8F6438] dark:hover:text-[#C89B67]"
                    >
                      {product.name}
                    </h3>
                    <p className="text-sm font-mono-num font-semibold mt-2">
                      {formatCurrency(product.price, currency)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-[#E5E3DD] dark:border-[#2C2C28]">
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
                      <span>{outOfStock ? 'Out of Stock' : 'Add to Bag'}</span>
                    </Button>
                    <button
                      type="button"
                      onClick={() => toggleWishlist(product)}
                      aria-label={`Remove ${product.name} from wishlist`}
                      className="w-10 h-10 rounded-md border border-[#E5E3DD] dark:border-[#2C2C28] flex items-center justify-center text-[#5C5B57] hover:text-[#B91C1C] dark:hover:text-[#F87171] cursor-pointer shrink-0"
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
