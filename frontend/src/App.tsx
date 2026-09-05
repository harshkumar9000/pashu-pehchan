import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { colors } from './theme/colors';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { DesktopSidebar } from './components/DesktopSidebar';
import { DesktopTopBar } from './components/DesktopTopBar';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';

// Screens
import { LandingScreen } from './screens/LandingScreen';
import { LoginScreen, RegisterScreen } from './screens/auth';
import { HomeScreen } from './screens/HomeScreen';
import { ScanScreen } from './screens/ScanScreen';
import { ResultScreen } from './screens/ResultScreen';
import { VerificationScreen } from './screens/VerificationScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { BreedLibraryScreen } from './screens/BreedLibraryScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { SystemInfoScreen } from './screens/SystemInfoScreen';

// Farmer Screens
import { FarmerHomeScreen } from './screens/farmer/FarmerHomeScreen';
import { MyLivestockScreen } from './screens/farmer/MyLivestockScreen';
import { FarmerMarketplaceScreen } from './screens/farmer/FarmerMarketplaceScreen';
import { FarmerEnquiriesScreen } from './screens/farmer/FarmerEnquiriesScreen';

// Middleman Screens
import { MiddlemanHomeScreen } from './screens/middleman/MiddlemanHomeScreen';
import { MiddlemanMarketplaceScreen } from './screens/middleman/MiddlemanMarketplaceScreen';
import { AnimalComparisonScreen } from './screens/middleman/AnimalComparisonScreen';
import { SavedAnimalsScreen } from './screens/middleman/SavedAnimalsScreen';
import { MiddlemanEnquiriesScreen } from './screens/middleman/MiddlemanEnquiriesScreen';

// Veterinary & Admin Screens
import { FindVetScreen } from './screens/vets/FindVetScreen';
import { AdminScreen } from './screens/admin/AdminScreen';

import {
  ScreenName,
  UserRole,
  PredictResponse,
  RecordResponse,
  MarketplaceListing,
} from './types';
import { checkHealth } from './services/api';

