import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { JUZ_RANGES, TOTAL_PAGES } from '@/data/quranData';
import { cancelScheduledByPrefix, ensureNotificationPermission, getNotifications } from '@/utils/notifications';

const HIFZ_REMINDER_ID = 'hifz_daily';
const HIFZ_REMINDER_HOUR = 20;

export type PageStatus = 'none' | 'memorized' | 'weak' | 'strong';
export type RevisionQuality = 'again' | 'hard' | 'good' | 'easy';

export interface PageRecord {
  pageNum: number;
  status: PageStatus;
  memorizedAt?: string; // ISO date
  lastRevisedAt?: string; // ISO date
  nextRevisionDue?: string; // ISO date (spaced repetition)
  revisionCount: number;
  easeFactor: number; // SM-2 ease factor (starts at 2.5)
  interval: number; // days until next revision
  quality?: RevisionQuality;
}

export interface DailyLog {
  date: string; // YYYY-MM-DD
  pagesMemorized: number[];
  pagesRevised: number[];
}

export interface HifzSettings {
  dailyMemorizeTarget: number; // pages per day
  dailyReviseTarget: number; // pages per day
  notificationsEnabled: boolean;
}

export interface HifzStats {
  totalMemorized: number;
  totalStrong: number;
  totalWeak: number;
  currentStreak: number;
  longestStreak: number;
  todayMemorized: number;
  todayRevised: number;
  estimatedCompletionDate: string | null;
  completedJuzs: number[];
  percentComplete: number;
}

interface HifzContextType {
  pages: Record<number, PageRecord>;
  settings: HifzSettings;
  dailyLogs: DailyLog[];
  stats: HifzStats;
  isLoaded: boolean;

  // Memorize actions
  markPageMemorized: (pageNum: number) => void;
  markPageStatus: (pageNum: number, status: PageStatus) => void;
  markRangeMemorized: (from: number, to: number) => void;

  // Revision actions
  recordRevision: (pageNum: number, quality: RevisionQuality) => void;
  getPagesForRevision: () => PageRecord[];
  getOverduePages: () => PageRecord[];

  // Settings
  updateSettings: (s: Partial<HifzSettings>) => void;

  // Utils
  getPageRecord: (pageNum: number) => PageRecord;
  getJuzProgress: (juzNum: number) => { memorized: number; total: number; percent: number };
  resetAll: () => void;
}

const defaultSettings: HifzSettings = {
  dailyMemorizeTarget: 1,
  dailyReviseTarget: 5,
  notificationsEnabled: false,
};

const defaultPageRecord = (pageNum: number): PageRecord => ({
  pageNum,
  status: 'none',
  revisionCount: 0,
  easeFactor: 2.5,
  interval: 1,
});

// نطاقات صفحات الأجزاء (مشتقة من بيانات المصحف في quranData)
const JUZ_PAGES: [number, number][] = JUZ_RANGES;

const HifzContext = createContext<HifzContextType | null>(null);

// SM-2 spaced repetition algorithm
function sm2(record: PageRecord, quality: RevisionQuality): Partial<PageRecord> {
  const qMap = { again: 0, hard: 2, good: 4, easy: 5 };
  const q = qMap[quality];
  
  let { easeFactor, interval } = record;
  
  if (q < 3) {
    interval = 1;
  } else if (record.revisionCount === 0) {
    interval = 1;
  } else if (record.revisionCount === 1) {
    interval = 6;
  } else {
    interval = Math.round(interval * easeFactor);
  }
  
  easeFactor = Math.max(1.3, easeFactor + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + interval);
  
  const newStatus: PageStatus = q >= 4 ? 'strong' : q >= 3 ? 'memorized' : 'weak';
  
  return {
    easeFactor,
    interval,
    nextRevisionDue: nextDate.toISOString(),
    lastRevisedAt: new Date().toISOString(),
    revisionCount: record.revisionCount + 1,
    quality,
    status: newStatus,
  };
}

