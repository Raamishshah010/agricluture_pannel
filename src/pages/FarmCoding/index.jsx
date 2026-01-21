import React, { useState } from 'react';
import useStore from '../../store/store';
import Pagination from '../../components/pagination';
import service from '../../services/farmService';
import { toast } from 'react-toastify';
import FarmDetails from './details';
import Modal from 'react-responsive-modal';
import Dropdown from '../../components/dropdownWithSearch';
import useTranslation from '../../hooks/useTranslation';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

import { amiriFontBase64 } from "../../assets/AmiriFont";


const FarmCodingRequest = () => {
  const t = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [activeTab, setActiveTab] = useState('farm-requests');
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedFarmForStatus, setSelectedFarmForStatus] = useState(null);
  const [newStatus, setNewStatus] = useState('active');
  const [suspensionReason, setSuspensionReason] = useState('');
  const [query, setQuery] = useState('');
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const { farms, setFarms, emirates, centers, farmers, locations, language } = useStore((state) => state);
  const [emirate, setEmirate] = useState(null);
  const [center, setCenter] = useState(null);
  const [location, setLocation] = useState(null);
  
  const isArabic = language === 'ar';

  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedStatus]);

  const getStatusBadge = (status) => {
    const baseClasses = "px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide transition-all";
    switch (status) {
      case 'active':
        return `${baseClasses} bg-emerald-50 text-emerald-700 border border-emerald-200`;
      case 'pending':
        return `${baseClasses} bg-blue-50 text-blue-700 border border-blue-200`;
      case 'draft':
        return `${baseClasses} bg-slate-50 text-slate-700 border border-slate-200`;
      case 'suspended':
        return `${baseClasses} bg-red-50 text-red-700 border border-red-200`;
      default:
        return `${baseClasses} bg-gray-50 text-gray-700 border border-gray-200`;
    }
  };

  const getStatus = (status, isAssigned) => {
    if (!isAssigned) return 'draft';
    return status;
  };

  const itemsPerPage = 30;

  const filterByStatus = (farm, selectedStatus) => {
    if (selectedStatus === "All") return true;

    const { isAssigned, status } = farm;

    switch (selectedStatus) {
      case "Active":
        return isAssigned && status === "active";
      case "Pending":
        return isAssigned && status === "pending";
      case "Assigned":
        return isAssigned && status === "assigned";
      case "Drafts":
        return !isAssigned;
      case "Rejected":
        return isAssigned && status === "suspended";
      default:
        return true;
    }
  };

  const filteredFarms = farms
    .filter(farm => filterByStatus(farm, selectedStatus))
    .filter(farm => {
      const lowerQuery = query.trim().toLowerCase();
      const farmName = farm.farmName?.toLowerCase() || "";
      const agriId = farm.agricultureId?.toString().toLowerCase() || "";

      const matchesSearch =
        !lowerQuery ||
        farmName.includes(lowerQuery) ||
        agriId.includes(lowerQuery);

      const matchesFilters =
        (!emirate || farm.emirate === emirate.id) &&
        (!center || farm.serviceCenter === center.id) &&
        (!location || farm.location === location.id);

      return matchesSearch && matchesFilters;
    });

  const totalPages = Math.ceil(filteredFarms.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRequests = filteredFarms.slice(startIndex, endIndex);

  const getStatusCounts = () => {
    const counts = {
      All: farms.length,
      Active: farms.filter(r => (r.isAssigned && r.status === 'active')).length,
      Pending: farms.filter(r => (r.isAssigned && r.status === 'pending')).length,
      Assigned: farms.filter(r => (r.isAssigned && r.status === 'assigned')).length,
      Drafts: farms.filter(r => !(r.isAssigned)).length,
      Rejected: farms.filter(r => (r.isAssigned && r.status === 'suspended')).length
    };
    return counts;
  };

  const statusCounts = getStatusCounts();

  const getCoderName = (farmId) => {
    const coder = farmers.find(f => f.farms?.includes(farmId));
    return coder ? coder.name : t('common.components.farmCoding.nA');
  };

  const handleDetail = async (item) => {
    service.getfarmById(item.id).then(res => {
      setSelectedFarm(res.data);
      setActiveTab('farm-details');
    }).catch(err => {
      toast.error(err.response?.data?.message || err.message);
    });
  };

  const openStatusModal = (farm) => {
    setSelectedFarmForStatus(farm);
    setNewStatus(farm.status || 'active');
    setSuspensionReason('');
    setIsStatusModalOpen(true);
  };

  const closeStatusModal = () => {
    setIsStatusModalOpen(false);
    setSelectedFarmForStatus(null);
    setSuspensionReason('');
  };

  const handleStatusChange = async () => {
    if (!selectedFarmForStatus) return;

    try {
      if (newStatus === 'suspended' && !suspensionReason) {
        toast.error(t('common.components.farmCoding.provideSuspensionReasonError'));
        return;
      }

      if (newStatus === selectedFarmForStatus.status) {
        toast.info(t('common.components.farmCoding.statusUnchanged'));
        return;
      }

      let updateData = {};
      if (newStatus === 'suspended') {
        updateData = {
          status: newStatus,
          ...(newStatus === 'suspended' && { rejectionReason: suspensionReason })
        };
      } else {
        updateData = {
          status: newStatus,
          ...(selectedFarmForStatus.updatingData && { ...selectedFarmForStatus.updatingData, updatingData: null })
        };
      }

      const res = await service.updateFarm(updateData, selectedFarmForStatus.id);
      const farmIndex = farms.findIndex(f => f.id === selectedFarmForStatus.id);
      farms[farmIndex] = res.data;
      setFarms([...farms]);
      toast.success(t('common.components.farmCoding.statusUpdatedSuccessfully'));
      closeStatusModal();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    }
  };

  // Download Functions
  const getDataBasedOnTab = () => {
    return filteredFarms;
  };

  const prepareDataForExport = () => {
    const dataToExport = getDataBasedOnTab();
    return dataToExport.map(farm => ({
      [t('common.components.farmCoding.farmName')]: farm.farmName || '',
      [t('common.components.farmCoding.agricultureId')]: farm.agricultureId || '',
      [t('common.components.farmCoding.farmSerial')]: farm.farmSerial || '',
      [t('common.components.farmCoding.coder')]: getCoderName(farm.id),
      [t('common.components.farmCoding.statusHeader')]: getStatus(farm.status, farm.isAssigned)
    }));
  };

  const downloadCSV = () => {
    const data = prepareDataForExport();
    
    if (data.length === 0) {
      toast.error('No data to export');
      setShowDownloadMenu(false);
      return;
    }
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header]}"`).join(','))
    ].join('\n');

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `farms_${selectedStatus}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('CSV downloaded successfully');
    setShowDownloadMenu(false);
  };

  const downloadExcel = () => {
    const data = prepareDataForExport();
    
    if (data.length === 0) {
      toast.error('No data to export');
      setShowDownloadMenu(false);
      return;
    }
    
    const ws = XLSX.utils.json_to_sheet(data);
    const colWidths = Object.keys(data[0]).map(() => ({ wch: 20 }));
    ws['!cols'] = colWidths;
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Farms');
    XLSX.writeFile(wb, `farms_${selectedStatus}_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Excel downloaded successfully');
    setShowDownloadMenu(false);
  };


  //! DOWNLOAD PDF

