import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState, useRef } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { View, Text, StyleSheet, Animated, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { ThemeProvider } from "@/contexts/ThemeContext";
import { BookmarkProvider } from "@/contexts/BookmarkContext";
import { AudioProvider } from "@/contexts/AudioContext";
import { AzkarProvider } from "@/contexts/AzkarContext";
import { SebhaProvider } from "@/contexts/SebhaContext";
import { QuranProvider } from "@/contexts/QuranContext";
import DoaaSplash from "./splash-doaa";
// SplashScreen.preventAutoHideAsync();



const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
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
    </Stack>
  );
}

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
  <QueryClientProvider client={queryClient}>
    <QuranProvider>
    <ThemeProvider>
      <BookmarkProvider>
        <AudioProvider>
          <AzkarProvider>
            <SebhaProvider>
              <GestureHandlerRootView style={{ flex: 1 }}>
                
                  {showSplash ? (
                      // <DoaaSplash onComplete={() => setShowSplash(false)} />
                      <DoaaSplash onComplete={() => setShowSplash(false)}/>
                    ) : (
                      <RootLayoutNav /> // يظهر بعد انتهاء الـ splash
                    )}

              </GestureHandlerRootView>
            </SebhaProvider>
          </AzkarProvider>
        </AudioProvider>
      </BookmarkProvider>
    </ThemeProvider>
    </QuranProvider>
  </QueryClientProvider>
);
}
