import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import createContextHook from '@nkzw/create-context-hook';
import { ensureNotificationPermission, getNotifications } from '@/utils/notifications';

const AZKAR_PROGRESS_KEY = '@azkar_progress';
const AZKAR_NOTIFICATIONS_KEY = '@azkar_notifications';

interface AzkarProgress {
  [categoryId: string]: {
    [zikrId: number]: number;
    completedAt?: string;
  };
}

interface NotificationSettings {
  sabahEnabled: boolean;
  sabahTime: { hour: number; minute: number };
  masaaEnabled: boolean;
  masaaTime: { hour: number; minute: number };
}

const defaultNotificationSettings: NotificationSettings = {
  sabahEnabled: true,
  sabahTime: { hour: 5, minute: 30 },
  masaaEnabled: true,
  masaaTime: { hour: 17, minute: 0 },
};

export const [AzkarProvider, useAzkar] = createContextHook(() => {
  const [progress, setProgress] = useState<AzkarProgress>({});
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(defaultNotificationSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [progressData, notifData] = await Promise.all([
        AsyncStorage.getItem(AZKAR_PROGRESS_KEY),
        AsyncStorage.getItem(AZKAR_NOTIFICATIONS_KEY),
      ]);

      if (progressData) {
        const parsed = JSON.parse(progressData);
        const today = new Date().toDateString();
        
        const resetProgress: AzkarProgress = {};
        Object.keys(parsed).forEach(categoryId => {
          if (parsed[categoryId].completedAt === today) {
            resetProgress[categoryId] = parsed[categoryId];
          } else {
            resetProgress[categoryId] = { completedAt: '' };
          }
        });
        setProgress(resetProgress);
      }

      if (notifData) {
        setNotificationSettings(JSON.parse(notifData));
      }
    } catch (error) {
      console.log('Error loading azkar data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveProgress = async (newProgress: AzkarProgress) => {
    try {
      await AsyncStorage.setItem(AZKAR_PROGRESS_KEY, JSON.stringify(newProgress));
    } catch (error) {
      console.log('Error saving azkar progress:', error);
    }
  };

  const incrementZikrCount = useCallback((categoryId: string, zikrId: number, maxCount: number) => {
    setProgress(prev => {
      const categoryProgress = prev[categoryId] || {};
      const currentCount = categoryProgress[zikrId] || 0;
      const newCount = currentCount >= maxCount ? maxCount : currentCount + 1;
      
      const newProgress = {
        ...prev,
        [categoryId]: {
          ...categoryProgress,
          [zikrId]: newCount,
          completedAt: new Date().toDateString(),
        },
      };
      
      saveProgress(newProgress);
      return newProgress;
    });
  }, []);

  const getZikrCount = useCallback((categoryId: string, zikrId: number): number => {
    return progress[categoryId]?.[zikrId] || 0;
  }, [progress]);

  const isZikrCompleted = useCallback((categoryId: string, zikrId: number, maxCount: number): boolean => {
    const count = getZikrCount(categoryId, zikrId);
    return count >= maxCount;
  }, [getZikrCount]);

  const getCategoryProgress = useCallback((categoryId: string, azkar: { id: number; count: number }[]): { completed: number; total: number } => {
    const categoryProgress = progress[categoryId] || {};
    let completed = 0;
    
    azkar.forEach(zikr => {
      if ((categoryProgress[zikr.id] || 0) >= zikr.count) {
        completed++;
      }
    });
    
    return { completed, total: azkar.length };
  }, [progress]);

  const resetCategoryProgress = useCallback((categoryId: string) => {
    setProgress(prev => {
      const newProgress = {
        ...prev,
        [categoryId]: { completedAt: '' },
      };
      saveProgress(newProgress);
      return newProgress;
    });
  }, []);

  const resetSingleZikr = useCallback((categoryId: string, zikrId: number) => {
    setProgress(prev => {
      const categoryProgress = prev[categoryId] || {};
      const newProgress = {
        ...prev,
        [categoryId]: {
          ...categoryProgress,
          [zikrId]: 0,
        },
      };
      saveProgress(newProgress);
      return newProgress;
    });
  }, []);

  const scheduleAzkarNotification = async (
    categoryId: 'sabah' | 'masaa',
    hour: number,
    minute: number
  ) => {
    const Notifications = await getNotifications();
    if (!Notifications) return;

    const identifier = `azkar_${categoryId}`;
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => {});

      const title = categoryId === 'sabah' ? '🌅 أذكار الصباح' : '🌆 أذكار المساء';
      const body = categoryId === 'sabah'
        ? 'حان وقت أذكار الصباح، اذكر الله'
        : 'حان وقت أذكار المساء، اذكر الله';

      await Notifications.scheduleNotificationAsync({
        content: { title, body, sound: true },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
        },
        identifier,
      });
    } catch (error) {
      console.log('Error scheduling notification:', error);
    }
  };

  const applyNotificationSchedule = async (settings: NotificationSettings) => {
    const Notifications = await getNotifications();
    if (!Notifications) return;

    if (settings.sabahEnabled) {
      await scheduleAzkarNotification('sabah', settings.sabahTime.hour, settings.sabahTime.minute);
    } else {
      await Notifications.cancelScheduledNotificationAsync('azkar_sabah').catch(() => {});
    }

    if (settings.masaaEnabled) {
      await scheduleAzkarNotification('masaa', settings.masaaTime.hour, settings.masaaTime.minute);
    } else {
      await Notifications.cancelScheduledNotificationAsync('azkar_masaa').catch(() => {});
    }
  };

  const updateNotificationSettings = useCallback(async (settings: Partial<NotificationSettings>) => {
    const newSettings = { ...notificationSettings, ...settings };
    setNotificationSettings(newSettings);

    try {
      await AsyncStorage.setItem(AZKAR_NOTIFICATIONS_KEY, JSON.stringify(newSettings));

      if (await getNotifications()) {
        if (await ensureNotificationPermission()) {
          await applyNotificationSchedule(newSettings);
        } else {
          Alert.alert('تنبيه', 'يرجى السماح بالإشعارات من إعدادات الجهاز');
        }
      }
    } catch (error) {
      console.log('Error updating notification settings:', error);
    }
  }, [notificationSettings]);

  // يجب أن تُستدعى بعد اكتمال تحميل الإعدادات المحفوظة، وإلا تُجدول المواعيد الافتراضية
  // فوق المواعيد التي اختارها المستخدم.
  const initializeNotifications = useCallback(async () => {
    if (isLoading) return;
    if (!(await getNotifications())) return;
    if (await ensureNotificationPermission()) {
      await applyNotificationSchedule(notificationSettings);
    }
  }, [isLoading, notificationSettings]);

  return {
    progress,
    isLoading,
    incrementZikrCount,
    getZikrCount,
    isZikrCompleted,
    getCategoryProgress,
    resetCategoryProgress,
    resetSingleZikr,
    notificationSettings,
    updateNotificationSettings,
    initializeNotifications,
  };
});
