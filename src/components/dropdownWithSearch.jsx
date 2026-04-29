import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import useStore from '../store/store';

const Dropdown = ({ options, value, onChange, placeholder, classes = "w-48", disabled = false }) => {
  const t = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const finalPlaceholder = placeholder || t('common.components.select');
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  const { language: lang } = useStore(st => st);
  const isLTR = lang.includes('en');

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (option) => {
    if (disabled) return;
    onChange(option);
    setIsOpen(false);
    setSearchTerm('');
  };

  const getLocalizedName = (option) => (
    isLTR ? option.name : (option.nameInArabic || option.nameInArrabic || option.scientificName || option.name)
  );

  // Filter options based on search term
  const normalizedSearchTerm = searchTerm.toLowerCase();
  const filteredOptions = (Array.isArray(options) ? options : []).filter(option => {
    if (!option) return false;

    const primaryName = String(option.name || '').toLowerCase();
    const localizedName = String(option.nameInArabic || option.nameInArrabic || option.scientificName || option.name || '').toLowerCase();

    if (isLTR) {
      return primaryName.includes(normalizedSearchTerm) || localizedName.includes(normalizedSearchTerm);
    }

    return localizedName.includes(normalizedSearchTerm) || primaryName.includes(normalizedSearchTerm);
  });

  // Get display name based on language
  const getDisplayName = () => {
    if (!value) return finalPlaceholder;
    return getLocalizedName(value);
  };

  return (
    <div className={`relative ${classes}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
          }
        }}
        disabled={disabled}
        className={`w-full px-2 py-1.5 bg-white border-2 border-gray-300 rounded-lg flex items-center justify-between focus:outline-none focus:border-blue-500 transition-colors ${disabled ? 'cursor-not-allowed opacity-60' : 'hover:border-gray-400'}`}
      >
        <span className="text-gray-900 font-medium text-md">
          {getDisplayName()}
        </span>
        <ChevronDown
          size={20}
          className={`text-gray-700 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-10 w-full mt-2 bg-white border-2 border-gray-300 rounded-lg shadow-lg">
          <div className="p-2 border-b border-gray-200">
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('common.components.search')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-100 transition-colors ${value?.id === option.id ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-900'
                    } ${index === filteredOptions.length - 1 ? 'rounded-b-lg' : ''}`}
                >
                  {getLocalizedName(option)}
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-gray-500 text-center">
                {t('common.components.noOptionsFound')}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dropdown;