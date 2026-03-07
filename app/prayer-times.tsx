import { PrayerName, usePrayer } from '@/contexts/PrayerContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Edit3, MapPin, RotateCcw, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
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

const PRAYER_NAMES_MAP: Record<PrayerName, string> = {
  fajr: 'الفجر', dhuhr: 'الظهر', asr: 'العصر', maghrib: 'المغرب', isha: 'العشاء',
};

export default function PrayerTimesScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { mode, colors } = useTheme();
  const { prayers, nextPrayer, settings, setManualOverride, clearManualOverride, refresh } = usePrayer();

  // ── time picker state ──
  const [editingPrayer, setEditingPrayer] = useState<PrayerName | null>(null);
  const [pickerHour,   setPickerHour]   = useState(5);
  const [pickerMinute, setPickerMinute] = useState(0);
  const [isAM,         setIsAM]         = useState(true);

  useEffect(() => { refresh(); }, []);

  const now     = new Date();
  const dateStr = now.toLocaleDateString('ar-EG', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const openEdit = (prayer: typeof prayers[0]) => {
    const h = prayer.time.getHours();
    const m = prayer.time.getMinutes();
    setPickerHour(h % 12 || 12);
    setPickerMinute(m);
    setIsAM(h < 12);
    setEditingPrayer(prayer.name);
  };

  const saveEdit = async () => {
    if (!editingPrayer) return;
    let hour24 = pickerHour % 12;
    if (!isAM) hour24 += 12;
    await setManualOverride(editingPrayer, hour24, pickerMinute);
    setEditingPrayer(null);
  };

  const handleClearOne = (name: PrayerName) => {
    Alert.alert(
      'إعادة الحساب التلقائي',
      'هل تريد إزالة الوقت المحدد يدوياً والعودة للحساب التلقائي؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'نعم', onPress: () => clearManualOverride(name) },
      ],
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      'إعادة ضبط جميع الأوقات',
      'هل تريد حذف جميع التعديلات اليدوية والعودة للحساب التلقائي؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'إعادة ضبط الكل',
          style: 'destructive',
          onPress: async () => {
            for (const p of ['fajr','dhuhr','asr','maghrib','isha'] as PrayerName[]) {
              await clearManualOverride(p);
            }
          },
        },
      ],
    );
  };

  const hasAnyOverride = Object.keys(settings.manualOverrides ?? {}).length > 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={[styles.closeBtn, { backgroundColor: colors.surface }]} onPress={() => router.back()}>
          <X size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerText, { color: colors.text }]}>مواقيت الصلاة</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Location */}
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
            <TimeCountdown prayerTime={nextPrayer.time} color={colors.textSecondary} />
          </View>
        )}

        {/* All prayers list */}
        <View style={[styles.prayersCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>

          <View style={[styles.cardHint, { borderBottomColor: colors.border }]}>
            <Edit3 size={12} color={colors.textSecondary} />
            <Text style={[styles.cardHintText, { color: colors.textSecondary }]}>
              اضغط ✏️ لتعديل أي وقت يدوياً
            </Text>
          </View>

          {prayers.map((prayer, i) => {
            const isNext   = nextPrayer?.name === prayer.name;
            const isPast   = prayer.time < now;
            const col      = PRAYER_COLORS[prayer.name];
            const isManual = !!settings.manualOverrides?.[prayer.name];

            return (
              <View key={prayer.name}>
                <View style={[styles.prayerRow, isNext && { backgroundColor: col + '15' }]}>

                  {/* Icon */}
                  <View style={[styles.prayerIconBox, { backgroundColor: col + '25' }]}>
                    <Text style={styles.prayerEmoji}>{PRAYER_ICONS[prayer.name]}</Text>
                  </View>

                  {/* Name + badges */}
                  <View style={styles.prayerInfo}>
                    <Text style={[
                      styles.prayerName,
                      { color: isNext ? col : isPast ? colors.textSecondary : colors.text },
                    ]}>
                      {prayer.nameAr}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      {isNext && (
                        <Text style={[styles.badge, { color: col }]}>● الآن</Text>
                      )}
                      {isManual && (
                        <TouchableOpacity onPress={() => handleClearOne(prayer.name)}>
                          <Text style={[styles.badge, { color: colors.gold }]}>✏️ يدوي — اضغط للحذف</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  {/* Time + edit button */}
                  <View style={styles.timeCol}>
                    <Text style={[
                      styles.prayerTimeText,
                      { color: isNext ? col : isPast ? colors.textSecondary : colors.text },
                      isNext && { fontWeight: '800', fontSize: 18 },
                    ]}>
                      {prayer.timeStr}
                    </Text>
                    <TouchableOpacity
                      style={[styles.editBtn, { backgroundColor: col + '22' }]}
                      onPress={() => openEdit(prayer)}
                    >
                      <Edit3 size={13} color={col} />
                    </TouchableOpacity>
                  </View>
                </View>

                {i < prayers.length - 1 && (
                  <View style={[styles.rowDivider, { backgroundColor: colors.border }]} />
                )}
              </View>
            );
          })}
        </View>

        {/* Reset all manual overrides */}
        {hasAnyOverride && (
          <TouchableOpacity
            style={[styles.resetAllBtn, { borderColor: colors.border }]}
            onPress={handleClearAll}
          >
            <RotateCcw size={14} color={colors.textSecondary} />
            <Text style={[styles.resetAllText, { color: colors.textSecondary }]}>
              إعادة جميع الأوقات للحساب التلقائي
            </Text>
          </TouchableOpacity>
        )}

        {!settings.enabled && (
          <View style={[styles.disabledNote, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}>
            <Text style={[styles.disabledText, { color: colors.textSecondary }]}>
              فعّل إشعارات الصلاة من الإعدادات للحصول على تنبيهات قبل كل صلاة
            </Text>
          </View>
        )}
      </ScrollView>

      {/* ── Time Picker Modal ── */}
      <Modal visible={!!editingPrayer} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setEditingPrayer(null)}>
          <Pressable
            style={[styles.pickerSheet, {
              backgroundColor: colors.surface,
              paddingBottom: insets.bottom + 16,
            }]}
          >
            {/* Modal header */}
            <View style={[styles.pickerHeader, { borderBottomColor: colors.border }]}>
              <TouchableOpacity onPress={() => setEditingPrayer(null)}>
                <Text style={[styles.pickerAction, { color: colors.textSecondary }]}>إلغاء</Text>
              </TouchableOpacity>
              <Text style={[styles.pickerTitle, { color: colors.text }]}>
                تعديل وقت {editingPrayer ? PRAYER_NAMES_MAP[editingPrayer] : ''}
              </Text>
              <TouchableOpacity onPress={saveEdit}>
                <Text style={[styles.pickerAction, { color: colors.gold, fontWeight: '700' }]}>حفظ</Text>
              </TouchableOpacity>
            </View>

            {/* Selectors row */}
            <View style={styles.pickersRow}>

              {/* Hour wheel */}
              <View style={styles.wheelCol}>
                <Text style={[styles.wheelLabel, { color: colors.textSecondary }]}>ساعة</Text>
                <ScrollView style={styles.wheelScroll} showsVerticalScrollIndicator={false}>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                    <TouchableOpacity
                      key={h}
                      style={[
                        styles.wheelItem,
                        pickerHour === h && { backgroundColor: colors.gold + '30', borderRadius: 10 },
                      ]}
                      onPress={() => setPickerHour(h)}
                    >
                      <Text style={[
                        styles.wheelText,
                        { color: pickerHour === h ? colors.gold : colors.text },
                        pickerHour === h && { fontWeight: '800' },
                      ]}>
                        {h.toString().padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <Text style={[styles.colon, { color: colors.text }]}>:</Text>

              {/* Minute wheel */}
              <View style={styles.wheelCol}>
                <Text style={[styles.wheelLabel, { color: colors.textSecondary }]}>دقيقة</Text>
                <ScrollView style={styles.wheelScroll} showsVerticalScrollIndicator={false}>
                  {Array.from({ length: 60 }, (_, i) => i).map(m => (
                    <TouchableOpacity
                      key={m}
                      style={[
                        styles.wheelItem,
                        pickerMinute === m && { backgroundColor: colors.gold + '30', borderRadius: 10 },
                      ]}
                      onPress={() => setPickerMinute(m)}
                    >
                      <Text style={[
                        styles.wheelText,
                        { color: pickerMinute === m ? colors.gold : colors.text },
                        pickerMinute === m && { fontWeight: '800' },
                      ]}>
                        {m.toString().padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* AM / PM */}
              <View style={styles.wheelCol}>
                <Text style={[styles.wheelLabel, { color: colors.textSecondary }]}>ص / م</Text>
                <View style={{ gap: 10, paddingTop: 8 }}>
                  {[true, false].map(am => (
                    <TouchableOpacity
                      key={String(am)}
                      style={[
                        styles.ampmBtn,
                        {
                          backgroundColor: isAM === am ? colors.gold : colors.surfaceLight,
                          borderColor:     isAM === am ? colors.gold : colors.border,
                        },
                      ]}
                      onPress={() => setIsAM(am)}
                    >
                      <Text style={{ color: isAM === am ? '#fff' : colors.text, fontWeight: '700', fontSize: 16 }}>
                        {am ? 'ص' : 'م'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Live preview */}
            <View style={[styles.previewRow, { borderTopColor: colors.border }]}>
              <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>المعاينة:</Text>
              <Text style={[styles.previewTime, { color: colors.gold }]}>
                {pickerHour.toString().padStart(2, '0')}:{pickerMinute.toString().padStart(2, '0')} {isAM ? 'ص' : 'م'}
              </Text>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// ── Countdown helper ──────────────────────────────────────────────────────────
function TimeCountdown({ prayerTime, color }: { prayerTime: Date; color: string }) {
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
  return <Text style={[styles.countdown, { color }]}>{label}</Text>;
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:       { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
  },
  closeBtn:        { padding: 8, borderRadius: 20 },
  headerText:      { fontSize: 18, fontWeight: '700' },
  placeholder:     { width: 40 },
  content:         { padding: 16 },

  locationCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 16, flexWrap: 'wrap',
  },
  locationText:    { fontSize: 15, fontWeight: '600', flex: 1 },
  dateText:        { fontSize: 12 },

  nextPrayerCard: {
    alignItems: 'center', padding: 20, borderRadius: 20, borderWidth: 2,
    marginBottom: 16, gap: 6,
  },
  nextPrayerLabel: { fontSize: 12, fontWeight: '600' },
  nextPrayerName:  { fontSize: 26, fontWeight: '800' },
  nextPrayerTime:  { fontSize: 22, fontWeight: '700' },
  countdown:       { fontSize: 12, marginTop: 4 },

  prayersCard:     { borderRadius: 16, borderWidth: 1, overflow: 'hidden', marginBottom: 16 },
  cardHint: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1,
  },
  cardHintText:    { fontSize: 12 },

  prayerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  prayerIconBox: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  prayerEmoji:     { fontSize: 20 },
  prayerInfo:      { flex: 1 },
  prayerName:      { fontSize: 16, fontWeight: '600' },
  badge:           { fontSize: 10, fontWeight: '700', marginTop: 2 },
  timeCol:         { alignItems: 'flex-end', gap: 4 },
  prayerTimeText:  { fontSize: 16, fontWeight: '700' },
  editBtn:         { padding: 5, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  rowDivider:      { height: 1, marginLeft: 68 },

  resetAllBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 16,
  },
  resetAllText:    { fontSize: 13 },

  disabledNote:    { padding: 14, borderRadius: 12, borderWidth: 1 },
  disabledText:    { fontSize: 13, textAlign: 'center', lineHeight: 20 },

  // Modal
  modalOverlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  pickerSheet:     { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 8 },
  pickerHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1,
  },
  pickerTitle:     { fontSize: 16, fontWeight: '700' },
  pickerAction:    { fontSize: 15 },

  pickersRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'center', gap: 8,
    paddingHorizontal: 16, paddingTop: 16,
  },
  wheelCol:        { alignItems: 'center', flex: 1 },
  wheelLabel:      { fontSize: 12, marginBottom: 6 },
  wheelScroll:     { height: 180 },
  wheelItem:       { paddingVertical: 8, paddingHorizontal: 12, alignItems: 'center', minWidth: 50 },
  wheelText:       { fontSize: 18 },
  colon:           { fontSize: 28, fontWeight: '700', paddingTop: 36 },

  ampmBtn: {
    width: 52, height: 44, borderRadius: 12, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },

  previewRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingTop: 16, paddingHorizontal: 20, marginTop: 8, borderTopWidth: 1,
  },
  previewLabel:    { fontSize: 14 },
  previewTime:     { fontSize: 22, fontWeight: '800' },
});