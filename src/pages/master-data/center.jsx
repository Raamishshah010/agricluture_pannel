import { useEffect, useState } from 'react';
import { X, Edit2, Trash2, Plus } from 'lucide-react';
import service from '../../services/centerService';
import emirateService from '../../services/emirateService';
import { toast } from 'react-toastify';
import useTranslation from '../../hooks/useTranslation';
import Loader from '../../components/Loader';
import useStore from '../../store/store';
import MasterDataCsvToolbar from '../../components/MasterDataCsvToolbar';

export default function Centers() {
    const [items, setItems] = useState([]);
    const [emirates, setEmirates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [optionsLoading, setOptionsLoading] = useState(false);
    const t = useTranslation();
    const { language } = useStore((state) => state);
    const isLTR = language === 'en';

    const loadItems = async () => {
        try {
            setLoading(true);
            const res = await service.getCenters();
            const freshItems = Array.isArray(res.data) ? res.data : res.data?.items || [];
            setItems((previous) =>
                freshItems.map((item) => {
                    const existing = previous.find((entry) => entry.id === item.id);
                    return existing ? { ...existing, ...item } : item;
                })
            );
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    const loadEmirates = async () => {
        try {
            setOptionsLoading(true);
            const res = await emirateService.getEmirates();
            setEmirates(Array.isArray(res.data) ? res.data : res.data?.items || []);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setOptionsLoading(false);
        }
    };

    useEffect(() => {
        loadItems();
        loadEmirates();
    }, []);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEmirate, setEditingEmirate] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        nameInArrabic: '',
        emirateId: '',
    });

    const openAddModal = () => {
        setEditingEmirate(null);
        setFormData({
            name: '',
            nameInArrabic: '',
            emirateId: '',
        });
        setIsModalOpen(true);
    };

    const openEditModal = (center) => {
        setEditingEmirate(center);
        setFormData({
            name: center.name || '',
            nameInArrabic: center.nameInArrabic || '',
            emirateId: center.emirateId || '',
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
        if (!formData.name || !formData.nameInArrabic || !formData.emirateId) {
            toast.error(t('analytics.center.fillRequiredFields'));
            return;
        }

        try {
            setLoading(true);
            if (editingEmirate) {
                await service.updateCenter(editingEmirate.id, formData);
                await loadItems();
            } else {
                const res = await service.addCenter(formData);
                setItems(prev => [...prev, res.data]);
            }
            closeModal();
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm(t('analytics.center.deleteConfirm'))) {
            try {
                await service.deleteEmirate(id);
                setItems(prev => prev.filter(center => center.id !== id));
            } catch (error) {
                toast.error(error.response?.data?.message || error.message);
            }
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const exportItems = items.map((center) => ({
        ...center,
        emirateName: isLTR
            ? center.emirate?.name || center.emirate?.nameInArrabic || ''
            : center.emirate?.nameInArrabic || center.emirate?.name || '',
    }));

    return (
        <div className="min-h-screen bg-gray-50 p-0 md:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8 flex flex-col-reverse md:flex-row mt-2 justify-between items-center gap-4">
                    <div>
                        <h1 className="text-xl md:text-3xl font-bold text-gray-900">{t('analytics.center.title')}</h1>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <MasterDataCsvToolbar
                            items={exportItems}
                            exportFields={['nameInArrabic', 'name', 'emirateName']}
                            exportFileName="centers.csv"
                            importLabel={t('common.importCsv') || 'Import CSV'}
                            exportLabel={t('common.exportCsv') || 'Export CSV'}
                            itemLabel="centers"
                            createItem={service.addCenter}
                            mapCsvRowToPayload={(row) => ({
                                name: row.name || row.Name || '',
                                nameInArrabic: row.nameInArrabic || row.nameInArabic || row.NameInArrabic || row.NameInArabic || '',
                                emirateId: row.emirateId || row.EmirateId || row.emirate_id || '',
                            })}
                            refreshItems={loadItems}
                            loading={loading}
                        />
                        <button
                            onClick={openAddModal}
                            className="bg-green-600 cursor-pointer hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
                        >
                            <Plus size={20} />
                            {t('analytics.center.addCenter')}
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
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">{t('center.nameArabic')}</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">{t('center.nameEnglish')}</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">{t('center.emirate')}</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">{t('center.createdAt')}</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">{t('center.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {items.map((center) => (
                                        <tr key={center.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{center.nameInArrabic || '-'}</td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{center.name || '-'}</td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                {isLTR ? center.emirate?.name || center.emirate?.nameInArrabic : center.emirate?.nameInArrabic || center.emirate?.name || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{formatDate(center.createdAt)}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => openEditModal(center)}
                                                        className="p-2 cursor-pointer text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title={t('center.editCenter')}
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(center.id)}
                                                        className="p-2 text-red-600 cursor-pointer hover:bg-red-50 rounded-lg transition-colors"
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
                    )}

                    {!loading && items.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            {t('analytics.center.noItemsFound')}
                        </div>
                    )}
                </div>

                <div className="mt-4 text-sm text-gray-600">
                    {t('analytics.center.totalItems')} {items.length}
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900">
                                {editingEmirate ? t('analytics.center.editCenter') : t('analytics.center.addNewCenter')}
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
                                        {t('analytics.center.nameArabicLabel')}
                                    </label>
                                    <input
                                        type="text"
                                        name="nameInArrabic"
                                        value={formData.nameInArrabic}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                        placeholder={t('analytics.center.nameArabicPlaceholder')}
                                    />
                                </div>
                            </div>
                            <div className="space-y-4 mt-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('analytics.center.nameEnglishLabel')}
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                        placeholder={t('analytics.center.nameEnglishPlaceholder')}
                                    />
                                </div>
                            </div>
                            <div className="space-y-4 mt-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('analytics.center.emirateLabel')}
                                    </label>
                                    {optionsLoading ? (
                                        <div className="p-3">
                                            <Loader message={t('common.loading')} />
                                        </div>
                                    ) : (
                                        <select
                                            name="emirateId"
                                            value={formData.emirateId}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                        >
                                            <option value="">{t('analytics.center.selectEmirate')}</option>
                                            {emirates.map(it => (
                                                <option key={it.id} value={it.id}>{isLTR ? it.name : it.nameInArrabic}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                                <button
                                    onClick={closeModal}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                >
                                    {t('analytics.center.cancel')}
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    className="px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                                >
                                    {loading ? t('common.loading') : (editingEmirate ? t('center.update') : t('center.add'))}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
