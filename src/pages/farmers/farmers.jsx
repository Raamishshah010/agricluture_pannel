import { useState } from "react";
import service from '../../services/farmerService';
import { Edit2, Plus, Trash2, X, Eye, CheckCircle2, XCircle } from "lucide-react";
import useTranslation from '../../hooks/useTranslation';
import { toast } from 'react-toastify';
import useStore from '../../store/store';
import { getLocalizedPersonName } from '../../utils/localizedName';

export default function Farmers({
    list,
    handleFarms,
    setList,
    totalCount = 0,
    statusFilter = 'all',
    setStatusFilter,
    onRefreshFarmers,
}) {
    const t = useTranslation();
    const { language } = useStore((state) => state);
    const getFarmerName = (farmer) => getLocalizedPersonName(farmer, language) || t('common.nA');
    const sortFarmersByCreatedAtDesc = (farmers = []) => [...farmers].sort((a, b) => {
        const aTime = new Date(a?.createdAt || 0).getTime();
        const bTime = new Date(b?.createdAt || 0).getTime();
        return bTime - aTime;
    });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState({});
    const [editingItem, setEditingItem] = useState(null);
    const [approvalDialogItem, setApprovalDialogItem] = useState(null);
    const [approvalRole, setApprovalRole] = useState('farmer');
    const accountStatusOptions = ['active', 'pending_approval', 'inactive', 'suspended'];
    const approvalStatusOptions = ['approved', 'pending_approval', 'under_review', 'needs_revision', 'rejected'];
    const [formData, setFormData] = useState({
        name: '',
        emirateId: '',
        email: '',
        phoneNumber: '',
        image: '',
        isCoder: false,
        status: 'pending_approval',
        approvalStatus: 'pending_approval',
    });

    const openAddModal = () => {
        setEditingItem(null);
        setFormData({
            name: '',
            email: '',
            emirateId: '',
            phoneNumber: '',
            image: '',
            isCoder: false,
            status: 'approved',
            approvalStatus: 'approved',
        });
        setIsModalOpen(true);
    };

    const openEditModal = (coder) => {
        setEditingItem(coder);
        setFormData({
            name: coder.name,
            email: coder.email,
            emirateId: coder.emirateId || '',
            phoneNumber: coder.phoneNumber || '',
            image: coder.image || '',
            isCoder: !!coder.isCoder,
            status: coder.status || 'pending_approval',
            approvalStatus: coder.approvalStatus || 'pending_approval',
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async () => {
        if (
            !formData.name ||
            !formData.email ||
            !formData.phoneNumber
        ) {
            toast.error(t('farmers.farmers.requiredFields'));
            return;
        }
        try {
            setLoading(true);

            const fd = new FormData();
            fd.append('name', formData.name);
            fd.append('email', formData.email);
            fd.append('emirateId', formData.emirateId);
            fd.append('phoneNumber', formData.phoneNumber);
            fd.append('isCoder', String(!!formData.isCoder));
            if (editingItem) {
                fd.append('status', formData.status);
                fd.append('approvalStatus', formData.approvalStatus);
            }
            if (!editingItem) {
                fd.append('autoApprove', 'true');
            }

            if (editingItem) {
                const res = await service.update(editingItem.id, fd);
                setList(prev => sortFarmersByCreatedAtDesc(prev.map(coder =>
                    coder.id === editingItem.id
                        ? res.data.farmer
                        : coder
                )));
            } else {
                const res = await service.addFarmer(fd);
                setList(prev => sortFarmersByCreatedAtDesc([...prev, res.data.farmer]));
            }

            closeModal();
            if (onRefreshFarmers) {
                await onRefreshFarmers();
            }
            setLoading(false);
        } catch (error) {
            setLoading(false);
            toast.error(error.response?.data?.message || error.message);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm(t('farmers.farmers.deleteConfirm'))) {
            await service.delete(id);
            if (onRefreshFarmers) {
                await onRefreshFarmers();
            } else {
                setList(prev => sortFarmersByCreatedAtDesc(prev.filter(coder => coder.id !== id)));
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

    const getNormalizedApprovalStatus = (farmer) => {
        const rawApproval = String(farmer?.approvalStatus || '').toLowerCase().trim();
        if (rawApproval === 'approved') return 'approved';
        if (rawApproval === 'rejected') return 'rejected';
        if (['pending_approval', 'under_review', 'needs_revision', 'pending'].includes(rawApproval)) {
            return 'pending_approval';
        }

        const rawStatus = String(farmer?.status || '').toLowerCase().trim();
        if (rawStatus === 'active') return 'approved';
        if (['inactive', 'suspended', 'rejected'].includes(rawStatus)) return 'rejected';
        if (['pending_approval', 'under_review', 'needs_revision'].includes(rawStatus)) {
            return 'pending_approval';
        }

        return 'pending_approval';
    };

    const getApprovalBadgeClasses = (status) => {
        if (status === 'approved') {
            return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        }
        if (status === 'rejected') {
            return 'bg-red-50 text-red-700 border-red-200';
        }
        return 'bg-amber-50 text-amber-700 border-amber-200';
    };

    const getApprovalLabel = (status) => {
        if (status === 'approved') return t('farmers.farmerApprovals.approvedStatus');
        if (status === 'rejected') return t('farmers.farmerApprovals.rejectedStatus');
        return t('farmers.farmers.pendingApproval');
    };

    const getAccountStatusLabel = (status) => {
        const normalized = String(status || '').toLowerCase().trim();
        return t(`farmers.farmers.accountStatuses.${normalized}`) || normalized;
    };

    const getApprovalStatusOptionLabel = (status) => {
        const normalized = String(status || '').toLowerCase().trim();
        return t(`farmers.farmers.approvalStatuses.${normalized}`) || normalized;
    };

    const handleApprovalDecision = async (farmer, action) => {
        if (action === 'reject' && !window.confirm(t('farmers.farmerApprovals.rejectConfirm'))) {
            return;
        }

        try {
            setActionLoading((prev) => ({ ...prev, [farmer.id]: action }));
            const payload = action === 'approve'
                ? { action, role: approvalRole }
                : { action };
            const res = await service.updateApprovalStatus(farmer.id, payload);
            const updatedFarmer = res?.data?.farmer || {};

            setList((prev) => sortFarmersByCreatedAtDesc(prev.map((entry) => {
                if (entry.id !== farmer.id) return entry;
                return {
                    ...entry,
                    ...updatedFarmer,
                    status: res?.data?.status || updatedFarmer?.status || entry.status,
                    approvalStatus: res?.data?.approvalStatus || updatedFarmer?.approvalStatus || entry.approvalStatus,
                    statusDetails: res?.data?.statusDetails || updatedFarmer?.statusDetails || entry.statusDetails,
                };
            })));

            toast.success(
                action === 'approve'
                    ? t('farmers.farmerApprovals.approveSuccess')
                    : t('farmers.farmerApprovals.rejectSuccess')
            );
            if (action === 'approve') {
                setApprovalDialogItem(null);
                setApprovalRole('farmer');
            }
            if (onRefreshFarmers) {
                await onRefreshFarmers();
            }
        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                (action === 'approve'
                    ? t('farmers.farmerApprovals.approveFail')
                    : t('farmers.farmerApprovals.rejectFail'))
            );
        } finally {
            setActionLoading((prev) => {
                const next = { ...prev };
                delete next[farmer.id];
                return next;
            });
        }
    };

    const openApprovalDialog = (farmer) => {
        setApprovalRole('farmer');
        setApprovalDialogItem(farmer);
    };

    const closeApprovalDialog = () => {
        setApprovalDialogItem(null);
        setApprovalRole('farmer');
    };

    return (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl">
            {/* Header Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="text-sm text-gray-500 font-medium">
                        {t('farmers.farmers.approvalStatus')}
                    </div>
                    <button
                        onClick={openAddModal}
                        className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-5 py-2.5 rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 flex items-center gap-2 shadow-lg shadow-emerald-200 hover:shadow-xl hover:shadow-emerald-300"
                    >
                        <Plus size={20} />
                        <span className="font-medium">{t('farmers.farmers.add')}</span>
                    </button>
                </div>
            </div>

            {/* Stats Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">{t('farmers.stats.totalFarmers')}</p>
                        <p className="text-3xl font-bold text-gray-900">{totalCount || list.length}</p>
                        <p className="text-xs text-gray-400 mt-1">
                            Showing {list.length} of {totalCount || list.length}
                        </p>
                    </div>
                </div>
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-4 py-4 border-b border-gray-100 bg-gray-50 flex flex-wrap items-center gap-2">
                    <button
                        onClick={() => setStatusFilter?.('all')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${statusFilter === 'all'
                            ? 'bg-gray-800 text-white'
                            : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                            }`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setStatusFilter?.('pending_approval')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${statusFilter === 'pending_approval'
                            ? 'bg-amber-600 text-white'
                            : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-50'
                            }`}
                    >
                        {t('farmers.farmers.pendingApproval')}
                    </button>
                    <button
                        onClick={() => setStatusFilter?.('approved')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${statusFilter === 'approved'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
                            }`}
                    >
                        {t('farmers.farmerApprovals.approvedStatus')}
                    </button>
                    <button
                        onClick={() => setStatusFilter?.('rejected')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${statusFilter === 'rejected'
                            ? 'bg-red-600 text-white'
                            : 'bg-white text-red-700 border border-red-200 hover:bg-red-50'
                            }`}
                    >
                        {t('farmers.farmerApprovals.rejectedStatus')}
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1120px] table-auto">
                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider w-20 whitespace-nowrap">
                                    {t('farmers.farmers.image')}
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                                    {t('farmers.farmers.name')}
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider w-40 whitespace-nowrap">
                                    {t('farmers.farmers.phoneNumber')}
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider w-40 whitespace-nowrap">
                                    {t('farmers.farmers.emirateId')}
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider w-32 whitespace-nowrap">
                                    {t('farmers.farmers.createdAt')}
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider w-40 whitespace-nowrap">
                                    {t('farmers.farmers.approvalStatus')}
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider w-[340px] whitespace-nowrap">
                                    {t('farmers.farmers.actions')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {list.map((farmer) => {
                                const approvalStatus = getNormalizedApprovalStatus(farmer);
                                const isPendingApproval = approvalStatus === 'pending_approval';
                                const isBusy = !!actionLoading[farmer.id];

                                return (
                                <tr key={farmer.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shadow-sm">
                                            {farmer.image ? (
                                                <img
                                                    src={farmer.image}
                                                    alt={getFarmerName(farmer)}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                                                    <span className="text-white font-bold text-base">
                                                        {getFarmerName(farmer).charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 align-top">
                                        <div className="font-semibold text-gray-900 text-sm break-words max-w-[260px]">{getFarmerName(farmer)}</div>
                                        <div className="text-xs text-gray-500 break-all max-w-[260px]">{farmer.email}</div>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${farmer.isCoder
                                                ? 'bg-violet-50 text-violet-700 border-violet-200'
                                                : 'bg-gray-100 text-gray-600 border-gray-200'
                                                }`}>
                                                {t('farmers.farmers.coder')}: {farmer.isCoder ? t('common.yes') : t('common.no')}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                            <span className="text-sm text-gray-600">{farmer.phoneNumber}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-xs font-semibold text-blue-700 border border-blue-200 whitespace-nowrap">
                                            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                                            </svg>
                                            {farmer.emirateId}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 text-xs font-medium text-gray-700 whitespace-nowrap">
                                            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            {formatDate(farmer.createdAt)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap border ${getApprovalBadgeClasses(approvalStatus)}`}>
                                            {getApprovalLabel(approvalStatus)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 align-middle">
                                        <div className="flex items-center justify-center gap-2 flex-nowrap whitespace-nowrap">
                                            {isPendingApproval && (
                                                <>
                                                    <button
                                                        onClick={() => openApprovalDialog(farmer)}
                                                        disabled={isBusy}
                                                        className="h-10 w-10 flex items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                                                        title={t('common.components.farmCoding.approve')}
                                                        aria-label={t('common.components.farmCoding.approve')}
                                                    >
                                                        <CheckCircle2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleApprovalDecision(farmer, 'reject')}
                                                        disabled={isBusy}
                                                        className="h-10 w-10 flex items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                                                        title={t('common.components.farmCoding.reject')}
                                                        aria-label={t('common.components.farmCoding.reject')}
                                                    >
                                                        <XCircle size={18} />
                                                    </button>
                                                </>
                                            )}
                                            <button
                                                onClick={() => handleFarms(farmer)}
                                                className="h-10 w-10 flex items-center justify-center bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 shadow-sm hover:shadow-md"
                                                title={t('farmers.farmers.viewFarms')}
                                                aria-label={t('farmers.farmers.viewFarms')}
                                            >
                                                <Eye size={16} />
                                            </button>
                                            <button
                                                onClick={() => openEditModal(farmer)}
                                                className="h-10 w-10 flex items-center justify-center border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-all duration-200"
                                                title={t('farmers.farmers.edit')}
                                                aria-label={t('farmers.farmers.edit')}
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(farmer.id)}
                                                className="h-10 w-10 flex items-center justify-center border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-all duration-200"
                                                title={t('farmers.farmers.delete')}
                                                aria-label={t('farmers.farmers.delete')}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>

                {list.length === 0 && (
                    <div className="text-center py-16">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                        <p className="text-gray-500 font-medium">{t('farmers.farmers.noDataFound')}</p>
                        <p className="text-sm text-gray-400 mt-1">{t('farmers.farmers.emptyCTA')}</p>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full transform transition-all animate-slideUp">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                            <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-xl ${editingItem ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gradient-to-br from-emerald-500 to-emerald-600'} flex items-center justify-center shadow-lg`}>
                                    {editingItem ? (
                                        <Edit2 className="text-white" size={20} />
                                    ) : (
                                        <Plus className="text-white" size={20} />
                                    )}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">
                                        {editingItem ? t('farmers.farmers.edit') : t('farmers.farmers.add')}
                                    </h2>
                                    <p className="text-sm text-gray-500">
                                        {editingItem ? t('farmers.modal.description.edit') : t('farmers.modal.description.add')}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={closeModal}
                                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="px-8 py-6">
                            <div className="space-y-5 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        {t('farmers.farmers.name')}
                                        <span className="text-red-500 ml-1">*</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                            placeholder={t('farmers.farmers.enterName')}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        {t('farmers.farmers.employeeId')}
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                                            </svg>
                                        </div>
                                        <input
                                            type="text"
                                            name="emirateId"
                                            value={formData.emirateId}
                                            onChange={handleInputChange}
                                            className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                            placeholder={t('farmers.farmers.enterEmirateId')}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        {t('farmers.farmers.email')}
                                        <span className="text-red-500 ml-1">*</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                            placeholder={t('farmers.farmers.enterEmail')}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        {t('farmers.farmers.phoneNumber')}
                                        <span className="text-red-500 ml-1">*</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                        </div>
                                        <input
                                            type="text"
                                            name="phoneNumber"
                                            value={formData.phoneNumber}
                                            onChange={handleInputChange}
                                            className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                            placeholder={t('farmers.farmers.enterPhone')}
                                        />
                                    </div>
                                </div>

                                <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-4">
                                    <label className="flex items-start gap-3 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            name="isCoder"
                                            checked={formData.isCoder}
                                            onChange={handleInputChange}
                                            className="mt-1 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                        />
                                        <div>
                                            <div className="text-sm font-semibold text-gray-800">
                                                {t('farmers.farmers.coder')}
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Mark this farmer as a coder so they appear in the coder list and related farm assignment flows.
                                            </p>
                                        </div>
                                    </label>
                                </div>

                                {editingItem && (
                                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                {t('farmers.farmers.accountStatus')}
                                            </label>
                                            <select
                                                name="status"
                                                value={formData.status}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-white"
                                            >
                                                {accountStatusOptions.map((status) => (
                                                    <option key={status} value={status}>
                                                        {getAccountStatusLabel(status)}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                {t('farmers.farmers.approvalStatus')}
                                            </label>
                                            <select
                                                name="approvalStatus"
                                                value={formData.approvalStatus}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-white"
                                            >
                                                {approvalStatusOptions.map((status) => (
                                                    <option key={status} value={status}>
                                                        {getApprovalStatusOptionLabel(status)}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
                                <button
                                    onClick={closeModal}
                                    className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition-all"
                                >
                                    {t('farmers.farmers.cancel')}
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-800 font-semibold transition-all shadow-lg shadow-emerald-200 hover:shadow-xl hover:shadow-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span>{t('common.loading')}</span>
                                        </>
                                    ) : (
                                        <>
                                            {editingItem ? t('farmers.farmers.update') : t('farmers.farmers.add')}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {approvalDialogItem && (
                <div className="fixed inset-0 bg-black/55 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all animate-slideUp overflow-hidden border border-gray-200">
                        <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-white">
                            <h2 className="text-xl font-bold text-gray-900">{t('farmers.farmerApprovals.approveRoleTitle')}</h2>
                            <p className="mt-1 text-sm text-gray-500">{t('farmers.farmerApprovals.approveRoleDescription')}</p>
                        </div>
                        <div className="px-6 py-5 space-y-4">
                            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                                <div className="text-sm font-semibold text-gray-800">{getFarmerName(approvalDialogItem)}</div>
                                <div className="text-xs text-gray-500 mt-1">{approvalDialogItem.email}</div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    {t('farmers.farmerApprovals.approveRoleLabel')}
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setApprovalRole('farmer')}
                                        className={`rounded-xl border px-4 py-3 text-left transition-colors ${approvalRole === 'farmer'
                                            ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                                            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="text-sm font-semibold">{t('farmers.farmerApprovals.approveAsFarmer')}</div>
                                        <div className="text-xs mt-1 text-gray-500">{t('farmers.farmerApprovals.approveAsFarmerDescription')}</div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setApprovalRole('coder')}
                                        className={`rounded-xl border px-4 py-3 text-left transition-colors ${approvalRole === 'coder'
                                            ? 'border-violet-500 bg-violet-50 text-violet-800'
                                            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="text-sm font-semibold">{t('farmers.farmerApprovals.approveAsCoder')}</div>
                                        <div className="text-xs mt-1 text-gray-500">{t('farmers.farmerApprovals.approveAsCoderDescription')}</div>
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={closeApprovalDialog}
                                    className="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 transition-colors"
                                    disabled={!!actionLoading[approvalDialogItem.id]}
                                >
                                    {t('farmers.farmers.cancel')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleApprovalDecision(approvalDialogItem, 'approve')}
                                    disabled={!!actionLoading[approvalDialogItem.id]}
                                    className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {t('common.components.farmCoding.approve')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { 
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to { 
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.2s ease-out;
                }
                .animate-slideUp {
                    animation: slideUp 0.3s ease-out;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #10b981;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #059669;
                }
            `}</style>
        </div>
    );
}
