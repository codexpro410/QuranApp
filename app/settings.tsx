import MethodPickerModal from '@/components/MethodPickerModal';
import { useHifz } from '@/contexts/HifzContext';
import { PAGE_STYLES } from '@/constants/pageStyles';
import { usePageColor } from '@/contexts/PageColorContext';
import { CALCULATION_METHODS, PrayerName, usePrayer } from '@/contexts/PrayerContext';
import { useTheme } from '@/contexts/ThemeContext';
import { ensureNotificationPermission } from '@/utils/notifications';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import SystemBars from '@/components/SystemBars';
import {
  Bell, BookOpen, Calculator,
  Clock, Eye, Info,
  MapPin, Maximize,
  Sunrise, Type, X,
} from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, Alert, ScrollView, StyleSheet, Switch,
  Text, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PRAYER_ORDER: PrayerName[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
const PRAYER_LABELS: Record<PrayerName, string> = {
  fajr: 'الفجر', dhuhr: 'الظهر', asr: 'العصر', maghrib: 'المغرب', isha: 'العشاء',
};

function methodForCountry(country: string): number {
  if (['Saudi Arabia', 'UAE', 'Kuwait', 'Bahrain', 'Qatar', 'Oman'].includes(country)) return 4;
  if (['Turkey'].includes(country)) return 7;
  if (['Pakistan', 'India', 'Bangladesh'].includes(country)) return 8;
  if (['United States', 'Canada'].includes(country)) return 2;
  return 3; // default: Egyptian
}

export default function SettingsScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { mode, colors } = useTheme();
  const {
    pageMode, setPageMode,
    mushafWidth, mushafHeight,
    saveMushafWidth, saveMushafHeight,
  } = usePageColor();
  const { settings: hifzSettings, updateSettings: updateHifz } = useHifz();
  const { settings: prayerSettings, updateSettings: updatePrayer, prayers } = usePrayer();

  const [locLoading, setLocLoading] = useState(false);
  const [methodModalVisible, setMethodModalVisible] = useState(false);

  const toggleHifzNotifications = useCallback(async (val: boolean) => {
    if (val) {
      const granted = await ensureNotificationPermission();
      if (!granted) { Alert.alert('الإذن مرفوض', 'يرجى تفعيل الإشعارات من إعدادات الجهاز'); return; }
    }
    updateHifz({ notificationsEnabled: val });
  }, [updateHifz]);

  const togglePrayerNotifications = useCallback(async (val: boolean) => {
    if (val) {
      const granted = await ensureNotificationPermission();
      if (!granted) { Alert.alert('الإذن مرفوض', 'يرجى تفعيل الإشعارات من إعدادات الجهاز'); return; }
    }
    updatePrayer({ enabled: val });
  }, [updatePrayer]);

  const togglePrayerItem = useCallback((name: PrayerName, val: boolean) => {
    updatePrayer({ enabledPrayers: { ...prayerSettings.enabledPrayers, [name]: val } });
  }, [prayerSettings.enabledPrayers, updatePrayer]);

  const handleDetectLocation = useCallback(async () => {
    setLocLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('الإذن مرفوض', 'يرجى تفعيل خدمة الموقع من إعدادات الجهاز');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const [place] = await Location.reverseGeocodeAsync(loc.coords);
      const cityName = place.city ?? place.district ?? place.region ?? place.country ?? 'موقعي';
      const method   = methodForCountry(place.country ?? '');
      await updatePrayer({
        latitude:  loc.coords.latitude,
        longitude: loc.coords.longitude,
        cityName,
        method,
      });
      Alert.alert('✅ تم تحديث الموقع', `المدينة: ${cityName}`);
    } catch {
      Alert.alert('خطأ', 'تعذّر تحديد الموقع، حاول مرة أخرى');
    } finally {
      setLocLoading(false);
    }
  }, [updatePrayer]);

  const handlePickMethod = useCallback(() => {
  setMethodModalVisible(true);
}, []);

  const currentMethod = CALCULATION_METHODS.find(m => m.id === prayerSettings.method);

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <SystemBars light={mode === 'dark'} />

      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={[styles.closeButton, { backgroundColor: colors.surface }]} onPress={() => router.back()}>
          <X size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerText, { color: colors.text }]}>الإعدادات</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── مظهر الصفحة (الوضع الفاتح/الداكن للتطبيق من القائمة الرئيسية في شاشة المصحف) ── */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>مظهر الصفحة</Text>

        <View style={[styles.settingItem, { backgroundColor: colors.surface, borderColor: colors.border, flexDirection: 'column', alignItems: 'flex-start', gap: 16 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={[styles.settingIcon, { backgroundColor: colors.surfaceLight }]}>
              <Eye size={22} color={colors.gold} />
            </View>
            <View>
              <Text style={[styles.settingTitle, { color: colors.text }]}>لون صفحة المصحف</Text>
              <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                {PAGE_STYLES.find(s => s.id === pageMode)?.hint}
              </Text>
            </View>
          </View>
          <View style={styles.colorOptionsRow}>
            {PAGE_STYLES.map(opt => {
              const selected = pageMode === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  onPress={() => setPageMode(opt.id)}
                  style={[
                    styles.colorOption,
                    { backgroundColor: opt.swatchBg, borderColor: selected ? colors.gold : opt.swatchBorder },
                    selected && styles.colorOptionSelected,
                  ]}
                >
                  <Text style={[styles.colorOptionText, { color: opt.swatchText, fontWeight: selected ? '700' : '500' }]}>
                    {opt.label}
                  </Text>
                  <Text style={[styles.colorPreviewChar, { color: opt.swatchText }]}>بسم</Text>
                  {selected && <View style={[styles.colorOptionDot, { backgroundColor: colors.gold }]} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── أبعاد صفحة المصحف ── */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: 24 }]}>أبعاد صفحة المصحف</Text>

        <View style={[styles.settingItem, { backgroundColor: colors.surface, borderColor: colors.border, flexDirection: 'column', alignItems: 'flex-start', gap: 20 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={[styles.settingIcon, { backgroundColor: colors.surfaceLight }]}>
              <Maximize size={22} color={colors.gold} />
            </View>
            <View>
              <Text style={[styles.settingTitle, { color: colors.text }]}>حجم الصفحة</Text>
              <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>اضبط لملاءمة شاشة جهازك</Text>
            </View>
          </View>

          {/* Width */}
          <View style={{ width: '100%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={[styles.settingTitle, { color: colors.text, fontSize: 14 }]}>العرض</Text>
              <Text style={{ color: colors.gold, fontSize: 14, fontWeight: '700' }}>{mushafWidth} px</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TouchableOpacity style={[styles.dimBtn, { backgroundColor: colors.surfaceLight }]}
                onPress={() => saveMushafWidth(Math.max(400, mushafWidth - 50))}
                onLongPress={() => saveMushafWidth(Math.max(400, mushafWidth - 100))}>
                <Text style={[styles.dimBtnText, { color: colors.text }]}>−</Text>
              </TouchableOpacity>
              <View style={[styles.dimTrack, { backgroundColor: colors.surfaceLight }]}>
                <View style={[styles.dimFill, { backgroundColor: colors.gold, width: `${Math.round(((mushafWidth - 400) / 600) * 100)}%` }]} />
              </View>
              <TouchableOpacity style={[styles.dimBtn, { backgroundColor: colors.surfaceLight }]}
                onPress={() => saveMushafWidth(Math.min(1000, mushafWidth + 50))}
                onLongPress={() => saveMushafWidth(Math.min(1000, mushafWidth + 100))}>
                <Text style={[styles.dimBtnText, { color: colors.text }]}>+</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.presetRow}>
              {[500, 650, 750, 900].map(v => (
                <TouchableOpacity key={v} style={[styles.presetChip, {
                  backgroundColor: mushafWidth === v ? colors.gold : colors.surfaceLight,
                  borderColor: mushafWidth === v ? colors.gold : colors.border,
                }]} onPress={() => saveMushafWidth(v)}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: mushafWidth === v ? '#fff' : colors.text }}>{v}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Height */}
          <View style={{ width: '100%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={[styles.settingTitle, { color: colors.text, fontSize: 14 }]}>الارتفاع</Text>
              <Text style={{ color: colors.gold, fontSize: 14, fontWeight: '700' }}>{mushafHeight} px</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TouchableOpacity style={[styles.dimBtn, { backgroundColor: colors.surfaceLight }]}
                onPress={() => saveMushafHeight(Math.max(800, mushafHeight - 50))}
                onLongPress={() => saveMushafHeight(Math.max(800, mushafHeight - 100))}>
                <Text style={[styles.dimBtnText, { color: colors.text }]}>−</Text>
              </TouchableOpacity>
              <View style={[styles.dimTrack, { backgroundColor: colors.surfaceLight }]}>
                <View style={[styles.dimFill, { backgroundColor: colors.gold, width: `${Math.round(((mushafHeight - 800) / 1200) * 100)}%` }]} />
              </View>
              <TouchableOpacity style={[styles.dimBtn, { backgroundColor: colors.surfaceLight }]}
                onPress={() => saveMushafHeight(Math.min(2000, mushafHeight + 50))}
                onLongPress={() => saveMushafHeight(Math.min(2000, mushafHeight + 100))}>
                <Text style={[styles.dimBtnText, { color: colors.text }]}>+</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.presetRow}>
              {[1000, 1200, 1437, 1700].map(v => (
                <TouchableOpacity key={v} style={[styles.presetChip, {
                  backgroundColor: mushafHeight === v ? colors.gold : colors.surfaceLight,
                  borderColor: mushafHeight === v ? colors.gold : colors.border,
                }]} onPress={() => saveMushafHeight(v)}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: mushafHeight === v ? '#fff' : colors.text }}>{v}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity style={[styles.resetBtn, { borderColor: colors.border }]}
            onPress={() => { saveMushafWidth(750); saveMushafHeight(1437); }}>
            <Text style={[styles.resetBtnText, { color: colors.textSecondary }]}>↺ إعادة الضبط الافتراضي (750 × 1437)</Text>
          </TouchableOpacity>
        </View>

        {/* ── الإشعارات ── */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: 24 }]}>الإشعارات</Text>

        <View style={[styles.settingItem, { backgroundColor: colors.surface, borderColor: colors.border, flexDirection: 'column', gap: 0 }]}>
          <View style={styles.switchRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
              <View style={[styles.settingIcon, { backgroundColor: colors.surfaceLight }]}>
                <Bell size={20} color={colors.gold} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>إشعارات الحفظ والمراجعة</Text>
                <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>تذكير يومي بمراجعة المحفوظات</Text>
              </View>
            </View>
            <Switch
              value={hifzSettings.notificationsEnabled}
              onValueChange={toggleHifzNotifications}
              trackColor={{ false: colors.surfaceLight, true: colors.gold + '80' }}
              thumbColor={hifzSettings.notificationsEnabled ? colors.gold : colors.textSecondary}
            />
          </View>
        </View>

        {/* ── مواقيت الصلاة ── */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: 24 }]}>مواقيت الصلاة</Text>

        <View style={[styles.settingItem, { backgroundColor: colors.surface, borderColor: colors.border, flexDirection: 'column', gap: 0 }]}>

          {/* Master toggle */}
          <View style={styles.switchRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
              <View style={[styles.settingIcon, { backgroundColor: colors.surfaceLight }]}>
                <Clock size={20} color={colors.gold} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>تفعيل مواقيت الصلاة</Text>
                <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>{prayerSettings.cityName}</Text>
              </View>
            </View>
            <Switch
              value={prayerSettings.enabled}
              onValueChange={togglePrayerNotifications}
              trackColor={{ false: colors.surfaceLight, true: colors.gold + '80' }}
              thumbColor={prayerSettings.enabled ? colors.gold : colors.textSecondary}
            />
          </View>

          {prayerSettings.enabled && (
            <>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              {/* ── الموقع وطريقة الحساب ── */}
              <View style={{ paddingVertical: 10, paddingHorizontal: 4, gap: 10 }}>

                {/* Single button: auto-detect location + method */}
                <TouchableOpacity
                  style={[styles.locationBtn, { backgroundColor: colors.gold, opacity: locLoading ? 0.7 : 1 , width: '100%', justifyContent: 'center'}]}
                  onPress={handleDetectLocation}
                  disabled={locLoading}
                >
                  <View style={{ position: 'absolute', left: 16 }}>
                  {locLoading
                    ? <ActivityIndicator size="small" color="#000" />
                    : <MapPin size={16} color="#000" />
                  }
                  </View>
                  <Text style={styles.locationBtnText}>
                    {locLoading ? 'جارٍ تحديد الموقع...' : 'تحديد موقعي تلقائياً'}
                  </Text>
                </TouchableOpacity>

                {/* Compact method row — tapping opens alert picker */}
                <TouchableOpacity
                  style={[styles.methodPickerRow, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}
                  onPress={handlePickMethod}
                >
                  <View style={[styles.settingIcon, { backgroundColor: colors.surface }]}>
                    <Calculator size={18} color={colors.gold} />
                  </View>
                  <View style={{ flex: 1, marginHorizontal: 10 }}>
                    <Text style={[styles.settingTitle, { color: colors.text }]}>طريقة الحساب</Text>
                    <Text style={[styles.settingSubtitle, { color: colors.textSecondary, fontSize: 10 }]} numberOfLines={1}>
                      {currentMethod?.label ?? ''}
                    </Text>
                    <MethodPickerModal
                    visible={methodModalVisible}
                    selectedMethod={prayerSettings.method}
                    onSelect={(id) => updatePrayer({ method: id })}
                    onClose={() => setMethodModalVisible(false)}
                  />
                  </View>
                  <Text style={{ color: colors.textSecondary, fontSize: 20 }}>›</Text>
                </TouchableOpacity>

              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              {/* 15-min reminder */}
              <View style={styles.switchRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                  <View style={[styles.settingIcon, { backgroundColor: '#FF980020' }]}>
                    <Sunrise size={20} color='#FF9800' />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.settingTitle, { color: colors.text }]}>تنبيه 15 دقيقة قبل الأذان</Text>
                    <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>إشعار تذكير قبل كل صلاة</Text>
                  </View>
                </View>
                <Switch
                  value={prayerSettings.notifyBefore15}
                  onValueChange={val => updatePrayer({ notifyBefore15: val })}
                  trackColor={{ false: colors.surfaceLight, true: '#FF980080' }}
                  thumbColor={prayerSettings.notifyBefore15 ? '#FF9800' : colors.textSecondary}
                />
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              {/* At prayer time */}
              <View style={styles.switchRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                  <View style={[styles.settingIcon, { backgroundColor: colors.gold + '20' }]}>
                    <Bell size={20} color={colors.gold} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.settingTitle, { color: colors.text }]}>إشعار عند وقت الأذان</Text>
                    <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>إشعار فور حلول وقت كل صلاة</Text>
                  </View>
                </View>
                <Switch
                  value={prayerSettings.notifyAtTime ?? true}
                  onValueChange={val => updatePrayer({ notifyAtTime: val })}
                  trackColor={{ false: colors.surfaceLight, true: colors.gold + '80' }}
                  thumbColor={(prayerSettings.notifyAtTime ?? true) ? colors.gold : colors.textSecondary}
                />
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              {/* Per-prayer toggles */}
              <Text style={[styles.prayerSubTitle, { color: colors.textSecondary }]}>تفعيل إشعار لكل صلاة:</Text>

              {PRAYER_ORDER.map(name => {
                const prayer = prayers.find(p => p.name === name);
                return (
                  <View key={name} style={styles.prayerRow}>
                    <Text style={[styles.prayerName, { color: colors.text }]}>{PRAYER_LABELS[name]}</Text>
                    {prayer && (
                      <Text style={[styles.prayerTime, { color: colors.gold }]}>{prayer.timeStr}</Text>
                    )}
                    <Switch
                      value={prayerSettings.enabledPrayers[name]}
                      onValueChange={val => togglePrayerItem(name, val)}
                      trackColor={{ false: colors.surfaceLight, true: colors.gold + '80' }}
                      thumbColor={prayerSettings.enabledPrayers[name] ? colors.gold : colors.textSecondary}
                    />
                  </View>
                );
              })}

              <TouchableOpacity
                style={[styles.viewPrayersBtn, { backgroundColor: colors.gold }]}
                onPress={() => router.push('/prayer-times' as any)}
              >
                <Clock size={16} color="#000" />
                <Text style={styles.viewPrayersBtnText}>عرض وتعديل مواقيت اليوم</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* ── ميزات القراءة ── */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: 24 }]}>ميزات القراءة</Text>

        <TouchableOpacity
          style={[styles.settingItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => router.push('/tafsir' as any)} activeOpacity={0.8}
        >
          <View style={[styles.settingIcon, { backgroundColor: colors.surfaceLight }]}>
            <BookOpen size={22} color={colors.gold} />
          </View>
          <View style={styles.settingContent}>
            <Text style={[styles.settingTitle, { color: colors.text }]}>التفسير</Text>
            <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>تفسير الصفحة الحالية</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.settingItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => router.push('/hifz' as any)} activeOpacity={0.8}
        >
          <View style={[styles.settingIcon, { backgroundColor: colors.surfaceLight }]}>
            <Type size={22} color={colors.gold} />
          </View>
          <View style={styles.settingContent}>
            <Text style={[styles.settingTitle, { color: colors.text }]}>برنامج التحفيظ</Text>
            <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>تتبع حفظك اليومي</Text>
          </View>
        </TouchableOpacity>

        {/* ── حول التطبيق ── */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: 24 }]}>حول التطبيق</Text>

        <View style={[styles.settingItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.settingIcon, { backgroundColor: colors.surfaceLight }]}>
            <Info size={22} color={colors.gold} />
          </View>
          <View style={styles.settingContent}>
            <Text style={[styles.settingTitle, { color: colors.text }]}>الإصدار</Text>
            <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>1.0.0</Text>
          </View>
        </View>

        <View style={[styles.aboutCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.aboutTitle, { color: colors.gold }]}>تطبيق القرآن الكريم</Text>
          <Text style={[styles.aboutText, { color: colors.textSecondary }]}>
            تطبيق شامل لقراءة القرآن الكريم مع التفسير والأذكار والسبحة الإلكترونية.
          </Text>
          <Text style={[styles.aboutText, { color: colors.textSecondary, marginTop: 12 }]}>
            نسأل الله أن يجعله في ميزان حسناتنا وحسناتكم.
          </Text>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
  },
  closeButton: { padding: 8, borderRadius: 20 },
  headerText:  { fontSize: 18, fontWeight: '700' },
  placeholder: { width: 40 },
  content:     { padding: 16, paddingBottom: 40 },
  sectionTitle:{ fontSize: 14, fontWeight: '600', marginBottom: 12, marginLeft: 4 },
  settingItem: {
    flexDirection: 'row', alignItems: 'center',
    padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 10,
  },
  settingIcon: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  settingContent:  { flex: 1, marginHorizontal: 12 },
  settingTitle:    { fontSize: 16, fontWeight: '600' },
  settingSubtitle: { fontSize: 12, marginTop: 2 },
  toggle: { width: 52, height: 30, borderRadius: 15, padding: 3, justifyContent: 'center' },
  toggleIndicator: { width: 24, height: 24, borderRadius: 12 },
  toggleIndicatorActive: { alignSelf: 'flex-end' },
  colorOptionsRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingBottom: 4,
    width: '100%',
  },
  colorOption: {
    flexBasis: '47%', flexGrow: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, borderRadius: 14, borderWidth: 2, gap: 4,
  },
  colorOptionSelected: { borderWidth: 2.5 },
  colorOptionText:     { fontSize: 13 },
  colorPreviewChar:    { fontSize: 16, fontWeight: '700' },
  colorOptionDot:      { width: 8, height: 8, borderRadius: 4 },
  dimBtn:  { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  dimBtnText:  { fontSize: 22, fontWeight: '700', lineHeight: 26 },
  dimTrack:    { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
  dimFill:     { height: '100%', borderRadius: 4 },
  presetRow:   { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  presetChip:  { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },
  resetBtn:    { width: '100%', padding: 12, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  resetBtnText:{ fontSize: 13 },
  switchRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, paddingHorizontal: 4,
  },
  divider: { height: 1, marginVertical: 4, marginHorizontal: -4 },

  // Location + method picker
  locationBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 13, borderRadius: 12, 
  },
  locationBtnText: { fontSize: 14, fontWeight: '700', color: '#000', textAlign: 'center'  },
  methodPickerRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: 12, borderRadius: 12, borderWidth: 1,
  },

  prayerSubTitle: { fontSize: 12, fontWeight: '600', paddingVertical: 8, paddingHorizontal: 4 },
  prayerRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingVertical: 6, paddingHorizontal: 4,
  },
  prayerName: { fontSize: 15, fontWeight: '600', flex: 1 },
  prayerTime: { fontSize: 13, fontWeight: '600', marginRight: 12 },
  viewPrayersBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginTop: 12, paddingVertical: 12, borderRadius: 12,
  },
  viewPrayersBtnText: { fontSize: 14, fontWeight: '700', color: '#000' },
  aboutCard: { padding: 20, borderRadius: 16, borderWidth: 1, marginTop: 24, alignItems: 'center' },
  aboutTitle: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  aboutText:  { fontSize: 14, lineHeight: 22, textAlign: 'center' },
});