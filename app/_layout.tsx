import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AudioProvider } from '@/contexts/AudioContext';
import { AzkarProvider } from '@/contexts/AzkarContext';
import { BookmarkProvider } from '@/contexts/BookmarkContext';
import { HifzProvider } from '@/contexts/HifzContext';
import { PageColorProvider } from '@/contexts/PageColorContext';
import { PrayerProvider } from '@/contexts/PrayerContext';
import { SebhaProvider } from '@/contexts/SebhaContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { DoaaSplash } from './splash-doaa';

// نُبقي شاشة البداية الأصلية ظاهرة حتى يجهز التطبيق (بدلاً من إخفائها فوراً ثم ظهور شاشة فارغة)
SplashScreen.preventAutoHideAsync().catch(() => {});

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ orientation: 'all' }} />
      <Stack.Screen name="tafsir" options={{ presentation: 'card' }} />
      <Stack.Screen name="surah-index" options={{ presentation: 'modal' }} />
      <Stack.Screen name="sheikh-select" options={{ presentation: 'modal' }} />
      <Stack.Screen name="splash-doaa" options={{ animation: 'fade' }} />
      <Stack.Screen name="bookmarks" options={{ presentation: 'modal' }} />
      <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
      <Stack.Screen name="prayer-times" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

// ترتيب المزوّدين: كل مزوّد لا يعتمد على غيره، فنجمعها في سلسلة واحدة مقروءة
const PROVIDERS = [
  PageColorProvider,
  HifzProvider,
  ThemeProvider,
  BookmarkProvider,
  AudioProvider,
  AzkarProvider,
  SebhaProvider,
  PrayerProvider,
];

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  const content = (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {showSplash ? <DoaaSplash onComplete={() => setShowSplash(false)} /> : <RootLayoutNav />}
    </GestureHandlerRootView>
  );

  return PROVIDERS.reduceRight(
    (children, Provider) => <Provider>{children}</Provider>,
    content
  );
}
