# Mobile — Stock Alerts (Expo / React Native)

Expo dev build · React Native 0.76 · TypeScript · React Navigation · Socket.IO
client · React Native Firebase (FCM) · expo-notifications.

> **Why a dev build and not Expo Go?** Firebase Cloud Messaging requires native
> modules (`@react-native-firebase/*`) that aren't in Expo Go. We use Expo's
> *dev client* + config plugins, which keeps the Expo workflow while allowing
> native code.

## Setup

```bash
cd mobile
npm install
```

### 1. Firebase config file

Create a Firebase project, add an **Android app** with package
`co.designli.stockalerts`, enable **Cloud Messaging**, and download
`google-services.json` into this folder:

```
mobile/google-services.json      # gitignored — each dev supplies their own
```

(iOS: add `GoogleService-Info.plist` similarly. Android is enough for this test.)

### 2. Point the app at your backend

Edit [`app.json`](app.json) → `expo.extra`:

```json
"extra": {
  "apiBaseUrl": "http://10.0.2.2:4000",
  "socketUrl":  "http://10.0.2.2:4000"
}
```

- **Android emulator** → `10.0.2.2` (host loopback, the default here)
- **iOS simulator** → `localhost`
- **Physical device** → your machine's LAN IP, e.g. `http://192.168.1.20:4000`

### 3. Run the dev build

```bash
npx expo run:android      # compiles native, installs dev client, starts Metro
# subsequent runs:
npx expo start --dev-client
```

## App structure

```
App.tsx                       providers + background FCM handler
src/
├── navigation/index.tsx      auth stack vs. app tabs (Stocks / Charts / Alerts)
├── context/AuthContext.tsx   login/register/logout, token persistence, push reg
├── api/client.ts             axios client + typed endpoints + token storage
├── services/
│   ├── socket.ts             Socket.IO client (JWT auth)
│   └── notifications.ts      FCM permission, token, channel, foreground display
├── hooks/useLivePrices.ts    symbol → live price map from the socket
├── components/               Button/Field/Card + SVG LineChart
├── screens/
│   ├── LoginScreen / RegisterScreen
│   ├── StocksScreen          live list of stocks (req #3)
│   ├── ChartsScreen          chart of all stocks (req #4)
│   ├── StockDetailScreen     single-stock chart + "create alert"
│   ├── AlertsScreen          list / delete / re-arm alerts
│   └── CreateAlertScreen     the alert form (req #2)
└── theme.ts                  colors / spacing / radius
```

## Feature → screen map

| Requirement | Screen |
|-------------|--------|
| Log in | `LoginScreen` (+ `RegisterScreen`) |
| Create price alert (form) | `CreateAlertScreen` |
| List of stocks (live) | `StocksScreen` |
| Graphic of all stocks | `ChartsScreen` + `StockDetailScreen` |
| FCM notification | `services/notifications.ts` (device registration + display) |

## Push notifications

On login the app:
1. creates the Android `price-alerts` notification channel (matches the backend
   `channelId`),
2. requests notification permission,
3. fetches the FCM device token and registers it via `POST /api/devices`.

When the backend fires an alert, the OS shows the notification in the
background/quit state; in the foreground `expo-notifications` renders it.

## Android build (APK)

For the deliverable, produce a shareable APK with **EAS Build** (cloud, no local
Android SDK needed):

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build -p android --profile preview   # outputs a downloadable .apk URL
```

Or build locally after `expo prebuild`:

```bash
npx expo prebuild -p android
cd android && ./gradlew assembleRelease
# APK at android/app/build/outputs/apk/release/app-release.apk
```

Upload the resulting APK to WeTransfer and share the link with the repo.

## Troubleshooting

- **Network request failed** → `apiBaseUrl` host is wrong for your target
  (emulator vs device). See step 2.
- **No push received** → confirm `google-services.json` is present, the device
  granted notification permission, and the backend has
  `FIREBASE_CREDENTIALS_PATH` set (otherwise it's dry-run).
- **Socket not updating** → the backend must be reachable at `socketUrl`; check
  `GET /api/health` from the device's browser.
