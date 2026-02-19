import React from "react";
import { View, Text, StyleSheet, Modal, Pressable, TouchableOpacity } from "react-native";
import { Settings, Sun, Moon, Bookmark } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function MenuModal({ visible, onClose }: Props) {
  const router = useRouter();
  const { mode, colors, toggleTheme } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={[styles.menuContainer, { backgroundColor: colors.surface }]}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => { onClose(); router.push("/settings"); }}
          >
            <Settings size={20} color={colors.text} />
            <Text style={[styles.menuText, { color: colors.text }]}>الإعدادات</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => { onClose(); toggleTheme(); }}
          >
            {mode === "dark"
              ? <Sun size={20} color={colors.text} />
              : <Moon size={20} color={colors.text} />
            }
            <Text style={[styles.menuText, { color: colors.text }]}>
              {mode === "dark" ? "الوضع الفاتح" : "الوضع الداكن"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => { onClose(); router.push("/bookmarks"); }}
          >
            <Bookmark size={20} color={colors.text} />
            <Text style={[styles.menuText, { color: colors.text }]}>العلامات المرجعية</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  menuContainer: {
    position: "absolute",
    left: 16,
    top: 100,
    borderRadius: 12,
    padding: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
  },
  menuText: { fontSize: 16 },
});
