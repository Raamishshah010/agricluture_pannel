
import { useState, useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';
import useGoogleMaps from '../hooks/useGoogleMaps'; // Import the custom hook
import { useTranslation } from '../hooks/useTranslation';

const PolygonDisplayComponent = ({ coordinates, polygonCoordinates, height = "h-[600px]" }) => {
  const t = useTranslation();
  const [map, setMap] = useState(null);
  const mapRef = useRef(null);
  const polygonRef = useRef(null);
  const markerRef = useRef(null);

  const { apiLoaded } = useGoogleMaps(false);

  const validCoordinates = coordinates;
  // Initialize map
  useEffect(() => {
    if (!apiLoaded || !mapRef.current || map || !window.google?.maps) return;

    const googleMap = new window.google.maps.Map(mapRef.current, {
      center: validCoordinates,
      zoom: 20,
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
      if (markerRef.current) {
        markerRef.current.setMap(null);
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
    if (markerRef.current) {
      markerRef.current.setMap(null);
      markerRef.current = null;
    }

    if (polygonCoordinates && polygonCoordinates.length > 0) {
      const validPolygonCoords = polygonCoordinates.map(loc => ({
        lng: Number(loc.lng),
        lat: Number(loc.lat)
      }));

      if (validPolygonCoords.length > 0) {
        const polygon = new window.google.maps.Polygon({
          paths: validPolygonCoords,
          fillColor: '#3B82F6',
          fillOpacity: 0.35,
          strokeWeight: 2,
          strokeColor: '#2563EB',
          editable: false,
          draggable: false,
        });

        polygon.setMap(map);
        polygonRef.current = polygon;

        // Fit map bounds to polygon
        try {
          const bounds = new window.google.maps.LatLngBounds();
          validPolygonCoords.forEach(coord => {
            bounds.extend(new window.google.maps.LatLng(coord.lat, coord.lng));
          });
          map.fitBounds(bounds);
        } catch (error) {
          console.error('Error fitting bounds:', error);
        }
      }
    } else {
      // If no polygon, show center marker
      const marker = new window.google.maps.Marker({
        position: validCoordinates,
        map: map,
        title: 'Location',
      });
      markerRef.current = marker;
    }
  }, [map, polygonCoordinates, validCoordinates]);

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