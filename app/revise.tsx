import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ThumbsUp,
  Zap,
  SkipForward,
  Trophy,
  BookOpen,
  Clock,
  Filter,
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/contexts/ThemeContext';
import { useHifz, PageRecord, RevisionQuality } from '@/contexts/HifzContext';
import { mushafPages } from '@/data/mushafAssets';
import { getSurahByPage, getJuzByPage } from '@/data/quranData';

const { width, height } = Dimensions.get('window');

type FilterMode = 'due' | 'weak' | 'all';

const QUALITY_CONFIG = [
  { quality: 'again' as RevisionQuality, label: 'مجدداً', icon: RefreshCw, color: '#F44336', bg: '#F4433620', desc: 'لم أتذكرها' },
  { quality: 'hard' as RevisionQuality, label: 'صعبة', icon: AlertTriangle, color: '#FF9800', bg: '#FF980020', desc: 'تذكرتها بصعوبة' },
  { quality: 'good' as RevisionQuality, label: 'جيد', icon: ThumbsUp, color: '#2196F3', bg: '#2196F320', desc: 'تذكرتها بشكل معقول' },
  { quality: 'easy' as RevisionQuality, label: 'سهلة', icon: Zap, color: '#4CAF50', bg: '#4CAF5020', desc: 'حفظتها جيداً' },
];

