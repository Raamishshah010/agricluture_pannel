import { useEffect, useState } from 'react';
import { X, Edit2, Trash2, Plus } from 'lucide-react';
import articleService from '../../services/articleService'; // renamed import for clarity
import { toast } from 'react-toastify';
import Loader from '../../components/Loader';

export default function Articles() {
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
            toast.error('Failed to load articles: ' + (err.message || 'Unknown error'));
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
            toast.error('Failed to load categories: ' + err.message);
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
            toast.error('Failed to load subcategories: ' + err.message);
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
            toast.error('Please fill all required fields and select an image');
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
                toast.success('Article updated successfully');
            } else {
                const res = await articleService.addArticle(formPayload);
                setArticles(prev => [...prev, res.data]);
                toast.success('Article added successfully');
            }

            closeModal();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Operation failed');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this article?')) return;

        try {
            await articleService.deleteArticle(id); // ← fixed wrong method name
            setArticles(prev => prev.filter(a => a.id !== id));
            toast.success('Article deleted');
        } catch (err) {
            toast.error('Failed to delete article: ' + (err.message || ''));
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
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Articles</h1>
                        <p className="text-gray-600 mt-1">Manage your articles and blog posts</p>
                    </div>
                    <button
                        onClick={openAddModal}
                        className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium shadow-sm transition-colors"
                    >
                        <Plus size={20} />
                        Add Article
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
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider w-24">Image</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Title</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Created At</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider w-32">Actions</th>
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
                                                            <span className="text-gray-400 text-xs">No image</span>
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
                                                            title="Edit article"
                                                        >
                                                            <Edit2 size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(article.id)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Delete article"
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
                                    <p className="text-lg">No articles yet</p>
                                    <p className="mt-2">Click "Add Article" to create your first post</p>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer stats */}
                {!loading && (
                    <div className="mt-4 text-sm text-gray-600 text-right">
                        Total articles: <span className="font-medium">{articles.length}</span>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
                        <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
                            <h2 className="text-xl font-semibold text-gray-900">
                                {editingArticle ? 'Edit Article' : 'Add New Article'}
                            </h2>
                            <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-6">
                            {/* Image Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Article Image <span className="text-red-500">*</span>
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
                                    Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder="Enter article title"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Description <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows={5}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder="Write a short description or summary..."
                                />
                            </div>

                            {/* Category */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Category <span className="text-red-500">*</span>
                                </label>
                                {catsLoading ? (
                                    <div className="text-sm text-gray-500">Loading categories...</div>
                                ) : (
                                    <select
                                        name="categoryId"
                                        value={formData.categoryId}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                                    >
                                        <option value="">Select a category</option>
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
                                    Sub Category <span className="text-red-500">*</span>
                                </label>
                                {subCatsLoading ? (
                                    <div className="text-sm text-gray-500">Loading subcategories...</div>
                                ) : (
                                    <select
                                        name="subCategoryId"
                                        value={formData.subCategoryId}
                                        onChange={handleInputChange}
                                        disabled={!formData.categoryId}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white disabled:bg-gray-100"
                                    >
                                        <option value="">Select a subcategory</option>
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
                                Cancel
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
                                {editingArticle ? 'Update Article' : 'Add Article'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}