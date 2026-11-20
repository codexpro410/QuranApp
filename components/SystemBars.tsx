import { useFocusEffect } from 'expo-router';
import * as NavigationBar from 'expo-navigation-bar';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback } from 'react';
import { Platform } from 'react-native';

/**
 * يضبط لون أيقونات شريط الحالة (الأعلى) وأزرار شريط التنقل (الأسفل) معاً.
 *
 * light=true  ← أيقونات فاتحة (للخلفيات الداكنة)
 * light=false ← أيقونات سوداء (للخلفيات الفاتحة)
 *
 * كان الخطأ: StatusBar كان يتبع وضع التطبيق (فاتح/داكن) لا لون خلفية الصفحة المعروضة،
 * وشريط التنقل السفلي لم يكن يُضبط أصلاً (مع edge-to-edge يتبع نظام الجهاز)،
 * فتظهر أيقونات بيضاء على ورق فاتح أو العكس.
 */
export default function SystemBars({ light, hidden = false }: { light: boolean; hidden?: boolean }) {
  // نُعيد الضبط كلما أصبحت الشاشة هي الظاهرة (عند الرجوع من شاشة أخرى)
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'android') {
        NavigationBar.setButtonStyleAsync(light ? 'light' : 'dark').catch(() => {});
      }
    }, [light])
  );

  return <StatusBar style={light ? 'light' : 'dark'} hidden={hidden} />;
}
