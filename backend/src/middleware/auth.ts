import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../utils/jwt";
import { UnauthorizedError } from "../utils/errors";

// Augments Express's Request with the authenticated user.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { id: string; email: string };
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return next(new UnauthorizedError("Missing or malformed Authorization header"));
  }

  const token = header.slice("Bearer ".length).trim();
  try {
    const payload = verifyToken(token);
    req.user = { id: payload.sub, email: payload.email };
    return next();
  } catch {
    return next(new UnauthorizedError("Invalid or expired token"));
  }
}
