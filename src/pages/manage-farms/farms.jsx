import { User, X, CheckCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "react-toastify";
import service from '../../services/farmerService';
import farmService from '../../services/farmService';
import useStore from "../../store/store";
import useTranslation from "../../hooks/useTranslation";
import { getDisplayFarmStatus } from "../../utils";

export default function Farmers({ list, setList, handleDetail, handleEdit }) {
    const t = useTranslation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedFarm, setSelectedFarm] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [search, setSearch] = useState("");
    const [coders, setCoders] = useState([]);
    const { centers, emirates, locations, language } = useStore((state) => state);

    const handleSubmit = async () => {
        if (!selectedFarm) {
            toast.error(t('manageFarms.farms.selectFarm'));
            return;
        }
        if (!selectedUser) {
            toast.error(t('manageFarms.farms.selectUser'));
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
            if (window.confirm(t('manageFarms.farms.deleteConfirmation') + " #" + (farm.farmNo || farm.farmSerial || farm.id))) {
                await farmService.delete(farm.id);
                setList(farm.id);
                toast.success(t('manageFarms.farms.deletedSuccessfully'));
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        }
    }

    const statusLabelMap = {
        active: t('status.active'),
        pending: t('status.pending'),
        draft: t('status.drafts'),
        suspended: t('status.suspended'),
        assigned: t('status.assigned'),
        rejected: t('status.rejected')
    };

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

    const getStatusLabel = (status) => statusLabelMap[status] || status;

    // Helper function to get localized name - supports multiple Arabic property names
    const getLocalizedName = (item) => {
        if (!item) return t('kpi.nA');
        
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
                    {/* Mobile Card View */}
                    <div className="block sm:hidden divide-y divide-gray-200">
                        {list.map((farm) => {
                            const emirateObj = emirates.find(it => it.id === farm.emirate);
                            const centerObj = centers.find(it => it.id === farm.serviceCenter);
                            const locationObj = locations.find(it => it.id === farm.location);
                            const displayStatus = getDisplayFarmStatus(farm);
                            return (
                                <div key={farm.id} className="p-3 space-y-2">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-semibold text-gray-900 text-sm">#{farm.farmSerial || farm.farmNo}</div>
                                            <div className="text-xs text-gray-500">{getLocalizedName(emirateObj)} / {getLocalizedName(centerObj)}</div>
                                        </div>
                                        <span className={getStatusBadge(displayStatus)}>
                                            {getStatusLabel(displayStatus)}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-600">
                                        {getLocalizedName(locationObj)} &middot; {Math.round(farm.size)} ha
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                        <button onClick={() => assignCoderHandle(farm)} className="px-2.5 py-1.5 bg-green-600 text-white text-xs rounded-md">{t('manageFarms.farms.assign')}</button>
                                        <button onClick={() => handleDetail(farm)} className="px-2.5 py-1.5 bg-green-600 text-white text-xs rounded-md">{t('manageFarms.farms.view')}</button>
                                        <button onClick={() => handleEdit(farm)} className="px-2.5 py-1.5 bg-green-600 text-white text-xs rounded-md">{t('manageFarms.farms.edit')}</button>
                                        <button onClick={() => handleDelete(farm)} className="px-2.5 py-1.5 bg-red-400 text-white text-xs rounded-md">{t('manageFarms.farms.delete')}</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {/* Desktop Table */}
                    <div className="hidden sm:block overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-100 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">{t('manageFarms.farms.serial')}</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">{t('manageFarms.farms.farmNumber')}</th>
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
                                    const emirateObj = emirates.find(it => it.id === farm.emirate);
                                    const centerObj = centers.find(it => it.id === farm.serviceCenter);
                                    const locationObj = locations.find(it => it.id === farm.location);
                                    const displayStatus = getDisplayFarmStatus(farm);
                                    
                                    return (
                                        <tr key={farm.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{farm.farmSerial}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{farm.farmNo}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{getLocalizedName(emirateObj)}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{getLocalizedName(centerObj)}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{getLocalizedName(locationObj)}</td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{Math.round(farm.size)}</td>
                                            <td className="py-5 px-6">
                                                <span className={getStatusBadge(displayStatus)}>{getStatusLabel(displayStatus)}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-2 flex-wrap">
                                                    <button onClick={() => assignCoderHandle(farm)} className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700">{t('manageFarms.farms.assign')}</button>
                                                    <button onClick={() => handleDetail(farm)} className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700">{t('manageFarms.farms.view')}</button>
                                                    <button onClick={() => handleEdit(farm)} className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700">{t('manageFarms.farms.edit')}</button>
                                                    <button onClick={() => handleDelete(farm)} className="px-3 py-1.5 bg-red-400 text-white text-xs rounded-lg hover:bg-red-500">{t('manageFarms.farms.delete')}</button>
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
                    <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-end sm:items-center justify-center z-50">
                        <div className="bg-white rounded-t-2xl sm:rounded-lg shadow-xl max-w-2xl w-full sm:m-4 max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-white flex justify-between items-center px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
                                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                                    {t('manageFarms.farms.assignCoderTitle')}
                                </h2>
                                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="px-4 sm:px-6 py-4">
                                <div className="space-y-3 max-h-[50vh] sm:max-h-[300px] overflow-y-auto">
                                    <input
                                        type="text"
                                        placeholder={t('manageFarms.farms.searchCoderByNameEmail')}
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                    {selectedUser ? (
                                        <div className="bg-white border-2 border-emerald-500 rounded-xl p-3 shadow-sm">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                                        <User className="w-5 h-5 text-emerald-600" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="font-semibold text-gray-900 text-sm truncate">{selectedUser.name}</div>
                                                        <p className="text-xs text-gray-600 truncate">{selectedUser.email}</p>
                                                    </div>
                                                </div>
                                                <button onClick={() => { setSearch(""); setSelectedUser(null); }} className="p-1.5 hover:bg-gray-100 rounded-full">
                                                    <X className="w-4 h-4 text-gray-500" />
                                                </button>
                                            </div>
                                        </div>
                                    ) : searchCoders.map((user) => (
                                        <div key={user.id} onClick={() => setSelectedUser(user)} className="bg-white cursor-pointer rounded-xl border border-gray-200 p-3 hover:border-emerald-300 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                                                    <User className="w-5 h-5 text-gray-600" />
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="font-semibold text-gray-900 text-sm truncate">{user.name}</h3>
                                                    <p className="text-xs text-gray-600 truncate">{user.email}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex justify-end gap-2 sm:gap-3 mt-4 pt-4 border-t border-gray-200">
                                    <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">{t('manageFarms.farms.cancel')}</button>
                                    <button onClick={handleSubmit} disabled={loading} className="px-4 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50">
                                        {loading ? <span>{t('common.loading')}</span> : t('manageFarms.farms.assign')}
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
