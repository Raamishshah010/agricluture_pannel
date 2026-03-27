// useGoogleMaps.js - Custom hook to load Google Maps API once
import { useState, useEffect } from 'react';

const GOOGLE_MAPS_API_KEY = 'AIzaSyAuJYLmzmglhCpBYTn0BjbJhjWYg0fPEEA';

let isLoading = false;
let isLoaded = false;
let loadPromise = null;

const isGoogleMapsReady = (includeDrawing) => {
  const maps = window.google?.maps;
  if (!maps || typeof maps.Map !== 'function') {
    return false;
  }

  if (!includeDrawing) {
    return true;
  }

  return typeof maps.drawing?.DrawingManager === 'function';
};

const waitForGoogleMapsReady = (includeDrawing, timeoutMs = 15000) => new Promise((resolve, reject) => {
  const startedAt = Date.now();

  const check = () => {
    if (isGoogleMapsReady(includeDrawing)) {
      resolve();
      return;
    }

    if (Date.now() - startedAt >= timeoutMs) {
      reject(new Error('Google Maps API loaded, but the Map constructor was not ready in time'));
      return;
    }

    window.setTimeout(check, 50);
  };

  check();
});

const loadGoogleMapsScript = (includeDrawing = false) => {
  if (isLoaded) {
    return Promise.resolve();
  }

  if (loadPromise) {
    return loadPromise;
  }

  isLoading = true;
  
  loadPromise = new Promise((resolve, reject) => {
    if (isGoogleMapsReady(includeDrawing)) {
      isLoaded = true;
      isLoading = false;
      resolve();
      return;
    }

    const script = document.createElement('script');
    const libraries = includeDrawing ? '&libraries=drawing' : '';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&loading=async${libraries}`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      waitForGoogleMapsReady(includeDrawing)
        .then(() => {
          isLoaded = true;
          isLoading = false;
          resolve();
        })
        .catch((error) => {
          isLoading = false;
          loadPromise = null;
          reject(error);
        });
    };
    
    script.onerror = () => {
      isLoading = false;
      loadPromise = null;
      reject(new Error('Failed to load Google Maps API'));
    };
    
    document.head.appendChild(script);
  });

  return loadPromise;
};

export const useGoogleMaps = (includeDrawing = false) => {
  const [apiLoaded, setApiLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        await loadGoogleMapsScript(includeDrawing);
        setApiLoaded(true);
      } catch (err) {
        console.error('Google Maps loading error:', err);
        setError(err);
      }
    };
    load();
  }, [includeDrawing]);

  return { apiLoaded, error };
};

export default useGoogleMaps;