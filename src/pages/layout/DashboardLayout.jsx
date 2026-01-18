import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, BarChart3, MapPin, Layers, Wheat, Sprout, TrendingUp, Settings, HelpCircle, User, Globe, X, Maximize2, Search, Bell, TrendingUpDown, Grid2X2Plus, List, Newspaper, Users, Flag, ListMusic, ShieldHalf, Footprints, ArrowUp01, Ship, SunSnow, AudioWaveform, Dam, House, LogOut, Sticker, BarChart2 } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import Overview from '../Overview';
import Emirates from '../Emirates/index';
import Sizes from '../Sizes/index';
import logo from '../../assets/logo.png'
import CropsDashboard from '../Crops/index';
import Crops from '../master-data/crops';
import EmiratesManagment from '../master-data/emirate';
import Varities from '../master-data/Varieties';
import ArticleCategories from '../articles/category';
import SubCategories from '../articles/subCategories';
import Articles from '../articles/articles';
import FarmCodingRequest from '../FarmCoding';
import AdminControl from '../AdminControl';
import Coders from '../coders';
import Farmers from '../farmers';
import ManageFarms from '../manage-farms';
import Possessions from '../master-data/possession';
import FarmingSystem from '../master-data/farmingSystem';
import Regions from '../master-data/regions';
import CropTypes from '../master-data/cropTypes';
import CultivationMethods from '../master-data/cultivationMethods';
import Locations from '../master-data/locations';
import GreenHouseTypes from '../master-data/greenHouseTypes';
import WaterSources from '../master-data/waterSources';
import CourageTypes from '../master-data/courageTypes';
import Seasons from '../master-data/seasons';
import Centers from '../master-data/center';
import FodderTypes from '../master-data/fodderTypes';
import CoverTypes from '../master-data/coverTypes';
import FruitTypes from '../master-data/fruitTypes';
import VegetableTypes from '../master-data/vegetableTypes';
import IrrigationSystem from '../master-data/irrigationSystem';
import ExternalIrrigationSystem from '../master-data/externalIrrigationSystem';
import { generateOTP } from '../../utils';
import useStore from '../../store/store';
import { useNavigate } from "react-router-dom";
import LiveStocks from '../master-data/livestock';
import GreenhouseDashboard from '../GreenhouseDashboard';
import FarmAnalytics from '../farmsAnalytics';