// تاريخ محلي بصيغة YYYY-MM-DD (toISOString يعطي تاريخ UTC فيُخطئ في اليوم بعد منتصف الليل بتوقيت القاهرة)
function dateStr(d: Date) {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function todayStr() {
  return dateStr(new Date());
}

function parseDateStr(s: string) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function HifzProvider({ children }: { children: React.ReactNode }) {
  const [pages, setPages] = useState<Record<number, PageRecord>>({});
  const [settings, setSettings] = useState<HifzSettings>(defaultSettings);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [pagesJson, settingsJson, logsJson] = await Promise.all([
        AsyncStorage.getItem('hifz_pages'),
        AsyncStorage.getItem('hifz_settings'),
        AsyncStorage.getItem('hifz_logs'),
      ]);
      if (pagesJson) setPages(JSON.parse(pagesJson));
      if (settingsJson) setSettings({ ...defaultSettings, ...JSON.parse(settingsJson) });
      if (logsJson) setDailyLogs(JSON.parse(logsJson));
    } catch (e) {
      console.error('HifzContext loadData error', e);
    } finally {
      setIsLoaded(true);
    }
  };

  const savePages = useCallback(async (updated: Record<number, PageRecord>) => {
    await AsyncStorage.setItem('hifz_pages', JSON.stringify(updated));
  }, []);

  const saveLogs = useCallback(async (updated: DailyLog[]) => {
    await AsyncStorage.setItem('hifz_logs', JSON.stringify(updated));
  }, []);

  const updateTodayLog = useCallback((field: 'pagesMemorized' | 'pagesRevised', pageNum: number) => {
    setDailyLogs(prev => {
      const today = todayStr();
      const existing = prev.find(l => l.date === today);
      let updated: DailyLog[];
      if (existing) {
        updated = prev.map(l =>
          l.date === today
            ? { ...l, [field]: [...new Set([...l[field], pageNum])] }
            : l
        );
      } else {
        updated = [...prev, { date: today, pagesMemorized: field === 'pagesMemorized' ? [pageNum] : [], pagesRevised: field === 'pagesRevised' ? [pageNum] : [] }];
      }
      saveLogs(updated);
      return updated;
    });
  }, [saveLogs]);

  const getPageRecord = useCallback((pageNum: number): PageRecord => {
    return pages[pageNum] ?? defaultPageRecord(pageNum);
  }, [pages]);

  const markPageMemorized = useCallback((pageNum: number) => {
    setPages(prev => {
      const existing = prev[pageNum] ?? defaultPageRecord(pageNum);
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + 1);
      const updated = {
        ...prev,
        [pageNum]: {
          ...existing,
          status: 'memorized' as PageStatus,
          memorizedAt: existing.memorizedAt ?? new Date().toISOString(),
          nextRevisionDue: nextDate.toISOString(),
        },
      };
      savePages(updated);
      return updated;
    });
    updateTodayLog('pagesMemorized', pageNum);
  }, [savePages, updateTodayLog]);

  const markPageStatus = useCallback((pageNum: number, status: PageStatus) => {
    setPages(prev => {
      const existing = prev[pageNum] ?? defaultPageRecord(pageNum);
      const updated = { ...prev, [pageNum]: { ...existing, status } };
      savePages(updated);
      return updated;
    });
  }, [savePages]);

  const markRangeMemorized = useCallback((from: number, to: number) => {
    setPages(prev => {
      const updated = { ...prev };
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + 1);
      for (let p = from; p <= to; p++) {
        const existing = updated[p] ?? defaultPageRecord(p);
        if (existing.status === 'none') {
          updated[p] = {
            ...existing,
            status: 'memorized',
            memorizedAt: new Date().toISOString(),
            nextRevisionDue: nextDate.toISOString(),
          };
        }
      }
      savePages(updated);
      return updated;
    });
  }, [savePages]);

  const recordRevision = useCallback((pageNum: number, quality: RevisionQuality) => {
    setPages(prev => {
      const existing = prev[pageNum] ?? defaultPageRecord(pageNum);
      const sm2Result = sm2(existing, quality);
      const updated = { ...prev, [pageNum]: { ...existing, ...sm2Result } };
      savePages(updated);
      return updated;
    });
    updateTodayLog('pagesRevised', pageNum);
  }, [savePages, updateTodayLog]);

  const getPagesForRevision = useCallback((): PageRecord[] => {
    const today = new Date();
    return Object.values(pages).filter(p => {
      if (p.status === 'none') return false;
      if (!p.nextRevisionDue) return true;
      return new Date(p.nextRevisionDue) <= today;
    }).sort((a, b) => {
      if (!a.nextRevisionDue) return -1;
      if (!b.nextRevisionDue) return 1;
      return new Date(a.nextRevisionDue).getTime() - new Date(b.nextRevisionDue).getTime();
    });
  }, [pages]);

  const getOverduePages = useCallback((): PageRecord[] => {
    const today = new Date();
    return Object.values(pages).filter(p => {
      if (p.status === 'none') return false;
      if (!p.nextRevisionDue) return false;
      return new Date(p.nextRevisionDue) < today;
    });
  }, [pages]);

  const updateSettings = useCallback(async (s: Partial<HifzSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...s };
      AsyncStorage.setItem('hifz_settings', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const getJuzProgress = useCallback((juzNum: number) => {
    const [from, to] = JUZ_PAGES[juzNum - 1] ?? [0, 0];
    const total = to - from + 1;
    let memorized = 0;
    for (let p = from; p <= to; p++) {
      if (pages[p] && pages[p].status !== 'none') memorized++;
    }
    return { memorized, total, percent: total > 0 ? Math.round((memorized / total) * 100) : 0 };
  }, [pages]);

  const resetAll = useCallback(async () => {
    setPages({});
    setDailyLogs([]);
    await AsyncStorage.multiRemove(['hifz_pages', 'hifz_logs']);
  }, []);

  // ── تنبيه المراجعة اليومي ──
  useEffect(() => {
    if (!isLoaded) return;
    let cancelled = false;
    (async () => {
      const N = await getNotifications();
      if (!N || cancelled) return;
      await cancelScheduledByPrefix(HIFZ_REMINDER_ID);
      if (!settings.notificationsEnabled) return;
      if (!(await ensureNotificationPermission()) || cancelled) return;
      await N.scheduleNotificationAsync({
        identifier: HIFZ_REMINDER_ID,
        content: {
          title: '📖 وقت المراجعة',
          body: 'حان وقت مراجعة حفظك اليوم، ولو صفحة واحدة',
          sound: true,
        },
        trigger: { type: N.SchedulableTriggerInputTypes.DAILY, hour: HIFZ_REMINDER_HOUR, minute: 0 },
      }).catch(() => {});
    })();
    return () => { cancelled = true; };
  }, [isLoaded, settings.notificationsEnabled]);

  // ── الإحصائيات ──
  const stats: HifzStats = useMemo(() => {
    const allRecords = Object.values(pages);
    const totalMemorized = allRecords.filter(p => p.status !== 'none').length;
    const totalStrong = allRecords.filter(p => p.status === 'strong').length;
    const totalWeak = allRecords.filter(p => p.status === 'weak').length;
    const percentComplete = Math.round((totalMemorized / TOTAL_PAGES) * 100);

    const today = todayStr();
    const todayLog = dailyLogs.find(l => l.date === today);
    const todayMemorized = todayLog?.pagesMemorized.length ?? 0;
    const todayRevised = todayLog?.pagesRevised.length ?? 0;

    // السلسلة المتتالية: الأيام التي فيها نشاط (حفظ أو مراجعة)
    const activeDates = new Set(
      dailyLogs
        .filter(l => l.pagesMemorized.length > 0 || l.pagesRevised.length > 0)
        .map(l => l.date)
    );

    // السلسلة الحالية: تُحسب من اليوم، وإن لم يكن هناك نشاط اليوم بعد فمن أمس (حتى لا تنكسر قبل أن تبدأ يومك)
    const cursor = new Date();
    if (!activeDates.has(dateStr(cursor))) cursor.setDate(cursor.getDate() - 1);
    let currentStreak = 0;
    while (activeDates.has(dateStr(cursor))) {
      currentStreak++;
      cursor.setDate(cursor.getDate() - 1);
    }

    // أطول سلسلة عبر كل السجل
    let longestStreak = 0;
    let run = 0;
    let prev: Date | null = null;
    for (const d of [...activeDates].sort()) {
      const cur = parseDateStr(d);
      run = prev && Math.round((cur.getTime() - prev.getTime()) / 86400000) === 1 ? run + 1 : 1;
      longestStreak = Math.max(longestStreak, run);
      prev = cur;
    }

    // الإنجاز المتوقع
    let estimatedCompletionDate: string | null = null;
    if (settings.dailyMemorizeTarget > 0 && totalMemorized < TOTAL_PAGES) {
      const remaining = TOTAL_PAGES - totalMemorized;
      const daysNeeded = Math.ceil(remaining / settings.dailyMemorizeTarget);
      const completionDate = new Date();
      completionDate.setDate(completionDate.getDate() + daysNeeded);
      estimatedCompletionDate = completionDate.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
    }

    const completedJuzs = JUZ_PAGES
      .map((_, i) => i + 1)
      .filter(j => {
        const [from, to] = JUZ_PAGES[j - 1];
        for (let p = from; p <= to; p++) {
          if (!pages[p] || pages[p].status === 'none') return false;
        }
        return true;
      });

    return {
      totalMemorized,
      totalStrong,
      totalWeak,
      currentStreak,
      longestStreak,
      todayMemorized,
      todayRevised,
      estimatedCompletionDate,
      completedJuzs,
      percentComplete,
    };
  }, [pages, dailyLogs, settings.dailyMemorizeTarget]);

  const value = useMemo<HifzContextType>(() => ({
    pages,
    settings,
    dailyLogs,
    stats,
    isLoaded,
    markPageMemorized,
    markPageStatus,
    markRangeMemorized,
    recordRevision,
    getPagesForRevision,
    getOverduePages,
    updateSettings,
    getPageRecord,
    getJuzProgress,
    resetAll,
  }), [pages, settings, dailyLogs, stats, isLoaded, markPageMemorized, markPageStatus,
      markRangeMemorized, recordRevision, getPagesForRevision, getOverduePages, updateSettings,
      getPageRecord, getJuzProgress, resetAll]);

  return (
    <HifzContext.Provider value={value}>
      {children}
    </HifzContext.Provider>
  );
}

export function useHifz() {
  const ctx = useContext(HifzContext);
  if (!ctx) throw new Error('useHifz must be used inside HifzProvider');
  return ctx;
}

export { JUZ_PAGES, TOTAL_PAGES };