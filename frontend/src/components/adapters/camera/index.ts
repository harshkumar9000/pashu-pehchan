import { Platform } from 'react-native';
import { CameraCapture as WebCamera, CameraModal as WebCameraModal } from './Camera.web';
import { CameraCapture as NativeCamera, CameraModal as NativeCameraModal } from './Camera.native';

export type { CameraCaptureProps, CameraModalProps } from './Camera.web';

export const CameraCapture = Platform.OS === 'web' ? WebCamera : NativeCamera;
export const CameraModal = Platform.OS === 'web' ? WebCameraModal : NativeCameraModal;

export default CameraModal;
