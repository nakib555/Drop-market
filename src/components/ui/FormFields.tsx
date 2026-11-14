import React, { useId } from 'react';
import { AlertCircle, Check } from 'lucide-react';

interface BaseFieldProps {
  label: string;
  error?: string;
  helperText?: string;
  required?: boolean;
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement>, BaseFieldProps {}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  required,
  id,
  className = '',
  ...rest
}) => {
  const generatedId = useId();
  const inputId = id || generatedId;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-help`;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label
        htmlFor={inputId}
        className="text-xs font-medium text-[#171716] dark:text-[#F4F3EF] flex items-center gap-1"
      >
        <span>{label}</span>
        {required && (
          <span className="text-[#B91C1C] dark:text-[#F87171]" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <input
        id={inputId}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : helperText ? helperId : undefined}
        className={`w-full min-h-[42px] px-3.5 py-2.5 text-sm rounded-md bg-white dark:bg-[#191917] text-[#171716] dark:text-[#F4F3EF] placeholder:text-[#84827B] border transition-colors ${
          error
            ? 'border-[#B91C1C] dark:border-[#F87171]'
            : 'border-[#DCD9D0] dark:border-[#2E2E2A] focus:border-[#171716] dark:focus:border-[#F4F3EF]'
        } ${className}`}
        {...rest}
      />
      {error && (
        <p id={errorId} className="text-xs text-[#B91C1C] dark:text-[#F87171] flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
      {!error && helperText && (
        <p id={helperId} className="text-xs text-[#5C5B57] dark:text-[#A3A19B]">
          {helperText}
        </p>
      )}
    </div>
  );
};

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement>, BaseFieldProps {
  options: { value: string; label: string }[];
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  helperText,
  required,
  options,
  id,
  className = '',
  ...rest
}) => {
  const generatedId = useId();
  const selectId = id || generatedId;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label
        htmlFor={selectId}
        className="text-xs font-medium text-[#171716] dark:text-[#F4F3EF] flex items-center gap-1"
      >
        <span>{label}</span>
        {required && (
          <span className="text-[#B91C1C] dark:text-[#F87171]" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <select
        id={selectId}
        required={required}
        aria-invalid={Boolean(error)}
        className={`w-full min-h-[42px] px-3.5 py-2 text-sm rounded-md bg-white dark:bg-[#191917] text-[#171716] dark:text-[#F4F3EF] border transition-colors ${
          error
            ? 'border-[#B91C1C] dark:border-[#F87171]'
            : 'border-[#DCD9D0] dark:border-[#2E2E2A] focus:border-[#171716] dark:focus:border-[#F4F3EF]'
        } ${className}`}
        {...rest}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-xs text-[#B91C1C] dark:text-[#F87171] flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
      {!error && helperText && (
        <p className="text-xs text-[#5C5B57] dark:text-[#A3A19B]">{helperText}</p>
      )}
    </div>
  );
};

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement>, BaseFieldProps {}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  helperText,
  required,
  id,
  className = '',
  ...rest
}) => {
  const generatedId = useId();
  const areaId = id || generatedId;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label
        htmlFor={areaId}
        className="text-xs font-medium text-[#171716] dark:text-[#F4F3EF] flex items-center gap-1"
      >
        <span>{label}</span>
        {required && (
          <span className="text-[#B91C1C] dark:text-[#F87171]" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <textarea
        id={areaId}
        required={required}
        aria-invalid={Boolean(error)}
        className={`w-full px-3.5 py-2.5 text-sm rounded-md bg-white dark:bg-[#191917] text-[#171716] dark:text-[#F4F3EF] placeholder:text-[#84827B] border transition-colors ${
          error
            ? 'border-[#B91C1C] dark:border-[#F87171]'
            : 'border-[#DCD9D0] dark:border-[#2E2E2A] focus:border-[#171716] dark:focus:border-[#F4F3EF]'
        } ${className}`}
        {...rest}
      />
      {error && (
        <p className="text-xs text-[#B91C1C] dark:text-[#F87171] flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
      {!error && helperText && (
        <p className="text-xs text-[#5C5B57] dark:text-[#A3A19B]">{helperText}</p>
      )}
    </div>
  );
};

interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  checked,
  onChange,
  description,
}) => {
  const id = useId();
  return (
    <label htmlFor={id} className="flex items-start gap-3 cursor-pointer select-none group min-h-[32px]">
      <span className="relative flex items-center justify-center w-4 h-4 mt-0.5 shrink-0">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <span
          className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition-colors ${
            checked
              ? 'bg-[#171716] border-[#171716] dark:bg-[#F4F3EF] dark:border-[#F4F3EF] text-white dark:text-[#171716]'
              : 'bg-white dark:bg-[#191917] border-[#C8C5BC] dark:border-[#3A3934] group-hover:border-[#171716] dark:group-hover:border-[#F4F3EF]'
          }`}
        >
          {checked && <Check className="w-3 h-3 stroke-[2.5]" aria-hidden="true" />}
        </span>
      </span>
      <span className="flex flex-col">
        <span className="text-sm text-[#171716] dark:text-[#F4F3EF] leading-snug">{label}</span>
        {description && (
          <span className="text-xs text-[#5C5B57] dark:text-[#A3A19B] mt-0.5">{description}</span>
        )}
      </span>
    </label>
  );
};
