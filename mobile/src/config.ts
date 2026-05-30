import Constants from "expo-constants";

/* App configuration sourced from app.json "extra". Override per-environment
   without touching code.

   Networking notes for local dev:
   - Android emulator: the host machine is reachable at 10.0.2.2 (the default).
   - iOS simulator: use http://localhost:4000.
   - Physical device: use your machine's LAN IP, e.g. http://192.168.1.20:4000.
*/
const extra = (Constants.expoConfig?.extra ?? {}) as {
  apiBaseUrl?: string;
  socketUrl?: string;
};

export const config = {
  apiBaseUrl: extra.apiBaseUrl ?? "http://10.0.2.2:4000",
  socketUrl: extra.socketUrl ?? "http://10.0.2.2:4000",
};
