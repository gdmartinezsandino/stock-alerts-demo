import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma";
import { signToken } from "../utils/jwt";
import { credentialsSchema } from "../utils/validation";
import { ConflictError, UnauthorizedError } from "../utils/errors";

export async function register(req: Request, res: Response) {
  const { email, password } = credentialsSchema.parse(req.body);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new ConflictError("Email already registered");

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, passwordHash },
    select: { id: true, email: true },
  });

  const token = signToken({ sub: user.id, email: user.email });
  return res.status(201).json({ token, user });
}

export async function login(req: Request, res: Response) {
  const { email, password } = credentialsSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new UnauthorizedError("Invalid email or password");

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new UnauthorizedError("Invalid email or password");

  const token = signToken({ sub: user.id, email: user.email });
  return res.json({ token, user: { id: user.id, email: user.email } });
}

export async function me(req: Request, res: Response) {
  return res.json({ user: req.user });
}
