import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {
  Search,
  BookOpen,
  Filter,
  MapPin,
  Sparkles,
  ChevronDown,
  ChevronUp,
  X,
  Camera,
} from 'lucide-react';
import { colors } from '../theme/colors';
import { BreedItem, AnimalType } from '../types';
import { getBreeds } from '../services/api';

interface BreedLibraryScreenProps {
  onSelectBreedForScan?: (breedName: string) => void;
}

export const BreedLibraryScreen: React.FC<BreedLibraryScreenProps> = ({
  onSelectBreedForScan,
}) => {
  const [breeds, setBreeds] = useState<BreedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState<'All' | 'Cattle' | 'Buffalo'>('All');
  const [expandedBreed, setExpandedBreed] = useState<string | null>(null);

  useEffect(() => {
    getBreeds()
      .then((data) => setBreeds(data))
      .catch((err) => console.log('Error fetching breeds library:', err))
      .finally(() => setLoading(false));
  }, []);

  const filteredBreeds = breeds.filter((b) => {
    const matchesSpecies = speciesFilter === 'All' || b.animal_type === speciesFilter;
    const matchesSearch =
      b.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.region && b.region.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (b.purpose && b.purpose.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSpecies && matchesSearch;
  });

  const cattleCount = breeds.filter((b) => b.animal_type === 'Cattle').length;
  const buffaloCount = breeds.filter((b) => b.animal_type === 'Buffalo').length;

  const [windowWidth, setWindowWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isDesktop = windowWidth >= 768;
  const breedCardWidth =
    windowWidth >= 1350
      ? ('calc(33.333% - 10px)' as any)
      : windowWidth >= 768
      ? ('calc(50% - 8px)' as any)
      : ('100%' as any);

  return (
    <View style={[styles.container, isDesktop && styles.desktopContainer]}>
      <ScrollView
        style={isDesktop ? styles.desktopScrollView : undefined}
        contentContainerStyle={[styles.content, isDesktop && styles.desktopContent]}
      >
        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.screenTitle}>ICAR-NBAGR Breed Library</Text>
          <Text style={styles.screenSubtitle}>
            Official catalog of 41 indigenous bovine breeds recognized for national livestock registration.
          </Text>
        </View>

        {/* Search */}
        <View style={styles.searchBar}>
          <Search size={16} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by breed or region (e.g. Gujarat, Punjab)..."
            placeholderTextColor={colors.textMuted}
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={() => setSearchTerm('')}>
              <X size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Species Filter Tabs */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tabPill, speciesFilter === 'All' && styles.tabPillActive]}
            onPress={() => setSpeciesFilter('All')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                speciesFilter === 'All' && styles.tabTextActive,
              ]}
            >
              All Breeds ({breeds.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabPill,
              speciesFilter === 'Cattle' && styles.tabPillActive,
            ]}
            onPress={() => setSpeciesFilter('Cattle')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                speciesFilter === 'Cattle' && styles.tabTextActive,
              ]}
            >
              Cattle ({cattleCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabPill,
              speciesFilter === 'Buffalo' && styles.tabPillActive,
            ]}
            onPress={() => setSpeciesFilter('Buffalo')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                speciesFilter === 'Buffalo' && styles.tabTextActive,
              ]}
            >
              Buffalo ({buffaloCount})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Breed List */}
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading ICAR breed database...</Text>
          </View>
        ) : filteredBreeds.length === 0 ? (
          <View style={styles.centerBox}>
            <Text style={styles.emptyText}>No breeds found matching your criteria</Text>
          </View>
        ) : (
          <View style={[styles.breedList, isDesktop && styles.desktopBreedList]}>
            {filteredBreeds.map((b) => {
              const isExpanded = expandedBreed === b.breed;
              const isBuffalo = b.animal_type === 'Buffalo';

              return (
                <View
                  key={b.breed}
                  style={[
                    styles.breedCard,
                    isDesktop && { width: breedCardWidth, maxWidth: breedCardWidth },
                  ]}
                >
                  <TouchableOpacity
                    style={styles.cardHeader}
                    onPress={() =>
                      setExpandedBreed(isExpanded ? null : b.breed)
                    }
                    activeOpacity={0.7}
                  >
                    <View style={styles.cardHeaderLeft}>
                      <View style={styles.breedNameRow}>
                        <Text style={styles.breedName}>{b.display_name}</Text>
                        <View
                          style={[
                            styles.speciesBadge,
                            isBuffalo ? styles.badgeBuffalo : styles.badgeCattle,
                          ]}
                        >
                          <Text
                            style={[
                              styles.speciesBadgeText,
                              isBuffalo ? styles.textBuffalo : styles.textCattle,
                            ]}
                          >
                            {b.animal_type}
                          </Text>
                        </View>
                      </View>

                      {b.region ? (
                        <View style={styles.regionRow}>
                          <MapPin size={12} color={colors.textMuted} />
                          <Text style={styles.regionText}>{b.region}</Text>
                        </View>
                      ) : null}
                    </View>

                    {isExpanded ? (
                      <ChevronUp size={18} color={colors.textMuted} />
                    ) : (
                      <ChevronDown size={18} color={colors.textMuted} />
                    )}
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={styles.cardBody}>
                      <View style={styles.traitsGrid}>
                        <View style={styles.traitBox}>
                          <Text style={styles.traitLabel}>PURPOSE</Text>
                          <Text style={styles.traitValue}>{b.purpose || 'Dual Purpose'}</Text>
                        </View>
                        <View style={styles.traitBox}>
                          <Text style={styles.traitLabel}>COAT COLOR</Text>
                          <Text style={styles.traitValue}>{b.coat_color || 'Variable'}</Text>
                        </View>
                        <View style={[styles.traitBox, { width: '100%' }]}>
                          <Text style={styles.traitLabel}>HORN STRUCTURE</Text>
                          <Text style={styles.traitValue}>{b.horn_type || 'Distinctive'}</Text>
                        </View>
                      </View>

                      {b.characteristics ? (
                        <View style={styles.charBox}>
                          <Text style={styles.charTitle}>Identification Markers:</Text>
                          <Text style={styles.charText}>{b.characteristics}</Text>
                        </View>
                      ) : null}

                      {onSelectBreedForScan && (
                        <TouchableOpacity
                          style={styles.scanWithBreedBtn}
                          onPress={() => onSelectBreedForScan(b.breed)}
                          activeOpacity={0.8}
                        >
                          <Camera size={14} color="#ffffff" />
                          <Text style={styles.scanWithBreedText}>
                            Load Benchmark Sample for {b.display_name}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  desktopContainer: {
    backgroundColor: 'transparent',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  desktopScrollView: {
    overflow: 'visible' as any,
    flex: 'none' as any,
    height: 'auto' as any,
  },
  desktopContent: {
    padding: 0,
    paddingBottom: 32,
  },
  titleSection: {
    marginBottom: 16,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  screenSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    marginBottom: 14,
    boxShadow: '0 2px 6px rgba(45, 139, 117, 0.08)',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.textPrimary,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tabPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    boxShadow: '0 1px 3px rgba(45, 139, 117, 0.06)',
  },
  tabPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    boxShadow: '0 2px 6px rgba(45, 139, 117, 0.25)',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  centerBox: {
    paddingVertical: 48,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },
  breedList: {
    gap: 10,
  },
  desktopBreedList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  breedCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(45, 139, 117, 0.08)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  breedNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  breedName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  speciesBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeCattle: {
    backgroundColor: colors.cattleBg,
    borderColor: colors.cattleBorder,
  },
  badgeBuffalo: {
    backgroundColor: colors.buffaloBg,
    borderColor: colors.buffaloBorder,
  },
  speciesBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  textCattle: {
    color: colors.cattleBadge,
  },
  textBuffalo: {
    color: colors.buffaloBadge,
  },
  regionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  regionText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  cardBody: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: 10,
  },
  traitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  traitBox: {
    width: '48%',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  traitLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  traitValue: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  charBox: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  charTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primaryDark,
    marginBottom: 2,
  },
  charText: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  scanWithBreedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 6,
    boxShadow: '0 2px 6px rgba(45, 139, 117, 0.25)',
  },
  scanWithBreedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
});
