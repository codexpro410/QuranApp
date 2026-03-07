import { PrayerName, usePrayer } from '@/contexts/PrayerContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { MapPin, X } from 'lucide-react-native';
import React, { useEffect } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PRAYER_ICONS: Record<PrayerName, string> = {
  fajr: '🌙', dhuhr: '☀️', asr: '🌤️', maghrib: '🌅', isha: '🌙',
};

const PRAYER_COLORS: Record<PrayerName, string> = {
  fajr: '#4A90E2', dhuhr: '#F5A623', asr: '#7ED321', maghrib: '#E85D04', isha: '#6C5CE7',
};

export default function PrayerTimesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mode, colors } = useTheme();
  const { prayers, nextPrayer, settings, refresh } = usePrayer();

  useEffect(() => {
    refresh();
  }, []);

  const now = new Date();
  const dateStr = now.toLocaleDateString('ar-EG', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />

      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={[styles.closeBtn, { backgroundColor: colors.surface }]} onPress={() => router.back()}>
          <X size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerText, { color: colors.text }]}>مواقيت الصلاة</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}>

        {/* Location card */}
        <View style={[styles.locationCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <MapPin size={16} color={colors.gold} />
          <Text style={[styles.locationText, { color: colors.text }]}>{settings.cityName}</Text>
          <Text style={[styles.dateText, { color: colors.textSecondary }]}>{dateStr}</Text>
        </View>

        {/* Next prayer highlight */}
        {nextPrayer && (
          <View style={[styles.nextPrayerCard, { backgroundColor: colors.gold + '18', borderColor: colors.gold }]}>
            <Text style={[styles.nextPrayerLabel, { color: colors.textSecondary }]}>الصلاة القادمة</Text>
            <Text style={[styles.nextPrayerName, { color: colors.gold }]}>
              {PRAYER_ICONS[nextPrayer.name]} {nextPrayer.nameAr}
            </Text>
            <Text style={[styles.nextPrayerTime, { color: colors.text }]}>{nextPrayer.timeStr}</Text>
            <TimeCountdown prayerTime={nextPrayer.time} colors={colors} />
          </View>
        )}

        {/* All prayers */}
        <View style={[styles.prayersCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {prayers.map((prayer, i) => {
            const isNext = nextPrayer?.name === prayer.name;
            const isPast = prayer.time < now;
            const col = PRAYER_COLORS[prayer.name];
            return (
              <View key={prayer.name}>
                <View style={[
                  styles.prayerRow,
                  isNext && { backgroundColor: col + '15' },
                ]}>
                  <View style={[styles.prayerIconBox, { backgroundColor: col + '25' }]}>
                    <Text style={styles.prayerEmoji}>{PRAYER_ICONS[prayer.name]}</Text>
                  </View>
                  <View style={styles.prayerInfo}>
                    <Text style={[styles.prayerName, { color: isNext ? col : isPast ? colors.textSecondary : colors.text }]}>
                      {prayer.nameAr}
                    </Text>
                    {isNext && <Text style={[styles.nextBadge, { color: col }]}>● الآن</Text>}
                  </View>
                  <Text style={[
                    styles.prayerTimeText,
                    { color: isNext ? col : isPast ? colors.textSecondary : colors.text },
                    isNext && { fontWeight: '800', fontSize: 18 },
                  ]}>
                    {prayer.timeStr}
                  </Text>
                </View>
                {i < prayers.length - 1 && <View style={[styles.rowDivider, { backgroundColor: colors.border }]} />}
              </View>
            );
          })}
        </View>

        {!settings.enabled && (
          <View style={[styles.disabledNote, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}>
            <Text style={[styles.disabledText, { color: colors.textSecondary }]}>
              فعّل إشعارات الصلاة من الإعدادات للحصول على تنبيهات قبل كل صلاة
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function TimeCountdown({ prayerTime, colors }: { prayerTime: Date; colors: any }) {
  const [label, setLabel] = React.useState('');

  useEffect(() => {
    const update = () => {
      const diff = prayerTime.getTime() - Date.now();
      if (diff <= 0) { setLabel('حان وقت الصلاة'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setLabel(h > 0 ? `بعد ${h} ساعة و${m} دقيقة` : `بعد ${m} دقيقة`);
    };
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, [prayerTime]);

  return <Text style={[styles.countdown, { color: colors.textSecondary }]}>{label}</Text>;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
  },
  closeBtn: { padding: 8, borderRadius: 20 },
  headerText: { fontSize: 18, fontWeight: '700' },
  placeholder: { width: 40 },
  content: { padding: 16 },
  locationCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 16, flexWrap: 'wrap',
  },
  locationText: { fontSize: 15, fontWeight: '600', flex: 1 },
  dateText: { fontSize: 12 },
  nextPrayerCard: {
    alignItems: 'center', padding: 20, borderRadius: 20, borderWidth: 2,
    marginBottom: 16, gap: 6,
  },
  nextPrayerLabel: { fontSize: 12, fontWeight: '600' },
  nextPrayerName: { fontSize: 26, fontWeight: '800' },
  nextPrayerTime: { fontSize: 22, fontWeight: '700' },
  countdown: { fontSize: 12, marginTop: 4 },
  prayersCard: {
    borderRadius: 16, borderWidth: 1, overflow: 'hidden',
  },
  prayerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  prayerIconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  prayerEmoji: { fontSize: 20 },
  prayerInfo: { flex: 1 },
  prayerName: { fontSize: 16, fontWeight: '600' },
  nextBadge: { fontSize: 10, fontWeight: '700', marginTop: 2 },
  prayerTimeText: { fontSize: 16, fontWeight: '700' },
  rowDivider: { height: 1, marginLeft: 68 },
  disabledNote: {
    marginTop: 16, padding: 14, borderRadius: 12, borderWidth: 1,
  },
  disabledText: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
});
