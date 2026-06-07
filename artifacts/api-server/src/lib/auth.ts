import type { Request, Response, NextFunction } from "express";
import { AppError } from "./error-handler";

export interface AuthenticatedRequest extends Request {
  userId?: string;
  sessionId?: string;
}

export function requireAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): void {
  const userId = req.headers["x-user-id"] as string | undefined;

  if (!userId) {
    throw new AppError(401, "Authentication required");
  }

  req.userId = userId;
  next();
}

export function optionalAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): void {
  const userId = req.headers["x-user-id"] as string | undefined;
  if (userId) {
    req.userId = userId;
  }
  next();
}
