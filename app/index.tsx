import { useRouter } from 'expo-router';
import { BookOpen, Bookmark, List, MoreVertical } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BookmarkSheet from '@/components/BookmarkSheet';
import MushafMenu from '@/components/MushafMenu';
import MushafPage from '@/components/MushafPage';
import SystemBars from '@/components/SystemBars';
import { BookmarkType, getBookmarkColor, getBookmarkLabel, useBookmarks } from '@/contexts/BookmarkContext';
import { getPageStyle } from '@/constants/pageStyles';
import { usePageColor } from '@/contexts/PageColorContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  TOTAL_PAGES,
  getHizbByPage,
  getJuzByPage,
  getManzilByPage,
  getRubByPage,
  getSurahByPage,
} from '@/data/quranData';

// سرعة التمرير التلقائي: بكسل لكل إطار (عند 60 إطار/ث)
const SPEED_OPTIONS = [
  { label: 'بطيء جداً', value: 0.3 },
  { label: 'بطيء', value: 0.6 },
  { label: 'متوسط', value: 1.0 },
  { label: 'سريع', value: 1.8 },
  { label: 'سريع جداً', value: 3.0 },
];

const PAGES = Array.from({ length: TOTAL_PAGES }, (_, i) => i + 1);
const keyExtractor = (item: number) => String(item);
const VIEWABILITY_CONFIG = { itemVisiblePercentThreshold: 50 };

