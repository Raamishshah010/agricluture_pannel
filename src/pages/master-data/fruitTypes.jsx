import { useEffect, useState } from 'react';
import { X, Edit2, Trash2, Plus, Search } from 'lucide-react';
import service from '../../services/fruitService';
import { toast } from 'react-toastify';
import useTranslation from '../../hooks/useTranslation';

export default function FruitTypes() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const t = useTranslation();

    useEffect(() => {
        service.getItems().then(res => {
            setItems(res.data)
        })
            .catch(err => {
                toast.error(err.message);
            })
    }, []);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEmirate, setEditingEmirate] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        nameInArrabic: ''
    });

    const openAddModal = () => {
        setEditingEmirate(null);
        setFormData({
            name: '',
            nameInArrabic: ''
        });
        setIsModalOpen(true);
    };

    const openEditModal = (item) => {
        setEditingEmirate(item);
        setFormData({
            name: item.name,
            nameInArrabic: item.nameInArrabic,
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingEmirate(null);
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async () => {
        if (!formData.name) {
            alert(t('fruitTypes.pleaseFillRequiredFields'));
            return;
        }

        try {
            setLoading(true);
            if (editingEmirate) {
                await service.updateItem(editingEmirate.id, formData);
                setItems(prev => prev.map(item =>
                    item.id === editingEmirate.id
                        ? { ...item, ...formData, updatedAt: new Date().toISOString() }
                        : item
                ));
            } else {
                const res = await service.addItem(formData);
                setItems(prev => [...prev, res.data]);
            }
            setLoading(false);
        } catch (error) {
            setLoading(false);
            toast.error(error.response?.data?.message || error.message);
        }
        closeModal();
    };

    const handleDelete = async (id) => {
        if (window.confirm(t('fruitTypes.confirmDelete'))) {
            try {
                await service.deleteItem(id);
                setItems(prev => prev.filter(item => item.id !== id));
            } catch (error) {
                setLoading(false);
                toast.error(error.response?.data?.message || error.message);
            }
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.nameInArrabic.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="mb-6">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900 mb-1">
                                {t('fruitTypes.title')}
                            </h1>
                            <p className="text-sm text-gray-500">
                                Manage your fruit types
                            </p>
                        </div>
                        <button
                            onClick={openAddModal}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors text-sm font-medium shadow-sm"
                        >
                            <Plus size={18} />
                            Add Fruit Type
                        </button>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-xs font-medium text-blue-900 mb-1">Total Fruit Types</p>
                                    <p className="text-2xl font-bold text-blue-900">{items.length}</p>
                                </div>
                                <div className="bg-blue-100 p-3 rounded-lg">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-xs font-medium text-green-900 mb-1">Search Results</p>
                                    <p className="text-2xl font-bold text-green-900">{filteredItems.length}</p>
                                </div>
                                <div className="bg-green-100 p-3 rounded-lg">
                                    <Search className="w-6 h-6 text-green-600" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Search Section */}
                    <div className="bg-green-50 rounded-lg p-4 mb-6">
                        <div className="flex items-center gap-2 mb-3">
                            <Search size={18} className="text-green-700" />
                            <h3 className="text-sm font-semibold text-green-900">Search Fruit Types</h3>
                        </div>
                        <input
                            type="text"
                            placeholder="Name (English)"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                        />
                    </div>
                </div>

                {/* Results Count */}
                <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700">{filteredItems.length} Found</p>
                </div>

                {/* Table */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        {t('fruitTypes.nameEnglish')}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        {t('fruitTypes.nameArabic')}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        {t('fruitTypes.createdAt')}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        {t('fruitTypes.actions')}
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
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete"
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
                            <p className="text-sm">{t('fruitTypes.noItemsFound')}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">
                                {editingEmirate ? t('fruitTypes.editItem') : t('fruitTypes.addNewItem')}
                            </h2>
                            <button
                                onClick={closeModal}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="px-6 py-5">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {t('fruitTypes.nameEnglish')} <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                                        placeholder={t('fruitTypes.enterNameEnglish')}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {t('fruitTypes.nameArabic')} <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="nameInArrabic"
                                        value={formData.nameInArrabic}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                                        placeholder={t('fruitTypes.enterNameArabic')}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-gray-200">
                                <button
                                    onClick={closeModal}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                >
                                    {t('fruitTypes.cancel')}
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            {editingEmirate ? t('fruitTypes.update') : t('fruitTypes.add')}
                                        </>
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