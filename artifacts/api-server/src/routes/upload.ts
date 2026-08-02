import { Router, type IRouter, type Request, type Response } from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import multer from "multer";
import sharp from "sharp";
import crypto from "crypto";
import path from "path";
import fs from "fs/promises";
import { requireAuth, type AuthenticatedRequest } from "../lib/auth";
import { getEnv } from "../lib/env";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const ATTACHMENT_ALLOWED_MIME = /^(image\/|video\/mp4$|application\/pdf$|text\/)/;
const ATTACHMENT_MAX_SIZE = 25 * 1024 * 1024;
const ATTACHMENT_VIDEO_MAX_SIZE = 15 * 1024 * 1024;

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/heic": ".heic",
  "video/mp4": ".mp4",
  "application/pdf": ".pdf",
  "text/plain": ".txt",
  "text/csv": ".csv",
  "text/markdown": ".md",
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    cb(null, ALLOWED_MIME_TYPES.has(file.mimetype));
  },
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => String((req as AuthenticatedRequest).userId ?? req.ip ?? "anonymous"),
  message: { error: "Превышен лимит загрузок. Попробуйте позже." },
});

(router as any).post(
  "/upload/image",
  requireAuth,
  uploadLimiter,
  (req: Request, res: Response, next: Function) => {
    upload.single("image")(req as any, res as any, (err: unknown) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          res.status(400).json({ error: "Файл слишком большой. Максимум 8 MB." });
          return;
        }
        res.status(400).json({ error: "Ошибка загрузки файла." });
        return;
      }
      if (err) {
        next(err);
        return;
      }
      next();
    });
  },
  async (req: Request, res: Response) => {
    try {
      const file = (req as any).file as Express.Multer.File | undefined;
      const type = req.body.type as string | undefined;

      if (!file) {
        res.status(400).json({ error: "Файл не найден. Отправьте изображение в поле 'image'." });
        return;
      }

      if (!file.buffer || file.buffer.length === 0) {
        res.status(400).json({ error: "Пустой файл." });
        return;
      }

      if (type !== "avatar" && type !== "chat_wallpaper") {
        res.status(400).json({ error: "Поле 'type' должно быть 'avatar' или 'chat_wallpaper'." });
        return;
      }

      let fileTypeFromBuffer: (buffer: Uint8Array) => Promise<{ mime: string } | undefined>;
      try {
        fileTypeFromBuffer = (await import("file-type")).fileTypeFromBuffer;
      } catch {
        res.status(500).json({ error: "Ошибка обработки файла." });
        return;
      }

      const detected = await fileTypeFromBuffer(file.buffer);
      if (!detected || !ALLOWED_MIME_TYPES.has(detected.mime)) {
        res.status(400).json({
          error: `Неподдерживаемый тип файла: ${detected?.mime ?? "неизвестный"}. Разрешены только JPEG, PNG, WebP.`,
        });
        return;
      }

      const env = getEnv();
      let sharpInstance = sharp(file.buffer);

      if (type === "avatar") {
        sharpInstance = sharpInstance.resize(512, 512, { fit: "cover" });
      } else {
        sharpInstance = sharpInstance.resize(1080, undefined, { fit: "inside", withoutEnlargement: true });
      }

      const outputBuffer = await sharpInstance.webp({ quality: 80 }).toBuffer();

      const filename = `${crypto.randomUUID()}.webp`;
      const uploadDir = path.join(env.UPLOADS_DIR, type);

      await fs.mkdir(uploadDir, { recursive: true });
      await fs.writeFile(path.join(uploadDir, filename), outputBuffer);

      const userId = (req as AuthenticatedRequest).userId;
      const url = `${env.API_URL}/uploads/${type}/${filename}`;

      logger.info({ userId, type, filename }, "Image uploaded");

      res.json({ url });
    } catch (err) {
      logger.error({ err }, "Upload failed");
      res.status(500).json({ error: "Ошибка при загрузке файла." });
    }
  },
);

const attachmentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: ATTACHMENT_MAX_SIZE },
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (!ATTACHMENT_ALLOWED_MIME.test(file.mimetype)) {
      cb(new Error("Неподдерживаемый тип файла."));
      return;
    }
    if (file.mimetype === "video/mp4") {
      const contentLength = Number(req.headers["content-length"] ?? 0);
      if (contentLength > ATTACHMENT_VIDEO_MAX_SIZE) {
        const err = new Error("Видео слишком большое. Максимум 15 MB.");
        (err as Error & { code?: string }).code = "LIMIT_FILE_SIZE";
        cb(err);
        return;
      }
    }
    cb(null, true);
  },
});

const attachmentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50,
  keyGenerator: (req) =>
    ipKeyGenerator(String((req as AuthenticatedRequest).userId ?? req.ip ?? "anonymous")),
  message: { error: "Превышен лимит загрузок. Попробуйте позже." },
});

(router as any).post(
  "/upload/attachment",
  requireAuth,
  attachmentLimiter,
  (req: Request, res: Response, next: Function) => {
    attachmentUpload.single("attachment")(req as any, res as any, (err: unknown) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          res.status(400).json({
            error: "Файл слишком большой. Максимум 25 MB (видео — 15 MB).",
          });
          return;
        }
        res.status(400).json({ error: "Ошибка загрузки файла." });
        return;
      }
      if (err instanceof Error && (err as Error & { code?: string }).code === "LIMIT_FILE_SIZE") {
        res.status(400).json({ error: err.message });
        return;
      }
      if (err) {
        res.status(400).json({
          error: err instanceof Error ? err.message : "Ошибка загрузки файла.",
        });
        return;
      }
      next();
    });
  },
  async (req: Request, res: Response) => {
    try {
      const file = (req as any).file as Express.Multer.File | undefined;

      if (!file) {
        res.status(400).json({ error: "Файл не найден. Отправьте файл в поле 'attachment'." });
        return;
      }

      if (!file.buffer || file.buffer.length === 0) {
        res.status(400).json({ error: "Пустой файл." });
        return;
      }

      if (file.mimetype === "video/mp4" && file.size > ATTACHMENT_VIDEO_MAX_SIZE) {
        res.status(400).json({ error: "Видео слишком большое. Максимум 15 MB." });
        return;
      }

      let fileTypeFromBuffer: (buffer: Uint8Array) => Promise<{ ext: string; mime: string } | undefined>;
      try {
        fileTypeFromBuffer = (await import("file-type")).fileTypeFromBuffer;
      } catch {
        res.status(500).json({ error: "Ошибка обработки файла." });
        return;
      }

      const detected = await fileTypeFromBuffer(file.buffer);
      const isPlainText = file.mimetype.startsWith("text/") && !detected;
      if (!isPlainText && (!detected || !ATTACHMENT_ALLOWED_MIME.test(detected.mime))) {
        res.status(400).json({
          error: `Неподдерживаемый тип файла: ${detected?.mime ?? "неизвестный"}.`,
        });
        return;
      }

      const env = getEnv();
      const mime = detected?.mime ?? file.mimetype;
      const ext = (MIME_TO_EXT[mime] ?? path.extname(file.originalname)) || `.${detected?.ext ?? "bin"}`;
      const filename = `${crypto.randomUUID()}${ext}`;
      const uploadDir = path.join(env.UPLOADS_DIR, "attachments");

      await fs.mkdir(uploadDir, { recursive: true });
      await fs.writeFile(path.join(uploadDir, filename), file.buffer);

      const userId = (req as AuthenticatedRequest).userId;
      const url = `${env.API_URL}/uploads/attachments/${filename}`;

      logger.info({ userId, filename, size: file.size, mime }, "Attachment uploaded");

      res.json({
        url,
        name: file.originalname || filename,
        type: mime,
        size: file.size,
      });
    } catch (err) {
      logger.error({ err }, "Attachment upload failed");
      res.status(500).json({ error: "Ошибка при загрузке файла." });
    }
  },
);

export default router;