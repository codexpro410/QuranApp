import React, { createContext, useContext, useEffect, useState } from "react";
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
      const saved = await AsyncStorage.getItem("APP_THEME");
      if (saved) {
        setMode(saved as ThemeMode);
      } else {
        const sys = Appearance.getColorScheme();
        setMode(sys === "dark" ? "dark" : "light");
      }
    })();
  }, []);

  const toggleTheme = async () => {
    const newMode = mode === "dark" ? "light" : "dark";
    setMode(newMode);
    await AsyncStorage.setItem("APP_THEME", newMode);
  };

  return (
    <ThemeContext.Provider value={{ mode, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};
