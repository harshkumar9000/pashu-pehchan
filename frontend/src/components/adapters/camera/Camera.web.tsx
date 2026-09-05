import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import {
  Camera as CameraIcon,
  X,
  RotateCw,
  AlertCircle,
  Upload,
  CheckCircle2,
  VideoOff,
  Sparkles,
} from 'lucide-react';
import { colors } from '../../../theme/colors';

export interface CameraModalProps {
  isOpen: boolean;
  onCapture: (file: File | Blob, previewUrl: string) => void;
  onClose: () => void;
  onUploadFallback?: () => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({
  isOpen,
  onCapture,
  onClose,
  onUploadFallback,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'blocked' | 'unavailable' | 'busy' | 'generic' | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  // Stop all active media tracks cleanly
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn('Error stopping media track:', e);
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Check for multiple video input devices
  const checkCameras = useCallback(async () => {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.enumerateDevices) {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((device) => device.kind === 'videoinput');
        setHasMultipleCameras(videoInputs.length > 1);
      } catch (err) {
        console.warn('Unable to enumerate camera devices:', err);
      }
    }
  }, []);

  // Start webcam stream
  const startCamera = useCallback(async (facing: 'environment' | 'user' = facingMode) => {
    setIsLoading(true);
    setErrorMessage(null);
    setErrorType(null);
    stopStream();

    // Verify browser support and secure context
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setErrorType('unavailable');
      setErrorMessage('Camera capture is unavailable on this device.');
      setIsLoading(false);
      return;
    }

    if (
      typeof window !== 'undefined' &&
      !window.isSecureContext &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1'
    ) {
      setErrorType('unavailable');
      setErrorMessage('Camera capture is unavailable on this device. (Requires HTTPS secure connection)');
      setIsLoading(false);
      return;
    }

    try {
      let stream: MediaStream;
      try {
        // Attempt with ideal resolution and requested facingMode
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: facing,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch (firstErr: any) {
        // Fallback for laptops where facingMode constraints cause OverconstrainedError or NotFoundError
        console.warn('Camera request with facingMode failed, falling back to default video device:', firstErr);
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn('Video auto-play interrupted:', playErr);
        }
      }

      setIsLoading(false);
      checkCameras();
    } catch (err: any) {
      console.error('Camera access error:', err);
      setIsLoading(false);
      stopStream();

      const name = err.name || '';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError' || name === 'SecurityError') {
        setErrorType('blocked');
        setErrorMessage(
          'Camera access was blocked.\nPlease allow camera permission in your browser or upload an image instead.'
        );
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        setErrorType('unavailable');
        setErrorMessage('Camera capture is unavailable on this device.');
      } else if (name === 'NotReadableError' || name === 'TrackStartError') {
        setErrorType('busy');
        setErrorMessage('Camera is currently in use by another application. Please close other camera apps and try again.');
      } else {
        setErrorType('generic');
        setErrorMessage(
          err.message ? `Camera error: ${err.message}` : 'Camera capture is unavailable on this device.'
        );
      }
    }
  }, [facingMode, stopStream, checkCameras]);

  // Handle modal lifecycle
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopStream();
    }

    return () => {
      stopStream();
    };
  }, [isOpen, startCamera, stopStream]);

  // Flip camera between front and back
  const toggleFacingMode = () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
    startCamera(nextFacing);
  };

  // Capture frame from video to canvas
  const handleCapture = () => {
    if (!videoRef.current || isCapturing) return;

    try {
      setIsCapturing(true);
      const video = videoRef.current;
      const width = video.videoWidth || 1280;
      const height = video.videoHeight || 720;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Failed to initialize 2D canvas rendering context.');
      }

      // If user facing, mirror image horizontally so it matches preview
      if (facingMode === 'user') {
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
      }

      ctx.drawImage(video, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            setIsCapturing(false);
            setErrorMessage('Failed to capture frame from camera.');
            return;
          }

          const filename = `cattle_capture_${Date.now()}.jpg`;
          const file = new File([blob], filename, { type: 'image/jpeg' });
          const previewUrl = URL.createObjectURL(blob);

          stopStream();
          setIsCapturing(false);
          onCapture(file, previewUrl);
          onClose();
        },
        'image/jpeg',
        0.92
      );
    } catch (err: any) {
      setIsCapturing(false);
      console.error('Failed to capture camera snapshot:', err);
      setErrorMessage('Failed to capture photo: ' + err.message);
    }
  };

  const handleClose = () => {
    stopStream();
    onClose();
  };

  const handleUploadClick = () => {
    stopStream();
    onClose();
    if (onUploadFallback) {
      onUploadFallback();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.82)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <View style={styles.modalCard}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <View style={styles.headerTitleRow}>
            <View style={styles.cameraIconBadge}>
              <CameraIcon size={18} color="#16a34a" />
            </View>
            <View>
              <Text style={styles.modalTitle}>Livestock Camera Viewfinder</Text>
              <Text style={styles.modalSubtitle}>
                Align cattle or buffalo in full side-profile for optimal breed classification
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={handleClose}
            activeOpacity={0.7}
            accessibilityLabel="Close camera"
          >
            <X size={18} color="#64748b" />
          </TouchableOpacity>
        </View>

        {/* Camera Viewport / Error Box */}
        <View style={styles.viewportContainer}>
          {errorMessage ? (
            <View style={styles.errorContainer}>
              <View style={styles.errorIconWrap}>
                <VideoOff size={32} color={colors.danger} />
              </View>
              <Text style={styles.errorTitle}>Camera Unavailable</Text>
              <Text style={styles.errorMessageText}>{errorMessage}</Text>

              <View style={styles.errorActionsRow}>
                <TouchableOpacity
                  style={styles.errorUploadBtn}
                  onPress={handleUploadClick}
                  activeOpacity={0.85}
                >
                  <Upload size={16} color="#ffffff" />
                  <Text style={styles.errorUploadText}>Upload File Instead</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.errorRetryBtn}
                  onPress={() => startCamera(facingMode)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.errorRetryText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <div style={{ position: 'relative', width: '100%', height: '100%', backgroundColor: '#000000', overflow: 'hidden' }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: isLoading ? 'none' : 'block',
                  transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
                }}
              />

              {/* Loading Indicator */}
              {isLoading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="#22c55e" />
                  <Text style={styles.loadingText}>Accessing Camera...</Text>
                  <Text style={styles.loadingSubtext}>Please allow browser permission if prompted</Text>
                </View>
              )}

              {/* Viewfinder Alignment Overlay */}
              {!isLoading && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    pointerEvents: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: 16,
                  }}
                >
                  {/* Top bar indicators */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        backgroundColor: 'rgba(15, 23, 42, 0.75)',
                        padding: '4px 10px',
                        borderRadius: 20,
                        border: '1px solid rgba(34, 197, 94, 0.4)',
                      }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: '#22c55e',
                          boxShadow: '0 0 8px #22c55e',
                          display: 'inline-block',
                        }}
                      />
                      <span style={{ color: '#ffffff', fontSize: 11, fontWeight: 700, letterSpacing: 0.5 }}>
                        LIVE CAMERA
                      </span>
                    </div>

                    <div
                      style={{
                        backgroundColor: 'rgba(15, 23, 42, 0.75)',
                        padding: '4px 10px',
                        borderRadius: 20,
                        color: 'rgba(255, 255, 255, 0.85)',
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      720p HD
                    </div>
                  </div>

                  {/* Framing Reticle (Target Box) */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '12%',
                      left: '8%',
                      right: '8%',
                      bottom: '12%',
                      border: '2px dashed rgba(34, 197, 94, 0.65)',
                      borderRadius: 16,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.15)',
                    }}
                  >
                    {/* Viewfinder 4 Corners */}
                    <div style={{ position: 'absolute', top: -2, left: -2, width: 24, height: 24, borderTop: '4px solid #22c55e', borderLeft: '4px solid #22c55e', borderTopLeftRadius: 8 }} />
                    <div style={{ position: 'absolute', top: -2, right: -2, width: 24, height: 24, borderTop: '4px solid #22c55e', borderRight: '4px solid #22c55e', borderTopRightRadius: 8 }} />
                    <div style={{ position: 'absolute', bottom: -2, left: -2, width: 24, height: 24, borderBottom: '4px solid #22c55e', borderLeft: '4px solid #22c55e', borderBottomLeftRadius: 8 }} />
                    <div style={{ position: 'absolute', bottom: -2, right: -2, width: 24, height: 24, borderBottom: '4px solid #22c55e', borderRight: '4px solid #22c55e', borderBottomRightRadius: 8 }} />

                    <div
                      style={{
                        backgroundColor: 'rgba(15, 23, 42, 0.65)',
                        padding: '6px 12px',
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                      }}
                    >
                      <Sparkles size={12} color="#4ade80" />
                      <span style={{ color: '#ffffff', fontSize: 11, fontWeight: 600 }}>
                        Position Animal in Center Frame
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </View>

        {/* Footer Actions */}
        <View style={styles.modalFooter}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={handleClose}
            activeOpacity={0.8}
            disabled={isCapturing}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>

          <View style={styles.primaryActionsGroup}>
            {hasMultipleCameras && !errorMessage && (
              <TouchableOpacity
                style={styles.flipCameraBtn}
                onPress={toggleFacingMode}
                activeOpacity={0.8}
                disabled={isLoading || isCapturing}
                accessibilityLabel="Flip camera"
              >
                <RotateCw size={18} color="#334155" />
                <Text style={styles.flipCameraText}>Switch</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.captureBtn,
                (isLoading || !!errorMessage || isCapturing) && styles.captureBtnDisabled,
              ]}
              onPress={handleCapture}
              disabled={isLoading || !!errorMessage || isCapturing}
              activeOpacity={0.85}
            >
              {isCapturing ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <CameraIcon size={18} color="#ffffff" />
              )}
              <Text style={styles.captureBtnText}>
                {isCapturing ? 'Capturing...' : 'Capture Photo'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </div>
  );
};

