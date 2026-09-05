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
  ShoppingBag,
  Plus,
  Eye,
  MessageSquare,
  CheckCircle,
  Tag,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { colors } from '../../theme/colors';
import { ScreenName, MarketplaceListing } from '../../types';
import * as api from '../../services/api';

interface FarmerMarketplaceScreenProps {
  onNavigate: (screen: ScreenName) => void;
}

export const FarmerMarketplaceScreen: React.FC<FarmerMarketplaceScreenProps> = ({
  onNavigate,
}) => {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = async () => {
    setLoading(true);
    try {
      // In demo, Ramesh's listings are returned by /api/listings
      const all = await api.getListings();
      setListings(all);
    } catch (err) {
      console.warn('Failed to load listings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkSold = async (id: number) => {
    try {
      await api.updateListing(id, { status: 'SOLD' });
      setListings(
        listings.map((l) => (l.id === id ? { ...l, status: 'SOLD' } : l))
      );
      alert('Listing status updated to SOLD');
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
      {/* Header Info */}
      <View style={styles.topInfo}>
        <View>
          <Text style={styles.title}>My Livestock Listings</Text>
          <Text style={styles.subtitle}>
            Manage your cattle and buffalo listed on the PashuPehchan marketplace
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => onNavigate('my_livestock')}
        >
          <Plus size={16} color="#ffffff" />
          <Text style={styles.addBtnText}>List Animal</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading marketplace listings...</Text>
        </View>
      ) : (
        <ScrollView
          style={isDesktop ? styles.desktopScrollView : undefined}
          contentContainerStyle={[styles.list, isDesktop && styles.desktopList]}
        >
          {listings.length === 0 ? (
            <View style={styles.emptyCard}>
              <ShoppingBag size={40} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No Active Listings</Text>
              <Text style={styles.emptySub}>
                Go to "My Livestock" and click "List for Sale" on any verified animal.
              </Text>
              <TouchableOpacity
                style={styles.browseHerdBtn}
                onPress={() => onNavigate('my_livestock')}
              >
                <Text style={styles.browseHerdText}>View My Herd</Text>
              </TouchableOpacity>
            </View>
          ) : (
            listings.map((listing) => (
              <View
                key={listing.id}
                style={[
                  styles.card,
                  isDesktop && styles.desktopCard,
                  isDesktop && { width: cardDesktopWidth, maxWidth: cardDesktopWidth },
                ]}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.avatar}>
                    <Text style={{ fontSize: 22 }}>
                      {listing.species === 'Buffalo' ? '🐃' : '🐄'}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.listingTitle}>{listing.title}</Text>
                    <Text style={styles.locationText}>
                      📍 {listing.location_district}, {listing.location_state}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusPill,
                      listing.status === 'SOLD' && { backgroundColor: colors.surfaceSubtle },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        listing.status === 'SOLD' ? { color: colors.textMuted } : { color: colors.success },
                      ]}
                    >
                      {listing.status}
                    </Text>
                  </View>
                </View>

                {/* Details Bar */}
                <View style={styles.statsBar}>
                  <View style={styles.statCol}>
                    <Text style={styles.statLabel}>Asking Price</Text>
                    <Text style={styles.priceVal}>
                      ₹{listing.asking_price?.toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <View style={styles.statCol}>
                    <Text style={styles.statLabel}>Milk Yield</Text>
                    <Text style={styles.statNum}>
                      {listing.daily_milk_yield_litres ? `${listing.daily_milk_yield_litres} L/d` : 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.statCol}>
                    <Text style={styles.statLabel}>Buyer Views</Text>
                    <View style={styles.viewRow}>
                      <Eye size={12} color={colors.textSecondary} />
                      <Text style={styles.statNum}>{listing.views_count}</Text>
                    </View>
                  </View>
                </View>

                {/* Actions */}
                <View style={styles.cardFooter}>
                  <TouchableOpacity
                    style={styles.enquiriesBtn}
                    onPress={() => onNavigate('farmer_enquiries')}
                  >
                    <MessageSquare size={13} color={colors.primary} />
                    <Text style={styles.enquiriesBtnText}>View Enquiries</Text>
                  </TouchableOpacity>

                  {listing.status !== 'SOLD' && (
                    <TouchableOpacity
                      style={styles.soldBtn}
                      onPress={() => handleMarkSold(listing.id)}
                    >
                      <CheckCircle size={13} color="#ffffff" />
                      <Text style={styles.soldBtnText}>Mark Sold</Text>
                    </TouchableOpacity>
                  )}
                </View>
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
  topInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    maxWidth: 320,
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
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  desktopContainer: {
    backgroundColor: 'transparent',
  },
  desktopScrollView: {
    overflow: 'visible' as any,
    flex: 'none' as any,
    height: 'auto' as any,
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
  desktopCard: {
    minWidth: 280,
    flexGrow: 1,
    flexShrink: 1,
  },
  cardHeader: {
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
  listingTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  locationText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: colors.successBg,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceSubtle,
    padding: 12,
    borderRadius: 12,
  },
  statCol: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: colors.textMuted,
  },
  priceVal: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primaryDark,
    marginTop: 2,
  },
  statNum: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  viewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
  enquiriesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: colors.primarySoft,
  },
  enquiriesBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  soldBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: colors.primary,
    boxShadow: '0 2px 4px rgba(45, 139, 117, 0.25)',
  },
  soldBtnText: {
    fontSize: 11,
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
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  emptySub: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 280,
  },
  browseHerdBtn: {
    marginTop: 10,
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    boxShadow: '0 2px 6px rgba(45, 139, 117, 0.25)',
  },
  browseHerdText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
});
