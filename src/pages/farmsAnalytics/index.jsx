import React, { useState, useMemo, useCallback } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, ComposedChart, Line, AreaChart, Area } from 'recharts';
import { MapPin, TrendingUp, Droplets, Home, Leaf, BarChart3, Download, Filter, Activity, Layers, Grid3x3, Users, X, SlidersHorizontal } from 'lucide-react';
import useTranslation from '../../hooks/useTranslation';
import useStore from '../../store/store';
import Dropdown from '../../components/dropdownWithSearch';
import * as XLSX from 'xlsx';

const FarmAnalytics = () => {
  const t = useTranslation();
  const {
    farms,
    regions,
    emirates,
    centers,
    locations,
    fruitTypes,
    vegetableTypes,
    fodderTypes,
    greenHouseTypes,
    farmingSystems,
    coverTypes,
    language: lang,
  } = useStore((st) => st);

  const isLTR = lang.includes('en');
  
  // Geographic filters
  const [region, setRegion] = useState(null);
  const [selectedEmirate, setSelectedEmirate] = useState(null);
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [location, setLocation] = useState(null);
  
  const [isExporting, setIsExporting] = useState(false);

  const CHART_COLORS = ['#0078D4', '#00BCF2', '#0099BC', '#005A9E', '#004578', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  // Helper function to localize dropdown options
  const getLocalizedOptions = useCallback((options) => {
    if (!options) return [];
    return options.map(option => ({
      ...option,
      name: isLTR ? option.name : (option.nameInArrabic || option.name),
      originalName: option.name
    }));
  }, [isLTR]);

  // Filtered centers based on emirate selection
  const filteredCenters = useMemo(() => {
    if (!selectedEmirate) return centers;
    const emirateFarms = farms.filter(farm => farm.emirate === selectedEmirate.id);
    const centerIds = [...new Set(emirateFarms.map(farm => farm.serviceCenter))];
    return centers.filter(c => centerIds.includes(c.id));
  }, [selectedEmirate, centers, farms]);

  // Filtered locations based on emirate and/or center selection
  const filteredLocations = useMemo(() => {
    if (!selectedEmirate && !selectedCenter) return locations;
    
    let relevantFarms = farms;
    
    if (selectedEmirate) {
      relevantFarms = relevantFarms.filter(farm => farm.emirate === selectedEmirate.id);
    }
    
    if (selectedCenter) {
      relevantFarms = relevantFarms.filter(farm => farm.serviceCenter === selectedCenter.id);
    }
    
    const locationIds = [...new Set(relevantFarms.map(farm => farm.location))];
    return locations.filter(l => locationIds.includes(l.id));
  }, [selectedEmirate, selectedCenter, locations, farms]);

  // Handle emirate change - reset dependent filters
  const handleEmirateChange = (emirate) => {
    setSelectedEmirate(emirate);
    setSelectedCenter(null);
    setLocation(null);
  };

  // Handle center change - reset dependent filters
  const handleCenterChange = (value) => {
    setSelectedCenter(value);
    setLocation(null);
  };

  // Filter farms based on selections
  const filteredFarms = useMemo(() => {
    let filtered = farms;
    
    if (region) {
      filtered = filtered.filter(f => f.region === region.id);
    }
    if (selectedEmirate) {
      filtered = filtered.filter(f => f.emirate === selectedEmirate.id);
    }
    if (selectedCenter) {
      filtered = filtered.filter(f => f.serviceCenter === selectedCenter.id);
    }
    if (location) {
      filtered = filtered.filter(f => f.location === location.id);
    }
    
    return filtered;
  }, [farms, region, selectedEmirate, selectedCenter, location]);

  // Clear all filters
  const clearAllFilters = () => {
    setRegion(null);
    setSelectedEmirate(null);
    setSelectedCenter(null);
    setLocation(null);
  };

  // Count active filters
  const activeFiltersCount = [
    region,
    selectedEmirate,
    selectedCenter,
    location,
  ].filter(Boolean).length;

  // Calculate comprehensive analytics
  const analytics = useMemo(() => {
    // Total cultivated area
    const totalCultivatedArea = filteredFarms.reduce((sum, farm) => {
      const size = Number(farm.size) || 0;
      return sum + size;
    }, 0);

    // Total greenhouse area
    const totalGreenhouseArea = filteredFarms.reduce((sum, farm) => {
      const greenhouseArea = farm.crops?.greenhouses?.reduce((ghSum, gh) => {
        const area = (Number(gh.firstCropHouseArea) || 0) + 
                     (Number(gh.secondCropHouseArea) || 0) + 
                     (Number(gh.thirdCropHouseArea) || 0) +
                     (Number(gh.area) || 0);
        return ghSum + area;
      }, 0) || 0;
      return sum + greenhouseArea;
    }, 0);

    // Average wells per farm
    const totalWells = filteredFarms.reduce((sum, farm) => sum + (farm.wellsCount || 0), 0);
    const avgWellsPerFarm = filteredFarms.length > 0 ? (totalWells / filteredFarms.length).toFixed(2) : 0;

    // Water source distribution
    const waterSources = {
      groundwater: 0,
      desalinated: 0,
      both: 0,
    };
    filteredFarms.forEach(farm => {
      const sources = farm.waterSources || [];
      if (sources.includes('groundwater') && sources.includes('desalinated')) {
        waterSources.both += 1;
      } else if (sources.includes('groundwater')) {
        waterSources.groundwater += 1;
      } else if (sources.includes('desalinated')) {
        waterSources.desalinated += 1;
      }
    });

    // Farms by Emirate
    const farmsByEmirate = {};
    filteredFarms.forEach(farm => {
      const emirate = emirates.find(e => e.id === farm.emirate);
      const emirateName = emirate ? (isLTR ? emirate.name : emirate.nameInArrabic) : 'Other';
      if (!farmsByEmirate[emirateName]) {
        farmsByEmirate[emirateName] = { name: emirateName, value: 0, area: 0 };
      }
      farmsByEmirate[emirateName].value += 1;
      farmsByEmirate[emirateName].area += Number(farm.size) || 0;
    });
    const farmsByEmirateData = Object.values(farmsByEmirate).sort((a, b) => b.value - a.value);

    // Land Use Breakdown
    const landUse = {
      greenhouses: 0,
      fruits: 0,
      vegetables: 0,
      fodder: 0,
      other: 0,
    };
    filteredFarms.forEach(farm => {
      if (farm.crops?.greenhouses?.length > 0) landUse.greenhouses += 1;
      if (farm.crops?.fruits?.length > 0) landUse.fruits += 1;
      if (farm.crops?.vegetables?.length > 0) landUse.vegetables += 1;
      if (farm.crops?.fieldCropsFodder?.length > 0) landUse.fodder += 1;
    });
    const totalFarms = filteredFarms.length || 1;
    const landUseData = [
      { name: 'Greenhouses', value: ((landUse.greenhouses / totalFarms) * 100).toFixed(1), color: '#10b981', count: landUse.greenhouses },
      { name: 'Fruit Trees', value: ((landUse.fruits / totalFarms) * 100).toFixed(1), color: '#3b82f6', count: landUse.fruits },
      { name: 'Vegetables', value: ((landUse.vegetables / totalFarms) * 100).toFixed(1), color: '#8b5cf6', count: landUse.vegetables },
      { name: 'Fodder', value: ((landUse.fodder / totalFarms) * 100).toFixed(1), color: '#f59e0b', count: landUse.fodder },
    ].filter(item => parseFloat(item.value) > 0);

    // Farming Systems Distribution
    const farmingSystemCounts = {};
    filteredFarms.forEach(farm => {
      farm.crops?.greenhouses?.forEach(gh => {
        const system = farmingSystems.find(s => s.id === gh.farmingSystemId);
        if (system) {
          const name = isLTR ? system.name : system.nameInArrabic;
          farmingSystemCounts[name] = (farmingSystemCounts[name] || 0) + 1;
        }
      });
    });
    const farmingSystemsData = Object.entries(farmingSystemCounts)
      .map(([name, count]) => ({ name, value: count, color: CHART_COLORS[Object.keys(farmingSystemCounts).indexOf(name)] }))
      .sort((a, b) => b.value - a.value);

    // Greenhouse Types
    const greenhouseTypeCounts = {};
    filteredFarms.forEach(farm => {
      farm.crops?.greenhouses?.forEach(gh => {
        const type = greenHouseTypes.find(t => t.id === gh.greenhouseTypeId);
        if (type) {
          const name = isLTR ? type.name : type.nameInArrabic;
          greenhouseTypeCounts[name] = (greenhouseTypeCounts[name] || 0) + 1;
        }
      });
    });
    const greenhouseTypeData = Object.entries(greenhouseTypeCounts)
      .map(([name, count]) => ({ name, value: count, color: CHART_COLORS[Object.keys(greenhouseTypeCounts).indexOf(name)] }))
      .sort((a, b) => b.value - a.value);

    // Cover Types
    const coverTypeCounts = {};
    filteredFarms.forEach(farm => {
      farm.crops?.greenhouses?.forEach(gh => {
        const type = coverTypes.find(t => t.id === gh.coverTypeId);
        if (type) {
          const name = isLTR ? type.name : type.nameInArrabic;
          coverTypeCounts[name] = (coverTypeCounts[name] || 0) + 1;
        }
      });
    });
    const coverTypeData = Object.entries(coverTypeCounts)
      .map(([name, count]) => ({ name, value: count, color: CHART_COLORS[Object.keys(coverTypeCounts).indexOf(name)] }))
      .sort((a, b) => b.value - a.value);

    // Greenhouse Area by Emirate
    const greenhouseAreaByEmirate = {};
    filteredFarms.forEach(farm => {
      const emirate = emirates.find(e => e.id === farm.emirate);
      const emirateName = emirate ? (isLTR ? emirate.name : emirate.nameInArrabic) : 'Other';
      const greenhouseArea = farm.crops?.greenhouses?.reduce((sum, gh) => {
        const area = (Number(gh.firstCropHouseArea) || 0) + 
                     (Number(gh.secondCropHouseArea) || 0) + 
                     (Number(gh.thirdCropHouseArea) || 0) +
                     (Number(gh.area) || 0);
        return sum + area;
      }, 0) || 0;
      
      if (!greenhouseAreaByEmirate[emirateName]) {
        greenhouseAreaByEmirate[emirateName] = { name: emirateName, value: 0, count: 0 };
      }
      greenhouseAreaByEmirate[emirateName].value += greenhouseArea;
      if (greenhouseArea > 0) greenhouseAreaByEmirate[emirateName].count += 1;
    });
    const greenhouseAreaData = Object.values(greenhouseAreaByEmirate)
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    // Top Fruits
    const fruitCounts = {};
    filteredFarms.forEach(farm => {
      farm.crops?.fruits?.forEach(fruit => {
        const fruitType = fruitTypes.find(f => f.id === fruit.fruidId);
        if (fruitType) {
          const name = isLTR ? fruitType.name : fruitType.nameInArrabic;
          fruitCounts[name] = (fruitCounts[name] || 0) + 1;
        }
      });
    });
    const topFruits = Object.entries(fruitCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Top Vegetables
    const vegetableCounts = {};
    filteredFarms.forEach(farm => {
      farm.crops?.vegetables?.forEach(veg => {
        const vegType = vegetableTypes.find(v => v.id === veg.vegetableId);
        if (vegType) {
          const name = isLTR ? vegType.name : vegType.nameInArrabic;
          vegetableCounts[name] = (vegetableCounts[name] || 0) + 1;
        }
      });
    });
    const topVegetables = Object.entries(vegetableCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Farms by Service Center
    const farmsByCenter = {};
    filteredFarms.forEach(farm => {
      const center = centers.find(c => c.id === farm.serviceCenter);
      const centerName = center ? (isLTR ? center.name : center.nameInArrabic) : 'Other';
      if (!farmsByCenter[centerName]) {
        farmsByCenter[centerName] = { name: centerName, count: 0, area: 0 };
      }
      farmsByCenter[centerName].count += 1;
      farmsByCenter[centerName].area += Number(farm.size) || 0;
    });
    const farmsByCenterData = Object.values(farmsByCenter)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Top Farms by Greenhouse Area
    const farmsWithGreenhouses = filteredFarms
      .map(farm => {
        const emirate = emirates.find(e => e.id === farm.emirate);
        const center = centers.find(c => c.id === farm.serviceCenter);
        const greenhouseArea = farm.crops?.greenhouses?.reduce((sum, gh) => {
          const area = (Number(gh.firstCropHouseArea) || 0) + 
                       (Number(gh.secondCropHouseArea) || 0) + 
                       (Number(gh.thirdCropHouseArea) || 0) +
                       (Number(gh.area) || 0);
          return sum + area;
        }, 0) || 0;
        const greenhouseCount = farm.crops?.greenhouses?.length || 0;
        
        return {
          id: farm.id,
          emirate: emirate ? (isLTR ? emirate.name : emirate.nameInArrabic) : 'N/A',
          center: center ? (isLTR ? center.name : center.nameInArrabic) : 'N/A',
          greenhouses: greenhouseCount,
          area: greenhouseArea,
        };
      })
      .filter(f => f.area > 0)
      .sort((a, b) => b.area - a.area)
      .slice(0, 10);

    return {
      totalFarms: filteredFarms.length,
      totalCultivatedArea: (totalCultivatedArea / 10000).toFixed(2), // Convert to hectares
      totalGreenhouseArea: (totalGreenhouseArea / 10000).toFixed(2), // Convert to hectares
      avgWellsPerFarm,
      waterSources,
      farmsByEmirateData,
      landUseData,
      farmingSystemsData,
      greenhouseTypeData,
      coverTypeData,
      greenhouseAreaData,
      topFruits,
      topVegetables,
      farmsByCenterData,
      farmsWithGreenhouses,
    };
  }, [filteredFarms, emirates, centers, fruitTypes, vegetableTypes, fodderTypes, greenHouseTypes, farmingSystems, coverTypes, isLTR]);

  // Export to Excel
  const exportToExcel = () => {
    setIsExporting(true);
    
    try {
      const wb = XLSX.utils.book_new();

      // Sheet 1: Summary
      const summaryData = [
        ['Farm Analytics Dashboard'],
        ['Generated on:', new Date().toLocaleString()],
        [],
        ['Applied Filters:'],
        ['Region:', region ? (isLTR ? region.name : region.nameInArrabic) : 'All'],
        ['Emirate:', selectedEmirate ? (isLTR ? selectedEmirate.name : selectedEmirate.nameInArrabic) : 'All'],
        ['Center:', selectedCenter ? (isLTR ? selectedCenter.name : selectedCenter.nameInArrabic) : 'All'],
        ['Location:', location ? (isLTR ? location.name : location.nameInArrabic) : 'All'],
        [],
        ['Metric', 'Value'],
        ['Total Farms', analytics.totalFarms],
        ['Total Cultivated Area (ha)', analytics.totalCultivatedArea],
        ['Total Greenhouse Area (ha)', analytics.totalGreenhouseArea],
        ['Average Wells per Farm', analytics.avgWellsPerFarm],
        [],
        ['Water Sources'],
        ['Groundwater Only', analytics.waterSources.groundwater],
        ['Desalinated Only', analytics.waterSources.desalinated],
        ['Both', analytics.waterSources.both],
      ];
      const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
      ws1['!cols'] = [{ wch: 35 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, ws1, 'Summary');

      // Sheet 2: Farms by Emirate
      const emirateData = [
        ['Farms by Emirate'],
        [],
        ['Emirate', 'Number of Farms', 'Total Area (sqm)'],
        ...analytics.farmsByEmirateData.map(item => [item.name, item.value, item.area.toFixed(2)])
      ];
      const ws2 = XLSX.utils.aoa_to_sheet(emirateData);
      ws2['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, ws2, 'By Emirate');

      // Sheet 3: Land Use
      const landUseExport = [
        ['Land Use Distribution'],
        [],
        ['Category', 'Percentage', 'Number of Farms'],
        ...analytics.landUseData.map(item => [item.name, item.value + '%', item.count])
      ];
      const ws3 = XLSX.utils.aoa_to_sheet(landUseExport);
      ws3['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, ws3, 'Land Use');

      // Sheet 4: Top Fruits
      if (analytics.topFruits.length > 0) {
        const fruitsData = [
          ['Top Fruit Types'],
          [],
          ['Fruit Type', 'Number of Farms'],
          ...analytics.topFruits.map(item => [item.name, item.count])
        ];
        const ws4 = XLSX.utils.aoa_to_sheet(fruitsData);
        ws4['!cols'] = [{ wch: 25 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(wb, ws4, 'Top Fruits');
      }

      // Sheet 5: Top Vegetables
      if (analytics.topVegetables.length > 0) {
        const vegetablesData = [
          ['Top Vegetable Types'],
          [],
          ['Vegetable Type', 'Number of Farms'],
          ...analytics.topVegetables.map(item => [item.name, item.count])
        ];
        const ws5 = XLSX.utils.aoa_to_sheet(vegetablesData);
        ws5['!cols'] = [{ wch: 25 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(wb, ws5, 'Top Vegetables');
      }

      // Sheet 6: Service Centers
      const centersData = [
        ['Farms by Service Center'],
        [],
        ['Service Center', 'Number of Farms', 'Total Area (sqm)'],
        ...analytics.farmsByCenterData.map(item => [item.name, item.count, item.area.toFixed(2)])
      ];
      const ws6 = XLSX.utils.aoa_to_sheet(centersData);
      ws6['!cols'] = [{ wch: 30 }, { wch: 20 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, ws6, 'By Service Center');

      // Sheet 7: Greenhouse Data
      if (analytics.greenhouseTypeData.length > 0) {
        const greenhouseData = [
          ['Greenhouse Analytics'],
          [],
          ['Greenhouse Type', 'Count'],
          ...analytics.greenhouseTypeData.map(item => [item.name, item.value]),
          [],
          ['Cover Type', 'Count'],
          ...analytics.coverTypeData.map(item => [item.name, item.value]),
        ];
        const ws7 = XLSX.utils.aoa_to_sheet(greenhouseData);
        ws7['!cols'] = [{ wch: 25 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, ws7, 'Greenhouse Data');
      }

      // Sheet 8: Top Farms
      if (analytics.farmsWithGreenhouses.length > 0) {
        const topFarmsData = [
          ['Top Farms by Greenhouse Area'],
          [],
          ['Farm ID', 'Emirate', 'Center', 'Greenhouses', 'Area (sqm)'],
          ...analytics.farmsWithGreenhouses.map(farm => [
            farm.id,
            farm.emirate,
            farm.center,
            farm.greenhouses,
            farm.area.toFixed(2)
          ])
        ];
        const ws8 = XLSX.utils.aoa_to_sheet(topFarmsData);
        ws8['!cols'] = [{ wch: 15 }, { wch: 25 }, { wch: 30 }, { wch: 15 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, ws8, 'Top Farms');
      }

      // Generate and download
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `Farm_Analytics_${timestamp}.xlsx`;
      XLSX.writeFile(wb, filename);
      
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
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
              <span className="font-medium">{entry.name}:</span>{' '}
              <span className="font-bold" style={{ color: entry.color }}>{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const StatCard = ({ icon: Icon, value, label, unit, gradient, trend }) => (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 group">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-3 rounded-xl ${gradient} group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-5 h-5 text-white" strokeWidth={2.5} />
        </div>
        {trend && (
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
            {trend}
          </span>
        )}
      </div>
      <div className="text-3xl font-bold text-gray-900 mb-1">
        {value}
        {unit && <span className="text-lg text-gray-500 ml-1">{unit}</span>}
      </div>
      <div className="text-sm font-medium text-gray-600">{label}</div>
    </div>
  );

  const desalinatedPercentage = analytics.totalFarms > 0 
    ? ((analytics.waterSources.desalinated + analytics.waterSources.both) / analytics.totalFarms * 100).toFixed(0) 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-[1920px] mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg">
                <BarChart3 className="text-white w-6 h-6" strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{t('analytics.farmAnalytics.title') || 'Farm Analytics Dashboard'}</h1>
                <p className="text-sm text-gray-500 mt-0.5">{t('translation.statsSubTitle')}</p>
              </div>
            </div>
            <button 
              onClick={exportToExcel}
              disabled={isExporting}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              {isExporting ? 'Exporting...' : 'Export Report'}
            </button>
          </div>

          {/* Filters */}
          <div className="space-y-3 mt-4">
            {/* Geographic Filters */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 mr-2">
                <div className="p-1.5 bg-blue-500 rounded-lg">
                  <MapPin className="w-4 h-4 text-white" strokeWidth={2} />
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {t("filters.geographic") || "Geographic"}
                </span>
              </div>

              <Dropdown
                options={getLocalizedOptions(regions)}
                value={region}
                classes='min-w-[180px]'
                onChange={setRegion}
                placeholder={t('analytics.greenhouseDashboard.selectRegion') || 'Select Region'}
              />
              <Dropdown
                options={getLocalizedOptions(emirates)}
                value={selectedEmirate}
                classes='min-w-[180px]'
                onChange={handleEmirateChange}
                placeholder={t('analytics.greenhouseDashboard.selectEmirate') || 'Select Emirate'}
              />
              <Dropdown
                options={getLocalizedOptions(filteredCenters)}
                value={selectedCenter}
                classes='min-w-[180px]'
                onChange={handleCenterChange}
                placeholder={t('analytics.greenhouseDashboard.selectCenter') || 'Select Center'}
                disabled={!selectedEmirate}
              />
              <Dropdown
                options={getLocalizedOptions(filteredLocations)}
                value={location}
                classes='min-w-[180px]'
                onChange={setLocation}
                placeholder={t('overview.selectLocation') || 'Select Location'}
                disabled={!selectedEmirate && !selectedCenter}
              />

              {activeFiltersCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-semibold transition-colors text-sm border border-red-200 shadow-sm ml-auto"
                >
                  <X className="w-4 h-4" />
                  <span>{t("filters.clearAll") || 'Clear All'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1920px] mx-auto p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <StatCard
            icon={Home}
            value={analytics.totalFarms.toLocaleString()}
            label={t('translation.totalFarms')}
            gradient="bg-gradient-to-br from-blue-500 to-blue-600"
          />
          <StatCard
            icon={Leaf}
            value={analytics.totalCultivatedArea}
            unit="ha"
            label={t('translation.totalCultivatedArea')}
            gradient="bg-gradient-to-br from-emerald-500 to-emerald-600"
          />
          <StatCard
            icon={Home}
            value={analytics.totalGreenhouseArea}
            unit="ha"
            label={t('translation.totalGreenhouseArea')}
            gradient="bg-gradient-to-br from-teal-500 to-cyan-600"
          />
          <StatCard
            icon={Droplets}
            value={analytics.avgWellsPerFarm}
            label={t('translation.avgWellsFarm')}
            gradient="bg-gradient-to-br from-cyan-500 to-blue-600"
          />
          <StatCard
            icon={TrendingUp}
            value={desalinatedPercentage + '%'}
            label={t('translation.desalinatedWater')}
            gradient="bg-gradient-to-br from-purple-500 to-purple-600"
          />
        </div>

        {/* Farm Distribution Section */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-blue-100">
              <MapPin className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">{t('translation.farmDisAnalytics')}</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* Farms by Emirate */}
            <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl p-5 border border-gray-100">
              <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                {t('translation.farmsByEmirate')}
              </h3>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={analytics.farmsByEmirateData} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11, fill: '#374151' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill="#0078D4" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Land Use Breakdown */}
            <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl p-5 border border-gray-100">
              <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-600" />
                {t('translation.landUseDistribution')}
              </h3>
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={analytics.landUseData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="count"
                    label={({ name, value }) => `${name}: ${value}%`}
                    labelLine={false}
                  >
                    {analytics.landUseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Farms by Service Center */}
            <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl p-5 border border-gray-100">
              <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                {t('translation.farmsByServiceCenter')}
              </h3>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={analytics.farmsByCenterData} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11, fill: '#374151' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="#10B981" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Crop Analytics Section */}
        {(analytics.topFruits.length > 0 || analytics.topVegetables.length > 0) && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-green-100">
                <Leaf className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">{t('translation.cropAnalytics')}</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Fruits */}
              {analytics.topFruits.length > 0 && (
                <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl p-5 border border-gray-100">
                  <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                    {t('translation.topFruitTypes')}
                  </h3>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={analytics.topFruits} layout="vertical" margin={{ left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11, fill: '#374151' }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" fill="#8B5CF6" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Top Vegetables */}
              {analytics.topVegetables.length > 0 && (
                <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl p-5 border border-gray-100">
                  <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-600" />
                      {t('translation.topVegetableTypes')}

                  </h3>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={analytics.topVegetables} layout="vertical" margin={{ left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11, fill: '#374151' }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" fill="#06B6D4" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Greenhouse Section */}
        {analytics.greenhouseTypeData.length > 0 && (
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-xl p-6 shadow-xl mb-6 text-white">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                <Home className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold">{t('translation.protectedFarming')}</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
              {/* Greenhouse Types */}
              {analytics.greenhouseTypeData.length > 0 && (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
                  <h3 className="text-lg font-bold mb-4 text-center">{t('translation.greenhouseTypes')}</h3>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={analytics.greenhouseTypeData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {analytics.greenhouseTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-2">
                    {analytics.greenhouseTypeData.map((type, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: type.color }}></div>
                          <span>{type.name}</span>
                        </div>
                        <span className="font-semibold">{type.value} ({((type.value / analytics.greenhouseTypeData.reduce((sum, t) => sum + t.value, 0)) * 100).toFixed(0)}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cover Types */}
              {analytics.coverTypeData.length > 0 && (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
                  <h3 className="text-lg font-bold mb-4 text-center">{t('translation.coverTypes')}</h3>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={analytics.coverTypeData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {analytics.coverTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-2">
                    {analytics.coverTypeData.map((type, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: type.color }}></div>
                          <span>{type.name}</span>
                        </div>
                        <span className="font-semibold">{type.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Greenhouse Area by Emirate */}
              {analytics.greenhouseAreaData.length > 0 && (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
                  <h3 className="text-lg font-bold mb-4">{t('translation.greenhousrbyEmirate')}</h3>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={analytics.greenhouseAreaData} layout="vertical" margin={{ left: 10 }}>
                      <XAxis type="number" stroke="#fff" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" width={90} stroke="#fff" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#6ee7b7" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Farming Systems */}
            {analytics.farmingSystemsData.length > 0 && (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
                <h3 className="text-lg font-bold mb-4">{t('translation.farmingSystemsDistribution')}</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={analytics.farmingSystemsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                    <XAxis dataKey="name" stroke="#fff" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis stroke="#fff" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#6ee7b7" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* Top Farms Table */}
        {analytics.farmsWithGreenhouses.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-amber-100">
                <TrendingUp className="w-5 h-5 text-amber-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">{t('translation.topFarmsbyGreenhouseArea')}</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="text-left py-4 px-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Rank</th>
                    <th className="text-left py-4 px-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Farm ID</th>
                    <th className="text-left py-4 px-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Emirate</th>
                    <th className="text-left py-4 px-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Center</th>
                    <th className="text-left py-4 px-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Greenhouses</th>
                    <th className="text-left py-4 px-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Area (sqm)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {analytics.farmsWithGreenhouses.map((farm, index) => (
                    <tr key={farm.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-sm font-bold">
                          {index + 1}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-lg bg-blue-50 text-sm font-semibold text-blue-700 border border-blue-200">
                          {farm.id}
                        </span>
                        
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-700 font-medium">{farm.emirate}</td>
                      <td className="py-4 px-4 text-sm text-gray-700">{farm.center}</td>
                      <td className="py-4 px-4 text-sm text-gray-700">{farm.greenhouses}</td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-lg bg-emerald-50 text-sm font-bold text-emerald-700 border border-emerald-200">
                          {farm.area.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FarmAnalytics;