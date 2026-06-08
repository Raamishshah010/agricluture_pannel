
import { useState, useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';
import useGoogleMaps from '../hooks/useGoogleMaps'; // Import the custom hook
import { useTranslation } from '../hooks/useTranslation';
import { GOOGLE_MAPS_MAP_ID } from '../config/googleMaps';

const setMarkerMap = (marker, map) => {
  if (!marker) return;

  marker.map = map;
};

const createAdvancedMarker = ({ map, position, title }) => {
  if (!window.google?.maps?.marker?.AdvancedMarkerElement) return null;

  return new window.google.maps.marker.AdvancedMarkerElement({
    map,
    position,
    title,
  });
};

const normalizePolygonCoordinates = (coordinates = []) => {
  if (!Array.isArray(coordinates)) return [];

  return coordinates
    .map(loc => ({
      lng: Number(loc?.lng ?? loc?.longitude),
      lat: Number(loc?.lat ?? loc?.latitude)
    }))
    .filter(loc => !Number.isNaN(loc.lat) && !Number.isNaN(loc.lng));
};

const PolygonDisplayComponent = ({
  coordinates,
  polygonCoordinates,
  additionalPolygons = [],
  legendItems = [],
  polygonStyle = {},
  height = "h-[600px]"
}) => {
  const t = useTranslation();
  const [map, setMap] = useState(null);
  const mapRef = useRef(null);
  const polygonRef = useRef(null);
  const additionalPolygonRefs = useRef([]);
  const markerRef = useRef(null);

  const { apiLoaded } = useGoogleMaps(false);

  const validCoordinates = coordinates;
  const visibleLegendItems = legendItems.length > 0
    ? legendItems
    : additionalPolygons.filter(item => item.label);
  const legendTitle = t('common.legend') === 'common.legend' ? 'Legend' : t('common.legend');
  // Initialize map
  useEffect(() => {
    if (!apiLoaded || !mapRef.current || map || !window.google?.maps) return;

    const googleMap = new window.google.maps.Map(mapRef.current, {
      center: validCoordinates,
      zoom: 20,
      mapId: GOOGLE_MAPS_MAP_ID,
      mapTypeId: 'satellite', // Set satellite view by default
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
    });

    setMap(googleMap);

    // Cleanup function
    return () => {
      if (polygonRef.current) {
        polygonRef.current.setMap(null);
        polygonRef.current = null;
      }
      additionalPolygonRefs.current.forEach(polygon => polygon.setMap(null));
      additionalPolygonRefs.current = [];
      if (markerRef.current) {
        setMarkerMap(markerRef.current, null);
        markerRef.current = null;
      }
    };
  }, [apiLoaded, validCoordinates]);

  useEffect(() => {
    if (!map || !window.google?.maps) return;

    if (polygonRef.current) {
      polygonRef.current.setMap(null);
      polygonRef.current = null;
    }
    additionalPolygonRefs.current.forEach(polygon => polygon.setMap(null));
    additionalPolygonRefs.current = [];
    if (markerRef.current) {
      setMarkerMap(markerRef.current, null);
      markerRef.current = null;
    }

    const validPolygonCoords = normalizePolygonCoordinates(polygonCoordinates);
    const validAdditionalPolygons = additionalPolygons
      .map(item => ({
        ...item,
        coordinates: normalizePolygonCoordinates(item.coordinates)
      }))
      .filter(item => item.coordinates.length > 0);

    if (validPolygonCoords.length > 0 || validAdditionalPolygons.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();

      if (validPolygonCoords.length > 0) {
        const polygon = new window.google.maps.Polygon({
          paths: validPolygonCoords,
          fillColor: polygonStyle.fillColor || '#3B82F6',
          fillOpacity: polygonStyle.fillOpacity ?? 0.35,
          strokeWeight: polygonStyle.strokeWeight ?? 2,
          strokeColor: polygonStyle.strokeColor || '#2563EB',
          editable: false,
          draggable: false,
          clickable: false,
          map,
        });
        polygonRef.current = polygon;

        validPolygonCoords.forEach(coord => {
          bounds.extend(new window.google.maps.LatLng(coord.lat, coord.lng));
        });
      }

      validAdditionalPolygons.forEach((item) => {
        const polygon = new window.google.maps.Polygon({
          paths: item.coordinates,
          fillColor: item.fillColor || '#10B981',
          fillOpacity: item.fillOpacity ?? 0.28,
          strokeWeight: item.strokeWeight ?? 3,
          strokeColor: item.strokeColor || '#059669',
          editable: false,
          draggable: false,
          clickable: false,
          map,
        });

        additionalPolygonRefs.current.push(polygon);
        item.coordinates.forEach(coord => {
          bounds.extend(new window.google.maps.LatLng(coord.lat, coord.lng));
        });
      });

      try {
        map.fitBounds(bounds, { padding: 40 });
      } catch (error) {
        console.error('Error fitting bounds:', error);
      }
    } else {
      // If no polygon, show center marker
      const marker = createAdvancedMarker({
        position: validCoordinates,
        map,
        title: 'Location',
      });
      markerRef.current = marker;
    }
  }, [map, polygonCoordinates, additionalPolygons, polygonStyle, validCoordinates]);

  if (!apiLoaded) {
    return (
      <div className={`${height} w-full flex items-center justify-center bg-gray-100 mt-2`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('common.components.loadingMap')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${height} w-full flex flex-col bg-gray-100 mt-2`}>
      {/* Map Container */}
      <div className="flex-1 relative">
        <div ref={mapRef} className="w-full h-full" />

        {visibleLegendItems.length > 0 && (
          <div className="absolute bottom-4 right-4 max-w-[260px] rounded-lg bg-white/95 p-3 text-sm text-gray-800 shadow-lg">
            <div className="mb-2 font-semibold text-gray-900">{legendTitle}</div>
            <div className="space-y-1.5">
              {visibleLegendItems.map((item, index) => (
                <div key={`${item.label}-${index}`} className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 shrink-0 rounded-sm border"
                    style={{
                      backgroundColor: item.fillColor,
                      borderColor: item.strokeColor || item.fillColor,
                    }}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!polygonCoordinates || polygonCoordinates.length === 0 ? (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white px-4 py-2 rounded-lg shadow-lg text-sm text-gray-700">
            {t('common.components.noPolygonToDisplay')}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default PolygonDisplayComponent;
