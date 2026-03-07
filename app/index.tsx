import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Modal,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  MoreVertical,
  List,
  Bookmark,
  BookOpen,
  Moon,
  Sun,
  X,
  Book,
  MoreHorizontal,
  Save,
  Settings,
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/contexts/ThemeContext';
import { useBookmarks, BookmarkType, getBookmarkColor, getBookmarkLabel } from '@/contexts/BookmarkContext';
import { useAudio } from '@/contexts/AudioContext';
import {
  getSurahByPage,
  TOTAL_PAGES,
  quranData,
  getJuzByPage,
  getHizbByPage,
  getRubByPage,
  getManzilByPage,
} from '@/data/quranData';
import { mushafPages } from '@/data/mushafAssets';
import { usePageColor } from '@/contexts/PageColorContext';

// Speed options: label → pixels per tick (at 60fps)
const SPEED_OPTIONS = [
  { label: 'بطيء جداً', value: 0.3 },
  { label: 'بطيء',      value: 0.6 },
  { label: 'متوسط',     value: 1.0 },
  { label: 'سريع',      value: 1.8 },
  { label: 'سريع جداً', value: 3.0 },
];

export default function QuranScreen() {
  const { pageMode } = usePageColor();

  const IMAGE_WIDTH  = 750;
  const IMAGE_HEIGHT = 1437;

  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const isLandscape = width > height;

  // Portrait sizing
  const availableHeight = height - insets.top - insets.bottom;
  const scaleByHeight   = availableHeight / IMAGE_HEIGHT;
  const scaleByWidth    = width / IMAGE_WIDTH;
  const scale           = Math.min(scaleByHeight, scaleByWidth);
  const portraitW       = IMAGE_WIDTH  * scale;
  const portraitH       = IMAGE_HEIGHT * scale;

  // Landscape: fill full width
  const landscapeW = width * 0.9;
  const landscapeH = width * 0.9 * (IMAGE_HEIGHT / IMAGE_WIDTH);

  const imageWidth  = isLandscape ? landscapeW : portraitW;
  const imageHeight = isLandscape ? landscapeH : portraitH;

  // ── Auto-scroll state ──
  const [autoScroll,  setAutoScroll]  = useState(false);
  const [speedIndex,  setSpeedIndex]  = useState(2); // default = 'متوسط'
  // const scrollRef     = useRef<ScrollView>(null);
  const scrollRef = useRef<FlatList>(null);
  const scrollYRef    = useRef(0);
  const autoScrollRef = useRef(false);
  const animFrameRef  = useRef<number | null>(null);

  useEffect(() => { autoScrollRef.current = autoScroll; }, [autoScroll]);

  const stopAutoScroll = useCallback(() => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  }, []);

  const startAutoScroll = useCallback(() => {
    stopAutoScroll();
    const speed = SPEED_OPTIONS[speedIndex].value;
const tick = () => {
  if (!autoScrollRef.current) return;
  scrollYRef.current += speed;
  landscapeListRef.current?.scrollToOffset({ offset: scrollYRef.current, animated: false });
  animFrameRef.current = requestAnimationFrame(tick);
};
    animFrameRef.current = requestAnimationFrame(tick);
  }, [speedIndex, stopAutoScroll]);

  useEffect(() => {
    if (autoScroll) startAutoScroll();
    else stopAutoScroll();
    return stopAutoScroll;
  }, [autoScroll, speedIndex]);

  // Stop auto-scroll when leaving landscape
  useEffect(() => {
    if (!isLandscape) {
      setAutoScroll(false);
    }
  }, [isLandscape]);

  // ── UI / nav ──
  const [showUI, setShowUI] = useState(false);
  const toggleUI = () => setShowUI(prev => !prev);

  const router = useRouter();
  const { mode, colors, toggleTheme } = useTheme();
  const { currentPage, setCurrentPage, addBookmark, getBookmarkForPage, removeBookmark } = useBookmarks();
  const { goToPage } = useLocalSearchParams<{ goToPage?: string }>();

  const [showMenu,          setShowMenu]          = useState(false);
  const [showBookmarkModal, setShowBookmarkModal] = useState(false);
  const [bookmarkNotification, setBookmarkNotification] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const { currentSurah: playingSurahNumber } = useAudio();

  const pages = useRef(Array.from({ length: TOTAL_PAGES }, (_, i) => i + 1)).current;

  useEffect(() => {
    if (goToPage) {
      const pageNum = parseInt(goToPage, 10);
      if (pageNum > 0 && pageNum <= TOTAL_PAGES) {
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({ index: pageNum - 1, animated: false });
          setCurrentPage(pageNum);
        }, 100);
      }
    } else if (currentPage > 1) {
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({ index: currentPage - 1, animated: false });
      }, 100);
    }
  }, [goToPage]);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) setCurrentPage(viewableItems[0].item);
  }).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  const currentSurah   = getSurahByPage(currentPage);
  const currentBookmark = getBookmarkForPage(currentPage);

  const handleBookmark = useCallback((type: BookmarkType) => {
    addBookmark(currentPage, type, currentSurah?.name);
    setShowBookmarkModal(false);
    setBookmarkNotification(`تم إضافة علامة ${getBookmarkLabel(type)}`);
    setTimeout(() => setBookmarkNotification(null), 2000);
  }, [currentPage, currentSurah, addBookmark]);

  const handleRemoveBookmark = useCallback(() => {
    removeBookmark(currentPage);
    setShowBookmarkModal(false);
    setBookmarkNotification('تم إزالة العلامة');
    setTimeout(() => setBookmarkNotification(null), 2000);
  }, [currentPage, removeBookmark]);

  const juz    = getJuzByPage(currentPage);
  const hizb   = getHizbByPage(currentPage);
  const rub    = getRubByPage(currentPage);
  const manzil = getManzilByPage(currentPage);

  // ── Page overlay helper ──
  const PageOverlay = () => (
    <>
      {pageMode === 'paper' && (
        <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: '#fff8e1', opacity: 0.18, pointerEvents: 'none' }} />
      )}
      {pageMode === 'dark' && (
        <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: '#1a1a2e', opacity: 0.92, pointerEvents: 'none' }} />
      )}
    </>
  );

  // ── Portrait renderPage ──
  const renderPage = useCallback(({ item }: { item: number }) => {
    const pageImage = mushafPages.find(p => p.page === item)?.image;
    if (!pageImage) return null;
    return (
      <Pressable
        style={{ width, height, justifyContent: 'flex-start', alignItems: 'center' }}
        onPress={toggleUI}
      >
        <View style={{ height: insets.top }} />
        <View style={{ width: imageWidth, height: imageHeight }}>
          <Image
            source={pageImage}
            style={{ width: imageWidth, height: imageHeight }}
            contentFit="fill"
            cachePolicy="memory-disk"
          />
          <PageOverlay />
        </View>
        <View style={{ height: insets.bottom }} />
      </Pressable>
    );
  }, [width, height, insets, imageWidth, imageHeight, pageMode]);

  const getItemLayout = useCallback((_: any, index: number) => ({
    length: width,
    offset: width * index,
    index,
  }), [width]);

  // ════════════════════════════════════════
  // LANDSCAPE MODE — early return
  // ════════════════════════════════════════
  const landscapeListRef = useRef<FlatList>(null);
