import React, { useState, useRef, useEffect } from 'react';
import MaskedInput from './MaskedInput';

interface FloatingInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'password' | 'email' | 'number' | 'tel' | 'url';
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  success?: boolean;
  maxLength?: number;
  showPasswordToggle?: boolean;
  mask?: string; // Input mask (e.g., "(999) 999-9999")
  maskPlaceholderChar?: string; // Placeholder character for mask
  autoComplete?: string; // HTML autocomplete attribute
  className?: string;
}

const FloatingInput: React.FC<FloatingInputProps> = ({
  label,
  value,
  onChange,
  type = 'text',
  placeholder = '',
  required = false,
  disabled = false,
  error = '',
  success = false,
  maxLength,
  showPasswordToggle = false,
  mask,
  maskPlaceholderChar = '_',
  autoComplete,
  className = ''
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current && !disabled) {
      inputRef.current.focus();
    }
  }, [disabled]);

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };
  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const hasValue = value.length > 0;
  const isValid = !error && (success || !required || hasValue);
  const inputType = type === 'password' && showPasswordToggle ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={`relative w-full mb-4 ${className}`}>
      <label
        htmlFor={`floating-input-${label.toLowerCase().replace(/\s+/g, '-')}`}
        className={`pointer-events-none absolute left-3 top-${isFocused || hasValue ? '-10px' : '16px'} 
                   origin-left transition-all duration-200 ease-out 
                   text-${isFocused || hasValue ? 'primary' : 'zinc-500'} 
                   text-xs font-mono-label uppercase tracking-wider 
                   ${isFocused || hasValue ? 'scale-75' : 'scale-100'}
                   ${error ? 'text-red-400' : success ? 'text-primary' : ''}
                   pointer-events-none`}
      >
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      
      <div className="relative">
        {mask ? (
          <MaskedInput
            id={`floating-input-${label.toLowerCase().replace(/\s+/g, '-')}`}
            ref={inputRef}
            value={value}
            onChange={(v: string) => onChange(v)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            mask={mask}
            maskPlaceholderChar={maskPlaceholderChar}
            autoComplete={autoComplete}
            isFocused={isFocused}
            error={error}
            success={success}
            showPasswordToggle={showPasswordToggle}
            type={type as 'text' | 'password'}
            showPassword={showPassword}
            togglePasswordVisibility={togglePasswordVisibility}
          />
        ) : (
          <input
            id={`floating-input-${label.toLowerCase().replace(/\s+/g, '-')}`}
            ref={inputRef}
            type={inputType}
            value={value}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            maxLength={maxLength}
            className={`w-full px-3 py-4 pr-${showPasswordToggle ? '10' : '3'} 
                       bg-zinc-900/60 border border-zinc-700 
                       ${isFocused ? 'border-primary focus:ring-1 focus:ring-primary' : ''}
                       ${error ? 'border-red-400' : success ? 'border-primary' : ''}
                       rounded-xl text-zinc-200 placeholder-zinc-500
                       transition-all duration-200
                       ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          />
        )}
        
        {/* Password toggle button (only for non-masked password inputs) */}
        {showPasswordToggle && type === 'password' && !mask && (
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className={`absolute right-3 top-1/2 -translate-y-1/2 
                       text-zinc-400 hover:text-zinc-200 
                       disabled:opacity-30 disabled:pointer-events-none
                       px-2 py-1 rounded hover:bg-zinc-800/20`}
            disabled={disabled}
          >
            {showPassword ? (
              <span className="sr-only">Hide password</span>
            ) : (
              <span className="sr-only">Show password</span>
            )}
          </button>
        )}
        
        {/* Character counter */}
        {maxLength && !mask && (
          <div className={`absolute right-3 bottom-2 
                         text-xs ${value.length >= maxLength ? 'text-red-400' : 'text-zinc-400'}
                         font-mono-label`}>
            {value.length}/{maxLength}
          </div>
        )}
        
        {/* Error/success message */}
        {error && (
          <p className="mt-1 text-xs text-red-400 font-mono-label">
            {error}
          </p>
        )}
        
        {success && !error && (
          <p className="mt-1 text-xs text-primary font-mono-label">
            {success === true ? 'Looks good!' : success}
          </p>
        )}
      </div>
    </div>
  );
};

export default FloatingInput;


