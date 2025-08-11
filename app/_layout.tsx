// app/_layout.tsx
// Questo è il file di layout principale per Expo Router.

import React from 'react';
import { Stack } from 'expo-router';
import { View, StyleSheet, Platform, TouchableOpacity, Text } from 'react-native';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { useThemeColor } from '../hooks/useThemeColor';
import { lightColors } from '../constants/Color';
import { StatusBar } from 'expo-status-bar';
import { FontAwesome } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

/**
 * Componente interno che consuma il tema.
 * Questo componente è un figlio diretto del ThemeProvider e può quindi utilizzare useTheme e useThemeColor.
 */
const RootLayoutContent: React.FC = () => {
  const colors = useThemeColor();
  const { themeMode, toggleTheme } = useTheme();

  // Definiamo la larghezza dello switch
  const SWITCH_WIDTH = 95;
  // La larghezza dello slider sarà la metà della larghezza dello switch
  const SLIDER_WIDTH = SWITCH_WIDTH / 2;

  // Valore animato per la posizione dello slider
  // 0 per il sole (modalità light), SLIDER_WIDTH per la luna (modalità dark)
  const sliderPosition = useSharedValue(themeMode === 'light' ? 0 : SLIDER_WIDTH);

  // Aggiorna la posizione dello slider quando il tema cambia
  React.useEffect(() => {
    sliderPosition.value = withTiming(themeMode === 'light' ? 0 : SLIDER_WIDTH, { duration: 300 });
  }, [themeMode]);

  // Stile animato per lo slider
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: sliderPosition.value }],
    };
  });

  const ThemeSwitch: React.FC = () => {
    const switchStyles = StyleSheet.create({
      themeSwitchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: SWITCH_WIDTH,
        backgroundColor: themeMode === 'light' ? '#ADD8E6' : colors.cardBackground,
        borderRadius: 20,
        height: 40,
        padding: 5,
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
      },
      iconContainer: {
        width: '50%', // Ogni contenitore di icona occupa metà dello spazio
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
      },
      slider: {
        position: 'absolute',
        width: '50%',
        height: '100%',
        borderRadius: 20,
        backgroundColor: themeMode === 'light' ? '#FFF' : '#333',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
      },
    });

    return (
      <TouchableOpacity onPress={toggleTheme} style={switchStyles.themeSwitchContainer}>
        <Animated.View style={[switchStyles.slider, animatedStyle]} />
        <View style={switchStyles.iconContainer}>
          <FontAwesome
            name="sun-o"
            size={24}
            color={themeMode === 'light' ? '#FFD700' : 'gray'}
          />
        </View>
        <View style={switchStyles.iconContainer}>
          <FontAwesome
            name="moon-o"
            size={24}
            color={themeMode === 'light' ? 'gray' : '#DDD'}
          />
        </View>
      </TouchableOpacity>
    );
  };

  const layoutStyles = StyleSheet.create({
    container: {
      flex: 1,
    },
    headerRightContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: Platform.OS === 'web' ? 10 : 0,
    },
  });

  return (
    <View style={layoutStyles.container}>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerRight: () => (
            <View style={layoutStyles.headerRightContainer}>
              <ThemeSwitch />
            </View>
          ),
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Scanner Prodotti' }} />
      </Stack>
      <StatusBar style={themeMode === 'light' ? 'dark' : 'light'} />
    </View>
  );
};

const RootLayout: React.FC = () => {
  return (
    <ThemeProvider>
      <RootLayoutContent />
    </ThemeProvider>
  );
};

export default RootLayout;
