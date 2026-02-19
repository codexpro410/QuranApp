import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MoreVertical, Bookmark } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import { getBookmarkColor } from "@/contexts/BookmarkContext";

type Props = {
  surahName: string;
  page: number;
  hasBookmark: boolean;
  onMenu: () => void;
  onBookmark: () => void;
};

export default function MushafHeader({
  surahName,
  page,
  hasBookmark,
  onMenu,
  onBookmark,
}: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.header,
        {
          paddingTop: insets.top + 8,
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
        },
      ]}
    >
      {/* Menu */}
      <TouchableOpacity onPress={onMenu} style={styles.iconBtn}>
        <MoreVertical size={24} color={colors.text} />
      </TouchableOpacity>

      {/* Center */}
      <View style={styles.center}>
        <Text style={[styles.title, { color: colors.gold }]} numberOfLines={1}>
          {surahName}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          صفحة {page}
        </Text>
      </View>

      {/* Bookmark */}
      <TouchableOpacity onPress={onBookmark} style={styles.iconBtn}>
        <Bookmark
          size={24}
          color={hasBookmark ? getBookmarkColor("read") : colors.text}
          fill={hasBookmark ? getBookmarkColor("read") : "transparent"}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  iconBtn: {
    padding: 6,
  },
  center: {
    alignItems: "center",
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
});
