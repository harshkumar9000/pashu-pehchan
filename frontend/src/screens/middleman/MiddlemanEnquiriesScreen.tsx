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
  MessageSquare,
  Phone,
  ArrowLeft,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';
import { colors } from '../../theme/colors';
import { ScreenName, Enquiry } from '../../types';
import * as api from '../../services/api';
import { initiatePhoneCall } from '../../components/adapters/contact';

interface MiddlemanEnquiriesScreenProps {
  onNavigate: (screen: ScreenName) => void;
}

export const MiddlemanEnquiriesScreen: React.FC<MiddlemanEnquiriesScreenProps> = ({
  onNavigate,
}) => {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEnquiries();
  }, []);

  const loadEnquiries = async () => {
    setLoading(true);
    try {
      const data = await api.getEnquiries();
      setEnquiries(data);
    } catch (err) {
      console.warn('Failed to load enquiries:', err);
    } finally {
      setLoading(false);
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
          onPress={() => onNavigate('middleman_home')}
        >
          <ArrowLeft size={18} color={colors.textPrimary} />
          <Text style={styles.backText}>Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sent Enquiries ({enquiries.length})</Text>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading sent offers...</Text>
        </View>
      ) : (
        <ScrollView
          style={isDesktop ? styles.desktopScrollView : undefined}
          contentContainerStyle={[styles.list, isDesktop && styles.desktopList]}
        >
          {enquiries.length === 0 ? (
            <View style={styles.emptyCard}>
              <MessageSquare size={40} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No sent enquiries</Text>
              <Text style={styles.emptySub}>
                Browse the marketplace and submit offers to farmers.
              </Text>
            </View>
          ) : (
            enquiries.map((enquiry) => (
              <View
                key={enquiry.id}
                style={[
                  styles.card,
                  isDesktop && { width: cardDesktopWidth, maxWidth: cardDesktopWidth },
                ]}
              >
                <View style={styles.cardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.listingTitle}>
                      {enquiry.listing_title || 'Livestock Procurement Offer'}
                    </Text>
                    <Text style={styles.farmerName}>
                      Seller: {enquiry.receiver_name || 'Ramesh Patel (Farmer)'}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statusPill,
                      enquiry.status === 'ACCEPTED' && { backgroundColor: colors.successBg },
                      enquiry.status === 'REJECTED' && { backgroundColor: colors.dangerBg },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        enquiry.status === 'ACCEPTED' && { color: colors.success },
                        enquiry.status === 'REJECTED' && { color: colors.danger },
                      ]}
                    >
                      {enquiry.status}
                    </Text>
                  </View>
                </View>

                {enquiry.offered_price && (
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Offered Amount:</Text>
                    <Text style={styles.priceVal}>
                      ₹{enquiry.offered_price.toLocaleString('en-IN')}
                    </Text>
                  </View>
                )}

                <Text style={styles.messageText}>"{enquiry.message}"</Text>

                <View style={styles.cardFooter}>
                  <Text style={styles.dateText}>Sent: {enquiry.created_at?.slice(0, 10)}</Text>

                  <TouchableOpacity
                    style={styles.callBtn}
                    onPress={() => initiatePhoneCall('9876543210')}
                  >
                    <Phone size={13} color="#ffffff" />
                    <Text style={styles.callBtnText}>Call Farmer</Text>
                  </TouchableOpacity>
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listingTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  farmerName: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: colors.warningBg,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.warning,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceSubtle,
    padding: 10,
    borderRadius: 10,
  },
  priceLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  priceVal: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  messageText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: colors.textPrimary,
    lineHeight: 17,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: 10,
  },
  dateText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    boxShadow: '0 2px 4px rgba(45, 139, 117, 0.25)',
  },
  callBtnText: {
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
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  emptySub: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
