import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import {
  Camera,
  Upload,
  RefreshCw,
  X,
  Sparkles,
  Tag,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { colors } from '../theme/colors';
import { GuidanceCard } from '../components/GuidanceCard';
import { CameraModal } from '../components/adapters/camera';
import { predictImage, getApiBaseUrl } from '../services/api';
import { PredictResponse } from '../types';

interface ScanScreenProps {
  initialBreed?: string;
  onPredictionComplete: (
    result: PredictResponse,
    imageUrl: string,
    animalIdentifier: string
  ) => void;
}

export const ScanScreen: React.FC<ScanScreenProps> = ({
  initialBreed,
  onPredictionComplete,
}) => {
  const [selectedImage, setSelectedImage] = useState<File | Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [animalTag, setAnimalTag] = useState<string>(() => {
    return `PB-${Math.floor(10000 + Math.random() * 90000)}`;
  });
  const [loading, setLoading] = useState(false);
  const [loadingSample, setLoadingSample] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cameraModalOpen, setCameraModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

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

  // If navigated with initial breed (from Home chip)
  useEffect(() => {
    if (initialBreed) {
      loadSample(initialBreed);
    }
  }, [initialBreed]);

  const handleFileChange = (e: any) => {
    const file = e.target?.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File | Blob) => {
    if (file.type && !file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (JPEG, PNG, or WebP).');
      return;
    }
    setErrorMsg(null);
    setSelectedImage(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const clearImage = () => {
    setSelectedImage(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setErrorMsg(null);
  };

  const handleCameraClick = () => {
    setErrorMsg(null);
    if (Platform.OS === 'web') {
      setCameraModalOpen(true);
    } else {
      (cameraInputRef.current as any)?.click();
    }
  };

  const handleCameraCapture = (file: File | Blob | any, url: string) => {
    setErrorMsg(null);
    setSelectedImage(file);
    setPreviewUrl(url);
    setCameraModalOpen(false);
  };

  const handleCameraClose = () => {
    setCameraModalOpen(false);
  };

  const handleUploadFallback = () => {
    setCameraModalOpen(false);
    (fileInputRef.current as any)?.click();
  };

  const loadSample = async (breedName: string) => {
    setLoadingSample(true);
    setErrorMsg(null);
    try {
      const slug = breedName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const baseUrl = getApiBaseUrl();

      // 1. Try backend API first, fallback to static public asset
      let res: Response | null = null;
      try {
        res = await fetch(`${baseUrl}/api/sample/${encodeURIComponent(breedName)}`);
      } catch {
        res = null;
      }

      if (!res || !res.ok) {
        res = await fetch(`/samples/${slug}.jpg`);
      }

      if (!res.ok) {
        throw new Error(`Could not load sample image for ${breedName} (HTTP ${res.status}).`);
      }

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        throw new Error(`Invalid response for ${breedName} sample: expected image, received HTML.`);
      }

      const blob = await res.blob();
      const file = new File([blob], `${slug}_sample.jpg`, { type: 'image/jpeg' });
      processFile(file);
    } catch (err: any) {
      setErrorMsg(`Failed to load ${breedName} sample: ${err.message}`);
    } finally {
      setLoadingSample(false);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) {
      setErrorMsg('Please select or capture a cattle/buffalo photo first.');
      return;
    }

    if (selectedImage.type && !selectedImage.type.startsWith('image/')) {
      setErrorMsg('Selected file is not an image. Please choose a valid photo.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const filename = (selectedImage as File).name || 'cattle_upload.jpg';
      const response = await predictImage(selectedImage, filename);
      if (previewUrl) {
        onPredictionComplete(response, previewUrl, animalTag.trim());
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Model inference failed. Ensure the server is online.');
    } finally {
      setLoading(false);
    }
  };

  const generateNewTag = () => {
    setAnimalTag(`PB-${Math.floor(10000 + Math.random() * 90000)}`);
  };

  return (
    <>
      <ScrollView
        style={isDesktop ? styles.desktopScrollView : styles.container}
        contentContainerStyle={[styles.content, isDesktop && styles.desktopContent]}
      >
      {/* Hidden file inputs for Web */}
      {Platform.OS === 'web' && (
        <>
          <input
            type="file"
            ref={fileInputRef as any}
            style={{ display: 'none' }}
            accept="image/*"
            onChange={handleFileChange}
          />
          <input
            type="file"
            ref={cameraInputRef as any}
            style={{ display: 'none' }}
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
          />
        </>
      )}

      {/* Screen Layout: 2-Column on Desktop, 1-Column on Mobile */}
      <View style={[styles.mainLayout, isDesktop && styles.desktopMainLayout]}>
        {/* Left Column: Photo Upload / Preview & Instant Presets */}
        <View style={[styles.leftCol, isDesktop && styles.desktopLeftCol]}>
          {/* Upload / Preview Card */}
          <View style={styles.uploadCard}>
            {previewUrl ? (
              <View style={styles.previewContainer}>
                <Image
                  source={{ uri: previewUrl }}
                  style={styles.previewImage}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={clearImage}
                  activeOpacity={0.8}
                >
                  <X size={16} color="#ffffff" />
                </TouchableOpacity>

                <View style={styles.retakeRow}>
                  <TouchableOpacity
                    style={styles.retakeButton}
                    onPress={handleCameraClick}
                    activeOpacity={0.8}
                  >
                    <Camera size={14} color={colors.primary} />
                    <Text style={styles.retakeText}>Retake Camera</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.retakeButton}
                    onPress={() => (fileInputRef.current as any)?.click()}
                    activeOpacity={0.8}
                  >
                    <Upload size={14} color={colors.primary} />
                    <Text style={styles.retakeText}>Upload Other</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.emptyUploadBox}>
                <View style={styles.uploadIconCircle}>
                  <Camera size={32} color={colors.primary} />
                </View>

                <Text style={styles.uploadPromptTitle}>No photo selected</Text>
                <Text style={styles.uploadPromptSubtitle}>
                  Take a clear picture of the cow or buffalo in side profile
                </Text>

                <View style={styles.uploadButtonsRow}>
                  <TouchableOpacity
                    style={styles.cameraActionButton}
                    onPress={handleCameraClick}
                    activeOpacity={0.85}
                  >
                    <Camera size={18} color="#ffffff" />
                    <Text style={styles.cameraActionText}>Take Camera Photo</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.fileActionButton}
                    onPress={() => (fileInputRef.current as any)?.click()}
                    activeOpacity={0.85}
                  >
                    <Upload size={18} color={colors.primary} />
                    <Text style={styles.fileActionText}>Upload File</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Quick Demo Sample Picker */}
          <View style={styles.sampleSection}>
            <View style={styles.sampleHeaderRow}>
              <Sparkles size={14} color={colors.accent} />
              <Text style={styles.sampleSectionTitle}>Instant Evaluation Presets</Text>
              {loadingSample && <ActivityIndicator size="small" color={colors.primary} />}
            </View>
            <View style={styles.sampleGrid}>
              {[
                { name: 'Gir', type: 'Cow' },
                { name: 'Murrah', type: 'Buffalo' },
                { name: 'Sahiwal', type: 'Cow' },
                { name: 'Jaffarabadi', type: 'Buffalo' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.name}
                  style={styles.samplePill}
                  onPress={() => loadSample(item.name)}
                  disabled={loadingSample || loading}
                  activeOpacity={0.7}
                >
                  <Text style={styles.samplePillText}>
                    {item.name} ({item.type})
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Right Column: Title, Tag ID, Analyze CTA, and Guidance */}
        <View style={[styles.rightCol, isDesktop && styles.desktopRightCol]}>
          {/* Screen Title */}
          <View style={styles.titleSection}>
            <Text style={styles.screenTitle}>Livestock Breed Scan</Text>
            <Text style={styles.screenSubtitle}>
              Capture side profile photo or choose an existing photo for classification.
            </Text>
          </View>

          {/* Animal Identifier Box */}
          <View style={styles.inputCard}>
            <View style={styles.inputLabelRow}>
              <View style={styles.inputLabelWrap}>
                <Tag size={16} color={colors.primary} />
                <Text style={styles.inputLabel}>Ear Tag / Animal ID</Text>
              </View>
              <TouchableOpacity onPress={generateNewTag} activeOpacity={0.7}>
                <Text style={styles.generateTagText}>Auto-generate</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.textInput}
              value={animalTag}
              onChangeText={setAnimalTag}
              placeholder="e.g. PB-10482"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="characters"
            />
          </View>

          {/* Error Banner */}
          {errorMsg && (
            <View style={styles.errorBanner}>
              <AlertCircle size={18} color={colors.danger} />
              <Text style={styles.errorBannerText}>{errorMsg}</Text>
            </View>
          )}

          {/* Primary Action Button */}
          <TouchableOpacity
            style={[
              styles.analyzeButton,
              (!selectedImage || loading) && styles.analyzeButtonDisabled,
            ]}
            onPress={handleAnalyze}
            disabled={!selectedImage || loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color="#ffffff" />
                <Text style={styles.analyzeButtonText}>Running Vision Model...</Text>
              </View>
            ) : (
              <View style={styles.loadingRow}>
                <Sparkles size={18} color="#ffffff" />
                <Text style={styles.analyzeButtonText}>Analyze Breed (EfficientNet-B0)</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Photographic Guidance Card */}
          <GuidanceCard />
        </View>
      </View>
    </ScrollView>

    {/* Web & Mobile Cross-Platform Camera Viewfinder Modal */}
    <CameraModal
      isOpen={cameraModalOpen}
      onCapture={handleCameraCapture}
      onClose={handleCameraClose}
      onUploadFallback={handleUploadFallback}
    />
  </>
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
    flex: 55,
  },
  rightCol: {
    flex: 1,
  },
  desktopRightCol: {
    flex: 45,
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
  inputCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 16,
    marginBottom: 16,
    boxShadow: '0 2px 8px rgba(45, 139, 117, 0.08)',
  },
  inputLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  generateTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  textInput: {
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  uploadCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.primaryBorder,
    overflow: 'hidden',
    marginBottom: 16,
    boxShadow: '0 2px 8px rgba(45, 139, 117, 0.08)',
  },
  emptyUploadBox: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 18,
  },
  uploadIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  uploadPromptTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  uploadPromptSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 17,
    marginBottom: 18,
  },
  uploadButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    justifyContent: 'center',
  },
  cameraActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 10,
    boxShadow: '0 2px 4px rgba(45, 139, 117, 0.25)',
  },
  cameraActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  fileActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  fileActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  previewContainer: {
    position: 'relative',
    width: '100%',
  },
  previewImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#000000',
  },
  removeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  retakeRow: {
    padding: 12,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  retakeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  sampleSection: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 16,
    marginBottom: 16,
    boxShadow: '0 2px 6px rgba(45, 139, 117, 0.08)',
  },
  sampleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  sampleSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  sampleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  samplePill: {
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  samplePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primaryDark,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.dangerBg,
    borderWidth: 1,
    borderColor: '#fca5a5',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 12,
    color: colors.danger,
    lineHeight: 16,
  },
  analyzeButton: {
    backgroundColor: colors.primary,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    boxShadow: '0 4px 10px rgba(45, 139, 117, 0.3)',
  },
  analyzeButtonDisabled: {
    backgroundColor: '#9ca3af',
    boxShadow: 'none',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  analyzeButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
});
