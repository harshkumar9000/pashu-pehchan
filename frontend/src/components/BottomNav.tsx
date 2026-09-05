import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  Home,
  Camera,
  Layers,
  ShoppingBag,
  Stethoscope,
  TrendingUp,
  Scale,
  Bookmark,
  MessageSquare,
  ShieldCheck,
  BarChart2,
  ClipboardList,
} from 'lucide-react';
import { colors } from '../theme/colors';
import { ScreenName } from '../types';
import { useAuth } from '../context/AuthContext';

interface BottomNavProps {
  currentScreen: ScreenName;
  onNavigate: (screen: ScreenName) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentScreen, onNavigate }) => {
  const { role } = useAuth();

  let tabs: { key: ScreenName; label: string; icon: any; isCenter?: boolean }[] = [];

  if (role === 'MIDDLEMAN') {
    tabs = [
      { key: 'middleman_home', label: 'Trading', icon: TrendingUp },
      { key: 'middleman_marketplace', label: 'Market', icon: ShoppingBag },
      { key: 'compare_animals', label: 'Compare', icon: Scale, isCenter: true },
      { key: 'saved_animals', label: 'Watchlist', icon: Bookmark },
      { key: 'middleman_enquiries', label: 'Offers', icon: MessageSquare },
    ];
  } else if (role === 'ADMIN') {
    tabs = [
      { key: 'admin', label: 'System', icon: ShieldCheck },
      { key: 'dashboard', label: 'Analytics', icon: BarChart2 },
      { key: 'scan', label: 'AI Scan', icon: Camera, isCenter: true },
      { key: 'history', label: 'Audit Log', icon: ClipboardList },
      { key: 'vets', label: 'Vet Clinics', icon: Stethoscope },
    ];
  } else {
    // Farmer (Default)
    tabs = [
      { key: 'home', label: 'Home', icon: Home },
      { key: 'my_livestock', label: 'My Herd', icon: Layers },
      { key: 'scan', label: 'AI Scan', icon: Camera, isCenter: true },
      { key: 'farmer_marketplace', label: 'Market', icon: ShoppingBag },
      { key: 'vets', label: 'Find a Vet', icon: Stethoscope },
    ];
  }

  return (
    <View style={styles.navContainer}>
      {tabs.map((tab) => {
        const IconComponent = tab.icon;
        const isActive = currentScreen === tab.key;

        if (tab.isCenter) {
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.centerTabButton}
              onPress={() => onNavigate(tab.key)}
              activeOpacity={0.85}
            >
              <View style={styles.centerIconCircle}>
                <IconComponent size={22} color="#ffffff" />
              </View>
              <Text style={styles.centerLabel}>{tab.label}</Text>
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tabButton}
            onPress={() => onNavigate(tab.key)}
            activeOpacity={0.7}
          >
            <IconComponent
              size={20}
              color={isActive ? colors.primary : colors.textMuted}
              strokeWidth={isActive ? 2.3 : 1.8}
            />
            <Text
              style={[
                styles.tabLabel,
                isActive ? styles.tabLabelActive : styles.tabLabelInactive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  navContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 0,
    paddingBottom: 10,
    paddingTop: 8,
    paddingHorizontal: 12,
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    boxShadow: '0 -3px 10px rgba(0, 0, 0, 0.06)',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    borderRadius: 10,
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 3,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  tabLabelInactive: {
    color: colors.textMuted,
  },
  centerTabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -18,
  },
  centerIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 8px rgba(45, 139, 117, 0.35)',
    borderWidth: 3,
    borderColor: colors.surface,
  },
  centerLabel: {
    fontSize: 11,
    marginTop: 3,
    fontWeight: '700',
    color: colors.primary,
  },
});
