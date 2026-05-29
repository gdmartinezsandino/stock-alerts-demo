import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { createAlertSchema } from "../utils/validation";
import { NotFoundError } from "../utils/errors";
import { priceFeed } from "../services/priceFeed";

export async function listAlerts(req: Request, res: Response) {
  const alerts = await prisma.alert.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: "desc" },
  });
  return res.json({ alerts });
}

export async function createAlert(req: Request, res: Response) {
  const input = createAlertSchema.parse(req.body);

  const alert = await prisma.alert.create({
    data: {
      symbol: input.symbol,
      targetPrice: input.targetPrice,
      direction: input.direction,
      userId: req.user!.id,
    },
  });

  // Ensure the alert's symbol is part of the live subscription set.
  priceFeed.trackSymbol(input.symbol);

  return res.status(201).json({ alert });
}

export async function deleteAlert(req: Request, res: Response) {
  const { id } = req.params;
  const result = await prisma.alert.deleteMany({
    where: { id, userId: req.user!.id },
  });
  if (result.count === 0) throw new NotFoundError("Alert not found");
  return res.status(204).send();
}

// Re-arm a triggered alert so it can fire again.
export async function resetAlert(req: Request, res: Response) {
  const { id } = req.params;
  const result = await prisma.alert.updateMany({
    where: { id, userId: req.user!.id },
    data: { status: "ACTIVE", triggeredAt: null },
  });
  if (result.count === 0) throw new NotFoundError("Alert not found");
  const alert = await prisma.alert.findUnique({ where: { id } });
  return res.json({ alert });
}
