import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio, AVPlaybackStatus } from 'expo-av';
// ملاحظة: في Expo SDK 54 دوال الـ API القديم (getInfoAsync / createDownloadResumable ...)
// نُقلت إلى expo-file-system/legacy، واستدعاؤها من المسار الرئيسي يرمي خطأ عند التشغيل.
import * as FileSystem from 'expo-file-system/legacy';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Alert, AppState, Platform } from 'react-native';

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

/** التقدم والمدة في Context منفصل حتى لا تُعاد معالجة كل الشاشات كل نصف ثانية أثناء التشغيل. */
interface AudioProgressType {
  progress: number;
  duration: number;
}

const AudioContext = createContext<AudioContextType | null>(null);
const AudioProgressContext = createContext<AudioProgressType>({ progress: 0, duration: 0 });

const DOWNLOADED_FILES_KEY = 'AUDIO_DOWNLOADED_FILES';
const PLAYBACK_SPEED_KEY = 'AUDIO_PLAYBACK_SPEED';
const AUDIO_DIR_NAME = 'quran_audio';

export const SPEED_OPTIONS: PlaybackSpeed[] = [0.75, 1, 1.25, 1.5, 2];
export const SPEED_LABELS: Record<PlaybackSpeed, string> = {
  0.75: '0.75×',
  1: '1×',
  1.25: '1.25×',
  1.5: '1.5×',
  2: '2×',
};

const surahFileName = (surahNumber: number) => `${surahNumber.toString().padStart(3, '0')}.mp3`;
const sheikhDir = (sheikhId: string) => `${FileSystem.documentDirectory}${AUDIO_DIR_NAME}/${sheikhId}/`;
const localUriFor = (sheikhId: string, surahNumber: number) =>
  `${sheikhDir(sheikhId)}${surahFileName(surahNumber)}`;
