import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Loader } from 'lucide-react';

const GoogleMapWithClustering = ({ farms, onFarmClick }) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const markersRef = useRef([]);
  const markerClustererRef = useRef(null);

  // Initialize map
  useEffect(() => {
    if (mapRef.current && !map) {
      const googleMap = new window.google.maps.Map(mapRef.current, {
        center: { lat: 25.403027, lng: 55.523542 }, // Center of UAE
        zoom: 9,
        mapTypeId: 'hybrid',
      });
      setMap(googleMap);
    }
  }, [map]);

  const ranges = [
    { label: '0-500', min: 0, max: 500 },
    { label: '500-1000', min: 500, max: 1000 },
    { label: '1000-1500', min: 1000, max: 1500 },
    { label: '1500-2000', min: 1500, max: 2000 },
    { label: '2000-2500', min: 2000, max: 2500 },
    { label: '2500+', min: 2500, max: Infinity },
  ];

  const rangeColors = {
    '0-500': '#8B5CF6',
    '500-1000': '#06B6D4',
    '1000-1500': '#F59E0B',
    '1500-2000': '#10B981',
    '2000-2500': '#6366F1',
    '2500+': '#EF4444'
  };

  // Add markers and clustering
  useEffect(() => {
    if (!map || !window.google || !farms || farms.length === 0) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
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
      const color = rangeColors[rangeLabel] || '#10B981';

      // Create marker WITHOUT map property (clusterer will handle it)
      const marker = new window.google.maps.Marker({
        position: { lat, lng },
        title: farm.farmName,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: color,
          fillOpacity: 0.9,
          strokeColor: color,
          strokeWeight: 2,
        }
      });
    
      // Info window content
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 12px; font-family: system-ui; min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; color: ${color}; font-size: 16px; font-weight: bold;">
              ${farm.farmName}
            </h3>
            <p style="margin: 4px 0; color: #374151; font-size: 14px;">
              <strong>Size:</strong> ${farm.totalArea || 'N/A'} acres
            </p>
            <p style="margin: 4px 0; color: #374151; font-size: 14px;">
              <strong>Range:</strong> ${rangeLabel}
            </p>
            <p style="margin: 4px 0; color: #6b7280; font-size: 12px;">
              Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}
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
              View Details
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
  }, [map, farms, onFarmClick]);

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