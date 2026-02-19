// import React, { useState, useCallback, useMemo, useEffect } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   FlatList,
//   TouchableOpacity,
//   TextInput,
// } from 'react-native';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import { useRouter } from 'expo-router';
// import { X, Search, BookOpen, Download, Play, Pause } from 'lucide-react-native';
// import AsyncStorage from "@react-native-async-storage/async-storage";

// import { quranData, Surah } from '@/data/quranData';
// import Colors from '@/constants/colors';
// import { useTheme } from '@/contexts/ThemeContext';
// import { useAudio } from "@/contexts/AudioContext";

// /* ---------------------------------- */
// /* Utils                              */
// /* ---------------------------------- */

// const formatSurahNumber = (n: number) => n.toString().padStart(3, "0");

// /* ---------------------------------- */
// /* Screen                             */
// /* ---------------------------------- */

// export default function SurahIndexScreen() {
//   const router = useRouter();
//   const insets = useSafeAreaInsets();
//   const { colors } = useTheme();

//   const [searchQuery, setSearchQuery] = useState('');
//   const [activeSheikh, setActiveSheikh] = useState<any>(null);

//   // Audio context
//   const { 
//     currentSurah,
//     isPlaying,
//     isDownloaded,
//     setCurrentSurah,
//     setPlaying,
//     setDownloaded
//   } = useAudio();

//   /* ---------------------------------- */
//   /* Sheikh                             */
//   /* ---------------------------------- */

//   useEffect(() => {
//     AsyncStorage.getItem("ACTIVE_SHEIKH").then(v => {
//       if (v) setActiveSheikh(JSON.parse(v));
//     });
//   }, []);

//   const sheikhSupportsSurah = useCallback((surahNumber: number) => {
//     if (!activeSheikh) return false;
//     return activeSheikh.suras
//       .split(",")
//       .map((s: string) => s.trim())
//       .includes(String(surahNumber));
//   }, [activeSheikh]);

//   const buildSurahUrl = useCallback((surahNumber: number) => {
//     if (!activeSheikh) return null;
//     const num = formatSurahNumber(surahNumber);
//     return `${activeSheikh.Server}/${num}.mp3`;
//   }, [activeSheikh]);

//   /* ---------------------------------- */
//   /* Audio Actions                      */
//   /* ---------------------------------- */

//   const handleAudioAction = useCallback(async (surah: Surah) => {
//     const url = buildSurahUrl(surah.number);
//     if (!url) return;

//     // Download
//     if (!isDownloaded[surah.number]) {
//       console.log("Downloading:", url);
//       // TODO: real download logic
//       setDownloaded(surah.number, true);
//       return;
//     }

//     // Play / Pause
//     if (currentSurah === surah.number && isPlaying) {
//       setPlaying(false);
//     } else {
//       setCurrentSurah(surah.number);
//       setPlaying(true);
//       console.log("Playing:", url);
//     }
//   }, [
//     buildSurahUrl,
//     isDownloaded,
//     currentSurah,
//     isPlaying,
//     setDownloaded,
//     setCurrentSurah,
//     setPlaying
//   ]);

//   /* ---------------------------------- */
//   /* Search                             */
//   /* ---------------------------------- */

//   const filteredSurahs = useMemo(() => {
//     if (!searchQuery.trim()) return quranData;
//     const query = searchQuery.toLowerCase().trim();
//     return quranData.filter(
//       (surah) =>
//         surah.name.includes(query) ||
//         surah.englishName.toLowerCase().includes(query) ||
//         surah.number.toString() === query
//     );
//   }, [searchQuery]);

//   /* ---------------------------------- */
//   /* Navigation                         */
//   /* ---------------------------------- */

//   const handleSurahPress = useCallback((surah: Surah) => {
//     router.replace({
//       pathname: '/',
//       params: { goToPage: surah.page.toString() },
//     });
//   }, [router]);

//   /* ---------------------------------- */
//   /* Render Item                        */
//   /* ---------------------------------- */

//   const renderSurah = useCallback(({ item }: { item: Surah }) => {
//     const supported = sheikhSupportsSurah(item.number);
//     const downloaded = isDownloaded[item.number];
//     const playing = currentSurah === item.number && isPlaying;

//     return (
//       <TouchableOpacity
//         style={[styles.surahItem, { backgroundColor: colors.surface }]}
//         onPress={() => handleSurahPress(item)}
//         activeOpacity={0.85}
//       >