// Also export CameraCapture for backwards compatibility
export interface CameraCaptureProps {
  onCapture: (file: File | Blob, previewUrl: string) => void;
  onCancel?: () => void;
  disabled?: boolean;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  onCapture,
  onCancel,
  disabled = false,
}) => {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <View style={{ width: '100%' }}>
      <TouchableOpacity
        style={[styles.openTriggerBtn, disabled && { opacity: 0.6 }]}
        onPress={() => setModalOpen(true)}
        disabled={disabled}
        activeOpacity={0.85}
      >
        <CameraIcon size={18} color="#ffffff" />
        <Text style={styles.openTriggerText}>Open Camera</Text>
      </TouchableOpacity>

      <CameraModal
        isOpen={modalOpen}
        onCapture={onCapture}
        onClose={() => {
          setModalOpen(false);
          if (onCancel) onCancel();
        }}
      />
    </View>
  );
};

export default CameraModal;

const styles = StyleSheet.create({
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 680,
    overflow: 'hidden',
    boxShadow: '0 12px 24px rgba(0, 0, 0, 0.25)',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#ffffff',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  cameraIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  modalSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    lineHeight: 15,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  viewportContainer: {
    width: '100%',
    height: 380,
    backgroundColor: '#020617',
    position: 'relative',
    overflow: 'hidden',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#020617',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 14,
  },
  loadingSubtext: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#0f172a',
  },
  errorIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
  },
  errorMessageText: {
    fontSize: 13,
    color: '#cbd5e1',
    textAlign: 'center',
    maxWidth: 420,
    lineHeight: 20,
    marginBottom: 20,
    whiteSpace: 'pre-line' as any,
  },
  errorActionsRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  errorUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#16a34a',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  errorUploadText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  errorRetryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#334155',
  },
  errorRetryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#f8fafc',
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  primaryActionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  flipCameraBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  flipCameraText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  captureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#16a34a',
    paddingVertical: 11,
    paddingHorizontal: 22,
    borderRadius: 10,
    boxShadow: '0 4px 8px rgba(22, 163, 74, 0.25)',
  },
  captureBtnDisabled: {
    backgroundColor: '#94a3b8',
    boxShadow: 'none',
  },
  captureBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  openTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    justifyContent: 'center',
  },
  openTriggerText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
});
