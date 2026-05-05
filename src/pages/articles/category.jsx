import { useCallback, useEffect, useState } from 'react';
import { X, Edit2, Trash2, Plus } from 'lucide-react';
import service from '../../services/articleService';
import { toast } from 'react-toastify';
import Loader from '../../components/Loader';
import useTranslation from '../../hooks/useTranslation';
import MasterDataCsvToolbar from '../../components/MasterDataCsvToolbar';

export default function ArticleCategories() {
    const t = useTranslation();
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchCategories = useCallback(async () => {
        try {
            setLoading(true);
            const res = await service.getCategories();
            setList(res.data || []);
        } catch (err) {
            toast.error(err?.message || 'Error fetching categories');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingData, setEditingData] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        nameInArabic: ''
    });

    const openAddModal = () => {
        setEditingData(null);
        setFormData({ name: '', nameInArabic: '' });
        setIsModalOpen(true);
    };

    const openEditModal = (category) => {
        setEditingData(category);
        setFormData({
            name: category.name,
            nameInArabic: category.nameInArabic || ''
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingData(null);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async () => {
        if (!formData.name.trim() || !formData.nameInArabic.trim()) {
            toast.error(t('fillRequiredFields'));
            return;
        }

        try {
            setLoading(true);

            if (editingData) {
                await service.updateCategory(editingData.id, formData);
                setList(prev =>
                    prev.map(item =>
                        item.id === editingData.id
                            ? { ...item, ...formData }
                            : item
                    )
                );
            } else {
                const res = await service.addCategory(formData);
                setList(prev => [...prev, res.data]);
            }

            closeModal();
        } catch (error) {
            toast.error(error?.message || t('errorOccurred'));
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(t('articles.category.deleteConfirm'))) return;

        try {
            await service.deleteCategory(id);
            setList(prev => prev.filter(item => item.id !== id));
        } catch (error) {
            toast.error(error?.message || t('errorOccurred'));
        }
    };

    const formatDate = (dateString) =>
        new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

    const getCsvValue = (row, keys) => {
        for (const key of keys) {
            const value = row?.[key];
            if (value !== undefined && value !== null && String(value).trim() !== '') {
                return String(value).trim();
            }
        }
        return '';
    };

    return (
        <div className="min-h-screen bg-gray-50 p-0 md:p-8">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <div className="mb-8 flex flex-col-reverse md:flex-row justify-between items-center gap-4">
                    <h1 className="text-xl md:text-3xl font-bold">
                        {t('articles.category.title')}
                    </h1>

                    <div className="flex flex-wrap items-center gap-3">
                        <MasterDataCsvToolbar
                            items={list}
                            exportFields={['name', 'nameInArabic']}
                            exportFileName="article-categories.csv"
                            importLabel={t('common.importCsv') || 'Import CSV'}
                            exportLabel={t('common.exportCsv') || 'Export CSV'}
                            itemLabel="categories"
                            createItem={service.addCategory}
                            mapCsvRowToPayload={(row) => ({
                                name: getCsvValue(row, ['name', 'Name']),
                                nameInArabic: getCsvValue(row, ['nameInArabic', 'nameInArrabic']),
                            })}
                            refreshItems={fetchCategories}
                            loading={loading}
                        />
                        <button
                            onClick={openAddModal}
                            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center gap-2"
                        >
                            <Plus size={20} />
                            {t('articles.category.add')}
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    {loading ? (
                        <div className="py-12">
                            <Loader message="Loading..." />
                        </div>
                    ) : (
                        <>
                            <table className="w-full">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="px-6 py-4 text-left">{t('articles.category.table.name')}</th>
                                        <th className="px-6 py-4 text-left">{t('articles.category.table.nameArabic')}</th>
                                        <th className="px-6 py-4 text-left">{t('articles.category.table.createdAt')}</th>
                                        <th className="px-6 py-4 text-left">{t('articles.category.table.actions')}</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {list.map(cat => (
                                        <tr key={cat.id} className="border-t">
                                            <td className="px-6 py-4">{cat.name}</td>
                                            <td className="px-6 py-4">{cat.nameInArabic || '—'}</td>
                                            <td className="px-6 py-4">{formatDate(cat.createdAt)}</td>
                                            <td className="px-6 py-4 flex gap-2">
                                                <button onClick={() => openEditModal(cat)}>
                                                    <Edit2 size={18} />
                                                </button>
                                                <button onClick={() => handleDelete(cat.id)}>
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {list.length === 0 && (
                                <div className="text-center py-10 text-gray-500">
                                    {t('articles.category.empty')}
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className="mt-4 text-sm">
                    Total: {list.length}
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
                    <div className="bg-white rounded-lg w-full max-w-md">

                        {/* Modal Header */}
                        <div className="flex justify-between p-4 border-b">
                            <h2>
                                {editingData
                                    ? t('articles.category.modal.editTitle')
                                    : t('articles.category.modal.addTitle')}
                            </h2>
                            <button onClick={closeModal}>
                                <X />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-4 space-y-4">
                            <input
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder={t('articles.category.modal.namePlaceholder')}
                                className="w-full border p-2 rounded"
                            />

                            <input
                                name="nameInArabic"
                                value={formData.nameInArabic}
                                onChange={handleInputChange}
                                placeholder={t('articles.category.modal.nameArabicPlaceholder')}
                                className="w-full border p-2 rounded"
                            />
                        </div>

                        {/* Modal Footer */}
                        <div className="flex justify-end gap-2 p-4 border-t">
                            <button onClick={closeModal} className="px-4 py-2 bg-gray-200 rounded">
                                {t('common.cancel')}
                            </button>

                            <button
                                onClick={handleSubmit}
                                className="px-4 py-2 bg-green-600 text-white rounded"
                                disabled={loading}
                            >
                                {loading
                                    ? 'Saving...'
                                    : editingData
                                        ? t('common.update')
                                        : t('common.add')}
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}
