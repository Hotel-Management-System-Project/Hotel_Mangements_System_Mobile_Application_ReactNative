import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import {
  ThemeProvider,
  useAppTheme,
} from './src/context/ThemeContext';
import RootNavigator from './src/navigation/RootNavigator';
import {
  darkNavigationTheme,
  darkTheme,
  lightNavigationTheme,
  lightTheme,
} from './src/theme/theme';

function ThemedApplication() {
  const { isDark } = useAppTheme();

  return (
    <PaperProvider theme={isDark ? darkTheme : lightTheme}>
      <AuthProvider>
        <NavigationContainer
          theme={isDark ? darkNavigationTheme : lightNavigationTheme}
        >
          <StatusBar
            style="light"
            backgroundColor="#7F1D1D"
            translucent={false}
          />
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </PaperProvider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ThemedApplication />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
