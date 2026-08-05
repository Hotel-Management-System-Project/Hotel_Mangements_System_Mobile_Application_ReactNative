import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationLightTheme,
} from '@react-navigation/native';

export const colors = {
  primary: '#E11D2E',
  secondary: '#FB7185',
  background: '#F5F5F5',
  surface: '#FFFFFF',
  text: '#18181B',
  muted: '#71717A',
  success: '#16A34A',
  error: '#DC2626',
  warning: '#F59E0B',
  border: '#E4E4E7',
};

export const lightTheme = {
  ...MD3LightTheme,
  roundness: 3,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    secondary: colors.secondary,
    background: colors.background,
    surface: colors.surface,
    surfaceVariant: '#F4F4F5',
    error: colors.error,
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  roundness: 3,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#FB7185',
    secondary: '#FCA5A5',
    background: '#09090B',
    surface: '#18181B',
    surfaceVariant: '#27272A',
    error: '#F87171',
  },
};

export const lightNavigationTheme = {
  ...NavigationLightTheme,
  colors: {
    ...NavigationLightTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
  },
};

export const darkNavigationTheme = {
  ...NavigationDarkTheme,
  colors: {
    ...NavigationDarkTheme.colors,
    primary: '#FB7185',
    background: '#09090B',
    card: '#18181B',
    text: '#FFFFFF',
    border: '#3F3F46',
  },
};

// Kept for older shared components.
export const theme = lightTheme;
export const navigationTheme = lightNavigationTheme;
