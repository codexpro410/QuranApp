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
import Colors from '@/constants/colors';

export default function PageJumpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [pageInput, setPageInput] = useState('');

  const pageNumber = parseInt(pageInput, 10);
  const isValidPage = !isNaN(pageNumber) && pageNumber >= 1 && pageNumber <= TOTAL_PAGES;
  const previewSurah = isValidPage ? getSurahByPage(pageNumber) : null;
  const previewJuz = isValidPage ? getJuzByPage(pageNumber) : null;

  const handleGoToPage = useCallback(() => {
    if (isValidPage) {
    //   if (Platform.OS !== 'web') {
    //     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    //   }
      router.replace({
        pathname: '/',
        params: { goToPage: pageNumber.toString() },
      });
    }
  }, [isValidPage, pageNumber, router]);

  const quickPages = [1, 50, 100, 200, 300, 400, 500, 604];

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <X size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Hash size={20} color={Colors.gold} />
          <Text style={styles.headerText}>انتقل إلى صفحة</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="رقم الصفحة"
            placeholderTextColor={Colors.textMuted}
            value={pageInput}
            onChangeText={setPageInput}
            keyboardType="number-pad"
            maxLength={3}
            autoFocus
          />
          <Text style={styles.totalPages}>من {TOTAL_PAGES}</Text>
        </View>

        {isValidPage && previewSurah && (
          <View style={styles.preview}>
            <Text style={styles.previewLabel}>ستذهب إلى:</Text>
            <Text style={styles.previewSurah}>سورة {previewSurah.name}</Text>
            <Text style={styles.previewJuz}>الجزء {previewJuz}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.goButton, !isValidPage && styles.goButtonDisabled]}
          onPress={handleGoToPage}
          disabled={!isValidPage}
        >
          <Text style={styles.goButtonText}>انتقل</Text>
          <ArrowLeft size={20} color={Colors.background} />
        </TouchableOpacity>

        <View style={styles.quickPagesSection}>
          <Text style={styles.quickPagesLabel}>صفحات سريعة</Text>
          <View style={styles.quickPagesGrid}>
            {quickPages.map((page) => (
              <TouchableOpacity
                key={page}
                style={styles.quickPageButton}
                onPress={() => {
                  setPageInput(page.toString());
                //   if (Platform.OS !== 'web') {
                //     Haptics.selectionAsync();
                //   }
                }}
              >
                <Text style={styles.quickPageText}>{page}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
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
  content: {
    flex: 1,
    padding: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  input: {
    flex: 1,
    color: Colors.gold,
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
  },
  totalPages: {
    color: Colors.textSecondary,
    fontSize: 16,
  },
  preview: {
    alignItems: 'center',
    marginTop: 24,
    padding: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
  },
  previewLabel: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginBottom: 8,
  },
  previewSurah: {
    color: Colors.gold,
    fontSize: 20,
    fontWeight: '600',
  },
  previewJuz: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
  goButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.gold,
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    gap: 8,
  },
  goButtonDisabled: {
    backgroundColor: Colors.surfaceLight,
  },
  goButtonText: {
    color: Colors.background,
    fontSize: 18,
    fontWeight: '700',
  },
  quickPagesSection: {
    marginTop: 32,
  },
  quickPagesLabel: {
    color: Colors.textSecondary,
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
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  quickPageText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
});
