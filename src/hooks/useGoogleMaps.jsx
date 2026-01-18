// useGoogleMaps.js - Custom hook to load Google Maps API once
import { useState, useEffect } from 'react';

const GOOGLE_MAPS_API_KEY = 'AIzaSyAuJYLmzmglhCpBYTn0BjbJhjWYg0fPEEA';

let isLoading = false;
let isLoaded = false;
let loadPromise = null;

const loadGoogleMapsScript = (includeDrawing = false) => {
  if (isLoaded) {
    return Promise.resolve();
  }

  if (loadPromise) {
    return loadPromise;
  }

  isLoading = true;
  
  loadPromise = new Promise((resolve, reject) => {
    if (window.google && window.google.maps) {
      isLoaded = true;
      isLoading = false;
      resolve();
      return;
    }

    const script = document.createElement('script');
    const libraries = includeDrawing ? '&libraries=drawing' : '';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}${libraries}`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      isLoaded = true;
      isLoading = false;
      resolve();
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
    loadGoogleMapsScript(includeDrawing)
      .then(() => setApiLoaded(true))
      .catch((err) => {
        console.error('Google Maps loading error:', err);
        setError(err);
      });
  }, [includeDrawing]);

  return { apiLoaded, error };
};

export default useGoogleMaps;