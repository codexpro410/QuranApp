import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { cancelScheduledByPrefix, ensureNotificationPermission, getNotifications } from '@/utils/notifications';

export type PrayerName = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

const PRAYER_NAMES_AR: Record<PrayerName, string> = {
  fajr: 'الفجر',
  dhuhr: 'الظهر',
  asr: 'العصر',
  maghrib: 'المغرب',
  isha: 'العشاء',
};

export interface PrayerTime {
  name: PrayerName;
  nameAr: string;
  time: Date;
  timeStr: string;
}

// manual override stores hour+minute per prayer
export type ManualOverrides = Partial<Record<PrayerName, { hour: number; minute: number } | null>>;

export interface PrayerSettings {
  enabled: boolean;
  notifyBefore15: boolean;
  notifyAtTime: boolean;
  enabledPrayers: Record<PrayerName, boolean>;
  cityName: string;
  latitude: number;
  longitude: number;
  method: number;
  manualOverrides: ManualOverrides;
}

export interface CalcMethod {
  id: number;
  label: string;
  fajrAngle: number;
  ishaAngle?: number;
  ishaMinutes?: number; // used by Umm Al-Qura instead of angle
}

export const CALCULATION_METHODS: CalcMethod[] = [
  { id: 3,  label: 'الهيئة المصرية العامة للمساحة',        fajrAngle: 19.5, ishaAngle: 17.5 },
  { id: 2,  label: 'جمعية إسلامية في أمريكا (ISNA)',       fajrAngle: 15,   ishaAngle: 15   },
  { id: 4,  label: 'أم القرى – السعودية',                  fajrAngle: 18.5, ishaMinutes: 90 },
  { id: 5,  label: 'الرابطة الإسلامية العالمية (مكة)',     fajrAngle: 18,   ishaAngle: 17   },
  { id: 7,  label: 'هيئة الديانة التركية (ديانت)',         fajrAngle: 18,   ishaAngle: 17   },
  { id: 8,  label: 'مجمع الفقه الإسلامي (كراتشي)',        fajrAngle: 18,   ishaAngle: 18   },
  { id: 9,  label: 'دائرة الشؤون الإسلامية – دبي',        fajrAngle: 18.2, ishaAngle: 18.2 },
];

interface PrayerContextType {
  prayers: PrayerTime[];
  nextPrayer: PrayerTime | null;
  settings: PrayerSettings;
  updateSettings: (s: Partial<PrayerSettings>) => Promise<void>;
  setManualOverride: (prayer: PrayerName, hour: number, minute: number) => Promise<void>;
  clearManualOverride: (prayer: PrayerName) => Promise<void>;
  refresh: () => void;
}

const DEFAULT_SETTINGS: PrayerSettings = {
  enabled: false,
  notifyBefore15: true,
  notifyAtTime: true,
  enabledPrayers: { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true },
  cityName: 'القاهرة',
  latitude: 30.0444,
  longitude: 31.2357,
  method: 3,
  manualOverrides: {},
};

const STORAGE_KEY = 'prayer_settings_v2';

// ── Sun math (Meeus) ──────────────────────────────────────────────────────────
function toRad(d: number) { return d * Math.PI / 180; }
function toDeg(r: number) { return r * 180 / Math.PI; }
function fixAngle(a: number) { return a - 360 * Math.floor(a / 360); }
function fixHour(h: number) { return h - 24 * Math.floor(h / 24); }

function sunPosition(jd: number) {
  const D = jd - 2451545.0;
  const g = fixAngle(357.529 + 0.98560028 * D);
  const q = fixAngle(280.459 + 0.98564736 * D);
  const L = fixAngle(q + 1.915 * Math.sin(toRad(g)) + 0.02 * Math.sin(toRad(2 * g)));
  const e = 23.439 - 0.00000036 * D;
  const RA = toDeg(Math.atan2(Math.cos(toRad(e)) * Math.sin(toRad(L)), Math.cos(toRad(L)))) / 15;
  const decl = toDeg(Math.asin(Math.sin(toRad(e)) * Math.sin(toRad(L))));
  const EqT = q / 15 - fixHour(RA);
  return { decl, EqT };
}

function julianDay(date: Date) {
  const Y = date.getFullYear(), M = date.getMonth() + 1, D = date.getDate();
  const A = Math.floor((14 - M) / 12);
  const y = Y + 4800 - A;
  const m = M + 12 * A - 3;
  return D + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4)
    - Math.floor(y / 100) + Math.floor(y / 400) - 32045 - 0.5;
}

