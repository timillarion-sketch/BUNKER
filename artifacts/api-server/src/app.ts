import crypto from "crypto";
import express, { type Express } from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import router from "./routes";
import { errorHandler } from "./lib/error-handler";
import { logger } from "./lib/logger";
import { getEnv } from "./lib/env";
import { securityMiddleware } from "./middleware/security";

const app: Express = express();
const env = getEnv();

// Security headers — must be first middleware
securityMiddleware.forEach(mw => app.use(mw));

// Add request ID for correlation
app.use((req: Request, _res, next) => {
  req.id = crypto.randomUUID();
  next();
});

// CORS whitelist — only known origins, no wildcard subdomain matching
const allowedOrigins = env.NODE_ENV === "production"
  ? [/^https:\/\/bunker\.app$/, /^https:\/\/.+\.bunker\.app$/, /^https:\/\/176\.12\.72\.246(?::\d+)?$/]
  : ["*"];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 60_000,
  max: env.NODE_ENV === "production" ? 100 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Слишком много запросов. Попробуйте позже." },
});
app.use(limiter);

// Body parsing with size limits
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));

// Logging
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

// Routes
app.use("/api", router);

// Central error handler (must be last)
app.use(errorHandler);

export default app;
