import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'stayflow_theme_mode';
const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [mode, setModeState] = useState('light');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((savedMode) => {
        if (savedMode === 'light' || savedMode === 'dark') {
          setModeState(savedMode);
        }
      })
      .catch(() => {});
  }, []);

  const setMode = async (nextMode) => {
    const safeMode = nextMode === 'dark' ? 'dark' : 'light';
    setModeState(safeMode);
    await AsyncStorage.setItem(STORAGE_KEY, safeMode);
  };

  const value = useMemo(
    () => ({
      mode,
      isDark: mode === 'dark',
      setMode,
      toggleTheme: () => setMode(mode === 'dark' ? 'light' : 'dark'),
    }),
    [mode],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error('useAppTheme must be used inside ThemeProvider');
  }
  return value;
}
