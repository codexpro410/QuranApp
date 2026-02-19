import React, { useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Volume2, Pause, Play, Square } from "lucide-react-native";
import { useAudio } from "@/contexts/AudioContext";
import { quranData } from "@/data/quranData";
import { useTheme } from "@/contexts/ThemeContext";

type Props = {
  bottomInset: number;
};

export default function AudioPlayerBar({ bottomInset }: Props) {
  const { colors } = useTheme();

  const {
    currentSurah: playingSurahNumber,
    isPlaying,
    progress,
    duration,
    pauseAudio,
    resumeAudio,
    stopAudio,
  } = useAudio();

  const playingSurahData = playingSurahNumber
    ? quranData.find(s => s.number === playingSurahNumber)
    : null;

  const formatTime = useCallback((ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }, []);

  if (!playingSurahNumber) return null;

  return (
    <View style={[
      styles.audioPlayerBar,
      {
        backgroundColor: colors.surface,
        borderTopColor: colors.border,
        bottom: bottomInset + 70,
      },
    ]}>
      <View style={styles.audioPlayerContent}>
        <View style={styles.audioPlayerLeft}>
          <Volume2 size={18} color={colors.gold} />
          <View style={styles.audioPlayerInfo}>
            <Text style={[styles.audioPlayerTitle, { color: colors.text }]}>
              {playingSurahData?.name || `سورة ${playingSurahNumber}`}
            </Text>
            <Text style={[styles.audioPlayerTime, { color: colors.textSecondary }]}>
              {formatTime(progress)} / {formatTime(duration)}
            </Text>
          </View>
        </View>

        <View style={styles.audioPlayerControls}>
          <TouchableOpacity onPress={() => isPlaying ? pauseAudio() : resumeAudio()}>
            {isPlaying
              ? <Pause size={22} color={colors.gold} />
              : <Play size={22} color={colors.gold} />
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={stopAudio}>
            <Square size={18} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  audioPlayerBar: {
    position: "absolute",
    left: 0,
    right: 0,
    borderTopWidth: 1,
    padding: 12,
  },
  audioPlayerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  audioPlayerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  audioPlayerInfo: { flex: 1 },
  audioPlayerTitle: { fontSize: 14, fontWeight: "600" },
  audioPlayerTime: { fontSize: 11 },
  audioPlayerControls: {
    flexDirection: "row",
    gap: 12,
  },
});