const downloadKeyOf = (sheikhId: string, surahNumber: number) => `${sheikhId}_${surahNumber}`;

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
  const wasPlayingRef = useRef(false);
  const isFinishedRef = useRef(false);
  const progressRef = useRef(0);
  const durationRef = useRef(0);
  const downloadingRef = useRef<Record<string, boolean>>({});
  const downloadedRef = useRef<DownloadedFiles>({});
  const repeatModeRef = useRef<RepeatMode>('none');
  const playbackSpeedRef = useRef<PlaybackSpeed>(1);
  const onNextRef = useRef<(() => void) | null>(null);

  useEffect(() => { repeatModeRef.current = repeatMode; }, [repeatMode]);
  useEffect(() => { playbackSpeedRef.current = playbackSpeed; }, [playbackSpeed]);
  useEffect(() => { downloadedRef.current = downloadedFiles; }, [downloadedFiles]);

  // ── التحميل الأولي + وضع الصوت + متابعة حالة التطبيق ──
  useEffect(() => {
    (async () => {
      try {
        const [files, speed] = await Promise.all([
          AsyncStorage.getItem(DOWNLOADED_FILES_KEY),
          AsyncStorage.getItem(PLAYBACK_SPEED_KEY),
        ]);
        if (speed) setPlaybackSpeedState(parseFloat(speed) as PlaybackSpeed);

        if (files && Platform.OS !== 'web') {
          // مسار مجلد التطبيق قد يتغير بعد التحديث (خصوصاً على iOS)، لذلك نعيد بناء المسارات
          // من المسار الحالي ونحذف أي ملف لم يعد موجوداً.
          const stored: DownloadedFiles = JSON.parse(files);
          const verified: DownloadedFiles = {};
          for (const sheikhId of Object.keys(stored)) {
            for (const num of Object.keys(stored[sheikhId])) {
              const uri = localUriFor(sheikhId, Number(num));
              const info = await FileSystem.getInfoAsync(uri).catch(() => null);
              if (info?.exists) {
                verified[sheikhId] = { ...verified[sheikhId], [Number(num)]: uri };
              }
            }
          }
          setDownloadedFiles(verified);
          AsyncStorage.setItem(DOWNLOADED_FILES_KEY, JSON.stringify(verified)).catch(() => {});
        }
      } catch (e) {
        console.log('Audio init error:', e);
      }
    })();

    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
      staysActiveInBackground: true,
    }).catch(() => {});

    const appStateSub = AppState.addEventListener('change', async (nextState) => {
      const sound = soundRef.current;
      if (!sound) return;
      try {
        if (nextState === 'active') {
          if (wasPlayingRef.current) await sound.playAsync();
        } else {
          const status = await sound.getStatusAsync();
          wasPlayingRef.current = status.isLoaded && status.isPlaying;
        }
      } catch {
        // الصوت قد يكون أُفرغ أثناء التنقل
      }
    });

    return () => {
      appStateSub.remove();
      const sound = soundRef.current;
      if (sound) {
        sound.setOnPlaybackStatusUpdate(null);
        sound.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
    };
  }, []);

  const isFileDownloaded = useCallback(
    (sheikhId: string, surahNumber: number): boolean => !!downloadedFiles[sheikhId]?.[surahNumber],
    [downloadedFiles]
  );

  const getLocalFileUri = useCallback(
    (sheikhId: string, surahNumber: number): string | null =>
      downloadedFiles[sheikhId]?.[surahNumber] || null,
    [downloadedFiles]
  );

  const persistDownloaded = useCallback((next: DownloadedFiles) => {
    downloadedRef.current = next;
    setDownloadedFiles(next);
    AsyncStorage.setItem(DOWNLOADED_FILES_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const deleteDownload = useCallback(async (sheikhId: string, surahNumber: number) => {
    const uri = downloadedRef.current[sheikhId]?.[surahNumber];
    if (!uri) return;
    try {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    } catch (e) {
      console.warn('Delete file error:', e);
    }
    const next: DownloadedFiles = { ...downloadedRef.current };
    const sheikhFiles = { ...next[sheikhId] };
    delete sheikhFiles[surahNumber];
    if (Object.keys(sheikhFiles).length === 0) delete next[sheikhId];
    else next[sheikhId] = sheikhFiles;
    persistDownloaded(next);
  }, [persistDownloaded]);

  const checkInternetConnection = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'web') return true;
    const netInfo = await NetInfo.fetch();
    return netInfo.isConnected ?? false;
  }, []);

  const downloadAudio = useCallback(async (url: string, sheikhId: string, surahNumber: number): Promise<boolean> => {
    const key = downloadKeyOf(sheikhId, surahNumber);
    if (downloadingRef.current[key]) return false;

    if (Platform.OS === 'web') {
      Alert.alert('غير متاح', 'التحميل غير متاح على الويب');
      return false;
    }

    if (!(await checkInternetConnection())) {
      Alert.alert('لا يوجد اتصال', 'يرجى التحقق من اتصالك بالإنترنت');
      return false;
    }

    downloadingRef.current[key] = true;
    setIsDownloading(prev => ({ ...prev, [key]: true }));
    setDownloadProgress(prev => ({ ...prev, [key]: 0 }));

    const destUri = localUriFor(sheikhId, surahNumber);
    try {
      await FileSystem.makeDirectoryAsync(sheikhDir(sheikhId), { intermediates: true }).catch(() => {});

      const resumable = FileSystem.createDownloadResumable(url, destUri, {}, (p) => {
        if (p.totalBytesExpectedToWrite > 0) {
          const percent = Math.floor((p.totalBytesWritten / p.totalBytesExpectedToWrite) * 100);
          setDownloadProgress(prev => (prev[key] === percent ? prev : { ...prev, [key]: percent }));
        }
      });

      const result = await resumable.downloadAsync();
      // الخادم قد يرد بـ 404 ويُحفظ ملف خطأ بدل الصوت، لذلك نتحقق من حالة الرد
      if (!result || (result.status && result.status !== 200)) {
        await FileSystem.deleteAsync(destUri, { idempotent: true }).catch(() => {});
        Alert.alert('خطأ في التحميل', 'تعذّر تحميل هذه السورة من الخادم. جرّب قارئاً آخر.');
        return false;
      }

      persistDownloaded({
        ...downloadedRef.current,
        [sheikhId]: { ...downloadedRef.current[sheikhId], [surahNumber]: destUri },
      });
      setDownloadProgress(prev => ({ ...prev, [key]: 100 }));
      Alert.alert('تم التحميل', 'تم تحميل السورة بنجاح ✓');
      return true;
    } catch (error) {
      console.error('Download error:', error);
      await FileSystem.deleteAsync(destUri, { idempotent: true }).catch(() => {});
      Alert.alert('خطأ في التحميل', 'حدث خطأ أثناء تحميل الملف. تأكد من الاتصال بالإنترنت.');
      return false;
    } finally {
      downloadingRef.current[key] = false;
      setIsDownloading(prev => ({ ...prev, [key]: false }));
    }
  }, [checkInternetConnection, persistDownloaded]);

  const registerOnNext = useCallback((cb: () => void) => {
    onNextRef.current = cb;
  }, []);

  const onPlaybackStatusUpdate = useCallback(async (status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      if (status.error) console.warn('Playback error:', status.error);
      return;
    }

    if (status.positionMillis !== progressRef.current) {
      progressRef.current = status.positionMillis;
      setProgress(status.positionMillis);
    }
    const dur = status.durationMillis ?? 0;
    if (dur !== durationRef.current) {
      durationRef.current = dur;
      setDuration(dur);
    }
    setIsPlaying(status.isPlaying);
    setIsLoading(status.isBuffering);

    if (status.didJustFinish) {
      const sound = soundRef.current;
      setIsPlaying(false);
      if (repeatModeRef.current === 'one' && sound) {
        isFinishedRef.current = false;
        await sound.replayAsync();
      } else if (repeatModeRef.current === 'all' && onNextRef.current) {
        isFinishedRef.current = false;
        onNextRef.current();
      } else {
        isFinishedRef.current = true;
        progressRef.current = 0;
        setProgress(0);
        if (sound) {
          // الإيقاف أولاً ثم الرجوع لبداية الملف، الترتيب مهم
          await sound.stopAsync().catch(() => {});
          await sound.setPositionAsync(0).catch(() => {});
        }
      }
    }
  }, []);

  const loadAndPlay = useCallback(async (uri: string, surahNumber: number, sheikhId: string) => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    setIsLoading(true);

    try {
      if (soundRef.current) {
        soundRef.current.setOnPlaybackStatusUpdate(null);
        await soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true, rate: playbackSpeedRef.current, shouldCorrectPitch: true },
        onPlaybackStatusUpdate
      );

      isFinishedRef.current = false;
      soundRef.current = sound;
      progressRef.current = 0;
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
  }, [onPlaybackStatusUpdate]);

  const playOnline = useCallback(async (url: string, surahNumber: number, sheikhId: string) => {
    if (!(await checkInternetConnection())) {
      Alert.alert('لا يوجد اتصال', 'يرجى التحقق من اتصالك بالإنترنت للتشغيل المباشر');
      return;
    }
    await loadAndPlay(url, surahNumber, sheikhId);
  }, [loadAndPlay, checkInternetConnection]);

  const playOffline = useCallback(async (sheikhId: string, surahNumber: number) => {
    const localUri = downloadedRef.current[sheikhId]?.[surahNumber];
    if (!localUri) {
      Alert.alert('غير محمّل', 'لم يتم تحميل هذه السورة بعد');
      return;
    }
    await loadAndPlay(localUri, surahNumber, sheikhId);
  }, [loadAndPlay]);

  const pauseAudio = useCallback(async () => {
    if (!soundRef.current) return;
    try {
      await soundRef.current.pauseAsync();
      setIsPlaying(false);
    } catch (e) {
      console.warn('pauseAudio error:', e);
    }
  }, []);

  const resumeAudio = useCallback(async () => {
    const sound = soundRef.current;
    if (!sound) return;
    try {
      if (isFinishedRef.current) {
        isFinishedRef.current = false;
        await sound.setPositionAsync(0);
      }
      const status = await sound.getStatusAsync();
      if (!status.isLoaded) return;
      await sound.playAsync();
      setIsPlaying(true);
    } catch (e) {
      console.warn('resumeAudio error:', e);
    }
  }, []);

  const seekTo = useCallback(async (position: number) => {
    if (!soundRef.current) return;
    const clamped = Math.max(0, Math.min(position, durationRef.current));
    try {
      await soundRef.current.setPositionAsync(clamped);
    } catch (e) {
      console.warn('seekTo error:', e);
    }
  }, []);

  const seekBy = useCallback(async (seconds: number) => {
    await seekTo(progressRef.current + seconds * 1000);
  }, [seekTo]);

  const setPlaybackSpeed = useCallback(async (speed: PlaybackSpeed) => {
    setPlaybackSpeedState(speed);
    AsyncStorage.setItem(PLAYBACK_SPEED_KEY, String(speed)).catch(() => {});
    if (soundRef.current) {
      try {
        await soundRef.current.setRateAsync(speed, true);
      } catch (e) {
        console.warn('Speed change error:', e);
      }
    }
  }, []);

  const toggleRepeatMode = useCallback(() => {
    setRepeatMode(prev => (prev === 'none' ? 'one' : prev === 'one' ? 'all' : 'none'));
  }, []);

  const stopAudio = useCallback(async () => {
    const sound = soundRef.current;
    soundRef.current = null;
    if (sound) {
      sound.setOnPlaybackStatusUpdate(null);
      await sound.stopAsync().catch(() => {});
      await sound.unloadAsync().catch(() => {});
    }
    progressRef.current = 0;
    durationRef.current = 0;
    setCurrentSurah(null);
    setCurrentSheikhId(null);
    setIsPlaying(false);
    setIsLoading(false);
    setProgress(0);
    setDuration(0);
  }, []);

  const value = useMemo<AudioContextType>(() => ({
    currentSurah,
    isPlaying,
    isLoading,
    isDownloading,
    downloadProgress,
    currentSheikhId,
    playbackSpeed,
    repeatMode,
    setCurrentSurah,
    setPlaying: setIsPlaying,
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
    registerOnNext,
  }), [
    currentSurah, isPlaying, isLoading, isDownloading, downloadProgress, currentSheikhId,
    playbackSpeed, repeatMode, isFileDownloaded, getLocalFileUri, downloadAudio, deleteDownload,
    playOnline, playOffline, pauseAudio, resumeAudio, seekTo, seekBy, stopAudio,
    setPlaybackSpeed, toggleRepeatMode, registerOnNext,
  ]);

  const progressValue = useMemo(() => ({ progress, duration }), [progress, duration]);

  return (
    <AudioContext.Provider value={value}>
      <AudioProgressContext.Provider value={progressValue}>{children}</AudioProgressContext.Provider>
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) throw new Error('useAudio must be used within AudioProvider');
  return context;
};

export const useAudioProgress = () => useContext(AudioProgressContext);
