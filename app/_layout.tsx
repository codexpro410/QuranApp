import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { AudioProvider } from "@/contexts/AudioContext";
import { AzkarProvider } from "@/contexts/AzkarContext";
import { BookmarkProvider } from "@/contexts/BookmarkContext";
import { HifzProvider } from "@/contexts/HifzContext";
import { PageColorProvider } from "@/contexts/PageColorContext";
import { PrayerProvider } from "@/contexts/PrayerContext";
import { QuranProvider } from "@/contexts/QuranContext";
import { SebhaProvider } from "@/contexts/SebhaContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import DoaaSplash from "./splash-doaa";

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false, orientation: 'all' }} />
      <Stack.Screen name="azkar" options={{ headerShown: false }} />
      <Stack.Screen name="more" options={{ headerShown: false }} />
      <Stack.Screen name="tafsir" options={{ headerShown: false, presentation: 'card' }} />
      <Stack.Screen name="surah-index" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="sheikh-select" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="azkar-detail" options={{ headerShown: false }} />
      <Stack.Screen name="sebha" options={{ headerShown: false }} />
      <Stack.Screen name="doaa" options={{ headerShown: false }} />
      <Stack.Screen name="khtma-doaa" options={{ headerShown: false }} />
      <Stack.Screen name="splash-doaa" options={{ headerShown: false, animation: 'fade' }} />
      <Stack.Screen name="bookmarks" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="settings" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="hifz" options={{ headerShown: false }} />
      <Stack.Screen name="memorize" options={{ headerShown: false }} />
      <Stack.Screen name="revise" options={{ headerShown: false }} />
      <Stack.Screen name="prayer-times" options={{ headerShown: false, presentation: 'modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <PageColorProvider>
    <HifzProvider>
    <QuranProvider>
    <ThemeProvider>
      <BookmarkProvider>
        <AudioProvider>
          <AzkarProvider>
            <SebhaProvider>
              <PrayerProvider>
                <GestureHandlerRootView style={{ flex: 1 }}>
                  {showSplash ? (
                    <DoaaSplash onComplete={() => setShowSplash(false)} />
                  ) : (
                    <RootLayoutNav />
                  )}
                </GestureHandlerRootView>
              </PrayerProvider>
            </SebhaProvider>
          </AzkarProvider>
        </AudioProvider>
      </BookmarkProvider>
    </ThemeProvider>
    </QuranProvider>
    </HifzProvider>
    </PageColorProvider>
  );
}
