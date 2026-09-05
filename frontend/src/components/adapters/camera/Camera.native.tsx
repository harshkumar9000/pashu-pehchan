import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Camera as CameraIcon, Upload, RotateCcw, Check, Sparkles } from 'lucide-react';
import { colors } from '../../../theme/colors';

export interface CameraCaptureProps {
  onCapture: (file: any, previewUrl: string) => void;
  onCancel?: () => void;
  disabled?: boolean;
}

export interface CameraModalProps {
  isOpen: boolean;
  onCapture: (file: any, previewUrl: string) => void;
  onClose: () => void;
  onUploadFallback?: () => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({
  isOpen,
  onCapture,
  onClose,
}) => {
  const handleLaunchCamera = async () => {
    try {
      let ImagePicker: any = null;
      try {
        ImagePicker = require('expo-image-picker');
      } catch (e) {
        console.warn('expo-image-picker not installed or available');
      }

      if (ImagePicker) {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          alert('Camera permission is required!');
          onClose();
          return;
        }

        const result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.85,
        });

        if (!result.canceled && result.assets && result.assets[0]) {
          const uri = result.assets[0].uri;
          const fileData = {
            uri,
            type: 'image/jpeg',
            name: `cattle_capture_${Date.now()}.jpg`,
          };
          onCapture(fileData, uri);
        }
      }
    } catch (err) {
      console.error('Failed to take native photo:', err);
    } finally {
      onClose();
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      handleLaunchCamera();
    }
  }, [isOpen]);

  return null;
};

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  onCapture,
  onCancel,
  disabled = false,
}) => {
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  const handlePickImage = async () => {
    try {
      // Dynamic require to prevent breaking web bundle
      let ImagePicker: any = null;
      try {
        ImagePicker = require('expo-image-picker');
      } catch (e) {
        console.warn('expo-image-picker not installed or available');
      }

      if (ImagePicker) {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          alert('Permission to access camera roll is required!');
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets[0]) {
          const uri = result.assets[0].uri;
          setPreviewUri(uri);
        }
      }
    } catch (err) {
      console.error('Failed to pick image:', err);
    }
  };

  const handleTakePhoto = async () => {
    try {
      let ImagePicker: any = null;
      try {
        ImagePicker = require('expo-image-picker');
      } catch (e) {
        console.warn('expo-image-picker not installed or available');
      }

      if (ImagePicker) {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          alert('Camera permission is required!');
          return;
        }

        const result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets[0]) {
          const uri = result.assets[0].uri;
          setPreviewUri(uri);
        }
      }
    } catch (err) {
      console.error('Failed to take photo:', err);
    }
  };

  const handleConfirm = () => {
    if (previewUri) {
      // On React Native, FormData accepts an object with uri, type, and name
      const fileData = {
        uri: previewUri,
        type: 'image/jpeg',
        name: 'livestock_capture.jpg',
      };
      onCapture(fileData, previewUri);
    }
  };

  return (
    <View style={styles.container}>
      {previewUri ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: previewUri }} style={styles.previewImage} resizeMode="cover" />
          <View style={styles.previewActionRow}>
            <TouchableOpacity style={styles.retakeBtn} onPress={() => setPreviewUri(null)} activeOpacity={0.8}>
              <RotateCcw size={16} color={colors.textSecondary} />
              <Text style={styles.retakeText}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmBtn, disabled && styles.btnDisabled]}
              onPress={handleConfirm}
              disabled={disabled}
              activeOpacity={0.8}
            >
              <Check size={18} color="#ffffff" />
              <Text style={styles.confirmText}>Analyze Breed</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.dropZone}>
          <View style={styles.iconCircle}>
            <CameraIcon size={28} color={colors.primary} />
          </View>
          <Text style={styles.dropZoneTitle}>Capture or Select Cattle Photo</Text>
          <Text style={styles.dropZoneSub}>
            Take a side-view photo using device camera or select from gallery
          </Text>

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleTakePhoto} activeOpacity={0.8}>
              <CameraIcon size={16} color="#ffffff" />
              <Text style={styles.btnText}>Open Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={handlePickImage} activeOpacity={0.8}>
              <Upload size={16} color={colors.primary} />
              <Text style={[styles.btnText, { color: colors.primary }]}>Gallery</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.guidanceBox}>
            <Sparkles size={14} color={colors.primary} />
            <Text style={styles.guidanceText}>
              Ensure horns, hump, and dewlap are clearly visible for maximum accuracy.
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  dropZone: {
    width: '100%',
    padding: 24,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  dropZoneTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  dropZoneSub: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
  },
  btnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  guidanceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  guidanceText: {
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 14,
    flex: 1,
  },
  previewContainer: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewImage: {
    width: '100%',
    height: 240,
  },
  previewActionRow: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
  },
  retakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#f8fafc',
  },
  retakeText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  confirmBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  confirmText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
