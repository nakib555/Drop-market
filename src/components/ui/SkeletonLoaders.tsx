import React from 'react';
import { SkeletonLoader } from './Primitives';

interface ProductCardSkeletonProps {
  layout?: 'grid' | 'list';
}

export const ProductCardSkeleton: React.FC<ProductCardSkeletonProps> = ({ layout = 'grid' }) => {
  if (layout === 'list') {
    return (
      <div
        aria-hidden="true"
        className="flex flex-col sm:flex-row gap-5 sm:gap-6 p-4 sm:p-5 rounded-lg bg-[#FFFFFF] dark:bg-[#191917] border border-[#E5E3DD] dark:border-[#2C2C28]"
      >
        <SkeletonLoader className="w-full sm:w-60 md:w-64 aspect-[4/3] rounded-md shrink-0" />

        <div className="flex-1 min-w-0 flex flex-col justify-between gap-4">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <SkeletonLoader className="h-3 w-36" />
              <SkeletonLoader className="h-3 w-16" />
            </div>
            <SkeletonLoader className="h-6 w-2/3" />
            <SkeletonLoader className="h-4 w-full max-w-xl" />
            <SkeletonLoader className="h-4 w-4/5 max-w-md" />
            <div className="flex items-center gap-3 pt-1">
              <SkeletonLoader className="h-3.5 w-16" />
              <SkeletonLoader className="h-3.5 w-24" />
              <SkeletonLoader className="h-3.5 w-20" />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-[#E5E3DD] dark:border-[#2C2C28]">
            <SkeletonLoader className="h-5 w-24" />
            <div className="flex items-center gap-2">
              <SkeletonLoader className="w-10 h-10 rounded-md" />
              <SkeletonLoader className="w-10 h-10 rounded-md" />
              <SkeletonLoader className="w-24 h-10 rounded-md" />
              <SkeletonLoader className="w-28 h-10 rounded-md" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className="flex flex-col rounded-lg bg-[#FFFFFF] dark:bg-[#191917] border border-[#E5E3DD] dark:border-[#2C2C28] overflow-hidden"
    >
      <SkeletonLoader className="w-full aspect-[4/3] rounded-none" />

      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between gap-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <SkeletonLoader className="h-3 w-20" />
            <SkeletonLoader className="h-3 w-10" />
          </div>
          <SkeletonLoader className="h-5 w-4/5" />
          <div className="flex items-center justify-between gap-2 pt-0.5">
            <SkeletonLoader className="h-3 w-32" />
            <div className="flex items-center gap-1 shrink-0">
              <SkeletonLoader className="w-3 h-3 rounded-full" />
              <SkeletonLoader className="w-3 h-3 rounded-full" />
              <SkeletonLoader className="w-3 h-3 rounded-full" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-[#E5E3DD] dark:border-[#2C2C28]">
          <SkeletonLoader className="h-5 w-20" />
          <SkeletonLoader className="h-9 w-16 rounded-md" />
        </div>
      </div>
    </div>
  );
};

interface ProductGridSkeletonProps {
  count?: number;
  layout?: 'grid' | 'list';
  className?: string;
  label?: string;
}

export const ProductGridSkeleton: React.FC<ProductGridSkeletonProps> = ({
  count = 6,
  layout = 'grid',
  className,
  label = 'Loading catalog products',
}) => {
  const defaultClass =
    layout === 'list'
      ? 'space-y-4'
      : 'grid grid-cols-1 min-[390px]:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6';

  return (
    <div role="status" aria-busy="true" aria-label={label} className={className || defaultClass}>
      <span className="sr-only">{label}...</span>
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} layout={layout} />
      ))}
    </div>
  );
};