//         {/* Left Audio */}
//         <View style={styles.audioBox}>
//           {supported && (
//             <TouchableOpacity 
//               style={[styles.audioBtn, { borderColor: colors.border }]} 
//               onPress={() => handleAudioAction(item)}
//             >
//               {!downloaded && <Download size={18} color={colors.gold} />}
//               {downloaded && !playing && <Play size={18} color={colors.success} />}
//               {downloaded && playing && <Pause size={18} color={colors.error} />}
//             </TouchableOpacity>
//           )}
//         </View>

//         {/* Center */}
//         <View style={styles.surahDetails}>
//           <Text style={[styles.surahName, { color: colors.text }]}>
//             {item.name}
//           </Text>

//           {supported && (
//             <Text style={[styles.sheikhName, { color: colors.textSecondary }]}>
//               {activeSheikh?.name}
//             </Text>
//           )}
//         </View>

//         {/* Right */}
//         <View style={styles.surahMeta}>
//           <Text style={[styles.versesText, { color: colors.textSecondary }]}>
//             {item.verses} آية
//           </Text>
//           <Text style={[styles.pageText, { color: colors.gold }]}>
//             صفحة {item.page}
//           </Text>
//         </View>

//       </TouchableOpacity>
//     );
//   }, [
//     sheikhSupportsSurah,
//     isDownloaded,
//     currentSurah,
//     isPlaying,
//     activeSheikh,
//     handleSurahPress,
//     handleAudioAction,
//     colors
//   ]);

//   /* ---------------------------------- */
//   /* Header Search                      */
//   /* ---------------------------------- */

//   const renderSearch = () => (
//     <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
//       <Search size={18} color={colors.textSecondary} />
//       <TextInput
//         style={[styles.searchInput, { color: colors.text }]}
//         placeholder="ابحث عن سورة..."
//         placeholderTextColor={colors.textSecondary}
//         value={searchQuery}
//         onChangeText={setSearchQuery}
//         autoCapitalize="none"
//         autoCorrect={false}
//       />
//       {searchQuery.length > 0 && (
//         <TouchableOpacity onPress={() => setSearchQuery('')}>
//           <X size={18} color={colors.textSecondary} />
//         </TouchableOpacity>
//       )}
//     </View>
//   );

//   /* ---------------------------------- */
//   /* UI                                 */
//   /* ---------------------------------- */

//   return (
//     <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>

//       {/* Header */}
//       <View style={[styles.header, { borderBottomColor: colors.border }]}>
//         <TouchableOpacity style={[styles.closeButton, { backgroundColor: colors.surface }]} onPress={() => router.back()}>
//           <X size={22} color={colors.text} />
//         </TouchableOpacity>

//         <View style={styles.headerTitle}>
//           <BookOpen size={20} color={colors.gold} />
//           <Text style={[styles.headerText, { color: colors.text }]}>فهرس السور</Text>
//         </View>

//         <View style={styles.placeholder} />
//       </View>

//       {renderSearch()}

//       {/* List */}
//       <FlatList
//         data={filteredSurahs}
//         keyExtractor={(item) => item.number.toString()}
//         renderItem={renderSurah}
//         contentContainerStyle={styles.listContent}
//         showsVerticalScrollIndicator={false}
//         initialNumToRender={20}
//         ListEmptyComponent={
//           <View style={styles.emptyContainer}>
//             <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
//               لم يتم العثور على نتائج
//             </Text>
//           </View>
//         }
//       />

//     </View>
//   );
// }

// /* ---------------------------------- */
// /* Styles                             */
// /* ---------------------------------- */

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },

//   /* Header */
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     borderBottomWidth: 1,
//   },
//   closeButton: {
//     padding: 8,
//     borderRadius: 20,
//   },
//   headerTitle: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//   },
//   headerText: {
//     fontSize: 18,
//     fontWeight: '700',
//   },
//   placeholder: {
//     width: 40,
//   },

//   /* Search */
//   searchContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginHorizontal: 16,
//     marginVertical: 12,
//     paddingHorizontal: 12,
//     paddingVertical: 10,
//     borderRadius: 14,
//     gap: 8,
//   },
//   searchInput: {
//     flex: 1,
//     fontSize: 16,
//     textAlign: 'right',
//   },

//   /* List */
//   listContent: {
//     paddingHorizontal: 16,
//     paddingBottom: 24,
//   },

//   /* Item */
//   surahItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     borderRadius: 14,
//     padding: 12,
//     marginBottom: 10,
//   },

//   audioBox: {
//     width: 44,
//     alignItems: "center",
//     justifyContent: "center",
//   },

