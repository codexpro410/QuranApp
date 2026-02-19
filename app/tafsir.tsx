import React, { useMemo } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import tafsirDataSet from "@/data/quran_with_tafsir.json";
import tafsir_by_page from "@/data/tafsir_by_page.json";
import { useTheme } from "@/contexts/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from 'expo-status-bar';
import { useQuran } from "@/contexts/QuranContext"; // ✅ هنا
import { RawTafsirPage } from "@/data/tafsirData";

export interface TafsirAyah {
  surah: number;
  ayah: number;
  ayah_key: string;
  text: string;
  tafsir: string;
}

export interface TafsirByPage {
  [page: string]: TafsirAyah[];
}

export default function TafsirScreen() {
    const router = useRouter();
  const { colors, mode } = useTheme();
  const insets = useSafeAreaInsets();

  
  const params = useLocalSearchParams<{ page?: string }>();
  const { currentPage } = useQuran();

  // الرقم الحالي للصفحة سواء من params أو context
  const pageNum = useMemo(() => {
    if (params.page) return Number(params.page);
    return currentPage;
  }, [params.page, currentPage]);

  // TypeScript: نفهمه أن البيانات من النوع RawTafsirPage
  // const tafsirData = tafsirDataSet as RawTafsirPage[];

  const tafsirData = tafsir_by_page as TafsirByPage;

  // الصفحة المطلوبة
  // const pageData = useMemo(() => {
  //   return tafsirData.find(p => p.page === pageNum);
  // }, [pageNum]);
  const pageData = useMemo(() => {
  return tafsirData[pageNum.toString()] || [];
}, [pageNum]);
  return (
    <>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />

      <View style={[styles.container, {
        backgroundColor: colors.background,
        paddingTop: insets.top + 12,
        paddingBottom: insets.bottom + 12,
      }]}>
        <TouchableOpacity onPress={() => { if(router.canGoBack()){router.back()}else{router.replace('/')}}}>
          <Text style={{ color: colors.gold, fontSize: 18 }}>رجوع</Text>
        </TouchableOpacity>

        <FlatList
          data={pageData || []}
          keyExtractor={(item:any) => item.ayah_key}
          renderItem={({ item }:any) => (
            <View style={styles.ayahBox}>
              <Text style={[styles.ayahNum, { color: colors.gold }]}>
                الآية {item.ayah}
              </Text>
              <Text style={styles.ayahText}>
                {item.text}
              </Text>
              <Text style={[styles.tafsirText, {
                color: mode === "dark" ? "#E6D9A3" : "#2B2B2B"
              }]}>
                {item.tafsir}
              </Text>
            </View>
          )}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container:{ flex:1, padding:16 },
  ayahBox:{ marginBottom:20 },
  ayahNum:{ fontSize:14, marginBottom:6 },
  ayahText:{ color:"red", fontSize:20, textAlign:"right", marginBottom:6 },
  tafsirText:{ fontSize:15, textAlign:"right", lineHeight:26 }
});
