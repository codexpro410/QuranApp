import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
  Pressable,
  TextInput,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Brain,
  RefreshCw,
  TrendingUp,
  Target,
  Flame,
  Award,
  ChevronRight,
  Calendar,
  Settings2,
  BookOpen,
  Zap,
  AlertCircle,
  CheckCircle2,
  Circle,
  Star,
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/contexts/ThemeContext';
import { useHifz, JUZ_PAGES } from '@/contexts/HifzContext';

const { width } = Dimensions.get('window');

const JUZ_NAMES = [
  'الجزء الأول', 'الجزء الثاني', 'الجزء الثالث', 'الجزء الرابع', 'الجزء الخامس',
  'الجزء السادس', 'الجزء السابع', 'الجزء الثامن', 'الجزء التاسع', 'الجزء العاشر',
  'الجزء الحادي عشر', 'الجزء الثاني عشر', 'الجزء الثالث عشر', 'الجزء الرابع عشر', 'الجزء الخامس عشر',
  'الجزء السادس عشر', 'الجزء السابع عشر', 'الجزء الثامن عشر', 'الجزء التاسع عشر', 'الجزء العشرون',
  'الجزء الحادي والعشرون', 'الجزء الثاني والعشرون', 'الجزء الثالث والعشرون', 'الجزء الرابع والعشرون', 'الجزء الخامس والعشرون',
  'الجزء السادس والعشرون', 'الجزء السابع والعشرون', 'الجزء الثامن والعشرون', 'الجزء التاسع والعشرون', 'الجزء الثلاثون',
];

