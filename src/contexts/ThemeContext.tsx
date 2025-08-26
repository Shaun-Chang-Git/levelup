import React, { createContext, useContext, useState, useEffect } from 'react';
import { PaletteMode } from '@mui/material';

interface ThemeContextType {
  mode: PaletteMode;
  toggleColorMode: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useThemeMode = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeMode must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // 시스템 테마 감지 및 로컬 스토리지에서 저장된 테마 불러오기
  const getInitialMode = (): PaletteMode => {
    if (typeof window === 'undefined') return 'light';
    
    const savedMode = localStorage.getItem('levelup-theme-mode');
    if (savedMode === 'light' || savedMode === 'dark') {
      return savedMode;
    }
    
    // 시스템 테마 설정을 기본값으로 사용
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  const [mode, setMode] = useState<PaletteMode>(getInitialMode);

  // 시스템 테마 변경 감지
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const savedMode = localStorage.getItem('levelup-theme-mode');
    if (savedMode) return; // 사용자가 수동으로 설정한 경우 시스템 변경을 무시

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setMode(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // 테마 모드 변경
  const toggleColorMode = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    localStorage.setItem('levelup-theme-mode', newMode);
  };

  const value: ThemeContextType = {
    mode,
    toggleColorMode,
    isDark: mode === 'dark',
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;