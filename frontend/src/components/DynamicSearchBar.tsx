import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  Modal,
} from 'react-native';
import {
  Search,
  X,
  Camera,
  BookOpen,
  ShoppingBag,
  Stethoscope,
  ShieldCheck,
  Scale,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Tag,
  PhoneCall,
  CheckCircle2,
} from 'lucide-react';
import { colors } from '../theme/colors';
import { ScreenName } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { initiatePhoneCall } from './adapters/contact';

export interface SearchRecommendation {
  id: string;
  title: string;
  subtitle: string;
  category: 'breed' | 'service' | 'marketplace' | 'emergency';
  badge?: string;
  species?: 'CATTLE' | 'BUFFALO';
  screen?: ScreenName;
  action?: () => void;
  keywords: string[];
}

const SEARCH_DATABASE: SearchRecommendation[] = [
  // --- Breeds: Cattle ---
  {
    id: 'breed-gir',
    title: 'Gir',
    subtitle: 'Gujarat • World-famous dairy breed, convex forehead, pendulous ears',
    category: 'breed',
    species: 'CATTLE',
    badge: 'High Yield Milk',
    screen: 'breeds',
    keywords: ['gir', 'cattle', 'cow', 'gujarat', 'milk', 'a2', 'dairy', 'saurashtra'],
  },
  {
    id: 'breed-sahiwal',
    title: 'Sahiwal',
    subtitle: 'Punjab • Best indigenous milch breed, reddish-brown, tick resistant',
    category: 'breed',
    species: 'CATTLE',
    badge: 'Premier Milch',
    screen: 'breeds',
    keywords: ['sahiwal', 'cattle', 'cow', 'punjab', 'milk', 'dairy', 'red'],
  },
  {
    id: 'breed-red-sindhi',
    title: 'Red Sindhi',
    subtitle: 'Heat & tick tolerant dairy cattle with high butterfat yield',
    category: 'breed',
    species: 'CATTLE',
    badge: 'High Butterfat',
    screen: 'breeds',
    keywords: ['red sindhi', 'sindhi', 'cattle', 'cow', 'dairy', 'heat tolerant'],
  },
  {
    id: 'breed-tharparkar',
    title: 'Tharparkar',
    subtitle: 'Rajasthan • White desert hardy dual-purpose cattle, disease resistant',
    category: 'breed',
    species: 'CATTLE',
    badge: 'Dual Purpose',
    screen: 'breeds',
    keywords: ['tharparkar', 'thar', 'cattle', 'cow', 'rajasthan', 'desert', 'white'],
  },
  {
    id: 'breed-kankrej',
    title: 'Kankrej',
    subtitle: 'Gujarat • Majestic lyre horns, powerful draft and milk, Sawai chal',
    category: 'breed',
    species: 'CATTLE',
    badge: 'Lyre Horns',
    screen: 'breeds',
    keywords: ['kankrej', 'cattle', 'cow', 'gujarat', 'horns', 'draft', 'wadhiyar'],
  },
  {
    id: 'breed-rathi',
    title: 'Rathi',
    subtitle: 'Rajasthan • Brown with white spots, arid ecosystem milk champion',
    category: 'breed',
    species: 'CATTLE',
    badge: 'Arid Milch',
    screen: 'breeds',
    keywords: ['rathi', 'cattle', 'cow', 'rajasthan', 'bikaner', 'milk'],
  },
  {
    id: 'breed-ongole',
    title: 'Ongole',
    subtitle: 'Andhra Pradesh • Giant white draft & meat breed, exported worldwide',
    category: 'breed',
    species: 'CATTLE',
    badge: 'World Renowned',
    screen: 'breeds',
    keywords: ['ongole', 'cattle', 'cow', 'andhra', 'prakasam', 'white', 'draft'],
  },
  {
    id: 'breed-kangayam',
    title: 'Kangayam',
    subtitle: 'Tamil Nadu • Energetic grey draft bullocks, Kongu region hardy',
    category: 'breed',
    species: 'CATTLE',
    badge: 'Tamil Nadu Draft',
    screen: 'breeds',
    keywords: ['kangayam', 'cattle', 'bull', 'cow', 'tamil nadu', 'kongu', 'draft'],
  },
  {
    id: 'breed-vechur',
    title: 'Vechur',
    subtitle: 'Kerala • World’s smallest cattle breed, easy calving, medicinal A2 milk',
    category: 'breed',
    species: 'CATTLE',
    badge: 'Miniature A2',
    screen: 'breeds',
    keywords: ['vechur', 'cattle', 'cow', 'kerala', 'miniature', 'smallest', 'a2'],
  },
  {
    id: 'breed-punganur',
    title: 'Punganur',
    subtitle: 'Andhra Pradesh • Ultra-dwarf cattle with up to 8% milk fat',
    category: 'breed',
    species: 'CATTLE',
    badge: 'Dwarf Cattle',
    screen: 'breeds',
    keywords: ['punganur', 'cattle', 'cow', 'andhra', 'dwarf', 'miniature'],
  },
  {
    id: 'breed-hariana',
    title: 'Hariana',
    subtitle: 'Haryana • White/grey dual purpose breed with alert temperament',
    category: 'breed',
    species: 'CATTLE',
    badge: 'Dual Purpose',
    screen: 'breeds',
    keywords: ['hariana', 'haryana', 'cattle', 'cow', 'dual purpose'],
  },

  // --- Breeds: Buffaloes ---
  {
    id: 'breed-murrah',
    title: 'Murrah',
    subtitle: 'Haryana • World-renowned black gold dairy buffalo, tightly curled horns',
    category: 'breed',
    species: 'BUFFALO',
    badge: 'Black Gold 25L/day',
    screen: 'breeds',
    keywords: ['murrah', 'buffalo', 'buff', 'haryana', 'milk', 'dairy', 'curled horns'],
  },
  {
    id: 'breed-nili-ravi',
    title: 'Nili-Ravi',
    subtitle: 'Punjab • Panch Kalyani white markings, premier high-fat buffalo',
    category: 'breed',
    species: 'BUFFALO',
    badge: 'Panch Kalyani',
    screen: 'breeds',
    keywords: ['nili ravi', 'nili', 'ravi', 'buffalo', 'punjab', 'panch kalyani'],
  },
  {
    id: 'breed-jaffarabadi',
    title: 'Jaffarabadi',
    subtitle: 'Gujarat • Massive heavy buffalo with prominent drooping horns',
    category: 'breed',
    species: 'BUFFALO',
    badge: 'Heaviest Breed',
    screen: 'breeds',
    keywords: ['jaffarabadi', 'jafrabadi', 'buffalo', 'gujarat', 'gir forest'],
  },
  {
    id: 'breed-bhadawari',
    title: 'Bhadawari',
    subtitle: 'Uttar Pradesh • Copper-colored buffalo with highest fat test up to 13%',
    category: 'breed',
    species: 'BUFFALO',
    badge: '13% Butterfat',
    screen: 'breeds',
    keywords: ['bhadawari', 'buffalo', 'fat', 'butterfat', 'copper', 'uttar pradesh'],
  },
  {
    id: 'breed-mehsana',
    title: 'Mehsana',
    subtitle: 'Gujarat • Murrah x Surti cross, extended lactation period',
    category: 'breed',
    species: 'BUFFALO',
    badge: 'Long Lactation',
    screen: 'breeds',
    keywords: ['mehsana', 'buffalo', 'gujarat', 'dairy'],
  },
  {
    id: 'breed-banni',
    title: 'Banni',
    subtitle: 'Kutch Gujarat • Nocturnal grazer in arid salt desert, high resilience',
    category: 'breed',
    species: 'BUFFALO',
    badge: 'Nocturnal Grazer',
    screen: 'breeds',
    keywords: ['banni', 'kutch', 'buffalo', 'gujarat', 'desert'],
  },

  // --- Platform Features & Tools ---
  {
    id: 'tool-scanner',
    title: 'AI Breed Scanner',
    subtitle: 'Real-time photo inference across 41 ICAR indigenous cattle & buffalo breeds',
    category: 'service',
    badge: 'AI Vision Engine',
    screen: 'scan',
    keywords: ['scan', 'scanner', 'camera', 'ai', 'identify', 'photo', 'inference', 'predict', 'classify'],
  },
  {
    id: 'tool-ambulance-1962',
    title: '1962 Pashu Ambulance',
    subtitle: '24x7 Government emergency veterinary helpline & mobile vet van',
    category: 'emergency',
    badge: 'Toll-Free 24x7',
    action: () => initiatePhoneCall('1962'),
    keywords: ['1962', 'emergency', 'ambulance', 'call', 'doctor', 'help', 'urgent', 'phone', 'van'],
  },
  {
    id: 'tool-vets',
    title: 'Find Verified Veterinary Polyclinics',
    subtitle: 'Locate certified government polyclinics, private vets & artificial insemination centres',
    category: 'service',
    badge: 'Geo-Located Vets',
    screen: 'vets',
    keywords: ['vet', 'vets', 'doctor', 'clinic', 'hospital', 'treatment', 'vaccine', 'insemination'],
  },
  {
    id: 'tool-marketplace',
    title: 'Livestock Marketplace',
    subtitle: 'Buy and sell AI-verified cattle & buffaloes directly with no middleman fraud',
    category: 'marketplace',
    badge: 'Direct Trade',
    screen: 'farmer_marketplace',
    keywords: ['marketplace', 'buy', 'sell', 'market', 'trade', 'price', 'cattle', 'cow', 'buffalo', 'mandi'],
  },
  {
    id: 'tool-compare',
    title: 'Side-by-Side Cattle Comparison',
    subtitle: 'Compare milk yields, lactation history, horn shape & price before buying',
    category: 'marketplace',
    badge: 'Trader Tool',
    screen: 'compare_animals',
    keywords: ['compare', 'comparison', 'evaluation', 'side by side', 'yield'],
  },
  {
    id: 'tool-verify',
    title: 'Ear Tag & Bharat Pashudhan Verification',
    subtitle: 'Sync 12-digit RFID ear tag records with INAPH national registry',
    category: 'service',
    badge: 'Bharat Pashudhan',
    screen: 'verify',
    keywords: ['verify', 'tag', 'ear tag', 'rfid', 'bharat pashudhan', 'inaph', 'register'],
  },
  {
    id: 'tool-history',
    title: 'Verification Audit Logs & History',
    subtitle: 'Chronological timeline of all farm scans, verifications and breed certificates',
    category: 'service',
    badge: 'Audit Trail',
    screen: 'history',
    keywords: ['history', 'audit', 'logs', 'records', 'past scans', 'certificate'],
  },
  {
    id: 'tool-system-specs',
    title: 'System Telemetry & Architecture',
    subtitle: 'EfficientNet-B0 runtime specs, ONNX runtime, CPU latency & benchmark stats',
    category: 'service',
    badge: 'Tech Specs',
    screen: 'system_info',
    keywords: ['system', 'model', 'onnx', 'cpu', 'latency', 'specs', 'architecture', 'api'],
  },
];

