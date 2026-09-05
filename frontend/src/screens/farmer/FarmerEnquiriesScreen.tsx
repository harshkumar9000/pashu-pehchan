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
  Check,
  X,
  Clock,
  User,
  ShieldCheck,
} from 'lucide-react';
import { colors } from '../../theme/colors';
import { ScreenName, Enquiry } from '../../types';
import * as api from '../../services/api';
import { initiatePhoneCall } from '../../components/adapters/contact';

interface FarmerEnquiriesScreenProps {
  onNavigate: (screen: ScreenName) => void;
}

export const FarmerEnquiriesScreen: React.FC<FarmerEnquiriesScreenProps> = ({
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

  const handleUpdateStatus = async (id: number, status: 'ACCEPTED' | 'REJECTED') => {
    try {
      await api.updateEnquiryStatus(id, status);
      setEnquiries(
        enquiries.map((e) => (e.id === id ? { ...e, status } : e))
      );
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
        <Text style={styles.title}>Buyer Enquiries</Text>
        <Text style={styles.subtitle}>
          Direct offers from middlemen and verified buyers for your livestock
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Fetching enquiries...</Text>
        </View>
      ) : (
        <ScrollView
          style={isDesktop ? styles.desktopScrollView : undefined}
          contentContainerStyle={[styles.list, isDesktop && styles.desktopList]}
        >
          {enquiries.length === 0 ? (
            <View style={styles.emptyCard}>
              <MessageSquare size={36} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No pending enquiries</Text>
              <Text style={styles.emptySub}>
                When middlemen make offers on your marketplace listings, they will appear here.
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
                  <View style={styles.buyerInfo}>
                    <View style={styles.buyerAvatar}>
                      <User size={18} color={colors.primary} />
                    </View>
                    <View>
                      <Text style={styles.buyerName}>
                        {enquiry.sender_name || 'Kishore Bhai (Middleman)'}
                      </Text>
                      <Text style={styles.listingRef}>
                        Regarding: {enquiry.listing_title || 'Gir Cow #105'}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
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

                {/* Offer Price Highlight */}
                {enquiry.offered_price && (
                  <View style={styles.priceOfferRow}>
                    <Text style={styles.offerLabel}>Offered Price:</Text>
                    <Text style={styles.offerValue}>
                      ₹{enquiry.offered_price.toLocaleString('en-IN')}
                    </Text>
                  </View>
                )}

                <Text style={styles.messageBox}>"{enquiry.message}"</Text>

                {/* Actions */}
                <View style={styles.actionRow}>
                  {enquiry.sender_phone && (
                    <TouchableOpacity
                      style={styles.callBtn}
                      onPress={() => initiatePhoneCall(enquiry.sender_phone || '9876543210')}
                    >
                      <Phone size={13} color="#ffffff" />
                      <Text style={styles.callBtnText}>Call Buyer</Text>
                    </TouchableOpacity>
                  )}

                  {enquiry.status === 'PENDING' && (
                    <View style={styles.decisionBtns}>
                      <TouchableOpacity
                        style={styles.rejectBtn}
                        onPress={() => handleUpdateStatus(enquiry.id, 'REJECTED')}
                      >
                        <X size={14} color={colors.danger} />
                        <Text style={styles.rejectBtnText}>Decline</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.acceptBtn}
                        onPress={() => handleUpdateStatus(enquiry.id, 'ACCEPTED')}
                      >
                        <Check size={14} color="#ffffff" />
                        <Text style={styles.acceptBtnText}>Accept Offer</Text>
                      </TouchableOpacity>
                    </View>
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
  desktopContainer: {
    backgroundColor: 'transparent',
  },
  desktopScrollView: {
    overflow: 'visible' as any,
    flex: 'none' as any,
    height: 'auto' as any,
  },
  header: {
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
  buyerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  buyerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyerName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  listingRef: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  statusBadge: {
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
  priceOfferRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceSubtle,
    padding: 10,
    borderRadius: 10,
  },
  offerLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  offerValue: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  messageBox: {
    fontSize: 12,
    fontStyle: 'italic',
    color: colors.textPrimary,
    lineHeight: 17,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: 10,
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
  decisionBtns: {
    flexDirection: 'row',
    gap: 8,
  },
  rejectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.dangerBg,
    backgroundColor: colors.dangerBg,
  },
  rejectBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.danger,
  },
  acceptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.success,
    boxShadow: '0 2px 4px rgba(46, 125, 50, 0.25)',
  },
  acceptBtnText: {
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
