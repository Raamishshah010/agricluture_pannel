import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Loader } from 'lucide-react';
import useTranslation from '../../hooks/useTranslation';
import useGoogleMaps from '../../hooks/useGoogleMaps';

  const GoogleMapWithClustering = ({ farms, onFarmClick }) => {
  const t = useTranslation();
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const markersRef = useRef([]);
  const markerClustererRef = useRef(null);
  const { apiLoaded, error } = useGoogleMaps(false);

  const createMarkerContent = (color) => {
    const element = document.createElement('div');
    element.style.width = '18px';
    element.style.height = '18px';
    element.style.borderRadius = '9999px';
    element.style.background = color;
    element.style.border = '2px solid white';
    element.style.boxShadow = '0 1px 4px rgba(0, 0, 0, 0.35)';
    return element;
  };

  // Initialize map
  useEffect(() => {
    if (!apiLoaded || !mapRef.current || map || !window.google?.maps) return;

    if (mapRef.current && !map) {
      const googleMap = new window.google.maps.Map(mapRef.current, {
        center: { lat: 25.403027, lng: 55.523542 }, // Center of UAE
        zoom: 9,
        mapTypeId: 'hybrid',
      });
      setMap(googleMap);
    }
  }, [apiLoaded, map]);

  const ranges = [
    { id: 'from0To500', label: t('sizes.ranges.from0To500'), min: 0, max: 500 },
    { id: 'from500To1000', label: t('sizes.ranges.from500To1000'), min: 500, max: 1000 },
    { id: 'from1000To1500', label: t('sizes.ranges.from1000To1500'), min: 1000, max: 1500 },
    { id: 'from1500To2000', label: t('sizes.ranges.from1500To2000'), min: 1500, max: 2000 },
    { id: 'from2000To2500', label: t('sizes.ranges.from2000To2500'), min: 2000, max: 2500 },
    { id: 'above2500', label: t('sizes.ranges.above2500'), min: 2500, max: Infinity },
  ];

  const rangeColors = {
    from0To500: '#8B5CF6',
    from500To1000: '#06B6D4',
    from1000To1500: '#F59E0B',
    from1500To2000: '#10B981',
    from2000To2500: '#6366F1',
    above2500: '#EF4444'
  };

  // Add markers and clustering
  useEffect(() => {
    if (!apiLoaded || !map || !window.google?.maps || !farms || farms.length === 0) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => {
      if (typeof marker.setMap === 'function') {
        marker.setMap(null);
      } else {
        marker.map = null;
      }
    });
    markersRef.current = [];

    // Clear existing clusterer
    if (markerClustererRef.current) {
      markerClustererRef.current.clearMarkers();
      markerClustererRef.current.setMap(null);
    }

    // Create markers for each farm (without adding to map directly)
    const markers = farms.map(farm => {
      const lat = Number(farm.coordinates?.lat);
      const lng = Number(farm.coordinates?.lng);

      // Skip if coordinates are invalid
      if (isNaN(lat) || isNaN(lng)) {
        console.warn(`Invalid coordinates for farm: ${farm.farmName}`);
        return null;
      }

      const farmSize = Number(farm.totalArea) || 0;
    
      // Find which range this farm belongs to
      const matchedRange = ranges.find(r => farmSize >= r.min && farmSize < r.max) || ranges[ranges.length - 1];
      const rangeLabel = matchedRange.label;
    
      // Get color for this range
      const color = rangeColors[matchedRange.id] || '#10B981';

      // Create marker WITHOUT map property (clusterer will handle it)
      const marker = new window.google.maps.marker.AdvancedMarkerElement({
        position: { lat, lng },
        title: farm.farmName,
        content: createMarkerContent(color),
      });
    
      // Info window content
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 12px; font-family: system-ui; min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; color: ${color}; font-size: 16px; font-weight: bold;">
              ${farm.farmName}
            </h3>
            <p style="margin: 4px 0; color: #374151; font-size: 14px;">
              <strong>${t('sizes.map.sizeLabel')}:</strong> ${farm.totalArea || t('nA')} ${t('sizes.map.unit')}
            </p>
            <p style="margin: 4px 0; color: #374151; font-size: 14px;">
              <strong>${t('sizes.map.rangeLabel')}:</strong> ${rangeLabel}
            </p>
            <p style="margin: 4px 0; color: #6b7280; font-size: 12px;">
              ${t('sizes.map.coordinatesLabel')}: ${lat.toFixed(4)}, ${lng.toFixed(4)}
            </p>
              <button 
              id="view-farm-${farm.id}"
              style="
                margin-top: 12px;
                padding: 10px 16px;
                background-color: ${color};
                color: white;
                border: none;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                width: 100%;
                transition: opacity 0.2s;
              "
              onmouseover="this.style.opacity='0.8'"
              onmouseout="this.style.opacity='1'"
            >
              ${t('sizes.map.viewDetails')}
            </button>
          </div>
        `
      });
    
      // Add click event for info window + button
      marker.addListener('click', () => {
        infoWindow.open(map, marker);
        
        setTimeout(() => {
          const button = document.getElementById(`view-farm-${farm.id}`);
          if (button) {
            button.onclick = () => {
              if (onFarmClick) {
                onFarmClick(farm);
              }
            };
          }
        }, 50);
      });
    
      return marker;
    }).filter(marker => marker !== null);

    markersRef.current = markers;

    // Initialize MarkerClusterer
    const initializeClusterer = () => {
      if (window.markerClusterer && markers.length > 0) {
        markerClustererRef.current = new window.markerClusterer.MarkerClusterer({
          map,
          markers,
          algorithm: new window.markerClusterer.SuperClusterAlgorithm({ 
            radius: 150, // Increased radius for better clustering
            maxZoom: 16  // Clusters will break apart at zoom level 16
          }),
        });
        console.log('Clusterer initialized with', markers.length, 'markers');
      }
    };

    if (window.markerClusterer) {
      initializeClusterer();
    } else {
      // Check if script is already being loaded
      const existingScript = document.querySelector('script[src*="markerclusterer"]');
      
      if (!existingScript) {
        // Load MarkerClusterer library
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/@googlemaps/markerclusterer/dist/index.min.js';
        script.async = true;
        script.onload = () => {
          console.log('MarkerClusterer library loaded');
          initializeClusterer();
        };
        script.onerror = () => {
          console.error('Failed to load MarkerClusterer library');
        };
        document.head.appendChild(script);
      } else {
        // Script exists, wait for it to load
        const checkClusterer = setInterval(() => {
          if (window.markerClusterer) {
            clearInterval(checkClusterer);
            initializeClusterer();
          }
        }, 100);
        
        // Timeout after 5 seconds
        setTimeout(() => clearInterval(checkClusterer), 5000);
      }
    }

    return () => {
      if (markerClustererRef.current) {
        markerClustererRef.current.clearMarkers();
        markerClustererRef.current.setMap(null);
      }
    };
  }, [apiLoaded, map, farms, onFarmClick]);

  if (error) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center text-gray-600 px-6">
          <div className="font-semibold text-gray-900 mb-2">{t('common.components.errorLoading')}</div>
          <div className="text-sm">{error.message}</div>
        </div>
      </div>
    );
  }

  if (!apiLoaded) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <Loader className="w-10 h-10 animate-spin mx-auto text-green-600" />
          <div className="mt-3 text-sm text-gray-600">{t('common.components.loadingMap')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex flex-col bg-gray-100">
      {/* Map Container */}
      <div className="flex-1 relative">
        <div ref={mapRef} className="w-full h-full" />
      </div>
    </div>
  );
};

export default GoogleMapWithClustering;