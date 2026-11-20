import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { DEFAULT_PAGE_STYLE, PageColorMode, migratePageStyle } from '@/constants/pageStyles';

export type { PageColorMode };

type PageColorContextType = {
  pageMode: PageColorMode;
  setPageMode: (mode: PageColorMode) => void;
  mushafWidth: number;
  mushafHeight: number;
  saveMushafWidth: (v: number) => void;
  saveMushafHeight: (v: number) => void;
};

const PageColorContext = createContext<PageColorContextType>({
  pageMode: DEFAULT_PAGE_STYLE,
  setPageMode: () => {},
  mushafWidth: 750,
  mushafHeight: 1437,
  saveMushafWidth: () => {},
  saveMushafHeight: () => {},
});

export function PageColorProvider({ children }: { children: React.ReactNode }) {
  const [pageMode, setPageModeState] = useState<PageColorMode>(DEFAULT_PAGE_STYLE);
  const [mushafWidth,  setMushafWidth]  = useState(750);
  const [mushafHeight, setMushafHeight] = useState(1437);

  // Load all saved values on mount
  useEffect(() => {
    AsyncStorage.getItem('pageColorMode').then(v => {
      setPageModeState(migratePageStyle(v));
    });
    AsyncStorage.getItem('MUSHAF_WIDTH').then(v => {
      if (v) setMushafWidth(Number(v));
    });
    AsyncStorage.getItem('MUSHAF_HEIGHT').then(v => {
      if (v) setMushafHeight(Number(v));
    });
  }, []);

  const setPageMode = useCallback(async (mode: PageColorMode) => {
    setPageModeState(mode);
    await AsyncStorage.setItem('pageColorMode', mode).catch(() => {});
  }, []);

  const saveMushafWidth = useCallback((v: number) => {
    setMushafWidth(v);
    AsyncStorage.setItem('MUSHAF_WIDTH', String(v)).catch(() => {});
  }, []);

  const saveMushafHeight = useCallback((v: number) => {
    setMushafHeight(v);
    AsyncStorage.setItem('MUSHAF_HEIGHT', String(v)).catch(() => {});
  }, []);

  const value = useMemo(() => ({
    pageMode,
    setPageMode,
    mushafWidth,
    mushafHeight,
    saveMushafWidth,
    saveMushafHeight,
  }), [pageMode, setPageMode, mushafWidth, mushafHeight, saveMushafWidth, saveMushafHeight]);

  return <PageColorContext.Provider value={value}>{children}</PageColorContext.Provider>;
}

export const usePageColor = () => useContext(PageColorContext);
