import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import {
  Search,
  AlertTriangle,
  Clock,
  Tag,
  X,
  FileText,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { colors } from '../theme/colors';
import { RecordResponse, VerificationStatus } from '../types';
import { getRecords } from '../services/api';

interface HistoryScreenProps {
  onScanNew: () => void;
}

// In-memory query cache for instantaneous tab navigation without repeated network requests
interface CachedQuery {
  data: RecordResponse[];
  timestamp: number;
}
const queryCache = new Map<string, CachedQuery>();
const CACHE_TTL_MS = 30_000; // 30 seconds

// Static badge styling to prevent re-allocating objects in render
const getStatusBadge = (status: VerificationStatus) => {
  if (status === 'Human Verified') {
    return {
      bg: colors.successBg,
      text: colors.success,
      label: 'Human Verified',
    };
  }
  if (status === 'Overridden') {
    return {
      bg: colors.warningBg,
      text: colors.warning,
      label: 'Overridden',
    };
  }
  return {
    bg: colors.dangerBg,
    text: colors.danger,
    label: 'Manual Review',
  };
};

// Memoized individual audit card component
interface AuditRecordCardProps {
  record: RecordResponse;
  onSelect: (record: RecordResponse) => void;
  isDesktop: boolean;
}

const AuditRecordCard: React.FC<AuditRecordCardProps> = React.memo(
  ({ record, onSelect, isDesktop }) => {
    const badge = getStatusBadge(record.verification_status);
    const isOverridden = record.verification_status === 'Overridden';
    const tag = record.animal_identifier || `PB-${record.id}`;

    const formattedDate = useMemo(() => {
      try {
        return new Date(record.created_at).toLocaleString();
      } catch {
        return record.created_at;
      }
    }, [record.created_at]);

    const formattedAiBreed = useMemo(
      () => record.predicted_breed.replace(/_/g, ' '),
      [record.predicted_breed]
    );

    const formattedVerifiedBreed = useMemo(
      () => record.verified_breed.replace(/_/g, ' '),
      [record.verified_breed]
    );

    const handlePress = useCallback(() => {
      onSelect(record);
    }, [onSelect, record]);

    return (
      <TouchableOpacity
        style={[
          styles.recordCard,
          isDesktop && styles.desktopRecordCard,
        ]}
        onPress={handlePress}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel={`Audit record ${tag}`}
      >
        <View style={styles.cardHeader}>
          <View style={styles.tagWrap}>
            <Tag size={13} color={colors.primary} />
            <Text style={styles.tagText}>{tag}</Text>
            {record.is_demo === 1 && (
              <View style={styles.demoBadge}>
                <Text style={styles.demoBadgeText}>DEMO</Text>
              </View>
            )}
          </View>

          <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.statusBadgeText, { color: badge.text }]}>
              {badge.label}
            </Text>
          </View>
        </View>

        <View style={styles.breedCompareRow}>
          <View style={styles.compareCol}>
            <Text style={styles.compareLabel}>AI SUGGESTION</Text>
            <Text style={styles.compareBreed}>{formattedAiBreed}</Text>
            <Text style={styles.compareConf}>
              {(record.predicted_confidence * 100).toFixed(1)}% conf
            </Text>
          </View>

          <View style={styles.arrowCol}>
            <ChevronRight size={16} color={colors.textMuted} />
          </View>

          <View style={styles.compareCol}>
            <Text style={styles.compareLabel}>VERIFIED BREED</Text>
            <Text
              style={[
                styles.compareBreed,
                isOverridden && { color: colors.warning },
              ]}
            >
              {formattedVerifiedBreed}
            </Text>
            <Text style={styles.compareSpecies}>{record.animal_type}</Text>
          </View>
        </View>

        {record.notes ? (
          <Text style={styles.notesExcerpt} numberOfLines={1}>
            Notes: {record.notes}
          </Text>
        ) : null}

        <View style={styles.cardFooter}>
          <View style={styles.timeWrap}>
            <Clock size={11} color={colors.textMuted} />
            <Text style={styles.timeText}>{formattedDate}</Text>
          </View>
          <Text style={styles.detailsPrompt}>View Details →</Text>
        </View>
      </TouchableOpacity>
    );
  }
);

