import { useState, useCallback } from 'react';

const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const request = useCallback(async (url, method = 'GET', body = null, headers = {}) => {
    console.log(`[API] Making ${method} request to: ${url}`); // Debug log
    setLoading(true);
    setError(null);

    try {
      const config = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      };

      if (body) {
        config.body = JSON.stringify(body);
        console.log('[API] Request body:', body); // Debug log
      }

      const response = await fetch(url, config);
      console.log('[API] Response status:', response.status); // Debug log

      const data = await response.json();
      console.log('[API] Response data:', data); // Debug log

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      setLoading(false);
      return data;
    } catch (err) {
      console.error('[API] Error:', err); // Debug log
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, []);

  return {
    loading,
    error,
    get: useCallback((url, headers = {}) => request(url, 'GET', null, headers), [request]),
    post: useCallback((url, body, headers = {}) => request(url, 'POST', body, headers), [request]),
    put: useCallback((url, body, headers = {}) => request(url, 'PUT', body, headers), [request]),
    delete: useCallback((url, headers = {}) => request(url, 'DELETE', null, headers), [request])
  };
};

export default useApi;