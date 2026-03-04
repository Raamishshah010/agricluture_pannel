import { useEffect, useState, useMemo } from 'react';
import { X, Edit2, Trash2, Plus, Search, RefreshCw } from 'lucide-react';
import cropService from '../../services/cropService';
import cropTypeService from '../../services/cropTypeService';
import { toast } from 'react-toastify';
import useTranslation from '../../hooks/useTranslation';
import useStore from '../../store/store';
import Loader from '../../components/Loader';

export default function Crops() {
    const [crops, setCrops] = useState([]);
    const [cropTypes, setCropTypes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const t = useTranslation();
    const { language: lang } = useStore(st => st);
    const isLTR = lang.includes('en');

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [cropRes, typeRes] = await Promise.all([
                    cropService.getCrops(),
                    cropTypeService.getAll()
                ]);
                setCrops(cropRes.data);
                setCropTypes(typeRes.data);
            } catch (err) {
                toast.error(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCrop, setEditingCrop] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        scientificName: '',
        typeId: '',
        cultivationDuration: '',
        isActive: true
    });

    const filteredCrops = useMemo(() => {
        if (!searchQuery) return crops;

        const q = searchQuery.toLowerCase();
        return crops.filter(crop =>
            crop.name?.toLowerCase().includes(q) ||
            crop.scientificName?.toLowerCase().includes(q) ||
            crop.cultivationDuration?.toLowerCase().includes(q)
        );
    }, [crops, searchQuery]);

    const openAddModal = () => {
        setEditingCrop(null);
        setFormData({ name: '', scientificName: '', typeId: '', cultivationDuration: '', isActive: true });
        setIsModalOpen(true);
    };

    const openEditModal = (crop) => {
        setEditingCrop(crop);
        setFormData({
            name: crop.name || '',
            scientificName: crop.scientificName || '',
            typeId: crop.typeId || '',
            cultivationDuration: crop.cultivationDuration || '',
            isActive: crop.isActive ?? true
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingCrop(null);
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.scientificName || !formData.cultivationDuration) {
            toast.error(t('crops.fillRequiredFields'));
            return;
        }

        try {
            setLoading(true);
            if (editingCrop) {
                const res = await cropService.updateCrop(editingCrop.id, formData);
                setCrops(prev =>
                    prev.map(c => (c.id === editingCrop.id ? { ...c, ...formData, updatedAt: new Date().toISOString() } : c))
                );
                toast.success(t('crops.updateSuccess'));
            } else {
                const res = await cropService.addCrop(formData);
                setCrops(prev => [...prev, res.data]);
                toast.success(t('crops.addSuccess'));
            }
            closeModal();
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(t('crops.deleteConfirm'))) return;

        try {
            await cropService.deleteCrop(id);
            setCrops(prev => prev.filter(c => c.id !== id));
            toast.success(t('crops.deleteSuccess'));
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const activeCount = crops.filter(c => c.isActive).length;
    const inactiveCount = crops.length - activeCount;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Header & Controls */}
            <div className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-[1400px] mx-auto px-6 py-5">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{t('crops.title')}</h1>
                            <p className="text-sm text-gray-500 mt-1">{t('crops.subtitle')}</p>
                        </div>
                        <button
                            onClick={openAddModal}
                            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-2.5 rounded-lg font-medium shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                        >
                            <Plus size={20} />
                            {t('crops.addCrop')}
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
                            <p className="text-sm font-medium text-blue-600">{t('crops.totalCrops')}</p>
                            <p className="text-3xl font-bold text-blue-900 mt-2">{crops.length}</p>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border border-green-200">
                            <p className="text-sm font-medium text-green-600">{t('crops.active')}</p>
                            <p className="text-3xl font-bold text-green-900 mt-2">{activeCount}</p>
                        </div>
                        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-5 border border-red-200">
                            <p className="text-sm font-medium text-red-600">{t('crops.inactive')}</p>
                            <p className="text-3xl font-bold text-red-900 mt-2">{inactiveCount}</p>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-100">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                                <Search className="w-5 h-5 text-green-600" />
                                Search Crops
                            </h3>
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="text-xs bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg border shadow-sm flex items-center gap-2"
                                >
                                    <X size={14} />
                                    {t('common.clear')}
                                </button>
                            )}
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder={t('crops.searchPlaceholder') || "Search by name, scientific name..."}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-[1400px] mx-auto px-6 py-8">
                <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
                    {loading ? (
                        <div className="py-12">
                            <Loader />
                        </div>
                    ) : (
                        <>
                            <div className="px-6 py-4 border-b bg-gray-50 flex items-center justify-between">
                                <h3 className="text-lg font-medium text-gray-800">
                                    {t('crops.cropList')}
                                </h3>
                                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                                    {filteredCrops.length} {t('crops.found')}
                                </span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full min-w-max">
                                    <thead className="bg-gray-50 border-b">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">{t('crops.nameEnglish')}</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">{t('crops.nameArabic')}</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">{t('crops.duration')}</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">{t('crops.status')}</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">{t('crops.createdAt')}</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">{t('crops.actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {filteredCrops.map(crop => (
                                            <tr key={crop.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 font-medium">{crop.name}</td>
                                                <td className="px-6 py-4 text-gray-600">{crop.scientificName}</td>
                                                <td className="px-6 py-4 text-gray-600">{crop.cultivationDuration}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                                        crop.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                    }`}>
                                                        <span className={`w-2 h-2 rounded-full mr-1.5 ${crop.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                                                        {crop.isActive ? t('crops.active') : t('crops.inactive')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-gray-600">{formatDate(crop.createdAt)}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => openEditModal(crop)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                                            title="Edit"
                                                        >
                                                            <Edit2 size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(crop.id)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                                                            title="Delete"
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

                            {filteredCrops.length === 0 && !loading && (
                                <div className="py-16 text-center text-gray-500">
                                    <p className="text-lg">{t('crops.noCropsFound')}</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Modal – remains almost unchanged, just minor cleanup */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                        <div className="flex justify-between items-center px-6 py-4 border-b bg-gradient-to-r from-green-50 to-emerald-50">
                            <h2 className="text-xl font-semibold">
                                {editingCrop ? t('crops.editCrop') : t('crops.addNewCrop')}
                            </h2>
                            <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
                            {/* name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    {t('crops.cropNameEnglishLabel')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    placeholder="e.g., Wheat"
                                />
                            </div>

                            {/* scientificName / Arabic */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    {t('crops.cropNameArabicLabel')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    name="scientificName"
                                    value={formData.scientificName}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    placeholder="مثال: قمح"
                                />
                            </div>

                            {/* type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    {t('crops.selectCropTypeLabel')} <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="typeId"
                                    value={formData.typeId}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                >
                                    <option value="">{t('crops.selectType')}</option>
                                    {cropTypes.map(type => (
                                        <option key={type.id} value={type.id}>
                                            {isLTR ? type.name : type.scientificName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* duration */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    {t('crops.cultivationDurationLabel')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    name="cultivationDuration"
                                    value={formData.cultivationDuration}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    placeholder="e.g., 120–150 days"
                                />
                            </div>

                            {/* active checkbox */}
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    name="isActive"
                                    checked={formData.isActive}
                                    onChange={handleInputChange}
                                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                />
                                <label htmlFor="isActive" className="ml-3 text-sm font-medium text-gray-700">
                                    {t('crops.markAsActive')}
                                </label>
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t flex justify-end gap-3">
                            <button
                                onClick={closeModal}
                                disabled={loading}
                                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
                            >
                                {loading && (
                                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                    </svg>
                                )}
                                {editingCrop ? t('crops.update') : t('crops.add')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}