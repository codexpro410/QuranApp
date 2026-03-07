import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { File, Directory, Paths } from 'expo-file-system';
import { Platform, Alert, AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import * as FileSystem from 'expo-file-system';

export type PlaybackSpeed = 0.75 | 1 | 1.25 | 1.5 | 2;
export type RepeatMode = 'none' | 'one' | 'all';

interface DownloadedFiles {
  [sheikhId: string]: {
    [surahNumber: number]: string;
  };
}

export interface AudioContextType {
  currentSurah: number | null;
  isPlaying: boolean;
  isLoading: boolean;
  isDownloading: { [key: string]: boolean };
  downloadProgress: { [key: string]: number };
  progress: number;
  duration: number;
  currentSheikhId: string | null;
  playbackSpeed: PlaybackSpeed;
  repeatMode: RepeatMode;

  setCurrentSurah: (surah: number | null) => void;
  setPlaying: (playing: boolean) => void;
  isFileDownloaded: (sheikhId: string, surahNumber: number) => boolean;
  getLocalFileUri: (sheikhId: string, surahNumber: number) => string | null;
  downloadAudio: (url: string, sheikhId: string, surahNumber: number) => Promise<boolean>;
  deleteDownload: (sheikhId: string, surahNumber: number) => Promise<void>;
  playOnline: (url: string, surahNumber: number, sheikhId: string) => Promise<void>;
  playOffline: (sheikhId: string, surahNumber: number) => Promise<void>;
  pauseAudio: () => Promise<void>;
  resumeAudio: () => Promise<void>;
  seekTo: (position: number) => Promise<void>;
  seekBy: (seconds: number) => Promise<void>;
  stopAudio: () => Promise<void>;
  setPlaybackSpeed: (speed: PlaybackSpeed) => Promise<void>;
  setRepeatMode: (mode: RepeatMode) => void;
  toggleRepeatMode: () => void;
  registerOnNext: (cb: () => void) => void;
}

const AudioContext = createContext<AudioContextType | null>(null);

const DOWNLOADED_FILES_KEY = 'AUDIO_DOWNLOADED_FILES';
const PLAYBACK_SPEED_KEY = 'AUDIO_PLAYBACK_SPEED';

export const SPEED_OPTIONS: PlaybackSpeed[] = [0.75, 1, 1.25, 1.5, 2];
export const SPEED_LABELS: Record<PlaybackSpeed, string> = {
  0.75: '0.75×',
  1: '1×',
  1.25: '1.25×',
  1.5: '1.5×',
  2: '2×',
};

export const AudioProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentSurah, setCurrentSurah] = useState<number | null>(null);
  const [currentSheikhId, setCurrentSheikhId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [downloadedFiles, setDownloadedFiles] = useState<DownloadedFiles>({});
  const [isDownloading, setIsDownloading] = useState<{ [key: string]: boolean }>({});
  const [downloadProgress, setDownloadProgress] = useState<{ [key: string]: number }>({});
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeedState] = useState<PlaybackSpeed>(1);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('none');

  const soundRef = useRef<Audio.Sound | null>(null);
  const isLoadingRef = useRef(false);
  const currentUrlRef = useRef<string | null>(null);
const wasPlayingRef = useRef(false);
const isFinishedRef = useRef(false);
  useEffect(() => {
    // Load saved settings
    AsyncStorage.getItem(DOWNLOADED_FILES_KEY).then(data => {
      if (data) setDownloadedFiles(JSON.parse(data));
    });
    AsyncStorage.getItem(PLAYBACK_SPEED_KEY).then(data => {
      if (data) setPlaybackSpeedState(parseFloat(data) as PlaybackSpeed);
    });

    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
      staysActiveInBackground: true,
    });


const appStateSub = AppState.addEventListener('change', async (nextState) => {
  if (nextState === 'active') {
    // App came back to foreground — resume if was playing before
    if (wasPlayingRef.current && soundRef.current) {
      await soundRef.current.playAsync();
      setIsPlaying(true);
    }
  } else {
    // App went to background/inactive — track if was playing
    if (soundRef.current) {
      const status = await soundRef.current.getStatusAsync() as any;
      wasPlayingRef.current = status.isLoaded && status.isPlaying;
    }
  }
});

