import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, Package, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { STUDIO_TRANSITION } from '../../utils/motion';
import { Button } from './Button';

export function useFocusTrap(
  open: boolean,
  containerRef: React.RefObject<HTMLElement | null>
): void {
  useEffect(() => {
    if (!open) return;
    const prevFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const getFocusable = () => {
      const root = containerRef.current;
      if (!root) return [] as HTMLElement[];
      return Array.from(
        root.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);
    };

    const focusTimer = window.setTimeout(() => {
      const list = getFocusable();
      if (list.length > 0) {
        list[0].focus();
      } else {
        containerRef.current?.focus();
      }
    }, 20);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const list = getFocusable();
      if (list.length === 0) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first || !containerRef.current?.contains(document.activeElement)) {
          e.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last || !containerRef.current?.contains(document.activeElement)) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', onKeyDown);
      if (prevFocused && document.contains(prevFocused)) {
        prevFocused.focus();
      }
    };
  }, [open, containerRef]);
}

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

export const Breadcrumb: React.FC<{ items: BreadcrumbItem[] }> = ({ items }) => (
  <nav aria-label="Breadcrumb" className="flex items-baseline flex-wrap gap-x-2 gap-y-1 text-xs text-[var(--ks-text-secondary)]">
    {items.map((item, idx) => {
      const isLast = idx === items.length - 1;
      return (
        <React.Fragment key={`${item.label}-${idx}`}>
          {idx > 0 && <span aria-hidden="true">/</span>}
          {isLast || !item.onClick ? (
            <span className={isLast ? 'text-[var(--ks-text-primary)] font-medium' : ''}>
              {item.label}
            </span>
          ) : (
            <button
              type="button"
              onClick={item.onClick}
              className="text-left hover:text-[var(--ks-text-primary)] transition-colors cursor-pointer"
            >
              {item.label}
            </button>
          )}
        </React.Fragment>
      );
    })}
  </nav>
);

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-2 pt-8">
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous page"
        className="w-10 h-10 rounded-md border border-[var(--ks-border)] flex items-center justify-center text-[var(--ks-text-primary)] disabled:opacity-40 cursor-pointer hover:bg-[var(--ks-surface-muted)] transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      {pages.map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => onPageChange(page)}
          aria-current={page === currentPage ? 'page' : undefined}
          className={`w-10 h-10 rounded-md text-sm font-mono-num transition-colors cursor-pointer ${
            page === currentPage
              ? 'bg-[var(--ks-action)] text-[var(--ks-action-text)] font-medium'
              : 'border border-[var(--ks-border)] text-[var(--ks-text-secondary)] hover:text-[var(--ks-text-primary)]'
          }`}
        >
          {page}
        </button>
      ))}
      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Next page"
        className="w-10 h-10 rounded-md border border-[var(--ks-border)] flex items-center justify-center text-[var(--ks-text-primary)] disabled:opacity-40 cursor-pointer hover:bg-[var(--ks-surface-muted)] transition-colors"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  );
};

interface AccordionItemData {
  id: string;
  title: string;
  meta?: string;
  content: string;
}

