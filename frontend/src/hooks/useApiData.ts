// ==============================================================================
// File: frontend/src/hooks/useApiData.ts (FINAL & CORRECTED)
// Description: This version prevents race conditions by resetting the data to null
// whenever the API endpoint changes, before the new data has been fetched.
// ==============================================================================
import { useState, useEffect } from 'react';
import apiClient from '../services/api';

export const useApiData = <T>(endpoint: string | null, trigger?: any) => {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        // This flag prevents state updates if the component unmounts during the fetch
        let isMounted = true;

        const fetchData = async () => {
            // If there's no endpoint, do nothing.
            if (!endpoint) {
                if (isMounted) {
                    setData(null);
                    setLoading(false);
                }
                return;
            };

            // THIS IS THE FIX:
            // Immediately set loading to true and clear out old data.
            // This ensures the UI shows a "Loading..." state instead of
            // trying to render a component with the wrong data shape.
            if (isMounted) {
                setLoading(true);
                setError('');
                setData(null); 
            }

            try {
                const response = await apiClient.get<T>(endpoint);
                if (isMounted) {
                    setData(response.data);
                }
            } catch (err) {
                if (isMounted) {
                    setError('Failed to fetch data.');
                    console.error("API Fetch Error:", err);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchData();

        // This is a cleanup function that runs when the component unmounts
        // or when the dependencies (endpoint, trigger) change.
        return () => {
            isMounted = false;
        };
    }, [endpoint, trigger]); // Re-run this effect if the endpoint or trigger changes

    return { data, loading, error };
};
