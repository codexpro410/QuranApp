import MiniAudioPlayer from '@/components/MiniAudioPlayer';
import { useAudio } from '@/contexts/AudioContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useBookmarks } from '@/contexts/BookmarkContext';
import { normalizeArabic, quranData, Surah } from '@/data/quranData';
import { Sheikh } from '@/data/sheikhData';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { BookOpen, Check, Download, Pause, Play, Search, User, Wifi, WifiOff, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const formatSurahNumber = (n: number) => n.toString().padStart(3, '0');

const UNRELIABLE_SERVERS = ['server3.', 'server4.', 'server5.'];

function isServerLikelyWorking(serverUrl: string): boolean {
  return !UNRELIABLE_SERVERS.some(s => serverUrl.includes(s));
}

// Fixed item height for getItemLayout — avoids dynamic measurement
const ITEM_HEIGHT = 62;

// فهرس بحث جاهز (يُبنى مرة واحدة): اسم عربي بدون تشكيل + اسم لاتيني بدون رموز
const searchIndex = quranData.map(s => ({
  surah: s,
  name: normalizeArabic(s.name),
  latin: s.englishName.toLowerCase().replace(/[^a-z]/g, ''),
}));

export default function SurahIndexScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { jumpToPage } = useBookmarks();
  const flatListRef = useRef<FlatList>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeSheikh, setActiveSheikh] = useState<Sheikh | null>(null);

  const {
    currentSurah,
    isPlaying,
    isLoading: isAudioLoading,
    isDownloading,
    downloadProgress,
    currentSheikhId,
    isFileDownloaded,
    downloadAudio,
    deleteDownload,
    playOnline,
    playOffline,
    pauseAudio,
    resumeAudio,
    stopAudio,
    registerOnNext,
  } = useAudio();

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem('ACTIVE_SHEIKH').then(v => {
        if (v) setActiveSheikh(JSON.parse(v));
      });
    }, [])
  );

  const filteredSurahs = useMemo(() => {
    const q = normalizeArabic(searchQuery);
    if (!q) return quranData;
    const latin = q.replace(/[^a-z]/g, '');
    return searchIndex
      .filter(({ surah, name, latin: en }) =>
        name.includes(q) ||
        (latin.length > 0 && en.includes(latin)) ||
        String(surah.number) === q
      )
      .map(({ surah }) => surah);
  }, [searchQuery]);

  const currentIndex = useMemo(() => {
    if (!currentSurah) return -1;
    return filteredSurahs.findIndex(s => s.number === currentSurah);
  }, [currentSurah, filteredSurahs]);

  // Stable set of supported surah numbers for fast lookup
  const supportedSurahSet = useMemo(() => {
    if (!activeSheikh) return new Set<number>();
    return new Set(activeSheikh.suras.split(',').map(s => parseInt(s.trim(), 10)));
  }, [activeSheikh]);

  const serverWorking = useMemo(() =>
    activeSheikh ? isServerLikelyWorking(activeSheikh.Server) : true,
    [activeSheikh]
  );

  const buildSurahUrl = useCallback((surahNumber: number): string | null => {
    if (!activeSheikh) return null;
    const server = activeSheikh.Server.endsWith('/') ? activeSheikh.Server : `${activeSheikh.Server}/`;
    return `${server}${formatSurahNumber(surahNumber)}.mp3`;
  }, [activeSheikh]);

  const handlePlay = useCallback(async (surah: Surah) => {
    if (!activeSheikh) return;
    const isThisSurahActive = currentSurah === surah.number && currentSheikhId === activeSheikh.id;

    if (isThisSurahActive && isPlaying) { await pauseAudio(); return; }
    if (isThisSurahActive && !isPlaying) { await resumeAudio(); return; }

    const downloaded = isFileDownloaded(activeSheikh.id, surah.number);
    if (downloaded) { await playOffline(activeSheikh.id, surah.number); return; }

    if (!serverWorking) {
      Alert.alert('تحذير', 'قد يكون هذا الخادم غير متاح حالياً. هل تريد المحاولة؟', [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'حاول', onPress: async () => {
          const url = buildSurahUrl(surah.number);
          if (url) await playOnline(url, surah.number, activeSheikh.id);
        }},
      ]);
      return;
    }

    const url = buildSurahUrl(surah.number);
    if (url) await playOnline(url, surah.number, activeSheikh.id);
  }, [activeSheikh, currentSurah, currentSheikhId, isPlaying, isFileDownloaded,
      pauseAudio, resumeAudio, playOffline, playOnline, buildSurahUrl, serverWorking]);

  const handleDownload = useCallback(async (surah: Surah) => {
    if (!activeSheikh) return;
    const url = buildSurahUrl(surah.number);
    if (!url) return;
    await downloadAudio(url, activeSheikh.id, surah.number);
  }, [activeSheikh, buildSurahUrl, downloadAudio]);

  const handleDeleteDownload = useCallback((surah: Surah) => {
    if (!activeSheikh) return;
    Alert.alert('حذف الملف', `هل تريد حذف تسجيل سورة ${surah.name}؟`, [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'حذف', style: 'destructive', onPress: async () => {
        if (currentSurah === surah.number && currentSheikhId === activeSheikh.id) await stopAudio();
        await deleteDownload(activeSheikh.id, surah.number);
      }},
    ]);
  }, [activeSheikh, currentSurah, currentSheikhId, stopAudio, deleteDownload]);

  const handleNext = useCallback(async () => {
    if (!activeSheikh || currentIndex < 0) return;
    for (let i = currentIndex + 1; i < filteredSurahs.length; i++) {
      if (supportedSurahSet.has(filteredSurahs[i].number)) {
        await handlePlay(filteredSurahs[i]);
        return;
      }
    }
  }, [activeSheikh, currentIndex, filteredSurahs, supportedSurahSet, handlePlay]);

  useEffect(() => {
    registerOnNext(handleNext);
  }, [handleNext, registerOnNext]);

  const handlePrev = useCallback(async () => {
    if (!activeSheikh || currentIndex <= 0) return;
    for (let i = currentIndex - 1; i >= 0; i--) {
      if (supportedSurahSet.has(filteredSurahs[i].number)) {
        await handlePlay(filteredSurahs[i]);
        return;
      }
    }
  }, [activeSheikh, currentIndex, filteredSurahs, supportedSurahSet, handlePlay]);

  // الضغط على السورة: نطلب الانتقال لصفحتها ثم نغلق الفهرس فتظهر الشاشة الرئيسية على الصفحة المطلوبة
  const handleSurahPress = useCallback((surah: Surah) => {
    jumpToPage(surah.page);
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }, [jumpToPage, router]);

  // Stable extraData to prevent re-renders on every frame
  const extraData = useMemo(() => ({
    isDownloading, currentSurah, isPlaying, isAudioLoading,
    activeSheikh: activeSheikh?.id, downloadProgress,
  }), [isDownloading, currentSurah, isPlaying, isAudioLoading, activeSheikh, downloadProgress]);

  const getItemLayout = useCallback((_: any, index: number) => ({
    length: ITEM_HEIGHT + 8, // item height + marginBottom
    offset: (ITEM_HEIGHT + 8) * index,
    index,
  }), []);

  const renderSurah = useCallback(({ item }: { item: Surah }) => {
    const supported = supportedSurahSet.has(item.number);
    const downloaded = activeSheikh ? isFileDownloaded(activeSheikh.id, item.number) : false;
    const downloadKey = activeSheikh ? `${activeSheikh.id}_${item.number}` : '';
    const downloading = !!isDownloading[downloadKey];
    const dlProgress = downloadProgress[downloadKey] ?? 0;
    const isActive = currentSurah === item.number && currentSheikhId === activeSheikh?.id;
    const isThisPlaying = isActive && isPlaying;
    const isThisLoading = isActive && isAudioLoading;

    return (
      <TouchableOpacity
        style={[styles.surahItem, { backgroundColor: colors.surface },
          isActive && { borderWidth: 1, borderColor: colors.gold + '60' }
        ]}
        onPress={() => handleSurahPress(item)}
        activeOpacity={0.8}
      >
        <View style={styles.audioBox}>
          {supported && activeSheikh ? (
            <View style={styles.audioButtons}>
              <TouchableOpacity
                style={[styles.audioBtn, {
                  borderColor: isActive ? colors.gold : colors.border,
                  backgroundColor: isActive ? colors.gold + '15' : colors.surfaceLight,
                }]}
                onPress={() => handlePlay(item)}
                disabled={isThisLoading}
              >
                {isThisLoading ? (
                  <ActivityIndicator size="small" color={colors.gold} />
                ) : isThisPlaying ? (
                  <Pause size={15} color={colors.gold} fill={colors.gold} />
                ) : (
                  <Play size={15} color={isActive ? colors.gold : colors.success} />
                )}
              </TouchableOpacity>

              {downloading ? (
                <View style={[styles.audioBtn, { borderColor: colors.border, backgroundColor: colors.surfaceLight }]}>
                  <Text style={[styles.progressText, { color: colors.gold }]}>{dlProgress}%</Text>
                </View>
              ) : downloaded ? (
                <TouchableOpacity
                  style={[styles.audioBtn, { borderColor: colors.success + '60', backgroundColor: colors.success + '15' }]}
                  onLongPress={() => handleDeleteDownload(item)}
                  delayLongPress={500}
                >
                  <Check size={15} color={colors.success} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.audioBtn, { borderColor: colors.border, backgroundColor: colors.surfaceLight }]}
                  onPress={() => handleDownload(item)}
                >
                  <Download size={15} color={colors.gold} />
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.audioPlaceholder} />
          )}
        </View>

        <View style={styles.surahDetails}>
          <Text style={[styles.surahName, { color: isActive ? colors.gold : colors.text }]}>
            {item.name}
          </Text>
          {supported && activeSheikh && (
            <View style={styles.sheikhRow}>
              {downloaded
                ? <Text style={[styles.badge, { color: colors.success }]}>● محمّل</Text>
                : !serverWorking
                  ? <Text style={[styles.badge, { color: colors.error }]}>● خادم غير مستقر</Text>
                  : <Text style={[styles.badge, { color: colors.textSecondary }]}>{activeSheikh.rewaya}</Text>
              }
            </View>
          )}
        </View>

        <View style={styles.surahMeta}>
          <View style={styles.metaInfo}>
            <Text style={[styles.versesText, { color: colors.textSecondary }]}>{item.verses} آية</Text>
            <Text style={[styles.pageText, { color: colors.gold }]}>ص {item.page}</Text>
          </View>
          <View style={[styles.numberBadge, { backgroundColor: colors.surfaceLight }]}>
            <Text style={[styles.numberText, { color: colors.textSecondary }]}>{item.number}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [
    supportedSurahSet, isFileDownloaded, isDownloading, downloadProgress,
    currentSurah, currentSheikhId, isPlaying, isAudioLoading, activeSheikh,
    handleSurahPress, handlePlay, handleDownload, handleDeleteDownload,
    colors, serverWorking
  ]);

  const playerHeight = currentSurah ? 90 : 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={[styles.iconCircle, { backgroundColor: colors.surface }]} onPress={() => router.back()}>
          <X size={20} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <BookOpen size={18} color={colors.gold} />
          <Text style={[styles.headerText, { color: colors.text }]}>فهرس السور</Text>
        </View>

        <TouchableOpacity
          style={[styles.iconCircle, { backgroundColor: colors.surface }]}
          onPress={() => router.push('/sheikh-select')}
        >
          <User size={18} color={activeSheikh ? colors.gold : colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.searchBar, { backgroundColor: colors.surface }]}>
        <Search size={17} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="ابحث عن سورة..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <X size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {activeSheikh ? (
        <TouchableOpacity
          style={[styles.sheikhBanner, { backgroundColor: colors.surfaceLight }]}
          onPress={() => router.push('/sheikh-select')}
        >
          <View style={styles.sheikhBannerLeft}>
            {serverWorking
              ? <Wifi size={13} color={colors.success} />
              : <WifiOff size={13} color={colors.error} />
            }
            <Text style={[styles.sheikhBannerText, { color: colors.textSecondary }]}>
              {activeSheikh.name} • {activeSheikh.rewaya}
            </Text>
          </View>
          <Text style={[styles.changeTxt, { color: colors.gold }]}>تغيير</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.noSheikhBanner, { backgroundColor: colors.gold + '15', borderColor: colors.gold + '40' }]}
          onPress={() => router.push('/sheikh-select')}
        >
          <User size={16} color={colors.gold} />
          <Text style={[styles.noSheikhText, { color: colors.gold }]}>
            اختر قارئاً لتفعيل التشغيل والتحميل
          </Text>
        </TouchableOpacity>
      )}

      <FlatList
        ref={flatListRef}
        data={filteredSurahs}
        keyExtractor={(item) => item.number.toString()}
        renderItem={renderSurah}
        contentContainerStyle={[styles.listContent, { paddingBottom: playerHeight + 24 }]}
        showsVerticalScrollIndicator={false}
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        windowSize={8}
        getItemLayout={getItemLayout}
        extraData={extraData}
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              لم يتم العثور على نتائج لـ "{searchQuery}"
            </Text>
          </View>
        }
      />

      <MiniAudioPlayer
        onNext={handleNext}
        onPrev={handlePrev}
        hasNext={currentIndex >= 0 && currentIndex < filteredSurahs.length - 1}
        hasPrev={currentIndex > 0}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1,
  },
  iconCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerText: { fontSize: 17, fontWeight: '700' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginTop: 12, marginBottom: 6,
    paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12, gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15, textAlign: 'right' },
  sheikhBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: 16, marginBottom: 8, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10,
  },
  sheikhBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sheikhBannerText: { fontSize: 12 },
  changeTxt: { fontSize: 12, fontWeight: '600' },
  noSheikhBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 16, marginBottom: 8, paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 10, borderWidth: 1,
  },
  noSheikhText: { fontSize: 13, fontWeight: '600' },
  listContent: { paddingHorizontal: 16 },
  surahItem: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 12,
    paddingVertical: 10, paddingHorizontal: 10, marginBottom: 8, gap: 6,
    height: ITEM_HEIGHT,
  },
  audioBox: { width: 82, alignItems: 'center', justifyContent: 'center' },
  audioButtons: { flexDirection: 'row', gap: 5 },
  audioBtn: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  progressText: { fontSize: 9, fontWeight: '700' },
  audioPlaceholder: { width: 34, height: 34 },
  surahDetails: { flex: 1, alignItems: 'flex-end', gap: 3 },
  surahName: { fontSize: 17, fontWeight: '700' },
  sheikhRow: { flexDirection: 'row', alignItems: 'center' },
  badge: { fontSize: 10, fontWeight: '600' },
  surahMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaInfo: { alignItems: 'flex-end', gap: 2 },
  numberBadge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  numberText: { fontSize: 11, fontWeight: '700' },
  versesText: { fontSize: 11 },
  pageText: { fontSize: 11, fontWeight: '600' },
  emptyBox: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 14, textAlign: 'center' },
});