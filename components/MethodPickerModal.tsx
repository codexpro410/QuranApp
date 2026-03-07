import { CALCULATION_METHODS } from '@/contexts/PrayerContext';
import { useTheme } from '@/contexts/ThemeContext';
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
  visible: boolean;
  selectedMethod: number;
  onSelect: (methodId: number) => void;
  onClose: () => void;
}

export default function MethodPickerModal({ visible, selectedMethod, onSelect, onClose }: Props) {
  const { colors } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>

          <Text style={[styles.title, { color: colors.text, borderBottomColor: colors.border }]}>
            طريقة الحساب
          </Text>

          {CALCULATION_METHODS.map((m, i) => (
            <TouchableOpacity
              key={m.id}
              style={[
                styles.row,
                { borderBottomColor: colors.border },
                i === CALCULATION_METHODS.length - 1 && { borderBottomWidth: 0 },
              ]}
              onPress={() => { onSelect(m.id); onClose(); }}
            >
              <Text style={[
                styles.label,
                { color: selectedMethod === m.id ? colors.gold : colors.text },
                selectedMethod === m.id && { fontWeight: '700' },
              ]}>
                {m.label}
              </Text>
              {selectedMethod === m.id && (
                <Text style={{ color: colors.gold, fontSize: 18 }}>✓</Text>
              )}
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={[styles.cancelBtn, { borderTopColor: colors.border }]}
            onPress={onClose}
          >
            <Text style={[styles.cancelText, { color: colors.textSecondary }]}>إلغاء</Text>
          </TouchableOpacity>

        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  sheet: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  label: { fontSize: 14, flex: 1, lineHeight: 20 },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  cancelText: { fontSize: 15 },
});