export const HistoryScreen: React.FC<HistoryScreenProps> = ({ onScanNew }) => {
  const [records, setRecords] = useState<RecordResponse[]>([]);
  const [visibleCount, setVisibleCount] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedRecord, setSelectedRecord] = useState<RecordResponse | null>(null);

  // Reference to active AbortController and search debounce timer
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<any>(null);

  // Responsive layout breakpoint tracking (only triggers re-renders when crossing 768px threshold)
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => {
      const desktop = window.innerWidth >= 768;
      setIsDesktop((prev) => (prev !== desktop ? desktop : prev));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Single source of truth for fetching data with cache, cancellation, and clean lifecycle
  const executeFetch = useCallback(
    (searchQuery: string, filterStatus: string, bypassCache = false) => {
      const activeQuery = searchQuery.trim();
      const activeStatus = filterStatus !== 'All' ? filterStatus : undefined;
      const cacheKey = `${activeQuery.toLowerCase()}::${filterStatus}`;

      // Check in-memory cache for instantaneous response
      if (!bypassCache) {
        const cached = queryCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
          setRecords(cached.data);
          setVisibleCount(30);
          setLoading(false);
          setError(null);
          return;
        }
      }

      // Cancel previous in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setLoading(true);
      setError(null);

      getRecords(
        {
          search: activeQuery || undefined,
          status: activeStatus,
        },
        { signal: controller.signal }
      )
        .then((data) => {
          // Store result in query cache
          queryCache.set(cacheKey, {
            data,
            timestamp: Date.now(),
          });
          setRecords(data);
          setVisibleCount(30);
          setError(null);
        })
        .catch((err) => {
          if (err.name === 'AbortError' || (err.message && err.message.includes('abort'))) {
            // Cancelled intentionally by newer request or unmount
            return;
          }
          console.warn('Failed fetching audit records:', err);
          setError('Unable to load verification history.');
        })
        .finally(() => {
          if (abortControllerRef.current === controller) {
            setLoading(false);
          }
        });
    },
    []
  );

  // Single effect to trigger data fetching when debounced search or filter status changes
  useEffect(() => {
    executeFetch(debouncedSearch, statusFilter);
  }, [debouncedSearch, statusFilter, executeFetch]);

  // Clean up timers and abort controller on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Controlled search input with 300ms debounce
  const handleSearchChange = useCallback((text: string) => {
    setSearchTerm(text);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearch(text);
    }, 300);
  }, []);

  // Immediate search on keyboard submission (Enter)
  const handleSearchSubmit = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setDebouncedSearch(searchTerm);
  }, [searchTerm]);

  // Immediate search clear
  const handleClearSearch = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setSearchTerm('');
    setDebouncedSearch('');
  }, []);

  // Filter tab selection (pure state change, reactive effect handles fetching)
  const handleSelectFilter = useCallback((tab: string) => {
    setStatusFilter(tab);
  }, []);

  // Manual retry handler (bypasses cache)
  const handleRetry = useCallback(() => {
    queryCache.clear();
    executeFetch(debouncedSearch, statusFilter, true);
  }, [debouncedSearch, statusFilter, executeFetch]);

  // Progressive list rendering to keep DOM light and rendering 60fps
  const visibleRecords = useMemo(() => {
    if (records.length <= 30) return records;
    return records.slice(0, visibleCount);
  }, [records, visibleCount]);

  const hasMore = visibleRecords.length < records.length;

  const handleLoadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + 30, records.length));
  }, [records.length]);

  // Modal keyboard accessibility (Escape to close)
  useEffect(() => {
    if (!selectedRecord || typeof window === 'undefined') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedRecord(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedRecord]);

  const handleSelectRecord = useCallback((rec: RecordResponse) => {
    setSelectedRecord(rec);
  }, []);

  return (
    <View style={[styles.container, isDesktop && styles.desktopContainer]}>
      <ScrollView
        scrollEnabled={!isDesktop}
        style={isDesktop ? styles.desktopScrollView : styles.container}
        contentContainerStyle={[styles.content, isDesktop && styles.desktopContent]}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.screenTitle}>Verification Audit Trail</Text>
          <Text style={styles.screenSubtitle}>
            Traceability log of all livestock verified under Bharat Pashudhan program.
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Search size={16} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by Ear Tag #, or breed name..."
            placeholderTextColor={colors.textMuted}
            value={searchTerm}
            onChangeText={handleSearchChange}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity
              onPress={handleClearSearch}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Clear search"
            >
              <X size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterTabs}>
          {['All', 'Human Verified', 'Overridden', 'Manual Review'].map((tab) => {
            const isActive = statusFilter === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
                onPress={() => handleSelectFilter(tab)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterText,
                    isActive && styles.filterTextActive,
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Dynamic Records State */}
        {error ? (
          <View style={styles.errorContainer}>
            <AlertTriangle size={36} color={colors.danger} />
            <Text style={styles.errorTitle}>Unable to load verification history.</Text>
            <Text style={styles.errorSub}>
              Could not retrieve audit records from the backend. Please check your connection or retry.
            </Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={handleRetry}
              activeOpacity={0.8}
            >
              <RefreshCw size={14} color="#ffffff" />
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : loading && records.length === 0 ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Fetching SQLite audit logs...</Text>
          </View>
        ) : records.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FileText size={40} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No matching audit records</Text>
            <Text style={styles.emptySub}>
              {searchTerm || statusFilter !== 'All'
                ? 'Try adjusting your search query or switching the status filter.'
                : 'Perform a new livestock verification to populate records.'}
            </Text>
            <TouchableOpacity
              style={styles.emptyScanBtn}
              onPress={onScanNew}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyScanBtnText}>Start New Verification</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={[styles.recordsList, isDesktop && styles.desktopRecordsList]}>
              {visibleRecords.map((rec) => (
                <AuditRecordCard
                  key={rec.id}
                  record={rec}
                  onSelect={handleSelectRecord}
                  isDesktop={isDesktop}
                />
              ))}
            </View>

            {hasMore && (
              <View style={styles.loadMoreWrapper}>
                <TouchableOpacity
                  style={styles.loadMoreBtn}
                  onPress={handleLoadMore}
                  activeOpacity={0.8}
                >
                  <Text style={styles.loadMoreBtnText}>
                    Load More Records ({records.length - visibleCount} remaining)
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Record Detail Modal */}
      {selectedRecord && (
        <Modal
          visible={!!selectedRecord}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedRecord(null)}
        >
          <View style={styles.modalBackdrop}>
            {/* Absolute backdrop touch dismisser */}
            <TouchableOpacity
              style={styles.modalBackdropDismisser}
              activeOpacity={1}
              onPress={() => setSelectedRecord(null)}
              accessibilityLabel="Close backdrop"
            />
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Verification Record #{selectedRecord.id}</Text>
                  <Text style={styles.modalSub}>
                    Tag: {selectedRecord.animal_identifier || `PB-${selectedRecord.id}`}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setSelectedRecord(null)}
                  style={styles.closeBtn}
                  accessibilityLabel="Close"
                >
                  <X size={18} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.modalScroll}
                contentContainerStyle={styles.modalScrollContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.detailGrid}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailKey}>Verified Breed:</Text>
                    <Text style={[styles.detailVal, { color: colors.primaryDark, fontWeight: '800' }]}>
                      {selectedRecord.verified_breed}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailKey}>AI Initial Prediction:</Text>
                    <Text style={styles.detailVal}>
                      {selectedRecord.predicted_breed} ({(selectedRecord.predicted_confidence * 100).toFixed(1)}%)
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailKey}>Status:</Text>
                    <Text style={styles.detailVal}>
                      {selectedRecord.verification_status}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailKey}>Species:</Text>
                    <Text style={styles.detailVal}>{selectedRecord.animal_type}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailKey}>Vision Model:</Text>
                    <Text style={styles.detailVal}>{selectedRecord.model_version}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailKey}>Timestamp:</Text>
                    <Text style={styles.detailVal}>
                      {new Date(selectedRecord.created_at).toLocaleString()}
                    </Text>
                  </View>

                  {selectedRecord.notes ? (
                    <View style={styles.notesBlock}>
                      <Text style={styles.detailKey}>Field Worker Notes:</Text>
                      <Text style={styles.notesBlockText}>{selectedRecord.notes}</Text>
                    </View>
                  ) : null}
                </View>
              </ScrollView>

              <TouchableOpacity
                style={styles.modalDismissBtn}
                onPress={() => setSelectedRecord(null)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalDismissText}>Close Audit View</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: 14,
    paddingVertical: 9,
    gap: 8,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.textPrimary,
  },
  filterTabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    overflowX: 'auto' as any,
    overflowY: 'hidden' as any,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  filterPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  centerContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  errorContainer: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginVertical: 16,
  },
  errorTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.danger,
    textAlign: 'center',
  },
  errorSub: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 16,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    gap: 6,
    marginTop: 6,
  },
  retryBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  emptyContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  emptySub: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
  },
  emptyScanBtn: {
    marginTop: 12,
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    boxShadow: '0 2px 6px rgba(45, 139, 117, 0.25)',
  },
  emptyScanBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  recordsList: {
    gap: 14,
  },
  desktopRecordsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  recordCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 16,
    boxShadow: '0 2px 8px rgba(45, 139, 117, 0.08)',
    contentVisibility: 'auto' as any,
    containIntrinsicSize: 'auto 175px' as any,
  },
  desktopRecordCard: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 320,
    minWidth: 280,
    maxWidth: 540,
    contentVisibility: 'auto' as any,
    containIntrinsicSize: 'auto 175px' as any,
  },
  loadMoreWrapper: {
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 10,
  },
  loadMoreBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    boxShadow: '0 1px 4px rgba(45, 139, 117, 0.08)',
  },
  loadMoreBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  tagWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  demoBadge: {
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  demoBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  breedCompareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  compareCol: {
    flex: 1,
  },
  arrowCol: {
    paddingHorizontal: 8,
  },
  compareLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  compareBreed: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  compareConf: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  compareSpecies: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  notesExcerpt: {
    fontSize: 11,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  timeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 10,
    color: colors.textMuted,
  },
  detailsPrompt: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    position: (Platform.OS === 'web' ? 'fixed' : 'absolute') as any,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  modalBackdropDismisser: {
    position: 'absolute' as any,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    width: '100%',
    maxWidth: 520,
    maxHeight: ('90vh' as any),
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    zIndex: 1001,
    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  modalSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  modalScroll: {
    flexShrink: 1,
    marginBottom: 14,
  },
  modalScrollContent: {
    paddingVertical: 4,
  },
  detailGrid: {
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  detailKey: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  detailVal: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  notesBlock: {
    marginTop: 8,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
  notesBlockText: {
    fontSize: 12,
    color: colors.textPrimary,
    lineHeight: 17,
  },
  modalDismissBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
    boxShadow: '0 2px 4px rgba(45, 139, 117, 0.25)',
  },
  modalDismissText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
});