//   audioBtn: {
//     width: 36,
//     height: 36,
//     borderRadius: 12,
//     alignItems: "center",
//     justifyContent: "center",
//     borderWidth: 1,
//     backgroundColor: "rgba(255,255,255,0.04)",
//   },

//   surahDetails: {
//     flex: 1,
//     marginHorizontal: 12,
//     alignItems: 'flex-end',
//   },

//   surahName: {
//     fontSize: 18,
//     fontWeight: '600',
//   },

//   sheikhName: {
//     fontSize: 11,
//     marginTop: 2,
//   },

//   surahMeta: {
//     alignItems: 'flex-start',
//   },

//   versesText: {
//     fontSize: 12,
//   },

//   pageText: {
//     fontSize: 12,
//     marginTop: 2,
//     fontWeight: "600"
//   },

//   emptyContainer: {
//     padding: 40,
//     alignItems: 'center',
//   },

//   emptyText: {
//     fontSize: 16,
//   },
// });


import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect  } from 'expo-router';
import { X, Search, BookOpen, Download, Play, Pause, User, Check } from 'lucide-react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { quranData, Surah } from '@/data/quranData';
import { useTheme } from '@/contexts/ThemeContext';
import { useAudio } from "@/contexts/AudioContext";
import { Sheikh } from '@/data/sheikhData';

const formatSurahNumber = (n: number) => n.toString().padStart(3, "0");

export default function SurahIndexScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeSheikh, setActiveSheikh] = useState<Sheikh | null>(null);

  const { 
    currentSurah,
    isPlaying,
    isDownloading,
    currentSheikhId,
    isFileDownloaded,
    downloadAudio,
    playOnline,
    playOffline,
    pauseAudio,
    resumeAudio,
  } = useAudio();