return () => {
  appStateSub.remove();
  if (soundRef.current) {
    soundRef.current.setOnPlaybackStatusUpdate(null);
    soundRef.current.unloadAsync();
    soundRef.current = null;
  }
};
  }, []);

  const getDownloadKey = useCallback((sheikhId: string, surahNumber: number) => {
    return `${sheikhId}_${surahNumber}`;
  }, []);

  const isFileDownloaded = useCallback((sheikhId: string, surahNumber: number): boolean => {
    return !!downloadedFiles[sheikhId]?.[surahNumber];
  }, [downloadedFiles]);

  const getLocalFileUri = useCallback((sheikhId: string, surahNumber: number): string | null => {
    return downloadedFiles[sheikhId]?.[surahNumber] || null;
  }, [downloadedFiles]);

  const saveDownloadedFile = useCallback(async (sheikhId: string, surahNumber: number, fileUri: string) => {
    setDownloadedFiles(prev => {
      const newState = {
        ...prev,
        [sheikhId]: { ...prev[sheikhId], [surahNumber]: fileUri }
      };
      AsyncStorage.setItem(DOWNLOADED_FILES_KEY, JSON.stringify(newState));
      return newState;
    });
  }, []);

  const deleteDownload = useCallback(async (sheikhId: string, surahNumber: number) => {
    const uri = downloadedFiles[sheikhId]?.[surahNumber];
    if (!uri) return;
    try {
      const info = await FileSystem.getInfoAsync(uri);
      if (info.exists) await FileSystem.deleteAsync(uri);
    } catch (e) {
      console.warn('Delete file error:', e);
    }
    setDownloadedFiles(prev => {
      const newState = { ...prev };
      if (newState[sheikhId]) {
        delete newState[sheikhId][surahNumber];
        if (Object.keys(newState[sheikhId]).length === 0) delete newState[sheikhId];
      }
      AsyncStorage.setItem(DOWNLOADED_FILES_KEY, JSON.stringify(newState));
      return newState;
    });
  }, [downloadedFiles]);

  const checkInternetConnection = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'web') return true;
    const netInfo = await NetInfo.fetch();
    return netInfo.isConnected ?? false;
  }, []);

  const downloadAudio = useCallback(async (url: string, sheikhId: string, surahNumber: number): Promise<boolean> => {
    const downloadKey = getDownloadKey(sheikhId, surahNumber);

    if (isDownloading[downloadKey]) return false;

    const isConnected = await checkInternetConnection();
    if (!isConnected) {
      Alert.alert('لا يوجد اتصال', 'يرجى التحقق من اتصالك بالإنترنت');
      return false;
    }

    if (Platform.OS === 'web') {
      Alert.alert('غير متاح', 'التحميل غير متاح على الويب');
      return false;
    }

    try {
      setIsDownloading(prev => ({ ...prev, [downloadKey]: true }));
      setDownloadProgress(prev => ({ ...prev, [downloadKey]: 0 }));

      const audioDir = new Directory(Paths.document, 'quran_audio', sheikhId);
      audioDir.create({ intermediates: true, idempotent: true });

      const fileName = `${surahNumber.toString().padStart(3, '0')}.mp3`;
      const destFile = new File(audioDir, fileName);

      const downloadResumable = FileSystem.createDownloadResumable(
        url,
        destFile.uri,
        {},
        (p: { totalBytesWritten: number; totalBytesExpectedToWrite: number }) => {
          const percent = (p.totalBytesWritten / p.totalBytesExpectedToWrite) * 100;
          setDownloadProgress(prev => ({ ...prev, [downloadKey]: Math.floor(percent) }));
        }
      );

      const result = await downloadResumable.downloadAsync();
      if (result?.uri) {
        await saveDownloadedFile(sheikhId, surahNumber, result.uri);
        setDownloadProgress(prev => ({ ...prev, [downloadKey]: 100 }));
        Alert.alert('تم التحميل', 'تم تحميل السورة بنجاح ✓');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('خطأ في التحميل', 'حدث خطأ أثناء تحميل الملف. تأكد من الاتصال بالإنترنت.');
      return false;
    } finally {
      setIsDownloading(prev => ({ ...prev, [downloadKey]: false }));
    }
  }, [isDownloading, getDownloadKey, checkInternetConnection, saveDownloadedFile]);

  const repeatModeRef = useRef<RepeatMode>('none');

// Keep ref in sync
useEffect(() => {
  repeatModeRef.current = repeatMode;
}, [repeatMode]);

const onNextRef = useRef<(() => void) | null>(null);

// expose a setter in context
const registerOnNext = useCallback((cb: () => void) => {
  onNextRef.current = cb;
}, []);
const onPlaybackStatusUpdate = useCallback(async (status: any) => {
  if (!status.isLoaded) return;
  setProgress(status.positionMillis || 0);
  setDuration(status.durationMillis || 0);
  setIsPlaying(status.isPlaying);
  if (status.isBuffering) setIsLoading(true);
  else setIsLoading(false);

  if (status.didJustFinish) {
  isFinishedRef.current = true;
  setIsPlaying(false);
  setProgress(0);
  if (repeatModeRef.current === 'one' && soundRef.current) {
    isFinishedRef.current = false;
    await soundRef.current.replayAsync();
  } else if (repeatModeRef.current === 'all' && onNextRef.current) {
    isFinishedRef.current = false;
    onNextRef.current();
  } else {
    // Stop first, then seek to beginning — order matters!
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.setPositionAsync(0);
    }
  }
}
}, []);

  // Add this useEffect after the repeatMode state declaration
