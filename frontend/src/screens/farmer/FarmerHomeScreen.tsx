import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import {
  Camera,
  Layers,
  ShoppingBag,
  Stethoscope,
  PhoneCall,
  ArrowRight,
  ShieldCheck,
  Award,
  ChevronRight,
  AlertTriangle,
  Upload,
  CheckCircle2,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { colors } from '../../theme/colors';
import { ScreenName, FarmerDashboardData } from '../../types';
import { useAuth } from '../../context/AuthContext';
import * as api from '../../services/api';
import { initiatePhoneCall } from '../../components/adapters/contact';
import { openMapDirections } from '../../components/adapters/maps';

interface FarmerHomeScreenProps {
  onNavigate: (screen: ScreenName) => void;
}

export const FarmerHomeScreen: React.FC<FarmerHomeScreenProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<FarmerDashboardData | null>(null);
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
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const data = await api.getFarmerDashboard();
      setDashboard(data);
    } catch (err) {
      console.warn('Failed to load farmer dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, isDesktop && styles.desktopContainer]}
      contentContainerStyle={[styles.content, isDesktop && styles.desktopContent]}
      showsVerticalScrollIndicator={false}
    >
      {/* Welcome Banner */}
      <View style={[styles.welcomeCard, isDesktop && styles.desktopWelcomeCard]}>
        <View style={styles.welcomeTextCol}>
          <View style={styles.welcomeTitleRow}>
            <Text style={styles.greetingText}>Namaste, {user?.name || 'Farmer'} 🙏</Text>
            <View style={styles.districtBadge}>
              <MapPin size={12} color={colors.primary} />
              <Text style={styles.districtBadgeText}>
                {user?.district || 'Anand'}, {user?.state || 'Gujarat'} • Pashu Palak
              </Text>
            </View>
          </View>
          <Text style={styles.welcomeSub}>
            Bharat Pashudhan AI-Assisted Breed Verification, Milk Yield Analytics & Registered Herd
          </Text>
        </View>

        <View style={styles.govEmblemBox}>
          <Image
            source={{ uri: '/logo.png' }}
            style={styles.welcomeLogo}
            resizeMode="contain"
          />
          <Text style={styles.govEmblemText}>PashuPehchan</Text>
          <Text style={styles.govSubText}>ICAR-NBAGR</Text>
        </View>
      </View>

      {/* Top 4 KPI Metrics Row */}
      <View style={[styles.statsRow, isDesktop && styles.desktopStatsRow]}>
        <TouchableOpacity
          style={styles.statCard}
          onPress={() => onNavigate('my_livestock')}
          activeOpacity={0.8}
        >
          <View style={styles.statCardHeader}>
            <Text style={styles.statVal}>{dashboard?.total_animals ?? 4}</Text>
            <View style={[styles.statIconBox, { backgroundColor: colors.primarySoft }]}>
              <Layers size={16} color={colors.primary} />
            </View>
          </View>
          <Text style={styles.statLbl}>Registered Herd</Text>
          <Text style={styles.statDetail}>100% tagged & health tracked</Text>
        </TouchableOpacity>

        <View style={styles.statCard}>
          <View style={styles.statCardHeader}>
            <Text style={[styles.statVal, { color: colors.success }]}>4 / 4</Text>
            <View style={[styles.statIconBox, { backgroundColor: colors.successBg }]}>
              <ShieldCheck size={16} color={colors.success} />
            </View>
          </View>
          <Text style={styles.statLbl}>Verified Indigenous</Text>
          <Text style={styles.statDetail}>Gir, Murrah & Kankrej</Text>
        </View>

        <TouchableOpacity
          style={styles.statCard}
          onPress={() => onNavigate('farmer_marketplace')}
          activeOpacity={0.8}
        >
          <View style={styles.statCardHeader}>
            <Text style={[styles.statVal, { color: colors.accent }]}>
              {dashboard?.for_sale_count ?? 1}
            </Text>
            <View style={[styles.statIconBox, { backgroundColor: colors.accentSoft }]}>
              <ShoppingBag size={16} color={colors.warning} />
            </View>
          </View>
          <Text style={styles.statLbl}>Listed for Sale</Text>
          <Text style={styles.statDetail}>Active marketplace trade</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.statCard}
          onPress={() => onNavigate('farmer_enquiries')}
          activeOpacity={0.8}
        >
          <View style={styles.statCardHeader}>
            <Text style={[styles.statVal, { color: colors.info }]}>
              {dashboard?.pending_enquiries ?? 2}
            </Text>
            <View style={[styles.statIconBox, { backgroundColor: colors.infoBg }]}>
              <PhoneCall size={16} color={colors.info} />
            </View>
          </View>
          <Text style={styles.statLbl}>Buyer Enquiries</Text>
          <Text style={styles.statDetail}>Offers awaiting response</Text>
        </TouchableOpacity>
      </View>

      {/* Main Multi-Column Content Area on Desktop */}
      <View style={[styles.mainLayout, isDesktop && styles.desktopMainLayout]}>
        {/* Left / Primary Column (Hero + Herd Highlights + Services) */}
        <View style={[styles.primaryCol, isDesktop && styles.desktopPrimaryCol]}>
          {/* Primary Hero Action: AI Breed Scan */}
          <TouchableOpacity
            style={styles.heroScanCard}
            onPress={() => onNavigate('scan')}
            activeOpacity={0.9}
          >
            <View style={styles.heroLeft}>
              <View style={styles.cameraIconCircle}>
                <Camera size={28} color="#ffffff" />
              </View>
              <View style={styles.heroTextCol}>
                <View style={styles.heroPill}>
                  <Award size={12} color={colors.primary} />
                  <Text style={styles.heroPillText}>AI Breed Identification</Text>
                </View>
                <Text style={styles.heroTitle}>Scan New Cattle / Buffalo</Text>
                <Text style={styles.heroDesc}>
                  Instant photo classification across 41 indigenous breeds with top-3 confidence
                  scores, physical breed standards & ear-tag registry attachment.
                </Text>
              </View>
            </View>
            <View style={styles.heroArrowBtn}>
              <ArrowRight size={20} color="#ffffff" />
            </View>
          </TouchableOpacity>

          {/* Quick Farmer Services Grid */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>Farmer Services</Text>
          </View>

          <View style={[styles.actionGrid, isDesktop && styles.desktopActionGrid]}>
            <TouchableOpacity
              style={[styles.actionTile, isDesktop && styles.desktopActionTile]}
              onPress={() => onNavigate('my_livestock')}
              activeOpacity={0.8}
            >
              <View style={[styles.tileIcon, { backgroundColor: colors.primarySoft }]}>
                <Layers size={22} color={colors.primary} />
              </View>
              <Text style={styles.tileTitle}>Livestock Herd</Text>
              <Text style={styles.tileSub}>Manage ear tags & lactation status</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionTile, isDesktop && styles.desktopActionTile]}
              onPress={() => onNavigate('farmer_marketplace')}
              activeOpacity={0.8}
            >
              <View style={[styles.tileIcon, { backgroundColor: colors.accentSoft }]}>
                <ShoppingBag size={22} color={colors.warning} />
              </View>
              <Text style={styles.tileTitle}>Marketplace</Text>
              <Text style={styles.tileSub}>Sell with verified breed certificate</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionTile, isDesktop && styles.desktopActionTile]}
              onPress={() => onNavigate('vets')}
              activeOpacity={0.8}
            >
              <View style={[styles.tileIcon, { backgroundColor: colors.infoBg }]}>
                <Stethoscope size={22} color={colors.info} />
              </View>
              <Text style={styles.tileTitle}>Find a Vet</Text>
              <Text style={styles.tileSub}>Govt polyclinics & 1962 ambulance</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionTile, isDesktop && styles.desktopActionTile]}
              onPress={() => onNavigate('breeds')}
              activeOpacity={0.8}
            >
              <View style={[styles.tileIcon, { backgroundColor: colors.buffaloBg }]}>
                <ShieldCheck size={22} color={colors.buffaloBadge} />
              </View>
              <Text style={styles.tileTitle}>Breed Encyclopedia</Text>
              <Text style={styles.tileSub}>41 ICAR official standards</Text>
            </TouchableOpacity>
          </View>

          {/* Recent Animals Preview */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>My Herd Highlights</Text>
            <TouchableOpacity onPress={() => onNavigate('my_livestock')}>
              <Text style={styles.seeAllText}>View All ({dashboard?.total_animals ?? 4})</Text>
            </TouchableOpacity>
          </View>

          {dashboard?.recent_animals && dashboard.recent_animals.length > 0 ? (
            <View style={[styles.animalList, isDesktop && styles.desktopAnimalList]}>
              {dashboard.recent_animals.map((animal) => (
                <TouchableOpacity
                  key={animal.id}
                  style={[styles.animalCard, isDesktop && styles.desktopAnimalCard]}
                  onPress={() => onNavigate('my_livestock')}
                  activeOpacity={0.85}
                >
                  <View style={styles.animalCardLeft}>
                    <View style={styles.animalThumb}>
                      <Text style={styles.animalEmoji}>
                        {animal.species === 'Buffalo' ? '🐃' : '🐄'}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.animalBreed}>{animal.breed}</Text>
                      <Text style={styles.animalTag}>Tag: {animal.tag_number || 'IN-2024-001'}</Text>
                      <Text style={styles.animalYield}>
                        {animal.daily_milk_yield_litres
                          ? `🥛 ${animal.daily_milk_yield_litres} L/day`
                          : 'Dry / Bull'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.animalCardRight}>
                    <View style={styles.verifiedBadge}>
                      <ShieldCheck size={12} color={colors.success} />
                      <Text style={styles.verifiedText}>Verified</Text>
                    </View>
                    <ChevronRight size={16} color={colors.textSecondary} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No livestock records yet</Text>
              <Text style={styles.emptySub}>
                Scan cattle photo above to verify breed and save to herd
              </Text>
            </View>
          )}
        </View>

        {/* Right / Secondary Column on Desktop (Instant Scan Widget + Nearest Vet + 1962 Helpline) */}
        <View style={[styles.secondaryCol, isDesktop && styles.desktopSecondaryCol]}>
          {/* Quick Scanner Launch Widget */}
          <View style={styles.quickScanWidget}>
            <View style={styles.widgetHeader}>
              <View style={styles.widgetHeaderLeft}>
                <Camera size={18} color={colors.primary} />
                <Text style={styles.widgetTitle}>Instant Breed Identifier</Text>
              </View>
              <View style={styles.widgetBadge}>
                <Text style={styles.widgetBadgeText}>PyTorch CPU</Text>
              </View>
            </View>
            <Text style={styles.widgetSub}>
              Upload a clear side-profile photo of your cattle or buffalo to classify indigenous breed.
            </Text>

            <TouchableOpacity
              style={styles.widgetDropzone}
              onPress={() => onNavigate('scan')}
              activeOpacity={0.85}
            >
              <Upload size={28} color={colors.primary} />
              <Text style={styles.widgetDropzoneTitle}>Upload or Take Photo</Text>
              <Text style={styles.widgetDropzoneSub}>Click to launch AI camera scanner</Text>
            </TouchableOpacity>

            <View style={styles.sampleRow}>
              <Text style={styles.sampleLabel}>Quick Samples:</Text>
              <View style={styles.sampleChips}>
                {['Gir', 'Murrah', 'Sahiwal', 'Kankrej'].map((b) => (
                  <TouchableOpacity
                    key={b}
                    style={styles.sampleChip}
                    onPress={() => onNavigate('scan')}
                  >
                    <Text style={styles.sampleChipText}>{b}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Nearest Veterinary Polyclinic */}
          <View style={styles.vetWidget}>
            <View style={styles.vetWidgetHeader}>
              <View style={styles.vetWidgetHeaderLeft}>
                <Stethoscope size={18} color={colors.info} />
                <Text style={styles.vetWidgetTitle}>Nearest Veterinary Care</Text>
              </View>
              <View style={styles.emergencyPill}>
                <Text style={styles.emergencyPillText}>24x7</Text>
              </View>
            </View>
            <Text style={styles.vetClinicName}>
              Government Veterinary Polyclinic & Hospital
            </Text>
            <Text style={styles.vetClinicAddress}>
              📍 Anand Agricultural University Campus, Anand, Gujarat
            </Text>
            <Text style={styles.vetDistance}>🚗 2.5 km away • Open Now</Text>

            <View style={styles.vetActionsRow}>
              <TouchableOpacity
                style={styles.vetCallBtn}
                onPress={() => initiatePhoneCall('02692-261234')}
                activeOpacity={0.8}
              >
                <PhoneCall size={14} color={colors.primaryDark} />
                <Text style={styles.vetCallText}>Call Clinic</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.vetDirectionsBtn}
                onPress={() =>
                  openMapDirections(22.5645, 72.9289, 'Government Veterinary Polyclinic')
                }
                activeOpacity={0.8}
              >
                <ExternalLink size={14} color="#ffffff" />
                <Text style={styles.vetDirectionsText}>Directions</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Emergency Helpline 1962 Card */}
          <View style={styles.emergencyCard}>
            <View style={styles.emergencyLeft}>
              <View style={styles.emergencyIconBox}>
                <AlertTriangle size={20} color="#ffffff" />
              </View>
              <View>
                <Text style={styles.emergencyTitle}>1962 Pashu Ambulance</Text>
                <Text style={styles.emergencySub}>Govt 24x7 Animal Health Emergency</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.callNowBtn}
              onPress={() => initiatePhoneCall('1962')}
              activeOpacity={0.85}
            >
              <PhoneCall size={14} color="#7f1d1d" />
              <Text style={styles.callNowText}>Call 1962</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  desktopContainer: {
    flex: 'none' as any,
    height: 'auto' as any,
    overflow: 'visible' as any,
    backgroundColor: 'transparent',
  },
  content: {
    padding: 16,
    gap: 18,
  },
  desktopContent: {
    padding: 0,
    paddingBottom: 36,
    gap: 24,
  },
  welcomeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    boxShadow: colors.shadows?.card || '0 2px 10px rgba(45, 139, 117, 0.08)',
  },
  desktopWelcomeCard: {
    padding: 22,
    borderRadius: 18,
  },
  welcomeTextCol: {
    flex: 1,
    gap: 6,
  },
  welcomeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  greetingText: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  districtBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  districtBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  welcomeSub: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  govEmblemBox: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  welcomeLogo: {
    width: 44,
    height: 44,
    marginBottom: 4,
  },
  govEmblemText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  govSubText: {
    fontSize: 9,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 14,
    flexWrap: 'wrap',
  },
  desktopStatsRow: {
    flexWrap: 'nowrap',
  },
  statCard: {
    flex: 1,
    minWidth: 160,
    backgroundColor: colors.surface,
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    boxShadow: colors.shadows?.card || '0 2px 8px rgba(45, 139, 117, 0.08)',
    gap: 4,
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statVal: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.primary,
  },
  statIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLbl: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statDetail: {
    fontSize: 11,
    color: colors.textMuted,
  },
  mainLayout: {
    flexDirection: 'column',
    gap: 20,
  },
  desktopMainLayout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 24,
  },
  primaryCol: {
    flex: 1,
    gap: 20,
  },
  desktopPrimaryCol: {
    flex: 65,
  },
  secondaryCol: {
    flex: 1,
    gap: 20,
  },
  desktopSecondaryCol: {
    flex: 35,
  },
  heroScanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primaryDark,
    borderRadius: 18,
    padding: 22,
    boxShadow: '0 6px 14px rgba(30, 92, 78, 0.25)',
  },
  heroLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  cameraIconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
  },
  heroTextCol: {
    flex: 1,
    gap: 6,
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  heroPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  heroTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#ffffff',
  },
  heroDesc: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 17,
  },
  heroArrowBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 14,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  desktopActionGrid: {
    flexWrap: 'nowrap',
  },
  actionTile: {
    width: '48%',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    boxShadow: colors.shadows?.subtle || '0 2px 6px rgba(45, 139, 117, 0.08)',
    gap: 6,
  },
  desktopActionTile: {
    flex: 1,
    width: 'auto',
  },
  tileIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  tileTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  tileSub: {
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 15,
  },
  animalList: {
    gap: 12,
  },
  desktopAnimalList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  animalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    boxShadow: colors.shadows?.subtle || '0 2px 6px rgba(45, 139, 117, 0.08)',
    width: '100%',
  },
  desktopAnimalCard: {
    width: '48.5%',
  },
  animalCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  animalThumb: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  animalEmoji: {
    fontSize: 24,
  },
  animalBreed: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  animalTag: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  animalYield: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 2,
  },
  animalCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.success,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    padding: 28,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    boxShadow: colors.shadows?.subtle || '0 2px 6px rgba(45, 139, 117, 0.08)',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  emptySub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },

  /* Secondary Column Widgets */
  quickScanWidget: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.borderLight,
    boxShadow: colors.shadows?.card || '0 2px 8px rgba(45, 139, 117, 0.08)',
    gap: 12,
  },
  widgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  widgetHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  widgetTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  widgetBadge: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  widgetBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  widgetSub: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  widgetDropzone: {
    backgroundColor: colors.primarySoft,
    borderWidth: 2,
    borderColor: colors.primaryBorder,
    borderStyle: 'dashed' as any,
    borderRadius: 14,
    padding: 22,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  widgetDropzoneTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  widgetDropzoneSub: {
    fontSize: 11,
    color: colors.textMuted,
  },
  sampleRow: {
    gap: 8,
  },
  sampleLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  sampleChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sampleChip: {
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  sampleChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
  },

  /* Veterinary Widget */
  vetWidget: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.borderLight,
    boxShadow: colors.shadows?.card || '0 2px 8px rgba(45, 139, 117, 0.08)',
    gap: 8,
  },
  vetWidgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vetWidgetHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  vetWidgetTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  emergencyPill: {
    backgroundColor: colors.dangerBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  emergencyPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.danger,
  },
  vetClinicName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  vetClinicAddress: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 15,
  },
  vetDistance: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  vetActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  vetCallBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    paddingVertical: 9,
    borderRadius: 10,
  },
  vetCallText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  vetDirectionsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.info,
    paddingVertical: 9,
    borderRadius: 10,
  },
  vetDirectionsText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },

  /* Emergency 1962 Card */
  emergencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#991B1B',
    padding: 16,
    borderRadius: 16,
    boxShadow: '0 4px 8px rgba(153, 27, 27, 0.3)',
  },
  emergencyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  emergencyIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  emergencySub: {
    fontSize: 11,
    color: '#FEE2E2',
  },
  callNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  callNowText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#991B1B',
  },
});
