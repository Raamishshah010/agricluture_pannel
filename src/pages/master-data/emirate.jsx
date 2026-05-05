import { useEffect, useState } from 'react';
import { X, Edit2, Trash2, Plus } from 'lucide-react';
import { toast } from 'react-toastify';
import emirateService from '../../services/emirateService';
import useTranslation from '../../hooks/useTranslation';
import Loader from '../../components/Loader';
import MasterDataCsvToolbar from '../../components/MasterDataCsvToolbar';

export default function Emirates() {
    const [emirates, setEmirates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEmirate, setEditingEmirate] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        nameInArabic: ''
    });
    const t = useTranslation();

    const loadItems = async () => {
        try {
            setLoading(true);
            const res = await emirateService.getEmirates();
            const freshItems = Array.isArray(res.data) ? res.data : res.data?.items || [];
            setEmirates((previous) =>
                freshItems.map((item) => {
                    const existing = previous.find((entry) => entry.id === item.id);
                    return existing ? { ...existing, ...item } : item;
                })
            );
        } catch (err) {
            toast.error(err.message || t('common.errorOccurred'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadItems();
    }, []);

    const openAddModal = () => {
        setEditingEmirate(null);
        setFormData({ name: '', nameInArabic: '' });
        setIsModalOpen(true);
    };

    const openEditModal = (emirate) => {
        setEditingEmirate(emirate);
        setFormData({
            name: emirate?.name || '',
            nameInArabic: emirate?.nameInArabic || ''
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingEmirate(null);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        if (!formData.name.trim() || !formData.nameInArabic.trim()) {
            toast.error(t('emirates.fillRequiredFields'));
            return;
        }

        try {
            setLoading(true);

            if (editingEmirate) {
                await emirateService.updateEmirate(editingEmirate.id, formData);
                setEmirates(prev =>
                    prev.map(em =>
                        em.id === editingEmirate.id
                            ? { ...em, ...formData, updatedAt: new Date().toISOString() }
                            : em
                    )
                );
                toast.success(t('emirates.updateSuccess'));
            } else {
                const res = await emirateService.addEmirate(formData);
                setEmirates(prev => [...prev, res.data]);
                toast.success(t('emirates.addSuccess'));
            }

            closeModal();
        } catch (error) {
            toast.error(error.response?.data?.message || error.message || t('common.errorOccurred'));
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(t('emirates.deleteConfirm'))) return;

        try {
            await emirateService.deleteEmirate(id);
            setEmirates(prev => prev.filter(em => em.id !== id));
            toast.success(t('emirates.deleteSuccess'));
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
                <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                        {t('emirates.title')}
                    </h1>
                    <div className="flex flex-wrap items-center gap-3">
                        <MasterDataCsvToolbar
                            items={emirates}
                            exportFields={['name', 'nameInArabic']}
                            exportFileName="emirates.csv"
                            importLabel={t('common.importCsv') || 'Import CSV'}
                            exportLabel={t('common.exportCsv') || 'Export CSV'}
                            itemLabel="emirates"
                            createItem={emirateService.addEmirate}
                            mapCsvRowToPayload={(row) => ({
                                name: row.name || row.Name || '',
                                nameInArabic: row.nameInArabic || row.nameInArrabic || row.NameInArabic || '',
                            })}
                            refreshItems={loadItems}
                            loading={loading}
                        />
                        <button
                            onClick={openAddModal}
                            className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-sm"
                        >
                            <Plus size={20} />
                            {t('emirates.add')}
                        </button>
                    </div>
                </div>

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
                                                {t('emirates.nameArabic')}
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                                                {t('emirates.nameEnglish')}
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                                                {t('emirates.createdAt')}
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                                                {t('emirates.actions')}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {emirates.map((emirate) => (
                                            <tr key={emirate.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {emirate.nameInArabic || '—'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {emirate.name || '—'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {formatDate(emirate.createdAt)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => openEditModal(emirate)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title={t('common.edit')}
                                                        >
                                                            <Edit2 size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(emirate.id)}
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

                            {emirates.length === 0 && (
                                <div className="py-16 text-center text-gray-500">
                                    <p className="text-lg">{t('emirates.noItemsFound')}</p>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {!loading && (
                    <div className="mt-4 text-sm text-gray-600 text-right">
                        {t('emirates.totalItems')}: <span className="font-medium">{emirates.length}</span>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                        <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
                            <h2 className="text-xl font-semibold text-gray-900">
                                {editingEmirate ? t('emirates.editItem') : t('emirates.addNewItem')}
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
                                    {t('emirates.nameArabicLabel')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="nameInArabic"
                                    value={formData.nameInArabic}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    placeholder={t('emirates.nameArabicPlaceholder') || 'مثال: دبي'}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    {t('emirates.nameEnglishLabel')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    placeholder={t('emirates.nameEnglishPlaceholder') || 'e.g. Dubai'}
                                />
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t flex justify-end gap-3">
                            <button
                                onClick={closeModal}
                                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                            >
                                {t('emirates.cancel')}
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
                                {editingEmirate ? t('emirates.update') : t('emirates.add')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