useEffect(() => {
  if (soundRef.current) {
    soundRef.current.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
  }
}, [onPlaybackStatusUpdate, repeatMode]);

  const _loadAndPlay = useCallback(async (uri: string, surahNumber: number, sheikhId: string) => {
  if (isLoadingRef.current) return;
  isLoadingRef.current = true;
  setIsLoading(true);

  try {
    if (soundRef.current) {
      soundRef.current.setOnPlaybackStatusUpdate(null);
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }

    const { sound } = await Audio.Sound.createAsync(
      { uri },
      { shouldPlay: true, rate: playbackSpeed, shouldCorrectPitch: true },
      onPlaybackStatusUpdate
    );

    isFinishedRef.current = false;  // ← reset here
    soundRef.current = sound;
    currentUrlRef.current = uri;
    setCurrentSurah(surahNumber);
    setCurrentSheikhId(sheikhId);
    setIsPlaying(true);
    setProgress(0);
  } catch (error) {
    console.error('Error loading audio:', error);
    Alert.alert('خطأ في التشغيل', 'تعذّر تشغيل هذه السورة. يرجى المحاولة مرة أخرى.');
  } finally {
    isLoadingRef.current = false;
    setIsLoading(false);
  }
}, [playbackSpeed, onPlaybackStatusUpdate]);

  const playOnline = useCallback(async (url: string, surahNumber: number, sheikhId: string) => {
    const isConnected = await checkInternetConnection();
    if (!isConnected) {
      Alert.alert('لا يوجد اتصال', 'يرجى التحقق من اتصالك بالإنترنت للتشغيل المباشر');
      return;
    }
    await _loadAndPlay(url, surahNumber, sheikhId);
  }, [_loadAndPlay, checkInternetConnection]);

  const playOffline = useCallback(async (sheikhId: string, surahNumber: number) => {
    const localUri = getLocalFileUri(sheikhId, surahNumber);
    if (!localUri) {
      Alert.alert('غير محمّل', 'لم يتم تحميل هذه السورة بعد');
      return;
    }
    await _loadAndPlay(localUri, surahNumber, sheikhId);
  }, [_loadAndPlay, getLocalFileUri]);

  const pauseAudio = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.pauseAsync();
      setIsPlaying(false);
    }
  }, []);

const resumeAudio = useCallback(async () => {
  if (!soundRef.current) return;
  try {
    if (isFinishedRef.current) {
      // Track finished — do a full replay from start
      isFinishedRef.current = false;
      await soundRef.current.setPositionAsync(0);
      await soundRef.current.playAsync();
      setIsPlaying(true);
      return;
    }

    // Normal resume from paused position
    const status = await soundRef.current.getStatusAsync() as any;
    if (!status.isLoaded) return;

    await soundRef.current.playAsync();
    setIsPlaying(true);
  } catch (e) {
    console.warn('resumeAudio error:', e);
  }
}, []);

  const seekTo = useCallback(async (position: number) => {
    if (!soundRef.current) return;
    const clamped = Math.max(0, Math.min(position, duration));
    await soundRef.current.setPositionAsync(clamped);
  }, [duration]);

  const seekBy = useCallback(async (seconds: number) => {
    const newPos = Math.max(0, Math.min(progress + seconds * 1000, duration));
    await seekTo(newPos);
  }, [progress, duration, seekTo]);

  const setPlaybackSpeed = useCallback(async (speed: PlaybackSpeed) => {
    setPlaybackSpeedState(speed);
    AsyncStorage.setItem(PLAYBACK_SPEED_KEY, String(speed));
    if (soundRef.current) {
      try {
        await soundRef.current.setRateAsync(speed, true);
      } catch (e) {
        console.warn('Speed change error:', e);
      }
    }
  }, []);

  const toggleRepeatMode = useCallback(() => {
    setRepeatMode(prev => {
      if (prev === 'none') return 'one';
      if (prev === 'one') return 'all';
      return 'none';
    });
  }, []);

  const stopAudio = useCallback(async () => {
    if (soundRef.current) {
      soundRef.current.setOnPlaybackStatusUpdate(null);
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    currentUrlRef.current = null;
    setCurrentSurah(null);
    setCurrentSheikhId(null);
    setIsPlaying(false);
    setIsLoading(false);
    setProgress(0);
    setDuration(0);
  }, []);

  const setPlayingState = useCallback((playing: boolean) => {
    setIsPlaying(playing);
  }, []);

  return (
    <AudioContext.Provider value={{
      currentSurah,
      isPlaying,
      isLoading,
      isDownloading,
      downloadProgress,
      progress,
      duration,
      currentSheikhId,
      playbackSpeed,
      repeatMode,
      setCurrentSurah,
      setPlaying: setPlayingState,
      isFileDownloaded,
      getLocalFileUri,
      downloadAudio,
      deleteDownload,
      playOnline,
      playOffline,
      pauseAudio,
      resumeAudio,
      seekTo,
      seekBy,
      stopAudio,
      setPlaybackSpeed,
      setRepeatMode,
      toggleRepeatMode,
      registerOnNext 
    }}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) throw new Error('useAudio must be used within AudioProvider');
  return context;
};
