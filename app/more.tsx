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
import { 
  Disc, 
  BookHeart, 
  Users, 
  Settings, 
  Moon, 
  Sun, 
  ChevronLeft,
  Bookmark,
  BookMarked,
  Heart
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/contexts/ThemeContext';

interface MenuItemProps {
  icon: any;
  title: string;
  subtitle?: string;
  onPress: () => void;
  colors: any;
  rightElement?: React.ReactNode;
}

const MenuItem = React.memo(function MenuItem({ icon: Icon, title, subtitle, onPress, colors, rightElement }: MenuItemProps) {
  return (
    <TouchableOpacity
      style={[styles.menuItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.menuIcon, { backgroundColor: colors.surfaceLight }]}>
        <Icon size={22} color={colors.gold} />
      </View>
      <View style={styles.menuContent}>
        <Text style={[styles.menuTitle, { color: colors.text }]}>{title}</Text>
        {subtitle && <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
      </View>
      {rightElement || <ChevronLeft size={20} color={colors.textMuted} />}
    </TouchableOpacity>
  );
});

export default function MoreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mode, colors, toggleTheme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.gold }]}>المزيد</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>أدوات</Text>
        
        <MenuItem
          icon={Disc}
          title="السبحة"
          subtitle="عداد التسبيح الإلكتروني"
          onPress={() => router.push('/sebha')}
          colors={colors}
        />

        <MenuItem
          icon={BookHeart}
          title="الدعاء"
          subtitle="أدعية مأثورة"
          onPress={() => router.push('/doaa')}
          colors={colors}
        />

        <MenuItem
          icon={BookMarked}
          title="دعاء ختم القرآن"
          subtitle="دعاء عند إتمام ختمة القرآن"
          onPress={() => router.push('/khtma-doaa')}
          colors={colors}
        />

        <MenuItem
          icon={Heart}
          title="دعاء للوالدين"
          subtitle="دعاء لي ولوالدي"
          onPress={() => router.push('/splash-doaa')}
          colors={colors}
        />

        <MenuItem
          icon={Users}
          title="اختيار القارئ"
          subtitle="تغيير قارئ التلاوة"
          onPress={() => router.push('/sheikh-select')}
          colors={colors}
        />

        <MenuItem
          icon={Bookmark}
          title="العلامات المرجعية"
          subtitle="عرض جميع العلامات"
          onPress={() => router.push('/bookmarks')}
          colors={colors}
        />

        <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: 24 }]}>الإعدادات</Text>

        <MenuItem
          icon={mode === 'dark' ? Sun : Moon}
          title={mode === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن'}
          subtitle="تغيير مظهر التطبيق"
          onPress={toggleTheme}
          colors={colors}
          rightElement={
            <View style={[styles.toggleSwitch, { backgroundColor: colors.surfaceLight }]}>
              <View style={[styles.toggleIndicator, { backgroundColor: colors.gold }]} />
            </View>
          }
        />

        <MenuItem
          icon={Settings}
          title="الإعدادات"
          subtitle="إعدادات التطبيق"
          onPress={() => router.push('/settings')}
          colors={colors}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    marginLeft: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuContent: {
    flex: 1,
    marginHorizontal: 12,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  menuSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  toggleSwitch: {
    width: 48,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  toggleIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignSelf: 'flex-end',
  },
});
