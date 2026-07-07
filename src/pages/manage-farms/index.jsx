import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import service from '../../services/farmService';
import { toast } from 'react-toastify';
import Farms from './farms';
import FarmDetails from './farmDetails';
import { FarmUpdateForm } from './form';
import Pagination from '../../components/pagination';
import { NewFarmForm } from './newForm';
import useStore from '../../store/store';
import Dropdown from '../../components/dropdownWithSearch';
import useTranslation from '../../hooks/useTranslation';
import { Download, ChevronDown, Upload } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { amiriFontBase64 } from '../../assets/AmiriFont';
import { buildFarmsCsvContent, buildFarmsExportRows, getDisplayFarmStatus, shouldResetManageFarmsSession, sortAndFilterManageFarms } from '../../utils';

export default function Index(props) {
    const t = useTranslation();
    const { language } = useStore((state) => state);
    const [query, setQuery] = useState('');
    const [activeTab, setActiveTab] = useState(() => sessionStorage.getItem('activeTab') || 'farms');
    const [selectedFarm, setSelectedFarm] = useState(() => {
        const storedFarm = sessionStorage.getItem('selectedFarm');
        return storedFarm ? JSON.parse(storedFarm) : null;
    });
    const [page, setPage] = useState(1);
    const [randomNumber, setRandomNumber] = useState(() => sessionStorage.getItem('randomNumber') || props.number || 1);
    const { farms, setFarms, emirates, centers, locations } = useStore((state) => state);
    const [emirate, setEmirate] = useState(null);
    const [center, setCenter] = useState(null);
    const [location, setLocation] = useState(null);
    const [minSize, setMinSize] = useState('');
    const [maxSize, setMaxSize] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [isDownloadOpen, setIsDownloadOpen] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const importInputRef = useRef(null);
    const statusOptions = useMemo(() => [
        { value: '', label: t('status.all') },
        { value: 'active', label: t('status.active') },
        { value: 'pending', label: t('status.pending') },
        { value: 'draft', label: t('status.drafts') },
        { value: 'suspended', label: t('status.suspended') },
        { value: 'rejected', label: t('status.rejected') },
    ], [t]);

    useEffect(() => {
        sessionStorage.setItem('activeTab', activeTab);
        const handleScroll = () => {
            window.scrollTo(0, 0);
            const scrollContainers = document.querySelectorAll(
                ".overflow-y-auto, .overflow-auto, [style*='overflow-y: auto'], [style*='overflow: auto'], [style*='overflow-y: scroll'], [style*='overflow: scroll']"
            );
            scrollContainers.forEach((container) => {
                container.scrollTop = 0;
                container.scrollLeft = 0;
            });
        };
        handleScroll();
        const timer = setTimeout(handleScroll, 50);
        return () => clearTimeout(timer);
    }, [activeTab]);

    useEffect(() => {
        if (selectedFarm) {
            sessionStorage.setItem('selectedFarm', JSON.stringify(selectedFarm));
        } else {
            sessionStorage.removeItem('selectedFarm');
        }
    }, [selectedFarm]);

    useEffect(() => {
        sessionStorage.setItem('randomNumber', randomNumber);
    }, [randomNumber]);

    useEffect(() => {
        if (shouldResetManageFarmsSession(props.number, randomNumber)) {
            setRandomNumber(props.number);
            setActiveTab('farms');
            sessionStorage.removeItem('selectedFarm');
            sessionStorage.removeItem('activeTab');
            sessionStorage.removeItem('randomNumber');
            setSelectedFarm(null);
            setPage(1);
        }
    }, [props.number, randomNumber]);

    const loadMore = async (currentPage) => {
        setPage(currentPage);
    };

    const handleDetail = async (item) => {
        try {
            const res = await service.getfarmById(item.id);
            setSelectedFarm(res.data);
            setActiveTab('farm-details');
        } catch (err) {
            toast.error(err.response?.data?.message || err.message);
        }
    };

    const handleEdit = async (item) => {
        try {
            const res = await service.getFarmByIdWithoutPopulatingFields(item.id);
            setSelectedFarm(res.data);
            setActiveTab('farm-edit');
        } catch (err) {
            toast.error(err.response?.data?.message || err.message);
        }
    };

    const submitFarmHandler = useCallback(async (item, id) => {
        try {
            const res = await service.updateFarm(item, id);
            const farmIndex = farms.findIndex(f => f.id === id);
            farms[farmIndex] = res.data;
            setFarms(farms);
            setActiveTab('farms');
            setSelectedFarm(null);
            sessionStorage.removeItem('selectedFarm');
            sessionStorage.removeItem('activeTab');
            toast.success(t('manageFarms.updatedSuccessfully'));
        } catch (err) {
            toast.error(err.response?.data?.message || err.message);
        }
    }, [farms, setFarms, t]);

    const submitNewFarmHandler = useCallback(async (item) => {
        try {
            const res = await service.addFarm(item);
            setFarms([...farms, res.data]);
            setSelectedFarm(null);
            sessionStorage.removeItem('activeTab');
            setActiveTab('farms');
            toast.success(t('manageFarms.addSuccessfully'));
        } catch (err) {
            toast.error(err.response?.data?.message || err.message);
        }
    }, [farms, setFarms, t]);

    const handleImportCsv = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const fd = new FormData();
        fd.append('file', file);

        try {
            setIsImporting(true);
            const res = await service.importCsv(fd);
            const imported = res?.data?.imported || 0;
            const failed = res?.data?.failed || 0;
            const latest = await service.getAllfarms();
            setFarms(Array.isArray(latest?.data) ? latest.data : latest);
            toast.success(`Imported ${imported} farms${failed ? `, ${failed} failed` : ''}`);
        } catch (err) {
            toast.error(err.response?.data?.message || err.message);
        } finally {
            setIsImporting(false);
            if (event.target) event.target.value = '';
        }
    };

    const filteredFarms = useMemo(() => {
        const lowerQuery = query.trim().toLowerCase();

        const filtered = farms.filter(farm => {
            const matchesSearch =
                !lowerQuery ||
                (farm.farmNo && farm.farmNo.toString().toLowerCase().includes(lowerQuery)) ||
                (farm.farmSerial && farm.farmSerial.toString().toLowerCase().includes(lowerQuery)) ||
                (farm.id && farm.id.toString().toLowerCase().includes(lowerQuery));

            const matchesFilters =
                (emirate ? farm.emirate === emirate.id : true) &&
                (center ? farm.serviceCenter === center.id : true) &&
                (location ? farm.location === location.id : true);

            // Size range filter
            const farmSize = farm.size || 0;
            const min = minSize !== '' ? parseFloat(minSize) : -Infinity;
            const max = maxSize !== '' ? parseFloat(maxSize) : Infinity;
            const matchesSizeRange = farmSize >= min && farmSize <= max;

            return matchesSearch && matchesFilters && matchesSizeRange;
        });

        return sortAndFilterManageFarms(filtered, { status: statusFilter });
    }, [center, emirate, farms, location, query, minSize, maxSize, statusFilter]);

    useEffect(() => {
        setPage(1);
    }, [center, emirate, location, query, minSize, maxSize, statusFilter]);

    const itemsPerPage = 50;
    const totalPages = Math.ceil(filteredFarms.length / 50);
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentRequests = filteredFarms.slice(startIndex, endIndex);

    // Helper function to get emirate name with Arabic support
    const getEmirateName = (emirateId) => {
        const emirateObj = emirates.find(e => e.id === emirateId);
        if (!emirateObj) return '';
        return language === 'ar' && emirateObj.nameInArrabic  ? emirateObj.nameInArrabic  : emirateObj.name;
    };

    // Helper function to get center name with Arabic support
    const getCenterName = (centerId) => {
        const centerObj = centers.find(c => c.id === centerId);
        if (!centerObj) return '';
        return language === 'ar' && centerObj.nameInArrabic  ? centerObj.nameInArrabic  : centerObj.name;
    };

    // Helper function to get location name with Arabic support
    const getLocationName = (locationId) => {
        const locationObj = locations.find(l => l.id === locationId);
        if (!locationObj) return '';
        return language === 'ar' && locationObj.nameInArrabic  ? locationObj.nameInArrabic  : locationObj.name;
    };

    // Download as PDF
    const downloadPDF = () => {
        const doc = new jsPDF('landscape');
        
        // Font Setup
        doc.addFileToVFS('Amiri-Regular.ttf', amiriFontBase64);
        doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
        doc.setFont('Amiri');

        // Static Headers (English + Arabic)
        const tableHeaders = [
            'Farm Number\nرقم المزرعة',
            'Serial\nالتسلسل',
            'Emirate\nالإمارة',
            'Center\nالمركز',
            'Location\nالموقع',
            'Area\nالمساحة',
            'Status\nالحالة'
        ];

        const tableData = filteredFarms.map(farm => [
            farm.farmNo?.toString() || '',
            farm.farmSerial?.toString() || '',
            getEmirateName(farm.emirate) || '',
            getCenterName(farm.serviceCenter) || '',
            getLocationName(farm.location) || '',
            farm.size ? Math.round(farm.size).toString() : '',
            getDisplayFarmStatus(farm)
        ]);

        // Title
        doc.setFontSize(18);
        const title = t('farms.title');
        doc.text(title, 148, 15, { align: 'center' });

        // Table
        autoTable(doc, {
            head: [tableHeaders],
            body: tableData,
            startY: 25,
            tableWidth: 'auto',
            margin: { left: 10, right: 10 },
            styles: {
                font: 'Amiri',
                fontSize: 8,
                halign: 'center',
                cellPadding: 3,
                lineWidth: 0.1,
                lineColor: [200, 200, 200]
            },
            headStyles: {
                font: 'Amiri',
                fontStyle: 'normal',
                fillColor: [34, 197, 94],
                halign: 'center',
                fontSize: 7,
                cellPadding: 4
            },
            columnStyles: {
                0: { halign: 'center', cellWidth: 30 },
                1: { halign: 'center', cellWidth: 28 },
                2: { halign: 'center', cellWidth: 25 },
                3: { halign: 'center', cellWidth: 18 },
                4: { halign: 'center', cellWidth: 28 },
                5: { halign: 'center', cellWidth: 30 },
                6: { halign: 'center', cellWidth: 28 },
                7: { halign: 'center', cellWidth: 18 },
                8: { halign: 'center', cellWidth: 25 }
            },
            didParseCell: function(data) {
                // Ensure empty cells show properly
                if (data.cell.raw === '') {
                    data.cell.text = [''];
                }
            }
        });

        doc.save('farms-list.pdf');
        setIsDownloadOpen(false);
        toast.success(t('manageFarms.downloadSuccess') || 'Downloaded successfully!');
    };

    // Download as Excel
    const downloadExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(
            buildFarmsExportRows(filteredFarms)
        );

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Farms");
        XLSX.writeFile(workbook, "farms-list.xlsx");
        setIsDownloadOpen(false);
        toast.success(t('manageFarms.downloadSuccess') || 'Downloaded successfully!');
    };

    // Download as CSV
    const downloadCSV = () => {
        const csvContent = buildFarmsCsvContent(filteredFarms);
        const blob = new Blob(['\uFEFF' + csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "farms-list.csv";
        link.click();
        setIsDownloadOpen(false);
        toast.success(t('manageFarms.downloadSuccess') || 'Downloaded successfully!');
    };

    return activeTab.includes('farms') ? (
        <div className="max-w-[1400px] mx-auto p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 sm:mb-8">
                <h1 className="text-xl sm:text-3xl font-bold text-gray-900">{t('manageFarms.title')}</h1>
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <input
                        ref={importInputRef}
                        type="file"
                        accept=".csv,text/csv"
                        className="hidden"
                        onChange={handleImportCsv}
                    />
                    <div className="hidden sm:flex items-center gap-2">
                        <a
                            href="/samples/farms-import-sample.csv"
                            download
                            className="px-3 sm:px-4 py-2 sm:py-2.5 border border-emerald-200 text-emerald-700 rounded-lg sm:rounded-xl hover:bg-emerald-50 transition-colors font-medium text-xs sm:text-sm"
                        >
                            {t('manageFarms.sampleCsv')}
                        </a>
                        <button
                            onClick={() => importInputRef.current?.click()}
                            disabled={isImporting}
                            className="px-3 sm:px-5 py-2 sm:py-2.5 bg-white border border-emerald-300 text-emerald-700 rounded-lg sm:rounded-xl hover:bg-emerald-50 transition-colors flex items-center gap-1 sm:gap-2 font-medium text-xs sm:text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            <Upload size={16} />
                            <span>{isImporting ? t('manageFarms.importing') : t('manageFarms.importCsv')}</span>
                        </button>
                    </div>
                    {/* Download Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setIsDownloadOpen(!isDownloadOpen)}
                            className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 flex items-center gap-1 sm:gap-2 shadow-lg shadow-emerald-200 text-xs sm:text-sm"
                        >
                            <Download size={16} />
                            <span className="font-medium hidden sm:inline">{t('manageFarms.download')}</span>
                            <ChevronDown
                                size={14}
                                className={`transition-transform duration-200 ${isDownloadOpen ? "rotate-180" : ""}`}
                            />
                        </button>

                        {isDownloadOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setIsDownloadOpen(false)}
                                />
                                <div className="absolute right-0 mt-2 w-48 sm:w-52 bg-white rounded-xl shadow-2xl z-50 border border-gray-100 overflow-hidden">
                                    <button
                                        onClick={downloadPDF}
                                        className="w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-emerald-50 flex items-center gap-2 sm:gap-3 transition-colors group text-xs sm:text-sm"
                                    >
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-medium text-gray-900 truncate">{t('manageFarms.downloadOptions.pdf')}</div>
                                            <div className="text-[10px] sm:text-xs text-gray-500 truncate">{t('manageFarms.downloadOptions.pdfHint')}</div>
                                        </div>
                                    </button>
                                    <button
                                        onClick={downloadExcel}
                                        className="w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-emerald-50 flex items-center gap-2 sm:gap-3 transition-colors group text-xs sm:text-sm"
                                    >
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-medium text-gray-900 truncate">{t('manageFarms.downloadOptions.excel')}</div>
                                            <div className="text-[10px] sm:text-xs text-gray-500 truncate">{t('manageFarms.downloadOptions.excelHint')}</div>
                                        </div>
                                    </button>
                                    <button
                                        onClick={downloadCSV}
                                        className="w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-emerald-50 flex items-center gap-2 sm:gap-3 transition-colors group rounded-b-xl text-xs sm:text-sm"
                                    >
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-medium text-gray-900 truncate">{t('manageFarms.downloadOptions.csv')}</div>
                                            <div className="text-[10px] sm:text-xs text-gray-500 truncate">{t('manageFarms.downloadOptions.csvHint')}</div>
                                        </div>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Add Farm Button */}
                    <button
                        onClick={() => setActiveTab("farm-new")}
                        className="px-3 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg sm:rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg shadow-blue-200 font-medium text-xs sm:text-sm"
                    >
                        {t('manageFarms.addFarm')}
                    </button>
                </div>
            </div>

            <div className='flex flex-col gap-3 mb-4'>
                <input
                    type="text"
                    placeholder="Search by farm number, serial, or ID"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="border border-gray-300 rounded-lg p-2 sm:p-2.5 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />

                <div className="flex flex-wrap items-center gap-2">
                    <input
                        type="number"
                        placeholder={t('manageFarms.minSize')}
                        value={minSize}
                        onChange={(e) => setMinSize(e.target.value)}
                        className="border border-gray-300 rounded-lg p-2 w-20 sm:w-24 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <input
                        type="number"
                        placeholder={t('manageFarms.maxSize')}
                        value={maxSize}
                        onChange={(e) => setMaxSize(e.target.value)}
                        className="border border-gray-300 rounded-lg p-2 w-20 sm:w-24 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="border border-gray-300 rounded-lg p-2 w-28 sm:w-36 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                        {statusOptions.map((option) => (
                            <option key={option.value || 'all'} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>

                    <div className="flex items-center gap-2">
                        <Dropdown
                            options={emirates}
                            value={emirate}
                            onChange={setEmirate}
                            placeholder={t('manageFarms.selectEmirate')}
                            language={language}
                        />
                        <Dropdown
                            options={centers}
                            value={center}
                            onChange={setCenter}
                            placeholder={t('manageFarms.selectCenter')}
                            language={language}
                        />
                        <Dropdown
                            options={locations}
                            value={location}
                            onChange={setLocation}
                            placeholder={t('manageFarms.selectLocation')}
                            language={language}
                        />
                        <button
                            className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm whitespace-nowrap"
                            onClick={() => {
                                setEmirate(null);
                                setCenter(null);
                                setLocation(null);
                                setQuery('');
                                setMinSize('');
                                setMaxSize('');
                                setStatusFilter('');
                            }}
                        >
                            {t('manageFarms.clear')}
                        </button>
                    </div>
                </div>
            </div>

            <Farms
                list={currentRequests}
                handleDetail={handleDetail}
                handleEdit={handleEdit}
                setList={(id) => setFarms((pre) => pre.filter(it => it.id !== id))}
            />
            <Pagination initialPage={page} totalPages={totalPages} onPageChange={loadMore} />
        </div>
    ) : activeTab.includes('farm-details') ? (
        <FarmDetails
            farm={selectedFarm}
            handleEdit={handleEdit}
            handleBack={() => {
                setActiveTab('farms');
                setSelectedFarm(null);
            }} />
    ) : activeTab.includes('farm-edit') ? (
        <FarmUpdateForm farm={selectedFarm} onSave={submitFarmHandler} onCancel={() => {
            setActiveTab('farms');
            setSelectedFarm(null);
        }} />
    ) : (
        <NewFarmForm
            onSave={submitNewFarmHandler}
            onCancel={() => {
                setActiveTab('farms');
                setSelectedFarm(null);
            }} />
    );
}