useFocusEffect(
  useCallback(() => {
    AsyncStorage.getItem("ACTIVE_SHEIKH").then(v => {
      if (v) setActiveSheikh(JSON.parse(v));
    });
  }, [])
);
 

  const sheikhSupportsSurah = useCallback((surahNumber: number) => {
    if (!activeSheikh) return false;
    return activeSheikh.suras
      .split(",")
      .map((s: string) => s.trim())
      .includes(String(surahNumber));
  }, [activeSheikh]);

  const buildSurahUrl = useCallback((surahNumber: number) => {
    if (!activeSheikh) return null;
    const num = formatSurahNumber(surahNumber);
    const server = activeSheikh.Server.endsWith('/') ? activeSheikh.Server : `${activeSheikh.Server}/`;
    return `${server}${num}.mp3`;
  }, [activeSheikh]);

  const handleDownload = useCallback(async (surah: Surah) => {
    if (!activeSheikh) return;
    const url = buildSurahUrl(surah.number);
    if (!url) return;
    
    await downloadAudio(url, activeSheikh.id, surah.number);
  }, [activeSheikh, buildSurahUrl, downloadAudio]);

  const handlePlay = useCallback(async (surah: Surah) => {
    if (!activeSheikh) return;
    const url = buildSurahUrl(surah.number);
    if (!url) return;

    const isCurrentPlaying = currentSurah === surah.number && currentSheikhId === activeSheikh.id && isPlaying;
    const isCurrentPaused = currentSurah === surah.number && currentSheikhId === activeSheikh.id && !isPlaying;

    if (isCurrentPlaying) {
      await pauseAudio();
    } else if (isCurrentPaused) {
      await resumeAudio();
    } else {
      const isDownloaded = isFileDownloaded(activeSheikh.id, surah.number);
      if (isDownloaded) {
        await playOffline(activeSheikh.id, surah.number);
      } else {
        await playOnline(url, surah.number, activeSheikh.id);
      }
    }
  }, [activeSheikh, buildSurahUrl, currentSurah, currentSheikhId, isPlaying, isFileDownloaded, pauseAudio, resumeAudio, playOffline, playOnline]);

  const filteredSurahs = useMemo(() => {
    if (!searchQuery.trim()) return quranData;
    const query = searchQuery.toLowerCase().trim();
    return quranData.filter(
      (surah) =>
        surah.name.includes(query) ||
        surah.englishName.toLowerCase().includes(query) ||
        surah.number.toString() === query
    );
  }, [searchQuery]);

  const handleSurahPress = useCallback((surah: Surah) => {
    router.replace({
      pathname: '/',
      params: { goToPage: surah.page.toString() },
    });
  }, [router]);

  const renderSurah = useCallback(({ item }: { item: Surah }) => {
    const supported = sheikhSupportsSurah(item.number);
    const downloaded = activeSheikh ? isFileDownloaded(activeSheikh.id, item.number) : false;
    const downloadKey = activeSheikh ? `${activeSheikh.id}_${item.number}` : '';
    const downloading = isDownloading[downloadKey] || false;
    const isCurrentPlaying = currentSurah === item.number && currentSheikhId === activeSheikh?.id && isPlaying;

    return (
      <TouchableOpacity
        style={[styles.surahItem, { backgroundColor: colors.surface }]}
        onPress={() => handleSurahPress(item)}
        activeOpacity={0.85}
      >
        <View style={styles.audioBox}>
          {supported && activeSheikh ? (
            <View style={styles.audioButtons}>
              <TouchableOpacity 
                style={[styles.audioBtn, { borderColor: colors.border, backgroundColor: colors.surfaceLight }]} 
                onPress={() => handlePlay(item)}
              >
                {isCurrentPlaying ? (
                  <Pause size={16} color={colors.error} />
                ) : (
                  <Play size={16} color={colors.success} />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.audioBtn, 
                  { borderColor: colors.border, backgroundColor: downloaded ? colors.success + '20' : colors.surfaceLight }
                ]} 
                onPress={() => handleDownload(item)}
                disabled={downloading || downloaded}
              >
                {downloading ? (
                  <ActivityIndicator size="small" color={colors.gold} />
                ) : downloaded ? (
                  <Check size={16} color={colors.success} />
                ) : (
                  <Download size={16} color={colors.gold} />
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.audioPlaceholder} />
          )}
        </View>

        <View style={styles.surahDetails}>
          <Text style={[styles.surahName, { color: colors.text }]}>
            {item.name}
          </Text>
          {supported && activeSheikh && (
            <View style={styles.sheikhRow}>
              <Text style={[styles.sheikhName, { color: colors.textSecondary }]}>
                {activeSheikh.name}
              </Text>
              {downloaded && (
                <Text style={[styles.downloadedLabel, { color: colors.success }]}>
                  • محمّل
                </Text>
              )}
            </View>
          )}
        </View>

        <View style={styles.surahMeta}>
          <Text style={[styles.versesText, { color: colors.textSecondary }]}>
            {item.verses} آية
          </Text>
          <Text style={[styles.pageText, { color: colors.gold }]}>
            صفحة {item.page}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }, [sheikhSupportsSurah, isFileDownloaded, isDownloading, currentSurah, currentSheikhId, isPlaying, activeSheikh, handleSurahPress, handlePlay, handleDownload, colors]);

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={[styles.closeButton, { backgroundColor: colors.surface }]} onPress={() => router.back()}>
          <X size={22} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerTitle}>
          <BookOpen size={20} color={colors.gold} />
          <Text style={[styles.headerText, { color: colors.text }]}>فهرس السور</Text>
        </View>

        <TouchableOpacity 
          style={[styles.sheikhButton, { backgroundColor: colors.surface }]} 
          onPress={() => router.push('/sheikh-select')}
        >
          <User size={18} color={colors.gold} />
        </TouchableOpacity>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
        <Search size={18} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="ابحث عن سورة..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <X size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {activeSheikh && (
        <View style={[styles.activeSheikhBanner, { backgroundColor: colors.surfaceLight }]}>
          <User size={16} color={colors.gold} />
          <Text style={[styles.activeSheikhText, { color: colors.textSecondary }]}>
            القارئ: {activeSheikh.name}
          </Text>
        </View>
      )}

      <FlatList
        data={filteredSurahs}
        keyExtractor={(item) => item.number.toString()}
        renderItem={renderSurah}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        initialNumToRender={20}
        extraData={[isDownloading, currentSurah, isPlaying, activeSheikh]}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              لم يتم العثور على نتائج
            </Text>
          </View>
        }
      />
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
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '700',
  },
  sheikhButton: {
    padding: 8,
    borderRadius: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    textAlign: 'right',
  },
  activeSheikhBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 10,
  },
  activeSheikhText: {
    fontSize: 13,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  surahItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  audioBox: {
    width: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  audioButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  audioBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  audioPlaceholder: {
    width: 34,
    height: 34,
  },
  surahDetails: {
    flex: 1,
    marginHorizontal: 8,
    alignItems: 'flex-end',
  },
  surahName: {
    fontSize: 18,
    fontWeight: '600',
  },
  sheikhRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  sheikhName: {
    fontSize: 11,
  },
  downloadedLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  surahMeta: {
    alignItems: 'flex-start',
  },
  versesText: {
    fontSize: 12,
  },
  pageText: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: "600",
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
});
