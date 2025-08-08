// File: frontend/src/pages/DashboardContainer.tsx (EXAMPLE)

import { useState } from 'react';
import { EnterSalePage } from './EnterSalePage';
import { LeaderboardPage } from './LeaderboardPage';

export const DashboardContainer = () => {
  // This state variable acts as a trigger.
  const [leaderboardUpdateTrigger, setLeaderboardUpdateTrigger] = useState(0);

  // This function will be called by EnterSalePage when a sale is successful.
  const handleSaleSuccess = () => {
    // Updating the trigger will cause the LeaderboardPage to re-fetch its data.
    setLeaderboardUpdateTrigger(prev => prev + 1);
  };

  return (
    <div className="dashboard-layout">
      <div className="sale-entry-panel">
        <EnterSalePage onSaleSuccess={handleSaleSuccess} />
      </div>
      <div className="leaderboard-panel">
        {/* The prop is now correctly passed to a component that accepts it. */}
        <LeaderboardPage leaderboardUpdateTrigger={leaderboardUpdateTrigger} />
      </div>
    </div>
  );
};