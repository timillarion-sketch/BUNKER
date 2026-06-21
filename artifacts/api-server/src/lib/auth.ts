import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "./error-handler";
import { getEnv } from "./env";

export interface AuthenticatedRequest extends Request {
  userId?: number;
  sessionId?: string;
}

interface JwtPayload {
  sub: number;
  sessionId: string;
}

export function requireAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): void {
  const env = getEnv();
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice(7);
  }

  if (!token) {
    throw new AppError(401, "Authentication required");
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.userId = payload.sub;
    req.sessionId = payload.sessionId;
    next();
  } catch {
    throw new AppError(401, "Invalid or expired token");
  }
}

export function optionalAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): void {
  const env = getEnv();
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice(7);
  }

  if (token) {
    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
      req.userId = payload.sub;
      req.sessionId = payload.sessionId;
    } catch {
      // Invalid token for optional auth — proceed without auth
    }
  }

  next();
}

export function signToken(userId: number, sessionId: string): { accessToken: string; refreshToken: string } {
  const env = getEnv();
  const accessToken = jwt.sign(
    { sub: userId, sessionId },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN },
  );
  const refreshToken = jwt.sign(
    { sub: userId, sessionId, type: "refresh" },
    env.JWT_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN },
  );
  return { accessToken, refreshToken };
}

export function verifyRefreshToken(token: string): JwtPayload {
  const env = getEnv();
  const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload & { type?: string };
  if (payload.type !== "refresh") {
    throw new AppError(401, "Invalid refresh token");
  }
  return { sub: payload.sub, sessionId: payload.sessionId };
}
