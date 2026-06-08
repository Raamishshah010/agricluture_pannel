// useGoogleMaps.js - Custom hook to read Google Maps API load state from vis.gl
import { useMemo } from 'react';
import { APILoadingStatus, useApiIsLoaded, useApiLoadingStatus, useMapsLibrary } from '@vis.gl/react-google-maps';

export const useGoogleMaps = () => {
  const apiIsLoaded = useApiIsLoaded();
  const apiLoadingStatus = useApiLoadingStatus();
  const markerLibrary = useMapsLibrary('marker');

  const apiLoaded = apiIsLoaded && Boolean(markerLibrary || window.google?.maps?.marker);

  const error = useMemo(() => {
    if (apiLoadingStatus === APILoadingStatus.FAILED) {
      return new Error('Failed to load Google Maps API');
    }

    if (apiLoadingStatus === APILoadingStatus.AUTH_FAILURE) {
      return new Error('Google Maps API authentication failed');
    }

    return null;
  }, [apiLoadingStatus]);

  return { apiLoaded, error };
};

export default useGoogleMaps;
