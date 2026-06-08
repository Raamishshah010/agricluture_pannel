import React, { useState, useEffect, useRef } from 'react';
import { Loader } from 'lucide-react';
import { MarkerClusterer, SuperClusterAlgorithm } from '@googlemaps/markerclusterer';
import useTranslation from '../../hooks/useTranslation';
import useGoogleMaps from '../../hooks/useGoogleMaps';
import { GOOGLE_MAPS_MAP_ID } from '../../config/googleMaps';

  const GoogleMapWithClustering = ({ farms, onFarmClick }) => {
  const t = useTranslation();
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const markersRef = useRef([]);
  const markerClustererRef = useRef(null);
  const { apiLoaded, error } = useGoogleMaps(false);

  const setMarkerMap = (marker, nextMap) => {
    if (!marker) return;

    marker.map = nextMap;
  };

  // Initialize map
  useEffect(() => {
    if (apiLoaded && mapRef.current && !map && window.google?.maps) {
      const googleMap = new window.google.maps.Map(mapRef.current, {
        center: { lat: 25.403027, lng: 55.523542 }, // Center of UAE
        zoom: 9,
        mapId: GOOGLE_MAPS_MAP_ID,
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
    if (!map || !window.google?.maps?.marker || !farms || farms.length === 0) return;

    // Clear existing markers
    markersRef.current.forEach(marker => setMarkerMap(marker, null));
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

      const pin = new window.google.maps.marker.PinElement({
        background: color,
        borderColor: color,
        glyphColor: '#ffffff',
        scale: 1,
      });

      // Create marker WITHOUT map property (clusterer will handle it)
      const marker = new window.google.maps.marker.AdvancedMarkerElement({
        position: { lat, lng },
        title: farm.farmName,
        content: pin.element,
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
        infoWindow.open({ map, anchor: marker });
        
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

    if (markers.length > 0) {
      markerClustererRef.current = new MarkerClusterer({
        map,
        markers,
        algorithm: new SuperClusterAlgorithm({ 
          radius: 150, // Increased radius for better clustering
          maxZoom: 16  // Clusters will break apart at zoom level 16
        }),
      });
    }

    return () => {
      if (markerClustererRef.current) {
        markerClustererRef.current.clearMarkers();
        markerClustererRef.current.setMap(null);
      }
    };
  }, [map, farms, onFarmClick]);

  if (error) {
    return (
      <div className="w-full h-screen flex items-center justify-center text-red-600">
        {error.message}
      </div>
    );
  }

  if (!apiLoaded) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <Loader className="animate-spin text-green-600" />
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
