# PashuPehchan Android Wrapper (`pashupehchan-android`)

A standalone, native Android WebView shell for the deployed **PashuPehchan** AI Livestock Identification and Management platform.

---

## 1. Purpose
This project provides a native Android container (APK/AAB) for the deployed PashuPehchan website. It enables native hardware capabilities that mobile browsers restrict:
- Native Android camera capture and permission handling for the existing AI cattle breed scanner.
- Native image selection from the Android media gallery.
- Hardware Android back button management to navigate within the web application history before exiting.
- Native geolocation permissions for the "Find a Vet" discovery tool.
- Intent dispatch for external links (telephone dialer, email client, Google Maps directions).
- Native offline recovery and network failure detection.

**Zero Duplication**: This project does **not** reimplement or copy any website screens, authentication logic, database models, or PyTorch AI models. The deployed PashuPehchan website is the single source of truth.

---

## 2. Architecture

```
                    User on Android Device
                               │
                               ▼
                   ┌───────────────────────┐
                   │  pashupehchan-android │
                   │  (Native Expo Shell)  │
                   │  - Camera Permissions │
                   │  - Native File Chooser│
                   │  - Hardware Back Nav  │
                   │  - Intent Dispatcher  │
                   │  - Offline Fallback   │
                   └───────────┬───────────┘
                               │ HTTPS WebView
                               ▼
                   ┌───────────────────────┐
                   │ PashuPehchan Web App  │
                   │ (Vercel / Production) │
                   │  - UI & Screen Router │
                   │  - Session & Cookies  │
                   │  - Camera / Upload UI │
                   └───────────┬───────────┘
                               │ HTTPS REST API
                               ▼
                   ┌───────────────────────┐
                   │   FastAPI Backend     │
                   │  - Auth & SQLite DB   │
                   │  - EfficientNet-B0    │
                   │    41-Class AI Model  │
                   └───────────────────────┘
```

---

## 3. Website URL Configuration
The Android app loads the deployed website from a single configuration variable:

```bash
# In .env (or environment variables)
EXPO_PUBLIC_WEB_URL=https://pashu-pehchan1.vercel.app
```

### Supported Environments:
- **Production Web Deployment**: `https://pashu-pehchan.vercel.app`
- **Local Android Emulator Testing**: `http://10.0.2.2:3000` (maps to host machine port 3000)
- **Local Physical Device on Wi-Fi**: `http://<YOUR_LOCAL_IP>:3000`

---

## 4. How WebView Works
The app uses `react-native-webview` with optimized mobile flags:
- **JavaScript & DOM Storage**: `javaScriptEnabled={true}`, `domStorageEnabled={true}` enable modern React execution and persistent local storage.
- **Session Preservation**: `sharedCookiesEnabled={true}` and `thirdPartyCookiesEnabled={true}` maintain user JWT tokens and session cookies across app restarts.
- **Media Playback**: `allowsInlineMediaPlayback={true}` and `mediaPlaybackRequiresUserAction={false}` enable WebRTC camera preview without user gesture locks.
- **Navigation Gestures**: `allowsBackForwardNavigationGestures={true}` provides smooth Android back-swipe behavior.
- **Pull to Refresh**: `pullToRefreshEnabled={true}` allows farmers to refresh market listings and dashboard stats easily.

---

## 5. Camera Permissions & AI Scanner Flow
The website's existing cattle scanner flow functions through standard Android file chooser and camera intents:

1. **User Taps "Take Photo"** in the PashuPehchan scanner.
2. The website activates `<input type="file" accept="image/*" capture="environment">` or WebRTC camera.
3. The Android WebView's native `WebChromeClient` intercepts the file chooser request.
4. Android prompts the user for `android.permission.CAMERA` (only requested on-demand, never on app launch).
5. The native Android Camera app opens in full resolution.
6. The farmer captures the bovine image.
7. The captured photo is passed back to the website's image preview.
8. The existing **Analyze Breed** button submits the image to `/api/predict`.
9. The backend's trained EfficientNet-B0 model outputs the top-3 predictions with confidence scores.

---

## 6. Gallery Upload
When the user chooses "Choose from Gallery" or taps the upload area:
- Android opens the system photo picker (`Intent.ACTION_GET_CONTENT` / modern Photo Picker).
- Requires only `READ_MEDIA_IMAGES` (Android 13+) or `READ_EXTERNAL_STORAGE` (Android 12 and below).
- Broad filesystem permissions are never requested.

---

## 7. Location Permissions
The **Find a Vet** feature on PashuPehchan finds nearby veterinary doctors based on proximity:
- WebView `geolocationEnabled={true}` forwards geolocation calls (`navigator.geolocation.getCurrentPosition`).
- Native permissions `ACCESS_FINE_LOCATION` and `ACCESS_COARSE_LOCATION` are declared in `app.json` and requested only when the user searches for nearby clinics.

---

## 8. Android Back Button Handling
Android's hardware back press is managed via `BackHandler`:
- **Navigation History Traversal**: If `canGoBack` is true in the WebView, `webViewRef.current.goBack()` navigates backward through the website history.
- **Accidental Exit Prevention**: When at the root page, pressing back displays an Android toast:
  > *"Press back again to exit PashuPehchan"*
- Pressing back again within 2 seconds cleanly exits the application.

---

## 9. External Links & Deep Linking
All URL requests pass through `onShouldStartLoadWithRequest`:
- `tel:*`: Dispatches directly to the Android phone dialer.
- `mailto:*`: Dispatches to the default email client.
- `geo:*` or `maps.google.com` or `goo.gl/maps`: Opens Google Maps with coordinates / directions.
- External URLs: Opens in the external Android system browser to preserve the main application's state.

---

## 10. Environment Variables
Create a `.env` file in `pashupehchan-android/`:

```ini
# PashuPehchan Android Configuration
EXPO_PUBLIC_WEB_URL=https://pashu-pehchan1.vercel.app
```

---

## 11. Local Development

### Prerequisites
- Node.js >= 18
- Expo CLI (`npx expo`)

### Running Locally
```bash
cd pashupehchan-android

# Install dependencies
npm install

# Start development server
npx expo start

# Run on connected Android device or emulator
npx expo start --android
```

---

## 12. Android Preview Build (Shareable APK)
To build a standalone installable **APK** for direct testing on Android devices:

```bash
cd pashupehchan-android

# EAS Login (if not already logged in)
npx eas-cli login

# Build APK using the preview profile
npx eas-cli build -p android --profile preview
```

The resulting `.apk` file can be sideloaded directly onto any Android phone.

---

## 13. Production Build (Google Play Store AAB)
To generate an optimized Android App Bundle (**AAB**) for submission to the Google Play Store:

```bash
cd pashupehchan-android

# Build AAB using the production profile
npx eas-cli build -p android --profile production
```

---

## 14. APK Distribution
The compiled APK from the EAS build can be hosted on a public HTTPS URL (such as GitHub Releases, AWS S3, or Cloudflare R2). The "Download Android App" button on the website can point directly to this URL.

---

## 15. Limitations
- Offline mode is limited to displaying the native connection retry screen, as the core application is server-hosted.
- Web push notifications require Firebase Cloud Messaging (FCM) configuration if native push is desired in the future.
