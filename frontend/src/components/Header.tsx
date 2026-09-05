import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { ShieldCheck, Info, UserCheck, ChevronDown, Bell, Check } from 'lucide-react';
import { colors } from '../theme/colors';
import { ScreenName, UserRole } from '../types';
import { useAuth } from '../context/AuthContext';
import { LanguageSelector } from './LanguageSelector';

interface HeaderProps {
  currentScreen: ScreenName;
  onNavigate: (screen: ScreenName) => void;
  isBackendConnected: boolean;
  activeDevice?: string;
  unreadNotificationsCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  onNavigate,
  isBackendConnected,
  activeDevice = 'CPU',
  unreadNotificationsCount = 0,
}) => {
  const { user, role, switchDemoRole, logout } = useAuth();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  const handleRoleSwitch = async (targetRole: UserRole) => {
    if (isSwitching) return;
    if (targetRole === role) {
      setShowRoleMenu(false);
      return;
    }
    setIsSwitching(true);
    setShowRoleMenu(false);
    try {
      await switchDemoRole(targetRole);
      if (targetRole === 'FARMER') onNavigate('home');
      else if (targetRole === 'MIDDLEMAN') onNavigate('middleman_home');
      else if (targetRole === 'ADMIN') onNavigate('admin');
    } catch (err: any) {
      if (typeof window !== 'undefined' && window.alert) {
        window.alert('Unable to switch account. Please try again.');
      }
    } finally {
      setIsSwitching(false);
    }
  };

  const getRoleLabel = () => {
    if (isSwitching) return 'Switching...';
    if (role === 'MIDDLEMAN') return 'Middleman';
    if (role === 'ADMIN') return 'Supervisor';
    return 'Farmer';
  };

  return (
    <View style={styles.headerContainer}>
      <View style={styles.topRow}>
        <TouchableOpacity
          style={styles.brandingRow}
          onPress={() => {
            if (role === 'MIDDLEMAN') onNavigate('middleman_home');
            else if (role === 'ADMIN') onNavigate('admin');
            else onNavigate('home');
          }}
          activeOpacity={0.8}
        >
          <Image
            source={{ uri: '/logo.png' }}
            style={styles.headerLogoImage}
            resizeMode="contain"
          />
        </TouchableOpacity>

        <View style={styles.rightActions}>
          {/* Whole-site Language Selector */}
          <LanguageSelector compact />

          {/* Quick Role Switcher for Hackathon Demo */}
          <View style={styles.roleDropdownWrapper}>
            <TouchableOpacity
              style={[styles.roleSelector, isSwitching && { opacity: 0.7 }]}
              onPress={() => !isSwitching && setShowRoleMenu(!showRoleMenu)}
              activeOpacity={0.8}
              disabled={isSwitching}
            >
              <UserCheck size={14} color={colors.primary} />
              <Text style={styles.roleText}>{getRoleLabel()}</Text>
              {isSwitching ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <ChevronDown size={12} color={colors.textSecondary} />
              )}
            </TouchableOpacity>

            {showRoleMenu && (
              <View style={styles.roleMenu}>
                <TouchableOpacity
                  style={[styles.roleMenuItem, role === 'FARMER' && styles.roleMenuItemActive]}
                  onPress={() => handleRoleSwitch('FARMER')}
                  disabled={isSwitching}
                >
                  <View style={styles.roleMenuItemRow}>
                    <Text style={[styles.roleMenuText, role === 'FARMER' && styles.roleMenuTextActive]}>
                      🌾 Farmer (Ramesh)
                    </Text>
                    {role === 'FARMER' && <Check size={12} color={colors.primary} />}
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.roleMenuItem, role === 'MIDDLEMAN' && styles.roleMenuItemActive]}
                  onPress={() => handleRoleSwitch('MIDDLEMAN')}
                  disabled={isSwitching}
                >
                  <View style={styles.roleMenuItemRow}>
                    <Text style={[styles.roleMenuText, role === 'MIDDLEMAN' && styles.roleMenuTextActive]}>
                      🤝 Middleman (Kishore)
                    </Text>
                    {role === 'MIDDLEMAN' && <Check size={12} color={colors.primary} />}
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.roleMenuItem, role === 'ADMIN' && styles.roleMenuItemActive]}
                  onPress={() => handleRoleSwitch('ADMIN')}
                  disabled={isSwitching}
                >
                  <View style={styles.roleMenuItemRow}>
                    <Text style={[styles.roleMenuText, role === 'ADMIN' && styles.roleMenuTextActive]}>
                      🛡️ Admin (Supervisor)
                    </Text>
                    {role === 'ADMIN' && <Check size={12} color={colors.primary} />}
                  </View>
                </TouchableOpacity>
                <View style={{ height: 1, backgroundColor: '#E2EFE7', marginVertical: 4 }} />
                <TouchableOpacity
                  style={styles.roleMenuItem}
                  onPress={async () => {
                    setShowRoleMenu(false);
                    await logout();
                    onNavigate('login');
                  }}
                >
                  <View style={styles.roleMenuItemRow}>
                    <Text style={[styles.roleMenuText, { color: colors.danger, fontWeight: '700' }]}>
                      🚪 Sign Out
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Model Status */}
          <View
            style={[
              styles.connectionBadge,
              isBackendConnected ? styles.connOnline : styles.connOffline,
            ]}
          >
            <View
              style={[
                styles.statusDot,
                isBackendConnected ? styles.dotOnline : styles.dotOffline,
              ]}
            />
            <Text style={styles.connText}>
              {isBackendConnected ? `Model: ${activeDevice}` : 'Connecting...'}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.iconButton,
              currentScreen === 'system_info' && styles.iconButtonActive,
            ]}
            onPress={() => onNavigate('system_info')}
            title="System Info"
          >
            <Info
              size={18}
              color={currentScreen === 'system_info' ? colors.primary : colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    boxShadow: '0 2px 8px rgba(20, 83, 45, 0.04)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 100,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  brandingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerLogoImage: {
    width: 60,
    height: 60,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roleDropdownWrapper: {
    position: 'relative',
    zIndex: 101,
  },
  roleSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  roleMenu: {
    position: 'absolute',
    top: 36,
    right: 0,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 6,
    width: 180,
    boxShadow: '0 8px 24px rgba(20, 83, 45, 0.12)',
    zIndex: 102,
  },
  roleMenuItem: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  roleMenuItemActive: {
    backgroundColor: colors.sidebarActiveBg,
  },
  roleMenuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  roleMenuText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  roleMenuTextActive: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  connectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  connOnline: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primaryBorder,
  },
  connOffline: {
    backgroundColor: colors.warningBg,
    borderColor: colors.accentBorder,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotOnline: {
    backgroundColor: colors.primaryLight,
  },
  dotOffline: {
    backgroundColor: colors.accent,
  },
  connText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconButtonActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primaryBorder,
  },
});