function computeTime(angle: number, decl: number, lat: number): number {
  const cosO = (-Math.sin(toRad(angle)) - Math.sin(toRad(lat)) * Math.sin(toRad(decl))) /
    (Math.cos(toRad(lat)) * Math.cos(toRad(decl)));
  if (cosO >= 1) return 0.0;
  if (cosO <= -1) return 12.0;
  return toDeg(Math.acos(cosO)) / 15;
}

function asrShadow(decl: number, lat: number) {
  // Shafi'i: shadow multiplier = 1
  const angle = -toDeg(Math.atan(1 / (1 + Math.tan(toRad(Math.abs(lat - decl))))));
  return computeTime(angle, decl, lat);
}

function calculatePrayers(
  date: Date,
  lat: number,
  lng: number,
  method: CalcMethod,
  overrides: ManualOverrides,
): Record<PrayerName, Date> {
  const jd = julianDay(date);
  const { decl, EqT } = sunPosition(jd);
  const timezone = -(date.getTimezoneOffset() / 60);
  const noon = 12 + timezone - lng / 15 - EqT;

  const fajrDiff    = computeTime(method.fajrAngle, decl, lat);
  const maghribDiff = computeTime(0.833, decl, lat);
  const ishaDiff    = method.ishaMinutes
    ? maghribDiff + method.ishaMinutes / 60
    : computeTime(method.ishaAngle!, decl, lat);
  const asrDiff     = asrShadow(decl, lat);

  function toDate(h: number): Date {
    const hours = Math.floor(h);
    const minutes = Math.round((h - hours) * 60);
    const d = new Date(date);
    d.setHours(hours, minutes, 0, 0);
    return d;
  }

  const calculated: Record<PrayerName, Date> = {
    fajr:    toDate(noon - fajrDiff),
    dhuhr:   toDate(noon + 0.083), // ~5 min after true solar noon
    asr:     toDate(noon + asrDiff),
    maghrib: toDate(noon + maghribDiff),
    isha:    toDate(noon + ishaDiff),
  };

  // Apply manual overrides on top
  const result = { ...calculated };
  for (const key of Object.keys(overrides) as PrayerName[]) {
    const ov = overrides[key];
    if (ov) {
      const d = new Date(date);
      d.setHours(ov.hour, ov.minute, 0, 0);
      result[key] = d;
    }
  }
  return result;
}

export function formatTime(d: Date): string {
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'م' : 'ص';
  h = h % 12 || 12;
  return `${h}:${m.toString().padStart(2, '0')} ${ampm}`;
}

// ─────────────────────────────────────────────────────────────────────────────

const PrayerContext = createContext<PrayerContextType | null>(null);

