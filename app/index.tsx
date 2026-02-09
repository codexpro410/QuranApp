import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  FlatList,
  Image,
  Dimensions,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams, Link } from "expo-router";
import { Bookmark, BookOpen, Hash, ChevronLeft, ChevronRight } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { mushafPages } from "@/data/mushafAssets";
import { getSurahByPage, getJuzByPage, TOTAL_PAGES } from "@/data/quranData";
import { useQuran } from "@/contexts/QuranContext";
import Colors from "@/constants/colors";

const { width, height } = Dimensions.get("window");

export default function MushafScreen() {
  const router = useRouter();
  const { goToPage: goToPageParam } = useLocalSearchParams<{ goToPage?: string }>();
  const insets = useSafeAreaInsets();
  const { currentPage, updateCurrentPage, isPageBookmarked, addBookmark, lastReadPage, isLoading } = useQuran();
  
  const [showControls, setShowControls] = useState(true);
  const [displayPage, setDisplayPage] = useState(currentPage);
  const [initialScrollDone, setInitialScrollDone] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const controlsOpacity = useRef(new Animated.Value(1)).current;
  const hideControlsTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentSurah = getSurahByPage(displayPage);
  const currentJuz = getJuzByPage(displayPage);
  const isBookmarked = isPageBookmarked(displayPage);

  useEffect(() => {
    if (!isLoading && !initialScrollDone) {
      const targetPage = goToPageParam ? parseInt(goToPageParam, 10) : lastReadPage;
      if (targetPage > 0 && targetPage <= TOTAL_PAGES) {
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({ index: targetPage - 1, animated: false });
          setInitialScrollDone(true);
        }, 100);
      } else {
        setInitialScrollDone(true);
      }
    }
  }, [isLoading, lastReadPage, goToPageParam, initialScrollDone]);

  useEffect(() => {
    if (goToPageParam && initialScrollDone) {
      const page = parseInt(goToPageParam, 10);
      if (page > 0 && page <= TOTAL_PAGES) {
        flatListRef.current?.scrollToIndex({ index: page - 1, animated: true });
      }
    }
  }, [goToPageParam, initialScrollDone]);

  const toggleControls = useCallback(() => {
    if (hideControlsTimeout.current) {
      clearTimeout(hideControlsTimeout.current);
    }

    const newValue = !showControls;
    setShowControls(newValue);
    
    Animated.timing(controlsOpacity, {
      toValue: newValue ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();

    if (newValue) {
      hideControlsTimeout.current = setTimeout(() => {
        setShowControls(false);
        Animated.timing(controlsOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }, 5000);
    }
  }, [showControls, controlsOpacity]);

  const handlePageChange = useCallback((index: number) => {
    const page = index + 1;
    setDisplayPage(page);
    updateCurrentPage(page);
  }, [updateCurrentPage]);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const index = viewableItems[0].index;
      handlePageChange(index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const handleBookmark = useCallback(async () => {
    // if (Platform.OS !== 'web') {
    //   Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // }
    await addBookmark(displayPage);
  }, [displayPage, addBookmark]);

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= TOTAL_PAGES) {
      flatListRef.current?.scrollToIndex({ index: page - 1, animated: true });
    }
  }, []);

  const navigatePage = useCallback((direction: 'prev' | 'next') => {
    const newPage = direction === 'next' ? displayPage - 1 : displayPage + 1;
    goToPage(newPage);
    // if (Platform.OS !== 'web') {
    //   Haptics.selectionAsync();
    // }
  }, [displayPage, goToPage]);

  const renderPage = useCallback(({ item }: { item: typeof mushafPages[0] }) => (
    <TouchableOpacity
      activeOpacity={1}
      onPress={toggleControls}
      style={styles.pageContainer}
    >
      <Image
        source={item.image}
        style={styles.pageImage}
        resizeMode="contain"
      />
    </TouchableOpacity>
  ), [toggleControls]);

  const getItemLayout = useCallback((_: any, index: number) => ({
    length: width,
    offset: width * index,
    index,
  }), []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>جارٍ التحميل...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={mushafPages}
        horizontal
        pagingEnabled
        inverted
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.page.toString()}
        renderItem={renderPage}
        getItemLayout={getItemLayout}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        windowSize={5}
        removeClippedSubviews={Platform.OS !== 'web'}
      />

      <Animated.View
        style={[
          styles.topBar,
          { 
            opacity: controlsOpacity,
            paddingTop: insets.top + 8,
          },
        ]}
        pointerEvents={showControls ? 'auto' : 'none'}
      >
        <View style={styles.topBarContent}>
          <View style={styles.surahInfo}>
            <Text style={styles.surahName}>{currentSurah?.name}</Text>
            <Text style={styles.surahEnglish}>{currentSurah?.englishName}</Text>
          </View>
          <View style={styles.pageInfo}>
            <Text style={styles.pageNumber}>{displayPage}</Text>
            <Text style={styles.juzNumber}>الجزء {currentJuz}</Text>
          </View>
        </View>
      </Animated.View>

      <Animated.View
        style={[
          styles.bottomBar,
          { 
            opacity: controlsOpacity,
            paddingBottom: insets.bottom + 12,
          },
        ]}
        pointerEvents={showControls ? 'auto' : 'none'}
      >
        <View style={styles.navigationRow}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigatePage('prev')}
            disabled={displayPage >= TOTAL_PAGES}
          >
            <ChevronRight size={28} color={displayPage >= TOTAL_PAGES ? Colors.textMuted : Colors.gold} />
          </TouchableOpacity>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleBookmark}
              testID="bookmark-button"
            >
              <Bookmark
                size={22}
                color={isBookmarked ? Colors.gold : Colors.text}
                fill={isBookmarked ? Colors.gold : 'transparent'}
              />
              <Text style={[styles.actionText, isBookmarked && styles.actionTextActive]}>
                علامة
              </Text>
            </TouchableOpacity>

         <Link href={'/surah-index' as unknown as any} asChild>
        <TouchableOpacity style={styles.actionButton} testID="index-button">
            <BookOpen size={22} color={Colors.text} />
            <Text style={styles.actionText}>الفهرس</Text>
        </TouchableOpacity>
        </Link>


           <TouchableOpacity
  style={styles.actionButton}
  onPress={() => router.push('/page-jump' as unknown as any)}
  testID="page-jump-button"
