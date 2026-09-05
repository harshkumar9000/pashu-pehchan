import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Platform } from 'react-native';
import { Globe, Check, ChevronDown, X } from 'lucide-react';
import { useLanguage, SUPPORTED_LANGUAGES, LanguageCode } from '../context/LanguageContext';
import { colors } from '../theme/colors';

interface LanguageSelectorProps {
  compact?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ compact = false }) => {
  const { language, currentLanguage, setLanguage } = useLanguage();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleSelect = (code: LanguageCode) => {
    setLanguage(code);
    setShowDropdown(false);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.langPill, compact && styles.langPillCompact]}
        onPress={() => setShowDropdown(!showDropdown)}
        activeOpacity={0.8}
        accessibilityLabel="Select Language"
      >
        <Globe size={14} color={colors.primary} />
        <Text style={styles.langFlag}>{currentLanguage.flag}</Text>
        <Text style={styles.langLabel}>
          {compact ? currentLanguage.code.toUpperCase() : currentLanguage.nativeName}
        </Text>
        <ChevronDown size={12} color="#64748B" />
      </TouchableOpacity>

      {showDropdown && (
        <Modal
          visible={showDropdown}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDropdown(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowDropdown(false)}
          >
            <View style={styles.dropdownCard} onStartShouldSetResponder={() => true}>
              <View style={styles.dropdownHeader}>
                <View style={styles.headerLeft}>
                  <Globe size={16} color={colors.primary} />
                  <Text style={styles.dropdownTitle}>Translate Site</Text>
                </View>
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => setShowDropdown(false)}
                  activeOpacity={0.7}
                >
                  <X size={16} color="#64748B" />
                </TouchableOpacity>
              </View>
              <Text style={styles.dropdownSubtitle}>
                Select your regional language for the entire platform:
              </Text>

              <View style={styles.optionsList}>
                {SUPPORTED_LANGUAGES.map((item) => {
                  const isSelected = item.code === language;
                  return (
                    <TouchableOpacity
                      key={item.code}
                      style={[styles.optionRow, isSelected && styles.optionRowSelected]}
                      onPress={() => handleSelect(item.code)}
                      activeOpacity={0.75}
                    >
                      <View style={styles.optionLeft}>
                        <Text style={styles.optionFlag}>{item.flag}</Text>
                        <View>
                          <Text style={[styles.optionNative, isSelected && styles.optionNativeSelected]}>
                            {item.nativeName}
                          </Text>
                          <Text style={styles.optionEnglish}>{item.label}</Text>
                        </View>
                      </View>
                      {isSelected && <Check size={16} color={colors.primary} />}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.footerNote}>
                <Text style={styles.footerNoteText}>
                  ✨ Powered by Neural Machine Translation for Indian Languages
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 110,
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAF9',
    borderWidth: 1,
    borderColor: '#E2EFE7',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    boxShadow: '0 2px 8px rgba(15, 61, 36, 0.04)',
  },
  langPillCompact: {
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  langFlag: {
    fontSize: 13,
  },
  langLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F3D24',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 61, 36, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  dropdownCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    width: '100%',
    maxWidth: 380,
    borderWidth: 1,
    borderColor: '#E2EFE7',
    boxShadow: '0 20px 40px rgba(15, 61, 36, 0.15)',
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dropdownTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F3D24',
  },
  closeBtn: {
    padding: 4,
  },
  dropdownSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 16,
  },
  optionsList: {
    gap: 8,
    marginBottom: 14,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#F8FAF9',
    borderWidth: 1,
    borderColor: '#E2EFE7',
  },
  optionRowSelected: {
    backgroundColor: '#EDF9F1',
    borderColor: '#86EFAC',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionFlag: {
    fontSize: 18,
  },
  optionNative: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  optionNativeSelected: {
    color: '#16A34A',
    fontWeight: '800',
  },
  optionEnglish: {
    fontSize: 11,
    color: '#64748B',
  },
  footerNote: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
    alignItems: 'center',
  },
  footerNoteText: {
    fontSize: 10,
    color: '#94A3B8',
    textAlign: 'center',
    fontWeight: '600',
  },
});
