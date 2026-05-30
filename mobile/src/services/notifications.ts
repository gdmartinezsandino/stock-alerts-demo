import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import messaging from "@react-native-firebase/messaging";
import * as api from "../api/client";

/* Push-notification wiring.

   Responsibilities:
   1. Ask the OS for notification permission.
   2. Create the Android "price-alerts" channel (must match the channelId the
      backend sets on outgoing FCM messages).
   3. Obtain the FCM device token and register it with our backend so the
      alert engine can target this device.
   4. Display foreground messages (FCM only shows them automatically in the
      background) using expo-notifications.
*/

// Show alerts even when the app is foregrounded.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

let foregroundUnsub: (() => void) | null = null;

export async function registerForPushNotifications(): Promise<string | null> {
  // 1. Channel (Android 8+). Safe to call repeatedly.
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("price-alerts", {
      name: "Price Alerts",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#16A34A",
    });
  }

  // 2. Permission.
  const authStatus = await messaging().requestPermission();
  const granted =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;
  if (!granted) return null;

  // 3. Token -> backend.
  const token = await messaging().getToken();
  if (token) {
    await api.registerDevice(token, Platform.OS);
  }

  // Keep the backend in sync if FCM rotates the token.
  messaging().onTokenRefresh((next) => {
    api.registerDevice(next, Platform.OS).catch(() => undefined);
  });

  // 4. Foreground display.
  if (foregroundUnsub) foregroundUnsub();
  foregroundUnsub = messaging().onMessage(async (remoteMessage) => {
    const title = remoteMessage.notification?.title ?? "Price alert";
    const body =
      remoteMessage.notification?.body ??
      `${remoteMessage.data?.symbol ?? ""} hit your target`;
    await Notifications.scheduleNotificationAsync({
      content: { title, body, data: remoteMessage.data ?? {} },
      trigger: null, // immediately
    });
  });

  return token ?? null;
}
