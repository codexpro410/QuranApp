import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type BookmarkType = 'read' | 'review' | 'memorize';

export interface Bookmark {
  page: number;
  type: BookmarkType;
  createdAt: number;
  surahName?: string;
}

interface BookmarkContextType {
  bookmarks: Bookmark[];
  currentPage: number;
  addBookmark: (page: number, type: BookmarkType, surahName?: string) => void;
  removeBookmark: (page: number) => void;
  getBookmarkForPage: (page: number) => Bookmark | undefined;
  isPageBookmarked: (page: number) => boolean;
  setCurrentPage: (page: number) => void;
  getBookmarksByType: (type: BookmarkType) => Bookmark[];
}

const BookmarkContext = createContext<BookmarkContextType | null>(null);

const BOOKMARKS_KEY = 'QURAN_BOOKMARKS';
const CURRENT_PAGE_KEY = 'QURAN_CURRENT_PAGE';

export const BookmarkProvider = ({ children }: { children: React.ReactNode }) => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [currentPage, setCurrentPageState] = useState(1);

  useEffect(() => {
    AsyncStorage.getItem(BOOKMARKS_KEY).then(data => {
      if (data) setBookmarks(JSON.parse(data));
    });
    AsyncStorage.getItem(CURRENT_PAGE_KEY).then(data => {
      if (data) setCurrentPageState(parseInt(data, 10));
    });
  }, []);

  const addBookmark = useCallback((page: number, type: BookmarkType, surahName?: string) => {
    setBookmarks(prev => {
      const filtered = prev.filter(b => b.page !== page);
      const newBookmarks = [...filtered, { page, type, createdAt: Date.now(), surahName }];
      AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(newBookmarks));
      return newBookmarks;
    });
  }, []);

  const removeBookmark = useCallback((page: number) => {
    setBookmarks(prev => {
      const newBookmarks = prev.filter(b => b.page !== page);
      AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(newBookmarks));
      return newBookmarks;
    });
  }, []);

  const getBookmarkForPage = useCallback((page: number): Bookmark | undefined => {
    return bookmarks.find(b => b.page === page);
  }, [bookmarks]);

  const isPageBookmarked = useCallback((page: number): boolean => {
    return bookmarks.some(b => b.page === page);
  }, [bookmarks]);

  const setCurrentPage = useCallback((page: number) => {
    setCurrentPageState(page);
    AsyncStorage.setItem(CURRENT_PAGE_KEY, page.toString());
  }, []);

  const getBookmarksByType = useCallback((type: BookmarkType): Bookmark[] => {
    return bookmarks.filter(b => b.type === type);
  }, [bookmarks]);

  return (
    <BookmarkContext.Provider value={{
      bookmarks,
      currentPage,
      addBookmark,
      removeBookmark,
      getBookmarkForPage,
      isPageBookmarked,
      setCurrentPage,
      getBookmarksByType
    }}>
      {children}
    </BookmarkContext.Provider>
  );
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
    case 'read': return '#4CAF50';
    case 'review': return '#FF9800';
    case 'memorize': return '#2196F3';
    default: return '#4CAF50';
  }
};

export const getBookmarkLabel = (type: BookmarkType): string => {
  switch (type) {
    case 'read': return 'قراءة';
    case 'review': return 'مراجعة';
    case 'memorize': return 'حفظ';
    default: return 'قراءة';
  }
};