export default function HifzScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, mode } = useTheme();
  const { stats, settings, updateSettings, getJuzProgress, getPagesForRevision, getOverduePages, resetAll } = useHifz();

  const [activeTab, setActiveTab] = useState<'overview' | 'juz' | 'settings'>('overview');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [memorizeTarget, setMemorizeTarget] = useState(settings.dailyMemorizeTarget.toString());
  const [reviseTarget, setReviseTarget] = useState(settings.dailyReviseTarget.toString());

  const overduePages = getOverduePages();
  const revisionPages = getPagesForRevision();

  const saveSettings = useCallback(() => {
    const mt = parseInt(memorizeTarget) || 1;
    const rt = parseInt(reviseTarget) || 5;
    updateSettings({ dailyMemorizeTarget: mt, dailyReviseTarget: rt });
    setShowSettingsModal(false);
  }, [memorizeTarget, reviseTarget, updateSettings]);

  const handleReset = useCallback(() => {
    Alert.alert(
      'تأكيد الحذف',
      'هل أنت متأكد أنك تريد حذف كل بيانات الحفظ؟ لا يمكن التراجع عن هذا الإجراء.',
      [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'حذف الكل', style: 'destructive', onPress: resetAll },
      ]
    );
  }, [resetAll]);

  const c = colors;

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: c.surface, borderBottomColor: c.border }]}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color={c.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: c.gold }]}>خطة الحفظ والمراجعة</Text>
        <TouchableOpacity style={styles.headerBtn} onPress={() => setShowSettingsModal(true)}>
          <Settings2 size={22} color={c.text} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={[styles.tabBar, { backgroundColor: c.surface, borderBottomColor: c.border }]}>
        {(['overview', 'juz', 'settings'] as const).map(tab => {
          const labels = { overview: 'نظرة عامة', juz: 'الأجزاء', settings: 'الإعداد' };
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && { borderBottomColor: c.gold, borderBottomWidth: 2 }]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, { color: activeTab === tab ? c.gold : c.textSecondary }]}>
                {labels[tab]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
        {activeTab === 'overview' && (
          <>
            {/* Progress Ring */}
            <View style={[styles.progressCard, { backgroundColor: c.surface }]}>
              <View style={styles.progressRingContainer}>
                <View style={[styles.progressRing, { borderColor: c.border }]}>
                  <View style={[styles.progressFill, {
                    borderColor: c.gold,
                    // Simulate arc — using opacity trick
                  }]} />
                  <View style={styles.progressCenter}>
                    <Text style={[styles.progressPercent, { color: c.gold }]}>{stats.percentComplete}%</Text>
                    <Text style={[styles.progressLabel, { color: c.textSecondary }]}>مكتمل</Text>
                  </View>
                </View>
                <View style={styles.progressStats}>
                  <Text style={[styles.progressStatValue, { color: c.text }]}>{stats.totalMemorized}</Text>
                  <Text style={[styles.progressStatLabel, { color: c.textSecondary }]}>صفحة محفوظة</Text>
                  <Text style={[styles.progressStatValue, { color: c.text, marginTop: 8 }]}>{604 - stats.totalMemorized}</Text>
                  <Text style={[styles.progressStatLabel, { color: c.textSecondary }]}>متبقي</Text>
                </View>
              </View>

              {/* Progress bar */}
              <View style={[styles.progressBarBg, { backgroundColor: c.surfaceLight }]}>
                <View style={[styles.progressBarFill, { backgroundColor: c.gold, width: `${stats.percentComplete}%` }]} />
              </View>

              {stats.estimatedCompletionDate && (
                <View style={styles.estimateRow}>
                  <Calendar size={14} color={c.textSecondary} />
                  <Text style={[styles.estimateText, { color: c.textSecondary }]}>
                    تقدير الإتمام: {stats.estimatedCompletionDate}
                  </Text>
                </View>
              )}
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <StatCard icon={<Flame size={22} color="#FF6B35" />} value={stats.currentStreak.toString()} label="سلسلة اليوم" sub={`أفضل: ${stats.longestStreak}`} bg="#FF6B3515" c={c} />
              <StatCard icon={<Star size={22} color={c.gold} />} value={stats.totalStrong.toString()} label="قوي" sub="صفحة" bg={`${c.gold}15`} c={c} />
              <StatCard icon={<AlertCircle size={22} color="#FF9800" />} value={stats.totalWeak.toString()} label="يحتاج مراجعة" sub="صفحة" bg="#FF980015" c={c} />
              <StatCard icon={<Target size={22} color={c.success} />} value={stats.completedJuzs.length.toString()} label="جزء مكتمل" sub="من 30" bg={`${c.success}15`} c={c} />
            </View>

            {/* Today */}
            <View style={[styles.todayCard, { backgroundColor: c.surface }]}>
              <Text style={[styles.sectionTitle, { color: c.text }]}>اليوم</Text>
              <View style={styles.todayRow}>
                <TodayProgress
                  label="حفظ"
                  done={stats.todayMemorized}
                  target={settings.dailyMemorizeTarget}
                  color={c.gold}
                  c={c}
                />
                <TodayProgress
                  label="مراجعة"
                  done={stats.todayRevised}
                  target={settings.dailyReviseTarget}
                  color="#2196F3"
                  c={c}
                />
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: c.gold }]}
                onPress={() => router.push('/memorize' as any)}
              >
                <Brain size={20} color="#000" />
                <Text style={[styles.actionBtnText, { color: '#000' }]}>جلسة حفظ</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#2196F3' }]}
                onPress={() => router.push('/revise' as any)}
              >
                <RefreshCw size={20} color="#fff" />
                <View>
                  <Text style={[styles.actionBtnText, { color: '#fff' }]}>جلسة مراجعة</Text>
                  {overduePages.length > 0 && (
                    <Text style={styles.overdueBadgeText}>{overduePages.length} متأخر</Text>
                  )}
                </View>
              </TouchableOpacity>
            </View>

            {/* Revision Queue */}
            {revisionPages.length > 0 && (
              <View style={[styles.queueCard, { backgroundColor: c.surface }]}>
                <View style={styles.queueHeader}>
                  <View style={styles.row}>
                    <BookOpen size={18} color="#2196F3" />
                    <Text style={[styles.sectionTitle, { color: c.text, marginLeft: 8 }]}>قائمة المراجعة</Text>
                  </View>
                  <Text style={[styles.queueCount, { color: '#2196F3' }]}>{revisionPages.length} صفحة</Text>
                </View>
                <Text style={[styles.queueSub, { color: c.textSecondary }]}>
                  {overduePages.length > 0
                    ? `${overduePages.length} صفحات متأخرة في المراجعة`
                    : 'كل المراجعات في موعدها ✓'}
                </Text>
              </View>
            )}
          </>
        )}

        {activeTab === 'juz' && (
          <View style={styles.juzList}>
            {JUZ_NAMES.map((name, i) => {
              const juzNum = i + 1;
              const prog = getJuzProgress(juzNum);
              const isComplete = prog.percent === 100;
              return (
                <View key={juzNum} style={[styles.juzItem, { backgroundColor: c.surface }]}>
                  <View style={styles.juzLeft}>
                    <View style={[styles.juzNumBadge, { backgroundColor: isComplete ? c.gold : c.surfaceLight }]}>
                      {isComplete
                        ? <CheckCircle2 size={16} color="#000" />
                        : <Text style={[styles.juzNum, { color: c.textSecondary }]}>{juzNum}</Text>
                      }
                    </View>
                    <View>
                      <Text style={[styles.juzName, { color: c.text }]}>{name}</Text>
                      <Text style={[styles.juzPages, { color: c.textSecondary }]}>
                        {JUZ_PAGES[i][0]}–{JUZ_PAGES[i][1]} • {prog.memorized}/{prog.total} صفحة
                      </Text>
                    </View>
                  </View>
                  <View style={styles.juzRight}>
                    <Text style={[styles.juzPercent, { color: isComplete ? c.gold : c.text }]}>{prog.percent}%</Text>
                    <View style={[styles.juzBarBg, { backgroundColor: c.surfaceLight }]}>
                      <View style={[styles.juzBarFill, {
                        backgroundColor: isComplete ? c.gold : '#2196F3',
                        width: `${prog.percent}%`
                      }]} />
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {activeTab === 'settings' && (
          <View style={styles.settingsSection}>
            <View style={[styles.settingsCard, { backgroundColor: c.surface }]}>
              <Text style={[styles.sectionTitle, { color: c.text }]}>الأهداف اليومية</Text>

              <View style={styles.settingRow}>
                <View style={styles.settingLabel}>
                  <Brain size={18} color={c.gold} />
                  <Text style={[styles.settingText, { color: c.text }]}>هدف الحفظ (صفحات/يوم)</Text>
                </View>
                <View style={styles.counter}>
                  <TouchableOpacity
                    style={[styles.counterBtn, { backgroundColor: c.surfaceLight }]}
                    onPress={() => updateSettings({ dailyMemorizeTarget: Math.max(1, settings.dailyMemorizeTarget - 1) })}
                  >
                    <Text style={[styles.counterBtnText, { color: c.text }]}>−</Text>
                  </TouchableOpacity>
                  <Text style={[styles.counterValue, { color: c.gold }]}>{settings.dailyMemorizeTarget}</Text>
                  <TouchableOpacity
                    style={[styles.counterBtn, { backgroundColor: c.surfaceLight }]}
                    onPress={() => updateSettings({ dailyMemorizeTarget: settings.dailyMemorizeTarget + 1 })}
                  >
                    <Text style={[styles.counterBtnText, { color: c.text }]}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: c.border }]} />

              <View style={styles.settingRow}>
                <View style={styles.settingLabel}>
                  <RefreshCw size={18} color="#2196F3" />
                  <Text style={[styles.settingText, { color: c.text }]}>هدف المراجعة (صفحات/يوم)</Text>
                </View>
                <View style={styles.counter}>
                  <TouchableOpacity
                    style={[styles.counterBtn, { backgroundColor: c.surfaceLight }]}
                    onPress={() => updateSettings({ dailyReviseTarget: Math.max(1, settings.dailyReviseTarget - 1) })}
                  >
                    <Text style={[styles.counterBtnText, { color: c.text }]}>−</Text>
                  </TouchableOpacity>
                  <Text style={[styles.counterValue, { color: '#2196F3' }]}>{settings.dailyReviseTarget}</Text>
                  <TouchableOpacity
                    style={[styles.counterBtn, { backgroundColor: c.surfaceLight }]}
                    onPress={() => updateSettings({ dailyReviseTarget: settings.dailyReviseTarget + 1 })}
                  >
                    <Text style={[styles.counterBtnText, { color: c.text }]}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={[styles.settingsCard, { backgroundColor: c.surface }]}>
              <Text style={[styles.sectionTitle, { color: c.text }]}>إحصائيات</Text>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: c.textSecondary }]}>إجمالي الصفحات المحفوظة</Text>
                <Text style={[styles.infoValue, { color: c.text }]}>{stats.totalMemorized} / 604</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: c.textSecondary }]}>الصفحات القوية</Text>
                <Text style={[styles.infoValue, { color: c.success }]}>{stats.totalStrong}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: c.textSecondary }]}>تحتاج مراجعة</Text>
                <Text style={[styles.infoValue, { color: '#FF9800' }]}>{stats.totalWeak}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: c.textSecondary }]}>الأجزاء المكتملة</Text>
                <Text style={[styles.infoValue, { color: c.gold }]}>{stats.completedJuzs.length} / 30</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.dangerBtn, { borderColor: c.error }]}
              onPress={handleReset}
            >
              <Text style={[styles.dangerBtnText, { color: c.error }]}>إعادة تعيين كل البيانات</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function StatCard({ icon, value, label, sub, bg, c }: any) {
  return (
    <View style={[styles.statCard, { backgroundColor: c.surface }]}>
      <View style={[styles.statIcon, { backgroundColor: bg }]}>{icon}</View>
      <Text style={[styles.statValue, { color: c.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: c.textSecondary }]}>{label}</Text>
      <Text style={[styles.statSub, { color: c.textMuted }]}>{sub}</Text>
    </View>
  );
}