export const Accordion: React.FC<{ items: AccordionItemData[] }> = ({ items }) => {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id || null);

  return (
    <div className="divide-y divide-[var(--ks-border)] border-y border-[var(--ks-border)]">
      {items.map((item) => {
        const isOpen = openId === item.id;
        return (
          <div key={item.id}>
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpenId(isOpen ? null : item.id)}
              className="w-full py-5 flex items-start justify-between gap-4 text-left cursor-pointer group"
            >
              <div className="flex flex-col gap-1 min-w-0 flex-1">
                {item.meta && (
                  <span className="text-xs text-[var(--ks-text-muted)]">{item.meta}</span>
                )}
                <span className="text-base font-medium leading-snug text-[var(--ks-text-primary)] group-hover:text-[var(--ks-accent)] transition-colors">
                  {item.title}
                </span>
              </div>
              <ChevronDown
                className={`w-4 h-4 shrink-0 mt-1 text-[#5C5B57] dark:text-[#A3A19B] transition-transform duration-200 ${
                  isOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={STUDIO_TRANSITION.base}
                  className="overflow-hidden"
                >
                  <div className="pb-5 text-sm leading-relaxed text-[#5C5B57] dark:text-[#B4B2AC] max-w-3xl">
                    {item.content}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  maxWidthClass?: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  maxWidthClass = 'max-w-3xl',
  children,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(open, panelRef);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={STUDIO_TRANSITION.fast}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/55 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-label={title || 'Dialog'}
          onClick={onClose}
        >
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            key="modal-panel"
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 6 }}
            transition={STUDIO_TRANSITION.base}
            className={`relative w-full ${maxWidthClass} max-h-[90vh] overflow-y-auto rounded-lg bg-[var(--ks-surface)] text-[var(--ks-text-primary)] border border-[var(--ks-border)] shadow-2xl focus:outline-none`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-6 py-4 bg-[var(--ks-surface)]/95 backdrop-blur-sm border-b border-[var(--ks-border)]">
              {title ? <h2 className="text-lg font-medium leading-snug min-w-0 truncate">{title}</h2> : <span />}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close modal"
                className="w-10 h-10 -mr-1 shrink-0 rounded-md flex items-center justify-center text-[var(--ks-text-secondary)] hover:bg-[var(--ks-surface-muted)] hover:text-[var(--ks-text-primary)] cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  side?: 'left' | 'right';
  children: React.ReactNode;
}

export const Drawer: React.FC<DrawerProps> = ({
  open,
  onClose,
  title,
  side = 'right',
  children,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(open, panelRef);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="drawer-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={STUDIO_TRANSITION.fast}
          className="fixed inset-0 z-50 flex bg-black/50 backdrop-blur-[1px]"
          role="dialog"
          aria-modal="true"
          aria-label={title}
          onClick={onClose}
        >
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            key="drawer-panel"
            initial={{ x: side === 'right' ? '100%' : '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: side === 'right' ? '100%' : '-100%' }}
            transition={STUDIO_TRANSITION.drawer}
            className={`relative w-full max-w-md h-full bg-[var(--ks-surface)] text-[var(--ks-text-primary)] border-[var(--ks-border)] shadow-2xl flex flex-col focus:outline-none ${
              side === 'right' ? 'ml-auto border-l' : 'mr-auto border-r'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-[var(--ks-border)]">
              <h2 className="font-display text-2xl font-medium tracking-tight min-w-0 truncate">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label={`Close ${title}`}
                className="w-10 h-10 -mr-1 shrink-0 rounded-md flex items-center justify-center text-[var(--ks-text-secondary)] hover:bg-[var(--ks-surface-muted)] cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}) => (
  <div className="py-16 px-6 text-center max-w-md mx-auto flex flex-col items-center gap-4">
    <div className="w-12 h-12 rounded-lg bg-[var(--ks-surface-muted)] flex items-center justify-center text-[var(--ks-text-secondary)]">
      {icon || <Package className="w-5 h-5" />}
    </div>
    <h2 className="font-display text-2xl font-medium text-[var(--ks-text-primary)]">{title}</h2>
    <p className="text-sm text-[var(--ks-text-secondary)] leading-relaxed">{description}</p>
    {actionLabel && onAction && (
      <Button variant="primary" size="md" onClick={onAction} className="mt-2">
        {actionLabel}
      </Button>
    )}
  </div>
);

export const SkeletonLoader: React.FC<{ className?: string }> = ({ className = 'h-6 w-full' }) => (
  <div
    aria-hidden="true"
    className={`animate-pulse rounded-md bg-[var(--ks-surface-muted)] ${className}`}
  />
);

export {
  ProductCardSkeleton,
  ProductGridSkeleton,
  ProductDetailSkeleton,
  RouteSuspenseFallback,
} from './SkeletonLoaders';

interface ResilientImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackTitle?: string;
}

export const ResilientImage: React.FC<ResilientImageProps> = ({
  src,
  alt,
  fallbackTitle,
  className = '',
  decoding = 'async',
  fetchPriority,
  ...rest
}) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (failed || !src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center gap-2 bg-[var(--ks-surface-muted)] text-[var(--ks-text-secondary)] p-4 text-center ${className}`}
      >
        <Package className="w-6 h-6 opacity-60" aria-hidden="true" />
        <span className="text-xs font-medium">{fallbackTitle || alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      decoding={decoding}
      fetchPriority={fetchPriority}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
      {...rest}
    />
  );
};