useEffect(() => {
  if (!isLandscape && currentPage > 1) {
    setTimeout(() => {
      flatListRef.current?.scrollToIndex({
        index: currentPage - 1,
        animated: false,
      });
    }, 100);
  }
}, [isLandscape]);

useEffect(() => {
  if (isLandscape && currentPage > 1) {
    setTimeout(() => {
      landscapeListRef.current?.scrollToIndex({
        index: currentPage - 1,
        animated: false,
      });
    }, 100);
  }
}, [isLandscape]); // only fires when orientation changes

  if (isLandscape) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={mode === 'dark' ? 'light' : 'dark'} hidden />  
      <FlatList
  ref={landscapeListRef}  // ← swap from scrollRef as any
  data={pages}
  keyExtractor={(item) => item.toString()}
  initialNumToRender={5}
  maxToRenderPerBatch={3}
  windowSize={5}
  removeClippedSubviews
  contentContainerStyle={{
    paddingTop: insets.top,
    paddingBottom: insets.bottom,
  }}
  onViewableItemsChanged={onViewableItemsChanged}  // ← tracks page while scrolling
  viewabilityConfig={viewabilityConfig}
  onScrollToIndexFailed={(info) => {
    landscapeListRef.current?.scrollToOffset({
      offset: info.index * landscapeH,
      animated: false,
    });
  }}
  onScroll={(e) => { scrollYRef.current = e.nativeEvent.contentOffset.y; }}
  scrollEventThrottle={16}
  onScrollBeginDrag={() => setAutoScroll(false)}
  showsVerticalScrollIndicator={false}
  renderItem={({ item: pageNum }) => {
    const pageImage = mushafPages.find(p => p.page === pageNum)?.image;
    if (!pageImage) return null;
    return (
      <Pressable onPress={toggleUI}>
        {/* Center the image horizontally since it's now 90% width */}
        <View style={{
          width,
          height: landscapeH,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <View style={{ width: landscapeW, height: landscapeH }}>
            <Image
              source={pageImage}
              style={{ width: landscapeW, height: landscapeH }}
              contentFit="fill"
              cachePolicy="memory-disk"
            />
            <PageOverlay />
          </View>
        </View>
      </Pressable>
    );
  }}
  // onScroll={(e) => { scrollYRef.current = e.nativeEvent.contentOffset.y; }}
  // scrollEventThrottle={16}
  // onScrollBeginDrag={() => setAutoScroll(false)}
  // showsVerticalScrollIndicator={false}
  // ref={scrollRef as any}
/>

        {/* Auto-scroll controls — shown when UI is visible */}
        {showUI && (
          <View style={[styles.landscapeControls, {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
             marginRight: insets.right,         
            marginLeft: insets.left,     
            paddingBottom: insets.bottom + 8,
            paddingRight: insets.right + 8,
            paddingLeft: insets.left + 8,
          }]}>

            {/* Speed selector */}
            <View style={styles.speedRow}>
              <Text style={[styles.speedLabel, { color: colors.textSecondary }]}>سرعة التمرير:</Text>
              <View style={styles.speedChips}>
                {SPEED_OPTIONS.map((opt, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.speedChip,
                      {
                        backgroundColor: speedIndex === idx ? colors.gold : colors.surfaceLight,
                        borderColor: speedIndex === idx ? colors.gold : colors.border,
                      },
                    ]}
                    onPress={() => setSpeedIndex(idx)}
                  >
                    <Text style={[
                      styles.speedChipText,
                      { color: speedIndex === idx ? '#fff' : colors.text },
                    ]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Play / Stop button */}
            <TouchableOpacity
              style={[styles.autoScrollBtn, {
                backgroundColor: autoScroll ? colors.error : colors.gold,
              }]}
              onPress={() => setAutoScroll(v => !v)}
            >
              <Text style={styles.autoScrollBtnText}>
                {autoScroll ? '⏹  إيقاف التمرير التلقائي' : '▶  تشغيل التمرير التلقائي'}
              </Text>
            </TouchableOpacity>

          </View>
        )}
      </View>
    );
  }

  // ════════════════════════════════════════
  // PORTRAIT MODE
  // ════════════════════════════════════════
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />

      {/* Header */}
      <View
        pointerEvents={showUI ? 'auto' : 'none'}
        style={[styles.header, {
          opacity: showUI ? 1 : 0,
          paddingTop: insets.top + 8,
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
          position: 'absolute',
          top: 0, left: 0, right: 0,
          zIndex: 10,
        }]}
      >
        <TouchableOpacity style={styles.headerButton} onPress={() => setShowMenu(true)}>
          <MoreVertical size={24} color={colors.text} />
        </TouchableOpacity>

          <TouchableOpacity
          // style={[styles.bottomButton, { backgroundColor: colors.surfaceLight }]}
          onPress={() => router.push('/surah-index' as any)}
        >
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.gold }]}>
            {currentSurah?.name || 'القرآن الكريم'}
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.text }]}>
            صفحة {currentPage} • الجزء {juz}
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.text }]}>
            حزب {hizb.globalHizb} • ربع {rub.globalRub} • تحزيب القرآن {manzil}
          </Text>
        </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.headerButton} onPress={() => setShowBookmarkModal(true)}>
          <Bookmark
            size={24}
            color={currentBookmark ? getBookmarkColor(currentBookmark.type) : colors.text}
            fill={currentBookmark ? getBookmarkColor(currentBookmark.type) : 'transparent'}
          />
        </TouchableOpacity>
      </View>

      {/* Pages */}
      <FlatList
        ref={flatListRef}
        data={pages}
        horizontal
        pagingEnabled
        inverted
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.toString()}
        renderItem={renderPage}
        getItemLayout={getItemLayout}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={7}
        removeClippedSubviews
        onScrollToIndexFailed={(info) => {
          flatListRef.current?.scrollToOffset({ offset: info.index * width, animated: false });
        }}
      />

      {/* Bottom bar */}
      <View
        pointerEvents={showUI ? 'auto' : 'none'}
        style={[styles.bottomBar, {
          opacity: showUI ? 1 : 0,
          paddingBottom: insets.bottom + 12,
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        }]}
      >
        <TouchableOpacity
          style={[styles.bottomButton, { backgroundColor: colors.surfaceLight }]}
          onPress={() => router.push('/surah-index' as any)}
        >
          <List size={20} color={colors.gold} />
          <Text style={[styles.bottomButtonText, { color: colors.text }]}>الفهرس</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.bottomButton, { backgroundColor: colors.surfaceLight }]}
          onPress={() => router.push({ pathname: '/tafsir' as any, params: { page: currentPage.toString() } })}
        >
          <BookOpen size={20} color={colors.gold} />
          <Text style={[styles.bottomButtonText, { color: colors.text }]}>التفسير</Text>
        </TouchableOpacity>
      </View>

      {/* Bookmark notification */}
      {bookmarkNotification && (
        <View style={[styles.notification, { backgroundColor: colors.success }]}>
          <Text style={styles.notificationText}>{bookmarkNotification}</Text>
        </View>
      )}

      {/* Menu modal */}
      <Modal visible={showMenu} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowMenu(false)}>
          <View style={[styles.menuContainer, { backgroundColor: colors.surface, top: insets.top + 50 }]}>
            <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]}
              onPress={() => { setShowMenu(false); router.push('/azkar' as any); }}>
              <Moon size={20} color={colors.text} />
              <Text style={[styles.menuText, { color: colors.text }]}>الأذكار</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]}
              onPress={() => { setShowMenu(false); router.push('/page-jump' as any); }}>
              <Book size={20} color={colors.text} />
              <Text style={[styles.menuText, { color: colors.text }]}>الانتقال إلي صفحة</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]}
              onPress={() => { setShowMenu(false); router.push('/more' as any); }}>
              <MoreHorizontal size={20} color={colors.text} />
              <Text style={[styles.menuText, { color: colors.text }]}>المزيد</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]}
              onPress={() => { setShowMenu(false); router.push('/settings' as any); }}>
              <Settings size={20} color={colors.text} />
              <Text style={[styles.menuText, { color: colors.text }]}>الإعدادات</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]}
              onPress={() => { setShowMenu(false); router.push('/hifz' as any); }}>
              <Save size={20} color={colors.text} />
              <Text style={[styles.menuText, { color: colors.text }]}>برنامج تحفيظ</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]}
              onPress={() => { setShowMenu(false); toggleTheme(); }}>
              {mode === 'dark'
                ? <Sun size={20} color={colors.text} />
                : <Moon size={20} color={colors.text} />}
              <Text style={[styles.menuText, { color: colors.text }]}>
                {mode === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem}
              onPress={() => { setShowMenu(false); router.push('/bookmarks' as any); }}>
              <Bookmark size={20} color={colors.text} />
              <Text style={[styles.menuText, { color: colors.text }]}>العلامات المرجعية</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Bookmark modal */}
      <Modal visible={showBookmarkModal} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowBookmarkModal(false)}>
          <View style={[styles.bookmarkModal, { backgroundColor: colors.surface, paddingBottom: insets.bottom + 20 }]}>
            <View style={[styles.bookmarkHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.bookmarkTitle, { color: colors.text }]}>إضافة علامة</Text>
              <TouchableOpacity onPress={() => setShowBookmarkModal(false)}>
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.bookmarkOptions}>
              <TouchableOpacity
                style={[styles.bookmarkOption, { backgroundColor: 'rgba(76,175,80,0.15)', borderColor: '#4CAF50' }]}
                onPress={() => handleBookmark('read')}
              >
                <Bookmark size={28} color="#4CAF50" fill="#4CAF50" />
                <Text style={[styles.bookmarkOptionText, { color: '#4CAF50' }]}>قراءة</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.bookmarkOption, { backgroundColor: 'rgba(255,152,0,0.15)', borderColor: '#FF9800' }]}
                onPress={() => handleBookmark('review')}
              >
                <Bookmark size={28} color="#FF9800" fill="#FF9800" />
                <Text style={[styles.bookmarkOptionText, { color: '#FF9800' }]}>مراجعة</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.bookmarkOption, { backgroundColor: 'rgba(33,150,243,0.15)', borderColor: '#2196F3' }]}
                onPress={() => handleBookmark('memorize')}
              >
                <Bookmark size={28} color="#2196F3" fill="#2196F3" />
                <Text style={[styles.bookmarkOptionText, { color: '#2196F3' }]}>حفظ</Text>
              </TouchableOpacity>
            </View>

            {currentBookmark && (
              <TouchableOpacity
                style={[styles.removeBookmarkButton, { borderColor: colors.error }]}
                onPress={handleRemoveBookmark}
              >
                <Text style={[styles.removeBookmarkText, { color: colors.error }]}>إزالة العلامة الحالية</Text>
              </TouchableOpacity>
            )}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 4,
    borderBottomWidth: 1,
  },
  headerButton:   { padding: 8 },
  headerCenter:   { alignItems: 'center' },
  headerTitle:    { fontSize: 20, fontWeight: '700' as const },
  headerSubtitle: { fontSize: 14, marginTop: 2 },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center',
    gap: 16, paddingTop: 8, paddingBottom: 12, borderTopWidth: 1,
  },
  bottomButton: {
    flexDirection: 'row', alignItems: 'center',
    gap: 8, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20,
  },
  bottomButtonText: { fontSize: 14, fontWeight: '600' as const },
  notification: {
    position: 'absolute', top: 120, left: 20, right: 20,
    padding: 16, borderRadius: 12, alignItems: 'center',
  },
  notificationText: { color: '#fff', fontSize: 16, fontWeight: '600' as const },
  modalOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  menuContainer: {
    position: 'absolute', left: 16, borderRadius: 12,
    overflow: 'hidden', minWidth: 200,
    elevation: 5, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    gap: 12, padding: 16, borderBottomWidth: 1,
  },
  menuText:       { fontSize: 16 },
  bookmarkModal: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
  },
  bookmarkHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 20, borderBottomWidth: 1,
  },
  bookmarkTitle:  { fontSize: 18, fontWeight: '700' as const },
  bookmarkOptions: {
    flexDirection: 'row', justifyContent: 'space-around', padding: 20,
  },
  bookmarkOption: {
    alignItems: 'center', padding: 20,
    borderRadius: 16, borderWidth: 2, minWidth: 90,
  },
  bookmarkOptionText: { marginTop: 8, fontSize: 14, fontWeight: '600' as const },
  removeBookmarkButton: {
    marginHorizontal: 20, marginBottom: 20,
    padding: 16, borderRadius: 12, borderWidth: 1, alignItems: 'center',
  },
  removeBookmarkText: { fontSize: 16, fontWeight: '600' as const },

  // ── Landscape ──
  landscapeControls: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 12, borderTopWidth: 1, gap: 10,
  },
  speedRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', flexWrap: 'wrap', gap: 6,
  },
  speedLabel:   { fontSize: 13, fontWeight: '600' },
  speedChips:   { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  speedChip: {
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 14, borderWidth: 1,
  },
  speedChipText: { fontSize: 12, fontWeight: '600' },
  autoScrollBtn: {
    padding: 13, borderRadius: 16, alignItems: 'center',
  },
  autoScrollBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' as const },
});
