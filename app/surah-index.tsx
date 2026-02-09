import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X, Search, BookOpen } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { quranData, Surah } from '@/data/quranData';
import Colors from '@/constants/colors';

export default function SurahIndexScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSurahs = useMemo(() => {
    if (!searchQuery.trim()) return quranData;
    const query = searchQuery.toLowerCase().trim();
    return quranData.filter(
      (surah) =>
        surah.name.includes(query) ||
        surah.englishName.toLowerCase().includes(query) ||
        surah.number.toString() === query
    );
  }, [searchQuery]);

  const handleSurahPress = useCallback((surah: Surah) => {
    // if (Platform.OS !== 'web') {
    //   Haptics.selectionAsync();
    // }
    router.replace({
      pathname: '/',
      params: { goToPage: surah.page.toString() },
    });
  }, [router]);

  const renderSurah = useCallback(({ item, index }: { item: Surah; index: number }) => (
    <TouchableOpacity
      style={styles.surahItem}
      onPress={() => handleSurahPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.surahNumber}>
        <Text style={styles.surahNumberText}>{item.number}</Text>
      </View>
      <View style={styles.surahDetails}>
        <Text style={styles.surahName}>{item.name}</Text>
        <Text style={styles.surahEnglish}>{item.englishName}</Text>
      </View>
      <View style={styles.surahMeta}>
        <Text style={styles.versesText}>{item.verses} آية</Text>
        <Text style={styles.pageText}>صفحة {item.page}</Text>
      </View>
    </TouchableOpacity>
  ), [handleSurahPress]);

  const renderHeader = useCallback(() => (
    <View style={styles.searchContainer}>
      <Search size={18} color={Colors.textSecondary} />
      <TextInput
        style={styles.searchInput}
        placeholder="ابحث عن سورة..."
        placeholderTextColor={Colors.textMuted}
        value={searchQuery}
        onChangeText={setSearchQuery}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {searchQuery.length > 0 && (
        <TouchableOpacity onPress={() => setSearchQuery('')}>
          <X size={18} color={Colors.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  ), [searchQuery]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <X size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <BookOpen size={20} color={Colors.gold} />
          <Text style={styles.headerText}>فهرس السور</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      {renderHeader()}

      <FlatList
        data={filteredSurahs}
        keyExtractor={(item) => item.number.toString()}
        renderItem={renderSurah}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        initialNumToRender={20}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>لم يتم العثور على نتائج</Text>
          </View>
        }
      />
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
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerText: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  placeholder: {
    width: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: Colors.text,
    fontSize: 16,
    textAlign: 'right',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  surahItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  surahNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  surahNumberText: {
    color: Colors.gold,
    fontSize: 14,
    fontWeight: '700',
  },
  surahDetails: {
    flex: 1,
    marginHorizontal: 12,
    alignItems: 'flex-end',
  },
  surahName: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '600',
  },
  surahEnglish: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  surahMeta: {
    alignItems: 'flex-start',
  },
  versesText: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  pageText: {
    color: Colors.gold,
    fontSize: 12,
    marginTop: 2,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 16,
  },
});
