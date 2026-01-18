import { useState, useRef, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import useStore from '../store/store';

const MultiSelect = ({ name, data, handleSelectItems, selectedItems: items }) => {
    const t = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [selectedItems, setSelectedItems] = useState(items);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef(null);
    const filteredItems = data.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !selectedItems.find(selected => selected.id === item.id)
    );
    const { language: lang } = useStore(st => st);
    const isLTR = lang.includes('en');
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (item) => {
        handleSelectItems([...selectedItems, item], name);
        setSelectedItems([...selectedItems, item]);
        setSearchTerm('');
    };

    const handleRemove = (itemId) => {
        handleSelectItems(selectedItems.filter(item => item.id !== itemId), name);
        setSelectedItems(selectedItems.filter(item => item.id !== itemId));
    };

    const handleClearAll = () => {
        handleSelectItems([], name);
        setSelectedItems([]);
    };

    return (
        <div>
            <div>
                <div className="relative" ref={dropdownRef}>
                    <div
                        className="bg-white border border-gray-300 rounded-lg p-2 cursor-text min-h-12 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500"
                        onClick={() => setIsOpen(true)}
                    >
                        <div className="flex flex-wrap gap-2 mb-2">
                            {selectedItems.map(item => (
                                <span
                                    key={item.id}
                                    className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium"
                                >
                                    {isLTR ? item.name : item.nameInArrabic}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemove(item.id);
                                        }}
                                        className="hover:bg-blue-200 rounded-full p-0.5"
                                    >
                                        <X size={14} />
                                    </button>
                                </span>
                            ))}
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                placeholder={selectedItems.length === 0 ? t('common.components.selectItems') : t('common.components.addMore')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onFocus={() => setIsOpen(true)}
                                className="flex-1 outline-none text-gray-700 placeholder-gray-400"
                            />
                            <div className="flex items-center gap-2">
                                {selectedItems.length > 0 && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleClearAll();
                                        }}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <X size={18} />
                                    </button>
                                )}
                                <ChevronDown
                                    size={20}
                                    className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Dropdown Menu */}
                    {isOpen && (
                        <div className="absolute z-10 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {filteredItems.length > 0 ? (
                                <ul className="py-1">
                                    {filteredItems.map(item => (
                                        <li
                                            key={item.id}
                                            onClick={() => handleSelect(item)}
                                            className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-gray-700 transition-colors"
                                        >
                                            {isLTR ? item.name : item.nameInArrabic}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="px-4 py-3 text-gray-500 text-sm">
                                    {searchTerm ? t('common.components.noItemsFound') : t('common.components.allItemsSelected')}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MultiSelect;