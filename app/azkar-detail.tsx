
import React, { useRef, useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Animated,
  Dimensions,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, ChevronRight, Check, RotateCcw, Hand } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/contexts/ThemeContext';
import { azkarCategories, Zikr } from '@/data/azkarData';
import { useAzkar } from '@/contexts/AzkarContext';

const { width } = Dimensions.get('window');

interface ZikrCardProps {
  zikr: Zikr;
  categoryId: string;
  index: number;
  total: number;
  onResetSingle: (zikrId: number) => void;
  colors: any;
}

function ZikrCardComponent({ zikr, categoryId, index, total, onResetSingle, colors }: ZikrCardProps) {
  const { incrementZikrCount, getZikrCount, isZikrCompleted } = useAzkar();
  const currentCount = getZikrCount(categoryId, zikr.id);
  const isComplete = isZikrCompleted(categoryId, zikr.id, zikr.count);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const counterScaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = useCallback(() => {
    if (isComplete) return;

    Animated.sequence([
      Animated.timing(counterScaleAnim, {
        toValue: 1.2,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(counterScaleAnim, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.98,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    incrementZikrCount(categoryId, zikr.id, zikr.count);
  }, [categoryId, zikr.id, zikr.count, isComplete, incrementZikrCount, scaleAnim, counterScaleAnim]);

  const handleReset = useCallback(() => {
    onResetSingle(zikr.id);
  }, [onResetSingle, zikr.id]);

  const progress = currentCount / zikr.count;

  return (
    <View style={styles.cardWrapper}>
      <Pressable onPress={handlePress} style={styles.cardPressable}>
        <Animated.View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardIndex, { color: colors.textMuted }]}>{index + 1}/{total}</Text>
            <TouchableOpacity
              style={[styles.resetSingleButton, { backgroundColor: colors.surfaceLight }]}
              onPress={handleReset}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <RotateCcw size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.counterSection}>
            <Animated.View style={[
              styles.counterCircle, 
              { backgroundColor: colors.surfaceLight, borderColor: colors.gold },
              isComplete && { backgroundColor: colors.success, borderColor: colors.success },
              { transform: [{ scale: counterScaleAnim }] }
            ]}>
              {isComplete ? (
                <Check size={48} color={colors.background} />
              ) : (
                <Text style={[styles.counterNumber, { color: colors.gold }]}>{currentCount}</Text>
              )}
            </Animated.View>
            <Text style={[styles.counterTarget, { color: colors.textSecondary }]}>من {zikr.count}</Text>
          </View>

          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBarBg, { backgroundColor: colors.surfaceLight }]}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${progress * 100}%`, backgroundColor: isComplete ? colors.success : colors.gold },
                ]}
              />
            </View>
          </View>

          <View style={styles.zikrTextContainer}>
            <Text style={[styles.zikrText, { color: colors.text }]} numberOfLines={4}>{zikr.text}</Text>
          </View>

          {zikr.reward && (
            <View style={[styles.rewardContainer, { backgroundColor: colors.surfaceLight }]}>
              <Text style={[styles.rewardText, { color: colors.gold }]}>🌟 {zikr.reward}</Text>
            </View>
          )}

          {!isComplete && (
            <View style={styles.tapHintContainer}>
              <Hand size={16} color={colors.textMuted} />
              <Text style={[styles.tapHint, { color: colors.textMuted }]}>اضغط في أي مكان للعد</Text>
            </View>
          )}
        </Animated.View>
      </Pressable>
    </View>
  );
}

const ZikrCard = React.memo(ZikrCardComponent);

export default function AzkarDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
  const flatListRef = useRef<FlatList>(null);
  const { getCategoryProgress, resetCategoryProgress, resetSingleZikr } = useAzkar();
  const [currentIndex, setCurrentIndex] = useState(0);
  const { mode, colors } = useTheme();

  const category = useMemo(() => 
    azkarCategories.find(c => c.id === categoryId),
    [categoryId]
  );

  const progress = useMemo(() => {
    if (!category) return { completed: 0, total: 0 };
    return getCategoryProgress(category.id, category.azkar);
  }, [category, getCategoryProgress]);

  const handleReset = useCallback(() => {
    if (!category) return;
    resetCategoryProgress(category.id);
    flatListRef.current?.scrollToIndex({ index: 0, animated: true });
  }, [category, resetCategoryProgress]);

  const handleResetSingle = useCallback((zikrId: number) => {
    if (!category) return;
    resetSingleZikr(category.id, zikrId);
  }, [category, resetSingleZikr]);

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: { index: number | null }[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setCurrentIndex(viewableItems[0].index);
    }
  }, []);

  const viewabilityConfig = useMemo(() => ({
    itemVisiblePercentThreshold: 50,
  }), []);

  const renderItem = useCallback(({ item, index }: { item: Zikr; index: number }) => {
    if (!category) return null;
    return (
      <ZikrCard
        zikr={item}
        categoryId={category.id}
        index={index}
        total={category.azkar.length}
        onResetSingle={handleResetSingle}
        colors={colors}
      />
    );
  }, [category, handleResetSingle, colors]);

  const getItemLayout = useCallback((_: unknown, index: number) => ({
    length: width,
    offset: width * index,
    index,
  }), []);

  if (!category) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>الفئة غير موجودة</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.back()}
            testID="back-button"
          >
            <ChevronRight size={28} color={colors.text} />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: colors.gold }]}>{category.name}</Text>
            <Text style={[styles.headerProgress, { color: colors.textSecondary }]}>
              {progress.completed}/{progress.total} مكتمل
            </Text>
          </View>

          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleReset}
            testID="reset-button"
          >
            <RotateCcw size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <FlatList
          ref={flatListRef}
          data={category.azkar}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          getItemLayout={getItemLayout}
          initialNumToRender={1}
          maxToRenderPerBatch={2}
          windowSize={3}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
        />

        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.paginationDots}>
            {category.azkar.length <= 10 && category.azkar.map((_, idx) => (
              <View
                key={idx}
                style={[
                  styles.dot,
                  { backgroundColor: colors.surfaceLight },
                  idx === currentIndex && { backgroundColor: colors.gold, width: 18 },
                ]}
              />
            ))}
            {category.azkar.length > 10 && (
              <Text style={[styles.paginationText, { color: colors.textSecondary }]}>
                {currentIndex + 1} / {category.azkar.length}
              </Text>
            )}
          </View>
          <View style={styles.navigationHint}>
            <ChevronRight size={16} color={colors.textMuted} />
            <Text style={[styles.navigationText, { color: colors.textMuted }]}>اسحب للتنقل</Text>
            <ChevronLeft size={16} color={colors.textMuted} />
          </View>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerButton: {
    padding: 8,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerProgress: {
    fontSize: 12,
    marginTop: 2,
  },
  cardWrapper: {
    width,
    padding: 12,
  },
  cardPressable: {
    flex: 1,
  },
  card: {
    flex: 1,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardIndex: {
    fontSize: 14,
    fontWeight: '600',
  },
  resetSingleButton: {
    padding: 6,
    borderRadius: 20,
  },
  counterSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  counterCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterNumber: {
    fontSize: 48,
    fontWeight: '700',
  },
  counterTarget: {
    fontSize: 16,
    marginTop: 12,
    fontWeight: '600',
  },
  progressBarContainer: {
    marginBottom: 16,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  zikrTextContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 8,
  },
  zikrText: {
    fontSize: 18,
    lineHeight: 32,
    textAlign: 'center',
    fontWeight: '500',
  },
  rewardContainer: {
    borderRadius: 12,
    padding: 10,
    marginTop: 12,
  },
  rewardText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  tapHintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },
  tapHint: {
    fontSize: 12,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  paginationDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  paginationText: {
    fontSize: 14,
    fontWeight: '600',
  },
  navigationHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  navigationText: {
    fontSize: 11,
  },
  errorText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
  },
});
