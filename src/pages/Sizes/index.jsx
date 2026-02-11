import React, { useState, useMemo, useCallback } from 'react';
import { Download, TrendingUp, MapPin, BarChart3, PieChart as PieChartIcon, Activity, Layers, Grid3x3, X, SlidersHorizontal } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, LineChart, Line, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ComposedChart } from 'recharts';
import useStore from '../../store/store';
import useTranslation from '../../hooks/useTranslation';
import Dropdown from '../../components/dropdown';
import * as XLSX from 'xlsx';

const Sizes = () => {
    const { farms, emirates, centers, locations, language: lang } = useStore(st => st);
    const t = useTranslation();
    const isLTR = lang.includes('en');
    const [isExporting, setIsExporting] = useState(false);
    
    // Geographic filters
    const [emirate, setEmirate] = useState(null);
    const [center, setCenter] = useState(null);
    const [location, setLocation] = useState(null);

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

    const activeFiltersCount = [emirate, center, location].filter(Boolean).length;

    const clearAllFilters = () => {
        setEmirate(null);
        setCenter(null);
        setLocation(null);
    };

    // Filter farms based on geographic filters
    const filteredFarms = useMemo(() => {
        let result = farms;
        
        if (emirate) {
            result = result.filter(farm => farm.emirate === emirate.id);
        }
        
        if (center) {
            result = result.filter(farm => farm.serviceCenter === center.id);
        }
        
        if (location) {
            result = result.filter(farm => farm.location === location.id);
        }
        
        return result;
    }, [farms, emirate, center, location]);

    const ranges = [
        { label: '0-500', min: 0, max: 500 },
        { label: '500-1K', min: 500, max: 1000 },
        { label: '1K-1.5K', min: 1000, max: 1500 },
        { label: '1.5K-2K', min: 1500, max: 2000 },
        { label: '2K-2.5K', min: 2000, max: 2500 },
        { label: '2.5K+', min: 2500, max: Infinity },
    ];

    const rangeColors = {
        '0-500': '#8B5CF6',
        '500-1K': '#06B6D4',
        '1K-1.5K': '#F59E0B',
        '1.5K-2K': '#10B981',
        '2K-2.5K': '#6366F1',
        '2.5K+': '#EF4444',
    };

    const CHART_COLORS = ['#0078D4', '#00BCF2', '#0099BC', '#005A9E', '#004578', '#10B981', '#F59E0B', '#EF4444'];

    // Size Distribution Data
    const sizeDistributionData = useMemo(() => {
        return ranges.map(range => {
            const count = filteredFarms.filter(f => {
                const size = Number(f.size);
                return !isNaN(size) && size >= range.min && size < range.max;
            }).length;
            return { size: range.label, farms: count };
        });
    }, [filteredFarms]);

    // Size by Emirate Data
    const sizeByEmirateData = useMemo(() => {
        const emirateData = {};
        filteredFarms.forEach(farm => {
            const emirateObj = emirates.find(e => e.id === farm.emirate);
            const emirateName = emirateObj ? (isLTR ? emirateObj.name : emirateObj.nameInArrabic) : 'Other';
            const size = Number(farm.size) || 0;
            
            if (!emirateData[emirateName]) {
                emirateData[emirateName] = { name: emirateName, totalSize: 0, count: 0, avgSize: 0 };
            }
            emirateData[emirateName].totalSize += size;
            emirateData[emirateName].count += 1;
        });

        return Object.values(emirateData)
            .map(item => ({
                ...item,
                avgSize: item.count > 0 ? parseFloat((item.totalSize / item.count).toFixed(2)) : 0
            }))
            .sort((a, b) => b.totalSize - a.totalSize)
            .slice(0, 7);
    }, [filteredFarms, emirates, isLTR]);

    // Size by Center Data
    const sizeByCenterData = useMemo(() => {
        const centerData = {};
        filteredFarms.forEach(farm => {
            const centerObj = centers.find(c => c.id === farm.serviceCenter);
            const centerName = centerObj ? (isLTR ? centerObj.name : centerObj.nameInArrabic) : 'Other';
            const size = Number(farm.size) || 0;
            
            if (!centerData[centerName]) {
                centerData[centerName] = { name: centerName, totalSize: 0, count: 0, avgSize: 0 };
            }
            centerData[centerName].totalSize += size;
            centerData[centerName].count += 1;
        });

        return Object.values(centerData)
            .map(item => ({
                ...item,
                avgSize: item.count > 0 ? parseFloat((item.totalSize / item.count).toFixed(2)) : 0
            }))
            .sort((a, b) => b.totalSize - a.totalSize)
            .slice(0, 8);
    }, [filteredFarms, centers, isLTR]);

    // Average Size by Emirate (Pie Chart)
    const avgSizeByEmirateData = useMemo(() => {
        const emirateData = {};
        filteredFarms.forEach(farm => {
            const emirateObj = emirates.find(e => e.id === farm.emirate);
            const emirateName = emirateObj ? (isLTR ? emirateObj.name : emirateObj.nameInArrabic) : 'Other';
            const size = Number(farm.size) || 0;
            
            if (!emirateData[emirateName]) {
                emirateData[emirateName] = { name: emirateName, totalSize: 0, count: 0 };
            }
            emirateData[emirateName].totalSize += size;
            emirateData[emirateName].count += 1;
        });

        return Object.values(emirateData)
            .map(item => ({
                name: item.name,
                value: item.count > 0 ? parseFloat((item.totalSize / item.count).toFixed(2)) : 0,
                count: item.count
            }))
            .filter(item => item.value > 0)
            .sort((a, b) => b.value - a.value)
            .slice(0, 6);
    }, [filteredFarms, emirates, isLTR]);

    // Size Range Distribution (Pie Chart)
    const sizeRangePieData = useMemo(() => {
        const total = sizeDistributionData.reduce((sum, item) => sum + item.farms, 0);
        return sizeDistributionData
            .filter(item => item.farms > 0)
            .map(item => ({
                name: item.size,
                value: item.farms,
                percentage: ((item.farms / total) * 100).toFixed(1)
            }));
    }, [sizeDistributionData]);

    // Cumulative Size Distribution
    const cumulativeSizeData = useMemo(() => {
        let cumulative = 0;
        return sizeDistributionData.map(item => {
            cumulative += item.farms;
            return {
                size: item.size,
                farms: item.farms,
                cumulative: cumulative
            };
        });
    }, [sizeDistributionData]);

    // Radar Chart Data for Emirates
    const radarChartData = useMemo(() => {
        return sizeByEmirateData.slice(0, 6).map(item => ({
            emirate: item.name.substring(0, 10),
            avgSize: item.avgSize,
            count: item.count,
            totalSize: item.totalSize / 1000 // Convert to thousands
        }));
    }, [sizeByEmirateData]);

    // Combined Emirate Analysis
    const combinedEmirateData = useMemo(() => {
        return sizeByEmirateData.map(item => ({
            name: item.name,
            avgSize: item.avgSize,
            count: item.count,
            totalSize: item.totalSize
        }));
    }, [sizeByEmirateData]);

    // Size trend data (simulated distribution curve)
    const sizeTrendData = useMemo(() => {
        const allSizes = filteredFarms.map(f => Number(f.size) || 0).filter(s => s > 0).sort((a, b) => a - b);
        const step = Math.ceil(allSizes.length / 20);
        const trendData = [];
        
        for (let i = 0; i < allSizes.length; i += step) {
            const chunk = allSizes.slice(i, i + step);
            const avg = chunk.reduce((sum, val) => sum + val, 0) / chunk.length;
            trendData.push({
                index: Math.floor(i / step),
                avgSize: parseFloat(avg.toFixed(2)),
                count: chunk.length
            });
        }
        return trendData;
    }, [filteredFarms]);

    const totalFarms = sizeDistributionData.reduce((sum, item) => sum + item.farms, 0);
    const largestCategory = sizeDistributionData.reduce((max, item) => item.farms > max.farms ? item : max, sizeDistributionData[0]);
    const totalArea = filteredFarms.reduce((sum, farm) => sum + (Number(farm.size) || 0), 0);
    const avgFarmSize = totalFarms > 0 ? (totalArea / totalFarms).toFixed(2) : 0;
    const medianSize = useMemo(() => {
        const sizes = filteredFarms.map(f => Number(f.size) || 0).filter(s => s > 0).sort((a, b) => a - b);
        const mid = Math.floor(sizes.length / 2);
        return sizes.length > 0 ? (sizes.length % 2 !== 0 ? sizes[mid] : (sizes[mid - 1] + sizes[mid]) / 2).toFixed(2) : 0;
    }, [filteredFarms]);

    // Export to Excel function
    const exportToExcel = () => {
        setIsExporting(true);
        
        try {
            const wb = XLSX.utils.book_new();

            // Sheet 1: Summary Statistics
            const summaryData = [
                ['Farm Size Analytics Dashboard'],
                ['Generated on:', new Date().toLocaleString()],
                [],
                ['Filters Applied:'],
                ['Emirate:', emirate ? (isLTR ? emirate.name : emirate.nameInArrabic) : 'All'],
                ['Center:', center ? (isLTR ? center.name : center.nameInArrabic) : 'All'],
                ['Location:', location ? (isLTR ? location.name : location.nameInArrabic) : 'All'],
                [],
                ['Metric', 'Value', 'Unit'],
                ['Total Farms', totalFarms, 'farms'],
                ['Total Area', totalArea.toFixed(2), 'sqm'],
                ['Average Farm Size', avgFarmSize, 'sqm'],
                ['Median Farm Size', medianSize, 'sqm'],
                ['Most Common Size Range', largestCategory.size, ''],
                ['Farms in Most Common Range', largestCategory.farms, 'farms'],
            ];
            const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
            
            // Set column widths
            ws1['!cols'] = [{ wch: 30 }, { wch: 20 }, { wch: 10 }];
            
            XLSX.utils.book_append_sheet(wb, ws1, 'Summary');

            // Sheet 2: Size Distribution
            const sizeDistData = [
                ['Farm Size Distribution'],
                [],
                ['Size Range', 'Number of Farms', 'Percentage'],
                ...sizeDistributionData.map(item => {
                    const percentage = totalFarms > 0 ? ((item.farms / totalFarms) * 100).toFixed(2) : 0;
                    return [item.size, item.farms, percentage + '%'];
                })
            ];
            const ws2 = XLSX.utils.aoa_to_sheet(sizeDistData);
            ws2['!cols'] = [{ wch: 15 }, { wch: 20 }, { wch: 15 }];
            XLSX.utils.book_append_sheet(wb, ws2, 'Size Distribution');

            // Sheet 3: Emirate Analysis
            const emirateData = [
                ['Farm Size Analysis by Emirate'],
                [],
                ['Emirate', 'Total Size (sqm)', 'Number of Farms', 'Average Size (sqm)'],
                ...sizeByEmirateData.map(item => [
                    item.name,
                    item.totalSize.toFixed(2),
                    item.count,
                    item.avgSize.toFixed(2)
                ])
            ];
            const ws3 = XLSX.utils.aoa_to_sheet(emirateData);
            ws3['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 20 }, { wch: 20 }];
            XLSX.utils.book_append_sheet(wb, ws3, 'Emirate Analysis');

            // Sheet 4: Service Center Analysis
            const centerData = [
                ['Farm Size Analysis by Service Center'],
                [],
                ['Service Center', 'Total Size (sqm)', 'Number of Farms', 'Average Size (sqm)'],
                ...sizeByCenterData.map(item => [
                    item.name,
                    item.totalSize.toFixed(2),
                    item.count,
                    item.avgSize.toFixed(2)
                ])
            ];
            const ws4 = XLSX.utils.aoa_to_sheet(centerData);
            ws4['!cols'] = [{ wch: 30 }, { wch: 20 }, { wch: 20 }, { wch: 20 }];
            XLSX.utils.book_append_sheet(wb, ws4, 'Service Center Analysis');

            // Sheet 5: Cumulative Distribution
            const cumulativeData = [
                ['Cumulative Farm Size Distribution'],
                [],
                ['Size Range', 'Farms in Range', 'Cumulative Farms'],
                ...cumulativeSizeData.map(item => [
                    item.size,
                    item.farms,
                    item.cumulative
                ])
            ];
            const ws5 = XLSX.utils.aoa_to_sheet(cumulativeData);
            ws5['!cols'] = [{ wch: 15 }, { wch: 20 }, { wch: 20 }];
            XLSX.utils.book_append_sheet(wb, ws5, 'Cumulative Distribution');

            // Sheet 6: All Farms Detail
            const farmsDetail = [
                ['All Farms Detailed Data'],
                [],
                ['Farm ID', 'Emirate', 'Service Center', 'Size (sqm)'],
                ...filteredFarms.map(farm => {
                    const emirateObj = emirates.find(e => e.id === farm.emirate);
                    const centerObj = centers.find(c => c.id === farm.serviceCenter);
                    return [
                        farm.id || '',
                        emirateObj ? (isLTR ? emirateObj.name : emirateObj.nameInArrabic) : 'N/A',
                        centerObj ? (isLTR ? centerObj.name : centerObj.nameInArrabic) : 'N/A',
                        Number(farm.size) || 0
                    ];
                })
            ];
            const ws6 = XLSX.utils.aoa_to_sheet(farmsDetail);
            ws6['!cols'] = [{ wch: 15 }, { wch: 25 }, { wch: 30 }, { wch: 15 }];
            XLSX.utils.book_append_sheet(wb, ws6, 'All Farms Detail');

            // Generate and download
            const timestamp = new Date().toISOString().split('T')[0];
            const filename = `Farm_Size_Analytics_${timestamp}.xlsx`;
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
                        {payload[0].payload.size || payload[0].payload.name || payload[0].payload.emirate}
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

    return (
        <div className="h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50 flex flex-col overflow-hidden">
            {/* Header Bar */}
            <div className="bg-white border-b border-gray-200 shadow-sm">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg shadow-md">
                                <BarChart3 className="w-5 h-5 text-white" strokeWidth={2} />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-gray-900">
                                    {t('sizes.title') || 'Farm Size Analytics Dashboard'}
                                </h2>
                                <p className="text-xs text-gray-500 mt-0.5">
                                   {t('translation.summary')}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={exportToExcel}
                            disabled={isExporting}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all text-sm border bg-white text-gray-700 border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Download className="w-4 h-4" />
                            <span>{isExporting ? 'Exporting...' : 'Export'}</span>
                        </button>
                    </div>

                    {/* Filters Row */}
                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2 mr-2">
                            <div className="p-1.5 bg-blue-500 rounded-lg">
                                <MapPin className="w-4 h-4 text-white" strokeWidth={2} />
                            </div>
                            <span className="text-sm font-semibold text-gray-900">
                                {t("filters.geographic") || "Filters"}
                            </span>
                            {activeFiltersCount > 0 && (
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                                    {activeFiltersCount}
                                </span>
                            )}
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

                        {activeFiltersCount > 0 && (
                            <button
                                onClick={clearAllFilters}
                                className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-semibold transition-colors text-sm border border-red-200 shadow-sm"
                            >
                                <X className="w-4 h-4" />
                                <span>{t("filters.clearAll") || "Clear All"}</span>
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
                                <span className="text-sm font-medium text-gray-600">{t('translation.totalFarms')}</span>
                                <MapPin className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="text-3xl font-bold text-gray-900">{totalFarms.toLocaleString()}</div>
                            <div className="text-xs text-gray-500 mt-1">{t('translation.totalFarms')}</div>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-600">{t('translation.totalArea')}</span>
                                <TrendingUp className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div className="text-3xl font-bold text-gray-900">{totalArea.toLocaleString()}</div>
                            <div className="text-xs text-gray-500 mt-1">{t('translation.sqmUnit')}</div>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-600">{t('translation.avgSize')}</span>
                                <Activity className="w-5 h-5 text-purple-600" />
                            </div>
                            <div className="text-3xl font-bold text-gray-900">{parseFloat(avgFarmSize).toLocaleString()}</div>
                            <div className="text-xs text-gray-500 mt-1">{t('translation.sqmPerFarm')}</div>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-600">{t('translation.medianSize')}</span>
                                <Layers className="w-5 h-5 text-cyan-600" />
                            </div>
                            <div className="text-3xl font-bold text-gray-900">{parseFloat(medianSize).toLocaleString()}</div>
                            <div className="text-xs text-gray-500 mt-1">{t('translation.sqmUnit')}</div>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-600">{t('translation.mostCommon')}</span>
                                <Grid3x3 className="w-5 h-5 text-amber-600" />
                            </div>
                            <div className="text-3xl font-bold text-gray-900">{largestCategory.size}</div>
                            <div className="text-xs text-gray-500 mt-1">{largestCategory.farms} {t('translation.farmsUnit')}</div>
                        </div>
                    </div>

                    {/* Charts Grid - Row 1 */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
                        {/* Main Size Distribution */}
                        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2 mb-4">
                                <BarChart3 className="w-5 h-5 text-emerald-600" />
                                <h3 className="text-base font-bold text-gray-900">{t('translation.farmSizeDistribution')}</h3>
                            </div>
                            <ResponsiveContainer width="100%" height={320}>
                                <BarChart data={sizeDistributionData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                    <XAxis 
                                        dataKey="size" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 500 }} 
                                    />
                                    <YAxis 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fontSize: 11, fill: '#6b7280' }}
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} />
                                    <Bar 
                                        dataKey="farms" 
                                        radius={[8, 8, 0, 0]}
                                        maxBarSize={60}
                                    >
                                        {sizeDistributionData.map((entry, index) => (
                                            <Cell 
                                                key={`cell-${index}`} 
                                                fill={rangeColors[entry.size]}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Size Range Distribution Pie */}
                        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2 mb-4">
                                <PieChartIcon className="w-5 h-5 text-blue-600" />
                                <h3 className="text-base font-bold text-gray-900">{t('translation.sizeRangeDistribution')}</h3>
                            </div>
                            <ResponsiveContainer width="100%" height={320}>
                                <PieChart>
                                    <Pie
                                        data={sizeRangePieData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ percentage, name }) => `${name}: ${percentage}%`}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {sizeRangePieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={rangeColors[entry.name]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Cumulative Distribution */}
                        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2 mb-4">
                                <TrendingUp className="w-5 h-5 text-cyan-600" />
                                <h3 className="text-base font-bold text-gray-900">{t('translation.cumulativeDistribution')}</h3>
                            </div>
                            <ResponsiveContainer width="100%" height={320}>
                                <AreaChart data={cumulativeSizeData}>
                                    <XAxis dataKey="size" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area 
                                        type="monotone" 
                                        dataKey="cumulative" 
                                        stroke="#06B6D4" 
                                        fill="#06B6D4" 
                                        fillOpacity={0.6}
                                        strokeWidth={2}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Charts Grid - Row 2 */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
                        {/* Total Size by Emirate */}
                        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2 mb-4">
                                <MapPin className="w-5 h-5 text-blue-600" />
                                <h3 className="text-base font-bold text-gray-900">{t('translation.totalSizeByEmirate')}</h3>
                            </div>
                            <ResponsiveContainer width="100%" height={320}>
                                <BarChart data={sizeByEmirateData} layout="vertical" margin={{ left: 10 }}>
                                    <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="totalSize" fill="#0078D4" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Average Size by Emirate */}
                        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2 mb-4">
                                <Activity className="w-5 h-5 text-emerald-600" />
                                <h3 className="text-base font-bold text-gray-900">{t('translation.avgSizeByEmirate')}</h3>
                            </div>
                            <ResponsiveContainer width="100%" height={320}>
                                <BarChart data={sizeByEmirateData} layout="vertical" margin={{ left: 10 }}>
                                    <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="avgSize" fill="#10B981" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Farm Count by Emirate */}
                        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2 mb-4">
                                <Grid3x3 className="w-5 h-5 text-amber-600" />
                                <h3 className="text-base font-bold text-gray-900">{t('translation.totalSizeByEmirate')}</h3>
                            </div>
                            <ResponsiveContainer width="100%" height={320}>
                                <BarChart data={sizeByEmirateData} layout="vertical" margin={{ left: 10 }}>
                                    <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="count" fill="#F59E0B" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Charts Grid - Row 3 */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {/* Combined Emirate Analysis */}
                        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2 mb-4">
                                <BarChart3 className="w-5 h-5 text-purple-600" />
                                <h3 className="text-base font-bold text-gray-900">{t('translation.multiMetricEmirate')}</h3>
                            </div>
                            <ResponsiveContainer width="100%" height={320}>
                                <ComposedChart data={combinedEmirateData} margin={{ bottom: 40, left: -10 }}>
                                    <XAxis 
                                        dataKey="name" 
                                        angle={-45} 
                                        textAnchor="end" 
                                        tick={{ fontSize: 10 }} 
                                        height={80}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis yAxisId="left" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar yAxisId="left" dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                                    <Line yAxisId="right" type="monotone" dataKey="avgSize" stroke="#EF4444" strokeWidth={2} dot={{ r: 4 }} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Total Size by Service Center */}
                        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2 mb-4">
                                <Layers className="w-5 h-5 text-indigo-600" />
                                <h3 className="text-base font-bold text-gray-900">{t('translation.sizeByServiceCenter')}</h3>
                            </div>
                            <ResponsiveContainer width="100%" height={320}>
                                <BarChart data={sizeByCenterData} layout="vertical" margin={{ left: 10 }}>
                                    <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="totalSize" fill="#6366F1" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Emirate Performance Radar */}
                        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2 mb-4">
                                <Activity className="w-5 h-5 text-rose-600" />
                                <h3 className="text-base font-bold text-gray-900">{t('translation.emirateRadar')}</h3>
                            </div>
                            <ResponsiveContainer width="100%" height={320}>
                                <RadarChart data={radarChartData}>
                                    <PolarGrid stroke="#e5e7eb" />
                                    <PolarAngleAxis dataKey="emirate" tick={{ fontSize: 10, fill: '#6b7280' }} />
                                    <PolarRadiusAxis angle={90} tick={{ fontSize: 10 }} />
                                    <Radar name="Avg Size" dataKey="avgSize" stroke="#10B981" fill="#10B981" fillOpacity={0.5} />
                                    <Tooltip content={<CustomTooltip />} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Sizes;