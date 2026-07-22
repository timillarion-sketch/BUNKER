import type { Request, Response, NextFunction } from "express";
import { logger } from "./logger";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    logger.warn({ err, statusCode: err.statusCode }, "application error");
    res.status(err.statusCode).json({
      error: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
    return;
  }

  logger.error({ err }, "unhandled error");
  res.status(500).json({ error: "Внутренняя ошибка сервера" });
}
