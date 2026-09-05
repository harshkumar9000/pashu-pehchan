import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {
  BarChart2,
  RefreshCw,
  TrendingUp,
  Award,
  CheckCircle2,
  AlertTriangle,
  PieChart,
  ShieldCheck,
} from 'lucide-react';
import { colors } from '../theme/colors';
import { DashboardResponse } from '../types';
import { getDashboardStats } from '../services/api';

export const DashboardScreen: React.FC = () => {
  const [stats, setStats] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = () => {
    setLoading(true);
    getDashboardStats()
      .then((data) => setStats(data))
      .catch((err) => console.log('Error loading dashboard stats:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const total = stats?.total_records || 1;
  const highConf = stats?.confidence_distribution?.high || 0;
  const medConf = stats?.confidence_distribution?.medium || 0;
  const lowConf = stats?.confidence_distribution?.low || 0;

  const highPct = Math.round((highConf / total) * 100);
  const medPct = Math.round((medConf / total) * 100);
  const lowPct = Math.round((lowConf / total) * 100);

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
  const metricCardWidth =
    windowWidth >= 1024
      ? ('calc(25% - 8px)' as any)
      : ('calc(50% - 6px)' as any);

  return (
    <ScrollView
      style={isDesktop ? styles.desktopScrollView : styles.container}
      contentContainerStyle={[styles.content, isDesktop && styles.desktopContent]}
    >
      {/* Title */}
      <View style={styles.titleRow}>
        <View>
          <Text style={styles.screenTitle}>Verification Analytics</Text>
          <Text style={styles.screenSubtitle}>
            Supervisor telemetry computed strictly from verified SQLite records.
          </Text>
        </View>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={fetchStats}
          activeOpacity={0.7}
        >
          <RefreshCw size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {loading && !stats ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Compiling database analytics...</Text>
        </View>
      ) : (
        <>
          {/* KPI Metrics Grid */}
          <View style={styles.metricsGrid}>
            <View style={[styles.metricCard, isDesktop && { width: metricCardWidth, maxWidth: metricCardWidth }]}>
              <Text style={styles.metricLabel}>TOTAL AUDITED</Text>
              <Text style={styles.metricValue}>{stats?.total_records ?? 0}</Text>
              <Text style={styles.metricSub}>Animals registered</Text>
            </View>

            <View style={[styles.metricCard, isDesktop && { width: metricCardWidth, maxWidth: metricCardWidth }]}>
              <Text style={styles.metricLabel}>HUMAN VERIFIED</Text>
              <Text style={[styles.metricValue, { color: colors.success }]}>
                {stats?.verification_rate ?? 0}%
              </Text>
              <Text style={styles.metricSub}>
                {stats?.verified_records ?? 0} matches confirmed
              </Text>
            </View>

            <View style={[styles.metricCard, isDesktop && { width: metricCardWidth, maxWidth: metricCardWidth }]}>
              <Text style={styles.metricLabel}>OVERRIDDEN</Text>
              <Text style={[styles.metricValue, { color: colors.warning }]}>
                {stats?.overridden_records ?? 0}
              </Text>
              <Text style={styles.metricSub}>Field corrections</Text>
            </View>

            <View style={[styles.metricCard, isDesktop && { width: metricCardWidth, maxWidth: metricCardWidth }]}>
              <Text style={styles.metricLabel}>AVG CONFIDENCE</Text>
              <Text style={[styles.metricValue, { color: colors.primary }]}>
                {stats?.average_confidence ?? 0}%
              </Text>
              <Text style={styles.metricSub}>EfficientNet-B0 output</Text>
            </View>
          </View>

          {/* Model Confidence Distribution */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Model Confidence Distribution</Text>
            <Text style={styles.sectionSub}>
              Proportion of field scans grouped by AI certainty tier
            </Text>

            <View style={styles.stackedBarTrack}>
              <View style={[styles.barHigh, { width: `${highPct}%` }]} />
              <View style={[styles.barMed, { width: `${medPct}%` }]} />
              <View style={[styles.barLow, { width: `${lowPct}%` }]} />
            </View>

            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.tierHigh }]} />
                <Text style={styles.legendText}>High (≥75%): {highConf} ({highPct}%)</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.tierMedium }]} />
                <Text style={styles.legendText}>Medium (45-74%): {medConf} ({medPct}%)</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.tierLow }]} />
                <Text style={styles.legendText}>Low (&lt;45%): {lowConf} ({lowPct}%)</Text>
              </View>
            </View>
          </View>

          {/* Top Breeds Logged */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Top Verified Breeds in Field</Text>
            <Text style={styles.sectionSub}>
              Most frequent breeds recorded during field enumerations
            </Text>

            <View style={styles.barsList}>
              {stats?.top_breeds && stats.top_breeds.length > 0 ? (
                stats.top_breeds.map((tb, idx) => {
                  const maxCount = stats.top_breeds[0]?.count || 1;
                  const barWidth = Math.max(10, Math.round((tb.count / maxCount) * 100));

                  return (
                    <View key={tb.breed} style={styles.barRow}>
                      <View style={styles.barLabelRow}>
                        <Text style={styles.barLabelText}>
                          #{idx + 1} {tb.breed.replace(/_/g, ' ')}
                        </Text>
                        <Text style={styles.barCountText}>{tb.count} records</Text>
                      </View>
                      <View style={styles.barTrack}>
                        <View
                          style={[
                            styles.barFill,
                            { width: `${barWidth}%`, backgroundColor: colors.primary },
                          ]}
                        />
                      </View>
                    </View>
                  );
                })
              ) : (
                <Text style={styles.noDataText}>No breed verification records yet.</Text>
              )}
            </View>
          </View>

          {/* Species Distribution */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Species Breakdown</Text>
            <View style={styles.speciesRow}>
              {stats?.species_counts?.map((sp) => {
                const isBuffalo = sp.type === 'Buffalo';
                return (
                  <View
                    key={sp.type}
                    style={[
                      styles.speciesBox,
                      isBuffalo ? styles.speciesBoxBuffalo : styles.speciesBoxCattle,
                    ]}
                  >
                    <Text
                      style={[
                        styles.speciesBoxTitle,
                        isBuffalo ? styles.textBuffalo : styles.textCattle,
                      ]}
                    >
                      {sp.type}
                    </Text>
                    <Text style={styles.speciesBoxCount}>{sp.count}</Text>
                    <Text style={styles.speciesBoxSub}>Registered animals</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </>
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
    gap: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
    maxWidth: 360,
    lineHeight: 18,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 1px 3px rgba(45, 139, 117, 0.08)',
  },
  centerBox: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 18,
  },
  metricCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 16,
    flexGrow: 1,
    boxShadow: '0 2px 8px rgba(45, 139, 117, 0.08)',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 4,
  },
  metricSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 18,
    marginBottom: 18,
    boxShadow: '0 2px 8px rgba(45, 139, 117, 0.08)',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  sectionSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: 14,
  },
  stackedBarTrack: {
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.borderLight,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 12,
  },
  barHigh: {
    backgroundColor: colors.tierHigh,
    height: '100%',
  },
  barMed: {
    backgroundColor: colors.tierMedium,
    height: '100%',
  },
  barLow: {
    backgroundColor: colors.tierLow,
    height: '100%',
  },
  legendRow: {
    gap: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  barsList: {
    gap: 12,
  },
  barRow: {
    gap: 5,
  },
  barLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  barLabelText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  barCountText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
  barTrack: {
    height: 10,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 5,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 5,
  },
  noDataText: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: 14,
  },
  speciesRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  speciesBox: {
    flex: 1,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
  },
  speciesBoxCattle: {
    backgroundColor: colors.cattleBg,
    borderColor: '#bae6fd',
  },
  speciesBoxBuffalo: {
    backgroundColor: colors.buffaloBg,
    borderColor: '#e9d5ff',
  },
  speciesBoxTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  textCattle: {
    color: colors.cattleBadge,
  },
  textBuffalo: {
    color: colors.buffaloBadge,
  },
  speciesBoxCount: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 4,
  },
  speciesBoxSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
});
