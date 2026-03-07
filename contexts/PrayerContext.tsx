import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

// ── Prayer time calculation (Shafi'i / Egyptian Authority method) ──────────────
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

export interface PrayerSettings {
  enabled: boolean;
  notifyBefore15: boolean; // 15-min reminder
  enabledPrayers: Record<PrayerName, boolean>;
  cityName: string;
  latitude: number;
  longitude: number;
  method: number; // calculation method: 3=Egyptian, 4=UmmAlQura, 2=ISNA
}

interface PrayerContextType {
  prayers: PrayerTime[];
  nextPrayer: PrayerTime | null;
  settings: PrayerSettings;
  updateSettings: (s: Partial<PrayerSettings>) => Promise<void>;
  refresh: () => void;
}

const DEFAULT_SETTINGS: PrayerSettings = {
  enabled: false,
  notifyBefore15: true,
  enabledPrayers: { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true },
  cityName: 'القاهرة',
  latitude: 30.0444,
  longitude: 31.2357,
  method: 3,
};

const STORAGE_KEY = 'prayer_settings';

// ── Accurate prayer calculation (simplified Meeus/Montenbruck-Pfleger) ──
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
  return D + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045 - 0.5;
}

function computeTime(angle: number, decl: number, lat: number): number {
  const cosO = (-Math.sin(toRad(angle)) - Math.sin(toRad(lat)) * Math.sin(toRad(decl))) /
    (Math.cos(toRad(lat)) * Math.cos(toRad(decl)));
  if (cosO >= 1) return 0.0;
  if (cosO <= -1) return 12.0;
  return toDeg(Math.acos(cosO)) / 15;
}

function asrShadow(t: number, decl: number, lat: number) {
  const angle = -toDeg(Math.atan(1 / (t + Math.tan(toRad(Math.abs(lat - decl))))));
  return computeTime(angle, decl, lat);
}

function calculatePrayers(date: Date, lat: number, lng: number, method: number): Record<PrayerName, Date> {
  const jd = julianDay(date);
  const { decl, EqT } = sunPosition(jd);

  const timezone = -(date.getTimezoneOffset() / 60);
  const noon = 12 + timezone - lng / 15 - EqT;

  // Fajr / Isha angles by method
  const fajrAngle = method === 4 ? 18.5 : method === 2 ? 15 : 19.5; // Egyptian=19.5
  const ishaAngle = method === 4 ? 90 : method === 2 ? 15 : 17.5;   // Egyptian=17.5

  const fajrDiff = computeTime(fajrAngle, decl, lat);
  const maghribDiff = computeTime(0.833 + 0.0347 * Math.sqrt(0), decl, lat); // simplified
  const ishaDiff = computeTime(ishaAngle, decl, lat);
  const asrDiff = asrShadow(1, decl, lat); // Shafi'i (shadow = 1x)

  function toDate(h: number): Date {
    const hours = Math.floor(h);
    const minutes = Math.round((h - hours) * 60);
    const d = new Date(date);
    d.setHours(hours, minutes, 0, 0);
    return d;
  }

  return {
    fajr: toDate(noon - fajrDiff),
    dhuhr: toDate(noon),
    asr: toDate(noon + asrDiff),
    maghrib: toDate(noon + maghribDiff),
    isha: toDate(noon + ishaDiff),
  };
}

function formatTime(d: Date): string {
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'م' : 'ص';
  h = h % 12 || 12;
  return `${h}:${m.toString().padStart(2, '0')} ${ampm}`;
}

const PrayerContext = createContext<PrayerContextType | null>(null);

export function PrayerProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<PrayerSettings>(DEFAULT_SETTINGS);
  const [prayers, setPrayers] = useState<PrayerTime[]>([]);
  const [nextPrayer, setNextPrayer] = useState<PrayerTime | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(v => {
      if (v) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(v) });
    });
  }, []);

  const computePrayers = useCallback((s: PrayerSettings) => {
    const raw = calculatePrayers(new Date(), s.latitude, s.longitude, s.method);
    const order: PrayerName[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
    const list: PrayerTime[] = order.map(name => ({
      name,
      nameAr: PRAYER_NAMES_AR[name],
      time: raw[name],
      timeStr: formatTime(raw[name]),
    }));
    setPrayers(list);

    const now = new Date();
    const next = list.find(p => p.time > now) ?? list[0];
    setNextPrayer(next);

    return list;
  }, []);

  useEffect(() => {
    computePrayers(settings);
  }, [settings, computePrayers]);

  const scheduleNotifications = useCallback(async (s: PrayerSettings, prayerList: PrayerTime[]) => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!s.enabled) return;

    for (const prayer of prayerList) {
      if (!s.enabledPrayers[prayer.name]) continue;

      if (s.notifyBefore15) {
        const reminderTime = new Date(prayer.time.getTime() - 15 * 60 * 1000);
        if (reminderTime > new Date()) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: `🕌 تنبيه: ${prayer.nameAr}`,
              body: `متبقي 15 دقيقة على أذان ${prayer.nameAr} - الساعة ${prayer.timeStr}`,
              sound: true,
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: reminderTime,
            },
          });
        }
      }

      // Also notify at prayer time
      if (prayer.time > new Date()) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `🕌 حان أذان ${prayer.nameAr}`,
            body: `حان وقت صلاة ${prayer.nameAr}`,
            sound: true,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: prayer.time,
          },
        });
      }
    }
  }, []);

  const updateSettings = useCallback(async (s: Partial<PrayerSettings>) => {
    const updated = { ...settings, ...s };
    setSettings(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    const prayerList = computePrayers(updated);
    await scheduleNotifications(updated, prayerList);
  }, [settings, computePrayers, scheduleNotifications]);

  const refresh = useCallback(() => {
    computePrayers(settings);
  }, [settings, computePrayers]);

  return (
    <PrayerContext.Provider value={{ prayers, nextPrayer, settings, updateSettings, refresh }}>
      {children}
    </PrayerContext.Provider>
  );
}

export function usePrayer() {
  const ctx = useContext(PrayerContext);
  if (!ctx) throw new Error('usePrayer must be used inside PrayerProvider');
  return ctx;
}
