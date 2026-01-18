import React, { useEffect, useRef } from 'react';
import { X, Download, Search, Plus, Minus, RotateCcw, Maximize2, Copy } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useTranslation } from '../hooks/useTranslation';

export const Farms = () => {
  const t = useTranslation();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);



  // Crop locations with circular irrigation patterns
  const cropLocations = [
    { name: 'Orange Farm', lat: 25.2548, lng: 55.3208, crop: 'Orange', area: '750 Dunams' },
    { name: 'Date Farm', lat: 25.1948, lng: 55.2408, crop: 'Date', area: '1200 Dunams' },
    { name: 'Wheat Field', lat: 25.3148, lng: 55.4008, crop: 'Wheat', area: '950 Dunams' },
    { name: 'Barley Field', lat: 25.1648, lng: 55.3608, crop: 'Barley', area: '800 Dunams' }
  ];

  const sidebarItems = [
    { title: t('farms.totalPlantedAreas'), hasExpand: true },
    { title: t('farms.totalQuantities'), hasExpand: true },
    { title: t('farms.cropType'), hasExpand: true },
    { title: t('farms.topIrrigationMethod'), hasExpand: true },
    { title: t('farms.mostUsedFertilizer'), hasExpand: true },
    { title: t('farms.totalHives'), hasExpand: true }
  ];
  const data = [
      { year: '2019', value: 200 },
      { year: '2020', value: 600 },
      { year: '2021', value: 800 },
      { year: '2022', value: 1200 },
      { year: '2023', value: 1600 },
      { year: '2024', value: 2200 },
      { year: '2025', value: 2500 },
    ];
  useEffect(() => {
    const leafletCSS = document.createElement('link');
    leafletCSS.rel = 'stylesheet';
    leafletCSS.href = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css';
    document.head.appendChild(leafletCSS);

    const leafletJS = document.createElement('script');
    leafletJS.src = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.js';
    leafletJS.onload = () => {
      initializeMap();
    };
    document.head.appendChild(leafletJS);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
    };
  }, []);

  const initializeMap = () => {
    if (mapRef.current && window.L && !mapInstanceRef.current) {
      mapInstanceRef.current = window.L.map(mapRef.current, {
        zoomControl: false
      }).setView([25.2548, 55.3208], 12);

      // Using satellite imagery
      window.L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '© Esri'
      }).addTo(mapInstanceRef.current);

      addCropMarkers(mapInstanceRef.current);
      addCircularFields(mapInstanceRef.current);
    }
  };

  const addCircularFields = (mapInstance) => {
    // Add circular irrigation patterns
    const circles = [
      { lat: 25.2548, lng: 55.3208, radius: 400, color: '#F59E0B' }, // Orange
      { lat: 25.1948, lng: 55.2408, radius: 350, color: '#3B82F6' }, // Date
      { lat: 25.3148, lng: 55.4008, radius: 300, color: '#10B981' }, // Wheat
    ];

    circles.forEach(circle => {
      window.L.circle([circle.lat, circle.lng], {
        color: circle.color,
        fillColor: circle.color,
        fillOpacity: 0.2,
        radius: circle.radius,
        weight: 2
      }).addTo(mapInstance);
    });
  };

  const addCropMarkers = (mapInstance) => {
    cropLocations.forEach(location => {
      const marker = window.L.marker([location.lat, location.lng]).addTo(mapInstance);
      
      marker.bindPopup(`
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; min-width: 150px;">
          <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold; color: #F59E0B;">${location.crop}</h3>
          <p style="margin: 0 0 4px 0; font-size: 12px; color: #333;">${location.name}</p>
          <p style="margin: 0; font-size: 12px; color: #666;">Orange in this area is about ${location.area}</p>
        </div>
      `);
    });
  };

  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  };

  return (
    <div className="h-screen bg-gray-50">
      <div className="flex h-screen">
        {/* Map Section */}
        <div className="flex-1 flex flex-col">
          {/* Map Container */}
          <div className="flex-1 p-4 rounded-md relative">     
            <div ref={mapRef} className="w-full rounded-md h-full z-0" style={{ minHeight: '400px' }}></div>
            
            {/* Search Bar */}
            <div className="absolute top-6 left-6 z-10">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder={t('farms.searchCrops')}
                  className="w-64 pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm shadow-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>
            
            {/* Map Controls */}
            <div className="absolute bottom-6 left-6 z-10 flex flex-col space-y-2">
              <button
                onClick={handleZoomIn}
                className="bg-white border border-gray-300 rounded p-2 shadow-lg hover:bg-gray-50 transition-colors"
              >
                <Plus className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={handleZoomOut}
                className="bg-white border border-gray-300 rounded p-2 shadow-lg hover:bg-gray-50 transition-colors"
              >
                <Minus className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {/* Additional Map Controls */}
            <div className="absolute bottom-6 right-6 z-10 flex flex-col space-y-2">
              <button className="bg-white border border-gray-300 rounded p-2 shadow-lg hover:bg-gray-50 transition-colors">
                <RotateCcw className="w-4 h-4 text-gray-600" />
              </button>
              <button className="bg-white border border-gray-300 rounded p-2 shadow-lg hover:bg-gray-50 transition-colors">
                <Maximize2 className="w-4 h-4 text-gray-600" />
              </button>
              <button className="bg-white border border-gray-300 rounded p-2 shadow-lg hover:bg-gray-50 transition-colors">
                <Copy className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>

      
        </div>

        {/* Right Sidebar */}
        <div className="w-80 bg-gray-50 border-l border-gray-200">
          {/* Top planted crops section */}
          <div className="bg-white border-b border-gray-200">
            <div className="flex items-center justify-between p-4">
              <h3 className="text-sm font-semibold text-gray-900">{t('farms.topPlantedCrops')}</h3>
              <button className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="px-4 pb-2">
              <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>{t('farms.allEmirates')}</option>
                <option>Abu Dhabi</option>
                <option>Dubai</option>
                <option>Sharjah</option>
              </select>
            </div>

            <div className="p-4">
              <div className="h-40 mb-4">
            <ResponsiveContainer width="100%" height={150}>
                    <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} domain={[0, 2500]} ticks={[0, 500, 1000, 1500, 2000, 2500]} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
              </div>
              
              <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded text-sm flex items-center justify-center space-x-2 transition-colors">
                <Download className="w-4 h-4" />
                <span>{t('farms.downloadReport')}</span>
              </button>
            </div>
          </div>

          {/* Sidebar Items */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-3">
              {sidebarItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                  <span className="text-sm font-medium text-gray-700">{item.title}</span>
                  {item.hasExpand && (
                    <button className="text-gray-400 hover:text-gray-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

