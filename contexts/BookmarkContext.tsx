import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { TOTAL_PAGES } from '@/data/quranData';

export type BookmarkType = 'read' | 'review' | 'memorize';

export interface Bookmark {
  page: number;
  type: BookmarkType;
  createdAt: number;
  surahName?: string;
}

/** طلب انتقال إلى صفحة: الـ nonce يتغير مع كل طلب فيعمل حتى لو طُلبت نفس الصفحة مرتين. */
export interface JumpRequest {
  page: number;
  nonce: number;
}

interface BookmarkContextType {
  bookmarks: Bookmark[];
  currentPage: number;
  isLoaded: boolean;
  jumpRequest: JumpRequest | null;
  addBookmark: (page: number, type: BookmarkType, surahName?: string) => void;
  removeBookmark: (page: number) => void;
  getBookmarkForPage: (page: number) => Bookmark | undefined;
  isPageBookmarked: (page: number) => boolean;
  setCurrentPage: (page: number) => void;
  jumpToPage: (page: number) => void;
  getBookmarksByType: (type: BookmarkType) => Bookmark[];
}

const BookmarkContext = createContext<BookmarkContextType | null>(null);

const BOOKMARKS_KEY = 'QURAN_BOOKMARKS';
const CURRENT_PAGE_KEY = 'QURAN_CURRENT_PAGE';

const clampPage = (page: number) => Math.min(Math.max(Math.round(page) || 1, 1), TOTAL_PAGES);

export const BookmarkProvider = ({ children }: { children: React.ReactNode }) => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [currentPage, setCurrentPageState] = useState(1);
  const [isLoaded, setIsLoaded] = useState(false);
  const [jumpRequest, setJumpRequest] = useState<JumpRequest | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [b, p] = await Promise.all([
          AsyncStorage.getItem(BOOKMARKS_KEY),
          AsyncStorage.getItem(CURRENT_PAGE_KEY),
        ]);
        if (b) setBookmarks(JSON.parse(b));
        if (p) setCurrentPageState(clampPage(parseInt(p, 10)));
      } catch (e) {
        console.log('Error loading bookmarks:', e);
      } finally {
        setIsLoaded(true);
      }
    })();
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  // حفظ العلامات تلقائياً عند أي تغيير (بعد اكتمال التحميل لتجنب الكتابة فوق البيانات المحفوظة)
  useEffect(() => {
    if (!isLoaded) return;
    AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks)).catch(() => {});
  }, [bookmarks, isLoaded]);

  const persistPage = useCallback((page: number) => {
    // تأخير بسيط لتجنب الكتابة في التخزين مع كل صفحة أثناء التقليب السريع
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      AsyncStorage.setItem(CURRENT_PAGE_KEY, String(page)).catch(() => {});
    }, 400);
  }, []);

  const addBookmark = useCallback((page: number, type: BookmarkType, surahName?: string) => {
    setBookmarks(prev => [
      ...prev.filter(b => b.page !== page),
      { page, type, createdAt: Date.now(), surahName },
    ]);
  }, []);

  const removeBookmark = useCallback((page: number) => {
    setBookmarks(prev => prev.filter(b => b.page !== page));
  }, []);

  const setCurrentPage = useCallback((page: number) => {
    const p = clampPage(page);
    setCurrentPageState(p);
    persistPage(p);
  }, [persistPage]);

  const jumpToPage = useCallback((page: number) => {
    const p = clampPage(page);
    setCurrentPageState(p);
    persistPage(p);
    setJumpRequest(prev => ({ page: p, nonce: (prev?.nonce ?? 0) + 1 }));
  }, [persistPage]);

  const bookmarkByPage = useMemo(() => {
    const map = new Map<number, Bookmark>();
    bookmarks.forEach(b => map.set(b.page, b));
    return map;
  }, [bookmarks]);

  const getBookmarkForPage = useCallback((page: number) => bookmarkByPage.get(page), [bookmarkByPage]);
  const isPageBookmarked = useCallback((page: number) => bookmarkByPage.has(page), [bookmarkByPage]);
  const getBookmarksByType = useCallback(
    (type: BookmarkType) => bookmarks.filter(b => b.type === type),
    [bookmarks]
  );

  const value = useMemo(() => ({
    bookmarks,
    currentPage,
    isLoaded,
    jumpRequest,
    addBookmark,
    removeBookmark,
    getBookmarkForPage,
    isPageBookmarked,
    setCurrentPage,
    jumpToPage,
    getBookmarksByType,
  }), [bookmarks, currentPage, isLoaded, jumpRequest, addBookmark, removeBookmark,
      getBookmarkForPage, isPageBookmarked, setCurrentPage, jumpToPage, getBookmarksByType]);

  return <BookmarkContext.Provider value={value}>{children}</BookmarkContext.Provider>;
};

export const useBookmarks = () => {
  const context = useContext(BookmarkContext);
  if (!context) {
    throw new Error('useBookmarks must be used within BookmarkProvider');
  }
  return context;
};

export const getBookmarkColor = (type: BookmarkType): string => {
  switch (type) {
    case 'review': return '#FF9800';
    case 'memorize': return '#2196F3';
    default: return '#4CAF50';
  }
};

export const getBookmarkLabel = (type: BookmarkType): string => {
  switch (type) {
    case 'review': return 'مراجعة';
    case 'memorize': return 'حفظ';
    default: return 'قراءة';
  }
};
