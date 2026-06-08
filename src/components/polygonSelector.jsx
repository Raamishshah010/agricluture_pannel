import { useState, useEffect, useRef } from 'react';
import { Trash2, Edit3, X, MapPin } from 'lucide-react';
import useGoogleMaps from '../hooks/useGoogleMaps';
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

const PolygonMapSelector = ({ handleCoordinates, coords, coordinates }) => {
  const t = useTranslation();
  const [map, setMap] = useState(null);
  const [polygons, setPolygons] = useState([]);
  const [marker, setMarker] = useState(null);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [draftPath, setDraftPath] = useState([]);
  const mapRef = useRef(null);
  const previewPolygonsRef = useRef([]);
  const draftPolygonRef = useRef(null);
  const drawingClickListenerRef = useRef(null);
  const { apiLoaded } = useGoogleMaps(true);
  
  const validCoordinates = (coordinates &&
    typeof coordinates.lat !== 'number' &&
    typeof coordinates.lng !== 'number')
    ? { lat: Number(coordinates.lat), lng: Number(coordinates.lng) }
    : coordinates;

  useEffect(() => {
    if (!apiLoaded || !mapRef.current || map || !window.google?.maps?.marker) return;

    const googleMap = new window.google.maps.Map(mapRef.current, {
      center: validCoordinates,
      zoom: 20,
      mapId: GOOGLE_MAPS_MAP_ID,
      mapTypeId: 'hybrid',
      mapTypeControl: true,
      streetViewControl: true,
    });

    const defaultMarker = createAdvancedMarker({
      position: validCoordinates,
      map: googleMap,
      title: 'Location',
    });

    setMap(googleMap);
    setMarker(defaultMarker);
  }, [apiLoaded]);

  useEffect(() => {
    if (!map || !isDrawingMode || !window.google?.maps) return;

    if (!draftPolygonRef.current) {
      draftPolygonRef.current = new window.google.maps.Polygon({
        paths: [],
        fillColor: '#3B82F6',
        fillOpacity: 0.3,
        strokeWeight: 2,
        strokeColor: '#2563EB',
        editable: true,
        draggable: true,
        map,
      });
    }

    drawingClickListenerRef.current = map.addListener('click', (event) => {
      if (!event.latLng || !draftPolygonRef.current) return;

      const nextPoint = {
        lat: event.latLng.lat(),
        lng: event.latLng.lng(),
      };

      setDraftPath(prev => {
        const nextPath = [...prev, nextPoint];
        draftPolygonRef.current.setPath(nextPath);
        return nextPath;
      });
    });

    return () => {
      drawingClickListenerRef.current?.remove();
      drawingClickListenerRef.current = null;
    };
  }, [map, isDrawingMode]);

  useEffect(() => {
    if (!map || !window.google?.maps) return;
    previewPolygonsRef.current.forEach(previewPoly => {
      if (previewPoly) {
        previewPoly.setMap(null);
      }
    });
    previewPolygonsRef.current = [];
    if (!coords) {
      if (marker && map) {
        setMarkerMap(marker, map);
      }
      return;
    }

    let polygonsToDisplay = [];
    
    if (Array.isArray(coords)) {
      if (coords.length === 0) {
        if (marker && map) {
          setMarkerMap(marker, map);
        }
        return;
      }
      
      if (Array.isArray(coords[0])) {
        polygonsToDisplay = coords;
      } else if (coords[0] && typeof coords[0] === 'object' && ('lat' in coords[0] || 'latitude' in coords[0])) {
        polygonsToDisplay = [coords];
      }
    }

    const bounds = new window.google.maps.LatLngBounds();
    let hasValidPolygon = false;

    polygonsToDisplay.forEach((polygonCoords, index) => {
      const validPolygonCoords = polygonCoords
        .filter(coord => coord && (coord.lat !== undefined || coord.latitude !== undefined) && (coord.lng !== undefined || coord.longitude !== undefined))
        .map(coord => ({
          lat: Number(coord.lat || coord.latitude),
          lng: Number(coord.lng || coord.longitude)
        }))
        .filter(coord => !isNaN(coord.lat) && !isNaN(coord.lng));


      if (validPolygonCoords.length > 2) {
        const colors = [
          { fill: '#EF4444', stroke: '#DC2626' }, // Red
          { fill: '#3B82F6', stroke: '#2563EB' }, // Blue
          { fill: '#10B981', stroke: '#059669' }, // Green
          { fill: '#F59E0B', stroke: '#D97706' }, // Orange
          { fill: '#8B5CF6', stroke: '#7C3AED' }, // Purple
          { fill: '#EC4899', stroke: '#DB2777' }, // Pink
          { fill: '#06B6D4', stroke: '#0891B2' }, // Cyan
          { fill: '#84CC16', stroke: '#65A30D' }, // Lime
          { fill: '#F97316', stroke: '#EA580C' }, // Deep Orange
          { fill: '#14B8A6', stroke: '#0D9488' }, // Teal
        ];
        const color = colors[index % colors.length];

        const previewPolygon = new window.google.maps.Polygon({
          paths: validPolygonCoords,
          fillColor: color.fill,
          fillOpacity: 0.3,
          strokeWeight: 3,
          strokeColor: color.stroke,
          editable: false,
          draggable: false,
        });

        previewPolygon.setMap(map);
        previewPolygonsRef.current.push(previewPolygon);
        hasValidPolygon = true;
        validPolygonCoords.forEach(coord => {
          bounds.extend(new window.google.maps.LatLng(coord.lat, coord.lng));
        });
      }
    });

    if (hasValidPolygon) {
      if (marker) {
        setMarkerMap(marker, null);
      }

      try {
        map.fitBounds(bounds, { padding: 50 });
      } catch (error) {
        console.error('Error fitting bounds:', error);
      }
    } else {
      if (marker && map) {
        setMarkerMap(marker, map);
      }
    }
  }, [map, coords]);

  const startDrawing = () => {
    if (map && window.google?.maps) {
      if (draftPolygonRef.current) {
        draftPolygonRef.current.setMap(null);
        draftPolygonRef.current = null;
      }

      setDraftPath([]);
      setIsDrawingMode(true);
    }
  };

  const stopDrawing = () => {
    if (draftPolygonRef.current) {
      draftPolygonRef.current.setMap(null);
      draftPolygonRef.current = null;
    }

    setDraftPath([]);
    setIsDrawingMode(false);
  };

  const finishDrawing = () => {
    if (!draftPolygonRef.current || draftPath.length < 3) return;

    const id = Date.now();
    const polygon = draftPolygonRef.current;

    const getCoordinates = () => {
      return polygon.getPath().getArray().map(coord => ({
        lat: coord.lat(),
        lng: coord.lng(),
      }));
    };

    const updatePolygonCoordinates = () => {
      setPolygons(prev => prev.map(p =>
        p.id === id ? { ...p, coordinates: getCoordinates() } : p
      ));
    };

    window.google.maps.event.addListener(polygon.getPath(), 'set_at', updatePolygonCoordinates);
    window.google.maps.event.addListener(polygon.getPath(), 'insert_at', updatePolygonCoordinates);
    window.google.maps.event.addListener(polygon.getPath(), 'remove_at', updatePolygonCoordinates);

    setPolygons([{ id, polygon, coordinates: getCoordinates() }]);
    setDraftPath([]);
    setIsDrawingMode(false);
    draftPolygonRef.current = null;

    if (marker) {
      setMarkerMap(marker, null);
    }
  };

  const clearAllPolygons = () => {
    polygons.forEach(p => {
      if (p.polygon) {
        p.polygon.setMap(null);
      }
    });
    setPolygons([]);
    stopDrawing();

    // previewPolygonsRef.current.forEach(previewPoly => {
    //   if (previewPoly) {
    //     previewPoly.setMap(null);
    //   }
    // });
    // previewPolygonsRef.current = [];

    // if (marker && map) {
    //   marker.setMap(map);
    // }
  };

  const handleExportCoordinates = () => {
    if (polygons.length === 0) {
      alert(t('common.components.pleaseDrawPolygon'));
      return;
    }
    
    const data = polygons.map((poly) => poly.coordinates);
    if (data.length > 1) {
      alert(t('common.components.moreThanOnePolygon'));
    }
    handleCoordinates(data[0]);
  };

  if (!apiLoaded) {
    return (
      <div className="h-[600px] w-[700px] flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('common.components.loadingMap')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[600px] w-[700px] flex flex-col bg-gray-100">
      <div className="bg-white shadow-md p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex gap-2">
            {!isDrawingMode ? (
              <button
                onClick={startDrawing}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Edit3 size={18} />
                {t('common.components.drawPolygon')}
              </button>
            ) : (
              <>
                <button
                  onClick={finishDrawing}
                  disabled={draftPath.length < 3}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <MapPin size={18} />
                  {t('common.components.saveArea')}
                </button>
                <button
                  onClick={stopDrawing}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <X size={18} />
                  {t('common.components.cancelDrawing')}
                </button>
              </>
            )}
            {(polygons.length > 0 || previewPolygonsRef.current.length > 0) && (
              <>
                <button
                  onClick={clearAllPolygons}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Trash2 size={18} />
                  {t('common.components.clear')}
                </button>
                {polygons.length > 0 && (
                  <button
                    onClick={handleExportCoordinates}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <MapPin size={18} />
                    {t('common.components.saveArea')}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 relative">
          <div ref={mapRef} className="w-full h-full" />

          {isDrawingMode && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg">
              {t('common.components.clickToDrawPoints')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PolygonMapSelector;
