import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { QuranProvider } from "@/contexts/QuranContext";
import Colors from "@/constants/colors";
import { AzkarProvider } from "@/contexts/azkarContext";
import { SebhaProvider } from "@/contexts/SebhaContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
         animation: 'none',
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="surah-index"
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="page-jump"
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="bookmarks"
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />
            <Stack.Screen
        name="azkar"
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="azkar-detail"
        options={{
          headerShown: false,
        }}
      />
            <Stack.Screen
        name="sebha"
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <QuranProvider>
        <AzkarProvider>
          <SebhaProvider>
              <StatusBar style="light" />
              <RootLayoutNav />
            </SebhaProvider>
        </AzkarProvider>
      </QuranProvider>
    </QueryClientProvider>
  );
}
