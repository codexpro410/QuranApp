import { useRouter } from 'expo-router';
import {
  Bookmark, Book, Moon, MoreHorizontal, Save, Settings, Sun,
} from 'lucide-react-native';
import React, { memo } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

type Props = {
  visible: boolean;
  onClose: () => void;
  top: number;
};

const ITEMS = [
  { label: 'الأذكار', route: '/azkar', Icon: Moon },
  { label: 'الانتقال إلى صفحة', route: '/page-jump', Icon: Book },
  { label: 'الإعدادات', route: '/settings', Icon: Settings },
  { label: 'برنامج تحفيظ', route: '/hifz', Icon: Save },
  
] as const;

function MushafMenu({ visible, onClose, top }: Props) {
  const router = useRouter();
  const { mode, colors, toggleTheme } = useTheme();

  const go = (route: string) => {
    onClose();
    router.push(route as any);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={[styles.menu, { backgroundColor: colors.surface, top }]}>
          {ITEMS.map(({ label, route, Icon }) => (
            <TouchableOpacity
              key={route}
              style={[styles.item, { borderBottomColor: colors.border }]}
              onPress={() => go(route)}
            >
              <Icon size={20} color={colors.text} />
              <Text style={[styles.text, { color: colors.text }]}>{label}</Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={[styles.item, { borderBottomColor: colors.border }]}
            onPress={() => { onClose(); toggleTheme(); }}
          >
            {mode === 'dark' ? <Sun size={20} color={colors.text} /> : <Moon size={20} color={colors.text} />}
            <Text style={[styles.text, { color: colors.text }]}>
              {mode === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.item} onPress={() => go('/bookmarks')}>
            <Bookmark size={20} color={colors.text} />
            <Text style={[styles.text, { color: colors.text }]}>العلامات المرجعية</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.item} onPress={() => go('/more')}>
            <MoreHorizontal size={20} color={colors.text} />
            <Text style={[styles.text, { color: colors.text }]}>المزيد</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
}

export default memo(MushafMenu);

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  menu: {
    position: 'absolute', left: 16, borderRadius: 12,
    overflow: 'hidden', minWidth: 210,
    elevation: 5, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4,
  },
  item: {
    flexDirection: 'row', alignItems: 'center',
    gap: 12, padding: 16, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  text: { fontSize: 16 },
});