function TodayProgress({ label, done, target, color, c }: any) {
  const percent = Math.min(100, Math.round((done / target) * 100));
  return (
    <View style={styles.todayProgressItem}>
      <Text style={[styles.todayLabel, { color: c.textSecondary }]}>{label}</Text>
      <Text style={[styles.todayValue, { color: c.text }]}>{done}<Text style={[styles.todayTarget, { color: c.textSecondary }]}>/{target}</Text></Text>
      <View style={[styles.todayBarBg, { backgroundColor: c.surfaceLight }]}>
        <View style={[styles.todayBarFill, { backgroundColor: color, width: `${percent}%` }]} />
      </View>
      <Text style={[styles.todayPercent, { color }]}>{percent}%</Text>
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
  headerTitle: { fontSize: 18, fontWeight: '700' },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  tabText: { fontSize: 14, fontWeight: '600' },
  scroll: { flex: 1 },
  progressCard: {
    margin: 16,
    borderRadius: 20,
    padding: 20,
  },
  progressRingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressRing: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
  },
  progressFill: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 10,
    borderColor: 'transparent',
  },
  progressCenter: { alignItems: 'center' },
  progressPercent: { fontSize: 24, fontWeight: '800' },
  progressLabel: { fontSize: 11, marginTop: 2 },
  progressStats: { flex: 1 },
  progressStatValue: { fontSize: 22, fontWeight: '700' },
  progressStatLabel: { fontSize: 12 },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  estimateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  estimateText: { fontSize: 12 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 8,
  },
  statCard: {
    width: (width - 40) / 2,
    borderRadius: 16,
    padding: 16,
    alignItems: 'flex-start',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statValue: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  statSub: { fontSize: 11, marginTop: 2 },
  todayCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  todayRow: { flexDirection: 'row', gap: 16 },
  todayProgressItem: { flex: 1 },
  todayLabel: { fontSize: 12, marginBottom: 4 },
  todayValue: { fontSize: 22, fontWeight: '800' },
  todayTarget: { fontSize: 14, fontWeight: '400' },
  todayBarBg: { height: 6, borderRadius: 3, overflow: 'hidden', marginTop: 6 },
  todayBarFill: { height: '100%', borderRadius: 3 },
  todayPercent: { fontSize: 12, fontWeight: '600', marginTop: 4 },
  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
  },
  actionBtnText: { fontSize: 16, fontWeight: '700' },
  overdueBadgeText: { fontSize: 11, color: '#fff', opacity: 0.8 },
  queueCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
  },
  queueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  queueCount: { fontSize: 14, fontWeight: '700' },
  queueSub: { fontSize: 13 },
  juzList: { padding: 16, gap: 8 },
  juzItem: {
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  juzLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  juzNumBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  juzNum: { fontSize: 13, fontWeight: '700' },
  juzName: { fontSize: 13, fontWeight: '600' },
  juzPages: { fontSize: 11, marginTop: 2 },
  juzRight: { alignItems: 'flex-end', minWidth: 60 },
  juzPercent: { fontSize: 13, fontWeight: '700', marginBottom: 4 },
  juzBarBg: { width: 60, height: 5, borderRadius: 3, overflow: 'hidden' },
  juzBarFill: { height: '100%', borderRadius: 3 },
  settingsSection: { padding: 16, gap: 16 },
  settingsCard: { borderRadius: 16, padding: 16 },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingLabel: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  settingText: { fontSize: 14 },
  counter: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  counterBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterBtnText: { fontSize: 18, fontWeight: '700' },
  counterValue: { fontSize: 18, fontWeight: '800', minWidth: 30, textAlign: 'center' },
  divider: { height: 1, marginVertical: 8 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  infoLabel: { fontSize: 13 },
  infoValue: { fontSize: 13, fontWeight: '700' },
  dangerBtn: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  dangerBtnText: { fontSize: 14, fontWeight: '600' },
});