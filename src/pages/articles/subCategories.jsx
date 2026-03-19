import { useEffect, useState } from 'react';
import { X, Edit2, Trash2, Plus } from 'lucide-react';
import articleService from '../../services/articleService';
import { toast } from 'react-toastify';
import Loader from '../../components/Loader';
import useTranslation from '../../hooks/useTranslation';

export default function SubCategories() {
    const t = useTranslation();
    const [subCategories, setSubCategories] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [catsLoading, setCatsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSubCat, setEditingSubCat] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        nameInArabic: '',
        image: null,
        categoryId: ''
    });
    const [imagePreview, setImagePreview] = useState('');

    useEffect(() => {
        fetchSubCategories();
    }, []);

    const fetchSubCategories = async () => {
        try {
            setLoading(true);
            const res = await articleService.getSubCategories();
            setSubCategories(res.data?.items || res.data || []);
        } catch (err) {
            toast.error(t('articles.toast.subcategoriesLoadFail') + (err?.message ? ': ' + err.message : ''));
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        if (categories.length > 0) return;
        try {
            setCatsLoading(true);
            const res = await articleService.getCategories();
            setCategories(res.data || []);
        } catch (err) {
            toast.error(t('articles.toast.categoriesLoadFail') + (err?.message ? ': ' + err.message : ''));
        } finally {
            setCatsLoading(false);
        }
    };

    const openAddModal = () => {
        fetchCategories();
        setEditingSubCat(null);
        setFormData({ name: '', nameInArabic: '', image: null, categoryId: '' });
        setImagePreview('');
        setIsModalOpen(true);
    };

    const openEditModal = (subCat) => {
        fetchCategories();
        setEditingSubCat(subCat);
        setFormData({
            name: subCat.name || '',
            nameInArabic: subCat.nameInArabic || '',
            image: null,           // only send new file if changed
            categoryId: subCat.categoryId || ''
        });
        setImagePreview(subCat.image || '');
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingSubCat(null);
        setImagePreview('');
        setFormData(prev => ({ ...prev, image: null, nameInArabic: '' }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData(prev => ({ ...prev, image: file }));
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        if (!formData.name.trim() || !formData.nameInArabic.trim() || !formData.categoryId) {
            toast.error(t('articles.toast.validationRequiredFields'));
            return;
        }
        if (!editingSubCat && !formData.image) {
            toast.error(t('articles.subCategories.toast.selectImage'));
            return;
        }

        const payload = new FormData();
        payload.append('name', formData.name);
        payload.append('categoryId', formData.categoryId);
        payload.append('nameInArabic', formData.nameInArabic);

        if (formData.image instanceof File) {
            payload.append('file', formData.image);
        }

        try {
            setLoading(true);

            if (editingSubCat) {
                const res = await articleService.updateSubCategory(editingSubCat.id, payload);
                setSubCategories(prev =>
                    prev.map(item =>
                        item.id === editingSubCat.id ? res.data : item
                    )
                );
                toast.success(t('articles.toast.updateSuccess'));
            } else {
                const res = await articleService.addSubCategory(payload);
                setSubCategories(prev => [...prev, res.data]);
                toast.success(t('articles.toast.addSuccess'));
            }

            closeModal();
        } catch (err) {
            toast.error(err.response?.data?.message || t('articles.toast.operationFailed'));
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(t('articles.subCategories.confirm.delete'))) return;

        try {
            await articleService.deleteSubCategory(id);
            setSubCategories(prev => prev.filter(item => item.id !== id));
            toast.success(t('articles.subCategories.toast.deleteSuccess'));
        } catch (err) {
            toast.error(t('articles.subCategories.toast.deleteFail') + (err.message ? ': ' + err.message : ''));
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '—';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
                {/* Header */}
                <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                            {t('articles.subCategories.title')}
                        </h1>
                        <p className="text-gray-600 mt-1">{t('articles.subCategories.subtitle')}</p>
                    </div>
                    <button
                        onClick={openAddModal}
                        className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium shadow-sm transition-colors"
                    >
                        <Plus size={20} />
                        {t('articles.subCategories.add')}
                    </button>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {loading ? (
                        <div className="py-16">
                            <Loader />
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider w-24">
                                                Image
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                                                Name
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                                                Arabic Name
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                                                Created At
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider w-32">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {subCategories.map((subCat) => (
                                            <tr key={subCat.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                                                        {subCat.image ? (
                                                            <img
                                                                src={subCat.image}
                                                                alt={subCat.name}
                                                                className="w-full h-full object-cover"
                                                                onError={e => e.target.src = '/placeholder.jpg'}
                                                            />
                                                        ) : (
                                                            <span className="text-gray-400 text-xs">No image</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                    {subCat.name || '—'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-700">
                                                    {subCat.nameInArabic || '—'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {formatDate(subCat.createdAt)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => openEditModal(subCat)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title={t('common.edit')}
                                                        >
                                                            <Edit2 size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(subCat.id)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title={t('common.delete')}
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

                            {subCategories.length === 0 && (
                                <div className="py-16 text-center text-gray-500">
                                    <p className="text-lg">{t('articles.subCategories.empty.noItems')}</p>
                                    <p className="mt-2">{t('articles.subCategories.empty.cta')}</p>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Stats */}
                {!loading && (
                    <div className="mt-4 text-sm text-gray-600 text-right">
                        Total sub-categories: <span className="font-medium">{subCategories.length}</span>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                        <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
                            <h2 className="text-xl font-semibold text-gray-900">
                                {editingSubCat ? t('articles.subCategories.modal.editTitle') : t('articles.subCategories.modal.addTitle')}
                            </h2>
                            <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Image */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('articles.subCategories.modal.imageLabel')} {editingSubCat ? `(${t('articles.subCategories.modal.imageOptional')})` : <span className="text-red-500">*</span>}
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                                />
                                {imagePreview && (
                                    <div className="mt-4 flex justify-center">
                                        <div className="w-40 h-40 rounded-lg overflow-hidden border bg-gray-50">
                                            <img
                                                src={imagePreview}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                                onError={e => e.target.src = '/placeholder.jpg'}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    {t('articles.subCategories.modal.nameLabel')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder={t('articles.subCategories.modal.namePlaceholder')}
                                />
                            </div>

                            {/* Arabic Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    {t('articles.subCategories.modal.nameArabicLabel')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="nameInArabic"
                                    value={formData.nameInArabic}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder="مثال: أخبار التكنولوجيا"
                                />
                            </div>

                            {/* Category */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    {t('articles.subCategories.modal.parentCategoryLabel')} <span className="text-red-500">*</span>
                                </label>
                                {catsLoading ? (
                                    <div className="text-sm text-gray-500 py-2">{t('articles.subCategories.modal.loadingCategories')}</div>
                                ) : (
                                    <select
                                        name="categoryId"
                                        value={formData.categoryId}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                                    >
                                        <option value="">{t('articles.subCategories.modal.parentCategoryPlaceholder')}</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.name}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t flex justify-end gap-3">
                                <button
                                    onClick={closeModal}
                                    className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                                >
                                    {t('common.cancel')}
                                </button>
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-60 flex items-center gap-2"
                            >
                                {loading && (
                                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" className="opacity-25" />
                                        <path fill="currentColor" d="M4 12a8 8 0 018-8v8z" className="opacity-75" />
                                    </svg>
                                )}
                                {editingSubCat ? t('common.update') : t('common.add')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}