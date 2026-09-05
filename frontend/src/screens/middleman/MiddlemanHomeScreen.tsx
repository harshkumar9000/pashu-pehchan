import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import {
  ShoppingBag,
  Search,
  Bookmark,
  Scale,
  TrendingUp,
  ShieldCheck,
  MapPin,
  Milk,
  Phone,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { colors } from '../../theme/colors';
import { ScreenName, MarketplaceListing, MiddlemanDashboardData } from '../../types';
import * as api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { initiatePhoneCall } from '../../components/adapters/contact';

interface MiddlemanHomeScreenProps {
  onNavigate: (screen: ScreenName) => void;
  onSelectListing?: (listing: MarketplaceListing) => void;
}

export const MiddlemanHomeScreen: React.FC<MiddlemanHomeScreenProps> = ({
  onNavigate,
  onSelectListing,
}) => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<MiddlemanDashboardData | null>(null);
  const [recentListings, setRecentListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);

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
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dash, listings] = await Promise.all([
        api.getMiddlemanDashboard(),
        api.getListings({ limit: 6 }),
      ]);
      setDashboard(dash);
      setRecentListings(listings);
    } catch (err) {
      console.warn('Failed to load middleman data:', err);
    } finally {
      setLoading(false);
    }
  };

  const popularBreeds = ['Gir', 'Murrah', 'Kankrej', 'Sahiwal', 'Jaffarabadi'];

  const cardDesktopWidth =
    windowWidth >= 1350
      ? ('calc(33.333% - 11px)' as any)
      : ('calc(50% - 8px)' as any);

  return (
    <ScrollView
      style={isDesktop ? styles.desktopScrollView : styles.container}
      contentContainerStyle={[styles.content, isDesktop && styles.desktopContent]}
    >
      {/* Trader Welcome Header */}
      <View style={styles.headerBanner}>
        <View>
          <Text style={styles.welcomeText}>Trading Hub • {user?.name || 'Kishore Bhai'}</Text>
          <Text style={styles.districtText}>
            📍 {user?.district || 'Anand'}, {user?.state || 'Gujarat'} • Livestock Trader / Middleman
          </Text>
          <Text style={styles.headerSub}>
            Verified bovine procurement with AI breed certification
          </Text>
        </View>
        <View style={styles.traderBadge}>
          <TrendingUp size={24} color={colors.primary} />
          <Text style={styles.traderBadgeText}>Verified Trader</Text>
        </View>
      </View>

      {/* KPI Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statVal}>{dashboard?.active_listings_count ?? 8}</Text>
          <Text style={styles.statLbl}>Active Listings</Text>
        </View>
        <TouchableOpacity
          style={styles.statCard}
          onPress={() => onNavigate('saved_animals')}
        >
          <Text style={[styles.statVal, { color: colors.accent }]}>
            {dashboard?.saved_animals_count ?? 3}
          </Text>
          <Text style={styles.statLbl}>Saved Watchlist</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.statCard}
          onPress={() => onNavigate('middleman_enquiries')}
        >
          <Text style={[styles.statVal, { color: colors.info }]}>
            {dashboard?.pending_enquiries_count ?? 1}
          </Text>
          <Text style={styles.statLbl}>Sent Offers</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Tool Actions */}
      <View style={styles.toolRow}>
        <TouchableOpacity
          style={[styles.toolCard, { backgroundColor: '#f0fdf4', borderColor: colors.primaryBorder }]}
          onPress={() => onNavigate('middleman_marketplace')}
          activeOpacity={0.8}
        >
          <ShoppingBag size={20} color={colors.primary} />
          <View>
            <Text style={styles.toolTitle}>Browse Marketplace</Text>
            <Text style={styles.toolSub}>Filtered by yield & price</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toolCard, { backgroundColor: '#fffbeb', borderColor: colors.accentBorder }]}
          onPress={() => onNavigate('compare_animals')}
          activeOpacity={0.8}
        >
          <Scale size={20} color={colors.accent} />
          <View>
            <Text style={styles.toolTitle}>Compare Cattle</Text>
            <Text style={styles.toolSub}>Side-by-side specs</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Quick Breed Filter Tags */}
      <View style={styles.breedTagsSection}>
        <Text style={styles.sectionTitle}>High-Demand Indigenous Breeds</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagScroll}>
          {popularBreeds.map((breed) => (
            <TouchableOpacity
              key={breed}
              style={styles.breedTag}
              onPress={() => onNavigate('middleman_marketplace')}
            >
              <Text style={styles.breedTagText}>{breed}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Recent Verified Livestock */}
      <View style={styles.sectionHeaderRow}>
        <View>
          <Text style={styles.sectionTitle}>Recently Verified Cattle & Buffalo</Text>
          <Text style={styles.sectionSub}>All listings pre-verified with AI model predictions</Text>
        </View>
        <TouchableOpacity onPress={() => onNavigate('middleman_marketplace')}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <View style={[styles.listingGrid, isDesktop && styles.desktopListingGrid]}>
          {recentListings.map((listing) => (
            <View
              key={listing.id}
              style={[
                styles.listingCard,
                isDesktop && styles.desktopListingCard,
                isDesktop && { width: cardDesktopWidth, maxWidth: cardDesktopWidth },
              ]}
            >
              <View style={styles.cardTopRow}>
                <View style={styles.speciesIcon}>
                  <Text style={{ fontSize: 24 }}>
                    {listing.species === 'Buffalo' ? '🐃' : '🐄'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.breedName}>{listing.breed || 'Gir Cow'}</Text>
                  <Text style={styles.listingLoc}>
                    📍 {listing.location_district}, {listing.location_state}
                  </Text>
                </View>
                <View style={styles.verifiedBadge}>
                  <ShieldCheck size={12} color={colors.success} />
                  <Text style={styles.verifiedBadgeText}>AI Verified</Text>
                </View>
              </View>

              <Text style={styles.listingDesc} numberOfLines={2}>
                {listing.title}
              </Text>

              <View style={styles.cardSpecsRow}>
                <View style={styles.specBox}>
                  <Milk size={12} color={colors.primary} />
                  <Text style={styles.specText}>
                    {listing.daily_milk_yield_litres ? `${listing.daily_milk_yield_litres} L/day` : '12 L/day'}
                  </Text>
                </View>
                <View style={styles.specBox}>
                  <Text style={styles.specText}>
                    {listing.age_months ? `${listing.age_months} Mo` : '3.5 Yrs'}
                  </Text>
                </View>
                <View style={styles.pricePill}>
                  <Text style={styles.pricePillText}>
                    ₹{listing.asking_price?.toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>

              <View style={styles.cardBtnRow}>
                {listing.seller_phone && (
                  <TouchableOpacity
                    style={styles.callFarmerBtn}
                    onPress={() => initiatePhoneCall(listing.seller_phone || '9876543210')}
                  >
                    <Phone size={13} color="#ffffff" />
                    <Text style={styles.callFarmerText}>Call Farmer</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.viewDetailBtn}
                  onPress={() => onNavigate('middleman_marketplace')}
                >
                  <Text style={styles.viewDetailText}>Make Offer</Text>
                  <ArrowRight size={13} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  desktopScrollView: {
    overflow: 'visible' as any,
    flex: 'none' as any,
    height: 'auto' as any,
  },
  desktopContent: {
    padding: 0,
    gap: 20,
  },
  headerBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderLight,
    boxShadow: colors.shadows?.card || '0 2px 10px rgba(45, 139, 117, 0.08)',
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  districtText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 2,
  },
  headerSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  traderBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  traderBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primaryDark,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    boxShadow: colors.shadows?.card || '0 2px 8px rgba(45, 139, 117, 0.08)',
  },
  statVal: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
  },
  statLbl: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 2,
  },
  toolRow: {
    flexDirection: 'row',
    gap: 12,
  },
  toolCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    boxShadow: colors.shadows?.subtle || '0 2px 6px rgba(45, 139, 117, 0.08)',
  },
  toolTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  toolSub: {
    fontSize: 11,
    color: colors.textMuted,
  },
  breedTagsSection: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  sectionSub: {
    fontSize: 11,
    color: colors.textMuted,
  },
  tagScroll: {
    gap: 8,
  },
  breedTag: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    boxShadow: colors.shadows?.subtle || '0 1px 3px rgba(45, 139, 117, 0.06)',
  },
  breedTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  listingGrid: {
    gap: 14,
  },
  desktopListingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  listingCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    boxShadow: colors.shadows?.card || '0 2px 8px rgba(45, 139, 117, 0.08)',
    gap: 10,
  },
  desktopListingCard: {
    minWidth: 280,
    flexGrow: 1,
    flexShrink: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  speciesIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breedName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  listingLoc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.successBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.success,
  },
  listingDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  cardSpecsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceSubtle,
    padding: 10,
    borderRadius: 10,
  },
  specBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  specText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  pricePill: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pricePillText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  cardBtnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: 10,
  },
  callFarmerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    boxShadow: '0 2px 4px rgba(45, 139, 117, 0.25)',
  },
  callFarmerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  viewDetailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  viewDetailText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  loadingBox: {
    padding: 30,
    alignItems: 'center',
  },
});
