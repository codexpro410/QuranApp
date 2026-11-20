import { PageRecord, RevisionQuality, useHifz } from '@/contexts/HifzContext';
import { useTheme } from '@/contexts/ThemeContext';
import { PageTint } from '@/components/MushafPage';
import { getPageStyle } from '@/constants/pageStyles';
import { usePageColor } from '@/contexts/PageColorContext';
import { getPageSource, hasNightPages } from '@/data/mushafAssets';
import { getJuzByPage, getSurahByPage } from '@/data/quranData';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import SystemBars from '@/components/SystemBars';
import {
    AlertTriangle,
    ArrowLeft,
    BookOpen,
    BrainCircuit,
    Clock,
    Filter,
    Flame,
    RefreshCw,
    SkipForward,
    Target,
    ThumbsUp,
    Trophy,
    Zap
} from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

type FilterMode = 'due' | 'weak' | 'all';

const QUALITY_CONFIG = [
  { quality: 'again' as RevisionQuality, label: 'مجدداً', icon: RefreshCw, color: '#F44336', bg: '#F4433620', desc: 'لم أتذكرها' },
  { quality: 'hard' as RevisionQuality, label: 'صعبة', icon: AlertTriangle, color: '#FF9800', bg: '#FF980020', desc: 'تذكرتها بصعوبة' },
  { quality: 'good' as RevisionQuality, label: 'جيد', icon: ThumbsUp, color: '#2196F3', bg: '#2196F320', desc: 'تذكرتها بشكل معقول' },
  { quality: 'easy' as RevisionQuality, label: 'سهلة', icon: Zap, color: '#4CAF50', bg: '#4CAF5020', desc: 'حفظتها جيداً' },
];

const SPACED_REPETITION_INFO = [
  { title: "المراجعة المتباعدة", desc: "نظام ذكي يحدد موعد المراجعة بناءً على مدى إتقانك للصفحة." },
  { title: "ممتاز (بعد أسبوعين)", desc: "عندما تقرأ الصفحة دون أي خطأ أو تردد. سيزيد الفاصل الزمني للمراجعة القادمة." },
  { title: "جيد (بعد 3 أيام)", desc: "عندما تقرأ الصفحة مع بعض التردد المحدود أو خطأ واحد تداركته بسرعة." },
  { title: "صعب (غداً)", desc: "عندما تخطئ عدة أخطاء أو تتردد كثيراً. ستراجعها قريباً لتثبيتها." },
  { title: "نسيت (اليوم)", desc: "عندما تعجز عن تذكر الصفحة أو تخطئ في أكثر من سطر. تحتاج لمراجعتها فوراً." }
];

