import { useEffect, useState } from 'react';
import { X, Edit2, Trash2, Plus } from 'lucide-react';
import cultivationMethodsService from '../../services/cultivationMethodsService';
import { toast } from 'react-toastify';
import useTranslation from '../../hooks/useTranslation';
import Loader from '../../components/Loader';

export default function CultivationMethods() {
    const t = useTranslation();
    const [methods, setMethods] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMethod, setEditingMethod] = useState(null);

    const [formData, setFormData] = useState({
        name: ''
    });

    useEffect(() => {
        fetchMethods();
    }, []);

    const fetchMethods = async () => {
        try {
            setLoading(true);
            const res = await cultivationMethodsService.getAll();
            setMethods(res.data || []);
        } catch (err) {
            toast.error(t('common.errorLoading') || err.message);
        } finally {
            setLoading(false);
        }
    };

    const openAddModal = () => {
        setEditingMethod(null);
        setFormData({ name: '' });
        setIsModalOpen(true);
    };

    const openEditModal = (method) => {
        setEditingMethod(method);
        setFormData({
            name: method?.name || ''
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingMethod(null);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            toast.error(t('cultivationMethods.fillRequiredFields'));
            return;
        }

        try {
            setLoading(true);

            if (editingMethod) {
                await cultivationMethodsService.updateItem(editingMethod.id, formData);
                setMethods(prev =>
                    prev.map(m =>
                        m.id === editingMethod.id
                            ? { ...m, ...formData, updatedAt: new Date().toISOString() }
                            : m
                    )
                );
                toast.success(t('cultivationMethods.updateSuccess') || 'Method updated');
            } else {
                const res = await cultivationMethodsService.addItem(formData);
                setMethods(prev => [...prev, res.data]);
                toast.success(t('cultivationMethods.addSuccess') || 'Method added');
            }

            closeModal();
        } catch (error) {
            toast.error(error.response?.data?.message || error.message || t('common.errorOccurred'));
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(t('cultivationMethods.deleteConfirm'))) return;

        try {
            await cultivationMethodsService.deleteItem(id);
            setMethods(prev => prev.filter(m => m.id !== id));
            toast.success(t('cultivationMethods.deleteSuccess') || 'Method deleted');
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
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
                            {t('cultivationMethods.title')}
                        </h1>
                        <p className="text-gray-600 mt-1">
                            {t('cultivationMethods.subtitle')}
                        </p>
                    </div>
                    <button
                        onClick={openAddModal}
                        className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium shadow-sm transition-colors"
                    >
                        <Plus size={20} />
                        {t('cultivationMethods.add')}
                    </button>
                </div>

                {/* Table Card */}
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
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                                                {t('cultivationMethods.name')}
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                                                {t('cultivationMethods.createdAt')}
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider w-32">
                                                {t('cultivationMethods.actions')}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {methods.map((method) => (
                                            <tr key={method.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                    {method.name || '—'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {formatDate(method.createdAt)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => openEditModal(method)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title={t('cultivationMethods.edit')}
                                                        >
                                                            <Edit2 size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(method.id)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title={t('cultivationMethods.delete')}
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

                            {methods.length === 0 && (
                                <div className="py-16 text-center text-gray-500">
                                    <p className="text-lg">{t('cultivationMethods.noItemsFound')}</p>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Stats */}
                {!loading && (
                    <div className="mt-4 text-sm text-gray-600 text-right">
                        {t('cultivationMethods.totalItems')}: <span className="font-medium">{methods.length}</span>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                        <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
                            <h2 className="text-xl font-semibold text-gray-900">
                                {editingMethod ? t('cultivationMethods.editItem') : t('cultivationMethods.addNewItem')}
                            </h2>
                            <button
                                onClick={closeModal}
                                className="text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    {t('cultivationMethods.nameLabel')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    placeholder={t('cultivationMethods.enterName') || 'e.g. Drip Irrigation, Mulching'}
                                />
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t flex justify-end gap-3">
                            <button
                                onClick={closeModal}
                                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                            >
                                {t('cultivationMethods.cancel')}
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-60 flex items-center gap-2"
                            >
                                {loading && (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" className="opacity-25" />
                                            <path fill="currentColor" d="M4 12a8 8 0 018-8v8z" className="opacity-75" />
                                        </svg>
                                        <span className="sr-only">{t('common.loading')}</span>
                                    </>
                                )}
                                {editingMethod ? t('cultivationMethods.update') : t('cultivationMethods.add')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}