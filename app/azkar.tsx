import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Sunrise, Sunset, Bell, ChevronLeft, RotateCcw, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAzkar } from '@/contexts/azkarContext';
import { azkarCategories } from '@/data/azkarData';

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

  useEffect(() => {
    initializeNotifications();
  }, [initializeNotifications]);

  const handleCategoryPress = (categoryId: string) => {
    // if (Platform.OS !== 'web') {
    //   Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // }
    router.push(`/azkar-detail?categoryId=${categoryId}` as unknown as any);
  };

  const handleReset = (categoryId: string) => {
    // if (Platform.OS !== 'web') {
    //   Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // }
    resetCategoryProgress(categoryId);
  };

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'sunrise':
        return <Sunrise size={32} color={Colors.gold} />;
      case 'sunset':
        return <Sunset size={32} color={Colors.goldDark} />;
      default:
        return <Sunrise size={32} color={Colors.gold} />;
    }
  };

  const formatTime = (hour: number, minute: number) => {
    const h = hour % 12 || 12;
    const ampm = hour >= 12 ? 'م' : 'ص';
    return `${h}:${minute.toString().padStart(2, '0')} ${ampm}`;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          testID="back-button"
        >
          <ChevronLeft size={28} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>الأذكار</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.categoriesSection}>
          {azkarCategories.map((category) => {
            const progress = getCategoryProgress(category.id, category.azkar);
            const progressPercent = progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;
            const isComplete = progress.completed === progress.total;

            return (
              <View key={category.id} style={styles.categoryCard}>
                <TouchableOpacity
                  style={styles.categoryContent}
                  onPress={() => handleCategoryPress(category.id)}
                  activeOpacity={0.7}
                  testID={`category-${category.id}`}
                >
                  <View style={styles.categoryIcon}>
                    {getCategoryIcon(category.icon)}
                  </View>
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryName}>{category.name}</Text>
                    <Text style={styles.categoryNameEn}>{category.nameEn}</Text>
                    <View style={styles.progressContainer}>
                      <View style={styles.progressBar}>
                        <View
                          style={[
                            styles.progressFill,
                            { width: `${progressPercent}%` },
                            isComplete && styles.progressComplete,
                          ]}
                        />
                      </View>
                      <Text style={styles.progressText}>
                        {progress.completed}/{progress.total}
                      </Text>
                    </View>
                  </View>
                  {isComplete ? (
                    <View style={styles.completeIcon}>
                      <Check size={20} color={Colors.success} />
                    </View>
                  ) : null}
                </TouchableOpacity>
                {progress.completed > 0 && (
                  <TouchableOpacity
                    style={styles.resetButton}
                    onPress={() => handleReset(category.id)}
                    testID={`reset-${category.id}`}
                  >
                    <RotateCcw size={16} color={Colors.textMuted} />
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>

        <View style={styles.notificationsSection}>
          <View style={styles.sectionHeader}>
            <Bell size={20} color={Colors.gold} />
            <Text style={styles.sectionTitle}>التذكيرات</Text>
          </View>

          <View style={styles.notificationCard}>
            <View style={styles.notificationRow}>
              <View style={styles.notificationInfo}>
                <Sunrise size={20} color={Colors.gold} />
                <View style={styles.notificationText}>
                  <Text style={styles.notificationTitle}>تذكير أذكار الصباح</Text>
                  <Text style={styles.notificationTime}>
                    {formatTime(notificationSettings.sabahTime.hour, notificationSettings.sabahTime.minute)}
                  </Text>
                </View>
              </View>
              <Switch
                value={notificationSettings.sabahEnabled}
                onValueChange={(value) => updateNotificationSettings({ sabahEnabled: value })}
                trackColor={{ false: Colors.surface, true: Colors.goldDark }}
                thumbColor={notificationSettings.sabahEnabled ? Colors.gold : Colors.textMuted}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.notificationRow}>
              <View style={styles.notificationInfo}>
                <Sunset size={20} color={Colors.goldDark} />
                <View style={styles.notificationText}>
                  <Text style={styles.notificationTitle}>تذكير أذكار المساء</Text>
                  <Text style={styles.notificationTime}>
                    {formatTime(notificationSettings.masaaTime.hour, notificationSettings.masaaTime.minute)}
                  </Text>
                </View>
              </View>
              <Switch
                value={notificationSettings.masaaEnabled}
                onValueChange={(value) => updateNotificationSettings({ masaaEnabled: value })}
                trackColor={{ false: Colors.surface, true: Colors.goldDark }}
                thumbColor={notificationSettings.masaaEnabled ? Colors.gold : Colors.textMuted}
              />
            </View>
          </View>

          {Platform.OS === 'web' && (
            <Text style={styles.webNote}>
              التذكيرات غير متاحة على الويب
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.gold,
  },
  placeholder: {
    width: 44,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  categoriesSection: {
    gap: 16,
    marginBottom: 32,
  },
  categoryCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryInfo: {
    flex: 1,
    marginLeft: 16,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'right',
  },
  categoryNameEn: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    textAlign: 'right',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.gold,
    borderRadius: 3,
  },
  progressComplete: {
    backgroundColor: Colors.success,
  },
  progressText: {
    fontSize: 12,
    color: Colors.textSecondary,
    minWidth: 40,
    textAlign: 'center',
  },
  completeIcon: {
    marginLeft: 8,
  },
  resetButton: {
    position: 'absolute',
    top: 12,
    left: 12,
    padding: 8,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 20,
  },
  notificationsSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  notificationCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notificationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationText: {
    gap: 2,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  notificationTime: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 16,
  },
  webNote: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 12,
  },
});
