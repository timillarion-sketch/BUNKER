import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { pool } from "@workspace/db";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.get("/healthz", async (_req, res) => {
  let dbStatus: "ok" | "error" = "ok";
  try {
    await pool.query("SELECT 1");
  } catch (err) {
    logger.error({ err }, "Health check — DB unreachable");
    dbStatus = "error";
  }

  const httpStatus = dbStatus === "ok" ? 200 : 503;
  const data = HealthCheckResponse.parse({
    status: dbStatus === "ok" ? "ok" : "degraded",
    db: dbStatus,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
  res.status(httpStatus).json(data);
});

export default router;
