import { useEffect, useState } from 'react';
import { X, Edit2, Trash2, Plus, Search, FileText } from 'lucide-react';

export default function CoverTypes() {
    const [items, setItems] = useState([
        { id: 1, name: 'Plastic Cover', nameInArrabic: 'غطاء بلاستيكي', createdAt: '2025-10-27T00:00:00Z' },
        { id: 2, name: 'Glass Cover', nameInArrabic: 'غطاء زجاجي', createdAt: '2025-10-27T00:00:00Z' },
        { id: 3, name: 'Net Cover', nameInArrabic: 'غطاء شبكي', createdAt: '2025-10-27T00:00:00Z' },
    ]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        nameInArrabic: ''
    });

    // Mock translation function
    const t = (key) => {
        const translations = {
            'coverTypes.title': 'CoverType Management',
            'coverTypes.subtitle': 'Manage your cover types',
            'coverTypes.add': 'Add Cover Type',
            'coverTypes.nameArabic': 'NAME (ARABIC)',
            'coverTypes.nameEnglish': 'NAME (ENGLISH)',
            'coverTypes.createdAt': 'CREATED AT',
            'coverTypes.actions': 'ACTIONS',
            'coverTypes.edit': 'Edit',
            'coverTypes.delete': 'Delete',
            'coverTypes.noItemsFound': 'No items found',
            'coverTypes.totalItems': 'Total Cover Types',
            'coverTypes.searchResults': 'Search Results',
            'coverTypes.editItem': 'Edit Item',
            'coverTypes.addNewItem': 'Add New Item',
            'coverTypes.nameArabicLabel': 'Name (Arabic)',
            'coverTypes.nameEnglishLabel': 'Name (English)',
            'coverTypes.cancel': 'Cancel',
            'coverTypes.update': 'Update',
            'coverTypes.fillRequiredFields': 'Please fill in all required fields',
            'coverTypes.deleteConfirm': 'Are you sure you want to delete this item?',
            'coverTypes.searchPlaceholder': 'Name (English)',
            'coverTypes.found': 'Found'
        };
        return translations[key] || key;
    };

    const filteredItems = items.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.nameInArrabic.includes(searchQuery)
    );

    const openAddModal = () => {
        setEditingItem(null);
        setFormData({
            name: '',
            nameInArrabic: ''
        });
        setIsModalOpen(true);
    };

    const openEditModal = (item) => {
        setEditingItem(item);
        setFormData({
            name: item.name,
            nameInArrabic: item.nameInArrabic,
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async () => {
        if (!formData.name) {
            alert(t('coverTypes.fillRequiredFields'));
            return;
        }

        setLoading(true);
        setTimeout(() => {
            if (editingItem) {
                setItems(prev => prev.map(item =>
                    item.id === editingItem.id
                        ? { ...item, ...formData, updatedAt: new Date().toISOString() }
                        : item
                ));
            } else {
                setItems(prev => [...prev, { 
                    id: Date.now(), 
                    ...formData, 
                    createdAt: new Date().toISOString() 
                }]);
            }
            setLoading(false);
            closeModal();
        }, 500);
    };

    const handleDelete = async (id) => {
        if (window.confirm(t('coverTypes.deleteConfirm'))) {
            setItems(prev => prev.filter(item => item.id !== id));
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6 flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {t('coverTypes.title')}
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">{t('coverTypes.subtitle')}</p>
                    </div>
                    <button
                        onClick={openAddModal}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors text-sm font-medium"
                    >
                        <Plus size={18} />
                        {t('coverTypes.add')}
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-blue-50 rounded-lg p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-blue-600 font-medium mb-1">{t('coverTypes.totalItems')}</p>
                                <p className="text-3xl font-bold text-blue-900">{items.length}</p>
                            </div>
                            <div className="bg-blue-100 p-3 rounded-lg">
                                <FileText size={24} className="text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-green-50 rounded-lg p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-green-600 font-medium mb-1">{t('coverTypes.searchResults')}</p>
                                <p className="text-3xl font-bold text-green-900">{filteredItems.length}</p>
                            </div>
                            <div className="bg-green-100 p-3 rounded-lg">
                                <Search size={24} className="text-green-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder={t('coverTypes.searchPlaceholder')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                        />
                    </div>
                </div>

                {/* Results Count */}
                <div className="mb-3">
                    <p className="text-sm text-gray-700 font-medium">{filteredItems.length} {t('coverTypes.found')}</p>
                </div>

                {/* Table */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        {t('coverTypes.nameEnglish')}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        {t('coverTypes.nameArabic')}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        {t('coverTypes.createdAt')}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        {t('coverTypes.actions')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredItems.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-sm text-gray-900">{item.name}</td>
                                        <td className="px-6 py-4 text-sm text-gray-900">{item.nameInArrabic}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{formatDate(item.createdAt)}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => openEditModal(item)}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                    title={t('coverTypes.edit')}
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                    title={t('coverTypes.delete')}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {filteredItems.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            {t('coverTypes.noItemsFound')}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900">
                                {editingItem ? t('coverTypes.editItem') : t('coverTypes.addNewItem')}
                            </h2>
                            <button
                                onClick={closeModal}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="px-6 py-4">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('coverTypes.nameArabicLabel')} *
                                    </label>
                                    <input
                                        type="text"
                                        name="nameInArrabic"
                                        value={formData.nameInArrabic}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                        placeholder="Enter item name in Arabic"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('coverTypes.nameEnglishLabel')} *
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                        placeholder="e.g., Plastic Cover"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                                <button
                                    onClick={closeModal}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors text-sm"
                                >
                                    {t('coverTypes.cancel')}
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                                >
                                    {loading ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Loading...
                                        </>
                                    ) : (
                                        <>{editingItem ? t('coverTypes.update') : t('coverTypes.add')}</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}