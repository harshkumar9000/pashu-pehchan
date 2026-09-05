import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  BackHandler,
  ToastAndroid,
  Linking,
  Platform,
  SafeAreaView,
  StatusBar,
  Image,
} from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import type { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes';
import { useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';

// Configurable target PashuPehchan website URL
const DEFAULT_WEB_URL = 'https://pashu-pehchan1.vercel.app';
const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL || DEFAULT_WEB_URL;

export default function App() {
  const webViewRef = useRef<WebView | null>(null);

  // Navigation and loading state
  const [canGoBack, setCanGoBack] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Camera permissions hook
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  // Double back press tracker for Android exit confirmation
  const lastBackPressRef = useRef<number>(0);

  // Hardware Android Back Button Handler
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const handleBackPress = () => {
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }

      // At root of navigation: prevent accidental exit with double-tap
      const now = Date.now();
      if (lastBackPressRef.current && now - lastBackPressRef.current < 2000) {
        BackHandler.exitApp();
        return true;
      }

      lastBackPressRef.current = now;
      ToastAndroid.show('Press back again to exit PashuPehchan', ToastAndroid.SHORT);
      return true;
    };

    const backHandlerSubscription = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBackPress
    );

    return () => backHandlerSubscription.remove();
  }, [canGoBack]);

  // Request camera permission on demand when needed
  const ensureCameraPermission = useCallback(async () => {
    if (!cameraPermission?.granted) {
      const response = await requestCameraPermission();
      if (!response.granted) {
        if (Platform.OS === 'android') {
          ToastAndroid.show(
            'Camera permission is required to take an animal photo. You can still upload from gallery.',
            ToastAndroid.LONG
          );
        }
        return false;
      }
    }
    return true;
  }, [cameraPermission, requestCameraPermission]);

  // Request location permission on demand when needed
  const ensureLocationPermission = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch {
      return false;
    }
  }, []);

  // Intercept and handle external links and custom schemes
  const handleShouldStartLoadWithRequest = (request: ShouldStartLoadRequest): boolean => {
    const { url } = request;

    // Standard in-webview protocols
    if (url.startsWith('about:') || url.startsWith('data:') || url.startsWith('blob:')) {
      return true;
    }

    // Phone calls (tel:)
    if (url.startsWith('tel:')) {
      Linking.openURL(url).catch((err) =>
        console.warn('Unable to launch phone dialer:', err)
      );
      return false;
    }

    // Email client (mailto:)
    if (url.startsWith('mailto:')) {
      Linking.openURL(url).catch((err) =>
        console.warn('Unable to launch email client:', err)
      );
      return false;
    }

    // Maps and navigation (geo: or Google Maps URLs)
    if (
      url.startsWith('geo:') ||
      url.includes('maps.google.') ||
      url.includes('goo.gl/maps')
    ) {
      Linking.openURL(url).catch((err) =>
        console.warn('Unable to launch map directions:', err)
      );
      return false;
    }

    // Generic Android Intent URLs
    if (url.startsWith('intent:')) {
      Linking.openURL(url).catch((err) =>
        console.warn('Unable to handle Android intent:', err)
      );
      return false;
    }

    // Internal website navigation matching base host or localhost/testing
    try {
      const baseHost = new URL(WEB_URL).hostname;
      const targetHost = new URL(url).hostname;

      if (
        targetHost === baseHost ||
        targetHost === 'localhost' ||
        targetHost === '127.0.0.1' ||
        targetHost === '10.0.2.2' ||
        url.startsWith(WEB_URL)
      ) {
        return true;
      }

      // External third-party URLs: open in device's external browser
      Linking.openURL(url).catch((err) =>
        console.warn('Unable to open external browser:', err)
      );
      return false;
    } catch {
      return true;
    }
  };

  // Reload current page on retry
  const handleRetry = () => {
    setHasError(false);
    setErrorMessage('');
    setIsLoading(true);
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D3A22" />

      {/* Branded Header Bar (PashuPehchan Green) */}
      <View style={styles.topBar}>
        <View style={styles.topBarContent}>
          <Image
            source={require('./assets/icon.png')}
            style={styles.logoIcon}
            resizeMode="contain"
          />
          <View>
            <Text style={styles.appName}>PashuPehchan</Text>
            <Text style={styles.appTagline}>AI Livestock Platform</Text>
          </View>
        </View>

        {isLoading && (
          <ActivityIndicator size="small" color="#4ADE80" style={styles.topBarSpinner} />
        )}
      </View>

      {/* Thin animated loading progress bar */}
      {isLoading && loadingProgress < 1 && (
        <View style={styles.progressBarTrack}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${Math.max(loadingProgress * 100, 15)}%` },
            ]}
          />
        </View>
      )}

      {/* Native Offline / Error Recovery Screen */}
      {hasError ? (
        <View style={styles.errorContainer}>
          <View style={styles.errorCard}>
            <View style={styles.errorIconCircle}>
              <Text style={styles.errorEmoji}>📡</Text>
            </View>
            <Text style={styles.errorTitle}>PashuPehchan is currently unavailable</Text>
            <Text style={styles.errorSubtitle}>
              {errorMessage || 'Please check your internet connection and try again.'}
            </Text>

            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleRetry}
              activeOpacity={0.8}
            >
              <Text style={styles.retryButtonText}>Retry Connection</Text>
            </TouchableOpacity>

            <Text style={styles.serverInfoText}>Connecting to: {WEB_URL}</Text>
          </View>
        </View>
      ) : (
        /* Main Native WebView Shell */
        <WebView
          ref={webViewRef}
          source={{ uri: WEB_URL }}
          style={styles.webView}
          // Enable essential web capabilities
          javaScriptEnabled={true}
          domStorageEnabled={true}
          sharedCookiesEnabled={true}
          thirdPartyCookiesEnabled={true}
          cacheEnabled={true}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          geolocationEnabled={true}
          originWhitelist={['*']}
          pullToRefreshEnabled={true}
          allowsBackForwardNavigationGestures={true}
          setSupportMultipleWindows={false}
          // Permissions and File Chooser handling
          onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
          onNavigationStateChange={(navState: WebViewNavigation) => {
            setCanGoBack(navState.canGoBack);
          }}
          onLoadStart={() => {
            setIsLoading(true);
            setHasError(false);
          }}
          onLoadProgress={({ nativeEvent }) => {
            setLoadingProgress(nativeEvent.progress);
          }}
          onLoadEnd={() => {
            setIsLoading(false);
          }}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            setIsLoading(false);
            setHasError(true);
            setErrorMessage(nativeEvent.description || 'Failed to connect to PashuPehchan.');
          }}
          onHttpError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            if (nativeEvent.statusCode >= 400) {
              setIsLoading(false);
              setHasError(true);
              setErrorMessage(`Server returned error code: ${nativeEvent.statusCode}`);
            }
          }}
          onFileDownload={({ nativeEvent }) => {
            if (nativeEvent.downloadUrl) {
              Linking.openURL(nativeEvent.downloadUrl).catch((err) =>
                console.warn('Download error:', err)
              );
            }
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D3A22',
  },
  topBar: {
    height: 52,
    backgroundColor: '#0D3A22',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  topBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
  },
  appName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  appTagline: {
    fontSize: 10,
    fontWeight: '500',
    color: '#86EFAC',
    marginTop: -2,
  },
  topBarSpinner: {
    paddingRight: 4,
  },
  progressBarTrack: {
    height: 3,
    backgroundColor: '#0D3A22',
    width: '100%',
  },
  progressBarFill: {
    height: 3,
    backgroundColor: '#22C55E',
  },
  webView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#F8FAF9',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  errorIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorEmoji: {
    fontSize: 32,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#166534',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#166534',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  serverInfoText: {
    marginTop: 18,
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
  },
});
