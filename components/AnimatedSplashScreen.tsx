import React, { useEffect, useState, ReactNode } from 'react';
import { View, StyleSheet, Text, Platform } from 'react-native';
import { Video } from 'expo-video'; // Importa il componente Video dal nuovo pacchetto

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
  const videoRef = React.useRef<Video>(null);

  const splashStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }],
    };
  });

  const hideSplash = () => {
    'worklet';
    opacity.value = withTiming(0, { duration: 500 });
    scale.value = withTiming(1.2, { duration: 500 }, (finished) => {
      if (finished) {
        runOnJS(onAnimationFinish)();
      }
    });
  };

  useEffect(() => {
    const playVideo = async () => {
      if (videoRef.current) {
        await videoRef.current.playAsync();
      }
    };
    playVideo();
  }, []);

  const styles = StyleSheet.create({
    container: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    video: {
      width: '100%',
      height: '100%',
    },
  });

  return (
    <Animated.View style={[styles.container, splashStyle]}>
      <Video
        ref={videoRef}
        source={require('../assets/No-stress.mp4')}
        style={styles.video}
        resizeMode="cover"
        isLooping={false}
        shouldPlay={false} // Non avviare automaticamente
        onPlaybackStatusUpdate={(status: AVPlaybackStatus) => {
          if (status.isLoaded && status.didJustFinish) {
            hideSplash();
          }
        }}
      />
    </Animated.View>
  );
};

export default AnimatedSplashScreen;