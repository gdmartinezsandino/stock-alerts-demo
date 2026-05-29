import { z } from "zod";

export const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const createAlertSchema = z.object({
  symbol: z.string().min(1).max(12).transform((s) => s.toUpperCase()),
  targetPrice: z.number().positive(),
  direction: z.enum(["ABOVE", "BELOW"]).default("ABOVE"),
});

export const registerDeviceSchema = z.object({
  token: z.string().min(10),
  platform: z.enum(["android", "ios"]).default("android"),
});
