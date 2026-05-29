import fs from "fs";
import admin from "firebase-admin";
import { env } from "../config/env";
import { createLogger } from "../utils/logger";

const log = createLogger("fcm");

let initialized = false;

/* Initialises firebase-admin from a service-account JSON file.
   If no credentials are configured the service runs in "dry" mode: pushes are
   logged but not sent, so the rest of the app still works for reviewers who
   haven't set up a Firebase project. */
export function initFcm() {
  if (initialized) return;
  if (!env.firebaseCredentialsPath || !fs.existsSync(env.firebaseCredentialsPath)) {
    log.warn(
      "No Firebase credentials found (FIREBASE_CREDENTIALS_PATH); FCM running in dry-run mode."
    );
    return;
  }
  const serviceAccount = JSON.parse(
    fs.readFileSync(env.firebaseCredentialsPath, "utf-8")
  );
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  initialized = true;
  log.info("Firebase Admin initialised; FCM push enabled.");
}

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

/* Sends a push to a set of device tokens. Returns the tokens that are no
   longer valid so the caller can prune them from the DB. */
export async function sendPush(
  tokens: string[],
  payload: PushPayload
): Promise<{ invalidTokens: string[] }> {
  if (tokens.length === 0) return { invalidTokens: [] };

  if (!initialized) {
    log.info("[dry-run] push", { tokens: tokens.length, ...payload });
    return { invalidTokens: [] };
  }

  const message: admin.messaging.MulticastMessage = {
    tokens,
    notification: { title: payload.title, body: payload.body },
    data: payload.data ?? {},
    android: { priority: "high", notification: { channelId: "price-alerts" } },
  };

  const res = await admin.messaging().sendEachForMulticast(message);
  const invalidTokens: string[] = [];
  res.responses.forEach((r, i) => {
    if (!r.success) {
      const code = r.error?.code ?? "";
      if (
        code === "messaging/registration-token-not-registered" ||
        code === "messaging/invalid-registration-token"
      ) {
        invalidTokens.push(tokens[i]);
      } else {
        log.warn("Push failed", { token: tokens[i], code });
      }
    }
  });
  log.info("Push sent", { ok: res.successCount, failed: res.failureCount });
  return { invalidTokens };
}
