import { useState, useEffect, useRef } from 'react';
import { Trash2, Edit3, X, MapPin } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

const GOOGLE_MAPS_API_KEY = 'AIzaSyAuJYLmzmglhCpBYTn0BjbJhjWYg0fPEEA';

const PolygonMapSelector = ({ handleCoordinates, coords, coordinates }) => {
  const t = useTranslation();
  const [map, setMap] = useState(null);
  const [drawingManager, setDrawingManager] = useState(null);
  const [polygons, setPolygons] = useState([]);
  const [marker, setMarker] = useState(null);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [apiLoaded, setApiLoaded] = useState(false);
  const mapRef = useRef(null);
  const previewPolygonsRef = useRef([]);
  
  const validCoordinates = (coordinates &&
    typeof coordinates.lat !== 'number' &&
    typeof coordinates.lng !== 'number')
    ? { lat: Number(coordinates.lat), lng: Number(coordinates.lng) }
    : coordinates;

  useEffect(() => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=drawing`;
    script.async = true;
    script.defer = true;
    script.onload = () => setApiLoaded(true);
    script.onerror = () => {
      console.error('Failed to load Google Maps API');
    };
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  useEffect(() => {
    if (!apiLoaded || !mapRef.current || map || !window.google?.maps?.drawing) return;

    const googleMap = new window.google.maps.Map(mapRef.current, {
      center: validCoordinates,
      zoom: 20,
      mapTypeId: 'hybrid',
      mapTypeControl: true,
      streetViewControl: true,
    });

    const defaultMarker = new window.google.maps.Marker({
      position: validCoordinates,
      map: googleMap,
      title: 'Location',
    });

    const drawingMgr = new window.google.maps.drawing.DrawingManager({
      drawingMode: null,
      drawingControl: false,
      polygonOptions: {
        fillColor: '#3B82F6',
        fillOpacity: 0.3,
        strokeWeight: 2,
        strokeColor: '#2563EB',
        editable: true,
        draggable: true,
      },
    });

    drawingMgr.setMap(googleMap);

    window.google.maps.event.addListener(drawingMgr, 'polygoncomplete', (polygon) => {
      const id = Date.now();

      const getCoordinates = () => {
        return polygon.getPath().getArray().map(coord => ({
          lat: coord.lat(),
          lng: coord.lng(),
        }));
      };

      const newPolygon = {
        id,
        polygon,
        coordinates: getCoordinates(),
      };

      setPolygons([newPolygon]);
      setIsDrawingMode(false);
      drawingMgr.setDrawingMode(null);

      if (defaultMarker) {
        defaultMarker.setMap(null);
      }

      // // Hide preview polygons when drawing new one
      // previewPolygonsRef.current.forEach(previewPoly => {
      //   if (previewPoly) {
      //     previewPoly.setMap(null);
      //   }
      // });
      // previewPolygonsRef.current = [];

      // Update coordinates when polygon is edited
      window.google.maps.event.addListener(polygon.getPath(), 'set_at', () => {
        setPolygons(prev => prev.map(p =>
          p.id === id ? { ...p, coordinates: getCoordinates() } : p
        ));
      });

      window.google.maps.event.addListener(polygon.getPath(), 'insert_at', () => {
        setPolygons(prev => prev.map(p =>
          p.id === id ? { ...p, coordinates: getCoordinates() } : p
        ));
      });
    });

    setMap(googleMap);
    setMarker(defaultMarker);
    setDrawingManager(drawingMgr);
  }, [apiLoaded]);

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
        marker.setMap(map);
      }
      return;
    }

    let polygonsToDisplay = [];
    
    if (Array.isArray(coords)) {
      if (coords.length === 0) {
        if (marker && map) {
          marker.setMap(map);
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
        marker.setMap(null);
      }

      try {
        map.fitBounds(bounds, { padding: 50 });
      } catch (error) {
        console.error('Error fitting bounds:', error);
      }
    } else {
      if (marker && map) {
        marker.setMap(map);
      }
    }
  }, [map, coords]);

  const startDrawing = () => {
    if (drawingManager && window.google?.maps?.drawing) {
      setIsDrawingMode(true);
      drawingManager.setDrawingMode(window.google.maps.drawing.OverlayType.POLYGON);
    }
  };

  const stopDrawing = () => {
    if (drawingManager && window.google?.maps?.drawing) {
      setIsDrawingMode(false);
      drawingManager.setDrawingMode(null);
    }
  };

  const clearAllPolygons = () => {
    polygons.forEach(p => {
      if (p.polygon) {
        p.polygon.setMap(null);
      }
    });
    setPolygons([]);

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
              <button
                onClick={stopDrawing}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <X size={18} />
                {t('common.components.cancelDrawing')}
              </button>
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