import { useAzkar } from '@/contexts/AzkarContext';
import { useTheme } from '@/contexts/ThemeContext';
import { azkarCategories } from '@/data/azkarData';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Bell, Check, ChevronLeft, RotateCcw, Sunrise, Sunset } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
export default function AzkarScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    getCategoryProgress,
    resetCategoryProgress,
    notificationSettings,
    updateNotificationSettings,
    initializeNotifications,
  } = useAzkar();

  const { mode, colors } = useTheme();

  // local state for time input
  const [localTime, setLocalTime] = useState({
    sabah: { hour: notificationSettings.sabahTime.hour, minute: notificationSettings.sabahTime.minute },
    masaa: { hour: notificationSettings.masaaTime.hour, minute: notificationSettings.masaaTime.minute },
  });

  useEffect(() => {
    initializeNotifications();
  }, [initializeNotifications]);

  const handleCategoryPress = (categoryId: string) => {
    router.push(`/azkar-detail?categoryId=${categoryId}` as unknown as any);
  };

  const handleReset = (categoryId: string) => {
    resetCategoryProgress(categoryId);
  };

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'sunrise':
        return <Sunrise size={32} color={colors.gold} />;
      case 'sunset':
        return <Sunset size={32} color={colors.goldDark} />;
      default:
        return <Sunrise size={32} color={colors.gold} />;
    }
  };

  const formatTime = (hour: number, minute: number) => {
    const h = hour % 12 || 12;
    const ampm = hour >= 12 ? 'م' : 'ص';
    return `${h}:${minute.toString().padStart(2, '0')} ${ampm}`;
  };

  const handleTimeChange = (type: 'sabah' | 'masaa', hour: string, minute: string) => {
    const h = Math.min(Math.max(parseInt(hour) || 0, 0), 23);
    const m = Math.min(Math.max(parseInt(minute) || 0, 0), 59);

    setLocalTime(prev => ({
      ...prev,
      [type]: { hour: h, minute: m }
    }));

    // update context and notification
    updateNotificationSettings({
      [`${type}Time`]: { hour: h, minute: m }
    });
  };

  return (
    <>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
        <KeyboardAvoidingView
    style={{ flex: 1 }}
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  >
    {/* <ScrollView
      contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
    > */}
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}> 
          <TouchableOpacity style={styles.backButton} onPress={() => { if(router.canGoBack()){router.back()}else{router.replace('/')}}}>
            <ChevronLeft size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.gold }]}>الأذكار</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 20 }]}>

          {/* Categories Section */}
          <View style={styles.categoriesSection}>
            {azkarCategories.map(category => {
              const progress = getCategoryProgress(category.id, category.azkar);
              const progressPercent = progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;
              const isComplete = progress.completed === progress.total;

              return (
                <View key={category.id} style={[styles.categoryCard, { borderColor: colors.border, backgroundColor: colors.surface }]}> 
                  <TouchableOpacity style={styles.categoryContent} onPress={() => handleCategoryPress(category.id)} activeOpacity={0.7}>
                    <View style={[styles.categoryIcon, { backgroundColor: colors.surfaceLight }]}>
                      {getCategoryIcon(category.icon)}
                    </View>
                    <View style={styles.categoryInfo}>
                      <Text style={[styles.categoryName, { color: colors.text }]}>{category.name}</Text>
                      <Text style={[styles.categoryNameEn, { color: colors.textSecondary }]}>{category.nameEn}</Text>
                      <View style={styles.progressContainer}>
                        <View style={[styles.progressBar, { backgroundColor: colors.surfaceLight }]}>
                          <View style={[styles.progressFill, { width: `${progressPercent}%`, backgroundColor: isComplete ? colors.success : colors.gold }]} />
                        </View>
                        <Text style={[styles.progressText, { color: colors.textSecondary }]}>{progress.completed}/{progress.total}</Text>
                      </View>
                    </View>
                    {isComplete && <Check size={20} color={colors.success} />}
                  </TouchableOpacity>
                  {progress.completed > 0 && (
                    <TouchableOpacity style={[styles.resetButton, { backgroundColor: colors.surfaceLight }]} onPress={() => handleReset(category.id)}>
                      <RotateCcw size={16} color={colors.textMuted} />
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>

          {/* Notifications Section */}
          <View style={styles.notificationsSection}>
            <View style={styles.sectionHeader}>
              <Bell size={20} color={colors.gold} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>التذكيرات</Text>
            </View>

            <View style={[styles.notificationCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 

              {/* Sabah Notification */}
              <View style={styles.notificationRow}>
                <View style={styles.notificationInfo}>
                  <Sunrise size={20} color={colors.gold} />
                  <View style={styles.notificationText}>
                    <Text style={[styles.notificationTitle, { color: colors.text }]}>تذكير أذكار الصباح</Text>
                    <View style={{ flexDirection: 'row', gap: 4 }}>
                      <TextInput
                        value={localTime.sabah.hour.toString()}
                        keyboardType='numeric'
                        style={[styles.timeInput, { color: colors.text, borderColor: colors.border }]}
                        onChangeText={val => handleTimeChange('sabah', val, localTime.sabah.minute.toString())}
                      />
                      <Text>:</Text>
                      <TextInput
                        value={localTime.sabah.minute.toString()}
                        keyboardType='numeric'
                        style={[styles.timeInput, { color: colors.text, borderColor: colors.border }]}
                        onChangeText={val => handleTimeChange('sabah', localTime.sabah.hour.toString(), val)}
                      />
                    </View>
                  </View>
                </View>
                <Switch
                  value={notificationSettings.sabahEnabled}
                  onValueChange={value => updateNotificationSettings({ sabahEnabled: value })}
                  trackColor={{ false: colors.surface, true: colors.goldDark }}
                  thumbColor={notificationSettings.sabahEnabled ? colors.gold : colors.textMuted}
                />
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              {/* Masaa Notification */}
              <View style={styles.notificationRow}>
                <View style={styles.notificationInfo}>
                  <Sunset size={20} color={colors.goldDark} />
                  <View style={styles.notificationText}>
                    <Text style={[styles.notificationTitle, { color: colors.text }]}>تذكير أذكار المساء</Text>
                    <View style={{ flexDirection: 'row', gap: 4 }}>
                      <TextInput
                        value={localTime.masaa.hour.toString()}
                        keyboardType='numeric'
                        style={[styles.timeInput, { color: colors.text, borderColor: colors.border }]}
                        onChangeText={val => handleTimeChange('masaa', val, localTime.masaa.minute.toString())}
                      />
                      <Text>:</Text>
                      <TextInput
                        value={localTime.masaa.minute.toString()}
                        keyboardType='numeric'
                        style={[styles.timeInput, { color: colors.text, borderColor: colors.border }]}
                        onChangeText={val => handleTimeChange('masaa', localTime.masaa.hour.toString(), val)}
                      />
                    </View>
                  </View>
                </View>
                <Switch
                  value={notificationSettings.masaaEnabled}
                  onValueChange={value => updateNotificationSettings({ masaaEnabled: value })}
                  trackColor={{ false: colors.surface, true: colors.goldDark }}
                  thumbColor={notificationSettings.masaaEnabled ? colors.gold : colors.textMuted}
                />
              </View>

            </View>

            {Platform.OS === 'web' && (
              <Text style={[styles.webNote, { color: colors.textMuted }]}>التذكيرات غير متاحة على الويب</Text>
            )}

          </View>

        </ScrollView>
      </View>
          {/* </ScrollView> */}
  </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  placeholder: { width: 44 },
  content: { flex: 1 },
  contentContainer: { padding: 16 },
  categoriesSection: { gap: 16, marginBottom: 32 },
  categoryCard: { borderRadius: 16, overflow: 'hidden', borderWidth: 1 },
  categoryContent: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  categoryIcon: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  categoryInfo: { flex: 1, marginLeft: 16 },
  categoryName: { fontSize: 18, fontWeight: '700', textAlign: 'right' },
  categoryNameEn: { fontSize: 12, marginTop: 2, textAlign: 'right' },
  progressContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  progressBar: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressText: { fontSize: 12, minWidth: 40, textAlign: 'center' },
  completeIcon: { marginLeft: 8 },
  resetButton: { position: 'absolute', top: 12, left: 12, padding: 8, borderRadius: 20 },
  notificationsSection: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600' },
  notificationCard: { borderRadius: 16, padding: 16, borderWidth: 1 },
  notificationRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  notificationInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  notificationText: { gap: 2 },
  notificationTitle: { fontSize: 14, fontWeight: '600' },
  notificationTime: { fontSize: 12 },
  divider: { height: 1, marginVertical: 16 },
  webNote: { fontSize: 12, textAlign: 'center', marginTop: 12 },
  timeInput: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, width: 40, textAlign: 'center' },
});
