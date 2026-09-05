import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {
  Bookmark,
  Trash2,
  Phone,
  Milk,
  ArrowLeft,
  ShieldCheck,
  ShoppingBag,
} from 'lucide-react';
import { colors } from '../../theme/colors';
import { ScreenName, SavedAnimal } from '../../types';
import * as api from '../../services/api';
import { initiatePhoneCall } from '../../components/adapters/contact';

interface SavedAnimalsScreenProps {
  onNavigate: (screen: ScreenName) => void;
}

export const SavedAnimalsScreen: React.FC<SavedAnimalsScreenProps> = ({
  onNavigate,
}) => {
  const [savedItems, setSavedItems] = useState<SavedAnimal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSaved();
  }, []);

  const loadSaved = async () => {
    setLoading(true);
    try {
      const data = await api.getSavedListings();
      setSavedItems(data);
    } catch (err) {
      console.warn('Failed to load saved animals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (listingId: number) => {
    try {
      await api.unsaveListing(listingId);
      setSavedItems(savedItems.filter((s) => s.listing_id !== listingId));
    } catch (err: any) {
      alert(err.message);
    }
  };

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
  const cardDesktopWidth =
    windowWidth >= 1350
      ? ('calc(33.333% - 11px)' as any)
      : ('calc(50% - 8px)' as any);

  return (
    <View style={[styles.container, isDesktop && styles.desktopContainer]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => onNavigate('middleman_marketplace')}
        >
          <ArrowLeft size={18} color={colors.textPrimary} />
          <Text style={styles.backText}>Marketplace</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Watchlist ({savedItems.length})</Text>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading watchlist...</Text>
        </View>
      ) : (
        <ScrollView
          style={isDesktop ? styles.desktopScrollView : undefined}
          contentContainerStyle={[styles.list, isDesktop && styles.desktopList]}
        >
          {savedItems.length === 0 ? (
            <View style={styles.emptyCard}>
              <Bookmark size={40} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>Your watchlist is empty</Text>
              <Text style={styles.emptySub}>
                Bookmark cattle from the marketplace to track prices and negotiate deals.
              </Text>
              <TouchableOpacity
                style={styles.browseBtn}
                onPress={() => onNavigate('middleman_marketplace')}
              >
                <Text style={styles.browseText}>Browse Marketplace</Text>
              </TouchableOpacity>
            </View>
          ) : (
            savedItems.map((item) => (
              <View
                key={item.id}
                style={[
                  styles.card,
                  isDesktop && { width: cardDesktopWidth, maxWidth: cardDesktopWidth },
                ]}
              >
                <View style={styles.cardTop}>
                  <View style={styles.avatar}>
                    <Text style={{ fontSize: 22 }}>
                      {item.listing?.species === 'Buffalo' ? '🐃' : '🐄'}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitle}>{item.listing?.title || 'Verified Bovine'}</Text>
                    <Text style={styles.itemDist}>
                      📍 {item.listing?.location_district || 'Anand'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => handleRemove(item.listing_id)}
                  >
                    <Trash2 size={16} color={colors.danger} />
                  </TouchableOpacity>
                </View>

                {item.notes && (
                  <View style={styles.noteBox}>
                    <Text style={styles.noteText}>📝 Note: {item.notes}</Text>
                  </View>
                )}

                <View style={styles.priceRow}>
                  <Text style={styles.priceVal}>
                    ₹{item.listing?.asking_price?.toLocaleString('en-IN') || '75,000'}
                  </Text>
                  <View style={styles.specBadge}>
                    <Milk size={12} color={colors.primary} />
                    <Text style={styles.specText}>
                      {item.listing?.daily_milk_yield_litres || 14} L/day
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.callBtn}
                  onPress={() =>
                    initiatePhoneCall(item.listing?.seller_phone || '9876543210')
                  }
                >
                  <Phone size={14} color="#ffffff" />
                  <Text style={styles.callBtnText}>Contact Seller</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      )}
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
  desktopScrollView: {
    overflow: 'visible' as any,
    flex: 'none' as any,
    height: 'auto' as any,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  list: {
    padding: 16,
    gap: 14,
  },
  desktopList: {
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
  cardTop: {
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
  itemTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  itemDist: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  removeBtn: {
    padding: 7,
    borderRadius: 8,
    backgroundColor: colors.dangerBg,
  },
  noteBox: {
    backgroundColor: colors.accentSoft,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.accentBorder,
  },
  noteText: {
    fontSize: 11,
    color: colors.accent,
    fontWeight: '500',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceVal: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  specBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  specText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 10,
    boxShadow: '0 2px 4px rgba(45, 139, 117, 0.25)',
  },
  callBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  loadingBox: {
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
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  emptySub: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
  browseBtn: {
    marginTop: 10,
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    boxShadow: '0 2px 6px rgba(45, 139, 117, 0.25)',
  },
  browseText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
});
