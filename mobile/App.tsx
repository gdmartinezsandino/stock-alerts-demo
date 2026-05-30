import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import messaging from "@react-native-firebase/messaging";
import { AuthProvider } from "./src/context/AuthContext";
import { RootNavigator } from "./src/navigation";

/* Background/quit-state FCM handler. Must be registered at module scope (not
   inside a component) so the headless JS task can run when the app isn't in
   the foreground. The OS renders the notification automatically; we just log. */
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  // eslint-disable-next-line no-console
  console.log("[FCM] background message:", remoteMessage.data);
});

export default function App() {
  useEffect(() => {
    // No-op placeholder for future deep-link handling from a tapped push.
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
