import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X, Search, Check, User } from 'lucide-react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from '@/contexts/ThemeContext';
import { sheikhData, Sheikh, getSheikhsForSurah } from '@/data/sheikhData';

export default function SheikhSelectScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { surahNumber } = useLocalSearchParams<{ surahNumber?: string }>();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSheikh, setSelectedSheikh] = useState<string | null>(null);

  React.useEffect(() => {
    AsyncStorage.getItem("ACTIVE_SHEIKH").then(v => {
      if (v) {
        const sheikh = JSON.parse(v);
        setSelectedSheikh(sheikh.id);
      }
    });
  }, []);

  const sheikhs = useMemo(() => {
    let list = sheikhData;
    
    if (surahNumber) {
      list = getSheikhsForSurah(parseInt(surahNumber, 10));
    }

    list = [...list].sort((a, b) => a.name.localeCompare(b.name, 'ar'));

    if (searchQuery.trim()) {
      const query = searchQuery.trim();
      list = list.filter(s => s.name.includes(query));
    }

    return list;
  }, [surahNumber, searchQuery]);

  const groupedSheikhs = useMemo(() => {
    const groups: { [letter: string]: Sheikh[] } = {};
    sheikhs.forEach(sheikh => {
      const letter = sheikh.letter || sheikh.name.charAt(0);
      if (!groups[letter]) groups[letter] = [];
      groups[letter].push(sheikh);
    });
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0], 'ar'));
  }, [sheikhs]);

  const handleSelectSheikh = useCallback(async (sheikh: Sheikh) => {
    await AsyncStorage.setItem("ACTIVE_SHEIKH", JSON.stringify(sheikh));
    setSelectedSheikh(sheikh.id);
    router.back();
  }, [router]);

  const renderSheikh = useCallback(({ item }: { item: Sheikh }) => {
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

  const renderSection = useCallback(({ item }: { item: [string, Sheikh[]] }) => {
    const [letter, sheikhsList] = item;
    return (
      <View style={styles.section}>
        <View style={[styles.sectionHeader, { backgroundColor: colors.surfaceLight }]}>
          <Text style={[styles.sectionLetter, { color: colors.gold }]}>{letter}</Text>
        </View>
        {sheikhsList.map(sheikh => (
          <View key={sheikh.id}>
            {renderSheikh({ item: sheikh })}
          </View>
        ))}
      </View>
    );
  }, [colors, renderSheikh]);

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

      <FlatList
        data={groupedSheikhs}
        keyExtractor={(item) => item[0]}
        renderItem={renderSection}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
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
  closeButton: {
    padding: 8,
    borderRadius: 20,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '700',
  },
  placeholder: {
    width: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    textAlign: 'right',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  section: {
    marginBottom: 8,
  },
  sectionHeader: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  sectionLetter: {
    fontSize: 16,
    fontWeight: '700',
  },
  sheikhItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 2,
  },
  sheikhIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheikhInfo: {
    flex: 1,
    marginHorizontal: 12,
    alignItems: 'flex-end',
  },
  sheikhName: {
    fontSize: 16,
    fontWeight: '600',
  },
  sheikhRewaya: {
    fontSize: 12,
    marginTop: 2,
  },
  sheikhCount: {
    fontSize: 11,
    marginTop: 2,
  },
  checkIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
});