const downloadPDF = async () => {
    const data = prepareDataForExport();
    if (data.length === 0) return;

    // 1. Headers Mapping
    const headerTranslations = {
        "status": "الحالة",
        "name": "الاسم",
        "farmId": "معرف المزرعة",
        "location": "الموقع",
        // Baaki headers yahan add karein
    };

    try {
        const doc = new jsPDF({ orientation: 'landscape' });

        // Font Setup
        doc.addFileToVFS("Amiri-Regular.ttf", amiriFontBase64);
        doc.addFont("Amiri-Regular.ttf", "Amiri", "normal");
        doc.setFont("Amiri");

        // 2. Prepare Headers (Translation only, No Text Reversal)
        const rawKeys = Object.keys(data[0]);
        let tableHeaders = rawKeys.map(key => isArabic ? (headerTranslations[key] || key) : key);

        // 3. Prepare Rows (Raw data, No Text Reversal)
        let tableRows = data.map(row => rawKeys.map(key => row[key] || ''));

        // 4. ORIENTATION REVERSE (Sirf Array ki order badalna)
        if (isArabic) {
            tableHeaders = [...tableHeaders].reverse(); // Header columns right-to-left
            tableRows = tableRows.map(row => [...row].reverse()); // Row cells right-to-left
        }

        // --- TITLE ---
        doc.setFontSize(18);
        const title = isArabic ? "بيانات ترميز المزرعة" : "Farm Coding Data";
        doc.text(title, isArabic ? 280 : 14, 15, { align: isArabic ? 'right' : 'left' });

        // --- TABLE ---
      autoTable(doc, {
    head: [tableHeaders],
    body: tableRows,
    startY: 30,
    styles: {
        font: 'Amiri', // Body cells ke liye
        fontSize: 10,
        halign: isArabic ? 'right' : 'left'
    },
    headStyles: {
        font: 'Amiri',       // YEH ZARURI HAI: Header ke liye font set karein
        fontStyle: 'normal', // Bold ki wajah se aksar boxes aate hain, isse normal rakhein
        fillColor: [34, 197, 94],
        textColor: [255, 255, 255],
        halign: isArabic ? 'right' : 'left',
        fontSize: 11         // Header size thora bara kar sakte hain
    },
    // Agar columns abhi bhi agay peechay hain to layout direction yahan se fix karein
    columnStyles: {
        all: { halign: isArabic ? 'right' : 'left' }
    }
});

        doc.save(`farms_report.pdf`);
        setShowDownloadMenu(false);
    } catch (error) {
        console.error('PDF Error:', error);
    }
};

  return activeTab.includes("farm-requests") ? (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header Section with Gradient */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                {t('common.components.farmCoding.title')}
              </h1>
              <p className="text-sm text-gray-500">
                {t('translation.farmCodingSub')}
              </p>
            </div>
            
            {/* Download Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-5 py-2.5 rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 flex items-center gap-2 shadow-lg shadow-emerald-200 hover:shadow-xl hover:shadow-emerald-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span className="font-medium">Download</span>
                <svg className={`w-4 h-4 transition-transform duration-200 ${showDownloadMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showDownloadMenu && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-2xl z-50 border border-gray-100 overflow-hidden">
                  <button
                    onClick={downloadCSV}
                    className="w-full text-left px-4 py-3 hover:bg-emerald-50 flex items-center gap-3 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                      <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">CSV Format</div>
                      <div className="text-xs text-gray-500">Comma-separated</div>
                    </div>
                  </button>
                  <button
                    onClick={downloadExcel}
                    className="w-full text-left px-4 py-3 hover:bg-emerald-50 flex items-center gap-3 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                      <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Excel Format</div>
                      <div className="text-xs text-gray-500">Spreadsheet file</div>
                    </div>
                  </button>
                  <button
                    onClick={downloadPDF}
                    className="w-full text-left px-4 py-3 hover:bg-emerald-50 flex items-center gap-3 transition-colors group rounded-b-xl"
                  >
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                      <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">PDF Format</div>
                      <div className="text-xs text-gray-500">Printable document</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="px-6 pb-0">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {Object.entries(statusCounts).map(([status, count]) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-6 py-3 flex items-center gap-3 text-sm font-semibold border-b-3 transition-all duration-200 whitespace-nowrap ${
                  selectedStatus === status
                    ? 'border-emerald-500 text-emerald-600 bg-emerald-50/50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span>{status}</span>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                    selectedStatus === status
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        {/* Filters Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col gap-4">
            {/* Search Bar */}
            <div className="relative">
              <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder={t('common.components.farmCoding.searchByFarmName')}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Dropdown Filters */}
            <div className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-[200px]">
                <Dropdown
                  options={emirates}
                  value={emirate}
                  onChange={setEmirate}
                  placeholder={t('common.components.farmCoding.selectEmirate')}
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <Dropdown
                  options={centers}
                  value={center}
                  onChange={setCenter}
                  placeholder={t('common.components.farmCoding.selectCenter')}
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <Dropdown
                  options={locations}
                  value={location}
                  onChange={setLocation}
                  placeholder={t('common.components.farmCoding.selectLocation')}
                />
              </div>
              <button
                className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
                onClick={() => {
                  setEmirate(null);
                  setCenter(null);
                  setLocation(null);
                  setQuery('');
                  setSelectedStatus('All');
                }}
              >
                <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                {t('common.components.farmCoding.clear')}
              </button>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <tr>
                  <th className="text-left py-4 px-6 text-xs font-bold text-gray-600 uppercase tracking-wider">
                    {t('common.components.farmCoding.farmName')}
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-bold text-gray-600 uppercase tracking-wider">
                    {t('common.components.farmCoding.agricultureId')}
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-bold text-gray-600 uppercase tracking-wider">
                    {t('common.components.farmCoding.farmSerial')}
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-bold text-gray-600 uppercase tracking-wider">
                    {t('common.components.farmCoding.coder')}
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-bold text-gray-600 uppercase tracking-wider">
                    {t('common.components.farmCoding.statusHeader')}
                  </th>
                  <th className="text-center py-4 px-6 text-xs font-bold text-gray-600 uppercase tracking-wider">
                    {t('common.components.farmCoding.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-medium text-gray-900">{request.farmName}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm text-gray-600">{request.agricultureId}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm text-gray-600">{request.farmSerial}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm text-gray-600">{getCoderName(request.id)}</div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={getStatusBadge(request.status)}>
                        {getStatus(request.status, request.isAssigned)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleDetail(request)}
                          className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 font-medium text-sm shadow-sm hover:shadow-md"
                        >
                          {t('common.components.farmCoding.viewDetails')}
                        </button>
                        <button
                          onClick={() => openStatusModal(request)}
                          className="px-4 py-2 bg-white border-2 border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 transition-all duration-200 font-medium text-sm"
                        >
                          {t('common.components.farmCoding.changeStatus')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="mt-6">
          <Pagination 
            initialPage={currentPage} 
            totalPages={totalPages} 
            onPageChange={(page) => setCurrentPage(page)} 
          />
        </div>
      </div>

      {/* Status Change Modal */}
      <Modal
        open={isStatusModalOpen}
        onClose={closeStatusModal}
        center
        closeOnEsc={false}
        closeOnOverlayClick={false}
        classNames={{
          modal: 'rounded-2xl shadow-2xl max-w-md',
          overlay: 'bg-black/50 backdrop-blur-sm',
        }}
      >
        <div className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              {t('common.components.farmCoding.changeFarmStatus')}
            </h3>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              {t('common.components.farmCoding.selectStatus')}
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            >
              <option value="">{t('common.components.farmCoding.selectStatus')}</option>
              <option value="active">{t('common.components.farmCoding.approve')}</option>
              <option value="pending">{t('common.components.farmCoding.pending')}</option>
              <option value="assigned">{t('common.components.farmCoding.assigned')}</option>
              <option value="suspended">{t('common.components.farmCoding.suspended')}</option>
            </select>
          </div>

          {newStatus === 'suspended' && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                {t('common.components.farmCoding.suspensionReason')}
              </label>
              <textarea
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
                placeholder={t('common.components.farmCoding.provideSuspensionReason')}
                className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 h-32 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none"
                required
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              onClick={closeStatusModal}
              className="flex-1 px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition-all"
            >
              {t('common.components.farmCoding.cancel')}
            </button>
            <button
              onClick={handleStatusChange}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-800 font-semibold transition-all shadow-lg shadow-emerald-200 hover:shadow-xl hover:shadow-emerald-300"
            >
              {t('common.components.farmCoding.updateStatus')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  ) : (
    <FarmDetails
      farm={selectedFarm}
      handleBack={() => {
        setActiveTab('farm-requests');
        setSelectedFarm(null);
      }}
    />
  );
};

export default FarmCodingRequest;