import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { TOTAL_PAGES } from '@/data/quranData';

const STORAGE_KEYS = {
  BOOKMARKS: 'quran_bookmarks',
  LAST_READ: 'quran_last_read',
  READING_HISTORY: 'quran_reading_history',
};

export interface Bookmark {
  page: number;
  timestamp: number;
  note?: string;
}

export interface ReadingSession {
  page: number;
  timestamp: number;
}

export const [QuranProvider, useQuran] = createContextHook(() => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [lastReadPage, setLastReadPage] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredData();
  }, []);

  const loadStoredData = async () => {
    try {
      const [storedBookmarks, storedLastRead] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.BOOKMARKS),
        AsyncStorage.getItem(STORAGE_KEYS.LAST_READ),
      ]);

      if (storedBookmarks) {
        setBookmarks(JSON.parse(storedBookmarks));
      }
      if (storedLastRead) {
        const page = parseInt(storedLastRead, 10);
        setLastReadPage(page);
        setCurrentPage(page);
      }
    } catch (error) {
      console.log('Error loading stored data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveLastRead = useCallback(async (page: number) => {
    try {
      setLastReadPage(page);
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_READ, page.toString());
    } catch (error) {
      console.log('Error saving last read:', error);
    }
  }, []);

  const addBookmark = useCallback(async (page: number, note?: string) => {
    const existingIndex = bookmarks.findIndex(b => b.page === page);
    let newBookmarks: Bookmark[];

    if (existingIndex >= 0) {
      newBookmarks = bookmarks.filter(b => b.page !== page);
    } else {
      const newBookmark: Bookmark = {
        page,
        timestamp: Date.now(),
        note,
      };
      newBookmarks = [...bookmarks, newBookmark].sort((a, b) => a.page - b.page);
    }

    setBookmarks(newBookmarks);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(newBookmarks));
    } catch (error) {
      console.log('Error saving bookmark:', error);
    }

    return existingIndex < 0;
  }, [bookmarks]);

  const removeBookmark = useCallback(async (page: number) => {
    const newBookmarks = bookmarks.filter(b => b.page !== page);
    setBookmarks(newBookmarks);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(newBookmarks));
    } catch (error) {
      console.log('Error removing bookmark:', error);
    }
  }, [bookmarks]);

  const isPageBookmarked = useCallback((page: number) => {
    return bookmarks.some(b => b.page === page);
  }, [bookmarks]);

  const updateCurrentPage = useCallback((page: number) => {
    if (page >= 1 && page <= TOTAL_PAGES) {
      setCurrentPage(page);
      saveLastRead(page);
    }
  }, [saveLastRead]);

  return {
    bookmarks,
    lastReadPage,
    currentPage,
    isLoading,
    addBookmark,
    removeBookmark,
    isPageBookmarked,
    updateCurrentPage,
    saveLastRead,
  };
});