const TRENDING_RECOMMENDATIONS = [
  SEARCH_DATABASE[0], // Gir
  SEARCH_DATABASE[11], // Murrah
  SEARCH_DATABASE[1], // Sahiwal
  SEARCH_DATABASE[17], // Scanner
  SEARCH_DATABASE[19], // Vets
  SEARCH_DATABASE[20], // Marketplace
];

interface DynamicSearchBarProps {
  onNavigate: (screen: ScreenName) => void;
  compact?: boolean;
}

export const DynamicSearchBar: React.FC<DynamicSearchBarProps> = ({ onNavigate, compact = false }) => {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<any>(null);

  // Filter recommendations based on every word typed
  const filteredResults = React.useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return TRENDING_RECOMMENDATIONS;
    }

    const words = trimmed.split(/\s+/).filter(Boolean);

    return SEARCH_DATABASE.filter((item) => {
      return words.every((word) => {
        return (
          item.title.toLowerCase().includes(word) ||
          item.subtitle.toLowerCase().includes(word) ||
          (item.badge && item.badge.toLowerCase().includes(word)) ||
          item.keywords.some((k) => k.toLowerCase().includes(word))
        );
      });
    }).slice(0, 7);
  }, [query]);

  const handleSelectItem = (item: SearchRecommendation) => {
    setIsOpen(false);
    setQuery('');
    if (item.action) {
      item.action();
    } else if (item.screen) {
      onNavigate(item.screen);
    }
  };

  const getCategoryIcon = (category: SearchRecommendation['category'], species?: string) => {
    if (category === 'breed') {
      return species === 'BUFFALO' ? '🐃' : '🐄';
    }
    if (category === 'emergency') return '🚨';
    if (category === 'marketplace') return '🛒';
    return '⚡';
  };

  return (
    <View style={styles.wrapper}>
      {/* Search Input Box */}
      <View style={[styles.searchBox, compact && styles.searchBoxCompact, isOpen && styles.searchBoxActive]}>
        <Search size={15} color={isOpen ? colors.primary : '#64748B'} />
        <TextInput
          ref={inputRef}
          style={styles.searchInput}
          placeholder={compact ? 'Search...' : t('searchPlaceholder')}
          placeholderTextColor="#94A3B8"
          value={query}
          onChangeText={(text) => {
            setQuery(text);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
        {query.length > 0 && (
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            activeOpacity={0.7}
          >
            <X size={13} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Dynamic Dropdown Recommendations */}
      {isOpen && (
        <>
          {/* Invisible Backdrop to close on click outside */}
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={() => setIsOpen(false)}
          />

          <View style={styles.dropdownContainer}>
            <View style={styles.dropdownHeader}>
              <View style={styles.dropdownHeaderLeft}>
                <Sparkles size={12} color={colors.primary} />
                <Text style={styles.dropdownHeaderText}>
                  {query.trim() ? `Search Results (${filteredResults.length})` : '🔥 Trending Breeds & Tools'}
                </Text>
              </View>
              <Text style={styles.dropdownHeaderHint}>Real-time recommendations</Text>
            </View>

            <ScrollView
              style={styles.resultsScroll}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {filteredResults.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateIcon}>🔍</Text>
                  <Text style={styles.emptyStateTitle}>No direct match for "{query}"</Text>
                  <Text style={styles.emptyStateSubtitle}>
                    Try searching "Gir", "Murrah", "Scanner", "Vet", or "Marketplace"
                  </Text>
                </View>
              ) : (
                filteredResults.map((item) => {
                  const icon = getCategoryIcon(item.category, item.species);
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.resultItem}
                      onPress={() => handleSelectItem(item)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.resultIconWrap}>
                        <Text style={styles.resultIconText}>{icon}</Text>
                      </View>

                      <View style={styles.resultInfo}>
                        <View style={styles.resultTitleRow}>
                          <Text style={styles.resultTitle}>{item.title}</Text>
                          {item.badge && (
                            <View
                              style={[
                                styles.resultBadge,
                                item.category === 'emergency' && styles.resultBadgeEmergency,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.resultBadgeText,
                                  item.category === 'emergency' && styles.resultBadgeEmergencyText,
                                ]}
                              >
                                {item.badge}
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.resultSubtitle} numberOfLines={1}>
                          {item.subtitle}
                        </Text>
                      </View>

                      <ArrowRight size={14} color="#94A3B8" />
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>

            <View style={styles.dropdownFooter}>
              <Text style={styles.dropdownFooterText}>
                Tip: Type breed names (e.g. Sahiwal, Murrah) to view ICAR standards
              </Text>
            </View>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    zIndex: 1000,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAF9',
    borderWidth: 1,
    borderColor: '#E2EFE7',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 22,
    width: 280,
    boxShadow: '0 2px 8px rgba(15, 61, 36, 0.04)',
  },
  searchBoxCompact: {
    width: 200,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  searchBoxActive: {
    borderColor: '#16A34A',
    backgroundColor: '#FFFFFF',
    boxShadow: '0 4px 16px rgba(22, 163, 74, 0.12)',
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#0F3D24',
    outlineStyle: 'none' as any,
    padding: 0,
    margin: 0,
  },
  clearBtn: {
    padding: 2,
  },
  backdrop: {
    position: 'fixed' as any,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 998,
  },
  dropdownContainer: {
    position: 'absolute',
    top: 46,
    left: 0,
    width: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E2EFE7',
    boxShadow: '0 16px 40px rgba(15, 61, 36, 0.15)',
    zIndex: 999,
    overflow: 'hidden',
    maxHeight: 440,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F8FAF9',
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2EE',
  },
  dropdownHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dropdownHeaderText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F3D24',
    letterSpacing: 0.3,
  },
  dropdownHeaderHint: {
    fontSize: 10,
    color: '#94A3B8',
  },
  resultsScroll: {
    maxHeight: 340,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  resultIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#EDF9F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultIconText: {
    fontSize: 16,
  },
  resultInfo: {
    flex: 1,
  },
  resultTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  resultTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F3D24',
  },
  resultBadge: {
    backgroundColor: '#EDF9F1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  resultBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#16A34A',
  },
  resultBadgeEmergency: {
    backgroundColor: '#FEE2E2',
  },
  resultBadgeEmergencyText: {
    color: '#DC2626',
  },
  resultSubtitle: {
    fontSize: 11,
    color: '#64748B',
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  emptyStateTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F3D24',
    marginBottom: 4,
  },
  emptyStateSubtitle: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
  },
  dropdownFooter: {
    backgroundColor: '#F8FAF9',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#EDF2EE',
  },
  dropdownFooterText: {
    fontSize: 10,
    color: '#64748B',
    textAlign: 'center',
  },
});
