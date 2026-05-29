import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import { requireAuth } from "../middleware/auth";
import * as auth from "../controllers/authController";
import * as alerts from "../controllers/alertsController";
import * as stocks from "../controllers/stocksController";
import * as devices from "../controllers/devicesController";

export const router = Router();

router.get("/health", (_req, res) => res.json({ status: "ok" }));

// --- Auth ---
router.post("/auth/register", asyncHandler(auth.register));
router.post("/auth/login", asyncHandler(auth.login));
router.get("/auth/me", requireAuth, asyncHandler(auth.me));

// --- Stocks (auth-protected so only logged-in users see data) ---
router.get("/stocks", requireAuth, asyncHandler(stocks.listStocks));
router.get("/stocks/:symbol", requireAuth, asyncHandler(stocks.getStock));
router.get("/stocks/:symbol/history", requireAuth, asyncHandler(stocks.getStockHistory));

// --- Alerts ---
router.get("/alerts", requireAuth, asyncHandler(alerts.listAlerts));
router.post("/alerts", requireAuth, asyncHandler(alerts.createAlert));
router.delete("/alerts/:id", requireAuth, asyncHandler(alerts.deleteAlert));
router.post("/alerts/:id/reset", requireAuth, asyncHandler(alerts.resetAlert));

// --- Devices (FCM tokens) ---
router.post("/devices", requireAuth, asyncHandler(devices.registerDevice));
router.delete("/devices", requireAuth, asyncHandler(devices.unregisterDevice));
