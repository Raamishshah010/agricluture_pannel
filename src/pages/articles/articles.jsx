import { useEffect, useState } from 'react';
import { X, Edit2, Trash2, Plus } from 'lucide-react';
import articleService from '../../services/articleService'; // renamed import for clarity
import { toast } from 'react-toastify';
import Loader from '../../components/Loader';
import useTranslation from '../../hooks/useTranslation';

export default function Articles() {
    const t = useTranslation();
    const unknownErrorMessage = t('articles.toast.unknownError');
    const [articles, setArticles] = useState([]);
    const [categories, setCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [catsLoading, setCatsLoading] = useState(false);
    const [subCatsLoading, setSubCatsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingArticle, setEditingArticle] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        image: null,           // will hold File object or null
        categoryId: '',
        subCategoryId: ''
    });
    const [imagePreview, setImagePreview] = useState('');

    useEffect(() => {
        fetchArticles();
    }, []);

    const fetchArticles = async () => {
        try {
            setLoading(true);
            const res = await articleService.getArticles();
            setArticles(res.data?.items || res.data || []);
        } catch (err) {
            toast.error(`${t('articles.toast.loadFail')}: ${err.message || unknownErrorMessage}`);
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
            toast.error(`${t('articles.toast.categoriesLoadFail')}: ${err.message || unknownErrorMessage}`);
        } finally {
            setCatsLoading(false);
        }
    };

    const fetchSubCategories = async (categoryId) => {
        if (!categoryId) {
            setSubCategories([]);
            return;
        }
        try {
            setSubCatsLoading(true);
            const res = await articleService.getSubCategoriesByCategory(categoryId);
            setSubCategories(res.data?.items || res.data || []);
        } catch (err) {
            toast.error(`${t('articles.toast.subcategoriesLoadFail')}: ${err.message || unknownErrorMessage}`);
            setSubCategories([]);
        } finally {
            setSubCatsLoading(false);
        }
    };

    const openAddModal = () => {
        fetchCategories();
        setEditingArticle(null);
        setFormData({
            title: '',
            description: '',
            image: null,
            categoryId: '',
            subCategoryId: ''
        });
        setImagePreview('');
        setIsModalOpen(true);
    };

    const openEditModal = (article) => {
        fetchCategories();
        if (article.categoryId) {
            fetchSubCategories(article.categoryId);
        }
        setEditingArticle(article);
        setFormData({
            title: article.title || '',
            description: article.description || '',
            image: null, // reset to null → only send new file if changed
            categoryId: article.categoryId || '',
            subCategoryId: article.subCategoryId || ''
        });
        setImagePreview(article.image || '');
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingArticle(null);
        setImagePreview('');
        setFormData(prev => ({ ...prev, image: null }));
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

        if (name === 'categoryId') {
            setFormData(prev => ({ ...prev, categoryId: value, subCategoryId: '' }));
            fetchSubCategories(value);
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async () => {
        if (!formData.title.trim() ||
            !formData.description.trim() ||
            !formData.categoryId ||
            !formData.subCategoryId ||
            (!editingArticle && !formData.image)) {
            toast.error(t('articles.toast.validationRequiredFields'));
            return;
        }

        const formPayload = new FormData();
        formPayload.append('title', formData.title);
        formPayload.append('description', formData.description);
        formPayload.append('categoryId', formData.categoryId);
        formPayload.append('subCategoryId', formData.subCategoryId);

        if (formData.image instanceof File) {
            formPayload.append('file', formData.image);
        }

        try {
            setLoading(true);

            if (editingArticle) {
                const res = await articleService.updateArticle(editingArticle.id, formPayload);
                setArticles(prev =>
                    prev.map(a => a.id === editingArticle.id ? res.data : a)
                );
                toast.success(t('articles.toast.updateSuccess'));
            } else {
                const res = await articleService.addArticle(formPayload);
                setArticles(prev => [...prev, res.data]);
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
        if (!window.confirm(t('articles.confirm.delete'))) return;

        try {
            await articleService.deleteArticle(id); // ← fixed wrong method name
            setArticles(prev => prev.filter(a => a.id !== id));
            toast.success(t('articles.toast.deleteSuccess'));
        } catch (err) {
            toast.error(`${t('articles.toast.deleteFail')}: ${err.message || unknownErrorMessage}`);
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
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{t('articles.title')}</h1>
                        <p className="text-gray-600 mt-1">{t('articles.subtitle')}</p>
                    </div>
                    <button
                        onClick={openAddModal}
                        className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium shadow-sm transition-colors"
                    >
                        <Plus size={20} />
                        {t('articles.cta')}
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
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider w-24">{t('articles.table.image')}</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">{t('articles.table.title')}</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">{t('articles.table.createdAt')}</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider w-32">{t('articles.table.actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {articles.map((article) => (
                                            <tr key={article.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                                                        {article.image ? (
                                                            <img
                                                                src={article.image}
                                                                alt={article.title}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => { e.target.src = '/placeholder-image.jpg'; }}
                                                            />
                                                        ) : (
                                                            <span className="text-gray-400 text-xs">{t('articles.table.noImage')}</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900">{article.title || '—'}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{formatDate(article.createdAt)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => openEditModal(article)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title={t('articles.table.editAction')}
                                                        >
                                                            <Edit2 size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(article.id)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title={t('articles.table.deleteAction')}
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

                            {articles.length === 0 && (
                                <div className="py-16 text-center text-gray-500">
                                    <p className="text-lg">{t('articles.empty.noArticles')}</p>
                                    <p className="mt-2">{t('articles.empty.cta')}</p>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer stats */}
                {!loading && (
                    <div className="mt-4 text-sm text-gray-600 text-right">
                        {t('articles.stats.total')} <span className="font-medium">{articles.length}</span>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
                        <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
                            <h2 className="text-xl font-semibold text-gray-900">
                                {editingArticle ? t('articles.modal.editTitle') : t('articles.modal.addTitle')}
                            </h2>
                            <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-6">
                            {/* Image Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('articles.modal.imageLabel')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                                />
                                {imagePreview && (
                                    <div className="mt-4">
                                        <div className="w-40 h-32 rounded-lg overflow-hidden border bg-gray-50 flex items-center justify-center mx-auto">
                                            <img
                                                src={imagePreview}
                                                alt="Preview"
                                                className="max-w-full max-h-full object-contain"
                                                onError={(e) => { e.target.src = '/placeholder-image.jpg'; }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    {t('articles.modal.titleLabel')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder={t('articles.modal.titlePlaceholder')}
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    {t('articles.modal.descriptionLabel')} <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows={5}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder={t('articles.modal.descriptionPlaceholder')}
                                />
                            </div>

                            {/* Category */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    {t('articles.modal.categoryLabel')} <span className="text-red-500">*</span>
                                </label>
                                {catsLoading ? (
                                    <div className="text-sm text-gray-500">{t('articles.modal.loadingCategories')}</div>
                                ) : (
                                    <select
                                        name="categoryId"
                                        value={formData.categoryId}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                                    >
                                        <option value="">{t('articles.modal.categoryPlaceholder')}</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.name}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            {/* Subcategory */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    {t('articles.modal.subCategoryLabel')} <span className="text-red-500">*</span>
                                </label>
                                {subCatsLoading ? (
                                    <div className="text-sm text-gray-500">{t('articles.modal.loadingSubCategories')}</div>
                                ) : (
                                    <select
                                        name="subCategoryId"
                                        value={formData.subCategoryId}
                                        onChange={handleInputChange}
                                        disabled={!formData.categoryId}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white disabled:bg-gray-100"
                                    >
                                        <option value="">{t('articles.modal.subCategoryPlaceholder')}</option>
                                        {subCategories.map(sub => (
                                            <option key={sub.id} value={sub.id}>
                                                {sub.name}
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
                                {editingArticle ? t('articles.modal.submitUpdate') : t('articles.modal.submitAdd')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}