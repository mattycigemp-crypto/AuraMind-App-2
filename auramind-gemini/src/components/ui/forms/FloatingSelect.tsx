import React, { useState, useRef } from 'react';

interface FloatingSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  searchable?: boolean; // Enable search/filter in options
  multiple?: boolean;   // Allow multiple selections
  maxHeight?: string;   // Max height of dropdown (e.g., "200px")
  className?: string;
}

const FloatingSelect: React.FC<FloatingSelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  required = false,
  disabled = false,
  error = '',
  searchable = false,
  multiple = false,
  maxHeight = '200px',
  className = ''
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const selectRef = useRef<HTMLSelectElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);

  const hasValue = Array.isArray(value) ? value.length > 0 : value.length > 0;
  
  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
  };
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  const _toggleOpen = () => setIsOpen(!isOpen);

  // Filter options based on search term
  const filteredOptions = searchable 
    ? options.filter(option => 
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  return (
    <div className={`relative w-full mb-4 ${className}`}>
      <label
        htmlFor={`floating-select-${label.toLowerCase().replace(/\s+/g, '-')}`}
        className={`pointer-events-none absolute left-3 top-${isFocused || hasValue ? '-10px' : '16px'} 
                   origin-left transition-all duration-200 ease-out 
                   text-${isFocused || hasValue ? 'primary' : 'zinc-500'} 
                   text-xs font-mono-label uppercase tracking-wider 
                   ${isFocused || hasValue ? 'scale-75' : 'scale-100'}
                   pointer-events-none`}
      >
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      
      <div className="relative">
        {searchable ? (
          <>
            <input
              type="text"
              placeholder="Search options..."
              value={searchTerm}
              onChange={handleSearchChange}
              className={`w-full px-3 py-2 pr-3 
                         bg-zinc-900/60 border border-zinc-700 
                         ${isFocused ? 'border-primary focus:ring-1 focus:ring-primary' : ''}
                         rounded-t-xl text-zinc-200 placeholder-zinc-500
                         transition-all duration-200
                         ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
            <div
              ref={optionsRef}
              className={`absolute left-0 right-0 mt-0 
                         max-${maxHeight} overflow-auto
                         bg-zinc-900/60 border border-zinc-700 
                         border-t-0 rounded-b-xl
                         z-10
                         ${isOpen ? 'border-primary' : ''}
                         transition-all duration-200`}
            >
              <select
                ref={selectRef}
                value={value}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                disabled={disabled}
                multiple={multiple}
                className="w-full p-2 bg-transparent border-none text-zinc-200"
              >
                {!placeholder || <option value="" disabled>{placeholder}</option>}
                {filteredOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </>
        ) : (
          <select
            id={`floating-select-${label.toLowerCase().replace(/\s+/g, '-')}`}
            ref={selectRef}
            value={value}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            disabled={disabled}
            multiple={multiple}
            className={`w-full px-3 py-4 pr-3 
                       bg-zinc-900/60 border border-zinc-700 
                       ${isFocused ? 'border-primary focus:ring-1 focus:ring-primary' : ''}
                       rounded-xl text-zinc-200 placeholder-zinc-500
                       appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2224%22 height=%2224%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22currentColor%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><polyline points=%226 9 12 15 18 9%22></polyline></svg>')_no-repeat-right-3_center]
                       transition-all duration-200
                       ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {!placeholder || <option value="" disabled>{placeholder}</option>}
            {options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}
        
        {/* Error message */}
        {error && (
          <p className="mt-1 text-xs text-red-400 font-mono-label">
            {error}
          </p>
        )}
      </div>
    </div>
  );
};

export default FloatingSelect;


