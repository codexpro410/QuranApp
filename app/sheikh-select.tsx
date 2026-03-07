import { useTheme } from '@/contexts/ThemeContext';
import { Sheikh, getSheikhsForSurah, sheikhData } from '@/data/sheikhData';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check, Search, User, X } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import {
    SectionList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Fixed item heights for getItemLayout
const SHEIKH_ITEM_HEIGHT = 74;
const SECTION_HEADER_HEIGHT = 44;

export default function SheikhSelectScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { surahNumber } = useLocalSearchParams<{ surahNumber?: string }>();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSheikh, setSelectedSheikh] = useState<string | null>(null);

  React.useEffect(() => {
    AsyncStorage.getItem("ACTIVE_SHEIKH").then(v => {
      if (v) setSelectedSheikh(JSON.parse(v).id);
    });
  }, []);

  const sheikhs = useMemo(() => {
    let list = surahNumber ? getSheikhsForSurah(parseInt(surahNumber, 10)) : sheikhData;
    list = [...list].sort((a, b) => a.name.localeCompare(b.name, 'ar'));
    if (searchQuery.trim()) {
      const q = searchQuery.trim();
      list = list.filter(s => s.name.includes(q));
    }
    return list;
  }, [surahNumber, searchQuery]);

  // Build SectionList sections in one pass
  const sections = useMemo(() => {
    const groups: Record<string, Sheikh[]> = {};
    for (const sheikh of sheikhs) {
      const letter = sheikh.letter || sheikh.name.charAt(0);
      if (!groups[letter]) groups[letter] = [];
      groups[letter].push(sheikh);
    }
    return Object.entries(groups)
      .sort((a, b) => a[0].localeCompare(b[0], 'ar'))
      .map(([title, data]) => ({ title, data }));
  }, [sheikhs]);

  const handleSelectSheikh = useCallback(async (sheikh: Sheikh) => {
    await AsyncStorage.setItem("ACTIVE_SHEIKH", JSON.stringify(sheikh));
    setSelectedSheikh(sheikh.id);
    router.back();
  }, [router]);

  const renderItem = useCallback(({ item }: { item: Sheikh }) => {
    const isSelected = selectedSheikh === item.id;
    return (
      <TouchableOpacity
        style={[
          styles.sheikhItem,
          { backgroundColor: colors.surface, borderColor: isSelected ? colors.gold : colors.border }
        ]}
        onPress={() => handleSelectSheikh(item)}
        activeOpacity={0.8}
      >
        <View style={[styles.sheikhIcon, { backgroundColor: colors.surfaceLight }]}>
          <User size={20} color={colors.gold} />
        </View>
        <View style={styles.sheikhInfo}>
          <Text style={[styles.sheikhName, { color: colors.text }]}>{item.name}</Text>
          <Text style={[styles.sheikhRewaya, { color: colors.textSecondary }]}>{item.rewaya}</Text>
          <Text style={[styles.sheikhCount, { color: colors.textMuted }]}>{item.count} سورة</Text>
        </View>
        {isSelected && (
          <View style={[styles.checkIcon, { backgroundColor: colors.gold }]}>
            <Check size={16} color={colors.background} />
          </View>
        )}
      </TouchableOpacity>
    );
  }, [selectedSheikh, colors, handleSelectSheikh]);

  const renderSectionHeader = useCallback(({ section }: { section: { title: string } }) => (
    <View style={[styles.sectionHeader, { backgroundColor: colors.surfaceLight }]}>
      <Text style={[styles.sectionLetter, { color: colors.gold }]}>{section.title}</Text>
    </View>
  ), [colors]);

  const getItemLayout = useCallback((_: any, index: number) => ({
    length: SHEIKH_ITEM_HEIGHT + 8,
    offset: (SHEIKH_ITEM_HEIGHT + 8) * index,
    index,
  }), []);

  const keyExtractor = useCallback((item: Sheikh) => item.id, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={[styles.closeButton, { backgroundColor: colors.surface }]} onPress={() => router.back()}>
          <X size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <User size={20} color={colors.gold} />
          <Text style={[styles.headerText, { color: colors.text }]}>اختيار القارئ</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
        <Search size={18} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="ابحث عن قارئ..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <X size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <SectionList
        sections={sections}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        windowSize={8}
        removeClippedSubviews
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              لم يتم العثور على قراء
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
  },
  closeButton: { padding: 8, borderRadius: 20 },
  headerTitle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerText: { fontSize: 18, fontWeight: '700' },
  placeholder: { width: 40 },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginVertical: 12,
    paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: 14, gap: 8,
  },
  searchInput: { flex: 1, fontSize: 16, textAlign: 'right' },
  listContent: { paddingHorizontal: 16, paddingBottom: 24 },
  sectionHeader: {
    paddingVertical: 8, paddingHorizontal: 12,
    borderRadius: 8, marginBottom: 8, height: SECTION_HEADER_HEIGHT,
    justifyContent: 'center',
  },
  sectionLetter: { fontSize: 16, fontWeight: '700' },
  sheikhItem: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, padding: 12, marginBottom: 8,
    borderWidth: 2, height: SHEIKH_ITEM_HEIGHT,
  },
  sheikhIcon: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  sheikhInfo: { flex: 1, marginHorizontal: 12, alignItems: 'flex-end' },
  sheikhName: { fontSize: 16, fontWeight: '600' },
  sheikhRewaya: { fontSize: 12, marginTop: 2 },
  sheikhCount: { fontSize: 11, marginTop: 2 },
  checkIcon: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 16 },
});
