import React, { useEffect, useState, ReactNode } from 'react';
import { View, StyleSheet, Text, Platform } from 'react-native';
import LottieView from 'lottie-react-native'; // Importa il componente LottieView
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useThemeColor } from '../hooks/useThemeColor';
import * as SplashScreen from 'expo-splash-screen';

interface AnimatedSplashScreenProps {
  children: ReactNode;
}

const AnimatedSplashScreen = ({ children }: AnimatedSplashScreenProps) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const loadAssets = async () => {
      // Simula un caricamento di 1 secondo
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsReady(true);
    };

    loadAssets();
  }, []);

  const onLayoutRootView = React.useCallback(async () => {
    if (isReady) {
      await SplashScreen.hideAsync();
    }
  }, [isReady]);

  if (!isReady) {
    return null;
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      {children}
    </View>
  );
};

interface SplashViewProps {
  onAnimationFinish: () => void;
}

const SplashView = ({ onAnimationFinish }: SplashViewProps) => {
  const colors = useThemeColor();
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);
  const animationRef = React.useRef<LottieView>(null); // Riferimento all'animazione Lottie

  const splashStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }],
    };
  });

  const hideSplash = () => {
    opacity.value = withTiming(0, { duration: 500 });
    scale.value = withTiming(1.2, { duration: 500 }, (finished) => {
      if (finished) {
        runOnJS(onAnimationFinish)();
      }
    });
  };

  useEffect(() => {
    // Avvia l'animazione Lottie all'interno del componente
    if (animationRef.current) {
      animationRef.current.play();
    }
  }, []);

  const styles = StyleSheet.create({
    container: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    animation: {
      width: '100%',
      height: '100%',
    },
  });

  return (
    <Animated.View style={[styles.container, splashStyle]}>
      <LottieView
        ref={animationRef}
        source={require('../assets//lottie/No-stress.json')}
        style={styles.animation}
        loop={false}
        autoPlay={false} // Non avviare automaticamente, lo facciamo noi in useEffect
        onAnimationFinish={() => {
          hideSplash();
        }}
      />
    </Animated.View>
  );
};

export default AnimatedSplashScreen;
