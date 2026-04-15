import React, { useRef, useState } from 'react';
import {
  Pressable,
  StatusBar,
  StyleSheet,
  View,
  useColorScheme,
} from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useMicrophonePermission,
} from 'react-native-vision-camera';
import { Stack, TamaguiProvider, Text } from '@tamagui/core';
import { config } from './tamagui.config';

type CaptureMode = 'photo' | 'video';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <TamaguiProvider config={config as any}>
      <SafeAreaProvider>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <AppContent />
      </SafeAreaProvider>
    </TamaguiProvider>
  );
}

function AppContent() {
  const safeAreaInsets = useSafeAreaInsets();
  const cameraRef = useRef<Camera>(null);
  const device = useCameraDevice('back');
  const {
    hasPermission: hasCameraPermission,
    requestPermission: requestCameraPermission,
  } = useCameraPermission();
  const {
    hasPermission: hasMicrophonePermission,
    requestPermission: requestMicrophonePermission,
  } = useMicrophonePermission();

  const [started, setStarted] = useState(false);
  const [mode, setMode] = useState<CaptureMode>('photo');
  const [zoom, setZoom] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState('Tap start to open the camera.');

  const maxZoom = device?.maxZoom ?? 1;
  const cameraZoom = 1 + zoom * (Math.max(maxZoom, 1) - 1);

  const handleStart = async () => {
    const permissionGranted = hasCameraPermission
      ? true
      : await requestCameraPermission();

    if (!permissionGranted) {
      setStatus('Camera permission is required.');
      return;
    }

    setStarted(true);
    setStatus('Camera ready.');
  };

  const handleCapture = async () => {
    if (!cameraRef.current) {
      return;
    }

    if (mode === 'photo') {
      try {
        const photo = await cameraRef.current.takePhoto({ flash: 'off' });
        setStatus(`Photo captured: ${photo.path.split('/').pop() ?? 'saved'}`);
      } catch {
        setStatus('Could not take the photo.');
      }

      return;
    }

    if (isRecording) {
      cameraRef.current.stopRecording();
      return;
    }

    const microphoneGranted = hasMicrophonePermission
      ? true
      : await requestMicrophonePermission();

    if (!microphoneGranted) {
      setStatus('Microphone permission is required for video.');
      return;
    }

    try {
      setIsRecording(true);
      setStatus('Recording video...');
      cameraRef.current.startRecording({
        onRecordingFinished: () => {
          setIsRecording(false);
          setStatus('Video saved.');
        },
        onRecordingError: () => {
          setIsRecording(false);
          setStatus('Recording failed.');
        },
      });
    } catch {
      setIsRecording(false);
      setStatus('Recording failed to start.');
    }
  };

  if (!started) {
    return (
      <Stack style={styles.startScreen} paddingTop={safeAreaInsets.top}>
        <Text style={styles.title}>Baby Vision</Text>
        <Text style={styles.subtitle}>{status}</Text>
        <Pressable onPress={handleStart} style={styles.startButton}>
          <Text style={styles.startButtonText}>Start</Text>
        </Pressable>
      </Stack>
    );
  }

  if (!device) {
    return (
      <Stack style={styles.startScreen} paddingTop={safeAreaInsets.top}>
        <Text style={styles.title}>Camera unavailable</Text>
        <Text style={styles.subtitle}>
          The back camera is not ready yet.
        </Text>
      </Stack>
    );
  }

  return (
    <Stack style={styles.cameraScreen} paddingTop={safeAreaInsets.top}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive
        photo
        video
        audio
        zoom={cameraZoom}
      />

      <Stack style={styles.overlay}>
        <Text style={styles.statusText}>{status}</Text>

        <Stack style={styles.modeRow}>
          <Pressable
            onPress={() => setMode('photo')}
            style={({ pressed }) => [
              styles.modeButton,
              mode === 'photo' && styles.modeButtonActive,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.modeText}>Photo</Text>
          </Pressable>

          <Pressable
            onPress={() => setMode('video')}
            style={({ pressed }) => [
              styles.modeButton,
              mode === 'video' && styles.modeButtonActive,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.modeText}>Video</Text>
          </Pressable>
        </Stack>

        <Pressable
          onPress={handleCapture}
          style={({ pressed }) => [
            styles.captureButton,
            isRecording && styles.captureButtonRecording,
            pressed && styles.captureButtonPressed,
          ]}
        >
          <View style={styles.captureButtonInner} />
        </Pressable>

        <Stack style={styles.sliderWrap}>
          <Text style={styles.sliderLabel}>Zoom</Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={1}
            value={zoom}
            onValueChange={setZoom}
            minimumTrackTintColor="#ffffff"
            maximumTrackTintColor="rgba(255,255,255,0.35)"
            thumbTintColor="#ffffff"
          />
        </Stack>
      </Stack>
    </Stack>
  );
}

const styles = StyleSheet.create({
  startScreen: {
    flex: 1,
    backgroundColor: '#f4efe9',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 14,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#17212b',
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: '#5c6670',
    textAlign: 'center',
  },
  startButton: {
    minWidth: 160,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 999,
    backgroundColor: '#17212b',
    alignItems: 'center',
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  cameraScreen: {
    flex: 1,
    backgroundColor: '#000000',
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 18,
    paddingTop: 8,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignSelf: 'center',
    overflow: 'hidden',
  },
  modeRow: {
    flexDirection: 'row',
    alignSelf: 'center',
    gap: 10,
    backgroundColor: 'rgba(0,0,0,0.32)',
    padding: 6,
    borderRadius: 999,
  },
  modeButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
  },
  modeButtonActive: {
    backgroundColor: '#ffffff',
  },
  modeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  pressed: {
    opacity: 0.85,
  },
  captureButton: {
    alignSelf: 'center',
    width: 86,
    height: 86,
    borderRadius: 999,
    backgroundColor: '#ff2d2d',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 5,
    borderColor: 'rgba(255,255,255,0.85)',
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 6,
  },
  captureButtonPressed: {
    transform: [{ scale: 0.96 }],
  },
  captureButtonRecording: {
    backgroundColor: '#c81e1e',
  },
  captureButtonInner: {
    width: 26,
    height: 26,
    borderRadius: 999,
    backgroundColor: '#ffffff',
  },
  sliderWrap: {
    backgroundColor: 'rgba(0,0,0,0.36)',
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 16,
  },
  sliderLabel: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
});

export default App;