const PRAYER_ORDER: PrayerName[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
const PRAYER_NOTIF_PREFIX = 'prayer_';
const SCHEDULE_DAYS = 5; // iOS يسمح بـ 64 إشعاراً معلقاً كحد أقصى (5 أيام × 5 صلوات × 2 = 50)

function buildDayList(date: Date, s: PrayerSettings): PrayerTime[] {
  const method = CALCULATION_METHODS.find(m => m.id === s.method) ?? CALCULATION_METHODS[0];
  const raw = calculatePrayers(date, s.latitude, s.longitude, method, s.manualOverrides);
  return PRAYER_ORDER.map(name => ({
    name,
    nameAr: PRAYER_NAMES_AR[name],
    time: raw[name],
    timeStr: formatTime(raw[name]),
  }));
}

function dayKey(d: Date) {
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}

export function PrayerProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<PrayerSettings>(DEFAULT_SETTINGS);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [prayers, setPrayers] = useState<PrayerTime[]>([]);
  const [nextPrayer, setNextPrayer] = useState<PrayerTime | null>(null);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(v => {
        if (v) {
          const parsed = JSON.parse(v);
          setSettings({
            ...DEFAULT_SETTINGS,
            ...parsed,
            manualOverrides: parsed.manualOverrides ?? {},
          });
        }
      })
      .catch(() => {})
      .finally(() => setSettingsLoaded(true));
  }, []);

  const computePrayers = useCallback((s: PrayerSettings) => {
    const today = new Date();
    const list = buildDayList(today, s);
    setPrayers(list);

    // بعد العشاء تكون الصلاة التالية فجر الغد (وليس فجر اليوم الذي مضى)
    let next = list.find(p => p.time > today) ?? null;
    if (!next) {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      next = buildDayList(tomorrow, s)[0];
    }
    setNextPrayer(next);
    return list;
  }, []);

  useEffect(() => { computePrayers(settings); }, [settings, computePrayers]);

  // تحديث «الصلاة التالية» تلقائياً عند حلول وقتها، وعند عودة التطبيق للواجهة
  useEffect(() => {
    if (!nextPrayer) return;
    const ms = Math.min(Math.max(nextPrayer.time.getTime() - Date.now() + 1000, 1000), 2147483000);
    const id = setTimeout(() => computePrayers(settingsRef.current), ms);
    return () => clearTimeout(id);
  }, [nextPrayer, computePrayers]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') computePrayers(settingsRef.current);
    });
    return () => sub.remove();
  }, [computePrayers]);

  // جدولة الإشعارات لأيام قادمة (تُحدَّث عند كل تغيير في الإعدادات وعند فتح التطبيق).
  // نلغي إشعارات الصلاة فقط حتى لا نمسّ إشعارات الأذكار.
  const scheduleNotifications = useCallback(async (s: PrayerSettings) => {
    const Notifications = await getNotifications();
    if (!Notifications) return;

    await cancelScheduledByPrefix(PRAYER_NOTIF_PREFIX);
    if (!s.enabled) return;
    if (!(await ensureNotificationPermission())) return;

    const now = new Date();
    for (let d = 0; d < SCHEDULE_DAYS; d++) {
      const date = new Date(now);
      date.setDate(date.getDate() + d);
      const key = dayKey(date);

      for (const prayer of buildDayList(date, s)) {
        if (!s.enabledPrayers[prayer.name]) continue;

        if (s.notifyBefore15) {
          const reminderTime = new Date(prayer.time.getTime() - 15 * 60 * 1000);
          if (reminderTime > now) {
            await Notifications.scheduleNotificationAsync({
              identifier: `${PRAYER_NOTIF_PREFIX}${key}_${prayer.name}_pre`,
              content: {
                title: `🕌 تنبيه: ${prayer.nameAr}`,
                body: `متبقي 15 دقيقة على أذان ${prayer.nameAr} — الساعة ${prayer.timeStr}`,
                sound: true,
              },
              trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: reminderTime },
            }).catch(() => {});
          }
        }

        if (s.notifyAtTime && prayer.time > now) {
          await Notifications.scheduleNotificationAsync({
            identifier: `${PRAYER_NOTIF_PREFIX}${key}_${prayer.name}_at`,
            content: {
              title: `🕌 حان أذان ${prayer.nameAr}`,
              body: `حان وقت صلاة ${prayer.nameAr}`,
              sound: true,
            },
            trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: prayer.time },
          }).catch(() => {});
        }
      }
    }
  }, []);

  useEffect(() => {
    if (!settingsLoaded) return;
    scheduleNotifications(settings);
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') scheduleNotifications(settingsRef.current);
    });
    return () => sub.remove();
  }, [settingsLoaded, settings, scheduleNotifications]);

  const saveAndApply = useCallback(async (updated: PrayerSettings) => {
    setSettings(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  const updateSettings = useCallback(async (s: Partial<PrayerSettings>) => {
    await saveAndApply({ ...settingsRef.current, ...s });
  }, [saveAndApply]);

  const setManualOverride = useCallback(async (prayer: PrayerName, hour: number, minute: number) => {
    const cur = settingsRef.current;
    await saveAndApply({
      ...cur,
      manualOverrides: { ...cur.manualOverrides, [prayer]: { hour, minute } },
    });
  }, [saveAndApply]);

  const clearManualOverride = useCallback(async (prayer: PrayerName) => {
    const cur = settingsRef.current;
    const newOverrides = { ...cur.manualOverrides };
    delete newOverrides[prayer];
    await saveAndApply({ ...cur, manualOverrides: newOverrides });
  }, [saveAndApply]);

  const refresh = useCallback(() => { computePrayers(settingsRef.current); }, [computePrayers]);

  const value = useMemo(() => ({
    prayers, nextPrayer, settings,
    updateSettings, setManualOverride, clearManualOverride, refresh,
  }), [prayers, nextPrayer, settings, updateSettings, setManualOverride, clearManualOverride, refresh]);

  return <PrayerContext.Provider value={value}>{children}</PrayerContext.Provider>;
}

export function usePrayer() {
  const ctx = useContext(PrayerContext);
  if (!ctx) throw new Error('usePrayer must be used inside PrayerProvider');
  return ctx;
}