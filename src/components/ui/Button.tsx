import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'text';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--ks-action)] text-[var(--ks-action-text)] hover:bg-[var(--ks-action-hover)] border border-transparent',
  secondary:
    'bg-[var(--ks-accent)] text-[var(--ks-accent-text)] hover:bg-[var(--ks-accent-hover)] border border-transparent',
  outline:
    'bg-transparent text-[var(--ks-text-primary)] border border-[var(--ks-border-strong)] hover:border-[var(--ks-action)] hover:bg-[var(--ks-bg-secondary)]/70',
  ghost:
    'bg-transparent text-[var(--ks-text-secondary)] hover:text-[var(--ks-text-primary)] hover:bg-[var(--ks-bg-secondary)] border border-transparent',
  destructive:
    'bg-[var(--ks-error)] text-white dark:text-[#171716] hover:opacity-90 border border-transparent',
  text:
    'bg-transparent text-[var(--ks-text-primary)] underline-offset-4 hover:underline border border-transparent !px-0 !py-1',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  xs: 'px-3 py-1.5 text-xs min-h-[var(--ks-height-xs)]',
  sm: 'px-4 py-2 text-xs min-h-[var(--ks-height-sm)]',
  md: 'px-5 py-2.5 text-sm min-h-[var(--ks-height-md)]',
  lg: 'px-6 sm:px-7 py-3 text-sm min-h-[var(--ks-height-lg)]',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  className = '',
  children,
  type = 'button',
  ...rest
}) => {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 font-medium tracking-tight leading-snug rounded-[var(--ks-radius-md)] transition-[color,background-color,border-color,transform] duration-[var(--ks-duration-fast)] ease-[var(--ks-ease-standard)] active:scale-[0.985] cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed disabled:active:scale-100 ${
        fullWidth ? 'w-full text-center' : 'whitespace-nowrap shrink-0'
      } ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...rest}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />}
      {children}
    </button>
  );
};