const useWindowWidth = () => {
  const [width, setWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return width;
};

const MainNavigator: React.FC = () => {
  const { role, user } = useAuth();
  const width = useWindowWidth();
  // Desktop-First threshold: wide screen layouts on desktop/laptops (width >= 768px)
  const isDesktop = width >= 768;

  const [currentScreen, setCurrentScreen] = useState<ScreenName>('landing');
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [activeDevice, setActiveDevice] = useState('CPU');

  // Shared inference state
  const [lastPrediction, setLastPrediction] = useState<PredictResponse | null>(null);
  const [lastImageUrl, setLastImageUrl] = useState<string | null>(null);
  const [lastAnimalTag, setLastAnimalTag] = useState<string>('PB-10482');
  const [selectedBreedForVerify, setSelectedBreedForVerify] = useState<string | undefined>();
  const [selectedBreedForScan, setSelectedBreedForScan] = useState<string | undefined>();

  // Comparison State for Middleman
  const [compareList, setCompareList] = useState<MarketplaceListing[]>([]);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  useEffect(() => {
    // Initial health check & periodic heartbeat
    const pollHealth = () => {
      checkHealth()
        .then((res) => {
          setIsBackendConnected(res.model_loaded);
          setActiveDevice(res.device);
        })
        .catch(() => {
          setIsBackendConnected(false);
        });
    };

    pollHealth();
    const timer = setInterval(pollHealth, 15000);
    return () => clearInterval(timer);
  }, []);

  // Role change tracking & automatic dashboard redirection
  const prevRoleRef = React.useRef<UserRole | null>(role);

  useEffect(() => {
    if (prevRoleRef.current && prevRoleRef.current !== role) {
      // Role actively switched -> redirect to the appropriate dashboard
      if (role === 'MIDDLEMAN') {
        setCurrentScreen('middleman_home');
      } else if (role === 'ADMIN') {
        setCurrentScreen('admin');
      } else {
        setCurrentScreen('home');
      }
    } else if (!prevRoleRef.current && role) {
      // Initial session load -> set default dashboard if on default 'home'
      if (role === 'MIDDLEMAN' && currentScreen === 'home') {
        setCurrentScreen('middleman_home');
      } else if (role === 'ADMIN' && currentScreen === 'home') {
        setCurrentScreen('admin');
      }
    }
    prevRoleRef.current = role;
  }, [role]);

  // Enforce role-based screen permissions guard
  useEffect(() => {
    if (!role) return;

    if (role === 'FARMER') {
      const farmerDisallowed: ScreenName[] = [
        'admin',
        'dashboard',
        'middleman_home',
        'middleman_marketplace',
        'compare_animals',
        'saved_animals',
        'middleman_enquiries',
      ];
      if (farmerDisallowed.includes(currentScreen)) {
        setCurrentScreen('home');
      }
    } else if (role === 'MIDDLEMAN') {
      const middlemanDisallowed: ScreenName[] = [
        'admin',
        'dashboard',
        'home',
        'my_livestock',
        'farmer_marketplace',
        'farmer_enquiries',
      ];
      if (middlemanDisallowed.includes(currentScreen)) {
        setCurrentScreen('middleman_home');
      }
    } else if (role === 'ADMIN') {
      const adminDisallowed: ScreenName[] = [
        'home',
        'my_livestock',
        'farmer_marketplace',
        'farmer_enquiries',
        'middleman_home',
        'middleman_marketplace',
        'compare_animals',
        'saved_animals',
        'middleman_enquiries',
      ];
      if (adminDisallowed.includes(currentScreen)) {
        setCurrentScreen('admin');
      }
    }
  }, [role, currentScreen]);

  const handlePredictionComplete = (
    result: PredictResponse,
    imageUrl: string,
    animalIdentifier: string
  ) => {
    setLastPrediction(result);
    setLastImageUrl(imageUrl);
    setLastAnimalTag(animalIdentifier);
    setSelectedBreedForVerify(result.top_prediction.breed);
    setCurrentScreen('results');
  };

  const handleConfirmBreed = (breed: string) => {
    setSelectedBreedForVerify(breed);
    setCurrentScreen('verify');
  };

  const handleOverrideBreed = (suggestedBreed?: string) => {
    setSelectedBreedForVerify(suggestedBreed);
    setCurrentScreen('verify');
  };

  const handleRecordSaved = (record: RecordResponse) => {
    showToast(`Record #${record.id} saved to Bharat Pashudhan & Added to your Herd!`);
    setCurrentScreen('my_livestock');
  };

  const handleQuickSampleSelect = (breedName: string) => {
    setSelectedBreedForScan(breedName);
    setCurrentScreen('scan');
  };

  const handleToggleCompare = (listing: MarketplaceListing) => {
    const exists = compareList.some((l) => l.id === listing.id);
    if (exists) {
      setCompareList(compareList.filter((l) => l.id !== listing.id));
      showToast(`Removed ${listing.breed || 'listing'} from comparison`);
    } else {
      if (compareList.length >= 3) {
        alert('You can compare a maximum of 3 cattle at a time.');
        return;
      }
      setCompareList([...compareList, listing]);
      showToast(`Added ${listing.breed || 'listing'} to comparison`);
    }
  };

  const handleRemoveFromCompare = (id: number) => {
    setCompareList(compareList.filter((l) => l.id !== id));
  };

  const handleClearCompare = () => {
    setCompareList([]);
  };

  // Screen rendering helper
  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return <FarmerHomeScreen onNavigate={(s) => setCurrentScreen(s)} />;
      case 'my_livestock':
        return <MyLivestockScreen onNavigate={(s) => setCurrentScreen(s)} />;
      case 'farmer_marketplace':
        return <FarmerMarketplaceScreen onNavigate={(s) => setCurrentScreen(s)} />;
      case 'farmer_enquiries':
        return <FarmerEnquiriesScreen onNavigate={(s) => setCurrentScreen(s)} />;
      case 'middleman_home':
        return <MiddlemanHomeScreen onNavigate={(s) => setCurrentScreen(s)} />;
      case 'middleman_marketplace':
      case 'marketplace':
        return (
          <MiddlemanMarketplaceScreen
            onNavigate={(s) => setCurrentScreen(s)}
            selectedForCompare={compareList}
            onToggleCompare={handleToggleCompare}
          />
        );
      case 'compare_animals':
        return (
          <AnimalComparisonScreen
            onNavigate={(s) => setCurrentScreen(s)}
            compareList={compareList}
            onRemoveFromCompare={handleRemoveFromCompare}
            onClearCompare={handleClearCompare}
          />
        );
      case 'saved_animals':
        return <SavedAnimalsScreen onNavigate={(s) => setCurrentScreen(s)} />;
      case 'middleman_enquiries':
        return <MiddlemanEnquiriesScreen onNavigate={(s) => setCurrentScreen(s)} />;
      case 'vets':
        return <FindVetScreen onNavigate={(s) => setCurrentScreen(s)} />;
      case 'admin':
        return <AdminScreen onNavigate={(s) => setCurrentScreen(s)} />;
      case 'scan':
        return (
          <ScanScreen
            initialBreed={selectedBreedForScan}
            onPredictionComplete={handlePredictionComplete}
          />
        );
      case 'results':
        return lastPrediction && lastImageUrl ? (
          <ResultScreen
            prediction={lastPrediction}
            imageUrl={lastImageUrl}
            animalIdentifier={lastAnimalTag}
            onConfirmBreed={handleConfirmBreed}
            onOverrideBreed={handleOverrideBreed}
            onScanAnother={() => setCurrentScreen('scan')}
          />
        ) : (
          <ScanScreen onPredictionComplete={handlePredictionComplete} />
        );
      case 'verify':
        return lastPrediction ? (
          <VerificationScreen
            prediction={lastPrediction}
            animalIdentifier={lastAnimalTag}
            initialSelectedBreed={selectedBreedForVerify}
            onBackToResults={() => setCurrentScreen('results')}
            onRecordSaved={handleRecordSaved}
          />
        ) : (
          <ScanScreen onPredictionComplete={handlePredictionComplete} />
        );
      case 'history':
        return <HistoryScreen onScanNew={() => setCurrentScreen('scan')} />;
      case 'breeds':
      case 'library':
        return (
          <BreedLibraryScreen
            onSelectBreedForScan={(breed) => {
              setSelectedBreedForScan(breed);
              setCurrentScreen('scan');
            }}
          />
        );
      case 'dashboard':
        return <DashboardScreen />;
      case 'system_info':
        return (
          <SystemInfoScreen
            onBack={() =>
              setCurrentScreen(
                role === 'MIDDLEMAN' ? 'middleman_home' : role === 'ADMIN' ? 'admin' : 'home'
              )
            }
          />
        );
      case 'landing':
        return <LandingScreen onNavigate={(s) => setCurrentScreen(s)} />;
      case 'login':
        return (
          <LoginScreen
            onNavigate={(s) => setCurrentScreen(s)}
            onLoginSuccess={(newRole) => {
              if (newRole === 'MIDDLEMAN') setCurrentScreen('middleman_home');
              else if (newRole === 'ADMIN') setCurrentScreen('admin');
              else setCurrentScreen('home');
            }}
          />
        );
      case 'register':
        return (
          <RegisterScreen
            onNavigate={(s) => setCurrentScreen(s)}
            onRegisterSuccess={(newRole) => {
              if (newRole === 'MIDDLEMAN') setCurrentScreen('middleman_home');
              else setCurrentScreen('home');
            }}
          />
        );
      default:
        return <FarmerHomeScreen onNavigate={(s) => setCurrentScreen(s)} />;
    }
  };

  if (currentScreen === 'landing' || currentScreen === 'login' || currentScreen === 'register') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#F1F8F5" />
        {currentScreen === 'login' ? (
          <LoginScreen
            onNavigate={(s) => setCurrentScreen(s)}
            onLoginSuccess={(newRole) => {
              if (newRole === 'MIDDLEMAN') setCurrentScreen('middleman_home');
              else if (newRole === 'ADMIN') setCurrentScreen('admin');
              else setCurrentScreen('home');
            }}
          />
        ) : currentScreen === 'register' ? (
          <RegisterScreen
            onNavigate={(s) => setCurrentScreen(s)}
            onRegisterSuccess={(newRole) => {
              if (newRole === 'MIDDLEMAN') setCurrentScreen('middleman_home');
              else setCurrentScreen('home');
            }}
          />
        ) : (
          <LandingScreen onNavigate={(s) => setCurrentScreen(s)} />
        )}
        {toastMessage && (
          <View style={styles.toastContainer}>
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {isDesktop ? (
        /* ================= DESKTOP WORKSPACE LAYOUT ================= */
        <View style={styles.desktopOuterContainer}>
          {/* Left Desktop Sidebar Navigation Rail */}
          <DesktopSidebar
            currentScreen={currentScreen}
            onNavigate={(s) => {
              if (s === 'scan') setSelectedBreedForScan(undefined);
              setCurrentScreen(s);
            }}
            isBackendConnected={isBackendConnected}
            activeDevice={activeDevice}
          />

          {/* Right Main Application Area */}
          <View style={styles.desktopMainArea}>
            {/* Desktop Top App Bar with Title, Search & Actions */}
            <DesktopTopBar
              currentScreen={currentScreen}
              onNavigate={(s) => {
                if (s === 'scan') setSelectedBreedForScan(undefined);
                setCurrentScreen(s);
              }}
              isBackendConnected={isBackendConnected}
              activeDevice={activeDevice}
            />

            {/* Scrollable Main Content Canvas */}
            <View style={styles.desktopContentArea}>
              <View
                key={user?.id ? `desktop-user-${user.id}-${role}` : 'desktop-anon'}
                style={styles.desktopContentInner}
              >
                {renderScreen()}
              </View>
            </View>
          </View>
        </View>
      ) : (
        /* ================= MOBILE PHONE VIEWPORT LAYOUT ================= */
        <View style={styles.mobileOuterContainer}>
          <View style={styles.mobileAppContainer}>
            {/* Mobile Header with 1-Click Role Switcher */}
            <Header
              currentScreen={currentScreen}
              onNavigate={(s) => setCurrentScreen(s)}
              isBackendConnected={isBackendConnected}
              activeDevice={activeDevice}
            />

            {/* Viewport for Active Screen */}
            <View
              key={user?.id ? `mobile-user-${user.id}-${role}` : 'mobile-anon'}
              style={styles.screenViewport}
            >
              {renderScreen()}
            </View>

            {/* Mobile Bottom Navigation Bar */}
            <BottomNav
              currentScreen={currentScreen}
              onNavigate={(s) => {
                if (s === 'scan') {
                  setSelectedBreedForScan(undefined);
                }
                setCurrentScreen(s);
              }}
            />
          </View>
        </View>
      )}

      {/* Global Toast Notification */}
      {toastMessage && (
        <View style={styles.toastContainer}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <MainNavigator />
      </AuthProvider>
    </LanguageProvider>
  );
};

export default App;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },

  /* Desktop Webapp Styles */
  desktopOuterContainer: {
    flex: 1,
    flexDirection: 'row',
    width: '100%',
    height: '100vh',
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  desktopMainArea: {
    flex: 1,
    flexDirection: 'column',
    height: '100vh',
    overflow: 'hidden',
    backgroundColor: colors.background,
  },
  desktopContentArea: {
    flex: 1,
    overflowY: 'auto' as any,
    overflowX: 'hidden' as any,
    backgroundColor: colors.background,
    width: '100%',
  },
  desktopContentInner: {
    width: '100%',
    maxWidth: 1720,
    marginHorizontal: 'auto' as any,
    paddingHorizontal: 36,
    paddingVertical: 28,
    minHeight: '100%',
  },

  /* Mobile Fallback Styles */
  mobileOuterContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSubtle,
    width: '100%',
  },
  mobileAppContainer: {
    width: '100%',
    maxWidth: 500,
    flex: 1,
    backgroundColor: colors.background,
    boxShadow: '0 8px 32px rgba(20, 83, 45, 0.12)',
    overflow: 'hidden',
    position: 'relative',
    ...(Platform.OS === 'web'
      ? {
          height: '100vh',
          maxHeight: '100vh',
          borderLeftWidth: 1,
          borderRightWidth: 1,
          borderColor: colors.border,
        }
      : {}),
  },
  screenViewport: {
    flex: 1,
  },

  /* Toast Notification — Fresh agricultural pill */
  toastContainer: {
    position: 'absolute',
    bottom: 28,
    right: 28,
    backgroundColor: colors.primaryDark,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 24,
    boxShadow: '0 8px 24px rgba(15, 61, 36, 0.22)',
    zIndex: 999,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
});