export default function ReviseScreen() {
  const { pageMode } = usePageColor();
  const pageStyle = getPageStyle(pageMode);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: c, mode } = useTheme();
  const { getPagesForRevision, getOverduePages, recordRevision, pages, getPageRecord, settings, stats, isLoaded } = useHifz();

  const [filterMode, setFilterMode] = useState<FilterMode>('due');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionResults, setSessionResults] = useState<{ page: number; quality: RevisionQuality }[]>([]);
  const [sessionDone, setSessionDone] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [showTips, setShowTips] = useState(false);

  // قائمة المراجعة تُؤخذ كلقطة ثابتة عند بدء الجلسة. لو كانت تُحسب مباشرة من الحالة لاختفت
  // الصفحة التي تمت مراجعتها من القائمة فور تقييمها، فيقفز المؤشر ويتخطى صفحة بعدها.
  const buildList = useCallback((fm: FilterMode): PageRecord[] => {
    if (fm === 'due') return getPagesForRevision();
    if (fm === 'weak') return Object.values(pages).filter(p => p.status === 'weak');
    return Object.values(pages).filter(p => p.status !== 'none').sort((a, b) => a.pageNum - b.pageNum);
  }, [getPagesForRevision, pages]);
  const buildListRef = useRef(buildList);
  buildListRef.current = buildList;

  const [revisionList, setRevisionList] = useState<PageRecord[]>([]);
  const [sessionKey, setSessionKey] = useState(0);

  useEffect(() => {
    if (!isLoaded) return;
    setRevisionList(buildListRef.current(filterMode));
    setCurrentIndex(0);
    setShowAnswer(false);
    setSessionResults([]);
    setSessionDone(false);
  }, [isLoaded, filterMode, sessionKey]);

  const currentRecord = revisionList[currentIndex];
  const pageImage = currentRecord ? getPageSource(currentRecord.pageNum, pageStyle.useNightImages) : null;
  const surah = currentRecord ? getSurahByPage(currentRecord.pageNum) : null;
  const juz = currentRecord ? getJuzByPage(currentRecord.pageNum) : null;

  const handleQuality = useCallback((quality: RevisionQuality) => {
    if (!currentRecord) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentIndex >= revisionList.length - 1) {
      setSessionDone(true);
    } else {
      setCurrentIndex(i => i + 1);
      setShowAnswer(false);
    }
  }, [currentIndex, revisionList]);

  const restartSession = useCallback(() => setSessionKey(k => k + 1), []);

  const qualityCounts = useMemo(() => {
    const counts = { again: 0, hard: 0, good: 0, easy: 0 };
    sessionResults.forEach(r => { counts[r.quality]++; });
    return counts;
  }, [sessionResults]);

  const overdueCount = getOverduePages().length;

  if (revisionList.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <SystemBars light={mode === 'dark'} />
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
        <SystemBars light={mode === 'dark'} />
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
      <SystemBars light={mode === 'dark'} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: c.surface, borderBottomColor: c.border }]}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color={c.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: c.gold }]}>جلسة المراجعة</Text>
          <View style={styles.streakBadge}>
            <Flame size={14} color="#FF9800" />
            <Text style={[styles.streakText, { color: '#FF9800' }]}>{stats.currentStreak} يوم</Text>
          </View>
        </View>
        <View style={styles.headerRightActions}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => setShowTips(true)}>
            <BrainCircuit size={22} color={c.gold} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={() => setShowFilter(s => !s)}>
            <Filter size={22} color={c.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress towards daily goal */}
      {settings.dailyReviseTarget > 0 && (
        <View style={[styles.goalBar, { backgroundColor: c.surfaceLight }]}>
          <View style={[styles.goalFill, { backgroundColor: c.success, width: `${Math.min(100, (stats.todayRevised / settings.dailyReviseTarget) * 100)}%` }]} />
          <View style={styles.goalTextWrap}>
            <Target size={12} color={c.textSecondary} />
            <Text style={[styles.goalText, { color: c.textSecondary }]}>
              الهدف اليومي: {stats.todayRevised} / {settings.dailyReviseTarget} صفحة
            </Text>
          </View>
        </View>
      )}

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
        <View style={[styles.imageContainer, { backgroundColor: pageStyle.useNightImages && hasNightPages ? '#000' : '#fff', isolation: 'isolate' }]}>
          {pageImage && (
            <Image
              source={pageImage}
              style={styles.pageImage}
              contentFit="contain"
              cachePolicy="memory-disk"
            />
          )}
          <PageTint pageMode={pageMode} nightMissing={pageStyle.useNightImages && !hasNightPages} />

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
      {showFilter && <FilterSheet filterMode={filterMode} setFilterMode={setFilterMode} onClose={() => setShowFilter(false)} c={c} />}

      {/* Spaced Repetition Info Modal */}
      {showTips && (
        <TouchableOpacity style={styles.tipsOverlay} activeOpacity={1} onPress={() => setShowTips(false)}>
          <View style={[styles.tipsSheet, { backgroundColor: c.surface, paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.tipsHeader}>
              <BrainCircuit size={24} color={c.gold} />
              <Text style={[styles.tipsTitle, { color: c.text }]}>نظام المراجعة المتباعدة</Text>
            </View>
            <ScrollView style={styles.tipsList} showsVerticalScrollIndicator={false}>
              {SPACED_REPETITION_INFO.map((tip, i) => (
                <View key={i} style={[styles.tipItem, { borderBottomColor: c.border }]}>
                  <Text style={[styles.tipNumber, { color: c.gold }]}>{i === 0 ? 'ℹ️' : i}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.tipTitleText, { color: c.text }]}>{tip.title}</Text>
                    <Text style={[styles.tipDescText, { color: c.textSecondary }]}>{tip.desc}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity style={[styles.tipsCloseBtn, { backgroundColor: c.surfaceLight }]} onPress={() => setShowTips(false)}>
              <Text style={[styles.tipsCloseBtnText, { color: c.text }]}>حسناً، فهمت</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}
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
  headerRightActions: { flexDirection: 'row', alignItems: 'center' },
  streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  streakText: { fontSize: 12, fontWeight: '700' },
  goalBar: {
    height: 24,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalFill: { position: 'absolute', left: 0, top: 0, bottom: 0, opacity: 0.3 },
  goalTextWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  goalText: { fontSize: 11, fontWeight: '600', zIndex: 1 },
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
  tipsOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end',
  },
  tipsSheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, maxHeight: height * 0.7,
  },
  tipsHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  tipsTitle: { fontSize: 18, fontWeight: '700' },
  tipsList: { flexShrink: 1, marginBottom: 16 },
  tipItem: {
    flexDirection: 'row', gap: 12, paddingVertical: 12,
    borderBottomWidth: 1, alignItems: 'flex-start',
  },
  tipNumber: { fontSize: 16, fontWeight: '800', width: 20, textAlign: 'center' },
  tipTitleText: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  tipDescText: { fontSize: 13, lineHeight: 20 },
  tipsCloseBtn: { padding: 16, borderRadius: 12, alignItems: 'center' },
  tipsCloseBtnText: { fontSize: 15, fontWeight: '700' },
});