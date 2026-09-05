import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Check,
  ChevronLeft,
  FileCheck,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { colors } from '../theme/colors';
import {
  PredictResponse,
  BreedItem,
  VerificationStatus,
  RecordResponse,
} from '../types';
import * as api from '../services/api';
import { getBreeds, saveRecord } from '../services/api';

interface VerificationScreenProps {
  prediction: PredictResponse;
  animalIdentifier: string;
  initialSelectedBreed?: string;
  onBackToResults: () => void;
  onRecordSaved: (record: RecordResponse) => void;
}

export const VerificationScreen: React.FC<VerificationScreenProps> = ({
  prediction,
  animalIdentifier,
  initialSelectedBreed,
  onBackToResults,
  onRecordSaved,
}) => {
  const [allBreeds, setAllBreeds] = useState<BreedItem[]>([]);
  const [loadingBreeds, setLoadingBreeds] = useState(true);

  const topBreed = prediction.top_prediction.breed;
  const isTopMatch = initialSelectedBreed === topBreed;

  const [mode, setMode] = useState<'confirm' | 'override' | 'manual'>(
    initialSelectedBreed && !isTopMatch ? 'override' : 'confirm'
  );

  const [selectedBreed, setSelectedBreed] = useState<string>(
    initialSelectedBreed || topBreed
  );
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
    getBreeds()
      .then((data) => setAllBreeds(data))
      .catch((err) => console.log('Error fetching breeds list:', err))
      .finally(() => setLoadingBreeds(false));
  }, []);

  const handleSave = async () => {
    setSubmitting(true);
    setErrorMsg(null);

    let status: VerificationStatus = 'Human Verified';
    let finalBreed = topBreed;

    if (mode === 'confirm') {
      status = 'Human Verified';
      finalBreed = topBreed;
    } else if (mode === 'override') {
      status = 'Overridden';
      finalBreed = selectedBreed;
    } else {
      status = 'Manual Review';
      finalBreed = 'Inconclusive / Pending Supervisor';
    }

    try {
      const saved = await saveRecord({
        predicted_breed: topBreed,
        predicted_confidence: prediction.top_prediction.confidence,
        verified_breed: finalBreed,
        verification_status: status,
        animal_identifier: animalIdentifier || `PB-${Math.floor(10000 + Math.random() * 90000)}`,
        animal_type: prediction.animal_type,
        notes: notes.trim() || undefined,
        model_version: prediction.model_version,
        top3_data: prediction.predictions,
        inference_time_ms: prediction.inference_time_ms,
      });

      // Also save into farmer's digital herd inventory
      try {
        await api.createAnimal({
          tag_number: animalIdentifier || `PB-${Math.floor(10000 + Math.random() * 90000)}`,
          species: prediction.animal_type,
          breed: finalBreed,
          predicted_breed: topBreed,
          confidence_score: prediction.top_prediction.confidence,
          is_human_verified: status === 'Human Verified' ? 1 : 0,
          daily_milk_yield_litres: prediction.animal_type === 'Buffalo' ? 14 : 12,
          health_status: 'HEALTHY',
          status: 'IN_HERD',
        });
      } catch (err) {
        console.warn('Failed to add animal to herd:', err);
      }

      onRecordSaved(saved);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save verification record.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView
      style={isDesktop ? styles.desktopScrollView : styles.container}
      contentContainerStyle={[styles.content, isDesktop && styles.desktopContent]}
    >
      {/* Back button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={onBackToResults}
        activeOpacity={0.7}
      >
        <ChevronLeft size={18} color={colors.textSecondary} />
        <Text style={styles.backButtonText}>Back to Analysis</Text>
      </TouchableOpacity>

      <View style={styles.titleSection}>
        <Text style={styles.screenTitle}>Human Verification Audit</Text>
        <Text style={styles.screenSubtitle}>
          Tag {animalIdentifier || 'PB-LIVE'} • National Livestock Mission protocol
        </Text>
      </View>

      {/* Model vs Human Comparison Banner */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryCol}>
          <Text style={styles.summaryLabel}>AI TOP SUGGESTION</Text>
          <Text style={styles.summaryBreed}>
            {topBreed.replace(/_/g, ' ')}
          </Text>
          <Text style={styles.summaryConfidence}>
            {(prediction.top_prediction.confidence * 100).toFixed(1)}% Confidence
          </Text>
        </View>

        <View style={styles.arrowCol}>
          <ArrowRight size={20} color={colors.textMuted} />
        </View>

        <View style={styles.summaryCol}>
          <Text style={styles.summaryLabel}>FINAL VERIFIED</Text>
          <Text style={[styles.summaryBreed, { color: colors.primary }]}>
            {mode === 'manual'
              ? 'Flagged Review'
              : selectedBreed.replace(/_/g, ' ')}
          </Text>
          <Text style={styles.summaryConfidence}>
            {mode === 'confirm'
              ? 'Confirmed by Worker'
              : mode === 'override'
              ? 'Worker Overridden'
              : 'Supervisor Escalate'}
          </Text>
        </View>
      </View>

      {/* Verification Action Selection */}
      <Text style={styles.sectionHeader}>Verification Action</Text>

      <View style={styles.optionsContainer}>
        {/* Option 1: Confirm Top Suggestion */}
        <TouchableOpacity
          style={[
            styles.optionCard,
            mode === 'confirm' && styles.optionCardActive,
          ]}
          onPress={() => {
            setMode('confirm');
            setSelectedBreed(topBreed);
          }}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.radioCircle,
              mode === 'confirm' && styles.radioCircleActive,
            ]}
          >
            {mode === 'confirm' && <View style={styles.radioInner} />}
          </View>
          <View style={styles.optionTextWrap}>
            <Text style={styles.optionTitle}>
              Confirm AI Suggestion ({topBreed.replace(/_/g, ' ')})
            </Text>
            <Text style={styles.optionDesc}>
              Physical characteristics (horns, dewlap, coat) match the model suggestion.
            </Text>
          </View>
        </TouchableOpacity>

        {/* Option 2: Override Breed */}
        <TouchableOpacity
          style={[
            styles.optionCard,
            mode === 'override' && styles.optionCardActive,
          ]}
          onPress={() => setMode('override')}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.radioCircle,
              mode === 'override' && styles.radioCircleActive,
            ]}
          >
            {mode === 'override' && <View style={styles.radioInner} />}
          </View>
          <View style={styles.optionTextWrap}>
            <Text style={styles.optionTitle}>Override with Another Breed</Text>
            <Text style={styles.optionDesc}>
              Field traits indicate an alternative breed or top-3 runner up.
            </Text>
          </View>
        </TouchableOpacity>

        {/* Option 3: Manual Review */}
        <TouchableOpacity
          style={[
            styles.optionCard,
            mode === 'manual' && styles.optionCardActive,
          ]}
          onPress={() => setMode('manual')}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.radioCircle,
              mode === 'manual' && styles.radioCircleActive,
            ]}
          >
            {mode === 'manual' && <View style={styles.radioInner} />}
          </View>
          <View style={styles.optionTextWrap}>
            <Text style={styles.optionTitle}>Inconclusive / Escalate to Supervisor</Text>
            <Text style={styles.optionDesc}>
              Poor visibility, hybrid cross, or non-descript animal needing senior veterinary check.
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Override Dropdown Selector */}
      {mode === 'override' && (
        <View style={styles.dropdownSection}>
          <Text style={styles.dropdownLabel}>Select Verified Breed:</Text>
          {loadingBreeds ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <View style={styles.breedPillsWrap}>
              {allBreeds.map((b) => {
                const isSelected = selectedBreed === b.breed;
                return (
                  <TouchableOpacity
                    key={b.breed}
                    style={[
                      styles.breedPill,
                      isSelected && styles.breedPillSelected,
                    ]}
                    onPress={() => setSelectedBreed(b.breed)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.breedPillText,
                        isSelected && styles.breedPillTextSelected,
                      ]}
                    >
                      {b.display_name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      )}

      {/* Inspector Field Notes */}
      <View style={styles.notesSection}>
        <Text style={styles.notesLabel}>Field Notes / Justification (Optional)</Text>
        <TextInput
          style={styles.notesInput}
          value={notes}
          onChangeText={setNotes}
          placeholder="e.g. Checked ear size and hump profile. Horn tips turn slightly inward."
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Error Message */}
      {errorMsg && (
        <View style={styles.errorBox}>
          <AlertCircle size={16} color={colors.danger} />
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      )}

      {/* Submit Action */}
      <TouchableOpacity
        style={[styles.saveButton, submitting && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={submitting}
        activeOpacity={0.85}
      >
        {submitting ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <View style={styles.saveBtnContent}>
            <FileCheck size={20} color="#ffffff" />
            <Text style={styles.saveButtonText}>Commit to Bharat Pashudhan Audit Log</Text>
          </View>
        )}
      </TouchableOpacity>
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
    paddingBottom: 36,
  },
  desktopContent: {
    padding: 0,
    paddingBottom: 36,
    maxWidth: 960,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
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
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    boxShadow: '0 2px 8px rgba(45, 139, 117, 0.08)',
  },
  summaryCol: {
    flex: 1,
  },
  arrowCol: {
    paddingHorizontal: 8,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  summaryBreed: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 2,
  },
  summaryConfidence: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  optionsContainer: {
    gap: 10,
    marginBottom: 16,
  },
  optionCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    boxShadow: '0 1px 4px rgba(45, 139, 117, 0.08)',
  },
  optionCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  radioCircleActive: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  optionTextWrap: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  optionDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  dropdownSection: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 16,
    marginBottom: 16,
    boxShadow: '0 2px 6px rgba(45, 139, 117, 0.08)',
  },
  dropdownLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primaryDark,
    marginBottom: 10,
  },
  breedPillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    maxHeight: 180,
    overflow: 'scroll',
  },
  breedPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  breedPillSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  breedPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  breedPillTextSelected: {
    color: '#ffffff',
    fontWeight: '700',
  },
  notesSection: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 16,
    marginBottom: 16,
    boxShadow: '0 2px 6px rgba(45, 139, 117, 0.08)',
  },
  notesLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  notesInput: {
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    color: colors.textPrimary,
    minHeight: 72,
    textAlignVertical: 'top',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.dangerBg,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 12,
    color: colors.danger,
    flex: 1,
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 3px 6px rgba(45, 139, 117, 0.25)',
  },
  saveButtonDisabled: {
    backgroundColor: '#9ca3af',
    boxShadow: 'none',
  },
  saveBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
});
