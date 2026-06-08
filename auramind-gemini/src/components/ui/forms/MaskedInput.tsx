import React, { useState, useRef, useEffect } from 'react';

interface MaskedInputProps {
  id: string;
  ref: React.RefObject<HTMLInputElement>;
  value: string;
  onChange: (value: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  mask: string; // Mask format (e.g., "(999) 999-9999")
  maskPlaceholderChar?: string; // Placeholder character (default: "_")
  autoComplete?: string;
  isFocused: boolean;
  error?: string;
  success?: boolean;
  showPasswordToggle?: boolean;
  type?: 'text' | 'password';
  showPassword: boolean;
  togglePasswordVisibility: () => void;
}

const MaskedInput: React.FC<MaskedInputProps> = ({
  id,
  ref,
  value,
  onChange,
  onFocus,
  onBlur,
  placeholder = '',
  required = false,
  disabled = false,
  mask,
  maskPlaceholderChar = '_',
  autoComplete,
  isFocused,
  error = '',
  success = false,
  showPasswordToggle = false,
  type = 'text',
  showPassword = false,
  togglePasswordVisibility
}) => {
  const [displayValue, setDisplayValue] = useState('');
  const rawValueRef = useRef(value);

  // Initialize display value based on mask
  useEffect(() => {
    setDisplayValue(applyMask(value));
    rawValueRef.current = value;
  }, [value, mask]);

  // Apply mask to value
  const applyMask = (val: string): string => {
    if (!mask) return val;
    
    let result = '';
    let valueIndex = 0;
    
    for (let i = 0; i < mask.length; i++) {
      const maskChar = mask[i];
      
      if (maskChar === '9') {
        // Numeric placeholder
        if (valueIndex < val.length && /\d/.test(val[valueIndex])) {
          result += val[valueIndex];
          valueIndex++;
        } else {
          result += maskPlaceholderChar;
        }
      } else if (maskChar === 'A') {
        // Alphabetic placeholder
        if (valueIndex < val.length && /[a-zA-Z]/.test(val[valueIndex])) {
          result += val[valueIndex];
          valueIndex++;
        } else {
          result += maskPlaceholderChar;
        }
      } else if (maskChar === '*') {
        // Alphanumeric placeholder
        if (valueIndex < val.length && /[a-zA-Z0-9]/.test(val[valueIndex])) {
          result += val[valueIndex];
          valueIndex++;
        } else {
          result += maskPlaceholderChar;
        }
      } else {
        // Fixed character
        result += maskChar;
      }
    }
    
    return result;
  };

  // Extract raw value from masked input
  const extractRawValue = (maskedValue: string): string => {
    if (!mask) return maskedValue;
    
    const rawChars = [];
    let valueIndex = 0;
    
    for (let i = 0; i < mask.length && valueIndex < maskedValue.length; i++) {
      const maskChar = mask[i];
      
      if (maskChar === '9' || maskChar === 'A' || maskChar === '*') {
        const inputChar = maskedValue[valueIndex];
        // Only add if it's not the placeholder and matches expected type
        if (inputChar !== maskPlaceholderChar) {
          if ((maskChar === '9' && /\d/.test(inputChar)) ||
              (maskChar === 'A' && /[a-zA-Z]/.test(inputChar)) ||
              (maskChar === '*' && /[a-zA-Z0-9]/.test(inputChar))) {
            rawChars.push(inputChar);
          }
        }
        valueIndex++;
      } else {
        // Skip fixed characters
        valueIndex++;
      }
    }
    
    return rawChars.join('');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = extractRawValue(e.target.value);
    rawValueRef.current = rawValue;
    setDisplayValue(e.target.value);
    onChange(rawValue);
  };

  const getInputType = () => {
    if (showPasswordToggle && type === 'password') {
      return showPassword ? 'text' : 'password';
    }
    return type;
  };

  return (
    <input
      id={id}
      ref={ref}
      value={displayValue}
      onChange={handleChange}
      onFocus={onFocus}
      onBlur={onBlur}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      autoComplete={autoComplete}
      className={`w-full px-3 py-4 pr-3 
                 bg-zinc-900/60 border border-zinc-700 
                 ${isFocused ? 'border-primary focus:ring-1 focus:ring-primary' : ''}
                 ${error ? 'border-red-400' : success ? 'border-primary' : ''}
                 rounded-xl text-zinc-200 placeholder-zinc-500
                 transition-all duration-200
                 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      type={getInputType()}
    />
  );
};

export default MaskedInput;


