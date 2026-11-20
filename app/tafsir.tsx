import { useLocalSearchParams, useRouter } from 'expo-router';
import SystemBars from '@/components/SystemBars';
import { ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useBookmarks } from '@/contexts/BookmarkContext';
import { useTheme } from '@/contexts/ThemeContext';
import tafsirByPage from '@/data/tafsir_by_page.json';
import { TOTAL_PAGES, getJuzByPage, getSurahByPage } from '@/data/quranData';

export interface TafsirAyah {
  surah: number;
  ayah: number;
  ayah_key: string;
  text: string;
  tafsir: string;
}

type TafsirByPage = Record<string, TafsirAyah[]>;
const data = tafsirByPage as unknown as TafsirByPage;

export default function TafsirScreen() {
  const router = useRouter();
  const { colors, mode } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ page?: string }>();
  const { currentPage } = useBookmarks();
  const listRef = useRef<FlatList<TafsirAyah>>(null);

  const initialPage = Number(params.page) || currentPage;
  const [pageNum, setPageNum] = useState(Math.min(Math.max(initialPage, 1), TOTAL_PAGES));

  const ayat = useMemo(() => data[String(pageNum)] ?? [], [pageNum]);
  const surah = getSurahByPage(pageNum);

  const goTo = useCallback((p: number) => {
    setPageNum(Math.min(Math.max(p, 1), TOTAL_PAGES));
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, []);

  const close = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }, [router]);

  return (
    <>
      <SystemBars light={mode === 'dark'} />
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 8 }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.surface }]} onPress={close}>
            <X size={20} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.title, { color: colors.gold }]}>تفسير {surah.name}</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              صفحة {pageNum} • الجزء {getJuzByPage(pageNum)}
            </Text>
          </View>
          <View style={styles.iconBtn} />
        </View>

        <FlatList
          ref={listRef}
          data={ayat}
          keyExtractor={item => item.ayah_key}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: colors.textSecondary }]}>لا يوجد تفسير لهذه الصفحة</Text>
          }
          renderItem={({ item }) => (
            <View style={[styles.ayahBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.ayahNum, { color: colors.gold }]}>
                {surah.number === item.surah ? surah.name : `سورة ${item.surah}`} • الآية {item.ayah}
              </Text>
              <Text style={[styles.ayahText, { color: colors.text }]}>{item.text}</Text>
              <Text style={[styles.tafsirText, { color: mode === 'dark' ? '#E6D9A3' : '#2B2B2B' }]}>
                {item.tafsir}
              </Text>
            </View>
          )}
        />

        <View style={[styles.footer, { borderTopColor: colors.border, paddingBottom: insets.bottom + 10 }]}>
          <TouchableOpacity
            style={[styles.navBtn, { backgroundColor: colors.surfaceLight, opacity: pageNum >= TOTAL_PAGES ? 0.4 : 1 }]}
            disabled={pageNum >= TOTAL_PAGES}
            onPress={() => goTo(pageNum + 1)}
          >
            <ChevronLeft size={20} color={colors.gold} />
            <Text style={[styles.navText, { color: colors.text }]}>الصفحة التالية</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.navBtn, { backgroundColor: colors.surfaceLight, opacity: pageNum <= 1 ? 0.4 : 1 }]}
            disabled={pageNum <= 1}
            onPress={() => goTo(pageNum - 1)}
          >
            <Text style={[styles.navText, { color: colors.text }]}>الصفحة السابقة</Text>
            <ChevronRight size={20} color={colors.gold} />
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 10, borderBottomWidth: 1,
  },
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '700' },
  subtitle: { fontSize: 12, marginTop: 2 },
  list: { padding: 16, gap: 12 },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 15 },
  ayahBox: { padding: 14, borderRadius: 14, borderWidth: 1 },
  ayahNum: { fontSize: 13, marginBottom: 8, textAlign: 'right', fontWeight: '600' },
  ayahText: { fontSize: 22, textAlign: 'right', marginBottom: 10, lineHeight: 38 },
  tafsirText: { fontSize: 15, textAlign: 'right', lineHeight: 27 },
  footer: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 10, borderTopWidth: 1,
  },
  navBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14,
  },
  navText: { fontSize: 13, fontWeight: '600' },
});
