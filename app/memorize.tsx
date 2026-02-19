import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  SkipForward,
  Brain,
  ChevronDown,
  ChevronUp,
  Info,
  Layers,
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/contexts/ThemeContext';
import { useHifz, JUZ_PAGES, PageStatus } from '@/contexts/HifzContext';
import { mushafPages } from '@/data/mushafAssets';
import { getSurahByPage, getJuzByPage } from '@/data/quranData';

const { width, height } = Dimensions.get('window');

const STATUS_CONFIG = {
  none: { color: '#666', label: 'لم يُحفظ' },
  memorized: { color: '#FF9800', label: 'محفوظ' },
  strong: { color: '#4CAF50', label: 'قوي' },
  weak: { color: '#F44336', label: 'ضعيف' },
};

export default function MemorizeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: c, mode } = useTheme();
  const { pages, settings, stats, markPageMemorized, markPageStatus, getPageRecord, markRangeMemorized } = useHifz();

  // Find first unmemorized page
  const firstUnmemorized = useMemo(() => {
    for (let i = 1; i <= 604; i++) {
      if (!pages[i] || pages[i].status === 'none') return i;
    }
    return 604;
  }, [pages]);

  const [currentPage, setCurrentPage] = useState(firstUnmemorized);
  const [showInfo, setShowInfo] = useState(false);
  const [sessionPages, setSessionPages] = useState<number[]>([]);
  const [mode2, setMode2] = useState<'single' | 'range'>('single');
  const [rangeFrom, setRangeFrom] = useState(firstUnmemorized);
  const [rangeTo, setRangeTo] = useState(Math.min(firstUnmemorized + 4, 604));

  const pageRecord = getPageRecord(currentPage);
  const surah = getSurahByPage(currentPage);
  const juz = getJuzByPage(currentPage);
  const pageImage = mushafPages.find(p => p.page === currentPage)?.image;
  const statusConfig = STATUS_CONFIG[pageRecord.status];

  const goNext = useCallback(() => {
    if (currentPage < 604) setCurrentPage(p => p + 1);
  }, [currentPage]);

  const goPrev = useCallback(() => {
    if (currentPage > 1) setCurrentPage(p => p - 1);
  }, [currentPage]);

  const handleMarkMemorized = useCallback(() => {
    markPageMemorized(currentPage);
    if (!sessionPages.includes(currentPage)) {
      setSessionPages(prev => [...prev, currentPage]);
    }
    goNext();
  }, [currentPage, markPageMemorized, sessionPages, goNext]);

  const handleMarkStatus = useCallback((status: PageStatus) => {
    markPageStatus(currentPage, status);
  }, [currentPage, markPageStatus]);

  const handleMarkRange = useCallback(() => {
    Alert.alert(
      'تأكيد',
      `هل تريد تحديد الصفحات ${rangeFrom}–${rangeTo} (${rangeTo - rangeFrom + 1} صفحة) كمحفوظة؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'تأكيد', onPress: () => {
            markRangeMemorized(rangeFrom, rangeTo);
            Alert.alert('تم', `تم تسجيل ${rangeTo - rangeFrom + 1} صفحة كمحفوظة`);
          }
        },
      ]
    );
  }, [rangeFrom, rangeTo, markRangeMemorized]);

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: c.surface, borderBottomColor: c.border }]}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color={c.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: c.gold }]}>جلسة الحفظ</Text>
          <Text style={[styles.headerSub, { color: c.textSecondary }]}>{sessionPages.length} صفحة هذه الجلسة</Text>
        </View>
        <TouchableOpacity style={styles.headerBtn} onPress={() => setShowInfo(i => !i)}>
          <Info size={22} color={c.text} />
        </TouchableOpacity>
      </View>

      {/* Mode Toggle */}
      <View style={[styles.modeBar, { backgroundColor: c.surface, borderBottomColor: c.border }]}>
        <TouchableOpacity
          style={[styles.modeBtn, mode2 === 'single' && { backgroundColor: c.gold }]}
          onPress={() => setMode2('single')}
        >
          <Text style={[styles.modeBtnText, { color: mode2 === 'single' ? '#000' : c.textSecondary }]}>صفحة بصفحة</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeBtn, mode2 === 'range' && { backgroundColor: '#2196F3' }]}
          onPress={() => setMode2('range')}
        >
          <Layers size={14} color={mode2 === 'range' ? '#fff' : c.textSecondary} />
          <Text style={[styles.modeBtnText, { color: mode2 === 'range' ? '#fff' : c.textSecondary }]}>نطاق صفحات</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
        {mode2 === 'single' ? (
          <>
            {/* Page Info Bar */}
            <View style={[styles.pageInfoBar, { backgroundColor: c.surface }]}>
              <View style={[styles.statusDot, { backgroundColor: statusConfig.color }]} />
              <Text style={[styles.pageInfoText, { color: c.text }]}>
                صفحة {currentPage} • {surah?.name} • الجزء {juz}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: `${statusConfig.color}20`, borderColor: statusConfig.color }]}>
                <Text style={[styles.statusBadgeText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
              </View>
            </View>

            {/* Page Image */}
            <View style={styles.imageContainer}>
              {pageImage && (
                <Image
                  source={pageImage}
                  style={styles.pageImage}
                  contentFit="contain"
                  cachePolicy="memory-disk"
                />
              )}
            </View>

            {/* Navigation */}
            <View style={[styles.navRow, { backgroundColor: c.surface }]}>
              <TouchableOpacity
                style={[styles.navBtn, { backgroundColor: c.surfaceLight, opacity: currentPage <= 1 ? 0.4 : 1 }]}
                onPress={goPrev}
                disabled={currentPage <= 1}
              >
                <ArrowRight size={22} color={c.text} />
                <Text style={[styles.navBtnText, { color: c.text }]}>السابق</Text>
              </TouchableOpacity>

              <View style={styles.pageCounter}>
                <Text style={[styles.pageCounterNum, { color: c.gold }]}>{currentPage}</Text>
                <Text style={[styles.pageCounterTotal, { color: c.textSecondary }]}>/604</Text>
              </View>

              <TouchableOpacity
                style={[styles.navBtn, { backgroundColor: c.surfaceLight, opacity: currentPage >= 604 ? 0.4 : 1 }]}
                onPress={goNext}
                disabled={currentPage >= 604}
              >
                <Text style={[styles.navBtnText, { color: c.text }]}>التالي</Text>
                <ArrowLeft size={22} color={c.text} />
              </TouchableOpacity>
            </View>

            {/* Info Expandable */}
            {showInfo && pageRecord.memorizedAt && (
              <View style={[styles.infoCard, { backgroundColor: c.surface }]}>
                <Text style={[styles.infoTitle, { color: c.text }]}>معلومات الصفحة</Text>
                <InfoRow label="تاريخ الحفظ" value={new Date(pageRecord.memorizedAt).toLocaleDateString('ar-EG')} c={c} />
                {pageRecord.lastRevisedAt && (
                  <InfoRow label="آخر مراجعة" value={new Date(pageRecord.lastRevisedAt).toLocaleDateString('ar-EG')} c={c} />
                )}
                {pageRecord.nextRevisionDue && (
                  <InfoRow label="المراجعة القادمة" value={new Date(pageRecord.nextRevisionDue).toLocaleDateString('ar-EG')} c={c} />
                )}
                <InfoRow label="عدد المراجعات" value={pageRecord.revisionCount.toString()} c={c} />
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionsSection}>
              <Text style={[styles.actionsLabel, { color: c.textSecondary }]}>تحديد حالة الصفحة</Text>
              
              {pageRecord.status === 'none' ? (
                <TouchableOpacity
                  style={[styles.memorizeMainBtn, { backgroundColor: c.gold }]}
                  onPress={handleMarkMemorized}
                >
                  <CheckCircle2 size={22} color="#000" />
                  <Text style={styles.memorizeMainBtnText}>تم حفظ هذه الصفحة ✓</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.statusBtns}>
                  <TouchableOpacity
                    style={[styles.statusBtn, { backgroundColor: '#4CAF5020', borderColor: '#4CAF50', borderWidth: pageRecord.status === 'strong' ? 2 : 0 }]}
                    onPress={() => handleMarkStatus('strong')}
                  >
                    <CheckCircle2 size={18} color="#4CAF50" />
                    <Text style={[styles.statusBtnText, { color: '#4CAF50' }]}>قوي</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.statusBtn, { backgroundColor: '#FF980020', borderColor: '#FF9800', borderWidth: pageRecord.status === 'memorized' ? 2 : 0 }]}
                    onPress={() => handleMarkStatus('memorized')}
                  >
                    <Brain size={18} color="#FF9800" />
                    <Text style={[styles.statusBtnText, { color: '#FF9800' }]}>محفوظ</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.statusBtn, { backgroundColor: '#F4433620', borderColor: '#F44336', borderWidth: pageRecord.status === 'weak' ? 2 : 0 }]}
                    onPress={() => handleMarkStatus('weak')}
                  >
                    <AlertTriangle size={18} color="#F44336" />
                    <Text style={[styles.statusBtnText, { color: '#F44336' }]}>يحتاج تقوية</Text>
                  </TouchableOpacity>
                </View>
              )}

              {pageRecord.status !== 'none' && (
                <TouchableOpacity
                  style={[styles.nextUnmemorizedBtn, { backgroundColor: c.surfaceLight }]}
                  onPress={() => {
                    for (let p = currentPage + 1; p <= 604; p++) {
                      if (!pages[p] || pages[p].status === 'none') { setCurrentPage(p); return; }
                    }
                    Alert.alert('ما شاء الله!', 'لا توجد صفحات غير محفوظة بعد هذه الصفحة');
                  }}
                >
                  <SkipForward size={16} color={c.textSecondary} />
                  <Text style={[styles.nextUnmemorizedText, { color: c.textSecondary }]}>الصفحة التالية غير محفوظة</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Session summary */}
            {sessionPages.length > 0 && (
              <View style={[styles.sessionCard, { backgroundColor: c.surface }]}>
                <Text style={[styles.sessionTitle, { color: c.text }]}>هذه الجلسة</Text>
                <Text style={[styles.sessionCount, { color: c.gold }]}>{sessionPages.length} صفحة محفوظة</Text>
                <Text style={[styles.sessionPages, { color: c.textSecondary }]}>
                  {sessionPages.slice(-5).join('، ')}{sessionPages.length > 5 ? ' ...' : ''}
                </Text>
              </View>
            )}
          </>
        ) : (
          /* Range Mode */
          <View style={styles.rangeMode}>
            <View style={[styles.rangeCard, { backgroundColor: c.surface }]}>
              <Text style={[styles.rangeTitle, { color: c.text }]}>تسجيل نطاق من الصفحات</Text>
              <Text style={[styles.rangeDesc, { color: c.textSecondary }]}>
                إذا كنت قد حفظت مسبقاً صفحات متعددة ولم تسجلها، يمكنك تسجيلها دفعة واحدة
              </Text>

              <View style={styles.rangeSelectors}>
                <View style={styles.rangeSide}>
                  <Text style={[styles.rangeLabel, { color: c.textSecondary }]}>من صفحة</Text>
                  <View style={styles.rangeCounter}>
                    <TouchableOpacity style={[styles.rcBtn, { backgroundColor: c.surfaceLight }]} onPress={() => setRangeFrom(p => Math.max(1, p - 1))}>
                      <Text style={[styles.rcBtnText, { color: c.text }]}>−</Text>
                    </TouchableOpacity>
                    <Text style={[styles.rcValue, { color: c.gold }]}>{rangeFrom}</Text>
                    <TouchableOpacity style={[styles.rcBtn, { backgroundColor: c.surfaceLight }]} onPress={() => setRangeFrom(p => Math.min(rangeTo, p + 1))}>
                      <Text style={[styles.rcBtnText, { color: c.text }]}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={[styles.rangeDash, { color: c.textSecondary }]}>←</Text>

                <View style={styles.rangeSide}>
                  <Text style={[styles.rangeLabel, { color: c.textSecondary }]}>إلى صفحة</Text>
                  <View style={styles.rangeCounter}>
                    <TouchableOpacity style={[styles.rcBtn, { backgroundColor: c.surfaceLight }]} onPress={() => setRangeTo(p => Math.max(rangeFrom, p - 1))}>
                      <Text style={[styles.rcBtnText, { color: c.text }]}>−</Text>
                    </TouchableOpacity>
                    <Text style={[styles.rcValue, { color: c.gold }]}>{rangeTo}</Text>
                    <TouchableOpacity style={[styles.rcBtn, { backgroundColor: c.surfaceLight }]} onPress={() => setRangeTo(p => Math.min(604, p + 1))}>
                      <Text style={[styles.rcBtnText, { color: c.text }]}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <View style={[styles.rangeSummaryBox, { backgroundColor: c.surfaceLight }]}>
                <Text style={[styles.rangeSummaryText, { color: c.text }]}>
                  {rangeTo - rangeFrom + 1} صفحة • من {rangeFrom} إلى {rangeTo}
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.rangeConfirmBtn, { backgroundColor: c.gold }]}
                onPress={handleMarkRange}
              >
                <CheckCircle2 size={20} color="#000" />
                <Text style={styles.rangeConfirmText}>تسجيل النطاق كمحفوظ</Text>
              </TouchableOpacity>
            </View>

            {/* Jump to juz */}
            <View style={[styles.juzShortcuts, { backgroundColor: c.surface }]}>
              <Text style={[styles.rangeTitle, { color: c.text }]}>انتقل إلى بداية جزء</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.juzChips}>
                {JUZ_PAGES.map(([from, to], i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.juzChip, { backgroundColor: c.surfaceLight }]}
                    onPress={() => { setRangeFrom(from); setRangeTo(to); }}
                  >
                    <Text style={[styles.juzChipText, { color: c.text }]}>ج{i + 1}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function InfoRow({ label, value, c }: { label: string; value: string; c: any }) {
  return (
    <View style={styles.infoRowItem}>
      <Text style={[styles.infoRowLabel, { color: c.textSecondary }]}>{label}</Text>
      <Text style={[styles.infoRowValue, { color: c.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerBtn: { padding: 8 },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  headerSub: { fontSize: 12, marginTop: 2 },
  modeBar: {
    flexDirection: 'row',
    padding: 8,
    gap: 8,
    borderBottomWidth: 1,
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
  },
  modeBtnText: { fontSize: 13, fontWeight: '600' },
  scroll: { flex: 1 },
  pageInfoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  pageInfoText: { flex: 1, fontSize: 13 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusBadgeText: { fontSize: 11, fontWeight: '600' },
  imageContainer: {
    height: height * 0.45,
    backgroundColor: '#000',
  },
  pageImage: { width: '100%', height: '100%' },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 0,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  navBtnText: { fontSize: 13, fontWeight: '600' },
  pageCounter: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  pageCounterNum: { fontSize: 24, fontWeight: '800' },
  pageCounterTotal: { fontSize: 14 },
  infoCard: { margin: 12, borderRadius: 14, padding: 14 },
  infoTitle: { fontSize: 14, fontWeight: '700', marginBottom: 10 },
  infoRowItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  infoRowLabel: { fontSize: 13 },
  infoRowValue: { fontSize: 13, fontWeight: '600' },
  actionsSection: { padding: 12, gap: 10 },
  actionsLabel: { fontSize: 12, marginBottom: 4 },
  memorizeMainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
  },
  memorizeMainBtnText: { fontSize: 17, fontWeight: '800', color: '#000' },
  statusBtns: { flexDirection: 'row', gap: 8 },
  statusBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  statusBtnText: { fontSize: 12, fontWeight: '700' },
  nextUnmemorizedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 10,
  },
  nextUnmemorizedText: { fontSize: 13 },
  sessionCard: { margin: 12, borderRadius: 14, padding: 14 },
  sessionTitle: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
  sessionCount: { fontSize: 20, fontWeight: '800' },
  sessionPages: { fontSize: 12, marginTop: 4 },
  // Range mode
  rangeMode: { padding: 12, gap: 12 },
  rangeCard: { borderRadius: 16, padding: 16, gap: 12 },
  rangeTitle: { fontSize: 16, fontWeight: '700' },
  rangeDesc: { fontSize: 13, lineHeight: 20 },
  rangeSelectors: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rangeSide: { alignItems: 'center', gap: 8 },
  rangeLabel: { fontSize: 12 },
  rangeCounter: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rcBtn: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  rcBtnText: { fontSize: 20, fontWeight: '700' },
  rcValue: { fontSize: 22, fontWeight: '800', minWidth: 40, textAlign: 'center' },
  rangeDash: { fontSize: 22 },
  rangeSummaryBox: { borderRadius: 10, padding: 12, alignItems: 'center' },
  rangeSummaryText: { fontSize: 14, fontWeight: '600' },
  rangeConfirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  rangeConfirmText: { fontSize: 15, fontWeight: '700', color: '#000' },
  juzShortcuts: { borderRadius: 16, padding: 14 },
  juzChips: { gap: 8, paddingVertical: 4 },
  juzChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  juzChipText: { fontSize: 12, fontWeight: '600' },
});