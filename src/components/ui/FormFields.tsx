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
        className="text-xs font-medium text-[var(--ks-text-primary)] inline-flex items-baseline gap-1"
      >
        <span>{label}</span>
        {required && (
          <span className="text-[var(--ks-error)]" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <input
        id={inputId}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : helperText ? helperId : undefined}
        className={`w-full min-h-[42px] px-3.5 py-2.5 text-sm rounded-[var(--ks-radius-md)] bg-[var(--ks-surface)] text-[var(--ks-text-primary)] placeholder:text-[var(--ks-text-muted)] border transition-colors ${
          error
            ? 'border-[var(--ks-error)]'
            : 'border-[var(--ks-border-strong)] focus:border-[var(--ks-action)]'
        } ${className}`}
        {...rest}
      />
      {error && (
        <p id={errorId} role="alert" className="text-xs leading-snug text-[var(--ks-error)] flex items-start gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-[2px]" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
      {!error && helperText && (
        <p id={helperId} className="text-xs text-[var(--ks-text-secondary)]">
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
  const errorId = `${selectId}-error`;
  const helperId = `${selectId}-help`;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label
        htmlFor={selectId}
        className="text-xs font-medium text-[var(--ks-text-primary)] inline-flex items-baseline gap-1"
      >
        <span>{label}</span>
        {required && (
          <span className="text-[var(--ks-error)]" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <select
        id={selectId}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : helperText ? helperId : undefined}
        className={`w-full min-h-[42px] px-3.5 py-2 text-sm rounded-[var(--ks-radius-md)] bg-[var(--ks-surface)] text-[var(--ks-text-primary)] border transition-colors ${
          error
            ? 'border-[var(--ks-error)]'
            : 'border-[var(--ks-border-strong)] focus:border-[var(--ks-action)]'
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
        <p id={errorId} role="alert" className="text-xs leading-snug text-[var(--ks-error)] flex items-start gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-[2px]" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
      {!error && helperText && (
        <p id={helperId} className="text-xs text-[var(--ks-text-secondary)]">
          {helperText}
        </p>
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
  const errorId = `${areaId}-error`;
  const helperId = `${areaId}-help`;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label
        htmlFor={areaId}
        className="text-xs font-medium text-[var(--ks-text-primary)] inline-flex items-baseline gap-1"
      >
        <span>{label}</span>
        {required && (
          <span className="text-[var(--ks-error)]" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <textarea
        id={areaId}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : helperText ? helperId : undefined}
        className={`w-full px-3.5 py-2.5 text-sm rounded-[var(--ks-radius-md)] bg-[var(--ks-surface)] text-[var(--ks-text-primary)] placeholder:text-[var(--ks-text-muted)] border transition-colors ${
          error
            ? 'border-[var(--ks-error)]'
            : 'border-[var(--ks-border-strong)] focus:border-[var(--ks-action)]'
        } ${className}`}
        {...rest}
      />
      {error && (
        <p id={errorId} role="alert" className="text-xs leading-snug text-[var(--ks-error)] flex items-start gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-[2px]" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
      {!error && helperText && (
        <p id={helperId} className="text-xs text-[var(--ks-text-secondary)]">
          {helperText}
        </p>
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
    <label htmlFor={id} className="flex items-start gap-3 cursor-pointer select-none group min-h-[36px] py-1">
      <span className="relative flex items-center justify-center w-4 h-4 mt-[3px] shrink-0">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <span
          className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--ks-accent)] peer-focus-visible:ring-offset-2 ${
            checked
              ? 'bg-[var(--ks-action)] border-[var(--ks-action)] text-[var(--ks-action-text)]'
              : 'bg-[var(--ks-surface)] border-[var(--ks-border-strong)] group-hover:border-[var(--ks-action)]'
          }`}
        >
          {checked && <Check className="w-3 h-3 stroke-[2.5]" aria-hidden="true" />}
        </span>
      </span>
      <span className="flex flex-col">
        <span className="text-sm text-[var(--ks-text-primary)] leading-snug">{label}</span>
        {description && (
          <span className="text-xs text-[var(--ks-text-secondary)] mt-0.5">{description}</span>
        )}
      </span>
    </label>
  );
};
