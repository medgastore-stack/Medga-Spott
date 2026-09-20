import { useState, useEffect, useCallback } from 'react';
import { getUserPoints, getPointsHistory, addPoints, redeemPoints, syncPointsWithFirestore } from '../lib/pointsUtils';
import { PointsTransaction, User } from '../types';

export function useRewardPoints(user?: User) {
  const [points, setPoints] = useState<number>(() => getUserPoints(user?.email));
  const [history, setHistory] = useState<PointsTransaction[]>(() => getPointsHistory(user?.email));

  const refresh = useCallback(() => {
    setPoints(getUserPoints(user?.email));
    setHistory(getPointsHistory(user?.email));
  }, [user?.email]);

  useEffect(() => {
    refresh();

    if (user?.email) {
      syncPointsWithFirestore(user.email).then((synced) => {
        setPoints(synced);
        setHistory(getPointsHistory(user.email));
      }).catch(() => {});
    }

    const handleUpdate = () => {
      refresh();
    };

    window.addEventListener('sst_points_updated', handleUpdate);
    return () => {
      window.removeEventListener('sst_points_updated', handleUpdate);
    };
  }, [refresh, user?.email]);

  const earnPoints = async (amount: number, reason: PointsTransaction['reason'], description: string) => {
    const updated = await addPoints(amount, reason, description, user?.email, user?.name);
    setPoints(updated);
    setHistory(getPointsHistory(user?.email));
    return updated;
  };

  const usePoints = async (amount: number, description: string) => {
    const success = await redeemPoints(amount, description, user?.email, user?.name);
    if (success) {
      refresh();
    }
    return success;
  };

  return {
    points,
    history,
    refresh,
    earnPoints,
    usePoints,
  };
}
