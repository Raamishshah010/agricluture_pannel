import { useEffect, useState } from "react";
import service from "../../services/farmerService";
import { toast } from "react-toastify";
import Farmers from "./farmers";
import Farms from "./farms";
import FarmDetails from "./farmDetails";
import Pagination from "../../components/pagination";
import useTranslation from "../../hooks/useTranslation";
import { Download, ChevronDown } from "lucide-react";
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
    service
      .getFarmers(1, 50)
      .then((res) => {
        setList(res.data);
        setCount(res.pagination.totalPages);
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || err.message);
      });
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      service
        .getFarmers(1, 50)
        .then((res) => {
          setList(res.data);
          setCount(res.pagination.totalPages);
        })
        .catch((err) => {
          toast.error(err.response?.data?.message || err.message);
        });
      return;
    }

    const delayDebounce = setTimeout(() => {
      const fetchData = async () => {
        try {
          setLoading(true);
          const res = await service.getFarmers(1, 50, query);
          setList(res.data);
          setLoading(false);
          setCount(res.pagination.totalPages);
        } catch (err) {
          setLoading(false);
          toast.error(err.message);
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
    setLoading(true);
    service
      .getFarmers(currentPage, 50)
      .then((res) => {
        setList(res.data);
        setCount(res.pagination.totalPages);
        setPage(currentPage);
        setLoading(false);
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || err.message);
      });
  };

  const handleFarms = async (item) => {
    setActiveTab("farms");
    setSelectedFarmer(item);
    service
      .getFarmerFarms(item.id)
      .then((res) => {
        setActiveTab("farms");
        setSelectedFarmer(item);
        setFarms(res.data);
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || err.message);
      });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
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
          farmer.name || "N/A",
          farmer.phoneNumber || "N/A",
          farmer.emirateId || "N/A",
          formatDate(farmer.createdAt)
        ];
        return isArabic ? row.reverse() : row;
      });

      // 3. TITLES (Forcing RTL Position)
      doc.setFontSize(22);
      const titleText = isArabic ? "قائمة المزارعين" : 'Farmers List';
      // Agar Arabic hai to Right side (pageWidth - margin) se shuru karein
      doc.text(titleText, isArabic ? pageWidth - 15 : 15, 20, { 
        align: isArabic ? 'right' : 'left' 
      });
      
      doc.setFontSize(12);
      const totalLabel = isArabic 
        ? `إجمالي السجلات: ${allFarmers.length}` 
        : `Total Records: ${allFarmers.length}`;
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
      toast.error('Failed to generate PDF');
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
        [t("farmers.name")]: farmer.name || t("farmers.noData"),
        [t("farmers.phoneNumber")]: farmer.phoneNumber || t("farmers.noData"),
        [t("farmers.emirateId")]: farmer.emirateId || t("farmers.noData"),
        [t("farmers.createdAt")]: formatDate(farmer.createdAt),
      })),
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Farmers");

    // Add metadata
    const metadataRow = query.trim()
      ? [[`Total Records: ${allFarmers.length}`, `Filter Applied: ${query}`]]
      : [[`Total Records: ${allFarmers.length}`]];

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
    csvContent += `\n\nTotal Records: ${allFarmers.length}`;
    if (query.trim()) {
      csvContent += `\nFilter Applied: ${query}`;
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
                <span>Downloading...</span>
              </>
            ) : (
              <>
                <Download size={20} />
                Download
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
                    Download All Pages
                  </p>
                </div>
                <button
                  onClick={downloadPDF}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-2 text-gray-700"
                >
                  <Download size={16} />
                  Download PDF
                </button>
                <button
                  onClick={downloadExcel}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-2 text-gray-700 border-t border-gray-100"
                >
                  <Download size={16} />
                  Download Excel
                </button>
                <button
                  onClick={downloadCSV}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-2 text-gray-700 border-t border-gray-100 rounded-b-lg"
                >
                  <Download size={16} />
                  Download CSV
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
        <div className="flex justify-center items-center mt-60">
          <svg
            aria-hidden="true"
            className="w-8 h-8 text-green-600 animate-spin dark:text-gray-200 fill-white"
            viewBox="0 0 100 101"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
              fill="currentColor"
            />
            <path
              d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
              fill="currentFill"
            />
          </svg>
        </div>
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
