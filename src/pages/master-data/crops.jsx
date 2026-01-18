import { useEffect, useState, useMemo } from 'react';
import { X, Edit2, Trash2, Plus, Search, RefreshCw } from 'lucide-react';
import cropService from '../../services/cropService';
import cropTypeService from '../../services/cropTypeService';
import { toast } from 'react-toastify';
import useTranslation from '../../hooks/useTranslation';
import useStore from '../../store/store';

export default function Crops() {
    const [crops, setCrops] = useState([]);
    const [cropTypes, setCropTypes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const t = useTranslation();
    const { language: lang } = useStore(st => st);
    const isLTR = lang.includes('en');

    useEffect(() => {
        cropService.getCrops().then(res => {
            setCrops(res.data)
        })
            .catch(err => {
                toast.error(err.message);
            })
    }, []);

    useEffect(() => {
        cropTypeService.getAll().then(res => {
            setCropTypes(res.data)
        })
            .catch(err => {
                toast.error(err.message);
            })
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

    // Filtered crops based on search
    const filteredCrops = useMemo(() => {
        return crops.filter(crop => {
            const matchesSearch = searchQuery === '' || 
                crop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                crop.scientificName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                crop.cultivationDuration.toLowerCase().includes(searchQuery.toLowerCase());

            return matchesSearch;
        });
    }, [crops, searchQuery]);

    const openAddModal = () => {
        setEditingCrop(null);
        setFormData({
            name: '',
            scientificName: '',
            typeId: '',
            cultivationDuration: '',
            isActive: true
        });
        setIsModalOpen(true);
    };

    const openEditModal = (crop) => {
        setEditingCrop(crop);
        setFormData({
            name: crop.name,
            scientificName: crop.scientificName,
            typeId: crop.typeId || '',
            cultivationDuration: crop.cultivationDuration,
            isActive: crop.isActive
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
                setCrops(prev => prev.map(crop =>
                    crop.id === editingCrop.id
                        ? { ...crop, ...formData, updatedAt: new Date().toISOString() }
                        : crop
                ));
                toast.success(t('crops.updateSuccess'));
            } else {
                const res = await cropService.addCrop(formData);
                setCrops(prev => [...prev, res.data]);
                toast.success(t('crops.addSuccess'));
            }
            setLoading(false);
            closeModal();
        } catch (error) {
            setLoading(false);
            toast.error(error.response?.data?.message || error.message);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm(t('crops.deleteConfirm'))) {
            try {
                await cropService.deleteCrop(id);
                setCrops(prev => prev.filter(crop => crop.id !== id));
                toast.success(t('crops.deleteSuccess'));
            } catch (error) {
                toast.error(error.response?.data?.message || error.message);
            }
        }
    };

    const handleClearFilters = () => {
        setSearchQuery('');
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
            {/* Header */}
            <div className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-[1400px] mx-auto px-6 py-5">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{t('crops.title')}</h1>
                            <p className="text-sm text-gray-500 mt-1">{t('crops.subtitle')}</p>
                        </div>
                        <div className="flex gap-3">
                            
                            <button
                                onClick={openAddModal}
                                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-2.5 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                            >
                                <Plus size={20} />
                                {t('crops.addCrop')}
                            </button>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-blue-600">{t('crops.totalCrops')}</p>
                                    <p className="text-2xl font-bold text-blue-900 mt-1">{crops.length}</p>
                                </div>
                                <div className="bg-blue-200 p-3 rounded-lg">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-green-600">{t('crops.active')}</p>
                                    <p className="text-2xl font-bold text-green-900 mt-1">{activeCount}</p>
                                </div>
                                <div className="bg-green-200 p-3 rounded-lg">
                                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-red-600">{t('crops.inactive')}</p>
                                    <p className="text-2xl font-bold text-red-900 mt-1">{inactiveCount}</p>
                                </div>
                                <div className="bg-red-200 p-3 rounded-lg">
                                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-100">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                                <Search className="w-5 h-5 text-green-600" />
                                Search Crops
                            </h3>
                            {searchQuery && (
                                <button
                                    className="text-xs bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium border border-gray-200 shadow-sm hover:shadow transition-all duration-200 flex items-center gap-2"
                                    onClick={handleClearFilters}
                                >
                                    <X className="w-4 h-4" />
                                    {t('common.clear')}
                                </button>
                            )}
                        </div>

                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder={t('crops.nameEnglish')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Results Section */}
            <div className="max-w-[1400px] mx-auto px-6 py-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                        <div className="flex items-center justify-between">
                            
                            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">
                                {filteredCrops.length} {t('crops.found')}
                            </span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        {t('crops.nameEnglish')}
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        {t('crops.nameArabic')}
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        {t('crops.duration')}
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        {t('crops.status')}
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        {t('crops.createdAt')}
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        {t('crops.actions')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {filteredCrops.map((crop) => (
                                    <tr key={crop.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{crop.name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-600">{crop.scientificName}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-600">{crop.cultivationDuration}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                                crop.isActive
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full mr-2 ${
                                                    crop.isActive ? 'bg-green-600' : 'bg-red-600'
                                                }`}></span>
                                                {crop.isActive ? t('crops.active') : t('crops.inactive')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {formatDate(crop.createdAt)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => openEditModal(crop)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title={t('crops.edit')}
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(crop.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title={t('crops.delete')}
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

                    {filteredCrops.length === 0 && (
                        <div className="text-center py-12">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="mt-4 text-gray-500">{t('crops.noCropsFound')}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full transform transition-all">
                        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
                            <h2 className="text-xl font-semibold text-gray-900">
                                {editingCrop ? t('crops.editCrop') : t('crops.addNewCrop')}
                            </h2>
                            <button
                                onClick={closeModal}
                                className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="px-6 py-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {t('crops.cropNameEnglishLabel')} <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                        placeholder="e.g., Wheat"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {t('crops.cropNameArabicLabel')} <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="scientificName"
                                        value={formData.scientificName}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                        placeholder="e.g., خيار"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {t('crops.selectCropTypeLabel')} <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.typeId}
                                        name='typeId'
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                    >
                                        <option value="">{t('crops.cropType')}</option>
                                        {cropTypes.map((type) => (
                                            <option key={type.id} value={type.id}>
                                                {isLTR ? type.name : type.scientificName}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {t('crops.cultivationDurationLabel')} <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="cultivationDuration"
                                        value={formData.cultivationDuration}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                        placeholder="e.g., 6 months"
                                    />
                                </div>

                                <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                                    <input
                                        type="checkbox"
                                        name="isActive"
                                        id="isActive"
                                        checked={formData.isActive}
                                        onChange={handleInputChange}
                                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                    />
                                    <label htmlFor="isActive" className="ml-3 text-sm font-medium text-gray-700">
                                        {t('crops.active')}
                                    </label>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                                <button
                                    onClick={closeModal}
                                    disabled={loading}
                                    className="px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium disabled:opacity-50"
                                >
                                    {t('crops.cancel')}
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="px-6 py-2.5 text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg transition-all font-medium disabled:opacity-50 flex items-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span>{t('common.processing')}</span>
                                        </>
                                    ) : (
                                        <span>{editingCrop ? t('crops.update') : t('crops.add')}</span>
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