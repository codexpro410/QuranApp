import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';

const SEBHA_COUNTS_KEY = '@sebha_counts';
const SEBHA_TOTAL_KEY = '@sebha_total';
const SEBHA_TARGET_KEY = '@sebha_target';

export const [SebhaProvider, useSebha] = createContextHook(() => {
  const [counts, setCounts] = useState<Record<number, number>>({});
  const [totalCount, setTotalCount] = useState(0);
  const [target, setTarget] = useState(33);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

const loadData = async () => {
  try {
    const [countsData, totalData, targetData] = await Promise.all([
      AsyncStorage.getItem(SEBHA_COUNTS_KEY),
      AsyncStorage.getItem(SEBHA_TOTAL_KEY),
      AsyncStorage.getItem(SEBHA_TARGET_KEY),
    ]);

    if (countsData) setCounts(JSON.parse(countsData));
    if (totalData) setTotalCount(parseInt(totalData, 10));
    if (targetData) setTarget(parseInt(targetData, 10));
  } finally {
    setIsLoading(false);
  }
};


const saveCounts = async (newCounts: Record<number, number>) => {
  await AsyncStorage.setItem(SEBHA_COUNTS_KEY, JSON.stringify(newCounts));
};


  const saveTotalCount = async (newTotal: number) => {
    try {
      await AsyncStorage.setItem(SEBHA_TOTAL_KEY, newTotal.toString());
    } catch (error) {
      console.log('Error saving sebha total:', error);
    }
  };

  const saveTarget = async (newTarget: number) => {
    try {
      await AsyncStorage.setItem(SEBHA_TARGET_KEY, newTarget.toString());
    } catch (error) {
      console.log('Error saving sebha target:', error);
    }
  };

  const increment = useCallback((id: number) => {
  setCounts(prev => {
    const newCounts = {
      ...prev,
      [id]: (prev[id] || 0) + 1,
    };
    saveCounts(newCounts);
    return newCounts;
  });

  setTotalCount(prev => {
    const newTotal = prev + 1;
    saveTotalCount(newTotal);
    return newTotal;
  });
}, []);


const reset = useCallback((id: number) => {
  setCounts(prev => {
    const newCounts = { ...prev, [id]: 0 };
    saveCounts(newCounts);
    return newCounts;
  });
}, []);


  const resetTotal = useCallback(() => {
    setTotalCount(0);
    saveTotalCount(0);
  }, []);

  const updateTarget = useCallback((newTarget: number) => {
    setTarget(newTarget);
    saveTarget(newTarget);
  }, []);

  return {
    counts,
  totalCount,
  target,
  isLoading,
  increment,
  reset,
  resetTotal,
  updateTarget,
  };
});