>
  <Hash size={22} color={Colors.text} />
  <Text style={styles.actionText}>صفحة</Text>
</TouchableOpacity>

<TouchableOpacity
  style={styles.actionButton}
  onPress={() => router.push('/bookmarks' as unknown as any)}
  testID="bookmarks-button"
>
  <Bookmark size={22} color={Colors.text} />
  <Text style={styles.actionText}>العلامات</Text>
</TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigatePage('next')}
            disabled={displayPage <= 1}
          >
            <ChevronLeft size={28} color={displayPage <= 1 ? Colors.textMuted : Colors.gold} />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.gold,
    fontSize: 18,
    fontWeight: '600',
  },
  pageContainer: {
    width,
    height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageImage: {
    width: width,
    height: height * 0.85,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.overlay,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  topBarContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  surahInfo: {
    alignItems: 'flex-start',
  },
  surahName: {
    color: Colors.gold,
    fontSize: 20,
    fontWeight: '700',
  },
  surahEnglish: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  pageInfo: {
    alignItems: 'flex-end',
  },
  pageNumber: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: '700',
  },
  juzNumber: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.overlay,
    paddingTop: 12,
    paddingHorizontal: 8,
  },
  navigationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navButton: {
    padding: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionButton: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    minWidth: 60,
  },
  actionText: {
    color: Colors.text,
    fontSize: 10,
    marginTop: 4,
    fontWeight: '500',
  },
  actionTextActive: {
    color: Colors.gold,
  },
});
