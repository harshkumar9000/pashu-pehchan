import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Check,
  Cpu,
  Info,
  ChevronRight,
  ShieldCheck,
  Edit3,
} from 'lucide-react';
import { colors } from '../theme/colors';
import { ConfidenceBar } from '../components/ConfidenceBar';
import { PredictResponse, BreedItem, PredictionItem } from '../types';
import { getBreedByName } from '../services/api';

interface ResultScreenProps {
  prediction: PredictResponse;
  imageUrl: string;
  animalIdentifier: string;
  onConfirmBreed: (breed: string) => void;
  onOverrideBreed: (suggestedBreed?: string) => void;
  onScanAnother: () => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  prediction,
  imageUrl,
  animalIdentifier,
  onConfirmBreed,
  onOverrideBreed,
  onScanAnother,
}) => {
  const [breedDetail, setBreedDetail] = useState<BreedItem | null>(null);
  const [loadingBreed, setLoadingBreed] = useState(false);

  const topBreedName = prediction.top_prediction.breed;

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
    if (topBreedName) {
      setLoadingBreed(true);
      getBreedByName(topBreedName)
        .then((data) => setBreedDetail(data))
        .catch((err) => console.log('Breed detail fetch error:', err))
        .finally(() => setLoadingBreed(false));
    }
  }, [topBreedName]);

  const isBuffalo = prediction.animal_type === 'Buffalo';

  return (
    <ScrollView
      style={isDesktop ? styles.desktopScrollView : styles.container}
      contentContainerStyle={[styles.content, isDesktop && styles.desktopContent]}
    >
      <View style={[styles.mainLayout, isDesktop && styles.desktopMainLayout]}>
        {/* Left Column: Image, Tag & Diagnostic Traits */}
        <View style={[styles.leftCol, isDesktop && styles.desktopLeftCol]}>
          {/* Top Meta Bar */}
          <View style={styles.metaRow}>
            <View style={styles.tagBadge}>
              <Text style={styles.tagText}>TAG: {animalIdentifier || 'PB-LIVE'}</Text>
            </View>

            <View
              style={[
                styles.speciesBadge,
                isBuffalo ? styles.speciesBuffalo : styles.speciesCattle,
              ]}
            >
              <Text
                style={[
                  styles.speciesText,
                  isBuffalo ? styles.speciesTextBuffalo : styles.speciesTextCattle,
                ]}
              >
                {isBuffalo ? 'Water Buffalo (Bubalus)' : 'Zebu Cattle (Bos indicus)'}
              </Text>
            </View>
          </View>

          {/* Captured Image Preview */}
          <View style={styles.imageCard}>
            <Image
              source={{ uri: imageUrl }}
              style={styles.previewImage}
              resizeMode="cover"
            />
            <View style={styles.latencyOverlay}>
              <Cpu size={12} color="#ffffff" />
              <Text style={styles.latencyText}>
                {prediction.architecture} • {prediction.inference_time_ms} ms
              </Text>
            </View>
          </View>

          {/* Breed Physical Trait Diagnostic */}
          {breedDetail && (
            <View style={styles.traitCard}>
              <Text style={styles.traitCardTitle}>
                Diagnostic Key Traits: {breedDetail.display_name}
              </Text>
              <View style={styles.traitGrid}>
                <View style={styles.traitItem}>
                  <Text style={styles.traitKey}>Origin Region</Text>
                  <Text style={styles.traitVal}>{breedDetail.region || 'Native to India'}</Text>
                </View>
                <View style={styles.traitItem}>
                  <Text style={styles.traitKey}>Primary Utility</Text>
                  <Text style={styles.traitVal}>{breedDetail.purpose || 'Milch / Draught'}</Text>
                </View>
                <View style={styles.traitItem}>
                  <Text style={styles.traitKey}>Horn Structure</Text>
                  <Text style={styles.traitVal}>{breedDetail.horn_type || 'Distinctive'}</Text>
                </View>
                <View style={styles.traitItem}>
                  <Text style={styles.traitKey}>Typical Coat</Text>
                  <Text style={styles.traitVal}>{breedDetail.coat_color || 'Standard'}</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Right Column: AI Predictions & Actions */}
        <View style={[styles.rightCol, isDesktop && styles.desktopRightCol]}>
          {/* Primary Top Recommendation Banner */}
          <View style={styles.topCard}>
            <View style={styles.topHeader}>
              <View>
                <Text style={styles.topLabel}>PRIMARY SUGGESTION</Text>
                <Text style={styles.topBreedName}>{topBreedName.replace(/_/g, ' ')}</Text>
              </View>
              <View style={styles.confidenceScoreBox}>
                <Text style={styles.confidenceScoreNumber}>
                  {(prediction.top_prediction.confidence * 100).toFixed(1)}%
                </Text>
                <Text style={styles.confidenceScoreSub}>CONFIDENCE</Text>
              </View>
            </View>

            <ConfidenceBar
              percentage={prediction.top_prediction.confidence * 100}
              tier={prediction.confidence_level}
              size="lg"
            />

            <View style={styles.recommendationBox}>
              <Info size={14} color={colors.primary} />
              <Text style={styles.recommendationText}>
                {prediction.recommendation}
              </Text>
            </View>
          </View>

          {/* Top-3 Suggested Breeds List */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top-3 Model Probabilities</Text>
            <Text style={styles.sectionSubtitle}>
              Select an alternative if field traits differ from primary suggestion:
            </Text>
          </View>

          <View style={styles.predictionsList}>
            {prediction.predictions.map((item, index) => {
              const isTop = index === 0;
              return (
                <TouchableOpacity
                  key={item.breed}
                  style={[styles.predictionRow, isTop && styles.predictionRowTop]}
                  onPress={() => onOverrideBreed(item.breed)}
                  activeOpacity={0.7}
                >
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankText}>#{index + 1}</Text>
                  </View>

                  <View style={styles.predictionInfo}>
                    <View style={styles.predictionTitleRow}>
                      <Text style={styles.predictionBreedName}>
                        {item.breed.replace(/_/g, ' ')}
                      </Text>
                      <Text style={styles.predictionPercent}>
                        {item.percentage.toFixed(1)}%
                      </Text>
                    </View>

                    <ConfidenceBar
                      percentage={item.percentage}
                      showLabel={false}
                      size="sm"
                    />

                    <Text style={styles.predictionSpeciesText}>
                      {item.animal_type}
                    </Text>
                  </View>

                  <ChevronRight size={18} color={colors.textMuted} />
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={() => onConfirmBreed(topBreedName)}
              activeOpacity={0.85}
            >
              <Check size={20} color="#ffffff" />
              <Text style={styles.confirmButtonText}>
                Confirm {topBreedName.replace(/_/g, ' ')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.overrideButton}
              onPress={() => onOverrideBreed(topBreedName)}
              activeOpacity={0.85}
            >
              <Edit3 size={18} color={colors.primaryDark} />
              <Text style={styles.overrideButtonText}>Override / Select Other Breed</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.retakeButton}
              onPress={onScanAnother}
              activeOpacity={0.7}
            >
              <RotateCcw size={16} color={colors.textSecondary} />
              <Text style={styles.retakeButtonText}>Scan Another Animal</Text>
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
  desktopScrollView: {
    overflow: 'visible' as any,
    flex: 'none' as any,
    height: 'auto' as any,
    backgroundColor: 'transparent',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  desktopContent: {
    padding: 0,
    paddingBottom: 32,
  },
  mainLayout: {
    flexDirection: 'column',
    gap: 16,
  },
  desktopMainLayout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 24,
  },
  leftCol: {
    flex: 1,
  },
  desktopLeftCol: {
    flex: 45,
  },
  rightCol: {
    flex: 1,
  },
  desktopRightCol: {
    flex: 55,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tagBadge: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  speciesBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  speciesCattle: {
    backgroundColor: colors.cattleBg,
    borderColor: '#bae6fd',
  },
  speciesBuffalo: {
    backgroundColor: colors.buffaloBg,
    borderColor: '#e9d5ff',
  },
  speciesText: {
    fontSize: 11,
    fontWeight: '700',
  },
  speciesTextCattle: {
    color: colors.cattleBadge,
  },
  speciesTextBuffalo: {
    color: colors.buffaloBadge,
  },
  imageCard: {
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: 16,
    boxShadow: '0 2px 8px rgba(45, 139, 117, 0.08)',
  },
  previewImage: {
    width: '100%',
    height: 220,
    backgroundColor: '#000000',
  },
  latencyOverlay: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  latencyText: {
    fontSize: 11,
    color: '#ffffff',
    fontWeight: '600',
  },
  topCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    padding: 18,
    marginBottom: 16,
    boxShadow: '0 2px 8px rgba(45, 139, 117, 0.08)',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  topLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.6,
  },
  topBreedName: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 2,
  },
  confidenceScoreBox: {
    alignItems: 'flex-end',
  },
  confidenceScoreNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  confidenceScoreSub: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
  },
  recommendationBox: {
    backgroundColor: colors.primarySoft,
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recommendationText: {
    fontSize: 12,
    color: colors.primaryDark,
    flex: 1,
    lineHeight: 16,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  predictionsList: {
    gap: 10,
    marginBottom: 16,
  },
  predictionRow: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    boxShadow: '0 1px 4px rgba(45, 139, 117, 0.08)',
  },
  predictionRowTop: {
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primarySoft,
  },
  rankBadge: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  predictionInfo: {
    flex: 1,
  },
  predictionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  predictionBreedName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  predictionPercent: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  predictionSpeciesText: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  traitCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 16,
    marginBottom: 18,
    boxShadow: '0 2px 6px rgba(45, 139, 117, 0.08)',
  },
  traitCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  traitGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  traitItem: {
    width: '48%',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  traitKey: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  traitVal: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  actionsContainer: {
    gap: 12,
  },
  confirmButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    boxShadow: '0 3px 6px rgba(45, 139, 117, 0.25)',
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
  overrideButton: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
  },
  overrideButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  retakeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
