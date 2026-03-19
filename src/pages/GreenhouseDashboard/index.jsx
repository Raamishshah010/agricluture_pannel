import React, { useMemo, useState, useCallback } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, ComposedChart, Line, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { Download, Home, TrendingUp, Activity, Layers, Filter, X, BarChart3, MapPin, Grid3x3, SlidersHorizontal } from 'lucide-react';
import useStore from '../../store/store';
import Dropdown from '../../components/dropdownWithSearch';
import useTranslation from '../../hooks/useTranslation';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';

const GreenhouseDashboard = () => {
    const t = useTranslation();
    const { regions, emirates, centers, locations, farms, greenHouseTypes, coverTypes, language: lang } = useStore(st => st);
    
    // Geographic filters
    const [region, setRegion] = useState(null);
    const [emirate, setEmirate] = useState(null);
    const [center, setCenter] = useState(null);
    const [location, setLocation] = useState(null);
    
    // Greenhouse filters
    const [selectedGreenhouseType, setSelectedGreenhouseType] = useState(null);
    const [selectedCoverType, setSelectedCoverType] = useState(null);
    const [isExporting, setIsExporting] = useState(false);
    
    const isLTR = lang.includes('en');
    const areaUnit = t('translation.sqmUnit');

    const formatAreaRangeLabel = useCallback((min, max) => {
        if (max === Infinity) {
            return `${min}+ ${areaUnit}`;
        }

        return `${min}-${max} ${areaUnit}`;
    }, [areaUnit]);

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
        if (!emirate) return centers;
        return centers.filter(c => c.emirateId === emirate.id);
    }, [emirate, centers]);

    // Filtered locations based on emirate and/or center selection
    const filteredLocations = useMemo(() => {
        if (!emirate && !center) return locations;

        return locations.filter((locationItem) => {
            const relatedCenter = centers.find((item) => item.id === locationItem.centerId);
            const locationEmirateId = locationItem.emirateId || relatedCenter?.emirateId;

            if (emirate && locationEmirateId !== emirate.id) return false;
            if (center && locationItem.centerId !== center.id) return false;
            return true;
        });
    }, [emirate, center, locations, centers]);

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

    // First filter farms by location filters
    const locationFilteredFarms = useMemo(() => {
        let fFarms = farms.filter(farm => farm.crops.greenhouses && farm.crops.greenhouses.length > 0);
        
        if (region) {
            fFarms = fFarms.filter(farm => farm.region === region.id);
        }
        if (emirate) {
            fFarms = fFarms.filter(farm => farm.emirate === emirate.id);
        }
        if (center) {
            fFarms = fFarms.filter(farm => farm.serviceCenter === center.id);
        }
        if (location) {
            fFarms = fFarms.filter(farm => farm.location === location.id);
        }
        
        return fFarms;
    }, [center, emirate, location, farms, region]);

    // Then create a filtered list with only matching greenhouses
    const filteredFarms = useMemo(() => {
        return locationFilteredFarms.map(farm => {
            // Filter greenhouses based on type filters
            let filteredGreenhouses = farm.crops.greenhouses;
            
            if (selectedGreenhouseType) {
                filteredGreenhouses = filteredGreenhouses.filter(gh => gh.greenhouseTypeId === selectedGreenhouseType.id);
            }
            
            if (selectedCoverType) {
                filteredGreenhouses = filteredGreenhouses.filter(gh => gh.coverTypeId === selectedCoverType.id);
            }
            
            // Return farm with filtered greenhouses
            return {
                ...farm,
                crops: {
                    ...farm.crops,
                    greenhouses: filteredGreenhouses
                }
            };
        }).filter(farm => farm.crops.greenhouses.length > 0); // Only keep farms that still have greenhouses after filtering
    }, [locationFilteredFarms, selectedGreenhouseType, selectedCoverType]);

    const analytics = useMemo(() => {
        // Total greenhouses count
        const totalGreenhouses = filteredFarms.reduce((sum, farm) => sum + farm.crops.greenhouses.length, 0);

        // Total greenhouse area
        const totalGreenhouseArea = filteredFarms.reduce((sum, farm) => {
            const farmGreenhouseArea = farm.crops.greenhouses.reduce((ghSum, gh) => {
                return ghSum + (Number(gh.firstCropHouseArea) || 0) + (Number(gh.secondCropHouseArea) || 0) + (Number(gh.thirdCropHouseArea) || 0);
            }, 0);
            return sum + farmGreenhouseArea;
        }, 0);

        // Average greenhouses per farm
        const avgGreenhousesPerFarm = filteredFarms.length > 0 ? (totalGreenhouses / filteredFarms.length).toFixed(2) : 0;

        // Average area per greenhouse
        const avgAreaPerGreenhouse = totalGreenhouses > 0 ? (totalGreenhouseArea / totalGreenhouses).toFixed(2) : 0;

        // Greenhouse Types Distribution
        const cooledCount = filteredFarms.reduce((sum, farm) => {
            return sum + farm.crops.greenhouses.filter(g => g.greenhouseTypeId === greenHouseTypes[0]?.id).length;
        }, 0);
        const nonCooledCount = totalGreenhouses - cooledCount;

        const greenhouseTypesData = [
            { name: t('analytics.greenhouseDashboard.cooled'), value: Number(((cooledCount / (totalGreenhouses || 1)) * 100).toFixed(2)), count: cooledCount, color: '#10b981' },
            { name: t('analytics.greenhouseDashboard.nonCooled'), value: Number(((nonCooledCount / (totalGreenhouses || 1)) * 100).toFixed(2)), count: nonCooledCount, color: '#6ee7b7' }
        ].filter(item => item.count > 0);

        // Cover Types Distribution
        const coverTypeCounts = {};
        let totalCoveredGreenhouses = 0;

        filteredFarms.forEach(farm => {
            farm.crops.greenhouses.forEach(greenhouse => {
                if (greenhouse.coverTypeId) {
                    coverTypeCounts[greenhouse.coverTypeId] = (coverTypeCounts[greenhouse.coverTypeId] || 0) + 1;
                    totalCoveredGreenhouses++;
                }
            });
        });

        const colors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
        const coverTypesData = Object.keys(coverTypeCounts).map((coverTypeId, index) => {
            const coverType = coverTypes.find(ct => ct.id === coverTypeId);
            const percentage = totalCoveredGreenhouses > 0 ? ((coverTypeCounts[coverTypeId] / totalCoveredGreenhouses) * 100).toFixed(2) : 0;
            return {
                name: coverType ? (isLTR ? coverType.name : coverType.nameInArrabic) : t('translation.other'),
                value: Number(percentage),
                count: coverTypeCounts[coverTypeId],
                color: colors[index % colors.length]
            };
        }).sort((a, b) => b.count - a.count);

        // Greenhouse Area by Emirate
        const emirateAreas = {};
        filteredFarms.forEach(farm => {
            const emirateId = farm.emirate;
            if (!emirateAreas[emirateId]) {
                emirateAreas[emirateId] = { area: 0, count: 0 };
            }
            farm.crops.greenhouses.forEach(greenhouse => {
                const greenhouseArea =
                    Number(greenhouse.firstCropHouseArea || 0) +
                    Number(greenhouse.secondCropHouseArea || 0) +
                    Number(greenhouse.thirdCropHouseArea || 0);
                emirateAreas[emirateId].area += greenhouseArea;
                emirateAreas[emirateId].count += 1;
            });
        });

        const emirateAreaData = Object.keys(emirateAreas).map(emirateId => {
            const emirateObj = emirates.find(e => e.id === emirateId);
            return {
                name: emirateObj ? (isLTR ? emirateObj.name : emirateObj.nameInArrabic) : t('translation.other'),
                value: Number(emirateAreas[emirateId].area.toFixed(2)),
                count: emirateAreas[emirateId].count,
                avgArea: Number((emirateAreas[emirateId].area / emirateAreas[emirateId].count).toFixed(2))
            };
        }).sort((a, b) => b.value - a.value).slice(0, 8);

        // Greenhouses per Farm Distribution
        const farmCounts = { '1': 0, '2': 0, '3': 0, '4-5': 0, '6+': 0 };
        filteredFarms.forEach(farm => {
            const greenhouseCount = farm.crops.greenhouses.length;
            if (greenhouseCount === 1) farmCounts['1']++;
            else if (greenhouseCount === 2) farmCounts['2']++;
            else if (greenhouseCount === 3) farmCounts['3']++;
            else if (greenhouseCount <= 5) farmCounts['4-5']++;
            else farmCounts['6+']++;
        });

        const greenhousesPerFarmData = Object.entries(farmCounts).map(([count, farms]) => ({
            count,
            farms
        }));

        // Top Farms by Greenhouse Area
        const topFarms = filteredFarms.map(farm => {
            let totalArea = 0;
            let totalGreenhouses = 0;
            
            farm.crops.greenhouses.forEach(greenhouse => {
                totalGreenhouses++;
                totalArea +=
                    (Number(greenhouse.firstCropHouseArea) || 0) +
                    (Number(greenhouse.secondCropHouseArea) || 0) +
                    (Number(greenhouse.thirdCropHouseArea) || 0);
            });
            
            const emirateObj = emirates.find(e => e.id === farm.emirate);
            const regionObj = regions.find(r => r.id === farm.region);
            const centerObj = centers.find(c => c.id === farm.serviceCenter);
            
            return {
                farmNo: farm.farmNo || farm.id,
                    emirate: emirateObj ? (isLTR ? emirateObj.name : emirateObj.nameInArrabic) : t('common.unknown'),
                    region: regionObj ? (isLTR ? regionObj.name : regionObj.nameInArrabic) : t('common.unknown'),
                    center: centerObj ? (isLTR ? centerObj.name : centerObj.nameInArrabic) : t('common.unknown'),
                greenhouses: totalGreenhouses,
                area: Number(totalArea.toFixed(2))
            };
        }).sort((a, b) => b.area - a.area).slice(0, 10);

        // Area Distribution by Size
        const sizeRanges = [
            { label: formatAreaRangeLabel(0, 1000), min: 0, max: 1000 },
            { label: formatAreaRangeLabel(1000, 2000), min: 1000, max: 2000 },
            { label: formatAreaRangeLabel(2000, 3000), min: 2000, max: 3000 },
            { label: formatAreaRangeLabel(3000, 5000), min: 3000, max: 5000 },
            { label: formatAreaRangeLabel(5000, Infinity), min: 5000, max: Infinity },
        ];

        const sizeDistribution = sizeRanges.map(range => {
            const count = filteredFarms.filter(farm => {
                const totalArea = farm.crops.greenhouses.reduce((sum, gh) => {
                    return sum + (Number(gh.firstCropHouseArea) || 0) + (Number(gh.secondCropHouseArea) || 0) + (Number(gh.thirdCropHouseArea) || 0);
                }, 0);
                return totalArea >= range.min && totalArea < range.max;
            }).length;
            return { size: range.label, farms: count };
        });

        return {
            totalFarms: filteredFarms.length,
            totalGreenhouses,
            totalGreenhouseArea: (totalGreenhouseArea / 10000).toFixed(2), // Convert to hectares
            avgGreenhousesPerFarm,
            avgAreaPerGreenhouse: (Number(avgAreaPerGreenhouse) / 10000).toFixed(2), // Convert to hectares
            greenhouseTypesData,
            coverTypesData,
            emirateAreaData,
            greenhousesPerFarmData,
            topFarms,
            sizeDistribution,
        };
    }, [filteredFarms, greenHouseTypes, coverTypes, emirates, regions, centers, isLTR]);

    // Clear all filters
    const clearAllFilters = () => {
        setRegion(null);
        setEmirate(null);
        setCenter(null);
        setLocation(null);
        setSelectedGreenhouseType(null);
        setSelectedCoverType(null);
    };

    // Count active filters
    const activeFiltersCount = [
        region,
        emirate,
        center,
        location,
        selectedGreenhouseType,
        selectedCoverType,
    ].filter(Boolean).length;

    // Export to Excel
    const exportToExcel = () => {
        setIsExporting(true);
        
        try {
            const wb = XLSX.utils.book_new();

            // Sheet 1: Summary
            const summaryData = [
                [t('analytics.greenhouseDashboard.summaryTitle')],
                [t('analytics.greenhouseDashboard.generatedOn'), new Date().toLocaleString()],
                [],
                [t('analytics.greenhouseDashboard.appliedFilters')],
                [t('analytics.greenhouseDashboard.region'), region ? (isLTR ? region.name : region.nameInArrabic) : t('filters.all')],
                [t('analytics.greenhouseDashboard.emirate'), emirate ? (isLTR ? emirate.name : emirate.nameInArrabic) : t('filters.all')],
                [t('analytics.greenhouseDashboard.center'), center ? (isLTR ? center.name : center.nameInArrabic) : t('filters.all')],
                [t('analytics.greenhouseDashboard.location'), location ? (isLTR ? location.name : location.nameInArrabic) : t('filters.all')],
                [t('analytics.greenhouseDashboard.greenhouseType'), selectedGreenhouseType ? (isLTR ? selectedGreenhouseType.name : selectedGreenhouseType.nameInArrabic) : t('filters.all')],
                [t('analytics.greenhouseDashboard.coverType'), selectedCoverType ? (isLTR ? selectedCoverType.name : selectedCoverType.nameInArrabic) : t('filters.all')],
                [],
                [t('analytics.greenhouseDashboard.metric'), t('analytics.greenhouseDashboard.value')],
                [`${t('translation.farmsWithGreenhouses')}`, analytics.totalFarms],
                [`${t('translation.totalGreenhouses')}`, analytics.totalGreenhouses],
                [t('analytics.greenhouseDashboard.totalGreenhouseAreaHa'), analytics.totalGreenhouseArea],
                [t('analytics.greenhouseDashboard.avgGreenhousesPerFarm'), analytics.avgGreenhousesPerFarm],
                [t('translation.avgAreaPerGreenhouse'), analytics.avgAreaPerGreenhouse],
            ];
            const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
            ws1['!cols'] = [{ wch: 35 }, { wch: 20 }];
            XLSX.utils.book_append_sheet(wb, ws1, t('analytics.greenhouseDashboard.sheetSummary'));

            // Sheet 2: Greenhouse Types
            const typesData = [
                [t('analytics.greenhouseDashboard.sheetGreenhouseTypes')],
                [],
                [t('analytics.greenhouseDashboard.colType'), t('analytics.greenhouseDashboard.colCount'), t('analytics.greenhouseDashboard.colPercentage')],
                ...analytics.greenhouseTypesData.map(item => [item.name, item.count, item.value + '%'])
            ];
            const ws2 = XLSX.utils.aoa_to_sheet(typesData);
            ws2['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 15 }];
            XLSX.utils.book_append_sheet(wb, ws2, t('analytics.greenhouseDashboard.sheetGreenhouseTypes'));

            // Sheet 3: Cover Types
            if (analytics.coverTypesData.length > 0) {
                const coverData = [
                    [t('analytics.greenhouseDashboard.sheetCoverTypes')],
                    [],
                    [t('analytics.greenhouseDashboard.colCoverType'), t('analytics.greenhouseDashboard.colCount'), t('analytics.greenhouseDashboard.colPercentage')],
                    ...analytics.coverTypesData.map(item => [item.name, item.count, item.value + '%'])
                ];
                const ws3 = XLSX.utils.aoa_to_sheet(coverData);
                ws3['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 15 }];
                XLSX.utils.book_append_sheet(wb, ws3, t('analytics.greenhouseDashboard.sheetCoverTypes'));
            }

            // Sheet 4: By Emirate
            const emirateData = [
                [t('analytics.greenhouseDashboard.sheetByEmirate')],
                [],
                [t('analytics.greenhouseDashboard.emirate'), t('analytics.greenhouseDashboard.colTotalAreaSqm'), t('analytics.greenhouseDashboard.colNumberOfGreenhouses'), t('analytics.greenhouseDashboard.colAverageAreaPerGreenhouseSqm')],
                ...analytics.emirateAreaData.map(item => [item.name, item.value, item.count, item.avgArea])
            ];
            const ws4 = XLSX.utils.aoa_to_sheet(emirateData);
            ws4['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 25 }, { wch: 35 }];
            XLSX.utils.book_append_sheet(wb, ws4, t('analytics.greenhouseDashboard.sheetByEmirate'));

            // Sheet 5: Greenhouses per Farm
            const perFarmData = [
                [t('analytics.greenhouseDashboard.sheetGreenhousesPerFarm')],
                [],
                [t('analytics.greenhouseDashboard.colNumberOfGreenhouses'), t('analytics.greenhouseDashboard.colNumberOfFarms')],
                ...analytics.greenhousesPerFarmData.map(item => [item.count, item.farms])
            ];
            const ws5 = XLSX.utils.aoa_to_sheet(perFarmData);
            ws5['!cols'] = [{ wch: 25 }, { wch: 20 }];
            XLSX.utils.book_append_sheet(wb, ws5, t('analytics.greenhouseDashboard.sheetGreenhousesPerFarm'));

            // Sheet 6: Top Farms
            const topFarmsData = [
                [t('analytics.greenhouseDashboard.sheetTopFarms')],
                [],
                [t('analytics.greenhouseDashboard.farmNo'), t('analytics.greenhouseDashboard.emirate'), t('analytics.greenhouseDashboard.region'), t('analytics.greenhouseDashboard.center'), t('analytics.greenhouseDashboard.greenhouses'), t('analytics.greenhouseDashboard.colTotalAreaSqm')],
                ...analytics.topFarms.map(farm => [
                    farm.farmNo,
                    farm.emirate,
                    farm.region,
                    farm.center,
                    farm.greenhouses,
                    farm.area
                ])
            ];
            const ws6 = XLSX.utils.aoa_to_sheet(topFarmsData);
                XLSX.utils.book_append_sheet(wb, ws6, t('analytics.greenhouseDashboard.sheetTopFarms'));
            XLSX.utils.book_append_sheet(wb, ws6, 'Top Farms');

            // Sheet 7: Area Distribution
            const sizeData = [
                ['Greenhouse Area Distribution'],
                [],
                ['Area Range (sqm)', 'Number of Farms'],
                ...analytics.sizeDistribution.map(item => [item.size, item.farms])
            ];
            const ws7 = XLSX.utils.aoa_to_sheet(sizeData);
            ws7['!cols'] = [{ wch: 20 }, { wch: 20 }];
            XLSX.utils.book_append_sheet(wb, ws7, 'Area Distribution');

            // Generate and download
            const timestamp = new Date().toISOString().split('T')[0];
            const filename = `Greenhouse_Analytics_${timestamp}.xlsx`;
            XLSX.writeFile(wb, filename);
            
        } catch (error) {
            console.error('Export failed:', error);
            toast.error(t('common.exportFailed'));
        } finally {
            setIsExporting(false);
        }
    };

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white px-4 py-3 rounded-lg shadow-lg border border-gray-200">
                    <p className="text-sm font-semibold text-gray-900 mb-1">
                        {payload[0].payload.name || payload[0].name}
                    </p>
                    {payload.map((entry, index) => (
                        <p key={index} className="text-xs text-gray-600">
                            <span className="font-medium">{entry.name}:</span>{' '}
                            <span className="font-bold" style={{ color: entry.color }}>{entry.value}</span>
                            {entry.payload.count && <span className="text-gray-500"> ({entry.payload.count})</span>}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    const StatCard = ({ icon: Icon, value, label, unit, gradient }) => (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 group">
            <div className="flex items-start justify-between mb-3">
                <div className={`p-3 rounded-xl ${gradient} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
                {value}
                {unit && <span className="text-lg text-gray-500 ml-1">{unit}</span>}
            </div>
            <div className="text-sm font-medium text-gray-600">{label}</div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50">
            {/* Header Section */}
            <div className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-[1920px] mx-auto px-6 py-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg">
                                <Home className="w-6 h-6 text-white" strokeWidth={2.5} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">{t('analytics.greenhouseDashboard.title')}</h1>
                                <p className="text-sm text-gray-500 mt-0.5">{t('translation.greenhouseAnalytics')}</p>
                            </div>
                        </div>
                        <button
                            onClick={exportToExcel}
                            disabled={isExporting}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Download className="w-4 h-4" />
                                            {isExporting ? t('analytics.greenhouseDashboard.exporting') : t('analytics.greenhouseDashboard.exportReport')}
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
                                    {t("filters.geographic")}
                                </span>
                            </div>

                            <Dropdown
                                options={getLocalizedOptions(regions)}
                                value={region}
                                classes='min-w-[180px]'
                                onChange={setRegion}
                                placeholder={t('analytics.greenhouseDashboard.selectRegion')}
                            />
                            <Dropdown
                                options={getLocalizedOptions(emirates)}
                                value={emirate}
                                classes='min-w-[180px]'
                                onChange={handleEmirateChange}
                                placeholder={t('analytics.greenhouseDashboard.selectEmirate')}
                            />
                            <Dropdown
                                options={getLocalizedOptions(filteredCenters)}
                                value={center}
                                classes='min-w-[180px]'
                                onChange={handleCenterChange}
                                placeholder={t('analytics.greenhouseDashboard.selectCenter')}
                                disabled={!emirate}
                            />
                            <Dropdown
                                options={getLocalizedOptions(filteredLocations)}
                                value={location}
                                classes='min-w-[180px]'
                                onChange={setLocation}
                                placeholder={t('overview.selectLocation')}
                                disabled={!emirate && !center}
                            />
                        </div>

                        {/* Greenhouse Filters */}
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
                                options={greenHouseTypes}
                                value={selectedGreenhouseType}
                                classes='min-w-[180px]'
                                onChange={setSelectedGreenhouseType}
                                placeholder={t("translation.selectGreenhouseType")}
                            />
                            <Dropdown
                                options={coverTypes}
                                value={selectedCoverType}
                                classes='min-w-[180px]'
                                onChange={setSelectedCoverType}
                                placeholder={t("translation.selectCoverType")}
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
            </div>

            <div className="max-w-[1920px] mx-auto px-6 py-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                    <StatCard
                        icon={Home}
                        value={analytics.totalFarms.toLocaleString()}
                        label={t('translation.farmsWithGreenhouses')}
                        gradient="bg-gradient-to-br from-blue-500 to-blue-600"
                    />
                    <StatCard
                        icon={Grid3x3}
                        value={analytics.totalGreenhouses.toLocaleString()}
                        label={t('translation.totalGreenhouses')}
                        gradient="bg-gradient-to-br from-emerald-500 to-emerald-600"
                    />
                    <StatCard
                        icon={Layers}
                        value={analytics.totalGreenhouseArea}
                        unit="ha"
                        label={t('translation.totalGreenhouseArea')}
                        gradient="bg-gradient-to-br from-teal-500 to-cyan-600"
                    />
                    <StatCard
                        icon={Activity}
                        value={analytics.avgGreenhousesPerFarm}
                        label={t('translation.avgGreenhousesPerFarm')}
                        gradient="bg-gradient-to-br from-purple-500 to-purple-600"
                    />
                    <StatCard
                        icon={TrendingUp}
                        value={analytics.avgAreaPerGreenhouse}
                        unit="ha"
                        label={t('translation.avgAreaPerGreenhouse')}
                        gradient="bg-gradient-to-br from-amber-500 to-amber-600"
                    />
                </div>

                {/* Charts Section - Row 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
                    {/* Greenhouse Types Chart */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2 mb-4">
                            <Home className="w-5 h-5 text-emerald-600" />
                            <h2 className="text-base font-bold text-gray-900">{t('analytics.greenhouseDashboard.greenhouseTypes')}</h2>
                        </div>
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie
                                    data={analytics.greenhouseTypesData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ value }) => `${value}%`}
                                    outerRadius={90}
                                    innerRadius={50}
                                    fill="#8884d8"
                                    dataKey="value"
                                    strokeWidth={2}
                                    stroke="#fff"
                                >
                                    {analytics.greenhouseTypesData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex justify-center gap-4 mt-4 flex-wrap">
                            {analytics.greenhouseTypesData.map((entry, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                                    <span className="text-sm text-gray-700 font-medium">{entry.name}</span>
                                    <span className="text-xs text-gray-500">({entry.count})</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Cover Types Chart */}
                    {analytics.coverTypesData.length > 0 && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2 mb-4">
                                <Layers className="w-5 h-5 text-blue-600" />
                                <h2 className="text-base font-bold text-gray-900">{t('analytics.greenhouseDashboard.coverTypes')}</h2>
                            </div>
                            <ResponsiveContainer width="100%" height={280}>
                                <PieChart>
                                    <Pie
                                        data={analytics.coverTypesData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ value }) => `${value}%`}
                                        outerRadius={90}
                                        innerRadius={50}
                                        fill="#8884d8"
                                        dataKey="value"
                                        strokeWidth={2}
                                        stroke="#fff"
                                    >
                                        {analytics.coverTypesData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="flex justify-center gap-3 mt-4 flex-wrap">
                                {analytics.coverTypesData.map((entry, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                                        <span className="text-xs text-gray-700 font-medium">{entry.name}</span>
                                        <span className="text-xs text-gray-500">({entry.count})</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Greenhouses Per Farm Chart */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2 mb-4">
                            <BarChart3 className="w-5 h-5 text-amber-600" />
                            <h2 className="text-base font-bold text-gray-900">{t('analytics.greenhouseDashboard.greenhousesPerFarm')}</h2>
                        </div>
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={analytics.greenhousesPerFarmData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                <XAxis 
                                    dataKey="count" 
                                    tick={{ fontSize: 11, fill: '#6b7280' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis 
                                    tick={{ fontSize: 11, fill: '#374151' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar 
                                    dataKey="farms" 
                                    fill="#3b82f6" 
                                    radius={[8, 8, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Charts Section - Row 2 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Emirate Area Chart */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2 mb-4">
                            <MapPin className="w-5 h-5 text-purple-600" />
                            <h2 className="text-base font-bold text-gray-900">{t('analytics.greenhouseDashboard.totalGreenhouseAreaByEmirate')}</h2>
                        </div>
                        <ResponsiveContainer width="100%" height={320}>
                            <BarChart data={analytics.emirateAreaData} layout="vertical" margin={{ left: 10 }}>
                                <XAxis 
                                    type="number" 
                                    tick={{ fontSize: 11, fill: '#6b7280' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis 
                                    type="category" 
                                    dataKey="name" 
                                    width={90} 
                                    tick={{ fontSize: 11, fill: '#374151' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar 
                                    dataKey="value" 
                                    fill="#10b981" 
                                    radius={[0, 8, 8, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Area Distribution */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2 mb-4">
                            <Activity className="w-5 h-5 text-cyan-600" />
                            <h2 className="text-base font-bold text-gray-900">{t('translation.farmSizeDistribution')}</h2>
                        </div>
                        <ResponsiveContainer width="100%" height={320}>
                            <BarChart data={analytics.sizeDistribution} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                <XAxis 
                                    dataKey="size" 
                                    tick={{ fontSize: 11, fill: '#6b7280' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis 
                                    tick={{ fontSize: 11, fill: '#374151' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar 
                                    dataKey="farms" 
                                    fill="#06B6D4" 
                                    radius={[8, 8, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Farms Table */}
                {analytics.topFarms.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-rose-100">
                                    <TrendingUp className="w-5 h-5 text-rose-600" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">{t('analytics.greenhouseDashboard.topFarmsByGreenhouseArea')}</h2>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                    <tr>
                                        <th className="text-left px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">{t('analytics.greenhouseDashboard.rank')}</th>
                                        <th className="text-left px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">
                                            {t('analytics.greenhouseDashboard.farmNo')}
                                        </th>
                                        <th className="text-left px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">
                                            {t('analytics.greenhouseDashboard.emirate')}
                                        </th>
                                        <th className="text-left px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">
                                            {t('analytics.greenhouseDashboard.region')}
                                        </th>
                                        <th className="text-left px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">{t('analytics.greenhouseDashboard.center')}</th>
                                        <th className="text-left px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">
                                            {t('analytics.greenhouseDashboard.greenhouses')}
                                        </th>
                                        <th className="text-left px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">
                                            {t('analytics.greenhouseDashboard.greenhouseAreaHa')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {analytics.topFarms.map((farm, index) => (
                                        <tr key={farm.farmNo} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm">
                                                    {index + 1}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-semibold text-gray-900">{farm.farmNo}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-gray-700">{farm.emirate}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-gray-700">{farm.region}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-gray-700">{farm.center}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-50 text-xs font-semibold text-blue-700 border border-blue-200">
                                                    <Home className="w-3.5 h-3.5" />
                                                    {farm.greenhouses}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-3 py-1 rounded-lg bg-emerald-50 text-xs font-bold text-emerald-700 border border-emerald-200">
                                                    {farm.area.toLocaleString()} {areaUnit}
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

export default GreenhouseDashboard;