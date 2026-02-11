import React, { useState, useMemo, useCallback } from "react";
import {
  BarChart3,
  TrendingUp,
  MapPin,
  Home,
  Droplets,
  X,
  Download,
  Activity,
  Layers,
  Grid3x3,
  PieChart as PieChartIcon,
  SlidersHorizontal,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ComposedChart,
} from "recharts";
import useStore from "../../store/store";
import Dropdown from "../../components/dropdown";
import farmService from "../../services/farmService";
import { toast } from "react-toastify";
import FarmDetails from "../manage-farms/farmDetails";
import { FarmUpdateForm } from "../manage-farms/form";
import useTranslation from "../../hooks/useTranslation";
import * as XLSX from "xlsx";

const Emirates = () => {
  const {
    farms,
    fruitTypes,
    vegetableTypes,
    fodderTypes,
    crops,
    greenHouseTypes,
    farmingSystems,
    coverTypes,
    emirates,
    centers,
    locations,
    irrigationSystems,
    language: lang,
  } = useStore((st) => st);
  
  // Geographic filters
  const [emirate, setEmirate] = useState(null);
  const [center, setCenter] = useState(null);
  const [location, setLocation] = useState(null);
  
  // Crop filters
  const [fruitType, setFruitType] = useState(null);
  const [vegetableType, setVegetableType] = useState(null);
  const [fodderType, setFodderType] = useState(null);
  const [crop, setCrop] = useState(null);
  const [greenhouseType, setGreenhouseType] = useState(null);
  const [farmingSystem, setFarmingSystem] = useState(null);
  const [coverType, setCoverType] = useState(null);
  
  const [activeTab, setActiveTab] = useState("emirates");
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const t = useTranslation();
  const isLTR = lang.includes("en");

  const CHART_COLORS = [
    "#0078D4",
    "#00BCF2",
    "#0099BC",
    "#005A9E",
    "#004578",
    "#10B981",
    "#F59E0B",
    "#EF4444",
  ];

  const cropColors = useMemo(() => {
    return {
      Fruits: "#8B5CF6",
      Vegetables: "#06B6D4",
      Fodders: "#F59E0B",
      Greenhouses: "#10B981",
    };
  }, []);

  // Helper function to localize dropdown options
  const getLocalizedOptions = useCallback((options) => {
    if (!options) return [];
    return options.map(option => ({
      ...option,
      name: isLTR ? option.name : (option.nameInArrabic || option.name),
      originalName: option.name
    }));
  }, [isLTR]);

  // Filtered options based on selections
  const filteredCenters = useMemo(() => {
    if (!emirate) return centers;
    const emirateFarms = farms.filter(farm => farm.emirate === emirate.id);
    const centerIds = [...new Set(emirateFarms.map(farm => farm.serviceCenter))];
    return centers.filter(c => centerIds.includes(c.id));
  }, [emirate, centers, farms]);

  const filteredLocations = useMemo(() => {
    if (!emirate && !center) return locations;
    
    let relevantFarms = farms;
    
    if (emirate) {
      relevantFarms = relevantFarms.filter(farm => farm.emirate === emirate.id);
    }
    
    if (center) {
      relevantFarms = relevantFarms.filter(farm => farm.serviceCenter === center.id);
    }
    
    const locationIds = [...new Set(relevantFarms.map(farm => farm.location))];
    return locations.filter(l => locationIds.includes(l.id));
  }, [emirate, center, locations, farms]);

  // Handle emirate change - reset dependent filters
  const handleEmirateChange = (value) => {
    setEmirate(value);
    setCenter(null);
    setLocation(null);
  };

  // Handle center change - reset dependent filters
  const handleCenterChange = (value) => {
    setCenter(value);
    setLocation(null);
  };

  // Count active filters
  const activeFiltersCount = [
    emirate,
    center,
    location,
    fruitType,
    vegetableType,
    fodderType,
    crop,
    greenhouseType,
    farmingSystem,
    coverType,
  ].filter(Boolean).length;

  const transformFarms = useMemo(() => {
    let filteredFarms = farms;
    
    // Geographic filters
    if (emirate) {
      filteredFarms = filteredFarms.filter((it) => it.emirate === emirate?.id);
    }
    if (center) {
      filteredFarms = filteredFarms.filter((it) => it.serviceCenter === center?.id);
    }
    if (location) {
      filteredFarms = filteredFarms.filter((it) => it.location === location?.id);
    }
    
    // Crop filters
    if (fruitType) {
      filteredFarms = filteredFarms.filter(
        (it) =>
          it.crops.fruits.findIndex(
            (fruit) => fruit.fruidId === fruitType?.id
          ) >= 0
      );
    }
    if (vegetableType) {
      filteredFarms = filteredFarms.filter(
        (it) =>
          it.crops.vegetables.findIndex(
            (veg) => veg.vegetableId === vegetableType?.id
          ) >= 0
      );
    }
    if (fodderType) {
      filteredFarms = filteredFarms.filter(
        (it) =>
          it.crops.fieldCropsFodder.findIndex(
            (fodder) => fodder.fodderId === fodderType?.id
          ) >= 0
      );
    }
    if (crop) {
      filteredFarms = filteredFarms.filter(
        (it) =>
          it.crops.greenhouses.findIndex(
            (greenhouse) => greenhouse.cropId === crop?.id
          ) >= 0
      );
    }
    if (greenhouseType) {
      filteredFarms = filteredFarms.filter(
        (it) =>
          it.crops.greenhouses.findIndex(
            (greenhouse) => greenhouse.greenhouseTypeId === greenhouseType?.id
          ) >= 0
      );
    }
    if (coverType) {
      filteredFarms = filteredFarms.filter(
        (it) =>
          it.crops.greenhouses.findIndex(
            (greenhouse) => greenhouse.coverTypeId === coverType?.id
          ) >= 0
      );
    }
    if (farmingSystem) {
      filteredFarms = filteredFarms.filter(
        (it) =>
          it.crops.greenhouses.findIndex(
            (greenhouse) => greenhouse.farmingSystemId === farmingSystem?.id
          ) >= 0
      );
    }

    return filteredFarms;
  }, [
    farms,
    emirate,
    center,
    location,
    fruitType,
    vegetableType,
    fodderType,
    crop,
    greenhouseType,
    coverType,
    farmingSystem,
  ]);

  // Analytics Data
  const analyticsData = useMemo(() => {
    // Farms by Crop Type
    const cropCounts = {
      fruits: 0,
      vegetables: 0,
      fodders: 0,
      greenhouses: 0,
    };

    transformFarms.forEach((farm) => {
      const farmCrops = farm.crops || {};
      if (Array.isArray(farmCrops.fruits) && farmCrops.fruits.length > 0)
        cropCounts.fruits += 1;
      if (
        Array.isArray(farmCrops.vegetables) &&
        farmCrops.vegetables.length > 0
      )
        cropCounts.vegetables += 1;
      if (
        Array.isArray(farmCrops.fieldCropsFodder) &&
        farmCrops.fieldCropsFodder.length > 0
      )
        cropCounts.fodders += 1;
      if (
        Array.isArray(farmCrops.greenhouses) &&
        farmCrops.greenhouses.length > 0
      )
        cropCounts.greenhouses += 1;
    });

    const cropTypeData = Object.entries(cropCounts).map(([key, count]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      count,
    }));

    // Top Fruit Types
    const fruitCounts = {};
    transformFarms.forEach((farm) => {
      farm.crops?.fruits?.forEach((fruit) => {
        const fruitObj = fruitTypes.find((f) => f.id === fruit.fruidId);
        if (fruitObj) {
          const name = isLTR ? fruitObj.name : fruitObj.nameInArrabic;
          fruitCounts[name] = (fruitCounts[name] || 0) + 1;
        }
      });
    });
    const topFruitData = Object.entries(fruitCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Top Vegetable Types
    const vegetableCounts = {};
    transformFarms.forEach((farm) => {
      farm.crops?.vegetables?.forEach((veg) => {
        const vegObj = vegetableTypes.find((v) => v.id === veg.vegetableId);
        if (vegObj) {
          const name = isLTR ? vegObj.name : vegObj.nameInArrabic;
          vegetableCounts[name] = (vegetableCounts[name] || 0) + 1;
        }
      });
    });
    const topVegetableData = Object.entries(vegetableCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Top Fodder Types
    const fodderCounts = {};
    transformFarms.forEach((farm) => {
      farm.crops?.fieldCropsFodder?.forEach((fodder) => {
        const fodderObj = fodderTypes.find((f) => f.id === fodder.fodderId);
        if (fodderObj) {
          const name = isLTR ? fodderObj.name : fodderObj.nameInArrabic;
          fodderCounts[name] = (fodderCounts[name] || 0) + 1;
        }
      });
    });
    const topFodderData = Object.entries(fodderCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Crops by Emirate
    const cropsByEmirate = {};
    transformFarms.forEach((farm) => {
      const emirate = emirates.find((e) => e.id === farm.emirate);
      const emirateName = emirate
        ? isLTR
          ? emirate.name
          : emirate.nameInArrabic
        : "Other";

      if (!cropsByEmirate[emirateName]) {
        cropsByEmirate[emirateName] = {
          name: emirateName,
          fruits: 0,
          vegetables: 0,
          fodders: 0,
          greenhouses: 0,
          total: 0,
        };
      }

      if (farm.crops?.fruits?.length > 0)
        cropsByEmirate[emirateName].fruits += 1;
      if (farm.crops?.vegetables?.length > 0)
        cropsByEmirate[emirateName].vegetables += 1;
      if (farm.crops?.fieldCropsFodder?.length > 0)
        cropsByEmirate[emirateName].fodders += 1;
      if (farm.crops?.greenhouses?.length > 0)
        cropsByEmirate[emirateName].greenhouses += 1;
      cropsByEmirate[emirateName].total += 1;
    });
    const cropsByEmirateData = Object.values(cropsByEmirate).sort(
      (a, b) => b.total - a.total
    );

    // Crops by Center
    const cropsByCenter = {};
    transformFarms.forEach((farm) => {
      const center = centers.find((c) => c.id === farm.serviceCenter);
      const centerName = center
        ? isLTR
          ? center.name
          : center.nameInArrabic
        : "Other";

      if (!cropsByCenter[centerName]) {
        cropsByCenter[centerName] = {
          name: centerName,
          count: 0,
          fruits: 0,
          vegetables: 0,
          fodders: 0,
          greenhouses: 0,
        };
      }
      cropsByCenter[centerName].count += 1;
      if (farm.crops?.fruits?.length > 0) cropsByCenter[centerName].fruits += 1;
      if (farm.crops?.vegetables?.length > 0)
        cropsByCenter[centerName].vegetables += 1;
      if (farm.crops?.fieldCropsFodder?.length > 0)
        cropsByCenter[centerName].fodders += 1;
      if (farm.crops?.greenhouses?.length > 0)
        cropsByCenter[centerName].greenhouses += 1;
    });
    const cropsByCenterData = Object.values(cropsByCenter)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Greenhouse Types Distribution
    const greenhouseTypeCounts = {};
    transformFarms.forEach((farm) => {
      farm.crops?.greenhouses?.forEach((gh) => {
        const ghType = greenHouseTypes.find(
          (t) => t.id === gh.greenhouseTypeId
        );
        if (ghType) {
          const name = isLTR ? ghType.name : ghType.nameInArrabic;
          greenhouseTypeCounts[name] = (greenhouseTypeCounts[name] || 0) + 1;
        }
      });
    });
    const greenhouseTypeData = Object.entries(greenhouseTypeCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Cover Types Distribution
    const coverTypeCounts = {};
    transformFarms.forEach((farm) => {
      farm.crops?.greenhouses?.forEach((gh) => {
        const cvType = coverTypes.find((t) => t.id === gh.coverTypeId);
        if (cvType) {
          const name = isLTR ? cvType.name : cvType.nameInArrabic;
          coverTypeCounts[name] = (coverTypeCounts[name] || 0) + 1;
        }
      });
    });
    const coverTypeData = Object.entries(coverTypeCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Farming Systems Distribution
    const farmingSystemCounts = {};
    transformFarms.forEach((farm) => {
      farm.crops?.greenhouses?.forEach((gh) => {
        const fsType = farmingSystems.find((t) => t.id === gh.farmingSystemId);
        if (fsType) {
          const name = isLTR ? fsType.name : fsType.nameInArrabic;
          farmingSystemCounts[name] = (farmingSystemCounts[name] || 0) + 1;
        }
      });
    });
    const farmingSystemData = Object.entries(farmingSystemCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Crop Type Distribution Pie
    const totalFarms = transformFarms.length || 1;
    const cropTypePieData = Object.entries(cropCounts)
      .map(([key, count]) => ({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        value: count,
        percentage: ((count / totalFarms) * 100).toFixed(1),
      }))
      .filter((item) => item.value > 0);

    return {
      cropTypeData,
      topFruitData,
      topVegetableData,
      topFodderData,
      cropsByEmirateData,
      cropsByCenterData,
      greenhouseTypeData,
      coverTypeData,
      farmingSystemData,
      cropTypePieData,
    };
  }, [
    transformFarms,
    fruitTypes,
    vegetableTypes,
    fodderTypes,
    emirates,
    centers,
    greenHouseTypes,
    coverTypes,
    farmingSystems,
    isLTR,
  ]);

  const { cropsStats } = useMemo(() => {
    const cropCounts = {
      fruits: 0,
      vegetables: 0,
      fodders: 0,
      greenhouses: 0,
    };

    transformFarms.forEach((farm) => {
      const farmCrops = farm.crops || {};
      if (Array.isArray(farmCrops.fruits) && farmCrops.fruits.length > 0)
        cropCounts.fruits += 1;
      if (
        Array.isArray(farmCrops.vegetables) &&
        farmCrops.vegetables.length > 0
      )
        cropCounts.vegetables += 1;
      if (
        Array.isArray(farmCrops.fieldCropsFodder) &&
        farmCrops.fieldCropsFodder.length > 0
      )
        cropCounts.fodders += 1;
      if (
        Array.isArray(farmCrops.greenhouses) &&
        farmCrops.greenhouses.length > 0
      )
        cropCounts.greenhouses += 1;
    });

    const cropsStats = {
      fruits: cropCounts.fruits,
      vegetables: cropCounts.vegetables,
      fodders: cropCounts.fodders,
      greenhouses: cropCounts.greenhouses,
    };

    return { cropsStats };
  }, [transformFarms]);

  // Clear all filters function
  const clearAllFilters = () => {
    setEmirate(null);
    setCenter(null);
    setLocation(null);
    setFruitType(null);
    setVegetableType(null);
    setFodderType(null);
    setFarmingSystem(null);
    setCrop(null);
    setGreenhouseType(null);
    setCoverType(null);
  };

  // Export to Excel function
  const exportToExcel = () => {
    setIsExporting(true);

    try {
      const wb = XLSX.utils.book_new();

      // Sheet 1: Summary Statistics
      const summaryData = [
        ["Farm Crop Analytics Dashboard"],
        ["Generated on:", new Date().toLocaleString()],
        [],
        ["Metric", "Value"],
        ["Total Farms", transformFarms.length],
        ["Farms with Fruits", cropsStats.fruits],
        ["Farms with Vegetables", cropsStats.vegetables],
        ["Farms with Fodders", cropsStats.fodders],
        ["Farms with Greenhouses", cropsStats.greenhouses],
      ];
      const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
      ws1["!cols"] = [{ wch: 30 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, ws1, "Summary");

      // Sheet 2: Crop Type Distribution
      const cropTypeSheetData = [
        ["Crop Type Distribution"],
        [],
        ["Crop Type", "Number of Farms", "Percentage"],
        ...analyticsData.cropTypeData.map((item) => {
          const percentage = (
            (item.count / transformFarms.length) *
            100
          ).toFixed(2);
          return [item.name, item.count, percentage + "%"];
        }),
      ];
      const ws2 = XLSX.utils.aoa_to_sheet(cropTypeSheetData);
      ws2["!cols"] = [{ wch: 20 }, { wch: 20 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, ws2, "Crop Types");

      // Sheet 3: Top Fruits
      if (analyticsData.topFruitData.length > 0) {
        const fruitsData = [
          ["Top Fruit Types"],
          [],
          ["Fruit Type", "Number of Farms"],
          ...analyticsData.topFruitData.map((item) => [item.name, item.count]),
        ];
        const ws3 = XLSX.utils.aoa_to_sheet(fruitsData);
        ws3["!cols"] = [{ wch: 25 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(wb, ws3, "Top Fruits");
      }

      // Sheet 4: Top Vegetables
      if (analyticsData.topVegetableData.length > 0) {
        const vegetablesData = [
          ["Top Vegetable Types"],
          [],
          ["Vegetable Type", "Number of Farms"],
          ...analyticsData.topVegetableData.map((item) => [
            item.name,
            item.count,
          ]),
        ];
        const ws4 = XLSX.utils.aoa_to_sheet(vegetablesData);
        ws4["!cols"] = [{ wch: 25 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(wb, ws4, "Top Vegetables");
      }

      // Sheet 5: Top Fodders
      if (analyticsData.topFodderData.length > 0) {
        const foddersData = [
          ["Top Fodder Types"],
          [],
          ["Fodder Type", "Number of Farms"],
          ...analyticsData.topFodderData.map((item) => [item.name, item.count]),
        ];
        const ws5 = XLSX.utils.aoa_to_sheet(foddersData);
        ws5["!cols"] = [{ wch: 25 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(wb, ws5, "Top Fodders");
      }

      // Sheet 6: Crops by Emirate
      const emirateData = [
        ["Farms by Emirate"],
        [],
        [
          "Emirate",
          "Total Farms",
          "With Fruits",
          "With Vegetables",
          "With Fodders",
          "With Greenhouses",
        ],
        ...analyticsData.cropsByEmirateData.map((item) => [
          item.name,
          item.total,
          item.fruits,
          item.vegetables,
          item.fodders,
          item.greenhouses,
        ]),
      ];
      const ws6 = XLSX.utils.aoa_to_sheet(emirateData);
      ws6["!cols"] = [
        { wch: 25 },
        { wch: 15 },
        { wch: 15 },
        { wch: 18 },
        { wch: 15 },
        { wch: 18 },
      ];
      XLSX.utils.book_append_sheet(wb, ws6, "By Emirate");

      // Sheet 7: Crops by Service Center
      const centerData = [
        ["Farms by Service Center"],
        [],
        [
          "Service Center",
          "Total Farms",
          "With Fruits",
          "With Vegetables",
          "With Fodders",
          "With Greenhouses",
        ],
        ...analyticsData.cropsByCenterData.map((item) => [
          item.name,
          item.count,
          item.fruits,
          item.vegetables,
          item.fodders,
          item.greenhouses,
        ]),
      ];
      const ws7 = XLSX.utils.aoa_to_sheet(centerData);
      ws7["!cols"] = [
        { wch: 30 },
        { wch: 15 },
        { wch: 15 },
        { wch: 18 },
        { wch: 15 },
        { wch: 18 },
      ];
      XLSX.utils.book_append_sheet(wb, ws7, "By Service Center");

      // Sheet 8: Greenhouse Types
      if (analyticsData.greenhouseTypeData.length > 0) {
        const greenhouseData = [
          ["Greenhouse Types Distribution"],
          [],
          ["Greenhouse Type", "Count"],
          ...analyticsData.greenhouseTypeData.map((item) => [
            item.name,
            item.count,
          ]),
        ];
        const ws8 = XLSX.utils.aoa_to_sheet(greenhouseData);
        ws8["!cols"] = [{ wch: 30 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, ws8, "Greenhouse Types");
      }

      // Sheet 9: Cover Types
      if (analyticsData.coverTypeData.length > 0) {
        const coverData = [
          ["Cover Types Distribution"],
          [],
          ["Cover Type", "Count"],
          ...analyticsData.coverTypeData.map((item) => [item.name, item.count]),
        ];
        const ws9 = XLSX.utils.aoa_to_sheet(coverData);
        ws9["!cols"] = [{ wch: 30 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, ws9, "Cover Types");
      }

      // Sheet 10: Farming Systems
      if (analyticsData.farmingSystemData.length > 0) {
        const farmingData = [
          ["Farming Systems Distribution"],
          [],
          ["Farming System", "Count"],
          ...analyticsData.farmingSystemData.map((item) => [
            item.name,
            item.count,
          ]),
        ];
        const ws10 = XLSX.utils.aoa_to_sheet(farmingData);
        ws10["!cols"] = [{ wch: 30 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, ws10, "Farming Systems");
      }

      // Generate and download
      const timestamp = new Date().toISOString().split("T")[0];
      const filename = `Farm_Crop_Analytics_${timestamp}.xlsx`;
      XLSX.writeFile(wb, filename);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export data. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleFarmClick = (farm) => {
    farmService
      .getfarmById(farm.id)
      .then((res) => {
        setSelectedFarm(res.data);
        setActiveTab("farm-details");
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || err.message);
      });
  };

  const submitFarmHandler = useCallback(async (item, id) => {
    farmService
      .updateFarm(item, id)
      .then(() => {
        setSelectedFarm(null);
        setActiveTab("emirates");
        toast.success("Updated successfully");
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || err.message);
      });
  }, []);

  const handleEdit = async (item) => {
    farmService
      .getFarmByIdWithoutPopulatingFields(item.id)
      .then((res) => {
        setSelectedFarm(res.data);
        setActiveTab("farm-edit");
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || err.message);
      });
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white px-4 py-3 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm font-semibold text-gray-900 mb-1">
            {payload[0].payload.name}
          </p>
          {payload.map((entry, index) => (
            <p key={index} className="text-xs text-gray-600">
              <span className="font-medium">{entry.name}:</span>{" "}
              <span className="font-bold" style={{ color: entry.color }}>
                {entry.value}
              </span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return activeTab.includes("emirates") ? (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50 flex flex-col overflow-hidden">
      {/* Top Filter Bar */}
      <div className="bg-white border-b border-gray-200 shadow-sm px-6 py-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg shadow-md">
              <BarChart3 className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">
                {t('translation.analyticDashboard')}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {t('translation.analyticDashboardSub')}
              </p>
            </div>
          </div>

          <button
            onClick={exportToExcel}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all text-sm border bg-white text-gray-700 border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? "Exporting..." : "Export"}</span>
          </button>
        </div>

        {/* Filters Row */}
        <div className="space-y-3 mt-4">
          {/* Geographic Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 mr-2">
              <div className="p-1.5 bg-blue-500 rounded-lg">
                <MapPin className="w-4 h-4 text-white" strokeWidth={2} />
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {t("filters.geographic")}
              </span>
            </div>

            <Dropdown
              classes="w-[180px]"
              options={getLocalizedOptions(emirates)}
              value={emirate}
              onChange={handleEmirateChange}
              placeholder={t('overview.selectEmirate') || "Select Emirate"}
            />
            <Dropdown
              classes="w-[180px]"
              options={getLocalizedOptions(filteredCenters)}
              value={center}
              onChange={handleCenterChange}
              placeholder={t('overview.selectCenter') || "Select Center"}
              disabled={!emirate}
            />
            <Dropdown
              classes="w-[180px]"
              options={getLocalizedOptions(filteredLocations)}
              value={location}
              onChange={setLocation}
              placeholder={t('overview.selectLocation') || "Select Location"}
              disabled={!emirate && !center}
            />
          </div>

          {/* Crop Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 mr-2">
              <div className="p-1.5 bg-emerald-500 rounded-lg">
                <SlidersHorizontal className="w-4 h-4 text-white" strokeWidth={2} />
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {t("filters.filters")}
              </span>
              {activeFiltersCount > 0 && (
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </div>

            <Dropdown
              classes="w-[180px]"
              options={fruitTypes}
              value={fruitType}
              onChange={setFruitType}
              placeholder={t("cropFilters.fruitType")}
            />
            <Dropdown
              classes="w-[180px]"
              options={vegetableTypes}
              value={vegetableType}
              onChange={setVegetableType}
              placeholder={t("cropFilters.vegetableType")}
            />
            <Dropdown
              classes="w-[180px]"
              options={fodderTypes}
              value={fodderType}
              onChange={setFodderType}
              placeholder={t("cropFilters.fodderType")}
            />
            <Dropdown
              classes="w-[180px]"
              options={crops}
              value={crop}
              onChange={setCrop}
              placeholder={t("cropFilters.crop")}
            />
            <Dropdown
              classes="w-[180px]"
              options={greenHouseTypes}
              value={greenhouseType}
              onChange={setGreenhouseType}
              placeholder={t("cropFilters.greenhouse")}
            />
            <Dropdown
              classes="w-[180px]"
              options={farmingSystems}
              value={farmingSystem}
              onChange={setFarmingSystem}
              placeholder={t("cropFilters.farmingSystem")}
            />
            <Dropdown
              classes="w-[180px]"
              options={coverTypes}
              value={coverType}
              onChange={setCoverType}
              placeholder={t("cropFilters.coverType")}
            />

            {activeFiltersCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-semibold transition-colors text-sm border border-red-200 shadow-sm ml-auto"
              >
                <X className="w-4 h-4" />
                <span>{t("filters.clearAll")}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-[1920px] mx-auto">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">
                  {t('stats.totalFarms')}
                </span>
                <MapPin className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {transformFarms.length}
              </div>
              <div className="text-xs text-gray-500 mt-1">{t('stats.filteredResults')}</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">
                  {t('stats.withFruits')}
                </span>
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {cropsStats.fruits}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {((cropsStats.fruits / transformFarms.length) * 100).toFixed(1)}
                % {t('stats.ofTotal')}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">
                  {t('stats.withVegetables')}
                </span>
                <Activity className="w-5 h-5 text-cyan-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {cropsStats.vegetables}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {(
                  (cropsStats.vegetables / transformFarms.length) *
                  100
                ).toFixed(1)}
                % {t('stats.ofTotal')}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">
                  {t('stats.withFodders')}
                </span>
                <Layers className="w-5 h-5 text-amber-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {cropsStats.fodders}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {((cropsStats.fodders / transformFarms.length) * 100).toFixed(
                  1
                )}
                % {t('stats.ofTotal')}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">
                  {t('stats.withGreenhouses')}
                </span>
                <Home className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {cropsStats.greenhouses}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {(
                  (cropsStats.greenhouses / transformFarms.length) *
                  100
                ).toFixed(1)}
                % {t('stats.ofTotal')}
              </div>
            </div>
          </div>

          {/* Charts Grid - Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
            {/* Farms by Crop Type */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-gray-900">
                  {t('translation.farmCropType')}
                </h3>
              </div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart
                  data={analyticsData.cropTypeData}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="#0078D4" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Crop Type Distribution Pie */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-4">
                <PieChartIcon className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-bold text-gray-900">
                  {t('translation.cropTypeDistribution')}
                </h3>
              </div>
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={analyticsData.cropTypePieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analyticsData.cropTypePieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={Object.values(cropColors)[index]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Top Fruit Types */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-bold text-gray-900">
                  {t('translation.topFruitTypes')}
                </h3>
              </div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart
                  data={analyticsData.topFruitData}
                  layout="vertical"
                  margin={{ left: 10 }}
                >
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={90}
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Charts Grid - Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
            {/* Top Vegetable Types */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-cyan-600" />
                <h3 className="text-base font-bold text-gray-900">
                  {t('translation.topVegetableTypes')}
                </h3>
              </div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart
                  data={analyticsData.topVegetableData}
                  layout="vertical"
                  margin={{ left: 10 }}
                >
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={90}
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="#06B6D4" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Top Fodder Types */}
            {analyticsData.topFodderData.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-4">
                  <Layers className="w-5 h-5 text-amber-600" />
                  <h3 className="text-base font-bold text-gray-900">
                    {t('translation.topFodderTypes')}

                  </h3>
                </div>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart
                    data={analyticsData.topFodderData}
                    layout="vertical"
                    margin={{ left: 10 }}
                  >
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={90}
                      tick={{ fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" fill="#F59E0B" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Total Farms by Emirate */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-gray-900">
                  {t('translation.farmsByEmirate')}

                </h3>
              </div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart
                  data={analyticsData.cropsByEmirateData}
                  layout="vertical"
                  margin={{ left: 10 }}
                >
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={90}
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="total" fill="#10B981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Charts Grid - Row 3 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* Farms by Service Center */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-4">
                <Home className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-gray-900">
                   {t('translation.serviceCenter')}

                </h3>
              </div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart
                  data={analyticsData.cropsByCenterData}
                  layout="vertical"
                  margin={{ left: 10 }}
                >
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={90}
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="#0078D4" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Multi-Metric Emirate View */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-gray-900">
                  {t('translation.cropByEmirate')}
                </h3>
              </div>
              <ResponsiveContainer width="100%" height={320}>
                <ComposedChart
                  data={analyticsData.cropsByEmirateData.slice(0, 5)}
                  margin={{ bottom: 40, left: -10 }}
                >
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    tick={{ fontSize: 10 }}
                    height={80}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="fruits" stackId="a" fill="#8B5CF6" />
                  <Bar dataKey="vegetables" stackId="a" fill="#06B6D4" />
                  <Bar dataKey="fodders" stackId="a" fill="#F59E0B" />
                  <Bar dataKey="greenhouses" stackId="a" fill="#10B981" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Greenhouse Types Distribution */}
            {analyticsData.greenhouseTypeData.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-4">
                  <Home className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-base font-bold text-gray-900">
                    {t('translation.greenhouseTypes')}
                  </h3>
                </div>
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={analyticsData.greenhouseTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, count }) => `${name}: ${count}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analyticsData.greenhouseTypeData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Cover Types Distribution */}
            {analyticsData.coverTypeData.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-4">
                  <Droplets className="w-5 h-5 text-cyan-600" />
                  <h3 className="text-base font-bold text-gray-900">
                   {t('translation.coverTypes')}
                  </h3>
                </div>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart
                    data={analyticsData.coverTypeData}
                    layout="vertical"
                    margin={{ left: 10 }}
                  >
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={90}
                      tick={{ fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" fill="#06B6D4" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Farming Systems Distribution */}
            {analyticsData.farmingSystemData.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-4">
                  <Grid3x3 className="w-5 h-5 text-rose-600" />
                  <h3 className="text-base font-bold text-gray-900">
                    {t('translation.farmingSystems')}
                  </h3>
                </div>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart
                    data={analyticsData.farmingSystemData}
                    layout="vertical"
                    margin={{ left: 10 }}
                  >
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={90}
                      tick={{ fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" fill="#EF4444" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  ) : activeTab.includes("farm-details") ? (
    <FarmDetails
      farm={selectedFarm}
      handleEdit={handleEdit}
      handleBack={() => {
        setActiveTab("emirates");
        setSelectedFarm(null);
      }}
    />
  ) : (
    <FarmUpdateForm
      farm={selectedFarm}
      onSave={submitFarmHandler}
      onCancel={() => {
        setActiveTab("emirates");
        setSelectedFarm(null);
      }}
    />
  );
};

export default Emirates;