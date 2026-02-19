import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { File, Directory, Paths } from 'expo-file-system';
import { Platform, Alert } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

interface DownloadedFiles {
  [sheikhId: string]: {
    [surahNumber: number]: string;
  };
}

interface AudioContextType {
  currentSurah: number | null;
  isPlaying: boolean;
  isDownloading: { [key: string]: boolean };
  downloadProgress: { [key: string]: number };
  progress: number;
  duration: number;
  sound: Audio.Sound | null;
  currentSheikhId: string | null;
  setCurrentSurah: (surah: number | null) => void;
  setPlaying: (playing: boolean) => void;
  isFileDownloaded: (sheikhId: string, surahNumber: number) => boolean;
  getLocalFileUri: (sheikhId: string, surahNumber: number) => string | null;
  downloadAudio: (url: string, sheikhId: string, surahNumber: number) => Promise<boolean>;
  playOnline: (url: string, surahNumber: number, sheikhId: string) => Promise<void>;
  playOffline: (sheikhId: string, surahNumber: number) => Promise<void>;
  pauseAudio: () => Promise<void>;
  resumeAudio: () => Promise<void>;
  seekTo: (position: number) => Promise<void>;
  stopAudio: () => Promise<void>;
}

const AudioContext = createContext<AudioContextType | null>(null);

const DOWNLOADED_FILES_KEY = 'AUDIO_DOWNLOADED_FILES';

export const AudioProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentSurah, setCurrentSurah] = useState<number | null>(null);
  const [currentSheikhId, setCurrentSheikhId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [downloadedFiles, setDownloadedFiles] = useState<DownloadedFiles>({});
  const [isDownloading, setIsDownloading] = useState<{ [key: string]: boolean }>({});
  const [downloadProgress, setDownloadProgress] = useState<{ [key: string]: number }>({});
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(DOWNLOADED_FILES_KEY).then(data => {
      if (data) setDownloadedFiles(JSON.parse(data));
    });

    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
    });

    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
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
        [sheikhId]: {
          ...prev[sheikhId],
          [surahNumber]: fileUri
        }
      };
      AsyncStorage.setItem(DOWNLOADED_FILES_KEY, JSON.stringify(newState));
      return newState;
    });
  }, []);

  const checkInternetConnection = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'web') return true;
    const netInfo = await NetInfo.fetch();
    return netInfo.isConnected ?? false;
  }, []);

  const downloadAudio = useCallback(async (url: string, sheikhId: string, surahNumber: number): Promise<boolean> => {
    const downloadKey = getDownloadKey(sheikhId, surahNumber);
    
    if (isDownloading[downloadKey]) {
      console.log('Already downloading:', downloadKey);
      return false;
    }

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

      console.log('Downloading from:', url);
      console.log('Saving to:', destFile.uri);

      const downloadedFile = await File.downloadFileAsync(url, destFile, { idempotent: true });

      if (downloadedFile.exists) {
        await saveDownloadedFile(sheikhId, surahNumber, downloadedFile.uri);
        setDownloadProgress(prev => ({ ...prev, [downloadKey]: 100 }));
        console.log('Download complete:', downloadedFile.uri);
        Alert.alert('تم التحميل', 'تم تحميل السورة بنجاح');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('خطأ في التحميل', 'حدث خطأ أثناء تحميل الملف');
      return false;
    } finally {
      setIsDownloading(prev => ({ ...prev, [downloadKey]: false }));
    }
  }, [isDownloading, getDownloadKey, checkInternetConnection, saveDownloadedFile]);

  const setPlayingState = useCallback((playing: boolean) => {
    setIsPlaying(playing);
  }, []);

  const onPlaybackStatusUpdate = useCallback((status: any) => {
    if (status.isLoaded) {
      setProgress(status.positionMillis || 0);
      setDuration(status.durationMillis || 0);
      setIsPlaying(status.isPlaying);
      
      if (status.didJustFinish) {
        setIsPlaying(false);
        setProgress(0);
      }
    }
  }, []);

  const playOnline = useCallback(async (url: string, surahNumber: number, sheikhId: string) => {
    const isConnected = await checkInternetConnection();
    if (!isConnected) {
      Alert.alert('لا يوجد اتصال', 'يرجى التحقق من اتصالك بالإنترنت للتشغيل المباشر');
      return;
    }

    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      console.log('Playing online:', url);
      const { sound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true },
        onPlaybackStatusUpdate
      );

      soundRef.current = sound;
      setCurrentSurah(surahNumber);
      setCurrentSheikhId(sheikhId);
      setIsPlaying(true);
    } catch (error) {
      console.log('Error playing online audio:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تشغيل الصوت');
    }
  }, [onPlaybackStatusUpdate, checkInternetConnection]);

  const playOffline = useCallback(async (sheikhId: string, surahNumber: number) => {
    const localUri = getLocalFileUri(sheikhId, surahNumber);
    if (!localUri) {
      Alert.alert('غير محمّل', 'لم يتم تحميل هذه السورة بعد');
      return;
    }

    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      console.log('Playing offline:', localUri);
      const { sound } = await Audio.Sound.createAsync(
        { uri: localUri },
        { shouldPlay: true },
        onPlaybackStatusUpdate
      );

      soundRef.current = sound;
      setCurrentSurah(surahNumber);
      setCurrentSheikhId(sheikhId);
      setIsPlaying(true);
    } catch (error) {
      console.log('Error playing offline audio:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تشغيل الملف المحلي');
    }
  }, [onPlaybackStatusUpdate, getLocalFileUri]);

  const pauseAudio = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.pauseAsync();
      setIsPlaying(false);
    }
  }, []);

  const resumeAudio = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.playAsync();
      setIsPlaying(true);
    }
  }, []);

  const seekTo = useCallback(async (position: number) => {
    if (soundRef.current) {
      await soundRef.current.setPositionAsync(position);
    }
  }, []);

  const stopAudio = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    setCurrentSurah(null);
    setIsPlaying(false);
    setProgress(0);
    setDuration(0);
  }, []);

  return (
    <AudioContext.Provider value={{
      currentSurah,
      isPlaying,
      isDownloading,
      downloadProgress,
      progress,
      duration,
      sound: soundRef.current,
      currentSheikhId,
      setCurrentSurah,
      setPlaying: setPlayingState,
      isFileDownloaded,
      getLocalFileUri,
      downloadAudio,
      playOnline,
      playOffline,
      pauseAudio,
      resumeAudio,
      seekTo,
      stopAudio
    }}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within AudioProvider');
  }
  return context;
};