export const ProductDetailSkeleton: React.FC = () => (
  <div
    role="status"
    aria-busy="true"
    aria-label="Loading product details"
    className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8 lg:py-12 pb-20 lg:pb-16 space-y-14"
  >
    <span className="sr-only">Loading product details...</span>

    {/* Breadcrumb Skeleton */}
    <div aria-hidden="true" className="flex items-center gap-2">
      <SkeletonLoader className="h-3.5 w-12" />
      <SkeletonLoader className="h-3.5 w-24" />
      <SkeletonLoader className="h-3.5 w-20" />
      <SkeletonLoader className="h-3.5 w-40" />
    </div>

    {/* Main Split: Left Gallery + Right Sticky Purchase Module */}
    <div aria-hidden="true" className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
      <div className="lg:col-span-7 space-y-4">
        <SkeletonLoader className="w-full aspect-[4/3] rounded-lg" />
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
          {Array.from({ length: 4 }).map((_, idx) => (
            <SkeletonLoader key={idx} className="w-full aspect-[4/3] rounded-md" />
          ))}
        </div>
      </div>

      <div className="lg:col-span-5 lg:sticky lg:top-28 space-y-6 p-5 sm:p-7 rounded-lg bg-[#FFFFFF] dark:bg-[#191917] border border-[#E5E3DD] dark:border-[#2C2C28]">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <SkeletonLoader className="h-3.5 w-28" />
            <SkeletonLoader className="h-3.5 w-20" />
          </div>
          <SkeletonLoader className="h-9 w-4/5" />
          <SkeletonLoader className="h-4 w-2/5" />
          <div className="flex items-center gap-3 pt-1">
            <SkeletonLoader className="h-4 w-28" />
            <SkeletonLoader className="h-4 w-32" />
          </div>
        </div>

        <div className="flex items-baseline gap-3 pb-4 border-b border-[#E5E3DD] dark:border-[#2C2C28]">
          <SkeletonLoader className="h-8 w-28" />
          <SkeletonLoader className="h-5 w-16" />
        </div>

        <div className="space-y-2">
          <SkeletonLoader className="h-4 w-full" />
          <SkeletonLoader className="h-4 w-11/12" />
          <SkeletonLoader className="h-4 w-3/4" />
        </div>

        <div className="space-y-2.5">
          <SkeletonLoader className="h-3.5 w-32" />
          <div className="flex flex-wrap gap-2">
            <SkeletonLoader className="h-10 w-28 rounded-md" />
            <SkeletonLoader className="h-10 w-24 rounded-md" />
            <SkeletonLoader className="h-10 w-24 rounded-md" />
          </div>
        </div>

        <div className="space-y-2.5">
          <SkeletonLoader className="h-3.5 w-28" />
          <div className="flex flex-wrap gap-2">
            <SkeletonLoader className="h-10 w-20 rounded-md" />
            <SkeletonLoader className="h-10 w-20 rounded-md" />
            <SkeletonLoader className="h-10 w-24 rounded-md" />
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <div className="flex flex-col min-[390px]:flex-row gap-3">
            <SkeletonLoader className="h-12 w-full min-[390px]:w-32 rounded-md shrink-0" />
            <SkeletonLoader className="h-12 w-full rounded-md" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <SkeletonLoader className="h-10 w-full rounded-md col-span-2 sm:col-span-1" />
            <SkeletonLoader className="h-10 w-full rounded-md" />
            <SkeletonLoader className="h-10 w-full rounded-md" />
          </div>
        </div>

        <div className="pt-4 border-t border-[#E5E3DD] dark:border-[#2C2C28] space-y-2.5">
          <SkeletonLoader className="h-4 w-4/5" />
          <SkeletonLoader className="h-4 w-3/5" />
          <SkeletonLoader className="h-4 w-2/3" />
        </div>
      </div>
    </div>

    {/* Tabs & Specifications Skeleton */}
    <section
      aria-hidden="true"
      className="pt-8 border-t border-[#E5E3DD] dark:border-[#2C2C28] space-y-8"
    >
      <div className="flex items-center gap-6 pb-3.5 border-b border-[#E5E3DD] dark:border-[#2C2C28]">
        <SkeletonLoader className="h-5 w-36" />
        <SkeletonLoader className="h-5 w-24" />
        <SkeletonLoader className="h-5 w-20" />
        <SkeletonLoader className="h-5 w-32" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="py-2 flex items-center justify-between gap-4">
              <SkeletonLoader className="h-4 w-32" />
              <SkeletonLoader className="h-4 w-40" />
            </div>
          ))}
        </div>
        <SkeletonLoader className="h-44 w-full rounded-lg" />
      </div>
    </section>
  </div>
);
