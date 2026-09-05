import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { ConfidenceTier } from '../types';

interface ConfidenceBarProps {
  percentage: number;
  tier?: ConfidenceTier;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const ConfidenceBar: React.FC<ConfidenceBarProps> = ({
  percentage,
  tier,
  showLabel = true,
  size = 'md',
}) => {
  const clampedPercent = Math.max(0, Math.min(100, percentage));

  // Determine color based on tier or percentage
  let barColor = colors.tierLow;
  let tierLabel = 'LOW';
  let tierBadgeBg = colors.tierLowBg;
  let tierTextColor = colors.tierLow;

  if (tier === 'HIGH' || clampedPercent >= 75) {
    barColor = colors.tierHigh;
    tierLabel = 'HIGH CONFIDENCE';
    tierBadgeBg = colors.tierHighBg;
    tierTextColor = colors.tierHigh;
  } else if (tier === 'MEDIUM' || clampedPercent >= 45) {
    barColor = colors.tierMedium;
    tierLabel = 'MODERATE';
    tierBadgeBg = colors.tierMediumBg;
    tierTextColor = colors.tierMedium;
  } else {
    tierLabel = 'LOW CONFIDENCE';
  }

  const height = size === 'sm' ? 6 : size === 'lg' ? 12 : 8;

  return (
    <View style={styles.container}>
      {showLabel && (
        <View style={styles.labelRow}>
          <View style={[styles.tierBadge, { backgroundColor: tierBadgeBg }]}>
            <Text style={[styles.tierText, { color: tierTextColor }]}>
              {tierLabel}
            </Text>
          </View>
          <Text style={styles.percentText}>{clampedPercent.toFixed(1)}%</Text>
        </View>
      )}

      <View style={[styles.track, { height }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${clampedPercent}%`,
              backgroundColor: barColor,
              height,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 4,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  tierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tierText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  percentText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  track: {
    width: '100%',
    backgroundColor: colors.borderLight,
    borderRadius: 999,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: 999,
  },
});
