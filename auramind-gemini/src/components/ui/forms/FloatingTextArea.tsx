import React, { useState, useRef, useEffect } from 'react';

interface FloatingTextAreaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  success?: boolean;
  maxLength?: number;
  rows?: number;
  className?: string;
}

const FloatingTextArea: React.FC<FloatingTextAreaProps> = ({
  label,
  value,
  onChange,
  placeholder = '',
  required = false,
  disabled = false,
  error = '',
  success = false,
  maxLength,
  rows = 3,
  className = ''
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current && !disabled) {
      textareaRef.current.focus();
    }
  }, [disabled]);

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const hasValue = value.length > 0;
  const _isValid = !error && (success || !required || hasValue);
  const currentLength = value.length;

  return (
    <div className={`relative w-full mb-4 ${className}`}>
      <label
        htmlFor={`floating-textarea-${label.toLowerCase().replace(/\s+/g, '-')}`}
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
        <textarea
          id={`floating-textarea-${label.toLowerCase().replace(/\s+/g, '-')}`}
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          maxLength={maxLength}
          rows={rows}
          className={`w-full px-3 py-3 pr-3 
                     bg-zinc-900/60 border border-zinc-700 
                     ${isFocused ? 'border-primary focus:ring-1 focus:ring-primary' : ''}
                     ${error ? 'border-red-400' : success ? 'border-primary' : ''}
                     rounded-xl text-zinc-200 placeholder-zinc-500
                     resize-none
                     transition-all duration-200
                     ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
        
        {/* Character counter */}
        {maxLength && (
          <div className={`absolute right-3 bottom-2 
                         text-xs ${currentLength >= maxLength ? 'text-red-400' : 'text-zinc-400'}
                         font-mono-label`}>
            {currentLength}/{maxLength}
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

export default FloatingTextArea;


