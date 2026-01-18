import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronDown, X, Expand, MapPin, Droplets, Building2, Leaf, TrendingUp, Filter, BarChart3, Grid3x3 } from 'lucide-react';
import GoogleMapWithClustering from '../components/mapCluster';
import useStore from '../store/store';
import farmService from '../services/farmService'
import Dropdown from '../components/dropdown';
import { toast } from 'react-toastify';
import FarmDetails from './manage-farms/farmDetails';
import { formatNumberWithUnits } from '../utils';
import { FarmUpdateForm } from './manage-farms/form';
import { useTranslation } from '../hooks/useTranslation';

const Overview = () => {
  const t = useTranslation();
  const [isExpanded] = useState(false);
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const { farms, emirates, centers, locations, irrigationSystems, farmingSystems, language: lang } = useStore(st => st);
  const [emirate, setEmirate] = useState(null);
  const [center, setCenter] = useState(null);
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [location, setLocation] = useState(null);
  const [irrigationSystem, setIrrigationSystem] = useState(null);
  const [farmingSystem, setFarmingSystem] = useState(null);
  const [showFilters, setShowFilters] = useState(true);
  const isLTR = lang.includes('en');

  // Helper function to localize dropdown options
  const getLocalizedOptions = useCallback((options) => {
    if (!options) return [];
    return options.map(option => ({
      ...option,
      name: isLTR ? option.name : (option.nameInArrabic || option.name),
      originalName: option.name // Keep original for reference if needed
    }));
  }, [isLTR]);

  // Filtered options based on selections
  const filteredCenters = useMemo(() => {
    if (!emirate) return centers;
    // Filter centers that belong to the selected emirate
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

  const filteredIrrigationSystems = useMemo(() => {
    if (!emirate && !center && !location) return irrigationSystems;
    
    let relevantFarms = farms;
    
    if (emirate) {
      relevantFarms = relevantFarms.filter(farm => farm.emirate === emirate.id);
    }
    
    if (center) {
      relevantFarms = relevantFarms.filter(farm => farm.serviceCenter === center.id);
    }
    
    if (location) {
      relevantFarms = relevantFarms.filter(farm => farm.location === location.id);
    }
    
    const irrigationIds = new Set();
    relevantFarms.forEach(farm => {
      if (Array.isArray(farm.irrigationSystem)) {
        farm.irrigationSystem.forEach(id => irrigationIds.add(id));
      }
    });
    
    return irrigationSystems.filter(sys => irrigationIds.has(sys.id));
  }, [emirate, center, location, irrigationSystems, farms]);

  const filteredFarmingSystems = useMemo(() => {
    if (!emirate && !center && !location && !irrigationSystem) return farmingSystems;
    
    let relevantFarms = farms;
    
    if (emirate) {
      relevantFarms = relevantFarms.filter(farm => farm.emirate === emirate.id);
    }
    
    if (center) {
      relevantFarms = relevantFarms.filter(farm => farm.serviceCenter === center.id);
    }
    
    if (location) {
      relevantFarms = relevantFarms.filter(farm => farm.location === location.id);
    }
    
    if (irrigationSystem) {
      relevantFarms = relevantFarms.filter(farm => 
        Array.isArray(farm.irrigationSystem) && farm.irrigationSystem.includes(irrigationSystem.id)
      );
    }
    
    const farmingIds = new Set();
    relevantFarms.forEach(farm => {
      if (Array.isArray(farm.farmingSystem)) {
        farm.farmingSystem.forEach(id => farmingIds.add(id));
      }
    });
    
    return farmingSystems.filter(sys => farmingIds.has(sys.id));
  }, [emirate, center, location, irrigationSystem, farmingSystems, farms]);

  // Handle emirate change - reset dependent filters
  const handleEmirateChange = (value) => {
    setEmirate(value);
    setCenter(null);
    setLocation(null);
    setIrrigationSystem(null);
    setFarmingSystem(null);
  };

  // Handle center change - reset dependent filters
  const handleCenterChange = (value) => {
    setCenter(value);
    setLocation(null);
    setIrrigationSystem(null);
    setFarmingSystem(null);
  };

  // Handle location change - reset dependent filters
  const handleLocationChange = (value) => {
    setLocation(value);
    setIrrigationSystem(null);
    setFarmingSystem(null);
  };

  // Handle irrigation system change - reset dependent filters
  const handleIrrigationSystemChange = (value) => {
    setIrrigationSystem(value);
    setFarmingSystem(null);
  };

  const StatCard = ({ title, value, change, changeType, color = 'green', icon: Icon }) => (
    <div 
      className="group relative bg-white p-6 rounded-3xl border border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden" 
      dir={isLTR ? 'ltr' : 'rtl'}
    >
      {/* Animated gradient overlay */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500 ${
        color === 'green' ? 'bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600' : 
        color === 'blue' ? 'bg-gradient-to-br from-blue-400 via-cyan-500 to-sky-600' : 
        'bg-gradient-to-br from-purple-400 via-violet-500 to-indigo-600'
      }`}></div>
      
      {/* Decorative element */}
      <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-500 ${
        color === 'green' ? 'bg-green-500' : 
        color === 'blue' ? 'bg-blue-500' : 
        'bg-purple-500'
      }`}></div>
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-5">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-1.5 h-1.5 rounded-full ${
                color === 'green' ? 'bg-green-500' : 
                color === 'blue' ? 'bg-blue-500' : 
                'bg-purple-500'
              } animate-pulse`}></div>
              <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">{title}</h3>
            </div>
            <div className="text-3xl lg:text-4xl font-black text-gray-900 mb-2 tracking-tight">{value}</div>
          </div>
          {Icon && (
            <div className={`p-4 rounded-2xl shadow-sm ${
              color === 'green' ? 'bg-gradient-to-br from-green-50 to-emerald-50 text-green-600' : 
              color === 'blue' ? 'bg-gradient-to-br from-blue-50 to-cyan-50 text-blue-600' : 
              'bg-gradient-to-br from-purple-50 to-indigo-50 text-purple-600'
            } group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
              <Icon className="w-7 h-7" strokeWidth={2.5} />
            </div>
          )}
        </div>
        {change && (
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${
            color === 'green' ? 'bg-green-50 text-green-700' : 
            color === 'blue' ? 'bg-blue-50 text-blue-700' : 
            'bg-purple-50 text-purple-700'
          }`}>
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{change}</span>
          </div>
        )}
      </div>
    </div>
  );

  const [expanded, setExpanded] = useState({});

  const handleExpand = (title) => {
    setExpanded((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const transformFarms = useMemo(() => {
    let filteredFarms = farms;
    if (emirate) {
      filteredFarms = farms.filter((it) => it.emirate === emirate?.id);
    }
    if (center) {
      filteredFarms = filteredFarms.filter((it) => it.serviceCenter === center?.id);
    }
    if (location) {
      filteredFarms = filteredFarms.filter((it) => it.location === location?.id);
    }
    if (irrigationSystem) {
      filteredFarms = filteredFarms.filter((it) => it.irrigationSystem.includes(irrigationSystem?.id));
    }
    if (farmingSystem) {
      filteredFarms = filteredFarms.filter((it) => it.farmingSystem.includes(farmingSystem?.id));
    }
    return filteredFarms;
  }, [farms, emirate, center, location, irrigationSystem, farmingSystem]);

  const noOfWells = useMemo(() => {
    return transformFarms.reduce((total, item) => {
      const value = Number(item.numberOfProductionWells);
      return isNaN(value) ? total : total + value;
    }, 0);
  }, [transformFarms]);

  useEffect(() => {
    const rest = transformFarms.reduce(
      (totals, farm) => {
        const { crops, landUse } = farm;

        const fruitArea = (crops?.fruits || []).reduce((sum, f) => {
          const val = Number(f.area);
          return isNaN(val) ? sum : sum + val;
        }, 0);

        const vegetableArea = (crops?.vegetables || []).reduce((sum, v) => {
          const val = Number(v.area);
          return isNaN(val) ? sum : sum + val;
        }, 0);

        const fodderArea = (crops?.fieldCropsFodder || []).reduce((sum, f) => {
          const val = Number(f.area);
          return isNaN(val) ? sum : sum + val;
        }, 0);

        const arrable = landUse?.arrableLand || {};
        const nonArrable = landUse?.nonArrableLand || {};
        const nurseries = Number(arrable.nurseries);
        const barrenLand = Number(nonArrable.barrenLand);

        return {
          fruits: totals.fruits + fruitArea,
          vegetables: totals.vegetables + vegetableArea,
          fodders: totals.fodders + fodderArea,
          nurseries: totals.nurseries + (isNaN(nurseries) ? 0 : nurseries),
          barrenLand: totals.barrenLand + (isNaN(barrenLand) ? 0 : barrenLand),
        };
      },
      { fruits: 0, vegetables: 0, fodders: 0, nurseries: 0, barrenLand: 0 }
    );

    setCategories([
      {
        title: t('overview.vegetable'),
        items: [
          { label: t('overview.totalVegetablesArea'), value: formatNumberWithUnits(rest.vegetables) },
        ],
        gradient: 'from-green-400 via-emerald-500 to-teal-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-100',
        textColor: 'text-green-700',
        iconBg: 'bg-green-100',
      },
      {
        title: t('overview.fruits'),
        items: [
          { label: t('overview.totalFruitsArea'), value: formatNumberWithUnits(rest.fruits) },
        ],
        gradient: 'from-orange-400 via-red-500 to-rose-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-100',
        textColor: 'text-orange-700',
        iconBg: 'bg-orange-100',
      },
      {
        title: t('overview.crops'),
        items: [
          { label: t('overview.totalCropsArea'), value: formatNumberWithUnits(rest.fodders) },
        ],
        gradient: 'from-amber-400 via-yellow-500 to-orange-600',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-100',
        textColor: 'text-amber-700',
        iconBg: 'bg-amber-100',
      },
      {
        title: t('overview.uncultivated'),
        items: [
          { label: t('overview.totalUncultivatedArea'), value: formatNumberWithUnits(rest.barrenLand) },
        ],
        gradient: 'from-gray-400 via-slate-500 to-zinc-600',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-100',
        textColor: 'text-gray-700',
        iconBg: 'bg-gray-100',
      },
      {
        title: t('overview.nurseries'),
        items: [
          { label: t('overview.totalNurseries'), value: formatNumberWithUnits(rest.nurseries) },
        ],
        gradient: 'from-purple-400 via-violet-500 to-indigo-600',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-100',
        textColor: 'text-purple-700',
        iconBg: 'bg-purple-100',
      },
    ])
  }, [t, transformFarms]);

  const handleFarmClick = (farm) => {
    farmService.getfarmById(farm.id).then(res => {
      setSelectedFarm(res.data);
      setActiveTab('farm-details');
    }).catch(err => {
      toast.error(err.response?.data?.message || err.message);
    });
  };

  const submitFarmHandler = useCallback(async (item, id) => {
    farmService.updateFarm(item, id).then(() => {
      setSelectedFarm(null);
      setActiveTab('overview');
      toast.success('Updated successfully');
      sessionStorage.removeItem('selectedFarm');
    }).catch(err => {
      toast.error(err.response?.data?.message || err.message);
    });
  }, []);

  const handleEdit = async (item) => {
    farmService.getFarmByIdWithoutPopulatingFields(item.id).then(res => {
      setSelectedFarm(res.data);
      setActiveTab('farm-edit');
    }).catch(err => {
      toast.error(err.response?.data?.message || err.message);
    });
  };

  const activeFiltersCount = [emirate, center, location, irrigationSystem, farmingSystem].filter(Boolean).length;

  return activeTab.includes("overview") ? (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100">
      {/* Modern Header with Filters */}
      <div className="bg-white/90 backdrop-blur-2xl border-b border-gray-200/70 shadow-lg sticky top-0 z-50">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-5">
          {/* Header Row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg shadow-green-500/30">
                  <Grid3x3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-black text-gray-900 tracking-tight">Dashboard Overview</h1>
                  <p className="text-sm text-gray-500 font-medium">Farm analytics & insights</p>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
                showFilters 
                  ? 'bg-green-600 text-white shadow-lg shadow-green-500/30 hover:bg-green-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
              {activeFiltersCount > 0 && (
                <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>

          {/* Filters Row - Collapsible */}
          <div 
            className={`relative transition-all duration-500 ease-in-out ${
              showFilters ? 'max-h-96 opacity-100 mb-2' : 'max-h-0 opacity-0 overflow-hidden'
            }`}
            style={{ zIndex: 100 }}
          >
            <div className="flex flex-wrap gap-3 items-center pt-2 relative z-[100]">
              <div className="relative z-[100]">
                <Dropdown
                  options={getLocalizedOptions(emirates)}
                  value={emirate}
                  onChange={handleEmirateChange}
                  placeholder={t('overview.selectEmirate')}
                />
              </div>
              <div className="relative z-[90]">
                <Dropdown
                  options={getLocalizedOptions(filteredCenters)}
                  value={center}
                  onChange={handleCenterChange}
                  placeholder={t('overview.selectCenter')}
                  disabled={!emirate}
                />
              </div>
              <div className="relative z-[80]">
                <Dropdown
                  options={getLocalizedOptions(filteredLocations)}
                  value={location}
                  onChange={handleLocationChange}
                  placeholder={t('overview.selectLocation')}
                  disabled={!emirate && !center}
                />
              </div>
              <div className="relative z-[70]">
                <Dropdown
                  options={getLocalizedOptions(filteredIrrigationSystems)}
                  value={irrigationSystem}
                  onChange={handleIrrigationSystemChange}
                  placeholder={t('overview.irrigationSystem')}
                  disabled={!emirate && !center && !location}
                />
              </div>
              <div className="relative z-[60]">
                <Dropdown
                  options={getLocalizedOptions(filteredFarmingSystems)}
                  value={farmingSystem}
                  onChange={setFarmingSystem}
                  placeholder={t('overview.farmingSystem')}
                  disabled={!emirate && !center && !location && !irrigationSystem}
                />
              </div>
              
              {activeFiltersCount > 0 && (
                <button
                  className="group relative px-5 py-2.5 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-semibold rounded-xl shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 transition-all duration-300 hover:-translate-y-0.5 z-50"
                  onClick={() => {
                    setEmirate(null);
                    setCenter(null);
                    setLocation(null);
                    setFarmingSystem(null);
                    setIrrigationSystem(null);
                  }}
                >
                  <span className="flex items-center gap-2">
                    <X className="w-4 h-4" />
                    {t('overview.clearAllFilter')}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-140px)]">
        {/* Main Content Area */}
        <div className="flex-1 relative order-2 lg:order-1">
          <div className="p-4 sm:p-6 lg:p-8">
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
              <StatCard
                title={t('overview.totalFarms')}
                value={formatNumberWithUnits(transformFarms.length)}
                // change="100% from last month"
                changeType="increase"
                color="green"
                icon={MapPin}
              />
              <StatCard
                title={t('overview.totalWells')}
                value={formatNumberWithUnits(noOfWells)}
                // change="100% from last week"
                changeType="increase"
                color="blue"
                icon={Droplets}
              />
            </div>

            {/* Map Section */}
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <MapPin className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{t('overview.farmLocation')}</h2>
                    <p className="text-sm text-gray-500">{t('overview.farmLocationSub')}</p>
                  </div>
                </div>
              </div>
              <div className="p-2">
                <GoogleMapWithClustering farms={transformFarms} onFarmClick={handleFarmClick} />
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Sidebar */}
        <div className="w-full lg:w-[440px] xl:w-[500px] bg-gradient-to-b from-white/60 to-gray-50/60 backdrop-blur-xl border-l border-gray-200/70 p-5 sm:p-6 lg:p-8 space-y-6 order-1 lg:order-2 overflow-y-auto max-h-screen">
          {/* Cultivated Area Card */}
          <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm rounded-3xl -mx-2 px-2 py-4">
            <StatCard
              title={t('overview.totalCultivatedArea')}
              value="3,537 m²"
              // change="100% from last year"
              changeType="increase"
              color="green"
              icon={Leaf}
            />
          </div>

          {/* Categories Section */}
          <div className="space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-lg shadow-emerald-500/30">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-black text-gray-900">{t('overview.landDistribution')}</h2>
            </div>

            {categories.map((cat) => (
              <div 
                key={cat.title} 
                className="group relative bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-500"
              >
                {/* Top gradient accent */}
                <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${cat.gradient}`}></div>
                
                {/* Decorative corner gradient */}
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${cat.gradient} opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-500 rounded-bl-full`}></div>
                
                <div className="relative p-6">
                  <div className={`${isLTR ? 'flex-row' : 'flex-row-reverse'} flex justify-between items-center mb-4`}>
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${cat.iconBg} ${cat.textColor}`}>
                        <div className="w-2 h-2 rounded-full bg-current"></div>
                      </div>
                      <span className={`font-black text-lg ${cat.textColor}`}>{cat.title}</span>
                    </div>
                    <button
                      className={`p-2.5 rounded-xl ${cat.bgColor} ${cat.textColor} hover:scale-110 transition-all duration-300 shadow-sm`}
                      onClick={() => handleExpand(cat.title)}
                      aria-label={expanded[cat.title] ? "Collapse" : "Expand"}
                    >
                      <ChevronDown
                        className="w-5 h-5"
                        style={{
                          transform: expanded[cat.title] ? "rotate(180deg)" : "none",
                          transition: "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
                        }}
                      />
                    </button>
                  </div>
                  
                  <div 
                    className="overflow-hidden transition-all duration-500 ease-in-out"
                    style={{
                      maxHeight: expanded[cat.title] ? '600px' : '0',
                      opacity: expanded[cat.title] ? 1 : 0,
                    }}
                  >
                    <div className="flex flex-col gap-3 pt-4">
                      {cat.items.length > 0 ? (
                        cat.items.map((item, idx) => (
                          <div 
                            key={idx} 
                            className={`relative ${cat.bgColor} rounded-2xl p-5 border-2 ${cat.borderColor} hover:shadow-lg hover:scale-[1.02] transition-all duration-300`}
                          >
                            {/* Mini gradient accent */}
                            <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${cat.gradient} rounded-l-2xl`}></div>
                            
                            <div className="relative pl-3">
                              <div className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">{item.label}</div>
                              <div className={`text-3xl font-black ${cat.textColor} tracking-tight`}>{item.value}</div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-gray-400 text-center py-6 italic font-medium">
                          {t('overview.noData')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  ) : activeTab.includes('farm-details') ? (
    <FarmDetails
      farm={selectedFarm}
      handleEdit={handleEdit}
      handleBack={() => {
        setActiveTab('overview');
        setSelectedFarm(null);
      }}
    />
  ) : (
    <FarmUpdateForm
      farm={selectedFarm}
      onSave={submitFarmHandler}
      onCancel={() => {
        setActiveTab('overview');
        setSelectedFarm(null);
      }}
    />
  );
};

export default Overview;