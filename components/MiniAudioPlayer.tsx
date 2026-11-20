import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Modal,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Play, Pause, Square, SkipBack, SkipForward,
  Repeat, Repeat1, RefreshCw, ChevronUp, ChevronDown,
  Volume2,
} from 'lucide-react-native';
import { useAudio, useAudioProgress, SPEED_OPTIONS, SPEED_LABELS, PlaybackSpeed, RepeatMode } from '@/contexts/AudioContext';
import { useTheme } from '@/contexts/ThemeContext';
import { quranData } from '@/data/quranData';

const { width } = Dimensions.get('window');

function formatTime(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function RepeatIcon({ mode, color, size }: { mode: RepeatMode; color: string; size: number }) {
  if (mode === 'one') return <Repeat1 size={size} color={color} />;
  return <Repeat size={size} color={color} />;
}

interface MiniAudioPlayerProps {
  /** Called when user taps next/prev — you supply the logic based on surah list */
  onNext?: () => void;
  onPrev?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export default function MiniAudioPlayer({ onNext, onPrev, hasNext, hasPrev }: MiniAudioPlayerProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const {
    currentSurah,
    isPlaying,
    isLoading,
    playbackSpeed,
    repeatMode,
    pauseAudio,
    resumeAudio,
    seekTo,
    seekBy,
    stopAudio,
    setPlaybackSpeed,
    toggleRepeatMode,
    currentSheikhId,
  } = useAudio();
  const { progress, duration } = useAudioProgress();

  const [expanded, setExpanded] = useState(false);
  const [showSpeedModal, setShowSpeedModal] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekValue, setSeekValue] = useState(0);

  const surahName = currentSurah
    ? quranData.find(s => s.number === currentSurah)?.name ?? `سورة ${currentSurah}`
    : '';

  const progressPercent = duration > 0 ? progress / duration : 0;

  const handleSeekBarPress = useCallback((locationX: number, barWidth: number) => {
    const pct = Math.max(0, Math.min(1, locationX / barWidth));
    seekTo(pct * duration);
  }, [duration, seekTo]);

  const repeatColor = repeatMode !== 'none' ? colors.gold : colors.textSecondary;

  if (!currentSurah) return null;

  return (
    <>
      {/* ── Main Player Bar ── */}
      <View style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingBottom: insets.bottom + 4,
        }
      ]}>
        {/* Seek Bar — always visible at top of bar */}
        <TouchableOpacity
          activeOpacity={1}
          style={styles.seekTouchable}
          onPress={(e) => handleSeekBarPress(e.nativeEvent.locationX, width)}
        >
          <View style={[styles.seekTrack, { backgroundColor: colors.surfaceLight }]}>
            <View style={[styles.seekFill, { width: `${progressPercent * 100}%`, backgroundColor: colors.gold }]} />
            <View style={[
              styles.seekThumb,
              { left: `${progressPercent * 100}%`, backgroundColor: colors.gold }
            ]} />
          </View>
        </TouchableOpacity>

        {/* Collapsed Row */}
        <View style={styles.row}>
          {/* Left: surah info */}
          <TouchableOpacity style={styles.infoArea} onPress={() => setExpanded(e => !e)}>
            <View style={[styles.iconBadge, { backgroundColor: colors.gold + '20' }]}>
              <Volume2 size={16} color={colors.gold} />
            </View>
            <View style={styles.textBlock}>
              <Text style={[styles.surahName, { color: colors.text }]} numberOfLines={1}>{surahName}</Text>
              <Text style={[styles.timeText, { color: colors.textSecondary }]}>
                {formatTime(progress)} / {formatTime(duration)}
              </Text>
            </View>
            {expanded
              ? <ChevronDown size={16} color={colors.textSecondary} />
              : <ChevronUp size={16} color={colors.textSecondary} />}
          </TouchableOpacity>

          {/* Right: play controls */}
          <View style={styles.controls}>
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.gold} style={styles.controlBtn} />
            ) : (
              <TouchableOpacity
                style={[styles.controlBtn, styles.playBtn, { backgroundColor: colors.gold }]}
                onPress={() => isPlaying ? pauseAudio() : resumeAudio()}
              >
                {isPlaying
                  ? <Pause size={18} color="#fff" fill="#fff" />
                  : <Play size={18} color="#fff" fill="#fff" />}
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.controlBtn} onPress={stopAudio}>
              <Square size={18} color={colors.error} fill={colors.error} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Expanded Panel ── */}
        {expanded && (
          <View style={[styles.expandedPanel, { borderTopColor: colors.border }]}>
            {/* Skip buttons row */}
            <View style={styles.expandedRow}>
              {/* Prev */}
              <TouchableOpacity
                style={[styles.iconBtn, !hasPrev && styles.disabled]}
                onPress={onPrev}
                disabled={!hasPrev}
              >
                <SkipBack size={22} color={hasPrev ? colors.text : colors.textSecondary} />
              </TouchableOpacity>

              {/* -10s */}
              <TouchableOpacity style={styles.iconBtn} onPress={() => seekBy(-10)}>
                <View style={styles.seekBtnInner}>
                  <SkipBack size={18} color={colors.text} />
                  <Text style={[styles.seekBtnLabel, { color: colors.text }]}>10</Text>
                </View>
              </TouchableOpacity>

              {/* Play/Pause large */}
              <TouchableOpacity
                style={[styles.playLarge, { backgroundColor: colors.gold }]}
                onPress={() => isPlaying ? pauseAudio() : resumeAudio()}
              >
                {isLoading
                  ? <ActivityIndicator color="#fff" />
                  : isPlaying
                    ? <Pause size={26} color="#fff" fill="#fff" />
                    : <Play size={26} color="#fff" fill="#fff" />}
              </TouchableOpacity>

              {/* +10s */}
              <TouchableOpacity style={styles.iconBtn} onPress={() => seekBy(10)}>
                <View style={styles.seekBtnInner}>
                  <Text style={[styles.seekBtnLabel, { color: colors.text }]}>10</Text>
                  <SkipForward size={18} color={colors.text} />
                </View>
              </TouchableOpacity>

              {/* Next */}
              <TouchableOpacity
                style={[styles.iconBtn, !hasNext && styles.disabled]}
                onPress={onNext}
                disabled={!hasNext}
              >
                <SkipForward size={22} color={hasNext ? colors.text : colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Speed + Repeat */}
            <View style={styles.optionsRow}>
              {/* Repeat */}
              <TouchableOpacity
                style={[styles.optionBtn, { borderColor: colors.border }]}
                onPress={toggleRepeatMode}
              >
                <RepeatIcon mode={repeatMode} color={repeatColor} size={16} />
                <Text style={[styles.optionLabel, { color: repeatColor }]}>
                  {repeatMode === 'none' ? 'تكرار' : repeatMode === 'one' ? 'تكرار السورة' : 'تكرار الكل'}
                </Text>
              </TouchableOpacity>

              {/* Speed */}
              <TouchableOpacity
                style={[styles.optionBtn, { borderColor: colors.border }]}
                onPress={() => setShowSpeedModal(true)}
              >
                <RefreshCw size={14} color={colors.gold} />
                <Text style={[styles.optionLabel, { color: colors.gold }]}>
                  {SPEED_LABELS[playbackSpeed]}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* ── Speed Modal ── */}
      <Modal visible={showSpeedModal} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowSpeedModal(false)}>
          <View style={[styles.speedModal, { backgroundColor: colors.surface }]}>
            <Text style={[styles.speedTitle, { color: colors.text }]}>سرعة التشغيل</Text>
            {SPEED_OPTIONS.map(speed => (
              <TouchableOpacity
                key={speed}
                style={[
                  styles.speedRow,
                  { borderBottomColor: colors.border },
                  playbackSpeed === speed && { backgroundColor: colors.gold + '18' }
                ]}
                onPress={() => { setPlaybackSpeed(speed); setShowSpeedModal(false); }}
              >
                <Text style={[
                  styles.speedLabel,
                  { color: playbackSpeed === speed ? colors.gold : colors.text }
                ]}>
                  {SPEED_LABELS[speed]}
                </Text>
                {playbackSpeed === speed && (
                  <View style={[styles.speedDot, { backgroundColor: colors.gold }]} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 10,
  },
  seekTouchable: {
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  seekTrack: {
    height: 3,
    borderRadius: 2,
    marginHorizontal: 0,
    position: 'relative',
  },
  seekFill: {
    height: '100%',
    borderRadius: 2,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  seekThumb: {
    width: 12,
    height: 12,
    borderRadius: 6,
    position: 'absolute',
    top: -4.5,
    marginLeft: -6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 6,
    gap: 8,
  },
  infoArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    flex: 1,
  },
  surahName: {
    fontSize: 14,
    fontWeight: '700',
  },
  timeText: {
    fontSize: 11,
    marginTop: 1,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  controlBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  // Expanded
  expandedPanel: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 12,
  },
  expandedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.35,
  },
  seekBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },
  seekBtnLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  playLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  optionLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Speed modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  speedModal: {
    width: 220,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  speedTitle: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  speedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
  },
  speedLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  speedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});