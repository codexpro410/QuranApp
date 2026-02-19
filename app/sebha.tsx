import React, { useRef, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Pressable,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X, RotateCcw, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/contexts/ThemeContext';
import { useSebha } from '@/contexts/SebhaContext';

const { width } = Dimensions.get('window');

const DHIKR_LIST = [
  { id: 1, text: 'سُبْحَانَ اللَّهِ', transliteration: 'Subhan Allah', meaning: 'Glory be to Allah' },
  { id: 2, text: 'الْحَمْدُ لِلَّهِ', transliteration: 'Alhamdulillah', meaning: 'Praise be to Allah' },
  { id: 3, text: 'اللَّهُ أَكْبَرُ', transliteration: 'Allahu Akbar', meaning: 'Allah is the Greatest' },
  { id: 4, text: 'لَا إِلَٰهَ إِلَّا اللَّهُ', transliteration: 'La ilaha illa Allah', meaning: 'There is no god but Allah' },
  { id: 5, text: 'أَسْتَغْفِرُ اللَّهَ', transliteration: 'Astaghfirullah', meaning: 'I seek forgiveness from Allah' },
  { id: 6, text: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ', transliteration: 'La hawla wa la quwwata illa billah', meaning: 'There is no power except with Allah' },
  { id: 7, text: 'اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ', transliteration: 'Allahumma salli wa sallim ala nabiyyina Muhammad', meaning: 'O Allah, send prayers and peace upon our Prophet Muhammad' },
];

const TARGET_OPTIONS = [33, 99, 100, 500, 1000];

interface DhikrPageProps {
  item: typeof DHIKR_LIST[0];
  colors: any;
}

function DhikrPageComponent({ item, colors }: DhikrPageProps) {
  const { counts, target, increment, reset } = useSebha();
  const count = counts[item.id] || 0;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const counterScaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = useCallback(() => {
    Animated.sequence([
      Animated.timing(counterScaleAnim, {
        toValue: 1.15,
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
        toValue: 0.97,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    increment(item.id);
  }, [increment, scaleAnim, counterScaleAnim, item.id]);

  const handleReset = useCallback(() => {
    reset(item.id);
  }, [reset, item.id]);

  const progress = Math.min((count / target) * 100, 100);
  const isComplete = count >= target;

  return (
    <View style={[styles.pageContainer, { backgroundColor: colors.background }]}>
      <Pressable onPress={handlePress} style={styles.pressableArea}>
        <Animated.View style={[styles.contentCard, { backgroundColor: colors.surface, borderColor: colors.border, transform: [{ scale: scaleAnim }] }]}>
          <Text style={[styles.dhikrText, { color: colors.gold }]}>{item.text}</Text>
          <Text style={[styles.transliteration, { color: colors.textSecondary }]}>{item.transliteration}</Text>
          <Text style={[styles.meaning, { color: colors.textMuted }]}>{item.meaning}</Text>

          <Animated.View 
            style={[
              styles.counterCircle, 
              { backgroundColor: colors.surfaceLight, borderColor: colors.gold },
              isComplete && { backgroundColor: colors.success, borderColor: colors.success },
              { transform: [{ scale: counterScaleAnim }] }
            ]}
          >
            <Text style={[styles.counterNumber, { color: isComplete ? colors.background : colors.gold }]}>
              {count}
            </Text>
          </Animated.View>

          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { backgroundColor: colors.surfaceLight }]}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${progress}%`, backgroundColor: isComplete ? colors.success : colors.gold },
                ]} 
              />
            </View>
            <Text style={[styles.targetText, { color: colors.textSecondary }]}>{count} / {target}</Text>
          </View>

          <TouchableOpacity style={[styles.resetButton, { backgroundColor: colors.surfaceLight }]} onPress={handleReset}>
            <RotateCcw size={20} color={colors.text} />
            <Text style={[styles.resetButtonText, { color: colors.text }]}>إعادة العداد</Text>
          </TouchableOpacity>
        </Animated.View>
      </Pressable>
    </View>
  );
}

const DhikrPage = React.memo(DhikrPageComponent);

export default function SebhaScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const { target, updateTarget, resetTotal } = useSebha();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showTargetPicker, setShowTargetPicker] = useState(false);
  const { mode, colors } = useTheme();

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: { index: number | null }[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setCurrentIndex(viewableItems[0].index);
    }
  }, []);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const renderItem = useCallback(({ item }: { item: typeof DHIKR_LIST[0] }) => (
    <DhikrPage item={item} colors={colors} />
  ), [colors]);

  const getItemLayout = useCallback((_: unknown, index: number) => ({
    length: width,
    offset: width * index,
    index,
  }), []);

  const handleResetTotal = useCallback(() => {
    resetTotal();
  }, [resetTotal]);

  return (
    <>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.back()}
            testID="close-button"
          >
            <X size={26} color={colors.text} />
          </TouchableOpacity>

          <Text style={[styles.headerTitle, { color: colors.gold }]}>السبحة</Text>

          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleResetTotal}
            testID="reset-total-button"
          >
            <Trash2 size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.targetSelector, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setShowTargetPicker(!showTargetPicker)}
        >
          <Text style={[styles.targetSelectorText, { color: colors.text }]}>الهدف: {target}</Text>
        </TouchableOpacity>

        {showTargetPicker && (
          <View style={styles.targetPickerContainer}>
            {TARGET_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.targetOption,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  target === option && { backgroundColor: colors.gold, borderColor: colors.gold },
                ]}
                onPress={() => {
                  updateTarget(option);
                  setShowTargetPicker(false);
                }}
              >
                <Text 
                  style={[
                    styles.targetOptionText,
                    { color: colors.text },
                    target === option && { color: colors.background },
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <FlatList
          ref={flatListRef}
          data={DHIKR_LIST}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          getItemLayout={getItemLayout}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          initialNumToRender={1}
          maxToRenderPerBatch={2}
          windowSize={3}
        />

        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.paginationDots}>
            {DHIKR_LIST.map((_, idx) => (
              <View
                key={idx}
                style={[
                  styles.dot,
                  { backgroundColor: colors.surfaceLight },
                  idx === currentIndex && { backgroundColor: colors.gold, width: 24 },
                ]}
              />
            ))}
          </View>
          <View style={styles.navigationHint}>
            <ChevronRight size={16} color={colors.textMuted} />
            <Text style={[styles.navigationText, { color: colors.textMuted }]}>اسحب للتنقل بين الأذكار</Text>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  targetSelector: {
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginVertical: 12,
    borderWidth: 1,
  },
  targetSelectorText: {
    fontSize: 14,
    fontWeight: '600',
  },
  targetPickerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  targetOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  targetOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  pageContainer: {
    width,
    flex: 1,
    padding: 16,
  },
  pressableArea: {
    flex: 1,
  },
  contentCard: {
    flex: 1,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  dhikrText: {
    fontSize: 36,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  transliteration: {
    fontSize: 16,
    fontStyle: 'italic',
    marginBottom: 6,
  },
  meaning: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
  },
  counterCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  counterNumber: {
    fontSize: 56,
    fontWeight: '700',
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressBar: {
    width: '80%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  targetText: {
    fontSize: 16,
    fontWeight: '600',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  paginationDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  navigationHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  navigationText: {
    fontSize: 12,
  },
});
