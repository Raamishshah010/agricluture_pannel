import React, { useState, useMemo, useCallback } from "react";
import {
  Download,
  MapPin,
  PieChart,
  Apple,
  Leaf,
  Wheat,
  Home,
  Droplets,
  Sprout,
  Filter,
  X,
  SlidersHorizontal,
  ChevronDown,
  BarChart3,
  TrendingUp,
  Grid3x3,
  Users,
  Factory,
  Tractor,
  Gauge,
} from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import useStore from "../../store/store";
import Dropdown from "../../components/dropdown";
import farmService from "../../services/farmService";
import { toast } from "react-toastify";
import FarmDetails from "../manage-farms/farmDetails";
import { FarmUpdateForm } from "../manage-farms/form";
import useTranslation from "../../hooks/useTranslation";

const Emirates = () => {
  const {
    emirates,
    farms,
    fruitTypes,
    vegetableTypes,
    fodderTypes,
    crops,
    greenHouseTypes,
    farmingSystems,
    language: lang,
    irrigationSystems,
    centers,
    locations,
  } = useStore((st) => st);
  const [fruitType, setFruitType] = useState(null);
  const [vegetableType, setVegetableType] = useState(null);
  const [fodderType, setFodderType] = useState(null);
  const [crop, setCrop] = useState(null);
  const [greenhouseType, setGreenhouseType] = useState(null);
  const [farmingSystem, setFarmingSystem] = useState(null);
  const [irrigationSystem, setIrrigationSystem] = useState(null);
  const [activeTab, setActiveTab] = useState("emirates");
  const [selectedFarm, setSelectedFarm] = useState(null);
  const t = useTranslation();

  const isLTR = lang.includes("en");

  const activeFiltersCount = [
    fruitType,
    vegetableType,
    fodderType,
    crop,
    greenhouseType,
    farmingSystem,
    irrigationSystem,
  ].filter(Boolean).length;

  const emirateColors = useMemo(() => {
    return {
      "Abu Dhabi": "#8B5CF6",
      Dubai: "#06B6D4",
      Sharjah: "#F59E0B",
      "Ras Al-Khaimah": "#10B981",
      "Umm Al Quwain": "#6366F1",
      Fujairah: "#EF4444",
      Ajman: "#EC4899",
      ابوظبي: "#8B5CF6",
      دبي: "#06B6D4",
      الشارقة: "#F59E0B",
      "رأس الخيمة": "#10B981",
      "ام القيوين": "#6366F1",
      الفجيرة: "#EF4444",
      عجمان: "#EC4899",
    };
  }, []);

  const CHART_COLORS = [
    "#0078D4",
    "#00BCF2",
    "#0099BC",
    "#005A9E",
    "#004578",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#EC4899",
  ];

  const transformFarms = useMemo(() => {
    let filteredFarms = farms;
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
    if (farmingSystem) {
      filteredFarms = filteredFarms.filter((it) =>
        it.farmingSystem.includes(farmingSystem?.id)
      );
    }
    if (irrigationSystem) {
      filteredFarms = filteredFarms.filter((it) =>
        it.irrigationSystem.includes(irrigationSystem?.id)
      );
    }
    return filteredFarms;
  }, [
    farms,
    fruitType,
    vegetableType,
    fodderType,
    crop,
    greenhouseType,
    irrigationSystem,
    farmingSystem,
  ]);

  // Analytics Data Calculations
  const analyticsData = useMemo(() => {
    // Count of Farms by Center
    const farmsByCenter = {};
    transformFarms.forEach((farm) => {
      const center = centers.find((c) => c.id === farm.serviceCenter);
      const centerName = center
        ? isLTR
          ? center.name
          : center.nameInArrabic
        : isLTR
        ? "Other"
        : "آخر";
      if (centerName && centerName !== "Unknown") {
        farmsByCenter[centerName] = (farmsByCenter[centerName] || 0) + 1;
      }
    });
    const centerData = Object.entries(farmsByCenter)
      .filter(([name]) => name && name !== "Unknown" && name !== "آخر")
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Count of Farms by Source of Water
    const farmsByWaterSource = {};
    transformFarms.forEach((farm) => {
      const waterSource =
        farm.waterSource || farm.sourceOfWater || farm.water_source;
      if (waterSource && waterSource !== "Unknown") {
        const sourceName =
          typeof waterSource === "string"
            ? waterSource
            : isLTR
            ? "Well"
            : "بئر";
        farmsByWaterSource[sourceName] =
          (farmsByWaterSource[sourceName] || 0) + 1;
      }
    });
    const waterSourceData = Object.entries(farmsByWaterSource)
      .filter(([name]) => name && name !== "Unknown")
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Count of Farms by Irrigation Methods
    const farmsByIrrigation = {};
    transformFarms.forEach((farm) => {
      if (
        farm.irrigationSystem &&
        Array.isArray(farm.irrigationSystem) &&
        farm.irrigationSystem.length > 0
      ) {
        farm.irrigationSystem.forEach((sysId) => {
          const system = irrigationSystems.find((s) => s.id === sysId);
          if (system) {
            const systemName = isLTR
              ? system.name
              : system.nameInArrabic || system.name;
            farmsByIrrigation[systemName] =
              (farmsByIrrigation[systemName] || 0) + 1;
          }
        });
      }
    });
    const irrigationData = Object.entries(farmsByIrrigation)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Sum of Farm Area by Irrigation Methods
    const areaByIrrigation = {};
    transformFarms.forEach((farm) => {
      const area = parseFloat(farm.totalArea) || 0;
      if (area > 0) {
        if (
          farm.irrigationSystem &&
          Array.isArray(farm.irrigationSystem) &&
          farm.irrigationSystem.length > 0
        ) {
          const areaPerSystem = area / farm.irrigationSystem.length;
          farm.irrigationSystem.forEach((sysId) => {
            const system = irrigationSystems.find((s) => s.id === sysId);
            if (system) {
              const systemName = isLTR
                ? system.name
                : system.nameInArrabic || system.name;
              areaByIrrigation[systemName] =
                (areaByIrrigation[systemName] || 0) + areaPerSystem;
            }
          });
        }
      }
    });
    const irrigationAreaData = Object.entries(areaByIrrigation)
      .map(([name, area]) => ({ name, area: parseFloat(area.toFixed(2)) }))
      .sort((a, b) => b.area - a.area)
      .slice(0, 8);

    // Count of Farms by Possession
    const farmsByPossession = {};
    transformFarms.forEach((farm) => {
      const possession =
        farm.possession || farm.ownership || (isLTR ? "Owner" : "مالك");
      if (possession) {
        farmsByPossession[possession] =
          (farmsByPossession[possession] || 0) + 1;
      }
    });
    const possessionData = Object.entries(farmsByPossession)
      .filter(([name]) => name && name !== "Unknown")
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Count of Farms by Location
    const farmsByLocation = {};
    transformFarms.forEach((farm) => {
      const locationObj = farm.location
        ? locations?.find((l) => l.id === farm.location)
        : null;
      const locationName = locationObj
        ? isLTR
          ? locationObj.name
          : locationObj.nameInArrabic
        : null;

      if (locationName) {
        farmsByLocation[locationName] =
          (farmsByLocation[locationName] || 0) + 1;
      }
    });

    const locationData = Object.entries(farmsByLocation)
      .filter(([name]) => name && name !== "Unknown")
      .map(([name, count]) => ({ name, count, percentage: 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const totalForLocation = locationData.reduce(
      (sum, item) => sum + item.count,
      0
    );
    locationData.forEach((item) => {
      item.percentage =
        totalForLocation > 0
          ? parseFloat(((item.count / totalForLocation) * 100).toFixed(1))
          : 0;
    });

    // Farming Systems Distribution
    const farmsByFarmingSystem = {};
    transformFarms.forEach((farm) => {
      if (
        farm.farmingSystem &&
        Array.isArray(farm.farmingSystem) &&
        farm.farmingSystem.length > 0
      ) {
        farm.farmingSystem.forEach((sysId) => {
          const system = farmingSystems.find((s) => s.id === sysId);
          if (system) {
            const systemName = isLTR
              ? system.name
              : system.nameInArrabic || system.name;
            farmsByFarmingSystem[systemName] =
              (farmsByFarmingSystem[systemName] || 0) + 1;
          }
        });
      }
    });
    const farmingSystemData = Object.entries(farmsByFarmingSystem)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Crop Type Distribution
    const cropTypeDistribution = {
      fruits: 0,
      vegetables: 0,
      fodder: 0,
      greenhouse: 0,
    };
    transformFarms.forEach((farm) => {
      if (farm.crops?.fruits?.length > 0) cropTypeDistribution.fruits++;
      if (farm.crops?.vegetables?.length > 0) cropTypeDistribution.vegetables++;
      if (farm.crops?.fieldCropsFodder?.length > 0)
        cropTypeDistribution.fodder++;
      if (farm.crops?.greenhouses?.length > 0)
        cropTypeDistribution.greenhouse++;
    });
    const cropDistData = [
      { name: isLTR ? "Fruits" : "فواكه", value: cropTypeDistribution.fruits },
      {
        name: isLTR ? "Vegetables" : "خضروات",
        value: cropTypeDistribution.vegetables,
      },
      { name: isLTR ? "Fodder" : "علف", value: cropTypeDistribution.fodder },
      {
        name: isLTR ? "Greenhouse" : "بيوت محمية",
        value: cropTypeDistribution.greenhouse,
      },
    ].filter((item) => item.value > 0);

    // Total Wells
    const totalWells = transformFarms.reduce((sum, farm) => {
      return sum + (parseInt(farm.numberOfProductionWells) || 0);
    }, 0);

    // Calculate total cultivated area
    const totalCultivatedArea = transformFarms.reduce((sum, farm) => {
      const area = parseFloat(farm.totalArea) || 0;
      return sum + area;
    }, 0);

    return {
      centerData,
      waterSourceData,
      irrigationData,
      irrigationAreaData,
      possessionData,
      locationData,
      farmingSystemData,
      cropDistData,
      totalFarms: transformFarms.length,
      totalArea: totalCultivatedArea.toFixed(2),
      totalWells,
      avgAreaPerFarm:
        transformFarms.length > 0
          ? (totalCultivatedArea / transformFarms.length).toFixed(2)
          : 0,
    };
  }, [
    transformFarms,
    centers,
    irrigationSystems,
    farmingSystems,
    locations,
    isLTR,
  ]);

  const { emirateData, emiratesData } = useMemo(() => {
    const emirateMap = emirates.reduce((acc, e) => {
      acc[e.id] = isLTR ? e.name : e.nameInArrabic;
      return acc;
    }, {});

    const farmCounts = transformFarms.reduce((acc, farm) => {
      const emirateName = emirateMap[farm.emirate] || (isLTR ? "Other" : "آخر");
      acc[emirateName] = (acc[emirateName] || 0) + 1;
      return acc;
    }, {});

    const emiratesData = Object.keys(farmCounts).reduce((acc, name) => {
      acc[name] = { farms: farmCounts[name] };
      return acc;
    }, {});

    const totalFarms = Object.values(farmCounts).reduce((a, b) => a + b, 0);
    const emirateData = Object.keys(farmCounts)
      .map((name) => ({
        name,
        value:
          totalFarms > 0
            ? Number(((farmCounts[name] / totalFarms) * 100).toFixed(2))
            : 0,
        farms: farmCounts[name],
        color: emirateColors[name] || "#999999",
      }))
      .sort((a, b) => b.farms - a.farms);

    return { emiratesData, emirateData };
  }, [emirateColors, emirates, isLTR, transformFarms]);

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

  const clearAllFilters = () => {
    setFruitType(null);
    setVegetableType(null);
    setFodderType(null);
    setFarmingSystem(null);
    setCrop(null);
    setGreenhouseType(null);
    setIrrigationSystem(null);
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white px-4 py-2 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900 text-sm">
            {payload[0].payload.name}
          </p>
          <p className="text-sm text-blue-600 font-medium">
            {payload[0].value}{" "}
            {payload[0].dataKey === "area"
              ? "ha"
              : payload[0].dataKey === "percentage"
              ? "%"
              : "farms"}
          </p>
        </div>
      );
    }
    return null;
  };

  const StatCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    gradient,
    trend,
  }) => (
    <div className="group relative bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
      <div
        className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
      ></div>
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">
              {title}
            </p>
            <p className="text-4xl font-black text-gray-900 mb-1">{value}</p>
            {subtitle && (
              <p className="text-xs text-gray-500 font-medium">{subtitle}</p>
            )}
          </div>
          {Icon && (
            <div
              className={`p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-lg group-hover:scale-110 transition-transform duration-300`}
            >
              <Icon className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
          )}
        </div>
        {trend && (
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600">
            <TrendingUp className="w-4 h-4" />
            <span>{trend}</span>
          </div>
        )}
      </div>
    </div>
  );

  const ChartCard = ({ title, icon: Icon, children, className = "" }) => (
    <div
      className={`bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden ${className}`}
    >
      <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Icon className="w-5 h-5 text-emerald-600" strokeWidth={2.5} />
            </div>
          )}
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );

  return activeTab.includes("emirates") ? (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50">
      {/* Header with Filters */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-30">
        <div className="max-w-[1920px] mx-auto px-6 lg:px-8 py-4">
          {/* Header Row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg shadow-emerald-500/30">
                <BarChart3 className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                  {t("translation.emiratesAnalytics")}
                </h1>
                <p className="text-sm text-gray-500 font-medium">
                  {t("translation.emiratesAnalyticsSub")}
                </p>
              </div>
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 mr-2">
              <div className="p-1.5 bg-emerald-500 rounded-lg">
                <SlidersHorizontal
                  className="w-4 h-4 text-white"
                  strokeWidth={2}
                />
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

            <div className="flex items-center gap-3 flex-wrap flex-1">
              <Dropdown
                classes="w-[160px]"
                options={fruitTypes}
                value={fruitType}
                onChange={setFruitType}
                placeholder={t("filters.fruit")}
              />
              <Dropdown
                classes="w-[160px]"
                options={vegetableTypes}
                value={vegetableType}
                onChange={setVegetableType}
                placeholder={t("filters.vegetable")}
              />
              <Dropdown
                classes="w-[160px]"
                options={fodderTypes}
                value={fodderType}
                onChange={setFodderType}
                placeholder={t("filters.fodder")}
              />
              <Dropdown
                classes="w-[160px]"
                options={crops}
                value={crop}
                onChange={setCrop}
                placeholder={t("filters.crop")}
              />
              <Dropdown
                classes="w-[160px]"
                options={greenHouseTypes}
                value={greenhouseType}
                onChange={setGreenhouseType}
                placeholder={t("filters.greenhouse")}
              />
              <Dropdown
                classes="w-[160px]"
                options={farmingSystems}
                value={farmingSystem}
                onChange={setFarmingSystem}
                placeholder={t("filters.farming")}
              />
              <Dropdown
                classes="w-[160px]"
                options={irrigationSystems}
                value={irrigationSystem}
                onChange={setIrrigationSystem}
                placeholder={t("filters.irrigation")}
              />
            </div>

            {activeFiltersCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-semibold transition-colors text-sm border border-red-200 shadow-sm"
              >
                <X className="w-4 h-4" />
                <span>{t("filters.clearAll")}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Analytics Dashboard */}
      <div className="max-w-[1920px] mx-auto p-6 lg:p-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title={t("kpi.totalFarms")}
            value={analyticsData.totalFarms.toLocaleString()}
            // subtitle={`${t("kpi.across")} ${
            //   Object.keys(emiratesData).length
            // } ${t("kpi.emirates")}`}
            icon={MapPin}
            gradient="from-blue-500 to-cyan-600"
            trend="+12% vs last month"
          />

          <StatCard
            title={t("kpi.totalArea")}
            value={parseFloat(analyticsData.totalArea).toLocaleString()}
            subtitle={t("kpi.hectaresPerFarm")}
            icon={Grid3x3}
            gradient="from-emerald-500 to-teal-600"
            trend="+8% vs last month"
          />

          <StatCard
            title={t("kpi.totalWells")}
            value={analyticsData.totalWells.toLocaleString()}
            subtitle={t("kpi.productionWells")}
            icon={Droplets}
            gradient="from-purple-500 to-indigo-600"
            trend="+5% vs last month"
          />

          <StatCard
            title={t("kpi.avgAreaPerFarm")}
            value={parseFloat(analyticsData.avgAreaPerFarm).toLocaleString()}
            subtitle={t("kpi.hectaresPerFarm")}
            icon={TrendingUp}
            gradient="from-amber-500 to-orange-600"
            trend="Stable"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          {/* Emirates Distribution - Pie Chart */}
          <ChartCard title={t("translation.farmsByEmirate")} icon={PieChart}>
            {emirateData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RePieChart>
                  <Pie
                    data={emirateData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="farms"
                  >
                    {emirateData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </RePieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px]">
                <p className="text-gray-400">No data available</p>
              </div>
            )}
          </ChartCard>

          {/* Farms by Center */}
          <ChartCard
            title={t("translation.topCenters")}
            icon={Home}
            className="lg:col-span-2"
          >
            {analyticsData.centerData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.centerData} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={120}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="#0078D4" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px]">
                <p className="text-gray-400">No center data available</p>
              </div>
            )}
          </ChartCard>
        </div>

        {/* Second Row of Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          {/* Irrigation Methods Distribution */}
          <ChartCard title={t("translation.irrigationMethods")} icon={Droplets}>
            {analyticsData.irrigationData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.irrigationData}>
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="#10B981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px]">
                <p className="text-gray-400">No irrigation data</p>
              </div>
            )}
          </ChartCard>

          {/* Crop Types Distribution */}
          <ChartCard title={t("translation.cropTypes")} icon={Leaf}>
            {analyticsData.cropDistData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RePieChart>
                  <Pie
                    data={analyticsData.cropDistData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analyticsData.cropDistData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </RePieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px]">
                <p className="text-gray-400">No crop data</p>
              </div>
            )}
          </ChartCard>

          {/* Water Source Distribution */}
          <ChartCard title={t("translation.waterSource")} icon={Droplets}>
            {analyticsData.waterSourceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RePieChart>
                  <Pie
                    data={analyticsData.waterSourceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, count }) => `${name}: ${count}`}
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {analyticsData.waterSourceData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </RePieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px]">
                <p className="text-gray-400">No water source data</p>
              </div>
            )}
          </ChartCard>
        </div>

        {/* Third Row of Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Locations */}
          <ChartCard title={t("translation.topLocations")} icon={MapPin}>
            {analyticsData.locationData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={analyticsData.locationData} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={100}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="#F59E0B" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[320px]">
                <p className="text-gray-400">No location data</p>
              </div>
            )}
          </ChartCard>

          {/* Irrigation Area Distribution */}
          <ChartCard title={t("translation.irrigationArea")} icon={Grid3x3}>
            {analyticsData.irrigationAreaData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={analyticsData.irrigationAreaData}>
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="area" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[320px]">
                <p className="text-gray-400">No area data</p>
              </div>
            )}
          </ChartCard>
        </div>

        {/* Fourth Row - Wide Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Farming Systems */}
          <ChartCard title={t("translation.farmingSystems")} icon={Tractor}>
            {analyticsData.farmingSystemData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={analyticsData.farmingSystemData}
                  layout="vertical"
                >
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={100}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="#06B6D4" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px]">
                <p className="text-gray-400">No farming system data</p>
              </div>
            )}
          </ChartCard>

          {/* Possession Distribution */}
          <ChartCard title={t("translation.farmPossession")} icon={Users}>
            {analyticsData.possessionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <RePieChart>
                  <Pie
                    data={analyticsData.possessionData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, count }) => `${name}: ${count}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {analyticsData.possessionData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="bottom" height={36} />
                </RePieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px]">
                <p className="text-gray-400">No possession data</p>
              </div>
            )}
          </ChartCard>
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
