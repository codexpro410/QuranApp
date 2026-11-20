import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X, Hash, ArrowLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { TOTAL_PAGES, getSurahByPage, getJuzByPage } from '@/data/quranData';
import { useBookmarks } from '@/contexts/BookmarkContext';
import { useTheme } from '@/contexts/ThemeContext';
import SystemBars from '@/components/SystemBars';

export default function PageJumpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [pageInput, setPageInput] = useState('');
  const { colors, mode } = useTheme();
  const { jumpToPage } = useBookmarks();

  const pageNumber = parseInt(pageInput, 10);
  const isValidPage = !isNaN(pageNumber) && pageNumber >= 1 && pageNumber <= TOTAL_PAGES;
  const previewSurah = isValidPage ? getSurahByPage(pageNumber) : null;
  const previewJuz = isValidPage ? getJuzByPage(pageNumber) : null;

  const handleGoToPage = useCallback(() => {
    if (!isValidPage) return;
    Haptics.selectionAsync().catch(() => {});
    jumpToPage(pageNumber);
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }, [isValidPage, pageNumber, jumpToPage, router]);

  const quickPages = [1, 50, 100, 200, 300, 400, 500, 604];

  return (
    <>
      {/* StatusBar respects mode */}
      <SystemBars light={mode === 'dark'} />

      <KeyboardAvoidingView
        style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: colors.surface }]}
            onPress={() => router.back()}
          >
            <X size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Hash size={20} color={colors.gold} />
            <Text style={[styles.headerText, { color: colors.text }]}>انتقل إلى صفحة</Text>
          </View>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          <View style={[styles.inputContainer, { backgroundColor: colors.surface }]}>
            <TextInput
              style={[styles.input, { color: colors.gold }]}
              placeholder="رقم الصفحة"
              placeholderTextColor={colors.textSecondary}
              value={pageInput}
              onChangeText={setPageInput}
              keyboardType="number-pad"
              maxLength={3}
              returnKeyType="go"
              onSubmitEditing={handleGoToPage}
              autoFocus
            />
            <Text style={[styles.totalPages, { color: colors.textSecondary }]}>من {TOTAL_PAGES}</Text>
          </View>

          {isValidPage && previewSurah && (
            <View style={[styles.preview, { backgroundColor: colors.surface }]}>
              <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>ستذهب إلى:</Text>
              <Text style={[styles.previewSurah, { color: colors.gold }]}>سورة {previewSurah.name}</Text>
              <Text style={[styles.previewJuz, { color: colors.textSecondary }]}>الجزء {previewJuz}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.goButton,
              { backgroundColor: colors.gold },
              !isValidPage && { backgroundColor: colors.surfaceLight },
            ]}
            onPress={handleGoToPage}
            disabled={!isValidPage}
          >
            <Text style={[styles.goButtonText, { color: colors.background }]}>انتقل</Text>
            <ArrowLeft size={20} color={colors.background} />
          </TouchableOpacity>

          <View style={styles.quickPagesSection}>
            <Text style={[styles.quickPagesLabel, { color: colors.textSecondary }]}>صفحات سريعة</Text>
            <View style={styles.quickPagesGrid}>
              {quickPages.map((page) => (
                <TouchableOpacity
                  key={page}
                  style={[styles.quickPageButton, { backgroundColor: colors.surface }]}
                  onPress={() => setPageInput(page.toString())}
                >
                  <Text style={[styles.quickPageText, { color: colors.text }]}>{page}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </>
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
  content: {
    flex: 1,
    padding: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
  },
  totalPages: {
    fontSize: 16,
  },
  preview: {
    alignItems: 'center',
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
  },
  previewLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  previewSurah: {
    fontSize: 20,
    fontWeight: '600',
  },
  previewJuz: {
    fontSize: 14,
    marginTop: 4,
  },
  goButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    gap: 8,
  },
  goButtonText: {
    fontSize: 18,
    fontWeight: '700',
  },
  quickPagesSection: {
    marginTop: 32,
  },
  quickPagesLabel: {
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  quickPagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  quickPageButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  quickPageText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
