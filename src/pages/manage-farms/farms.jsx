import { User, X, CheckCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "react-toastify";
import service from '../../services/farmerService';
import farmService from '../../services/farmService';
import useStore from "../../store/store";
import useTranslation from "../../hooks/useTranslation";

export default function Farmers({ list, setList, handleDetail, handleEdit }) {
    const t = useTranslation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedFarm, setSelectedFarm] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [search, setSearch] = useState("");
    const [coders, setCoders] = useState([]);
    const { centers, emirates, locations, language } = useStore((state) => state);

    // DEBUG: Log the data structure to console (remove after debugging)
    console.log('Language:', language);
    console.log('Sample Emirate:', emirates[0]);
    console.log('Sample Center:', centers[0]);
    console.log('Sample Location:', locations[0]);

    const handleSubmit = async () => {
        if (!selectedFarm) {
            alert(t('manageFarms.farms.selectFarm'));
            return;
        }
        if (!selectedUser) {
            alert(t('manageFarms.farms.selectUser'));
            return;
        }
        try {
            setLoading(true);

            const payload = {
                farmId: selectedFarm.id
            };
            await service.assignFarm(selectedUser.id, payload);
            toast.success(t('manageFarms.farms.assignedSuccessfully'));
            setSelectedFarm(null);
            setSelectedUser(null);
            setIsModalOpen(false);
            setLoading(false);
        } catch (error) {
            setLoading(false);
            toast.error(error.response?.data?.message || error.message);
        }
    };

    const assignCoderHandle = async (farm) => {
        try {
            const res = await service.getCoders();
            setCoders(res.data.coders);
            setIsModalOpen(true);
            setSelectedFarm(farm);
        } catch (error) {
            setLoading(false);
            toast.error(error.response?.data?.message || error.message);
        }
    }

    const handleDelete = async (farm) => {
        try {
            if (window.confirm(t('manageFarms.farms.deleteConfirmation') + " " + farm.farmName)) {
                await farmService.delete(farm.id);
                setList(farm.id);
                toast.success(t('manageFarms.farms.deletedSuccessfully'));
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        }
    }

    const getStatusBadge = (status) => {
        const baseClasses = "px-3 py-1 rounded-full text-sm font-medium";
        switch (status) {
            case 'active':
                return `${baseClasses} bg-green-100 text-green-800`;
            case 'pending':
                return `${baseClasses} bg-blue-100 text-blue-800`;
            case 'draft':
                return `${baseClasses} bg-gray-100 text-gray-800`;
            case 'suspended':
                return `${baseClasses} bg-red-100 text-red-800`;
            default:
                return `${baseClasses} bg-gray-100 text-gray-800`;
        }
    };

    const getStatus = (status, isAssigned) => {
        if (!isAssigned) return 'draft';
        return status;
    };

    // Helper function to get localized name - supports multiple Arabic property names
    const getLocalizedName = (item) => {
        if (!item) return 'N/A';
        
        // If language is Arabic, try different possible Arabic property names
        if (language === 'ar') {
            // Try common Arabic property names
            return item.nameInArrabic   || item.nameInArrabic  || item.nameInArrabic  || item.nameInArrabic  || item.nameInArrabic  || item.nameInArrabic ;
        }
        
        // Default to English name
        return item.name || item.nameEn || item.englishName || 'N/A';
    };

    const searchCoders = useMemo(() => {
        if (search.trim().length) {
            return coders.filter(it =>
            (
                it.email.toLowerCase().includes(search.trim().toLowerCase()) ||
                it.name.toLowerCase().includes(search.trim().toLowerCase())
            ))
        } else {
            return coders;
        }
    }, [coders, search]);

    return (
        <div className="min-h-screen bg-gray-50">
            <div>
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-100 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">{t('manageFarms.farms.name')}</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">{t('manageFarms.farms.agricultureId')}</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">{t('manageFarms.farms.farmNumber')}</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">{t('manageFarms.farms.serial')}</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">{t('manageFarms.farms.emirate')}</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">{t('manageFarms.farms.center')}</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">{t('manageFarms.farms.location')}</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">{t('manageFarms.farms.size')}</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">{t('manageFarms.farms.status')}</th>
                                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">{t('manageFarms.farms.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {list.map((farm) => {
                                    // Find the related objects
                                    const emirateObj = emirates.find(it => it.id === farm.emirate);
                                    const centerObj = centers.find(it => it.id === farm.serviceCenter);
                                    const locationObj = locations.find(it => it.id === farm.location);
                                    
                                    // DEBUG: Log for first farm only
                                    if (farm === list[0]) {
                                        console.log('First farm emirate object:', emirateObj);
                                        console.log('First farm center object:', centerObj);
                                        console.log('First farm location object:', locationObj);
                                    }
                                    
                                    return (
                                        <tr key={farm.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{farm.farmName}</td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900 text-nowrap">{farm.agricultureId}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{farm.farmNo}</td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{farm.farmSerial}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {getLocalizedName(emirateObj)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {getLocalizedName(centerObj)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {getLocalizedName(locationObj)}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{Math.round(farm.size)}</td>
                                            <td className="py-5 px-6">
                                                <span className={getStatusBadge(getStatus(farm.status, farm.isAssigned))}>
                                                    {getStatus(farm.status, farm.isAssigned)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => assignCoderHandle(farm)}
                                                        className="h-10 mt-4 px-2 bg-green-600 text-white cursor-pointer rounded-lg transition-colors hover:bg-green-700"
                                                        title={t('manageFarms.farms.assignCoder')}
                                                    >
                                                        {t('manageFarms.farms.assign')}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDetail(farm)}
                                                        className="h-10 mt-4 px-2 bg-green-600 text-white cursor-pointer rounded-lg transition-colors hover:bg-green-700"
                                                        title={t('manageFarms.farms.view')}
                                                    >
                                                        {t('manageFarms.farms.view')}
                                                    </button>
                                                    <button
                                                        onClick={() => handleEdit(farm)}
                                                        className="h-10 mt-4 px-2 bg-green-600 text-white cursor-pointer rounded-lg transition-colors hover:bg-green-700"
                                                        title={t('manageFarms.farms.edit')}
                                                    >
                                                        {t('manageFarms.farms.edit')}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(farm)}
                                                        className="h-10 mt-4 px-2 bg-red-400 text-white cursor-pointer rounded-lg transition-colors hover:bg-red-500"
                                                        title={t('manageFarms.farms.delete')}
                                                    >
                                                        {t('manageFarms.farms.delete')}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
                {isModalOpen && (
                    <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
                            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
                                <h2 className="text-xl font-semibold text-gray-900">
                                    {t('manageFarms.farms.assignCoderTitle')}
                                </h2>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="px-6 py-4">
                                <div className="space-y-4 h-[300px] overflow-y-auto overflow-x-hidden">
                                    <div className="flex items-center justify-center mb-5">
                                        <div className="relative w-full">
                                            <input
                                                type="text"
                                                placeholder={t('manageFarms.farms.searchCoderByNameEmail')}
                                                value={search}
                                                onChange={(e) => setSearch(e.target.value)}
                                                className="w-full px-4 py-2 text-gray-800 bg-white border border-gray-300 rounded-2xl shadow-sm focus:outline-none drop-shadow-[1px_5px_6px_rgba(0,0,0,0.15)]"
                                            />
                                        </div>
                                    </div>
                                    {selectedUser ? (
                                        <div className="bg-white border-2 border-green-500 rounded-lg p-4 shadow-sm">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3 flex-1">
                                                    {selectedUser.image ? (
                                                        <img
                                                            src={selectedUser.image}
                                                            alt={selectedUser.name}
                                                            className="w-12 h-12 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                                                            <User className="w-6 h-6 text-green-600" />
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="font-semibold text-gray-900 truncate">{selectedUser.name}</h3>
                                                            {selectedUser.isEmailVerified && (
                                                                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-gray-600 truncate">{selectedUser.email}</p>
                                                        {selectedUser.isCoder && (
                                                            <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                                                                {t('manageFarms.farms.coder')}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setSearch("");
                                                        setSelectedUser(null);
                                                    }}
                                                    className="ml-2 p-2 hover:bg-gray-100 rounded-full transition-colors"
                                                    title={t('manageFarms.farms.clearSelection')}
                                                >
                                                    <X className="w-5 h-5 text-gray-500" />
                                                </button>
                                            </div>
                                        </div>
                                    ) : searchCoders.map((user) => (
                                        <div
                                            key={user.id}
                                            onClick={() => {
                                                setSelectedUser(user);
                                            }}
                                            className="bg-white cursor-pointer rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.01] overflow-hidden"
                                        >
                                            <div className="p-2 flex items-center gap-6">
                                                {user.image ? (
                                                    <img
                                                        src={user.image}
                                                        alt={user.name}
                                                        className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                                                    />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                                                        <User className="w-6 h-6 text-gray-600" />
                                                    </div>
                                                )}
                                                <div className="flex-1">
                                                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                                                        {user.name}
                                                    </h3>
                                                    <p className="text-gray-600 text-base">
                                                        {user.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                                    <button
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                    >
                                        {t('manageFarms.farms.cancel')}
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={loading}
                                        className="px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? (
                                            <div className="flex items-center gap-2">
                                                <svg aria-hidden="true" className="inline w-5 h-5 text-gray-200 animate-spin dark:text-gray-600 fill-green-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                                                    <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
                                                </svg>
                                                <span className="sr-only">Loading...</span>
                                            </div>
                                        ) : t('manageFarms.farms.assign')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}