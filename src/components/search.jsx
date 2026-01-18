import { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

export default function SearchWithSuggestions({ allItems, handleClick, handleClearQuery }) {
    const t = useTranslation();
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const inputRef = useRef(null);
    const dropdownRef = useRef(null);

    const suggestions = query.trim()
        ? allItems.filter(item =>
            item.name.toLowerCase().includes(query.toLowerCase())
        )
        : [];

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target) &&
                !inputRef.current.contains(e.target)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = (e) => {
        if (!e.target.value.trim()) {
            handleClearQuery();
        }
        setQuery(e.target.value);
        setIsOpen(true);
        setSelectedIndex(-1);
    };

    const handleSuggestionClick = (item) => {
        setQuery(item.name);
        setIsOpen(false);
        handleClick(item);
        setSelectedIndex(-1);
    };

    const handleClear = () => {
        setQuery('');
        handleClearQuery();
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.focus();
    };

    const handleKeyDown = (e) => {
        if (!isOpen || suggestions.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev =>
                    prev < suggestions.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0) {
                    handleSuggestionClick(suggestions[selectedIndex]);
                }
                break;
            case 'Escape':
                setIsOpen(false);
                setSelectedIndex(-1);
                break;
            default:
                break;
        }
    };

    return (
        <div className="relative">
            <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <Search size={20} />
                </div>
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={handleInputChange}
                    onFocus={() => query && setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                    placeholder={t('common.components.searchForEmirate')}
                    className="w-64 pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-sm shadow-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
                {query && (
                    <button
                        onClick={handleClear}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                )}
            </div>

            {/* Suggestions Dropdown */}
            {isOpen && suggestions.length > 0 && (
                <div
                    ref={dropdownRef}
                    className="absolute w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-80 overflow-y-auto z-10"
                >
                    {suggestions.map((item, index) => (
                        <div
                            key={item.name}
                            onClick={() => handleSuggestionClick(item)}
                            className={`px-4 py-3 cursor-pointer transition-colors ${index === selectedIndex
                                ? 'bg-indigo-500 text-white'
                                : 'hover:bg-gray-100'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <Search size={16} className="opacity-50" />
                                <span className="text-base">{item.name}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* No Results */}
            {isOpen && query && suggestions.length === 0 && (
                <div
                    ref={dropdownRef}
                    className="absolute w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg p-4 z-10"
                >
                    <p className="text-gray-500 text-center">{t('common.components.noResultsFound')}</p>
                </div>
            )}
        </div>
    );
}