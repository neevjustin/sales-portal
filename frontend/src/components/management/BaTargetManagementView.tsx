// File: frontend/src/components/management/BaTargetManagementView.tsx

import { useEffect, useState, useMemo } from 'react';
import apiClient from '../../services/api';
import { useCampaign } from '../../context/CampaignContext';
import { Save } from 'lucide-react';

interface BusinessArea {
  id: number;
  name: string;
}

interface ActivityType {
  id: number;
  name: string;
}

interface BaTarget {
  ba_id: number;
  activity_type_id: number;
  target_value: number;
}

export const BaTargetManagementView = () => {
  const [businessAreas, setBusinessAreas] = useState<BusinessArea[]>([]);
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);
  const [targets, setTargets] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { selectedCampaign } = useCampaign();

  const targetableActivities = useMemo(() => {
    const targetNames = ['MNP', 'SIM Sales', '4G SIM Upgradation'];
    return activityTypes
      .filter((at) => targetNames.includes(at.name))
      .sort((a, b) => targetNames.indexOf(a.name) - targetNames.indexOf(b.name));
  }, [activityTypes]);

  const ftthActivityIds = useMemo(() => {
    const urban = activityTypes.find((at) => at.name === 'Urban connections');
    const bnu = activityTypes.find((at) => at.name === 'BNU connections');
    return { urbanId: urban?.id, bnuId: bnu?.id };
  }, [activityTypes]);

  useEffect(() => {
    if (!selectedCampaign) return;
    let isMounted = true;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [baRes, activityTypesRes, targetsRes] = await Promise.all([
          apiClient.get('/api/teams/business-areas/'),
          apiClient.get('/api/activities/types/all'),
          apiClient.get(`/api/targets/by_circle/${selectedCampaign.id}`),
        ]);

        if (!isMounted) return;

        setBusinessAreas(baRes.data);
        setActivityTypes(activityTypesRes.data);

        const initialTargets: Record<string, number> = {};
        targetsRes.data.forEach((t: BaTarget) => {
          initialTargets[`${t.ba_id}-${t.activity_type_id}`] = t.target_value;
        });
        setTargets(initialTargets);
      } catch {
        if (isMounted) {
          setMessage({ type: 'error', text: 'Failed to load initial target data.' });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, [selectedCampaign]);

  const handleTargetChange = (baId: number, activityTypeId: number, value: string) => {
    const numValue = parseInt(value, 10);
    setTargets((prev) => ({
      ...prev,
      [`${baId}-${activityTypeId}`]: isNaN(numValue) ? 0 : numValue,
    }));
  };

  const handleSaveTargets = async () => {
    if (!selectedCampaign) return;
    setIsSaving(true);
    setMessage(null);

    const payload = Object.entries(targets).map(([key, value]) => {
      const [ba_id, activity_type_id] = key.split('-').map(Number);
      return { ba_id, activity_type_id, target_value: value, campaign_id: selectedCampaign.id };
    });

    try {
      await apiClient.post('/api/targets/batch_ba', payload);
      setMessage({ type: 'success', text: 'All BA targets saved successfully!' });
    } catch {
      setMessage({ type: 'error', text: 'An error occurred while saving targets.' });
    } finally {
      setIsSaving(false);
    }
  };

  const columnTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    const allTargetIds = [
      ...targetableActivities.map((at) => at.id),
      ftthActivityIds.urbanId,
      ftthActivityIds.bnuId,
    ].filter((id): id is number => Boolean(id));

    for (const activityId of allTargetIds) {
      let columnSum = 0;
      for (const ba of businessAreas) {
        columnSum += targets[`${ba.id}-${activityId}`] || 0;
      }
      totals[activityId] = columnSum;
    }
    totals['ftth_total'] =
      (totals[ftthActivityIds.urbanId!] || 0) + (totals[ftthActivityIds.bnuId!] || 0);
    return totals;
  }, [targets, businessAreas, targetableActivities, ftthActivityIds]);

  if (loading) return <div>Loading BA Target Management...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold">Set Business Area Targets</h2>
        <button
          onClick={handleSaveTargets}
          disabled={isSaving}
          className="w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md disabled:bg-blue-300"
        >
          <Save size={20} className="mr-2" />
          {isSaving ? 'Saving...' : 'Save All Targets'}
        </button>
      </div>

      {message && (
        <div
          className={`p-3 text-sm rounded-lg ${
            message.type === 'success'
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 uppercase">
            <tr>
              <th
                rowSpan={2}
                className="py-3 px-6 text-left align-middle border-b-2 border-gray-300 dark:border-gray-600"
              >
                Business Area
              </th>
              {targetableActivities.map((at) => (
                <th
                  rowSpan={2}
                  key={at.id}
                  className="py-3 px-6 text-center align-middle border-b-2 border-gray-300 dark:border-gray-600"
                >
                  {at.name}
                </th>
              ))}
              <th
                colSpan={3}
                className="py-3 px-6 text-center border-b-2 border-gray-300 dark:border-gray-600"
              >
                FTTH Provision Target
              </th>
            </tr>
            <tr>
              <th className="py-2 px-3 text-center font-medium">Urban</th>
              <th className="py-2 px-3 text-center font-medium">BNU</th>
              <th className="py-2 px-3 text-center font-medium bg-gray-300 dark:bg-gray-600">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="text-gray-600 dark:text-gray-300">
            {businessAreas.map((ba) => {
              const urbanTarget =
                (ftthActivityIds.urbanId
                  ? targets[`${ba.id}-${ftthActivityIds.urbanId}`]
                  : 0) || 0;
              const bnuTarget =
                (ftthActivityIds.bnuId
                  ? targets[`${ba.id}-${ftthActivityIds.bnuId}`]
                  : 0) || 0;
              const totalFtth = urbanTarget + bnuTarget;

              return (
                <tr
                  key={ba.id}
                  className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <td className="py-3 px-6 text-left font-semibold">{ba.name}</td>
                  {targetableActivities.map((at) => (
                    <td key={at.id} className="py-2 px-3 text-center">
                      <input
                        type="number"
                        min="0"
                        value={targets[`${ba.id}-${at.id}`] || ''}
                        onChange={(e) =>
                          handleTargetChange(ba.id, at.id, e.target.value)
                        }
                        className="w-24 text-center bg-white dark:bg-gray-700 border rounded-md p-1"
                      />
                    </td>
                  ))}
                  {ftthActivityIds.urbanId && (
                    <td className="py-2 px-3 text-center">
                      <input
                        type="number"
                        min="0"
                        value={urbanTarget}
                        onChange={(e) =>
                          handleTargetChange(
                            ba.id,
                            ftthActivityIds.urbanId!,
                            e.target.value
                          )
                        }
                        className="w-24 text-center bg-white dark:bg-gray-700 border rounded-md p-1"
                      />
                    </td>
                  )}
                  {ftthActivityIds.bnuId && (
                    <td className="py-2 px-3 text-center">
                      <input
                        type="number"
                        min="0"
                        value={bnuTarget}
                        onChange={(e) =>
                          handleTargetChange(
                            ba.id,
                            ftthActivityIds.bnuId!,
                            e.target.value
                          )
                        }
                        className="w-24 text-center bg-white dark:bg-gray-700 border rounded-md p-1"
                      />
                    </td>
                  )}
                  <td className="py-3 px-6 text-center font-bold bg-gray-100 dark:bg-gray-700/50">
                    {totalFtth}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-gray-300 dark:bg-gray-900 font-bold text-gray-800 dark:text-gray-100">
            <tr>
              <td className="py-3 px-6 text-left">TOTALS</td>
              {targetableActivities.map((at) => (
                <td key={at.id} className="py-3 px-3 text-center">
                  {columnTotals[at.id]?.toLocaleString() || 0}
                </td>
              ))}
              {ftthActivityIds.urbanId && (
                <td className="py-3 px-3 text-center">
                  {columnTotals[ftthActivityIds.urbanId]?.toLocaleString() || 0}
                </td>
              )}
              {ftthActivityIds.bnuId && (
                <td className="py-3 px-3 text-center">
                  {columnTotals[ftthActivityIds.bnuId]?.toLocaleString() || 0}
                </td>
              )}
              <td className="py-3 px-6 text-center bg-gray-400 dark:bg-black">
                {columnTotals['ftth_total']?.toLocaleString() || 0}
              </td>
            </tr>
          </tfoot>
        </table>
        {businessAreas.length === 0 && (
          <p className="p-4 text-center">No Business Areas found. Please contact support.</p>
        )}
      </div>
    </div>
  );
};
