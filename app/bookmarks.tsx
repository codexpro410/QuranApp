import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X, Bookmark, Trash2, BookOpen } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useQuran, Bookmark as BookmarkType } from '@/contexts/QuranContext';
import { getSurahByPage, getJuzByPage } from '@/data/quranData';
import Colors from '@/constants/colors';

export default function BookmarksScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { bookmarks, removeBookmark } = useQuran();

  const handleBookmarkPress = useCallback((bookmark: BookmarkType) => {
    // if (Platform.OS !== 'web') {
    //   Haptics.selectionAsync();
    // }
    router.replace({
      pathname: '/',
      params: { goToPage: bookmark.page.toString() },
    });
  }, [router]);

  const handleRemoveBookmark = useCallback((page: number) => {
    if (Platform.OS === 'web') {
      removeBookmark(page);
    } else {
      Alert.alert(
        'حذف العلامة',
        `هل تريد حذف علامة الصفحة ${page}؟`,
        [
          { text: 'إلغاء', style: 'cancel' },
          {
            text: 'حذف',
            style: 'destructive',
            onPress: () => {
            //   Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              removeBookmark(page);
            },
          },
        ]
      );
    }
  }, [removeBookmark]);

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderBookmark = useCallback(({ item }: { item: BookmarkType }) => {
    const surah = getSurahByPage(item.page);
    const juz = getJuzByPage(item.page);

    return (
      <TouchableOpacity
        style={styles.bookmarkItem}
        onPress={() => handleBookmarkPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.bookmarkIcon}>
          <Bookmark size={20} color={Colors.gold} fill={Colors.gold} />
        </View>
        <View style={styles.bookmarkDetails}>
          <View style={styles.bookmarkHeader}>
            <Text style={styles.pageNumber}>صفحة {item.page}</Text>
            <Text style={styles.juzText}>الجزء {juz}</Text>
          </View>
          {surah && (
            <Text style={styles.surahName}>سورة {surah.name}</Text>
          )}
          <Text style={styles.dateText}>{formatDate(item.timestamp)}</Text>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleRemoveBookmark(item.page)}
        >
          <Trash2 size={18} color={Colors.error} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }, [handleBookmarkPress, handleRemoveBookmark]);

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
          <Bookmark size={20} color={Colors.gold} />
          <Text style={styles.headerText}>العلامات المرجعية</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        data={bookmarks}
        keyExtractor={(item) => item.page.toString()}
        renderItem={renderBookmark}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <BookOpen size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>لا توجد علامات</Text>
            <Text style={styles.emptyText}>
              أضف علامة مرجعية أثناء القراءة للعودة إليها لاحقاً
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
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  bookmarkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  bookmarkIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookmarkDetails: {
    flex: 1,
    marginHorizontal: 12,
  },
  bookmarkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pageNumber: {
    color: Colors.gold,
    fontSize: 16,
    fontWeight: '700',
  },
  juzText: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  surahName: {
    color: Colors.text,
    fontSize: 14,
    marginTop: 2,
  },
  dateText: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.surfaceLight,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
});
