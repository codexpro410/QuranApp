import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Appearance } from "react-native";
import DarkColors, { LightColors } from "@/constants/colors";

type ThemeMode = "dark" | "light";

interface ThemeContextType {
  mode: ThemeMode;
  colors: typeof DarkColors;
  toggleTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [mode, setMode] = useState<ThemeMode>("dark");
  const colors = mode === "dark" ? DarkColors : LightColors;

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem("APP_THEME");
        if (saved === "dark" || saved === "light") {
          setMode(saved);
        } else {
          setMode(Appearance.getColorScheme() === "dark" ? "dark" : "light");
        }
      } catch {
        // نكتفي بالوضع الافتراضي
      }
    })();
  }, []);

  const toggleTheme = useCallback(async () => {
    const newMode: ThemeMode = mode === "dark" ? "light" : "dark";
    setMode(newMode);
    await AsyncStorage.setItem("APP_THEME", newMode).catch(() => {});
  }, [mode]);

  const value = useMemo(() => ({ mode, colors, toggleTheme }), [mode, colors, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};
