import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import useStore from '../store/store';

const Dropdown = ({ options, value, onChange, placeholder, classes = "w-48" }) => {
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
    onChange(option);
    setIsOpen(false);
    setSearchTerm('');
  };

  // Filter options based on search term
  const filteredOptions = options.filter(option => {
    return (
      isLTR ?
        option.name.toLowerCase().includes(searchTerm.toLowerCase())
        : option.nameInArrabic ? option.nameInArrabic.toLowerCase().includes(searchTerm.toLowerCase())
          : option.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  });

  // Get display name based on language
  const getDisplayName = () => {
    if (!value) return finalPlaceholder;
    return isLTR ? value.name : (value.nameInArrabic || value.name);
  };

  return (
    <div className={`relative ${classes}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-2 py-1.5 bg-white border-2 border-gray-300 rounded-lg flex items-center justify-between hover:border-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
      >
        <span className="text-gray-900 font-medium text-md">
          {getDisplayName()}
        </span>
        <ChevronDown
          size={20}
          className={`text-gray-700 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
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
                  {isLTR ? option.name : option.nameInArrabic ?? option.name}
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