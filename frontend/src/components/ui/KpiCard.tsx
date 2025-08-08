// File: frontend/src/components/ui/KpiCard.tsx (NEW FILE)
import { TrendingUp } from 'lucide-react';

interface KpiCardProps {
  title: string;
  achieved: number;
  target: number;
  colorClass: string;
}

export const KpiCard = ({ title, achieved, target, colorClass }: KpiCardProps) => {
  const percentage = target > 0 ? ((achieved / target) * 100).toFixed(1) : 0;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <div className="flex items-center">
        <div className={`p-3 rounded-full mr-4 ${colorClass}`}>
          <TrendingUp size={24} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            {achieved.toLocaleString()} / {target.toLocaleString()}
          </p>
        </div>
      </div>
      <div className="mt-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Progress</span>
          <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{percentage}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
          <div className={`${colorClass} h-2.5 rounded-full`} style={{ width: `${percentage}%` }}></div>
        </div>
      </div>
    </div>
  );
};