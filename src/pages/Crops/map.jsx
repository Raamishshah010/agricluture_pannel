import React, { useState, useEffect, useRef } from 'react';
import { Plus, Minus } from 'lucide-react';

// Separated Map Component
const FarmMap = ({ farms, emirates, emirateColors }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [isLeafletLoaded, setIsLeafletLoaded] = useState(false);

  // Initialize Leaflet library
  useEffect(() => {
    // Check if Leaflet is already loaded
    if (window.L) {
      setIsLeafletLoaded(true);
      return;
    }

    const leafletCSS = document.createElement('link');
    leafletCSS.rel = 'stylesheet';
    leafletCSS.href = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css';
    document.head.appendChild(leafletCSS);

    const leafletJS = document.createElement('script');
    leafletJS.src = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.js';
    leafletJS.onload = () => {
      setIsLeafletLoaded(true);
    };
    document.head.appendChild(leafletJS);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Initialize map after Leaflet is loaded
  useEffect(() => {
    if (isLeafletLoaded && mapRef.current && !mapInstanceRef.current) {
      initializeMap();
    }
  }, [isLeafletLoaded]);

  // Update markers when farms change
  useEffect(() => {
    if (mapInstanceRef.current && window.L && isLeafletLoaded) {
      updateMarkers();
    }
  }, [farms, emirates, emirateColors, isLeafletLoaded]);

  const initializeMap = () => {
    if (!window.L || !mapRef.current || mapInstanceRef.current) return;

    try {
      mapInstanceRef.current = window.L.map(mapRef.current, {
        zoomControl: false,
      }).setView([25.2048, 55.2708], 8);

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(mapInstanceRef.current);

      // Wait a bit for map to fully initialize before adding markers
      setTimeout(() => {
        if (mapInstanceRef.current) {
          updateMarkers();
        }
      }, 100);
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  };

  const createCustomIcon = (color = 'red') => {
    if (!window.L) return null;
    return window.L.divIcon({
      html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
      className: 'custom-marker',
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });
  };

  const updateMarkers = () => {
    if (!mapInstanceRef.current || !window.L) return;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      try {
        mapInstanceRef.current.removeLayer(marker);
      } catch (e) {
        console.error('Error removing marker:', e);
      }
    });
    markersRef.current = [];

    // Add new markers for filtered farms only
    farms.forEach(farm => {
      const emirateName = emirates.find(e => e.id === farm.emirate)?.name;
      const emirateColor = emirateColors[emirateName] || '#999999';
      const latitude = Number(farm.coordinates?.lat);
      const longitude = Number(farm.coordinates?.lng);
      
      if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
        console.warn('Invalid coordinates for farm:', farm.farmName);
        return;
      }
      
      try {
        const marker = window.L.marker([latitude, longitude], {
          icon: createCustomIcon(emirateColor)
        }).addTo(mapInstanceRef.current);

        marker.bindPopup(`
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">${farm.farmName}</h3>
            <p style="margin: 0; font-size: 12px; color: #666;">${emirateName || 'Unknown'}</p>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #666;">Agricultural Zone</p>
          </div>
        `);

        markersRef.current.push(marker);
      } catch (error) {
        console.error('Error adding marker for farm:', farm.farmName, error);
      }
    });

    // Fit bounds to show all filtered farms
    if (markersRef.current.length > 0) {
      try {
        const group = window.L.featureGroup(markersRef.current);
        mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
      } catch (error) {
        console.error('Error fitting bounds:', error);
      }
    } else {
      // If no markers, reset to default view
      mapInstanceRef.current.setView([25.2048, 55.2708], 8);
    }
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
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full rounded-md" style={{ minHeight: '500px' }}></div>
      
      {!isLeafletLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-md">
          <div className="text-gray-600">Loading map...</div>
        </div>
      )}
      
      <div className="absolute bottom-6 left-6 flex flex-col gap-2 z-[1000]">
        <button
          onClick={handleZoomIn}
          className="bg-white border border-gray-300 rounded-full p-2 shadow-lg hover:bg-gray-50 transition-colors"
          disabled={!isLeafletLoaded}
        >
          <Plus className="w-5 h-5 text-gray-600" />
        </button>
        <button
          onClick={handleZoomOut}
          className="bg-white border border-gray-300 rounded-full p-2 shadow-lg hover:bg-gray-50 transition-colors"
          disabled={!isLeafletLoaded}
        >
          <Minus className="w-5 h-5 text-gray-600" />
        </button>
      </div>
    </div>
  );
};

export default FarmMap;