// ===== File: frontend/src/components/ui/RankKpiCard.tsx (NEW FILE) =====

import { Award } from 'lucide-react';

interface RankKpiCardProps {
  rank: number;
  total: number;
  title: string;
}

export const RankKpiCard = ({ rank, total, title }: RankKpiCardProps) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex flex-col items-center justify-center">
      <Award size={32} className="text-yellow-500" />
      <h3 className="mt-2 text-lg font-semibold text-gray-500 dark:text-gray-400">{title}</h3>
      {rank > 0 ? (
        <p className="text-4xl font-bold text-gray-800 dark:text-gray-200">
          {rank}
          <span className="text-2xl font-medium text-gray-400"> / {total}</span>
        </p>
      ) : (
        <p className="text-2xl font-medium text-gray-400">No Rank</p>
      )}
    </div>
  );
};