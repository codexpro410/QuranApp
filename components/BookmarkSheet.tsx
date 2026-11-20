import { Bookmark, X } from 'lucide-react-native';
import React, { memo } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BookmarkType, getBookmarkColor, getBookmarkLabel } from '@/contexts/BookmarkContext';
import { useTheme } from '@/contexts/ThemeContext';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (type: BookmarkType) => void;
  onRemove: () => void;
  hasBookmark: boolean;
  bottomInset: number;
};

const TYPES: BookmarkType[] = ['read', 'review', 'memorize'];

function BookmarkSheet({ visible, onClose, onSelect, onRemove, hasBookmark, bottomInset }: Props) {
  const { colors } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        {/* Pressable داخلي لمنع إغلاق النافذة عند الضغط داخلها */}
        <Pressable
          style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: bottomInset + 20 }]}
          onPress={() => {}}
        >
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>إضافة علامة</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.options}>
            {TYPES.map(type => {
              const color = getBookmarkColor(type);
              return (
                <TouchableOpacity
                  key={type}
                  style={[styles.option, { backgroundColor: color + '26', borderColor: color }]}
                  onPress={() => onSelect(type)}
                >
                  <Bookmark size={28} color={color} fill={color} />
                  <Text style={[styles.optionText, { color }]}>{getBookmarkLabel(type)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {hasBookmark && (
            <TouchableOpacity style={[styles.remove, { borderColor: colors.error }]} onPress={onRemove}>
              <Text style={[styles.removeText, { color: colors.error }]}>إزالة العلامة الحالية</Text>
            </TouchableOpacity>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default memo(BookmarkSheet);

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 20, borderBottomWidth: 1,
  },
  title: { fontSize: 18, fontWeight: '700' },
  options: { flexDirection: 'row', justifyContent: 'space-around', padding: 20 },
  option: { alignItems: 'center', padding: 20, borderRadius: 16, borderWidth: 2, minWidth: 90 },
  optionText: { marginTop: 8, fontSize: 14, fontWeight: '600' },
  remove: {
    marginHorizontal: 20, marginBottom: 20,
    padding: 16, borderRadius: 12, borderWidth: 1, alignItems: 'center',
  },
  removeText: { fontSize: 16, fontWeight: '600' },
});
