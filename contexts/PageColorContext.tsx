import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type PageColorMode = 'white' | 'paper' | 'dark';

type PageColorContextType = {
  pageMode: PageColorMode;
  setPageMode: (mode: PageColorMode) => void;
  mushafWidth: number;
  mushafHeight: number;
  saveMushafWidth: (v: number) => void;
  saveMushafHeight: (v: number) => void;
};

const PageColorContext = createContext<PageColorContextType>({
  pageMode: 'white',
  setPageMode: () => {},
  mushafWidth: 750,
  mushafHeight: 1437,
  saveMushafWidth: () => {},
  saveMushafHeight: () => {},
});

export function PageColorProvider({ children }: { children: React.ReactNode }) {
  const [pageMode, setPageModeState] = useState<PageColorMode>('white');
  const [mushafWidth,  setMushafWidth]  = useState(750);
  const [mushafHeight, setMushafHeight] = useState(1437);

  // Load all saved values on mount
  useEffect(() => {
    AsyncStorage.getItem('pageColorMode').then(v => {
      if (v) setPageModeState(v as PageColorMode);
    });
    AsyncStorage.getItem('MUSHAF_WIDTH').then(v => {
      if (v) setMushafWidth(Number(v));
    });
    AsyncStorage.getItem('MUSHAF_HEIGHT').then(v => {
      if (v) setMushafHeight(Number(v));
    });
  }, []);

  const setPageMode = async (mode: PageColorMode) => {
    setPageModeState(mode);
    await AsyncStorage.setItem('pageColorMode', mode);
  };

  const saveMushafWidth = (v: number) => {
    setMushafWidth(v);
    AsyncStorage.setItem('MUSHAF_WIDTH', String(v));
  };

  const saveMushafHeight = (v: number) => {
    setMushafHeight(v);
    AsyncStorage.setItem('MUSHAF_HEIGHT', String(v));
  };

  return (
    <PageColorContext.Provider value={{
      pageMode,
      setPageMode,
      mushafWidth,
      mushafHeight,
      saveMushafWidth,
      saveMushafHeight,
    }}>
      {children}
    </PageColorContext.Provider>
  );
}

export const usePageColor = () => useContext(PageColorContext);