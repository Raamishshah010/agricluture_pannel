import { useCallback, useEffect, useState } from 'react';
import { X, Edit2, Trash2, Plus } from 'lucide-react';
import service from '../../services/possessionService';
import { toast } from 'react-toastify';
import useTranslation from '../../hooks/useTranslation';
import Loader from '../../components/Loader';
import MasterDataCsvToolbar from '../../components/MasterDataCsvToolbar';

export default function Poessessions() {
    const t = useTranslation();
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(false);

    const loadItems = useCallback(async () => {
        try {
            setLoading(true);
            const res = await service.getAll();
            setList(Array.isArray(res.data) ? res.data : res.data?.items || []);
        } catch (err) {
            toast.error(err.message || t('common.errorOccurred'));
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        loadItems();
    }, [loadItems]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        nameInArrabic: '',
    });

    const openAddModal = () => {
        setEditingItem(null);
        setFormData({
            name: '',
            nameInArrabic: '',
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
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = async () => {
        if (!formData.name) {
            toast.error(t('possession.validation.requiredFields'));
            return;
        }

        try {
            setLoading(true);
            if (editingItem) {
                const res = await service.updateItem(editingItem.id, formData);
                setList((prev) =>
                    prev.map((item) =>
                        item.id === editingItem.id
                            ? { ...item, ...(res.data || formData), updatedAt: new Date().toISOString() }
                            : item,
                    ),
                );
            } else {
                const res = await service.addItem(formData);
                setList((prev) => [...prev, res.data]);
            }
            closeModal();
        } catch (error) {
            toast.error(error.response?.data?.message || error.message || t('common.errorOccurred'));
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm(t('possession.deleteConfirmation'))) {
            try {
                await service.deleteItem(id);
                setList((prev) => prev.filter((item) => item.id !== id));
            } catch (error) {
                setLoading(false);
                toast.error(error.response?.data?.message || error.message);
            }
        }
    };

    const formatDate = (dateString) =>
        new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });

    return (
        <div className="min-h-screen bg-gray-50 p-0 md:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8 flex flex-col-reverse md:flex-row mt-2 justify-between items-center">
                    <div>
                        <h1 className="text-xl md:text-3xl font-bold text-gray-900">{t('possession.title')}</h1>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <MasterDataCsvToolbar
                            items={list}
                            exportFields={['nameInArrabic', 'name']}
                            exportFileName="possession.csv"
                            importLabel={t('common.importCsv') || 'Import CSV'}
                            exportLabel={t('common.exportCsv') || 'Export CSV'}
                            itemLabel="possessions"
                            createItem={service.addItem}
                            mapCsvRowToPayload={(row) => ({
                                name: row.name || row.Name || '',
                                nameInArrabic: row.nameInArrabic || row.nameInArabic || row.NameInArrabic || row.NameInArabic || '',
                            })}
                            refreshItems={loadItems}
                            loading={loading}
                        />
                        <button
                            onClick={openAddModal}
                            className="bg-green-600 cursor-pointer hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
                        >
                            <Plus size={20} />
                            {t('possession.add')}
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden">
                    {loading ? (
                        <Loader />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-100 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">{t('possession.nameEnglish')}</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">{t('possession.nameArabic')}</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">{t('possession.createdAt')}</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">{t('possession.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {list.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.name}</td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.nameInArrabic}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{formatDate(item.createdAt)}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => openEditModal(item)}
                                                        className="p-2 cursor-pointer text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title={t('possession.edit')}
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(item.id)}
                                                        className="p-2 text-red-600 cursor-pointer hover:bg-red-50 rounded-lg transition-colors"
                                                        title={t('possession.delete')}
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {!loading && list.length === 0 && (
                        <div className="text-center py-12 text-gray-500">{t('possession.emptyState')}</div>
                    )}
                </div>

                <div className="mt-4 text-sm text-gray-600">
                    {t('possession.totalItems')}: {list.length}
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900">
                                {editingItem ? t('possession.editItem') : t('possession.addNewItem')}
                            </h2>
                            <button
                                onClick={closeModal}
                                className="text-gray-400 cursor-pointer hover:text-gray-600 transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="px-6 py-4">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('possession.nameEnglish')} *
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                        placeholder={t('possession.nameEnglishPlaceholder')}
                                    />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('possession.nameArabic')} *
                                    </label>
                                    <input
                                        type="text"
                                        name="nameInArrabic"
                                        value={formData.nameInArrabic}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                        placeholder={t('possession.nameArabicPlaceholder')}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                                <button
                                    onClick={closeModal}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                >
                                    {t('possession.cancel')}
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    className="px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                                >
                                    {editingItem ? t('possession.update') : t('possession.add')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
