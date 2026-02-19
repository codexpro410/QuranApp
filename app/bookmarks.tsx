import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X, Bookmark, Trash2 } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/contexts/ThemeContext';
import { useBookmarks, Bookmark as BookmarkType, getBookmarkColor, getBookmarkLabel, BookmarkType as BType } from '@/contexts/BookmarkContext';

const FILTER_OPTIONS: { label: string; value: BType | 'all' }[] = [
  { label: 'الكل', value: 'all' },
  { label: 'قراءة', value: 'read' },
  { label: 'مراجعة', value: 'review' },
  { label: 'حفظ', value: 'memorize' },
];

export default function BookmarksScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mode, colors } = useTheme();
  const { bookmarks, removeBookmark } = useBookmarks();
  const [filter, setFilter] = useState<BType | 'all'>('all');

  const filteredBookmarks = filter === 'all' 
    ? bookmarks 
    : bookmarks.filter(b => b.type === filter);

  const sortedBookmarks = [...filteredBookmarks].sort((a, b) => b.createdAt - a.createdAt);

  const handleBookmarkPress = useCallback((bookmark: BookmarkType) => {
    router.replace({
      pathname: '/',
      params: { goToPage: bookmark.page.toString() },
    });
  }, [router]);

  const handleRemoveBookmark = useCallback((page: number) => {
    removeBookmark(page);
  }, [removeBookmark]);

  const renderBookmark = useCallback(({ item }: { item: BookmarkType }) => {
    const bookmarkColor = getBookmarkColor(item.type);
    const date = new Date(item.createdAt);
    const dateStr = date.toLocaleDateString('ar-EG', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });

    return (
      <TouchableOpacity
        style={[styles.bookmarkItem, { backgroundColor: colors.surface, borderLeftColor: bookmarkColor }]}
        onPress={() => handleBookmarkPress(item)}
        activeOpacity={0.8}
      >
        <View style={styles.bookmarkContent}>
          <View style={styles.bookmarkHeader}>
            <View style={[styles.typeBadge, { backgroundColor: `${bookmarkColor}20` }]}>
              <Bookmark size={14} color={bookmarkColor} fill={bookmarkColor} />
              <Text style={[styles.typeText, { color: bookmarkColor }]}>{getBookmarkLabel(item.type)}</Text>
            </View>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleRemoveBookmark(item.page)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Trash2 size={18} color={colors.error} />
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.surahName, { color: colors.text }]}>
            {item.surahName || `صفحة ${item.page}`}
          </Text>
          <Text style={[styles.pageNumber, { color: colors.textSecondary }]}>
            صفحة {item.page}
          </Text>
          <View style={{ flexDirection:'row', justifyContent:'flex-end', gap:6 }}>
            <Text style={{ fontSize:12 }}>🕒</Text>
            <Text style={[styles.dateText, { color: colors.textMuted }]}>{dateStr}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [colors, handleBookmarkPress, handleRemoveBookmark]);

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={[styles.closeButton, { backgroundColor: colors.surface }]} onPress={() => router.back()}>
          <X size={22} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerTitle}>
          <Bookmark size={20} color={colors.gold} />
          <Text style={[styles.headerText, { color: colors.text }]}>العلامات المرجعية</Text>
        </View>

        <View style={styles.placeholder} />
      </View>

      <View style={styles.filterContainer}>
        {FILTER_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.filterButton,
              { backgroundColor: colors.surface, borderColor: colors.border },
              filter === option.value && { backgroundColor: colors.gold, borderColor: colors.gold },
            ]}
            onPress={() => setFilter(option.value)}
          >
            <Text
              style={[
                styles.filterText,
                { color: colors.text },
                filter === option.value && { color: colors.background },
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={sortedBookmarks}
        keyExtractor={(item) => `${item.page}-${item.createdAt}`}
        renderItem={renderBookmark}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Bookmark size={48} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              لا توجد علامات مرجعية
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
              اضغط على أيقونة العلامة في صفحة القرآن لإضافة علامة
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
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  bookmarkItem: {
    borderRadius: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    overflow: 'hidden',
  },
  bookmarkContent: {
    padding: 16,
  },
  bookmarkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 4,
  },
  surahName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'right',
  },
  pageNumber: {
    fontSize: 14,
    marginBottom: 4,
    textAlign: 'right',
  },
  dateText: {
    fontSize: 16,
    textAlign: 'right',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
