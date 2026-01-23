import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { Download, ChevronDown } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { amiriFontBase64 } from '../../assets/AmiriFont';

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
    const [randomNumber, setRandomNumber] = useState(() => sessionStorage.getItem('randomNumber') || 1);
    const { farms, setFarms, emirates, centers, locations } = useStore((state) => state);
    const [emirate, setEmirate] = useState(null);
    const [center, setCenter] = useState(null);
    const [location, setLocation] = useState(null);
    const [minSize, setMinSize] = useState('');
    const [maxSize, setMaxSize] = useState('');
    const [isDownloadOpen, setIsDownloadOpen] = useState(false);

    useEffect(() => {
        sessionStorage.setItem('activeTab', activeTab);
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
        if (props.number !== randomNumber) {
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
        service.getfarmById(item.id).then(res => {
            setSelectedFarm(res.data);
            setActiveTab('farm-details');
        }).catch(err => {
            toast.error(err.response?.data?.message || err.message);
        });
    };

    const handleEdit = async (item) => {
        service.getFarmByIdWithoutPopulatingFields(item.id).then(res => {
            setSelectedFarm(res.data);
            setActiveTab('farm-edit');
        }).catch(err => {
            toast.error(err.response?.data?.message || err.message);
        });
    };

    const submitFarmHandler = useCallback(async (item, id) => {
        service.updateFarm(item, id).then((res) => {
            const farmIndex = farms.findIndex(f => f.id === id);
            farms[farmIndex] = res.data;
            setFarms(farms);
            setActiveTab('farms');
            setSelectedFarm(null);
            sessionStorage.removeItem('selectedFarm');
            sessionStorage.removeItem('activeTab');
            toast.success(t('manageFarms.updatedSuccessfully'));
        }).catch(err => {
            toast.error(err.response?.data?.message || err.message);
        });
    }, [farms, setFarms, t]);

    const submitNewFarmHandler = useCallback(async (item) => {
        service.addFarm(item).then((res) => {
            setFarms([...farms, res.data]);
            setSelectedFarm(null);
            sessionStorage.removeItem('activeTab');
            setActiveTab('farms');
            toast.success(t('manageFarms.addSuccessfully'));
        }).catch(err => {
            toast.error(err.response?.data?.message || err.message);
        });
    }, [farms, setFarms, t]);

    const filteredFarms = useMemo(() => {
        const lowerQuery = query.trim().toLowerCase();

        return farms.filter(farm => {
            const matchesSearch =
                !lowerQuery ||
                farm.farmName.toLowerCase().includes(lowerQuery) ||
                (farm.agricultureId &&
                    farm.agricultureId.toString().toLowerCase().includes(lowerQuery));

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
    }, [center, emirate, farms, location, query, minSize, maxSize]);

    const itemsPerPage = 50;
    const totalPages = Math.ceil(filteredFarms.length / 50);
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentRequests = filteredFarms.slice(startIndex, endIndex);

    // Helper function to get emirate name
    const getEmirateName = (emirateId) => {
        const emirateObj = emirates.find(e => e.id === emirateId);
        return emirateObj?.name || '';
    };

    // Helper function to get center name
    const getCenterName = (centerId) => {
        const centerObj = centers.find(c => c.id === centerId);
        return centerObj?.name || '';
    };

    // Helper function to get location name
    const getLocationName = (locationId) => {
        const locationObj = locations.find(l => l.id === locationId);
        return locationObj?.name || '';
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
            'Name\nالاسم',
            'Agriculture ID\nمعرف الزراعة',
            'Farm Number\nرقم المزرعة',
            'Serial\nالتسلسل',
            'Emirate\nالإمارة',
            'Center\nالمركز',
            'Location\nالموقع',
            'Size\nالحجم',
            'Status\nالحالة'
        ];

        const tableData = filteredFarms.map(farm => [
            farm.farmName || '',
            farm.agricultureId || '',
            farm.farmNo?.toString() || '',
            farm.farmSerial?.toString() || '',
            getEmirateName(farm.emirate) || '',
            getCenterName(farm.serviceCenter) || '',
            getLocationName(farm.location) || '',
            farm.size ? Math.round(farm.size).toString() : '',
            farm.status || ''
        ]);

        // Title
        doc.setFontSize(18);
        const title = "Farms List | قائمة المزارع";
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
            filteredFarms.map((farm) => ({
                'Name | الاسم': farm.farmName || '',
                'Agriculture ID | معرف الزراعة': farm.agricultureId || '',
                'Farm Number | رقم المزرعة': farm.farmNo?.toString() || '',
                'Serial | التسلسل': farm.farmSerial?.toString() || '',
                'Emirate | الإمارة': getEmirateName(farm.emirate) || '',
                'Center | المركز': getCenterName(farm.serviceCenter) || '',
                'Location | الموقع': getLocationName(farm.location) || '',
                'Size | الحجم': farm.size ? Math.round(farm.size).toString() : '',
                'Status | الحالة': farm.status || ''
            }))
        );

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Farms");
        XLSX.writeFile(workbook, "farms-list.xlsx");
        setIsDownloadOpen(false);
        toast.success(t('manageFarms.downloadSuccess') || 'Downloaded successfully!');
    };

    // Download as CSV
    const downloadCSV = () => {
        const headers = [
            'Name | الاسم',
            'Agriculture ID | معرف الزراعة',
            'Farm Number | رقم المزرعة',
            'Serial | التسلسل',
            'Emirate | الإمارة',
            'Center | المركز',
            'Location | الموقع',
            'Size | الحجم',
            'Status | الحالة'
        ];

        const csvData = filteredFarms.map((farm) => [
            farm.farmName || '',
            farm.agricultureId || '',
            farm.farmNo?.toString() || '',
            farm.farmSerial?.toString() || '',
            getEmirateName(farm.emirate) || '',
            getCenterName(farm.serviceCenter) || '',
            getLocationName(farm.location) || '',
            farm.size ? Math.round(farm.size).toString() : '',
            farm.status || ''
        ]);

        const csvContent = [
            headers.join(","),
            ...csvData.map((row) => row.map(cell => `"${cell}"`).join(",")),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "farms-list.csv";
        link.click();
        setIsDownloadOpen(false);
        toast.success(t('manageFarms.downloadSuccess') || 'Downloaded successfully!');
    };

    return activeTab.includes('farms') ? (
        <div className="max-w-[1400px] mx-auto p-3">
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{t('manageFarms.title')}</h1>
                </div>
                <div className="flex gap-3">
                    {/* Download Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setIsDownloadOpen(!isDownloadOpen)}
                            className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-5 py-2.5 rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 flex items-center gap-2 shadow-lg shadow-emerald-200 hover:shadow-xl hover:shadow-emerald-300"
                        >
                            <Download size={20} />
                            <span className="font-medium">Download</span>
                            <ChevronDown
                                size={16}
                                className={`transition-transform duration-200 ${isDownloadOpen ? "rotate-180" : ""}`}
                            />
                        </button>

                        {isDownloadOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setIsDownloadOpen(false)}
                                />
                                <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-2xl z-50 border border-gray-100 overflow-hidden">
                                    <button
                                        onClick={downloadPDF}
                                        className="w-full text-left px-4 py-3 hover:bg-emerald-50 flex items-center gap-3 transition-colors group"
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                                            <svg
                                                className="w-5 h-5 text-emerald-600"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                                />
                                            </svg>
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900">PDF Format</div>
                                            <div className="text-xs text-gray-500">Printable document</div>
                                        </div>
                                    </button>
                                    <button
                                        onClick={downloadExcel}
                                        className="w-full text-left px-4 py-3 hover:bg-emerald-50 flex items-center gap-3 transition-colors group"
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                                            <svg
                                                className="w-5 h-5 text-emerald-600"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                                                />
                                            </svg>
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900">Excel Format</div>
                                            <div className="text-xs text-gray-500">Spreadsheet file</div>
                                        </div>
                                    </button>
                                    <button
                                        onClick={downloadCSV}
                                        className="w-full text-left px-4 py-3 hover:bg-emerald-50 flex items-center gap-3 transition-colors group rounded-b-xl"
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                                            <svg
                                                className="w-5 h-5 text-emerald-600"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                />
                                            </svg>
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900">CSV Format</div>
                                            <div className="text-xs text-gray-500">Comma-separated</div>
                                        </div>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Add Farm Button */}
                    <button
                        onClick={() => setActiveTab("farm-new")}
                        className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 font-medium"
                        title="Add Farm"
                    >
                        {t('manageFarms.addFarm')}
                    </button>
                </div>
            </div>

            <div className='flex justify-between items-center mb-4 flex-col sm:flex-row gap-4'>
                <input
                    type="text"
                    placeholder={t('manageFarms.searchByFarmName')}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="border border-gray-300 rounded-lg p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                {/* Min and Max Size Filters */}
                <div className="flex gap-2">
                    <input
                        type="number"
                        placeholder="Min Size"
                        value={minSize}
                        onChange={(e) => setMinSize(e.target.value)}
                        className="border border-gray-300 rounded-lg p-2 w-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                        type="number"
                        placeholder="Max Size"
                        value={maxSize}
                        onChange={(e) => setMaxSize(e.target.value)}
                        className="border border-gray-300 rounded-lg p-2 w-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="flex gap-2 sm:p-4 border-gray-200">
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
                        className="bg-green-600 text-white px-3 py-1.5 rounded-md hover:bg-green-700 transition-colors"
                        onClick={() => {
                            setEmirate(null);
                            setCenter(null);
                            setLocation(null);
                            setQuery('');
                            setMinSize('');
                            setMaxSize('');
                        }}
                    >
                        {t('manageFarms.clear')}
                    </button>
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