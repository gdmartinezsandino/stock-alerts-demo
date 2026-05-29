import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { registerDeviceSchema } from "../utils/validation";

/* Registers (or re-points) an FCM device token for the current user. Tokens
   are unique; if one already exists we move it to this user (handles the same
   device logging in as a different account). */
export async function registerDevice(req: Request, res: Response) {
  const { token, platform } = registerDeviceSchema.parse(req.body);

  const device = await prisma.deviceToken.upsert({
    where: { token },
    update: { userId: req.user!.id, platform },
    create: { token, platform, userId: req.user!.id },
  });

  return res.status(201).json({ device: { id: device.id, platform: device.platform } });
}

export async function unregisterDevice(req: Request, res: Response) {
  const { token } = req.body as { token?: string };
  if (token) {
    await prisma.deviceToken.deleteMany({ where: { token, userId: req.user!.id } });
  }
  return res.status(204).send();
}
