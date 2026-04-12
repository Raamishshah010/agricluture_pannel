import { useEffect, useRef, useState } from "react";
import service from "../../services/farmerService";
import { toast } from "react-toastify";
import Farmers from "./farmers";
import Farms from "./farms";
import FarmDetails from "./farmDetails";
import Pagination from "../../components/pagination";
import useTranslation from "../../hooks/useTranslation";
import { Download, ChevronDown } from "lucide-react";
import Loader from "../../components/Loader";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { amiriFontBase64 } from "../../assets/AmiriFont"; // Amiri font import karein

export default function Index(props) {
  const t = useTranslation();
  const [list, setList] = useState([]);
  const [farms, setFarms] = useState([]);
  const [activeTab, setActiveTab] = useState(
    () => sessionStorage.getItem("farmerActiveTab") || "farmers",
  );
  const [selectedFarmer, setSelectedFarmer] = useState(() => {
    const storedFarm = sessionStorage.getItem("selectedFarmer");
    return storedFarm ? JSON.parse(storedFarm) : null;
  });
  const [selectedFarm, setSelectedFarm] = useState(() => {
    const storedFarm = sessionStorage.getItem("farmerSelectedFarm");
    return storedFarm ? JSON.parse(storedFarm) : null;
  });
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [randomNumber, setRandomNumber] = useState(
    () => sessionStorage.getItem("randomNumber") || 1,
  );
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const lastFarmersRequestKeyRef = useRef("");
  const requestSequenceRef = useRef(0);

  useEffect(() => {
    sessionStorage.setItem("farmerActiveTab", activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (selectedFarmer) {
      sessionStorage.setItem("selectedFarmer", JSON.stringify(selectedFarmer));
    } else {
      sessionStorage.removeItem("selectedFarmer");
    }
  }, [selectedFarmer]);

  useEffect(() => {
    if (selectedFarm) {
      sessionStorage.setItem(
        "farmerSelectedFarm",
        JSON.stringify(selectedFarm),
      );
    } else {
      sessionStorage.removeItem("farmerSelectedFarm");
    }
  }, [selectedFarm]);

  useEffect(() => {
    sessionStorage.setItem("randomNumber", randomNumber);
  }, [randomNumber]);

  useEffect(() => {
    if (!query.trim()) {
      const requestKey = "1|50|";
      if (lastFarmersRequestKeyRef.current === requestKey) {
        return;
      }
      lastFarmersRequestKeyRef.current = requestKey;

      const fetch = async () => {
        const requestId = ++requestSequenceRef.current;
        try {
          setLoading(true);
          const res = await service.getFarmers(1, 50, "");
          if (requestId !== requestSequenceRef.current) return;
          setList(res.data);
          setCount(res.pagination.totalPages);
        } catch (err) {
          if (requestId === requestSequenceRef.current) {
            toast.error(err.response?.data?.message || err.message);
          }
        } finally {
          if (requestId === requestSequenceRef.current) {
            setLoading(false);
          }
        }
      };
      fetch();
      return;
    }

    const delayDebounce = setTimeout(() => {
      const fetchData = async () => {
        const normalizedQuery = query.trim();
        const requestKey = `1|50|${normalizedQuery}`;
        if (lastFarmersRequestKeyRef.current === requestKey) {
          return;
        }
        lastFarmersRequestKeyRef.current = requestKey;
        const requestId = ++requestSequenceRef.current;
        try {
          setLoading(true);
          const res = await service.getFarmers(1, 50, normalizedQuery);
          if (requestId !== requestSequenceRef.current) return;
          setList(res.data);
          setLoading(false);
          setCount(res.pagination.totalPages);
        } catch (err) {
          if (requestId === requestSequenceRef.current) {
            setLoading(false);
            toast.error(err.message);
          }
        }
      };

      fetchData();
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  useEffect(() => {
    if (props.number !== randomNumber) {
      setRandomNumber(props.number);
      setActiveTab("farmers");
    }
  }, [props.number, randomNumber]);

  const loadMore = async (currentPage) => {
    const requestKey = `${currentPage}|50|${query.trim()}`;
    if (lastFarmersRequestKeyRef.current === requestKey) {
      return;
    }
    lastFarmersRequestKeyRef.current = requestKey;
    const requestId = ++requestSequenceRef.current;
    try {
      setLoading(true);
      const res = await service.getFarmers(currentPage, 50, query.trim());
      if (requestId !== requestSequenceRef.current) return;
      setList(res.data);
      setCount(res.pagination.totalPages);
      setPage(currentPage);
    } catch (err) {
      if (requestId === requestSequenceRef.current) {
        toast.error(err.response?.data?.message || err.message);
      }
    } finally {
      if (requestId === requestSequenceRef.current) {
        setLoading(false);
      }
    }
  };

  const handleFarms = async (item) => {
    setActiveTab("farms");
    setSelectedFarmer(item);
    try {
      const res = await service.getFarmerFarms(item.id);
      setActiveTab("farms");
      setSelectedFarmer(item);
      setFarms(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return t('common.nA');
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Helper function to check if text contains Arabic characters
  const hasArabic = (text) => {
    if (!text) return false;
    const arabicPattern =
      /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
    return arabicPattern.test(text);
  };

  // Fetch all data from all pages
  const fetchAllData = async () => {
    try {
      setIsDownloading(true);
      let allData = [];
      let currentPage = 1;
      let totalPages = 1;

      // Fetch first page to get total pages
      const firstResponse = await service.getFarmers(currentPage, 50, query);
      allData = [...firstResponse.data];
      totalPages = firstResponse.pagination.totalPages;

      // Fetch remaining pages if there are more
      if (totalPages > 1) {
        const promises = [];
        for (let i = 2; i <= totalPages; i++) {
          promises.push(service.getFarmers(i, 50, query));
        }

        const results = await Promise.all(promises);
        results.forEach((res) => {
          allData = [...allData, ...res.data];
        });
      }

      setIsDownloading(false);
      return allData;
    } catch (error) {
      setIsDownloading(false);
      toast.error(error.response?.data?.message || error.message);
      return [];
    }
  };

  //! Download as PDF with all data

const downloadPDF = async () => {
    const allFarmers = await fetchAllData();
    if (allFarmers.length === 0) {
      toast.error(t('farmers.noDataToDownload'));
      return;
    }

    // FIX: ReferenceError hatane ke liye isRTL ko document ya store se handle karein
    // Agar language variable bahar define hai to ye usay utha lega, 
    // warna document ke direction se detect kar lega.
    const isArabic = document.documentElement.dir === 'rtl' || (typeof language !== 'undefined' && language.includes('ar'));

    try {
      // Landscape orientation Arabic tables ke liye hamesha behtar hoti hai
      const doc = new jsPDF({ orientation: 'l', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.width; // Landscape mein ye 297mm hoga

      doc.addFileToVFS("Amiri-Regular.ttf", amiriFontBase64);
      doc.addFont("Amiri-Regular.ttf", "Amiri", "normal");
      doc.setFont("Amiri");

      // 1. STATIC HEADERS (Reverse order for Arabic)
      let headers = isArabic 
        ? ["تاريخ التسجيل", "رقم الهوية", "رقم الهاتف", "الاسم"] 
        : ["Name", "Phone Number", "Emirate ID", "Created At"];

      // 2. DATA MAPPING (Reverse row for Arabic)
      let tableData = allFarmers.map(farmer => {
        const row = [
          farmer.name || t('common.nA'),
          farmer.phoneNumber || t('common.nA'),
          farmer.emirateId || t('common.nA'),
          formatDate(farmer.createdAt)
        ];
        return isArabic ? row.reverse() : row;
      });

      // 3. TITLES (Forcing RTL Position)
      doc.setFontSize(22);
      const titleText = t('farmers.pdfTitle');
      // Agar Arabic hai to Right side (pageWidth - margin) se shuru karein
      doc.text(titleText, isArabic ? pageWidth - 15 : 15, 20, { 
        align: isArabic ? 'right' : 'left' 
      });
      
      doc.setFontSize(12);
      const totalLabel = `${t('farmers.pdfTotalRecords')} ${allFarmers.length}`;
      doc.text(totalLabel, isArabic ? pageWidth - 15 : 15, 30, { 
        align: isArabic ? 'right' : 'left' 
      });

      // 4. GENERATE TABLE
      autoTable(doc, {
        head: [headers],
        body: tableData,
        startY: 40,
        margin: { left: 15, right: 15 },
        styles: { 
          font: 'Amiri', 
          fontSize: 11,
          halign: isArabic ? 'right' : 'left', // Content alignment
        },
        headStyles: { 
          fillColor: [34, 197, 94], 
          font: 'Amiri',
          halign: isArabic ? 'right' : 'left' // Header alignment
        },
        // Ye sabse important part hai RTL ke liye
        columnStyles: {
          all: { halign: isArabic ? 'right' : 'left' }
        },
        // Table ko page par stretch karne ke liye
        tableWidth: 'auto', 
      });
      
      doc.save(`farmers-list-${new Date().getTime()}.pdf`);
      setIsDownloadOpen(false);
      toast.success(t('farmers.downloadSuccess'));
    } catch (error) {
      console.error('PDF Error:', error);
      toast.error(t('farmers.toast.pdfGenerationFailed'));
    }
};

  // Download as Excel
  const downloadExcel = async () => {
    const allFarmers = await fetchAllData();
    if (allFarmers.length === 0) {
      toast.error(t("farmers.noDataToDownload"));
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(
      allFarmers.map((farmer) => ({
        [t("farmers.image")]: farmer.image
          ? t("farmers.imageAvailable")
          : t("farmers.noImage"),
        [t("farmers.name")]: farmer.name || t('common.nA'),
        [t("farmers.phoneNumber")]: farmer.phoneNumber || t('common.nA'),
        [t("farmers.emirateId")]: farmer.emirateId || t('common.nA'),
        [t("farmers.createdAt")]: formatDate(farmer.createdAt),
      })),
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, t('farmers.sheetName'));

    // Add metadata
    const metadataRow = query.trim()
      ? [[
          `${t('farmers.download.totalRecords')} ${allFarmers.length}`,
          `${t('farmers.download.filterApplied')} ${query}`,
        ]]
      : [[`${t('farmers.download.totalRecords')} ${allFarmers.length}`]];

    XLSX.utils.sheet_add_aoa(worksheet, metadataRow, { origin: -1 });

    XLSX.writeFile(
      workbook,
      `farmers-list-all-pages${query ? "-filtered" : ""}.xlsx`,
    );
    setIsDownloadOpen(false);
    toast.success(t("farmers.downloadSuccess"));
  };

  // Download as CSV
  const downloadCSV = async () => {
    const allFarmers = await fetchAllData();
    if (allFarmers.length === 0) {
      toast.error(t("farmers.noDataToDownload"));
      return;
    }

    const headers = [
      t("farmers.image"),
      t("farmers.name"),
      t("farmers.phoneNumber"),
      t("farmers.emirateId"),
      t("farmers.createdAt"),
    ];

    const csvData = allFarmers.map((farmer) => [
      farmer.image ? t("farmers.imageAvailable") : t("farmers.noImage"),
      farmer.name || t("farmers.noData"),
      farmer.phoneNumber || t("farmers.noData"),
      farmer.emirateId || t("farmers.noData"),
      formatDate(farmer.createdAt),
    ]);

    // Escape CSV values that contain commas or quotes
    const escapeCSV = (value) => {
      if (typeof value !== "string") return value;
      if (value.includes(",") || value.includes('"') || value.includes("\n")) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    let csvContent = [
      headers.map(escapeCSV).join(","),
      ...csvData.map((row) => row.map(escapeCSV).join(",")),
    ].join("\n");

    // Add metadata at the bottom
    csvContent += `\n\n${t('farmers.download.totalRecords')} ${allFarmers.length}`;
    if (query.trim()) {
      csvContent += `\n${t('farmers.download.filterApplied')} ${query}`;
    }

    // Add BOM for proper UTF-8 encoding (supports Arabic)
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `farmers-list-all-pages${query ? "-filtered" : ""}.csv`;
    link.click();
    setIsDownloadOpen(false);
    toast.success(t("farmers.downloadSuccess"));
  };

  return activeTab.includes("farmers") ? (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t("farmers.title")}
          </h1>
          <p className="text-gray-600 mt-1">{t("farmers.subtitle")}</p>
        </div>

        {/* Download Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsDownloadOpen(!isDownloadOpen)}
            disabled={list.length === 0 || isDownloading}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${
              list.length === 0 || isDownloading
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700 text-white"
            }`}
          >
            {isDownloading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span>{t("farmers.downloading")}</span>
              </>
            ) : (
              <>
                <Download size={20} />
                {t("common.download")}
                <ChevronDown
                  size={16}
                  className={`transition-transform ${isDownloadOpen ? "rotate-180" : ""}`}
                />
              </>
            )}
          </button>

          {isDownloadOpen && list.length > 0 && !isDownloading && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsDownloadOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                <div className="px-4 py-2 border-b border-gray-100 bg-gray-50">
                  <p className="text-xs text-gray-600 font-medium">
                    {t("farmers.downloadAllPages")}
                  </p>
                </div>
                <button
                  onClick={downloadPDF}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-2 text-gray-700"
                >
                  <Download size={16} />
                  {t("farmers.downloadOptions.pdf")}
                </button>
                <button
                  onClick={downloadExcel}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-2 text-gray-700 border-t border-gray-100"
                >
                  <Download size={16} />
                  {t("farmers.downloadOptions.excel")}
                </button>
                <button
                  onClick={downloadCSV}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-2 text-gray-700 border-t border-gray-100 rounded-b-lg"
                >
                  <Download size={16} />
                  {t("farmers.downloadOptions.csv")}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <input
        type="text"
        placeholder={t("farmers.searchByFarmName")}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="border border-gray-300 rounded-lg p-2 w-full mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {/* Show filter badge if search is active */}
      {query.trim() && (
        <div className="mb-4 flex items-center gap-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            {t("farmers.filterActive")}: "{query}"
            <button
              onClick={() => setQuery("")}
              className="ml-2 text-blue-600 hover:text-blue-800"
            >
              ×
            </button>
          </span>
          <span className="text-sm text-gray-600">
            {list.length} {t("farmers.results")}
          </span>
        </div>
      )}

      {loading ? (
        <Loader />
      ) : (
        <>
          <Farmers list={list} setList={setList} handleFarms={handleFarms} />
          <Pagination
            initialPage={page}
            totalPages={count}
            onPageChange={loadMore}
          />
        </>
      )}
    </div>
  ) : activeTab.includes("farms") ? (
    <Farms
      list={farms}
      farmerName={selectedFarmer.name}
      handleBack={() => setActiveTab("farmers")}
      handleDetail={(item) => {
        setSelectedFarm(item);
        setActiveTab("farm-details");
      }}
    />
  ) : (
    <FarmDetails farm={selectedFarm} handleBack={() => setActiveTab("farms")} />
  );
}
