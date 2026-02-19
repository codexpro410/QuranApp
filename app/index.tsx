import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Modal,
  Pressable,
  // Image,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { 
  MoreVertical, 
  List, 
  Bookmark, 
  BookOpen,
  Settings,
  Moon,
  Sun,
  X,
  Play,
  Pause,
  Square,
  Volume2,
  Book,
  MoreHorizontal,
  Save
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/contexts/ThemeContext';
import { useBookmarks, BookmarkType, getBookmarkColor, getBookmarkLabel } from '@/contexts/BookmarkContext';
import { useAudio } from '@/contexts/AudioContext';
import { getSurahByPage, TOTAL_PAGES, quranData, getJuzByPage, getHizbByPage, getRubByPage, getManzilByPage } from '@/data/quranData';
import { mushafPages } from "@/data/mushafAssets";

const { width } = Dimensions.get('window');

export default function QuranScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mode, colors, toggleTheme } = useTheme();
  const { currentPage, setCurrentPage, addBookmark, getBookmarkForPage, removeBookmark } = useBookmarks();
  const { goToPage } = useLocalSearchParams<{ goToPage?: string }>();
  
  const [showMenu, setShowMenu] = useState(false);
  const [showBookmarkModal, setShowBookmarkModal] = useState(false);
  const [bookmarkNotification, setBookmarkNotification] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  
  const {
    currentSurah: playingSurahNumber,
    isPlaying,
    progress,
    duration,
    pauseAudio,
    resumeAudio,
    seekTo,
    stopAudio,
  } = useAudio();

  const formatTime = useCallback((ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  const playingSurahData = playingSurahNumber ? quranData.find(s => s.number === playingSurahNumber) : null;

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

  // const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
  //   if (viewableItems.length > 0) {
  //     const page = viewableItems[0].item;
  //     setCurrentPage(page);
  //   }
  // }, [setCurrentPage]);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
  if (viewableItems.length > 0) {
    const page = viewableItems[0].item;
    setCurrentPage(page);
  }
}).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const currentSurah = getSurahByPage(currentPage);
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

  const juz = getJuzByPage(currentPage);
  const hizb = getHizbByPage(currentPage);
  const rub = getRubByPage(currentPage);
  const manzil = getManzilByPage(currentPage);
  const renderPage = useCallback(({ item }: { item: number }) => {
     const pageImage = mushafPages.find(p => p.page === item)?.image;
  if (!pageImage) return null; // fallback
    return (
      <View style={styles.pageContainer}>
        {/* <Image
          source={mushafPages.find(p => p.page === item)?.image}
          style={styles.mushafImage}
          resizeMode="contain"
        /> */}
        <Image
          source={pageImage}
          // resizeMode="contain"
          // loadingIndicatorSource={require('@/assets/loading.png')} // صورة placeholder
          style={styles.mushafImage}
          contentFit="contain"
          cachePolicy="memory-disk"
        />
      </View>
    );
  }, []);

  const getItemLayout = useCallback((_: any, index: number) => ({
    length: width,
    offset: width * index,
    index,
  }), []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={styles.headerButton} 
          onPress={() => setShowMenu(true)}
        >
          <MoreVertical size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.gold }]}>{currentSurah?.name || 'القرآن الكريم'}</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>صفحة {currentPage} • الجزء {juz}</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
           حزب {hizb.globalHizb} • ربع {rub.globalRub} • تحزيب القرآن {manzil}
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => setShowBookmarkModal(true)}
        >
          <Bookmark 
            size={24} 
            color={currentBookmark ? getBookmarkColor(currentBookmark.type) : colors.text}
            fill={currentBookmark ? getBookmarkColor(currentBookmark.type) : 'transparent'}
          />
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={pages}
        horizontal
        pagingEnabled
        inverted
        contentContainerStyle={{
        paddingBottom: insets.bottom + 80, // مساحة للـ bottom bar فقط
      }}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.toString()}
        renderItem={renderPage}
        getItemLayout={getItemLayout}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={7}
        removeClippedSubviews={true}
        onScrollToIndexFailed={(info) => {
    // fallback في حال scrollToIndex فشل
          flatListRef.current?.scrollToOffset({
            offset: info.index * width,
            animated: false,
          });
        }}
        // onScrollToIndexFailed={(info) => {
        //   setTimeout(() => {
        //     flatListRef.current?.scrollToIndex({ index: info.index, animated: false });
        //   }, 100);
        // }}
      />

      {playingSurahNumber && (
        <View style={[styles.audioPlayerBar, { backgroundColor: colors.surface, borderTopColor: colors.border, bottom: insets.bottom + 70 }]}>
          <View style={styles.audioPlayerContent}>
            <View style={styles.audioPlayerLeft}>
              <Volume2 size={18} color={colors.gold} />
              <View style={styles.audioPlayerInfo}>
                <Text style={[styles.audioPlayerTitle, { color: colors.text }]} numberOfLines={1}>
                  {playingSurahData?.name || `سورة ${playingSurahNumber}`}
                </Text>
                <Text style={[styles.audioPlayerTime, { color: colors.textSecondary }]}>
                  {formatTime(progress)} / {formatTime(duration)}
                </Text>
              </View>
            </View>
            
            <View style={styles.audioPlayerControls}>
              <TouchableOpacity
                style={[styles.audioControlBtn, { backgroundColor: colors.surfaceLight }]}
                onPress={() => isPlaying ? pauseAudio() : resumeAudio()}
              >
                {isPlaying ? (
                  <Pause size={20} color={colors.gold} />
                ) : (
                  <Play size={20} color={colors.gold} />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.audioControlBtn, { backgroundColor: colors.surfaceLight }]}
                onPress={stopAudio}
              >
                <Square size={16} color={colors.error} />
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.seekBarContainer}>
            <TouchableOpacity
              style={styles.seekBarTouchable}
              activeOpacity={1}
              onPress={(e) => {
                const { locationX } = e.nativeEvent;
                const barWidth = width - 32;
                const percentage = Math.max(0, Math.min(1, locationX / barWidth));
                const newPosition = percentage * duration;
                seekTo(newPosition);
              }}
            >
              <View style={[styles.seekBarBg, { backgroundColor: colors.surfaceLight }]}>
                <View 
                  style={[
                    styles.seekBarFill, 
                    { 
                      backgroundColor: colors.gold,
                      width: duration > 0 ? `${(progress / duration) * 100}%` : '0%'
                    }
                  ]} 
                />
                <View 
                  style={[
                    styles.seekBarThumb, 
                    { 
                      backgroundColor: colors.gold,
                      left: duration > 0 ? `${(progress / duration) * 100}%` : '0%'
                    }
                  ]} 
                />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12, backgroundColor: colors.surface, borderTopColor: colors.border }]}>
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

      {bookmarkNotification && (
        <View style={[styles.notification, { backgroundColor: colors.success }]}>
          <Text style={styles.notificationText}>{bookmarkNotification}</Text>
        </View>
      )}

      <Modal visible={showMenu} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowMenu(false)}>
          <View style={[styles.menuContainer, { backgroundColor: colors.surface, top: insets.top + 50 }]}>
            <TouchableOpacity 
              style={[styles.menuItem, { borderBottomColor: colors.border }]}
              onPress={() => { setShowMenu(false); router.push('/azkar' as any); }}
            >
              <Moon size={20} color={colors.text} />
              <Text style={[styles.menuText, { color: colors.text }]}>الأذكار</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.menuItem, { borderBottomColor: colors.border }]}
              onPress={() => { setShowMenu(false); router.push('/page-jump' as any); }}
            >
              <Book size={20} color={colors.text} />
              <Text style={[styles.menuText, { color: colors.text }]}>الانتقال إلي صفحة</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.menuItem, { borderBottomColor: colors.border }]}
              onPress={() => { setShowMenu(false); router.push('/more' as any); }}
            >
              <MoreHorizontal size={20} color={colors.text} />
              <Text style={[styles.menuText, { color: colors.text }]}>المزيد</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.menuItem, { borderBottomColor: colors.border }]}
              onPress={() => { setShowMenu(false); router.push('/settings' as any); }}
            >
              <Settings size={20} color={colors.text} />
              <Text style={[styles.menuText, { color: colors.text }]}>الإعدادات</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.menuItem, { borderBottomColor: colors.border }]}
              onPress={() => { setShowMenu(false); router.push('/hifz' as any); }}
            >
              
              <Save size={20} color={colors.text} />
              <Text style={[styles.menuText, { color: colors.text }]}>برنامج تحفيظ</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.menuItem, { borderBottomColor: colors.border }]}
              onPress={() => { setShowMenu(false); toggleTheme(); }}
            >
              {mode === 'dark' ? <Sun size={20} color={colors.text} /> : <Moon size={20} color={colors.text} />}
              <Text style={[styles.menuText, { color: colors.text }]}>
                {mode === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => { setShowMenu(false); router.push('/bookmarks' as any); }}
            >
              <Bookmark size={20} color={colors.text} />
              <Text style={[styles.menuText, { color: colors.text }]}>العلامات المرجعية</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

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
                style={[styles.bookmarkOption, { backgroundColor: 'rgba(76, 175, 80, 0.15)', borderColor: '#4CAF50' }]}
                onPress={() => handleBookmark('read')}
              >
                <Bookmark size={28} color="#4CAF50" fill="#4CAF50" />
                <Text style={[styles.bookmarkOptionText, { color: '#4CAF50' }]}>قراءة</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.bookmarkOption, { backgroundColor: 'rgba(255, 152, 0, 0.15)', borderColor: '#FF9800' }]}
                onPress={() => handleBookmark('review')}
              >
                <Bookmark size={28} color="#FF9800" fill="#FF9800" />
                <Text style={[styles.bookmarkOptionText, { color: '#FF9800' }]}>مراجعة</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.bookmarkOption, { backgroundColor: 'rgba(33, 150, 243, 0.15)', borderColor: '#2196F3' }]}
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
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 4,
    borderBottomWidth: 1,
  },
  headerButton: {
    padding: 8,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  pageContainer: {
    width,
    height: '100%',
    backgroundColor: '#000',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  mushafImage: {
    width: '100%',
    height: '100%',
    marginTop: 0,     // تأكيد
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderTopWidth: 1,
  },
  bottomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  bottomButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  notification: {
    position: 'absolute',
    top: 120,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  notificationText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  menuContainer: {
    position: 'absolute',
    left: 16,
    borderRadius: 12,
    overflow: 'hidden',
    minWidth: 200,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
  },
  menuText: {
    fontSize: 16,
  },
  bookmarkModal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  bookmarkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  bookmarkTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  bookmarkOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
  },
  bookmarkOption: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    minWidth: 90,
  },
  bookmarkOptionText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  removeBookmarkButton: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  removeBookmarkText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  audioPlayerBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  audioPlayerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  audioPlayerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  audioPlayerInfo: {
    flex: 1,
  },
  audioPlayerTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  audioPlayerTime: {
    fontSize: 11,
    marginTop: 2,
  },
  audioPlayerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  audioControlBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seekBarContainer: {
    width: '100%',
  },
  seekBarTouchable: {
    paddingVertical: 8,
  },
  seekBarBg: {
    height: 4,
    borderRadius: 2,
    position: 'relative',
  },
  seekBarFill: {
    height: '100%',
    borderRadius: 2,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  seekBarThumb: {
    width: 14,
    height: 14,
    borderRadius: 7,
    position: 'absolute',
    top: -5,
    marginLeft: -7,
  },
});
