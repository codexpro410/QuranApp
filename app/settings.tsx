import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X, Moon, Sun, Info } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/contexts/ThemeContext';

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mode, colors, toggleTheme } = useTheme();

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={[styles.closeButton, { backgroundColor: colors.surface }]} onPress={() => router.back()}>
          <X size={22} color={colors.text} />
        </TouchableOpacity>

        <Text style={[styles.headerText, { color: colors.text }]}>الإعدادات</Text>

        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>المظهر</Text>
        
        <TouchableOpacity
          style={[styles.settingItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={toggleTheme}
          activeOpacity={0.8}
        >
          <View style={[styles.settingIcon, { backgroundColor: colors.surfaceLight }]}>
            {mode === 'dark' ? <Sun size={22} color={colors.gold} /> : <Moon size={22} color={colors.gold} />}
          </View>
          <View style={styles.settingContent}>
            <Text style={[styles.settingTitle, { color: colors.text }]}>الوضع الليلي</Text>
            <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
              {mode === 'dark' ? 'مفعّل' : 'غير مفعّل'}
            </Text>
          </View>
          <View style={[styles.toggle, { backgroundColor: mode === 'dark' ? colors.gold : colors.surfaceLight }]}>
            <View style={[
              styles.toggleIndicator, 
              { backgroundColor: colors.background },
              mode === 'dark' && styles.toggleIndicatorActive
            ]} />
          </View>
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: 24 }]}>حول التطبيق</Text>

        <View style={[styles.settingItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.settingIcon, { backgroundColor: colors.surfaceLight }]}>
            <Info size={22} color={colors.gold} />
          </View>
          <View style={styles.settingContent}>
            <Text style={[styles.settingTitle, { color: colors.text }]}>الإصدار</Text>
            <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>1.0.0</Text>
          </View>
        </View>

        <View style={[styles.aboutCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.aboutTitle, { color: colors.gold }]}>تطبيق القرآن الكريم</Text>
          <Text style={[styles.aboutText, { color: colors.textSecondary }]}>
            تطبيق شامل لقراءة القرآن الكريم مع التفسير والأذكار والسبحة الإلكترونية.
          </Text>
          <Text style={[styles.aboutText, { color: colors.textSecondary, marginTop: 12 }]}>
            نسأل الله أن يجعله في ميزان حسناتنا وحسناتكم.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '700',
  },
  placeholder: {
    width: 40,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    marginLeft: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  settingIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingContent: {
    flex: 1,
    marginHorizontal: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  settingSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  toggle: {
    width: 52,
    height: 30,
    borderRadius: 15,
    padding: 3,
    justifyContent: 'center',
  },
  toggleIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  toggleIndicatorActive: {
    alignSelf: 'flex-end',
  },
  aboutCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 24,
    alignItems: 'center',
  },
  aboutTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  aboutText: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
});
