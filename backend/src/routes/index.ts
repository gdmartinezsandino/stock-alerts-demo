import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import { requireAuth } from "../middleware/auth";
import * as auth from "../controllers/authController";

export const router = Router();

router.get("/health", (_req, res) => res.json({ status: "ok" }));

// --- Auth ---
router.post("/auth/register", asyncHandler(auth.register));
router.post("/auth/login", asyncHandler(auth.login));
router.get("/auth/me", requireAuth, asyncHandler(auth.me));
