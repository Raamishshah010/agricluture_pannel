import { useEffect, useState } from 'react';
import { X, Edit2, Trash2, Plus } from 'lucide-react';
import service from '../../services/varietyService';
import cropService from '../../services/cropService';
import { toast } from 'react-toastify';
import useTranslation from '../../hooks/useTranslation';
import useStore from '../../store/store';

export default function Varieties() {
    const [varities, setVarieties] = useState([]);
    const [crops, setCrops] = useState([]);
    const [loading, setLoading] = useState(false);
    const t = useTranslation();
    const { language } = useStore((state) => state);
    const isLTR = language === 'en';


    useEffect(() => {
        service.getAll().then(res => {
            setVarieties(res.data.items)
        })
            .catch(err => {
                toast.error(err.message);
            })
    }, []);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEmirate, setEditingEmirate] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        cropId: ''
    });

    const openAddModal = () => {
        cropService.getCrops().then(res => {
            setCrops(res.data)
        })
            .catch(err => {
                toast.error("Error fetching crops: ", err.message);
            })
        setEditingEmirate(null);
        setFormData({
            name: '',
            cropId: ''
        });
        setIsModalOpen(true);
    };

    const openEditModal = (variety) => {
        setEditingEmirate(variety);
        cropService.getCrops().then(res => {
            setCrops(res.data)
        })
            .catch(err => {
                toast.error("Error fetching crops: ", err.message);
            })
        setFormData({
            name: variety.name,
            cropId: variety.cropId,
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
        if (!formData.name) {
            alert(t('varieties.validation.allFieldsRequired'));
            return;
        }

        try {
            setLoading(true);
            if (editingEmirate) {
                await service.update(editingEmirate.id, formData);
                setVarieties(prev => prev.map(variety =>
                    variety.id === editingEmirate.id
                        ? { ...variety, ...formData, updatedAt: new Date().toISOString() }
                        : variety
                ));
            } else {
                const res = await service.add(formData);
                setVarieties(prev => [...prev, res.data]);
            }
            setLoading(false);

        } catch (error) {
            setLoading(false);
            toast.error(error.response?.data?.message || error.message);
        }
        closeModal();
    };

    const handleDelete = async (id) => {
        if (window.confirm(t('varieties.confirm.deleteVariety'))) {
            try {
                await service.deleteCrop(id);
                setVarieties(prev => prev.filter(variety => variety.id !== id));
            } catch (error) {
                setLoading(false);
                toast.error(error.response?.data?.message || error.message);
            }
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
       <div className="min-h-screen bg-gray-50 p-0 md:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8 flex flex-col-reverse md:flex-row mt-2 justify-between items-center">
                    <div>
                        <h1 className="text-xl md:text-3xl font-bold text-gray-900">{t('varieties.title')}</h1>
                    </div>
                    <button
                        onClick={openAddModal}
                        className="bg-green-600 cursor-pointer hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <Plus size={20} />
                        {t('varieties.add')}
                    </button>
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-100 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">{t('varieties.table.headers.name')}</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">{t('varieties.table.headers.createdAt')}</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">{t('varieties.table.headers.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {varities.map((variety) => (
                                    <tr key={variety.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{variety.name}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{formatDate(variety.createdAt)}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => openEditModal(variety)}
                                                    className="p-2 cursor-pointer text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title={t('varieties.edit')}
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(variety.id)}
                                                    className="p-2 text-red-600 cursor-pointer hover:bg-red-50 rounded-lg transition-colors"
                                                    title={t('varieties.delete')}
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

                    {varities.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            {t('varieties.empty.noVarieties')}
                        </div>
                    )}
                </div>

                <div className="mt-4 text-sm text-gray-600">
                    {t('varieties.totalVarieties')}: {varities.length}
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900">
                                {editingEmirate ? t('varieties.modal.editVariety') : t('varieties.modal.addNewVariety')}
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
                                        {t('varieties.modal.labels.name')} *
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                        placeholder={t('varieties.modal.namePlaceholder')}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('varieties.modal.labels.crop')}
                                    </label>
                                    <select
                                        name="cropId"
                                        value={formData.cropId}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                                    >
                                        <option value="">{t('varieties.modal.selectCrop')}</option>
                                        {crops.map((crop) => (
                                            <option key={crop.id} value={crop.id}>
                                                {isLTR ? crop.name : crop.nameInArrabic}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                                <button
                                    onClick={closeModal}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                >
                                    {t('varieties.modal.cancel')}
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    className="px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                                >
                                    {
                                        loading ? (
                                            <>
                                                <div>
                                                    <svg aria-hidden="true" className="inline w-5 h-5 text-gray-200 animate-spin dark:text-gray-600 fill-green-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                                                        <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
                                                    </svg>
                                                    <span className="sr-only">Loading...</span>
                                                </div>
                                            </>
                                        ) : (<>
                                            {editingEmirate ? t('varieties.modal.update') : t('varieties.modal.add')}
                                        </>)
                                    }

                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}