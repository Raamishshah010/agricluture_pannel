import React, { useState, useEffect, useRef } from 'react';
import { Loader } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import useGoogleMaps from '../hooks/useGoogleMaps';

const GoogleMapWithClustering = ({ farms = [], onFarmClick }) => {
    const t = useTranslation();

    const mapRef = useRef(null);
    const [map, setMap] = useState(null);
    const markersRef = useRef([]);
    const clustererRef = useRef(null);

    const { apiLoaded, error } = useGoogleMaps(false);

    const isDev = process.env.NODE_ENV !== 'production';

    /* =========================================================
       🔢 STRING → NUMBER (ULTRA ROBUST)
    ========================================================= */
    const toNumber = (value) => {
        if (value === null || value === undefined) return NaN;
        if (typeof value === 'number') return value;

        if (typeof value === 'string') {
            const arabicMap = {
                '\u0660': '0', '\u0661': '1', '\u0662': '2', '\u0663': '3', '\u0664': '4',
                '\u0665': '5', '\u0666': '6', '\u0667': '7', '\u0668': '8', '\u0669': '9',
                '\u06F0': '0', '\u06F1': '1', '\u06F2': '2', '\u06F3': '3', '\u06F4': '4',
                '\u06F5': '5', '\u06F6': '6', '\u06F7': '7', '\u06F8': '8', '\u06F9': '9'
            };

            let s = value.trim();

            // Normalize Arabic digits
            s = s.replace(/[\u0660-\u0669\u06F0-\u06F9]/g, ch => arabicMap[ch] || ch);

            // Replace Arabic comma
            s = s.replace(/\u060C/g, ',');

            // Remove trailing commas
            s = s.replace(/,+$/, '');

            // Remove invalid chars except digits, dot, minus
            s = s.replace(/[^\d.\-]/g, '');

            // ✅ FIX: multiple dots → keep first only
            const parts = s.split('.');
            if (parts.length > 2) {
                s = parts[0] + '.' + parts.slice(1).join('');
            }

            return Number(s);
        }

        return Number(value);
    };

    /* =========================================================
       📍 NORMALIZE (HANDLE SCALED VALUES)
    ========================================================= */
    const normalizeCoord = (num, type) => {
        if (isNaN(num)) return NaN;

        const isValid = (n) => {
            if (type === 'lat') return n >= -90 && n <= 90;
            if (type === 'lng') return n >= -180 && n <= 180;
            return false;
        };

        // If already valid → return
        if (isValid(num)) return num;

        // Try different scaling factors
        const scales = [1e6, 1e5, 1e7, 1e4];

        for (let scale of scales) {
            const scaled = num / scale;
            if (isValid(scaled)) {
                return scaled;
            }
        }

        return NaN; // ❌ truly invalid
    };
    /* =========================================================
       🧠 PARSE ANY COORD FORMAT
    ========================================================= */
    const parseCoords = (coords) => {
        if (!coords) return null;

        let lat, lng;

        // OBJECT
        if (typeof coords === 'object' && !Array.isArray(coords)) {
            const maybeLat =
                coords.lat ?? coords.latitude ?? coords.Lat ?? coords.Latitude;

            const maybeLng =
                coords.lng ?? coords.lon ?? coords.longitude ??
                coords.Lng ?? coords.Longitude;

            lat = normalizeCoord(toNumber(maybeLat), 'lat');
            lng = normalizeCoord(toNumber(maybeLng), 'lng');
        }

        // ARRAY
        else if (Array.isArray(coords) && coords.length >= 2) {
            const a = normalizeCoord(toNumber(coords[0]), 'lat');
            const b = normalizeCoord(toNumber(coords[1]), 'lng');

            if (a >= -90 && a <= 90 && b >= -180 && b <= 180) {
                lat = a; lng = b;
            } else if (b >= -90 && b <= 90 && a >= -180 && a <= 180) {
                lat = b; lng = a;
            }
        }

        // STRING
        else if (typeof coords === 'string') {
            let s = coords.trim().replace(/\u060C/g, ',');

            const parts = s.split(/[,\s]+/).filter(Boolean);

            if (parts.length >= 2) {
                const a = normalizeCoord(toNumber(parts[0]), 'lat');
                const b = normalizeCoord(toNumber(parts[1]), 'lng');

                if (a >= -90 && a <= 90 && b >= -180 && b <= 180) {
                    lat = a; lng = b;
                } else if (b >= -90 && b <= 90 && a >= -180 && a <= 180) {
                    lat = b; lng = a;
                }
            }
        }

        // FINAL VALIDATION
        if (
            isNaN(lat) ||
            isNaN(lng) ||
            lat < -90 || lat > 90 ||
            lng < -180 || lng > 180
        ) {
            return null;
        }

        return { lat, lng };
    };

    /* =========================================================
       🗺️ INIT MAP
    ========================================================= */
    useEffect(() => {
        if (!apiLoaded || !mapRef.current || map || !window.google?.maps) return;

        const googleMap = new window.google.maps.Map(mapRef.current, {
            center: { lat: 25.403027, lng: 55.523542 },
            zoom: 8,
            mapTypeId: 'hybrid',
        });

        setMap(googleMap);
    }, [apiLoaded, map]);

    /* =========================================================
       📍 MARKERS + CLUSTERING
    ========================================================= */
    useEffect(() => {
        if (!apiLoaded || !map || !farms.length) return;

        // Cleanup old markers
        markersRef.current.forEach(m => m.setMap(null));
        markersRef.current = [];

        if (clustererRef.current) {
            clustererRef.current.clearMarkers();
            clustererRef.current.setMap(null);
        }

        const bounds = new window.google.maps.LatLngBounds();

        const markers = farms.map((farm) => {
            const parsed = parseCoords(farm.coordinates);

            if (!parsed) {
                if (isDev) {
                    console.warn('❌ Invalid coordinates', {
                        farm: farm.farmName,
                        raw: farm.coordinates
                    });
                }
                return null;
            }

            const { lat, lng } = parsed;

            const marker = new window.google.maps.Marker({
                position: { lat, lng },
                title: farm.farmName,
                icon: {
                    path: window.google.maps.SymbolPath.CIRCLE,
                    scale: 9,
                    fillColor: '#10b981',
                    fillOpacity: 0.9,
                    strokeColor: '#059669',
                    strokeWeight: 2,
                }
            });

            bounds.extend({ lat, lng });

            const infoWindow = new window.google.maps.InfoWindow({
                content: `
                    <div style="padding:10px;min-width:200px;font-family:sans-serif">
                        <h3 style="margin:0 0 6px;color:#059669">${farm.farmName}</h3>
                        <p style="margin:4px 0">
                            <b>${t('sizes.map.sizeLabel')}:</b> 
                            ${farm.totalArea || t('nA')} ${t('sizes.map.unit')}
                        </p>
                        <button id="farm-${farm.id}" 
                            style="margin-top:8px;padding:8px;background:#10b981;color:white;border:none;border-radius:5px;cursor:pointer;width:100%">
                            ${t('common.components.viewDetails')}
                        </button>
                    </div>
                `
            });

            marker.addListener('click', () => {
                infoWindow.open(map, marker);

                setTimeout(() => {
                    const btn = document.getElementById(`farm-${farm.id}`);
                    if (btn) btn.onclick = () => onFarmClick?.(farm);
                }, 50);
            });

            return marker;
        }).filter(Boolean);

        markersRef.current = markers;

        if (markers.length) {
            map.fitBounds(bounds);
        }

        const initClusterer = () => {
            clustererRef.current = new window.markerClusterer.MarkerClusterer({
                map,
                markers,
                algorithm: new window.markerClusterer.SuperClusterAlgorithm({
                    radius: 140,
                    maxZoom: 16,
                }),
            });
        };

        if (window.markerClusterer) {
            initClusterer();
        } else {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/@googlemaps/markerclusterer/dist/index.min.js';
            script.async = true;
            script.onload = initClusterer;
            document.head.appendChild(script);
        }

        return () => {
            clustererRef.current?.clearMarkers();
        };

    }, [apiLoaded, map, farms, onFarmClick]);

    /* =========================================================
       🎨 UI STATES
    ========================================================= */
    if (error) {
        return (
            <div className="flex items-center justify-center h-screen text-red-600">
                {error.message}
            </div>
        );
    }

    if (!apiLoaded) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader className="animate-spin text-green-600" />
            </div>
        );
    }

    return <div ref={mapRef} className="w-full h-screen" />;
};

export default GoogleMapWithClustering;