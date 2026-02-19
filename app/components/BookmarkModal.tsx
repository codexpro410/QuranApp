import React from "react";
import { View, Text, StyleSheet, Modal, Pressable, TouchableOpacity } from "react-native";
import { X } from "lucide-react-native";
import { useTheme } from "@/contexts/ThemeContext";
import {
  BookmarkType,
  getBookmarkLabel,
} from "@/contexts/BookmarkContext";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (type: BookmarkType) => void;
  onRemove?: () => void;
  hasBookmark: boolean;
};

export default function BookmarkModal({
  visible,
  onClose,
  onSelect,
  onRemove,
  hasBookmark,
}: Props) {
  const { colors } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>إضافة علامة</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.options}>
            <TouchableOpacity onPress={() => onSelect("read")}>
              <Text style={styles.optionText}>📖 {getBookmarkLabel("read")}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => onSelect("review")}>
              <Text style={styles.optionText}>🔁 {getBookmarkLabel("review")}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => onSelect("memorize")}>
              <Text style={styles.optionText}>🧠 {getBookmarkLabel("memorize")}</Text>
            </TouchableOpacity>
          </View>

          {hasBookmark && onRemove && (
            <TouchableOpacity onPress={onRemove}>
              <Text style={[styles.removeText, { color: colors.error }]}>
                إزالة العلامة الحالية
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { fontSize: 18, fontWeight: "700" },
  options: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 20,
  },
  optionText: { fontSize: 16 },
  removeText: {
    textAlign: "center",
    fontSize: 16,
    marginTop: 10,
  },
});
