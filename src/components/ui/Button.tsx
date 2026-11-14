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
    'bg-[#171716] text-[#FAF9F6] hover:bg-[#2E2D2A] dark:bg-[#F4F3EF] dark:text-[#171716] dark:hover:bg-[#E2E0D8] border border-transparent',
  secondary:
    'bg-[#8F6438] text-white hover:bg-[#76512B] dark:bg-[#C89B67] dark:text-[#171716] dark:hover:bg-[#D6AE80] border border-transparent',
  outline:
    'bg-transparent text-[#171716] dark:text-[#F4F3EF] border border-[#D4D1C9] dark:border-[#3A3934] hover:border-[#171716] dark:hover:border-[#F4F3EF] hover:bg-[#F2F0EC]/60 dark:hover:bg-[#22221F]',
  ghost:
    'bg-transparent text-[#5C5B57] dark:text-[#B4B2AC] hover:text-[#171716] dark:hover:text-[#F4F3EF] hover:bg-[#F2F0EC] dark:hover:bg-[#22221F] border border-transparent',
  destructive:
    'bg-[#B91C1C] text-white hover:bg-[#991B1B] dark:bg-[#EF4444] dark:text-[#171716] dark:hover:bg-[#F87171] border border-transparent',
  text:
    'bg-transparent text-[#171716] dark:text-[#F4F3EF] underline-offset-4 hover:underline border border-transparent !px-0 !py-1',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  xs: 'px-3 py-1.5 text-xs min-h-[36px]',
  sm: 'px-4 py-2 text-xs min-h-[40px]',
  md: 'px-5 py-2.5 text-sm min-h-[42px]',
  lg: 'px-6 sm:px-7 py-3 text-sm min-h-[48px]',
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
      className={`inline-flex items-center justify-center gap-2 font-medium tracking-tight rounded-md transition-[color,background-color,border-color,transform] duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.985] cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed disabled:active:scale-100 ${
        fullWidth ? 'w-full text-center' : 'whitespace-nowrap shrink-0'
      } ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...rest}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />}
      {children}
    </button>
  );
};