const DashboardLayout = () => {
  const t = useTranslation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [farmsNumber, setFarmsNumber] = useState(1);
  const { language, setLanguage } = useStore(st => st);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const isRTL = language.includes('ar');
  const directionClass = isRTL ? 'rtl' : 'ltr';

  const handleLogout = () => {
    if (window.confirm(t('common.components.dashboard.logout') + "?")) {
      sessionStorage.removeItem("adminToken");
      navigate('/');
    }
  };

  const handleChange = (e) => {
    const selectedLang = e.target.value;
    setLanguage(selectedLang);
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setSidebarCollapsed(isMobile);
  }, [isMobile]);

  const handleSidebarToggle = () => setSidebarCollapsed((prev) => !prev);

  const [expandedSections, setExpandedSections] = useState({
    analytics: false,
    payment: false,
    analyticsSubmenu: false,
    'admin-controls': false
  });

  const [selectedPage, setSelectedPage] = useState('overview');

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const menuItems = [
    {
      id: 'analytics',
      icon: BarChart3,
      label: t('common.components.dashboard.analytics'),
      hasSubmenu: true,
      submenuItems: [
        { id: 'overview', icon: BarChart3, label: t('common.components.dashboard.overview') },
        { id: 'emirates', icon: MapPin, label: t('common.components.dashboard.emirates') },
        { id: 'sizes', icon: Layers, label: t('common.components.dashboard.sizes') },
        { id: 'crops', icon: Wheat, label: t('common.components.dashboard.crops') },
        { id: 'greenhouseDashboard', icon: BarChart2, label: t('common.components.dashboard.greenhouses') },
        { id: 'farmAnalytics', icon: BarChart2, label: t('common.components.dashboard.farmAnalytics') },
      ]
    },
    {
      id: 'codingRequests',
      icon: Layers,
      label: t('common.components.dashboard.farmCoding'),
      hasSubmenu: false,
    },
    { id: 'manageFarms', icon: BarChart3, label: t('common.components.dashboard.manageFarms') },
    { id: 'manageCoders', icon: Users, label: t('common.components.dashboard.manageCoders') },
    { id: 'manageFarmers', icon: Users, label: t('common.components.dashboard.manageFarmers') },
  ];

  const otherItems = [
    {
      id: 'master-data',
      icon: Grid2X2Plus,
      label: t('common.components.dashboard.masterData'),
      hasSubmenu: true,
      submenuItems: [
        // { id: 'master management', icon: Wheat, label: t('common.components.dashboard.cropsManagement') },
        { id: 'Fruit Types', icon: Wheat, label: t('common.components.dashboard.fruitTypes') },
        { id: 'Vegetable Types', icon: Wheat, label: t('common.components.dashboard.vegetableTypes') },
        { id: 'Cover Types', icon: Wheat, label: t('common.components.dashboard.coverTypes') },
        { id: 'Fodder Types', icon: Wheat, label: t('common.components.dashboard.fodderTypes') },
        { id: 'varieties', icon: TrendingUpDown, label: t('common.components.dashboard.varieties') },
        { id: 'regions', icon: ShieldHalf, label: t('common.components.dashboard.regions') },
        { id: 'emirates management', icon: Flag, label: t('common.components.dashboard.emiratesManagement') },
        { id: 'centers management', icon: Flag, label: t('common.components.dashboard.centersManagement') },
        { id: 'locations', icon: MapPin, label: t('common.components.dashboard.locations') },
        { id: 'article categories', icon: List, label: t('common.components.dashboard.articleCategories') },
        { id: 'article sub categories', icon: List, label: t('common.components.dashboard.subCategories') },
        { id: 'articles', icon: Newspaper, label: t('common.components.dashboard.articles') },
        { id: 'possessions', icon: ListMusic, label: t('common.components.dashboard.possessions') },
        { id: 'farming-system', icon: Footprints, label: t('common.components.dashboard.farmingSystems') },
        // { id: 'crop-types', icon: Sprout, label: t('common.components.dashboard.cropTypes') },
        { id: 'irrigation-system', icon: Ship, label: t('common.components.dashboard.irrigationSystem') },
        { id: 'external-irrigation-system', icon: AudioWaveform, label: t('common.components.dashboard.externalIrrigationSystem') },
        { id: 'green-house-types', icon: House, label: t('common.components.dashboard.greenHouseTypes') },
        { id: 'water-sources', icon: Dam, label: t('common.components.dashboard.waterSources') },
        { id: 'seasons', icon: SunSnow, label: t('common.components.dashboard.seasons') },
        { id: 'livestocks', icon: Sticker, label: t('common.components.dashboard.livestocks') },
      ]
    },
    {
      id: 'admin-controls',
      icon: TrendingUp,
      label: t('common.components.dashboard.adminControls'),
      hasSubmenu: true,
      submenuItems: [
        { id: 'addAdmin', icon: BarChart3, label: t('common.components.dashboard.addAdmin') },
        { id: 'manageAdmins', icon: BarChart3, label: t('common.components.dashboard.manageAdmins') },
      ]
    },
    { id: 'settings', icon: Settings, label: t('common.components.dashboard.settings') },
    { id: 'help', icon: HelpCircle, label: t('common.components.dashboard.helpCenter') }
  ];

  const MainContent = () => {
    const renderComponent = () => {
      switch (selectedPage) {
        case 'overview':
          return <Overview />;
        case 'emirates':
          return <Emirates />;
        case 'sizes':
          return <Sizes />;
        case 'crops':
          return <CropsDashboard />;
        case 'master management':
          return <Crops />;
        case 'manageFarmers':
          return <Farmers number={farmsNumber} />;
        case 'article categories':
          return <ArticleCategories />;
        case 'article sub categories':
          return <SubCategories />;
        case 'articles':
          return <Articles />;
        case 'emirates management':
          return <EmiratesManagment />;
        case 'centers management':
          return <Centers />;
        case 'Fruit Types':
          return <FruitTypes />;
        case 'Vegetable Types':
          return <VegetableTypes />;
        case 'Cover Types':
          return <CoverTypes />;
        case 'Fodder Types':
          return <FodderTypes />;
        case 'varieties':
          return <Varities />;
        case 'livestocks':
          return <LiveStocks />;
        case 'codingRequests':
          return <FarmCodingRequest />;
        case 'addAdmin':
          return <AdminControl />;
        case 'manageCoders':
          return <Coders />;
        case 'manageFarms':
          return <ManageFarms number={farmsNumber} />;
        case 'possessions':
          return <Possessions />;
        case 'farming-system':
          return <FarmingSystem />;
        case 'regions':
          return <Regions />;
        case 'crop-types':
          return <CropTypes />;
        case 'cultivation-methods':
          return <CultivationMethods />;
        case 'locations':
          return <Locations />;
        case 'irrigation-system':
          return <IrrigationSystem />;
        case 'external-irrigation-system':
          return <ExternalIrrigationSystem />;
        case 'green-house-types':
          return <GreenHouseTypes />;
        case 'water-sources':
          return <WaterSources />;
        case 'courage-types':
          return <CourageTypes />;
        case 'seasons':
          return <Seasons />;
        case 'greenhouseDashboard':
          return <GreenhouseDashboard />;
        case 'farmAnalytics':
          return <FarmAnalytics />;
        default:
          return <Overview />;
      }
    };

    return (
      <div className="flex-1 bg-gray-50 overflow-auto">
        {renderComponent()}
      </div>
    );
  };

  const menuClickedHandler = (item) => {
    if (item.hasSubmenu) {
      toggleSection(item.id);
    } else {
      setSelectedPage(item.id);
    }
  }

  return (
    <div className={`flex h-screen bg-gray-100 ${directionClass}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Sidebar */}
      <div
        className={`bg-white shadow-lg flex flex-col border-gray-300 transition-all duration-300
          ${sidebarCollapsed ? 'w-16' : 'w-72'}
          ${isMobile ? 'fixed z-40 h-full top-0' : ''}
          ${isRTL ? 'border-l-2' : 'border-r-2'}
          ${isRTL && isMobile ? 'right-0' : ''}
          ${!isRTL && isMobile ? 'left-0' : ''}
        `}
        style={isMobile ? { minWidth: sidebarCollapsed ? '4rem' : '16rem' } : {}}
      >
        {/* Logo Section */}
        <div className={`px-2 md:px-6 py-2 h-[80px] md:h-[100px] flex items-center justify-between`}>
          <div className="flex items-center justify-center w-full">
            <img 
              src={logo} 
              alt="" 
              className={`h-[72px] md:h-24 max-w-18 ${sidebarCollapsed ? 'w-12 md:w-full' : 'w-16 md:w-full'}`} 
            />
          </div>
          <button
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            onClick={handleSidebarToggle}
            aria-label="Toggle sidebar"
          >
            <Maximize2 className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className={`flex-1 p-2 md:p-4 ${sidebarCollapsed ? 'px-1 md:px-2' : ''} overflow-y-auto`}>
          <div className="space-y-2">
            {menuItems.map((item) => (
              <div key={item.id}>
                <button
                  onClick={() => {
                    menuClickedHandler(item)
                    if (item.id.includes('manageFarms') || item.id.includes('manageFarmers')) {
                      setFarmsNumber(generateOTP());
                    }
                  }}
                  className={`w-full cursor-pointer flex items-center justify-between px-2 md:px-3 py-2 text-xs md:text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors
                    ${selectedPage === item.id ? 'bg-green-600 text-white' : 'text-gray-600'}
                    ${sidebarCollapsed ? 'justify-center' : ''}
                  `}
                >
                  <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : `${isRTL ? 'space-x-reverse' : ''} space-x-2 md:space-x-3`}`}>
                    <item.icon className="w-5 h-5" />
                    {!sidebarCollapsed && <span>{item.label}</span>}
                  </div>
                  {item.hasSubmenu && !sidebarCollapsed && (
                    expandedSections[item.id] ? 
                      <ChevronDown className="w-4 h-4" /> : 
                      <ChevronRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
                  )}
                </button>
                {item.hasSubmenu && expandedSections[item.id] && !sidebarCollapsed && (
                  <div className={`mt-2 space-y-1 ${isRTL ? 'mr-2 md:mr-4' : 'ml-2 md:ml-4'}`}>
                    {item.submenuItems.map((subItem) => (
                      <button
                        key={subItem.id}
                        onClick={() => setSelectedPage(subItem.id)}
                        className={`w-full flex cursor-pointer items-center px-2 md:px-3 py-2 text-xs md:text-sm rounded-lg transition-colors 
                          ${isRTL ? 'space-x-reverse space-x-2 md:space-x-3' : 'space-x-2 md:space-x-3'}
                          ${selectedPage === subItem.id ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-100'}
                        `}
                      >
                        <subItem.icon className="w-4 h-4" />
                        <span>{subItem.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Other Items Section */}
          <div className="mt-6 md:mt-8">
            {!sidebarCollapsed && (
              <p className={`px-2 md:px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('common.components.dashboard.others')}
              </p>
            )}
            <div className="space-y-1">
              {otherItems.map((item) => (
                <div key={item.id}>
                  <button
                    onClick={() => menuClickedHandler(item)}
                    className={`w-full flex cursor-pointer items-center justify-between px-2 md:px-3 py-2 text-xs md:text-sm rounded-lg transition-colors
                      ${selectedPage === item.id ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-100'}
                      ${sidebarCollapsed ? 'justify-center' : ''}
                    `}
                  >
                    <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : `${isRTL ? 'space-x-reverse' : ''} space-x-2 md:space-x-3`}`}>
                      <item.icon className="w-4 h-4" />
                      {!sidebarCollapsed && <span>{item.label}</span>}
                    </div>
                    {item.hasSubmenu && !sidebarCollapsed && (
                      expandedSections[item.id] ? 
                        <ChevronDown className="w-4 h-4" /> : 
                        <ChevronRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
                    )}
                  </button>
                  {item.hasSubmenu && expandedSections[item.id] && !sidebarCollapsed && (
                    <div className={`mt-2 space-y-1 ${isRTL ? 'mr-2 md:mr-4' : 'ml-2 md:ml-4'}`}>
                      {item.submenuItems.map((subItem) => (
                        <button
                          key={subItem.id}
                          onClick={() => setSelectedPage(subItem.id)}
                          className={`w-full flex cursor-pointer items-center px-2 md:px-3 py-2 text-xs md:text-sm rounded-lg transition-colors
                            ${isRTL ? 'space-x-reverse space-x-2 md:space-x-3' : 'space-x-2 md:space-x-3'}
                            ${selectedPage === subItem.id ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-100'}
                          `}
                        >
                          <subItem.icon className="w-4 h-4" />
                          <span>{subItem.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </nav>

        {/* User Profile Section */}
        <div className="relative">
          <div
            className="p-2 sm:p-3 md:p-4 border-t cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => setOpen(p => !p)}
          >
            <div className={`flex items-center ${sidebarCollapsed ? "justify-center" : "justify-between"}`}>
              <div className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} gap-2`}>
                <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-600" />
                </div>
                {!sidebarCollapsed && (
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs sm:text-sm md:text-base font-medium text-gray-800 truncate ${isRTL ? 'text-right' : 'text-left'}`}>
                      {t('common.components.dashboard.adminName')}
                    </p>
                    <p className={`text-[10px] sm:text-xs text-gray-500 truncate hidden sm:block ${isRTL ? 'text-right' : 'text-left'}`}>
                      {t('common.components.dashboard.adminRole')}
                    </p>
                  </div>
                )}
              </div>
              {!sidebarCollapsed && (
                <svg
                  className={`w-3 h-3 sm:w-4 sm:h-4 text-gray-400 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </div>
          </div>

          {open && (
            <>
              <div className="fixed inset-0 z-10 md:hidden" onClick={() => setOpen(false)} />
              <div className={`
                absolute z-20 bg-white border rounded-lg shadow-lg
                ${sidebarCollapsed
                  ? `bottom-full ${isRTL ? 'right-1/2 translate-x-1/2' : 'left-1/2 -translate-x-1/2'} mb-2 w-10 md:w-48`
                  : `bottom-full mb-2 ${isRTL ? 'right-2 left-2 sm:left-auto' : 'left-2 right-2 sm:right-2 sm:left-auto'} sm:w-56`
                }
              `}>
                <div className="py-1">
                  <button
                    onClick={handleLogout}
                    className={`flex items-center w-full px-3 sm:px-4 py-2 text-xs sm:text-sm text-red-600 hover:bg-red-50 transition-colors ${isRTL ? 'space-x-reverse' : ''}`}
                  >
                    <LogOut className={`w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    <span className="truncate">{t('common.components.dashboard.logout')}</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 ${isMobile ? (isRTL ? 'mr-[65px]' : 'ml-[65px]') : ''}`}>
        {/* Header */}
        <header className="bg-white border-b px-2 md:px-6 py-2 md:py-3">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between w-full gap-2 md:gap-0">
            <div className="flex flex-col">
              <h1 className={`text-lg md:text-2xl font-semibold text-gray-800 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('common.components.dashboard.greeting')} <span className="inline-block">👋</span>
              </h1>
              <p className={`text-xs md:text-[14px] text-gray-600 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('common.components.dashboard.welcome')}
              </p>
            </div>
            <div className={`flex items-center gap-2 md:gap-4 mt-2 md:mt-0 w-40 md:w-auto flex-wrap ${isRTL ? 'flex-row-reverse' : ''}`}>
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <Search className="w-5 h-5 text-gray-700" />
              </button>
              <span className='text-xl md:text-2xl mb-1 text-gray-600'>|</span>
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <Bell className="w-5 h-5 text-gray-700" />
              </button>
              <button
                className={`px-2 md:px-3 py-1 text-xs md:text-sm mx-2 md:mx-6 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center ${isRTL ? 'space-x-reverse' : ''} gap-1 md:gap-2`}
                onClick={handleSidebarToggle}
              >
                <Maximize2 className="w-4 h-4 text-gray-700" />
                <span className="hidden md:inline">{t('common.components.dashboard.expand')}</span>
              </button>
              <div className={`flex items-center bg-white border border-gray-300 rounded-lg px-3 py-2 w-fit shadow-sm ${isRTL ? 'space-x-reverse space-x-3' : 'space-x-3'}`}>
                <select
                  value={language}
                  onChange={handleChange}
                  className="border-none bg-transparent text-gray-800 font-semibold focus:outline-none rounded-md cursor-pointer"
                >
                  <option value="en">{t('common.components.dashboard.english')}</option>
                  <option value="ar">{t('common.components.dashboard.arabic')}</option>
                </select>
                <Globe className="w-4 h-4" />
              </div>
            </div>
          </div>
        </header>
        <MainContent />
      </div>
    </div>
  );
};

export default DashboardLayout;