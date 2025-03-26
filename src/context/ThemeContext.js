import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Định nghĩa theme colors
export const lightTheme = {
  text: '#000000',
  textSecondary: '#666666',
  primary: '#1D72F3',
  secondary: '#e0e0e0',
  accent: '#e74c3c',
  border: '#DDDDDD',
  card: 'rgba(255, 255, 255, 0.85)',
  cardSolid: '#FFFFFF',
  modalBackground: 'rgba(0, 0, 0, 0.7)',
  success: '#4CAF50',
  error: '#f44336',
  warning: '#ff9800',
  info: '#2196F3',
  inputBackground: 'rgba(255, 255, 255, 0.9)',
  transparent: 'transparent',
};

export const darkTheme = {
  text: '#FFFFFF',
  textSecondary: '#AAAAAA',
  primary: '#2196F3',
  secondary: '#333333',
  accent: '#ff6b6b',
  border: '#333333',
  card: 'rgba(0, 0, 0, 0.75)',
  cardSolid: '#1E1E1E',
  modalBackground: 'rgba(0, 0, 0, 0.85)',
  success: '#4CAF50',
  error: '#f44336',
  warning: '#ff9800',
  info: '#2196F3',
  inputBackground: 'rgba(30, 30, 30, 0.9)',
  transparent: 'transparent',
};

export const ThemeContext = createContext({
  isDarkMode: false,
  toggleTheme: () => {},
  theme: lightTheme,
});

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Load theme preference from AsyncStorage
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const themePreference = await AsyncStorage.getItem('themePreference');
      if (themePreference !== null) {
        setIsDarkMode(themePreference === 'dark');
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    }
  };

  const toggleTheme = async () => {
    try {
      const newThemeValue = !isDarkMode;
      setIsDarkMode(newThemeValue);
      await AsyncStorage.setItem('themePreference', newThemeValue ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext); 