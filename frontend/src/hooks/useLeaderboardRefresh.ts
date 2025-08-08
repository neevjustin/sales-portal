// File: frontend/src/hooks/useLeaderboardRefresh.ts

import { useState, useCallback } from 'react';

export const useLeaderboardRefresh = () => {
  // State to hold the trigger value.
  const [refreshKey, setRefreshKey] = useState(0);

  // A memoized callback function to increment the key.
  // This function is stable and can be passed to child components.
  const triggerRefresh = useCallback(() => {
    setRefreshKey(prevKey => prevKey + 1);
  }, []);

  // Return the key and the function to update it.
  return { refreshKey, triggerRefresh };
};