export default function QuranScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { mode, colors } = useTheme();
  const { pageMode, mushafWidth, mushafHeight } = usePageColor();
  const {
    currentPage, setCurrentPage, isLoaded, jumpRequest,
    addBookmark, removeBookmark, getBookmarkForPage,
  } = useBookmarks();

  const pageStyle = getPageStyle(pageMode);
  const isLandscape = width > height;
  const listRef = useRef<FlatList<number>>(null);

  // ── أبعاد الصفحة: نسبة العرض/الارتفاع تأتي من إعدادات «أبعاد صفحة المصحف» ──
  const aspect = mushafHeight / mushafWidth;

  // عمودي: تناسب الصفحة داخل الشاشة
  const availableHeight = height - insets.top - insets.bottom;
  const scale = Math.min(availableHeight / mushafHeight, width / mushafWidth);
  const portraitW = mushafWidth * scale;
  const portraitH = mushafHeight * scale;

  // أفقي: 90% من العرض مع تمرير رأسي
  const landscapeW = width * 0.9;
  const landscapeH = landscapeW * aspect;

  // ── واجهة المستخدم ──
  const [showUI, setShowUI] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showBookmarkSheet, setShowBookmarkSheet] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toggleUI = useCallback(() => setShowUI(v => !v), []);

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2000);
  }, []);

  // ── الانتقال إلى صفحة (من الفهرس/العلامات/الانتقال لصفحة) ──
  // كل طلب له nonce مختلف، فيعمل حتى لو اخترت نفس السورة مرتين.
  const handledNonce = useRef(jumpRequest?.nonce ?? 0);
  useEffect(() => {
    if (!jumpRequest || jumpRequest.nonce === handledNonce.current) return;
    handledNonce.current = jumpRequest.nonce;
    const index = jumpRequest.page - 1;
    const id = requestAnimationFrame(() => {
      listRef.current?.scrollToIndex({ index, animated: false });
    });
    return () => cancelAnimationFrame(id);
  }, [jumpRequest]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: { item: number }[] }) => {
      if (viewableItems.length > 0) setCurrentPage(viewableItems[0].item);
    }
  ).current;

  // ── بيانات الصفحة الحالية ──
  const surah = getSurahByPage(currentPage);
  const juz = getJuzByPage(currentPage);
  const hizb = getHizbByPage(currentPage);
  const rub = getRubByPage(currentPage);
  const manzil = getManzilByPage(currentPage);
  const rubInHizb = ((rub.rub - 1) % 4) + 1;
  const currentBookmark = getBookmarkForPage(currentPage);

  const handleBookmark = useCallback((type: BookmarkType) => {
    addBookmark(currentPage, type, surah?.name);
    setShowBookmarkSheet(false);
    showToast(`تم إضافة علامة ${getBookmarkLabel(type)}`);
  }, [currentPage, surah, addBookmark, showToast]);

  const handleRemoveBookmark = useCallback(() => {
    removeBookmark(currentPage);
    setShowBookmarkSheet(false);
    showToast('تم إزالة العلامة');
  }, [currentPage, removeBookmark, showToast]);

  // ── التمرير التلقائي (الوضع الأفقي) ──
  const [autoScroll, setAutoScroll] = useState(false);
  const [speedIndex, setSpeedIndex] = useState(2);
  const scrollYRef = useRef(0);

  useEffect(() => {
    if (!isLandscape) setAutoScroll(false);
  }, [isLandscape]);

  useEffect(() => {
    if (!autoScroll) return;
    const speed = SPEED_OPTIONS[speedIndex].value;
    const maxOffset = Math.max(0, TOTAL_PAGES * landscapeH - height);
    let frame = 0;
    let last = 0;
    const tick = (ts: number) => {
      // نحسب المسافة حسب الزمن الفعلي حتى تبقى السرعة ثابتة على الشاشات 90/120 هرتز
      const dt = last ? Math.min(ts - last, 50) : 16.7;
      last = ts;
      scrollYRef.current = Math.min(scrollYRef.current + speed * (dt / 16.7), maxOffset);
      listRef.current?.scrollToOffset({ offset: scrollYRef.current, animated: false });
      if (scrollYRef.current >= maxOffset) {
        setAutoScroll(false);
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [autoScroll, speedIndex, landscapeH, height]);

  // ── عناصر القوائم ──
  const renderPortraitPage = useCallback(({ item }: { item: number }) => (
    <MushafPage
      page={item}
      slotWidth={width}
      slotHeight={height}
      imageWidth={portraitW}
      imageHeight={portraitH}
      top={insets.top}
      pageMode={pageMode}
      onPress={toggleUI}
    />
  ), [width, height, portraitW, portraitH, insets.top, pageMode, toggleUI]);

  const renderLandscapePage = useCallback(({ item }: { item: number }) => (
    <MushafPage
      page={item}
      slotWidth={width}
      slotHeight={landscapeH}
      imageWidth={landscapeW}
      imageHeight={landscapeH}
      pageMode={pageMode}
      onPress={toggleUI}
    />
  ), [width, landscapeW, landscapeH, pageMode, toggleUI]);

  const portraitLayout = useCallback((_: unknown, index: number) => ({
    length: width, offset: width * index, index,
  }), [width]);

  const landscapeLayout = useCallback((_: unknown, index: number) => ({
    length: landscapeH, offset: landscapeH * index, index,
  }), [landscapeH]);

  // الوضع الداكن للتطبيق أو النمط الليلي ← شريطا النظام أسودان بأيقونات بيضاء
  const barsDark = mode === 'dark' || pageStyle.useNightImages;
  const barsBg = barsDark ? '#000' : pageStyle.screenBg;
  const initialIndex = Math.min(Math.max(currentPage - 1, 0), TOTAL_PAGES - 1);

  // انتظار تحميل آخر صفحة محفوظة حتى تفتح القائمة على الصفحة الصحيحة مباشرة
  if (!isLoaded) {
    return <View style={[styles.container, { backgroundColor: colors.background }]} />;
  }

  // ════════ الوضع الأفقي ════════
  if (isLandscape) {
    return (
      <View style={[styles.container, { backgroundColor: pageStyle.screenBg }]}>
        <SystemBars light={pageStyle.useNightImages} hidden />
        <FlatList
          ref={listRef}
          data={PAGES}
          keyExtractor={keyExtractor}
          renderItem={renderLandscapePage}
          getItemLayout={landscapeLayout}
          initialScrollIndex={initialIndex}
          initialNumToRender={3}
          maxToRenderPerBatch={2}
          windowSize={5}
          removeClippedSubviews
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={VIEWABILITY_CONFIG}
          onScrollToIndexFailed={info => {
            listRef.current?.scrollToOffset({ offset: info.index * landscapeH, animated: false });
          }}
          onScroll={e => { scrollYRef.current = e.nativeEvent.contentOffset.y; }}
          scrollEventThrottle={16}
          onScrollBeginDrag={() => setAutoScroll(false)}
          showsVerticalScrollIndicator={false}
        />

        {showUI && (
          <View style={[styles.landscapeControls, {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            paddingBottom: insets.bottom + 8,
            paddingRight: insets.right + 12,
            paddingLeft: insets.left + 12,
          }]}>
            <View style={styles.speedRow}>
              <Text style={[styles.speedLabel, { color: colors.textSecondary }]}>سرعة التمرير:</Text>
              <View style={styles.speedChips}>
                {SPEED_OPTIONS.map((opt, idx) => (
                  <TouchableOpacity
                    key={opt.label}
                    style={[styles.speedChip, {
                      backgroundColor: speedIndex === idx ? colors.gold : colors.surfaceLight,
                      borderColor: speedIndex === idx ? colors.gold : colors.border,
                    }]}
                    onPress={() => setSpeedIndex(idx)}
                  >
                    <Text style={[styles.speedChipText, { color: speedIndex === idx ? '#fff' : colors.text }]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.autoScrollBtn, { backgroundColor: autoScroll ? colors.error : colors.gold }]}
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

  // ════════ الوضع العمودي ════════
  return (
    <View style={[styles.container, { backgroundColor: pageStyle.screenBg }]}>
      <SystemBars light={barsDark} />
      {/* شريطا النظام (أعلى/أسفل) بلون داكن ثابت في الوضع الداكن حتى لو الصفحة ورقية */}
      <View pointerEvents="none" style={[styles.systemStrip, { top: 0, height: insets.top, backgroundColor: barsBg }]} />
      <View pointerEvents="none" style={[styles.systemStrip, { bottom: 0, height: insets.bottom, backgroundColor: barsBg }]} />

      <View
        pointerEvents={showUI ? 'auto' : 'none'}
        style={[styles.header, {
          opacity: showUI ? 1 : 0,
          paddingTop: insets.top + 8,
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
        }]}
      >
        <TouchableOpacity style={styles.headerButton} onPress={() => setShowMenu(true)}>
          <MoreVertical size={24} color={colors.text} />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/surah-index' as any)}>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: colors.gold }]}>
              {surah?.name || 'القرآن الكريم'}
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.text }]}>
              صفحة {currentPage} • الجزء {juz}
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.text }]}>
              حزب {hizb.globalHizb} • الربع {rubInHizb} • المنزل {manzil}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.headerButton} onPress={() => setShowBookmarkSheet(true)}>
          <Bookmark
            size={24}
            color={currentBookmark ? getBookmarkColor(currentBookmark.type) : colors.text}
            fill={currentBookmark ? getBookmarkColor(currentBookmark.type) : 'transparent'}
          />
        </TouchableOpacity>
      </View>

      <FlatList
        ref={listRef}
        data={PAGES}
        horizontal
        pagingEnabled
        inverted
        showsHorizontalScrollIndicator={false}
        keyExtractor={keyExtractor}
        renderItem={renderPortraitPage}
        getItemLayout={portraitLayout}
        initialScrollIndex={initialIndex}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={VIEWABILITY_CONFIG}
        initialNumToRender={3}
        maxToRenderPerBatch={2}
        windowSize={5}
        removeClippedSubviews
        onScrollToIndexFailed={info => {
          listRef.current?.scrollToOffset({ offset: info.index * width, animated: false });
        }}
      />

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
          onPress={() => router.push({ pathname: '/tafsir' as any, params: { page: String(currentPage) } })}
        >
          <BookOpen size={20} color={colors.gold} />
          <Text style={[styles.bottomButtonText, { color: colors.text }]}>التفسير</Text>
        </TouchableOpacity>
      </View>

      {toast && (
        <View style={[styles.notification, { backgroundColor: colors.success }]}>
          <Text style={styles.notificationText}>{toast}</Text>
        </View>
      )}

      <MushafMenu visible={showMenu} onClose={() => setShowMenu(false)} top={insets.top + 50} />

      <BookmarkSheet
        visible={showBookmarkSheet}
        onClose={() => setShowBookmarkSheet(false)}
        onSelect={handleBookmark}
        onRemove={handleRemoveBookmark}
        hasBookmark={!!currentBookmark}
        bottomInset={insets.bottom}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  systemStrip: { position: 'absolute', left: 0, right: 0, zIndex: 5 },
  header: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 4, borderBottomWidth: 1,
  },
  headerButton: { padding: 8 },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  headerSubtitle: { fontSize: 14, marginTop: 2 },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center',
    gap: 16, paddingTop: 8, borderTopWidth: 1,
  },
  bottomButton: {
    flexDirection: 'row', alignItems: 'center',
    gap: 8, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20,
  },
  bottomButtonText: { fontSize: 14, fontWeight: '600' },
  notification: {
    position: 'absolute', top: 120, left: 20, right: 20,
    padding: 16, borderRadius: 12, alignItems: 'center',
  },
  notificationText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  // الوضع الأفقي
  landscapeControls: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 12, borderTopWidth: 1, gap: 10,
  },
  speedRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', flexWrap: 'wrap', gap: 6,
  },
  speedLabel: { fontSize: 13, fontWeight: '600' },
  speedChips: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  speedChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, borderWidth: 1 },
  speedChipText: { fontSize: 12, fontWeight: '600' },
  autoScrollBtn: { padding: 13, borderRadius: 16, alignItems: 'center' },
  autoScrollBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
