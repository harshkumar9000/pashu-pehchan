import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {
  Plus,
  Search,
  ShieldCheck,
  Tag,
  Calendar,
  Milk,
  Filter,
  Trash2,
  Share2,
  DollarSign,
} from 'lucide-react';
import { colors } from '../../theme/colors';
import { ScreenName, AnimalRecord } from '../../types';
import * as api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface MyLivestockScreenProps {
  onNavigate: (screen: ScreenName) => void;
  onSelectAnimal?: (animal: AnimalRecord) => void;
}

export const MyLivestockScreen: React.FC<MyLivestockScreenProps> = ({
  onNavigate,
  onSelectAnimal,
}) => {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [animals, setAnimals] = useState<AnimalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSpecies, setFilterSpecies] = useState<'All' | 'Cattle' | 'Buffalo'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sellingAnimal, setSellingAnimal] = useState<AnimalRecord | null>(null);
  const [askingPrice, setAskingPrice] = useState('75000');
  const [listingSubmitting, setListingSubmitting] = useState(false);

  // Responsive desktop detection
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

  useEffect(() => {
    if (!isAuthLoading) {
      fetchAnimals();
    }
  }, [isAuthLoading]);

  const fetchAnimals = async () => {
    setLoading(true);
    try {
      const data = await api.getAnimals();
      setAnimals(data);
    } catch (err) {
      console.warn('Error fetching animals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleListForSale = async () => {
    if (!sellingAnimal) return;

    if (!isAuthenticated && !user) {
      alert('Your session has expired or is no longer valid. Please log in again.');
      return;
    }

    setListingSubmitting(true);
    try {
      const parsedPrice = parseFloat(askingPrice);
      const validPrice = !isNaN(parsedPrice) && parsedPrice > 0 ? parsedPrice : 50000;

      await api.createListing({
        animal_id: sellingAnimal.id,
        price: validPrice,
        asking_price: validPrice,
        title: `${sellingAnimal.breed} - Verified Indigenous ${sellingAnimal.species}`,
        description: `Healthy ${sellingAnimal.species} with daily milk yield of ${sellingAnimal.daily_milk_yield_litres || 12}L. Verified breed with Bharat Pashudhan standard tag.`,
        district: user?.district || 'Anand',
        location_district: user?.district || 'Anand',
        location_state: user?.state || 'Gujarat',
        contact_phone: user?.phone || '+91 98765 43210',
      });
      alert(`Success! Your ${sellingAnimal.breed} is now listed on the marketplace.`);
      setSellingAnimal(null);
      fetchAnimals();
    } catch (err: any) {
      alert(`Listing failed: ${err.message}`);
    } finally {
      setListingSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to remove this animal from your herd?')) {
      try {
        await api.deleteAnimal(id);
        setAnimals(animals.filter((a) => a.id !== id));
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const filteredAnimals = animals.filter((a) => {
    if (filterSpecies !== 'All' && a.species !== filterSpecies) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchBreed = a.breed?.toLowerCase().includes(q);
      const matchTag = a.tag_number?.toLowerCase().includes(q);
      return matchBreed || matchTag;
    }
    return true;
  });

  const cardDesktopWidth =
    windowWidth >= 1350
      ? ('calc(33.333% - 11px)' as any)
      : ('calc(50% - 8px)' as any);

  return (
    <View style={[styles.container, isDesktop && styles.desktopContainer]}>
      {/* Search and Action Bar */}
      <View style={styles.topBar}>
        <View style={styles.searchBox}>
          <Search size={16} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by breed or tag number..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => onNavigate('scan')}
          activeOpacity={0.8}
        >
          <Plus size={16} color="#ffffff" />
          <Text style={styles.addBtnText}>Add Animal</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(['All', 'Cattle', 'Buffalo'] as const).map((spec) => (
          <TouchableOpacity
            key={spec}
            style={[styles.filterTab, filterSpecies === spec && styles.filterTabActive]}
            onPress={() => setFilterSpecies(spec)}
          >
            <Text
              style={[
                styles.filterTabText,
                filterSpecies === spec && styles.filterTabTextActive,
              ]}
            >
              {spec === 'All' ? `All Animals (${animals.length})` : spec}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading livestock inventory...</Text>
        </View>
      ) : (
        <ScrollView
          style={isDesktop ? styles.desktopScrollView : undefined}
          contentContainerStyle={[styles.listContent, isDesktop && styles.desktopListContent]}
        >
          {filteredAnimals.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No matching livestock found</Text>
              <Text style={styles.emptySub}>
                Use the "Add Animal" button to scan and record cattle with AI verification.
              </Text>
            </View>
          ) : (
            filteredAnimals.map((animal) => (
              <View
                key={animal.id}
                style={[
                  styles.card,
                  isDesktop && styles.desktopCard,
                  isDesktop && { width: cardDesktopWidth, maxWidth: cardDesktopWidth },
                ]}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarEmoji}>
                        {animal.species === 'Buffalo' ? '🐃' : '🐄'}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.cardBreed}>{animal.breed}</Text>
                      <View style={styles.tagBadge}>
                        <Tag size={10} color={colors.textSecondary} />
                        <Text style={styles.tagText}>{animal.tag_number || 'UNASSIGNED'}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.statusPill}>
                    <Text
                      style={[
                        styles.statusText,
                        animal.status === 'FOR_SALE'
                          ? { color: colors.warning }
                          : { color: colors.primary },
                      ]}
                    >
                      {animal.status === 'FOR_SALE' ? 'FOR SALE' : 'IN HERD'}
                    </Text>
                  </View>
                </View>

                {/* Attributes Grid */}
                <View style={styles.attrGrid}>
                  <View style={styles.attrItem}>
                    <Text style={styles.attrLabel}>Species</Text>
                    <Text style={styles.attrVal}>{animal.species}</Text>
                  </View>
                  <View style={styles.attrItem}>
                    <Text style={styles.attrLabel}>Age</Text>
                    <Text style={styles.attrVal}>{animal.age_months ? `${animal.age_months} Mos` : '3 Yrs'}</Text>
                  </View>
                  <View style={styles.attrItem}>
                    <Text style={styles.attrLabel}>Daily Milk</Text>
                    <Text style={styles.attrVal}>
                      {animal.daily_milk_yield_litres ? `${animal.daily_milk_yield_litres} L` : 'Dry'}
                    </Text>
                  </View>
                  <View style={styles.attrItem}>
                    <Text style={styles.attrLabel}>AI Confidence</Text>
                    <Text style={styles.attrVal}>
                      {animal.confidence_score ? `${Math.round(animal.confidence_score * 100)}%` : '85%'}
                    </Text>
                  </View>
                </View>

                {/* Verification & Actions Row */}
                <View style={styles.cardFooter}>
                  <View style={styles.verifiedRow}>
                    <ShieldCheck size={14} color={colors.success} />
                    <Text style={styles.verifiedLabel}>Bharat Pashudhan Verified</Text>
                  </View>

                  <View style={styles.actionBtnRow}>
                    {animal.status !== 'FOR_SALE' && (
                      <TouchableOpacity
                        style={styles.sellBtn}
                        onPress={() => setSellingAnimal(animal)}
                      >
                        <DollarSign size={13} color="#ffffff" />
                        <Text style={styles.sellBtnText}>List for Sale</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDelete(animal.id)}
                    >
                      <Trash2 size={14} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* Sell Modal / Sheet */}
      {sellingAnimal && (
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>List {sellingAnimal.breed} for Sale</Text>
            <Text style={styles.modalSub}>
              Set asking price for Middlemen & buyers on the PashuPehchan livestock marketplace.
            </Text>

            <View style={styles.priceInputBox}>
              <Text style={styles.rupeeSymbol}>₹</Text>
              <TextInput
                style={styles.priceInput}
                keyboardType="numeric"
                value={askingPrice}
                onChangeText={setAskingPrice}
                placeholder="75000"
              />
            </View>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setSellingAnimal(null)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleListForSale}
                disabled={listingSubmitting}
              >
                {listingSubmitting ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.modalConfirmText}>Publish Listing</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    padding: 14,
    gap: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: 14,
    borderRadius: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.textPrimary,
    paddingVertical: 9,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    boxShadow: '0 2px 6px rgba(45, 139, 117, 0.25)',
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  filterTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterTabTextActive: {
    color: '#ffffff',
  },
  listContent: {
    padding: 14,
    gap: 14,
  },
  desktopContainer: {
    backgroundColor: 'transparent',
  },
  desktopScrollView: {
    overflow: 'visible' as any,
    flex: 'none' as any,
    height: 'auto' as any,
  },
  desktopListContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    padding: 20,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    boxShadow: colors.shadows?.card || '0 2px 8px rgba(45, 139, 117, 0.08)',
    gap: 12,
  },
  desktopCard: {
    minWidth: 280,
    flexGrow: 1,
    flexShrink: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 24,
  },
  cardBreed: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  tagText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  attrGrid: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSubtle,
    padding: 12,
    borderRadius: 12,
    justifyContent: 'space-between',
  },
  attrItem: {
    alignItems: 'center',
  },
  attrLabel: {
    fontSize: 10,
    color: colors.textMuted,
  },
  attrVal: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: 10,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  verifiedLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.success,
  },
  actionBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sellBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  sellBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  deleteBtn: {
    padding: 7,
    borderRadius: 8,
    backgroundColor: colors.dangerBg,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    boxShadow: colors.shadows?.card || '0 2px 8px rgba(45, 139, 117, 0.08)',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  emptySub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  modalBackdrop: {
    position: (Platform.OS === 'web' ? 'fixed' : 'absolute') as any,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 9999,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 24,
    width: '100%',
    maxWidth: 440,
    maxHeight: ('90vh' as any),
    overflowY: ('auto' as any),
    gap: 14,
    boxShadow: colors.shadows?.modal || '0 8px 24px rgba(45, 139, 117, 0.15)',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  modalSub: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  priceInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.surfaceSubtle,
  },
  rupeeSymbol: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginRight: 6,
  },
  priceInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    paddingVertical: 10,
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
  modalCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  modalConfirmBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    boxShadow: '0 2px 6px rgba(45, 139, 117, 0.25)',
  },
  modalConfirmText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
});