export default function ReviseScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: c, mode } = useTheme();
  const { getPagesForRevision, getOverduePages, recordRevision, pages, getPageRecord } = useHifz();

  const [filterMode, setFilterMode] = useState<FilterMode>('due');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionResults, setSessionResults] = useState<{ page: number; quality: RevisionQuality }[]>([]);
  const [sessionDone, setSessionDone] = useState(false);
  const [showFilter, setShowFilter] = useState(false);

  const revisionList = useMemo((): PageRecord[] => {
    if (filterMode === 'due') return getPagesForRevision();
    if (filterMode === 'weak') return Object.values(pages).filter(p => p.status === 'weak');
    return Object.values(pages).filter(p => p.status !== 'none').sort((a, b) => a.pageNum - b.pageNum);
  }, [filterMode, getPagesForRevision, pages]);

  const currentRecord = revisionList[currentIndex];
  const pageImage = currentRecord ? mushafPages.find(p => p.page === currentRecord.pageNum)?.image : null;
  const surah = currentRecord ? getSurahByPage(currentRecord.pageNum) : null;
  const juz = currentRecord ? getJuzByPage(currentRecord.pageNum) : null;

  const handleQuality = useCallback((quality: RevisionQuality) => {
    if (!currentRecord) return;
    recordRevision(currentRecord.pageNum, quality);
    setSessionResults(prev => [...prev, { page: currentRecord.pageNum, quality }]);
    
    if (currentIndex >= revisionList.length - 1) {
      setSessionDone(true);
    } else {
      setCurrentIndex(i => i + 1);
      setShowAnswer(false);
    }
  }, [currentRecord, currentIndex, revisionList, recordRevision]);

  const handleSkip = useCallback(() => {
    if (currentIndex >= revisionList.length - 1) {
      setSessionDone(true);
    } else {
      setCurrentIndex(i => i + 1);
      setShowAnswer(false);
    }
  }, [currentIndex, revisionList]);

  const restartSession = useCallback(() => {
    setCurrentIndex(0);
    setShowAnswer(false);
    setSessionResults([]);
    setSessionDone(false);
  }, []);

  const qualityCounts = useMemo(() => {
    const counts = { again: 0, hard: 0, good: 0, easy: 0 };
    sessionResults.forEach(r => { counts[r.quality]++; });
    return counts;
  }, [sessionResults]);

  const overdueCount = getOverduePages().length;

  if (revisionList.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
        <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: c.surface, borderBottomColor: c.border }]}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
            <ArrowLeft size={22} color={c.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: c.gold }]}>جلسة المراجعة</Text>
          <View style={styles.headerBtn} />
        </View>
        <View style={styles.emptyState}>
          <Trophy size={60} color={c.gold} />
          <Text style={[styles.emptyTitle, { color: c.text }]}>ما شاء الله!</Text>
          <Text style={[styles.emptyDesc, { color: c.textSecondary }]}>
            {filterMode === 'due'
              ? 'لا توجد مراجعات مستحقة الآن. تفقد لاحقاً!'
              : 'لا توجد صفحات في هذا التصنيف'}
          </Text>
          <TouchableOpacity
            style={[styles.changeFilterBtn, { backgroundColor: c.surfaceLight }]}
            onPress={() => setShowFilter(true)}
          >
            <Filter size={16} color={c.text} />
            <Text style={[styles.changeFilterText, { color: c.text }]}>تغيير الفلتر</Text>
          </TouchableOpacity>
        </View>

        {showFilter && <FilterSheet filterMode={filterMode} setFilterMode={setFilterMode} onClose={() => setShowFilter(false)} c={c} />}
      </View>
    );
  }

  if (sessionDone) {
    const total = sessionResults.length;
    const successRate = total > 0 ? Math.round(((qualityCounts.good + qualityCounts.easy) / total) * 100) : 0;
    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
        <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: c.surface, borderBottomColor: c.border }]}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
            <ArrowLeft size={22} color={c.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: c.gold }]}>انتهت الجلسة</Text>
          <View style={styles.headerBtn} />
        </View>
        <ScrollView contentContainerStyle={[styles.doneContainer, { paddingBottom: insets.bottom + 20 }]}>
          <Trophy size={70} color={c.gold} style={{ marginBottom: 16 }} />
          <Text style={[styles.doneTitle, { color: c.text }]}>أحسنت!</Text>
          <Text style={[styles.doneTotal, { color: c.textSecondary }]}>راجعت {total} صفحة</Text>

          <View style={[styles.doneStatsRow, { backgroundColor: c.surface }]}>
            <DoneStat label="مجدداً" value={qualityCounts.again} color="#F44336" c={c} />
            <DoneStat label="صعبة" value={qualityCounts.hard} color="#FF9800" c={c} />
            <DoneStat label="جيد" value={qualityCounts.good} color="#2196F3" c={c} />
            <DoneStat label="سهلة" value={qualityCounts.easy} color="#4CAF50" c={c} />
          </View>

          <View style={[styles.successRateCard, { backgroundColor: c.surface }]}>
            <Text style={[styles.successRateLabel, { color: c.textSecondary }]}>معدل النجاح</Text>
            <Text style={[styles.successRateValue, { color: successRate >= 70 ? '#4CAF50' : successRate >= 40 ? '#FF9800' : '#F44336' }]}>
              {successRate}%
            </Text>
            <View style={[styles.successBarBg, { backgroundColor: c.surfaceLight }]}>
              <View style={[styles.successBarFill, {
                backgroundColor: successRate >= 70 ? '#4CAF50' : successRate >= 40 ? '#FF9800' : '#F44336',
                width: `${successRate}%`
              }]} />
            </View>
            <Text style={[styles.successRateNote, { color: c.textSecondary }]}>
              {successRate >= 70 ? 'ممتاز! حفظك قوي' : successRate >= 40 ? 'جيد، استمر في المراجعة' : 'تحتاج مزيداً من التكرار'}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.restartBtn, { backgroundColor: c.gold }]}
            onPress={restartSession}
          >
            <RefreshCw size={18} color="#000" />
            <Text style={styles.restartBtnText}>جلسة جديدة</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: c.surfaceLight }]}
            onPress={() => router.back()}
          >
            <Text style={[styles.backBtnText, { color: c.text }]}>العودة</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: c.surface, borderBottomColor: c.border }]}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color={c.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: c.gold }]}>جلسة المراجعة</Text>
          <Text style={[styles.headerSub, { color: c.textSecondary }]}>
            {currentIndex + 1} / {revisionList.length}
          </Text>
        </View>
        <TouchableOpacity style={styles.headerBtn} onPress={() => setShowFilter(s => !s)}>
          <Filter size={22} color={c.text} />
        </TouchableOpacity>
      </View>

      {/* Progress */}
      <View style={[styles.progressBarBg, { backgroundColor: c.surfaceLight }]}>
        <View style={[styles.progressBarFill, { backgroundColor: c.gold, width: `${((currentIndex) / revisionList.length) * 100}%` }]} />
      </View>

      {/* Overdue Warning */}
      {overdueCount > 0 && filterMode !== 'due' && (
        <TouchableOpacity
          style={[styles.overdueWarning, { backgroundColor: '#FF980020' }]}
          onPress={() => setFilterMode('due')}
        >
          <Clock size={14} color="#FF9800" />
          <Text style={[styles.overdueText, { color: '#FF9800' }]}>{overdueCount} صفحة متأخرة في المراجعة • اضغط للتحويل</Text>
        </TouchableOpacity>
      )}

      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
        {/* Page Info */}
        <View style={[styles.pageInfoBar, { backgroundColor: c.surface }]}>
          <BookOpen size={14} color={c.textSecondary} />
          <Text style={[styles.pageInfoText, { color: c.text }]}>
            صفحة {currentRecord.pageNum} • {surah?.name} • الجزء {juz}
          </Text>
          {currentRecord.nextRevisionDue && (
            <View style={[styles.dueBadge, { backgroundColor: new Date(currentRecord.nextRevisionDue) < new Date() ? '#F4433620' : '#2196F320' }]}>
              <Text style={[styles.dueBadgeText, { color: new Date(currentRecord.nextRevisionDue) < new Date() ? '#F44336' : '#2196F3' }]}>
                {new Date(currentRecord.nextRevisionDue) < new Date() ? 'متأخرة' : 'مستحقة اليوم'}
              </Text>
            </View>
          )}
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

          {!showAnswer && (
            <TouchableOpacity
              style={[styles.showAnswerOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}
              onPress={() => setShowAnswer(true)}
            >
              <Text style={styles.showAnswerText}>اضغط لتقييم حفظك</Text>
              <Text style={styles.showAnswerSub}>هل تتذكر هذه الصفحة جيداً؟</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Rating Buttons */}
        {showAnswer ? (
          <View style={styles.qualitySection}>
            <Text style={[styles.qualityTitle, { color: c.textSecondary }]}>كيف كان حفظك لهذه الصفحة؟</Text>
            <View style={styles.qualityBtns}>
              {QUALITY_CONFIG.map(({ quality, label, icon: Icon, color, bg, desc }) => (
                <TouchableOpacity
                  key={quality}
                  style={[styles.qualityBtn, { backgroundColor: bg }]}
                  onPress={() => handleQuality(quality)}
                >
                  <Icon size={20} color={color} />
                  <Text style={[styles.qualityBtnLabel, { color }]}>{label}</Text>
                  <Text style={[styles.qualityBtnDesc, { color: c.textSecondary }]}>{desc}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.tapHintRow}>
            <Text style={[styles.tapHint, { color: c.textSecondary }]}>اضغط على الصفحة لتقييم حفظك</Text>
          </View>
        )}

        {/* Skip */}
        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
          <SkipForward size={14} color={c.textMuted} />
          <Text style={[styles.skipText, { color: c.textMuted }]}>تخطى</Text>
        </TouchableOpacity>

        {/* Session stats */}
        {sessionResults.length > 0 && (
          <View style={[styles.miniStats, { backgroundColor: c.surface }]}>
            <MiniStat label="مجدداً" value={qualityCounts.again} color="#F44336" c={c} />
            <MiniStat label="صعبة" value={qualityCounts.hard} color="#FF9800" c={c} />
            <MiniStat label="جيد" value={qualityCounts.good} color="#2196F3" c={c} />
            <MiniStat label="سهلة" value={qualityCounts.easy} color="#4CAF50" c={c} />
          </View>
        )}
      </ScrollView>

      {/* Filter Sheet */}
      {showFilter && <FilterSheet filterMode={filterMode} setFilterMode={(f) => { setFilterMode(f); restartSession(); }} onClose={() => setShowFilter(false)} c={c} />}
    </View>
  );
}

function FilterSheet({ filterMode, setFilterMode, onClose, c }: any) {
  const filters: { mode: FilterMode; label: string; desc: string }[] = [
    { mode: 'due', label: 'المراجعات المستحقة', desc: 'الصفحات التي حان وقت مراجعتها (تكرار متباعد)' },
    { mode: 'weak', label: 'الصفحات الضعيفة', desc: 'الصفحات التي قيّمتها بـ "صعبة" أو "مجدداً"' },
    { mode: 'all', label: 'كل المحفوظات', desc: 'مراجعة كل الصفحات المحفوظة' },
  ];
  return (
    <TouchableOpacity style={styles.filterOverlay} activeOpacity={1} onPress={onClose}>
      <View style={[styles.filterSheet, { backgroundColor: c.surface }]}>
        <Text style={[styles.filterTitle, { color: c.text }]}>اختر نوع المراجعة</Text>
        {filters.map(f => (
          <TouchableOpacity
            key={f.mode}
            style={[styles.filterOption, filterMode === f.mode && { backgroundColor: `${c.gold}20`, borderColor: c.gold, borderWidth: 1 }]}
            onPress={() => { setFilterMode(f.mode); onClose(); }}
          >
            <Text style={[styles.filterOptionLabel, { color: filterMode === f.mode ? c.gold : c.text }]}>{f.label}</Text>
            <Text style={[styles.filterOptionDesc, { color: c.textSecondary }]}>{f.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </TouchableOpacity>
  );
}

function MiniStat({ label, value, color, c }: any) {
  return (
    <View style={styles.miniStatItem}>
      <Text style={[styles.miniStatValue, { color }]}>{value}</Text>
      <Text style={[styles.miniStatLabel, { color: c.textSecondary }]}>{label}</Text>
    </View>
  );
}

function DoneStat({ label, value, color, c }: any) {
  return (
    <View style={styles.doneStatItem}>
      <Text style={[styles.doneStatValue, { color }]}>{value}</Text>
      <Text style={[styles.doneStatLabel, { color: c.textSecondary }]}>{label}</Text>
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
  progressBarBg: { height: 3 },
  progressBarFill: { height: '100%' },
  overdueWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  overdueText: { fontSize: 12 },
  scroll: { flex: 1 },
  pageInfoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  pageInfoText: { flex: 1, fontSize: 13 },
  dueBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  dueBadgeText: { fontSize: 10, fontWeight: '600' },
  imageContainer: {
    height: height * 0.42,
    backgroundColor: '#000',
    position: 'relative',
  },
  pageImage: { width: '100%', height: '100%' },
  showAnswerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  showAnswerText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  showAnswerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 6 },
  qualitySection: { padding: 12 },
  qualityTitle: { fontSize: 13, textAlign: 'center', marginBottom: 10 },
  qualityBtns: { flexDirection: 'row', gap: 8 },
  qualityBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 4,
  },
  qualityBtnLabel: { fontSize: 12, fontWeight: '700' },
  qualityBtnDesc: { fontSize: 9, textAlign: 'center' },
  tapHintRow: { alignItems: 'center', padding: 16 },
  tapHint: { fontSize: 13 },
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  skipText: { fontSize: 12 },
  miniStats: {
    flexDirection: 'row',
    marginHorizontal: 12,
    borderRadius: 12,
    padding: 10,
    marginTop: 4,
  },
  miniStatItem: { flex: 1, alignItems: 'center' },
  miniStatValue: { fontSize: 16, fontWeight: '800' },
  miniStatLabel: { fontSize: 10, marginTop: 2 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  emptyTitle: { fontSize: 22, fontWeight: '800' },
  emptyDesc: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  changeFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 8,
  },
  changeFilterText: { fontSize: 14, fontWeight: '600' },
  doneContainer: { alignItems: 'center', padding: 24, gap: 16 },
  doneTitle: { fontSize: 28, fontWeight: '800' },
  doneTotal: { fontSize: 15 },
  doneStatsRow: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 16,
    width: '100%',
  },
  doneStatItem: { flex: 1, alignItems: 'center' },
  doneStatValue: { fontSize: 22, fontWeight: '800' },
  doneStatLabel: { fontSize: 11, marginTop: 4 },
  successRateCard: { borderRadius: 16, padding: 16, width: '100%', alignItems: 'center', gap: 8 },
  successRateLabel: { fontSize: 13 },
  successRateValue: { fontSize: 42, fontWeight: '900' },
  successBarBg: { width: '100%', height: 8, borderRadius: 4, overflow: 'hidden' },
  successBarFill: { height: '100%', borderRadius: 4 },
  successRateNote: { fontSize: 13, textAlign: 'center' },
  restartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
    width: '100%',
    justifyContent: 'center',
  },
  restartBtnText: { fontSize: 16, fontWeight: '700', color: '#000' },
  backBtn: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  backBtnText: { fontSize: 15, fontWeight: '600' },
  filterOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  filterSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    gap: 10,
  },
  filterTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  filterOption: { borderRadius: 12, padding: 14 },
  filterOptionLabel: { fontSize: 14, fontWeight: '600' },
  filterOptionDesc: { fontSize: 12, marginTop: 3 },
});