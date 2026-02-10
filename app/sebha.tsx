import React, { useRef, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Platform,
  Pressable,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X, RotateCcw, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useSebha } from '@/contexts/SebhaContext';

const { width } = Dimensions.get('window');

const DHIKR_LIST = [
  { id: 1, text: 'سُبْحَانَ اللَّهِ', transliteration: 'Subhan Allah', meaning: 'Glory be to Allah' },
  { id: 2, text: 'الْحَمْدُ لِلَّهِ', transliteration: 'Alhamdulillah', meaning: 'Praise be to Allah' },
  { id: 3, text: 'اللَّهُ أَكْبَرُ', transliteration: 'Allahu Akbar', meaning: 'Allah is the Greatest' },
  { id: 4, text: 'لَا إِلَٰهَ إِلَّا اللَّهُ', transliteration: 'La ilaha illa Allah', meaning: 'There is no god but Allah' },
  { id: 5, text: 'أَسْتَغْفِرُ اللَّهَ', transliteration: 'Astaghfirullah', meaning: 'I seek forgiveness from Allah' },
  { id: 6, text: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ', transliteration: 'La hawla wa la quwwata illa billah', meaning: 'There is no power except with Allah' },
  { 
  id: 7, 
  text: 'اللَّهُمَّ صَلِّ وَسَلِّمْ وَبَارِكْ عَلَى نَبِيِّنَا مُحَمَّدٍ', 
  transliteration: 'Allahumma salli wa sallim wa barik ala nabiyyina Muhammad', 
  meaning: 'O Allah, send prayers, peace, and blessings upon our Prophet Muhammad' 
},

];

const TARGET_OPTIONS = [33, 99, 100, 500, 1000];

interface DhikrPageProps {
  item: typeof DHIKR_LIST[0];
  index: number;
}

function DhikrPageComponent({ item }: DhikrPageProps) {
 const { counts, target, increment, reset, totalCount } = useSebha();
const count = counts[item.id] || 0;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const counterScaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = useCallback(() => {
    // if (Platform.OS !== 'web') {
    //   Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // }

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
  }, [increment, scaleAnim, counterScaleAnim,item.id]);

  const handleReset = useCallback(() => {
    // if (Platform.OS !== 'web') {
    //   Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // }
    reset(item.id);
  }, [reset, item.id]);

  const progress = Math.min((count / target) * 100, 100);
  const isComplete = count >= target;

  return (
    <View style={styles.pageContainer}>
      <Pressable onPress={handlePress} style={styles.pressableArea}>
        <Animated.View style={[styles.contentCard, { transform: [{ scale: scaleAnim }] }]}>
          <Text style={styles.dhikrText}>{item.text}</Text>
          <Text style={styles.transliteration}>{item.transliteration}</Text>
          <Text style={styles.meaning}>{item.meaning}</Text>

          <Animated.View 
            style={[
              styles.counterCircle, 
              isComplete && styles.counterCircleComplete,
              { transform: [{ scale: counterScaleAnim }] }
            ]}
          >
            <Text style={[styles.counterNumber, isComplete && styles.counterNumberComplete]}>
              {count}
            </Text>
          </Animated.View>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${progress}%` },
                  isComplete && styles.progressFillComplete
                ]} 
              />
            </View>
            <Text style={styles.targetText}>{count} / {target}</Text>
          </View>

          <Text style={styles.totalText}>الإجمالي: {totalCount}</Text>

          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <RotateCcw size={20} color={Colors.text} />
            <Text style={styles.resetButtonText}>إعادة العداد</Text>
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
  

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: { index: number | null }[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setCurrentIndex(viewableItems[0].index);
    }
  }, []);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const renderItem = useCallback(({ item, index }: { item: typeof DHIKR_LIST[0]; index: number }) => (
    <DhikrPage item={item} index={index} />
  ), []);

  const getItemLayout = useCallback((_: unknown, index: number) => ({
    length: width,
    offset: width * index,
    index,
  }), []);

  const handleResetTotal = useCallback(() => {
    // if (Platform.OS !== 'web') {
    //   Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // }
    resetTotal();
  }, [resetTotal]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
          testID="close-button"
        >
          <X size={26} color={Colors.text} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>السبحة</Text>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleResetTotal}
          testID="reset-total-button"
        >
          <Trash2 size={22} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.targetSelector}
        onPress={() => setShowTargetPicker(!showTargetPicker)}
      >
        <Text style={styles.targetSelectorText}>الهدف: {target}</Text>
      </TouchableOpacity>

      {showTargetPicker && (
        <View style={styles.targetPickerContainer}>
          {TARGET_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.targetOption,
                target === option && styles.targetOptionActive,
              ]}
              onPress={() => {
                updateTarget(option);
                setShowTargetPicker(false);
              }}
            >
              <Text 
                style={[
                  styles.targetOptionText,
                  target === option && styles.targetOptionTextActive,
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
                idx === currentIndex && styles.dotActive,
              ]}
            />
          ))}
        </View>
        <View style={styles.navigationHint}>
          <ChevronRight size={16} color={Colors.textMuted} />
          <Text style={styles.navigationText}>اسحب للتنقل بين الأذكار</Text>
          <ChevronLeft size={16} color={Colors.textMuted} />
        </View>
      </View>
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
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.gold,
  },
  targetSelector: {
    alignSelf: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  targetSelectorText: {
    fontSize: 14,
    color: Colors.text,
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
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  targetOptionActive: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  targetOptionText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600',
  },
  targetOptionTextActive: {
    color: Colors.background,
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
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dhikrText: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.gold,
    textAlign: 'center',
    marginBottom: 12,
  },
  transliteration: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: 6,
  },
  meaning: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 32,
  },
  counterCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 5,
    borderColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  counterCircleComplete: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  counterNumber: {
    fontSize: 56,
    fontWeight: '700',
    color: Colors.gold,
  },
  counterNumberComplete: {
    color: Colors.background,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressBar: {
    width: '80%',
    height: 8,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.gold,
    borderRadius: 4,
  },
  progressFillComplete: {
    backgroundColor: Colors.success,
  },
  targetText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  totalText: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: 20,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  resetButtonText: {
    fontSize: 14,
    color: Colors.text,
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
    backgroundColor: Colors.surfaceLight,
  },
  dotActive: {
    backgroundColor: Colors.gold,
    width: 24,
  },
  navigationHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  navigationText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
});
