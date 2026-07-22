import { Router, type IRouter, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db, usersTable, sessionsTable } from "@workspace/db";
import { eq, and, ilike } from "drizzle-orm";
import rateLimit from "express-rate-limit";
import { AppError } from "../lib/error-handler";
import { logger } from "../lib/logger";
import { requireAuth, signToken, verifyRefreshToken, type AuthenticatedRequest } from "../lib/auth";
import { getEnv } from "../lib/env";
import { getCallbackUrl } from "../lib/oauth";

function generateBnkrId(userId: number, attempt = 0): string {
  const seed = attempt === 0 ? String(userId) : `${userId}-${attempt}`;
  const hash = crypto.createHash("md5").update(seed).digest("hex");
  return `BNKR-${hash.slice(0, 4).toUpperCase()}-${hash.slice(4, 8).toUpperCase()}`;
}

async function assignBnkrId(userId: number): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const bunkerId = generateBnkrId(userId, attempt);
    try {
      await db
        .update(usersTable)
        .set({ bunkerId })
        .where(eq(usersTable.id, userId));
      return bunkerId;
    } catch (err: unknown) {
      const pgErr = err as { code?: string };
      if (pgErr?.code === "23505" && attempt < 4) continue;
      throw err;
    }
  }
  throw new Error("Failed to assign unique BNKR ID after 5 attempts");
}

const router: IRouter = Router();

// Brute-force protection for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Слишком много попыток. Попробуйте позже." },
});

// POST /api/auth/register
router.post("/auth/register", authLimiter, async (req, res: Response) => {
  const { username, password, displayName } = req.body as {
    username?: string;
    password?: string;
    displayName?: string;
  };

  if (!username || typeof username !== "string" || username.length < 3) {
    res.status(400).json({ error: "Имя пользователя должно содержать не менее 3 символов" });
    return;
  }

  if (!password || typeof password !== "string" || password.length < 6) {
    res.status(400).json({ error: "Пароль должен содержать не менее 6 символов" });
    return;
  }

  try {
    const existing = await db
      .select()
      .from(usersTable)
      .where(ilike(usersTable.username, username))
      .limit(1);

    if (existing.length > 0) {
      res.status(409).json({ error: "Имя пользователя уже занято" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [user] = await db
      .insert(usersTable)
      .values({
        username,
        displayName: displayName || username,
        passwordHash,
        authProvider: "credentials",
      })
      .returning();

    const bunkerId = await assignBnkrId(user.id);

    const sessionId = crypto.randomUUID();
    const { accessToken, refreshToken } = signToken(user.id, sessionId);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 60 * 60 * 1000); // 1h
    const refreshExpiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7d

    await db.insert(sessionsTable).values({
      userId: user.id,
      token: accessToken,
      refreshToken,
      expiresAt,
      refreshExpiresAt,
    });

    logger.info({ userId: user.id }, "User registered");

    res.status(201).json({
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        bunkerId,
        publicKey: user.publicKey,
        vpnClientKey: user.vpnClientKey,
        meshEnabled: user.meshEnabled,
      },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    logger.error(err, "Registration failed");
    res.status(500).json({ error: "Не удалось зарегистрироваться. Попробуйте ещё раз." });
  }
});

// POST /api/auth/login
router.post("/auth/login", authLimiter, async (req, res: Response) => {
  const { username, password } = req.body as {
    username?: string;
    password?: string;
  };

  if (!username || !password) {
    res.status(400).json({ error: "Имя пользователя и пароль обязательны" });
    return;
  }

  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(ilike(usersTable.username, username))
      .limit(1);

    if (!user || !user.passwordHash) {
      res.status(401).json({ error: "Неправильный логин или пароль" });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Неправильный логин или пароль" });
      return;
    }

    const bunkerId = user.bunkerId ?? await assignBnkrId(user.id);

    const sessionId = crypto.randomUUID();
    const { accessToken, refreshToken } = signToken(user.id, sessionId);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 60 * 60 * 1000);
    const refreshExpiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    await db.insert(sessionsTable).values({
      userId: user.id,
      token: accessToken,
      refreshToken,
      expiresAt,
      refreshExpiresAt,
    });

    logger.info({ userId: user.id }, "User logged in");

    res.json({
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        bunkerId,
        publicKey: user.publicKey,
        vpnClientKey: user.vpnClientKey,
        meshEnabled: user.meshEnabled,
      },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    logger.error({ err }, "Login failed");
    res.status(500).json({ error: "Внутренняя ошибка. Попробуйте ещё раз." });
  }
});

// POST /api/auth/refresh
router.post("/auth/refresh", async (req, res: Response) => {
  const { refreshToken: token } = req.body as { refreshToken?: string };

  if (!token) {
    res.status(400).json({ error: "Требуется токен обновления" });
    return;
  }

  try {
    const payload = verifyRefreshToken(token);

    const [existing] = await db
      .select()
      .from(sessionsTable)
      .where(
        and(
          eq(sessionsTable.refreshToken, token),
          eq(sessionsTable.userId, payload.sub),
        ),
      )
      .limit(1);

    if (!existing) {
      res.status(401).json({ error: "Недействительная сессия" });
      return;
    }

    if (new Date() > existing.refreshExpiresAt) {
      await db.delete(sessionsTable).where(eq(sessionsTable.id, existing.id));
      res.status(401).json({ error: "Сессия истекла" });
      return;
    }

    const { accessToken, refreshToken: newRefresh } = signToken(payload.sub, payload.sessionId);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 60 * 60 * 1000);
    const refreshExpiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    await db
      .update(sessionsTable)
      .set({
        token: accessToken,
        refreshToken: newRefresh,
        expiresAt,
        refreshExpiresAt,
      })
      .where(eq(sessionsTable.id, existing.id));

    res.json({ accessToken, refreshToken: newRefresh });
  } catch (err) {
    if (err instanceof AppError) throw err;
    logger.error(err, "Token refresh failed");
    res.status(401).json({ error: "Недействительный токен обновления" });
  }
});

// POST /api/auth/logout
router.post("/auth/logout", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.sessionId) {
      await db
        .delete(sessionsTable)
        .where(eq(sessionsTable.userId, req.userId!));
    }

    logger.info({ userId: req.userId }, "User logged out");
    res.json({ success: true });
  } catch (err) {
    logger.error(err, "Logout failed");
    res.status(500).json({ error: "Не удалось выйти. Попробуйте ещё раз." });
  }
});

// GET /api/auth/me
router.get("/auth/me", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, req.userId!))
      .limit(1);

    if (!user) {
      res.status(404).json({ error: "Пользователь не найден" });
      return;
    }

    res.json({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      bunkerId: user.bunkerId,
      publicKey: user.publicKey,
      vpnClientKey: user.vpnClientKey,
      meshEnabled: user.meshEnabled,
    });
  } catch (err) {
    logger.error(err, "Failed to fetch user");
    res.status(500).json({ error: "Не удалось загрузить пользователя" });
  }
});

// PUT /api/auth/settings
router.put("/auth/settings", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { vpnClientKey, meshEnabled } = req.body as {
    vpnClientKey?: string | null;
    meshEnabled?: boolean;
  };

  try {
    const updates: Record<string, unknown> = {};
    if (vpnClientKey !== undefined) updates.vpnClientKey = vpnClientKey;
    if (meshEnabled !== undefined) updates.meshEnabled = meshEnabled;

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: "Нет полей для обновления" });
      return;
    }

    await db
      .update(usersTable)
      .set(updates)
      .where(eq(usersTable.id, req.userId!));

    res.json({ success: true });
  } catch (err) {
    logger.error(err, "Failed to update settings");
    res.status(500).json({ error: "Не удалось обновить настройки" });
  }
});

// PUT /api/auth/public-key
router.put("/auth/public-key", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { publicKey } = req.body as { publicKey?: string };

  if (!publicKey || typeof publicKey !== "string") {
    res.status(400).json({ error: "Требуется публичный ключ" });
    return;
  }

  try {
    await db
      .update(usersTable)
      .set({ publicKey })
      .where(eq(usersTable.id, req.userId!));

    res.json({ success: true });
  } catch (err) {
    logger.error(err, "Failed to save public key");
    res.status(500).json({ error: "Не удалось сохранить публичный ключ" });
  }
});

// GET /api/auth/public-key/:userId
router.get("/auth/public-key/:userId", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const [user] = await db
      .select({ publicKey: usersTable.publicKey })
      .from(usersTable)
      .where(eq(usersTable.id, Number(req.params.userId)))
      .limit(1);

    if (!user) {
      res.status(404).json({ error: "Пользователь не найден" });
      return;
    }

    res.json({ publicKey: user.publicKey });
  } catch (err) {
    res.status(500).json({ error: "Не удалось загрузить публичный ключ" });
  }
});

async function oauthFindOrCreateUser(provider: string, providerId: string, username: string, displayName: string | null): Promise<{ id: number; bunkerId?: string }> {
  const [existing] = await db
    .select({ id: usersTable.id, bunkerId: usersTable.bunkerId })
    .from(usersTable)
    .where(
      and(
        eq(usersTable.authProvider, provider),
        eq(usersTable.authProviderId, providerId),
      ),
    )
    .limit(1);

  if (existing) {
    if (!existing.bunkerId) {
      existing.bunkerId = (await assignBnkrId(existing.id)) ?? null;
    }
    return { id: existing.id, bunkerId: existing.bunkerId ?? undefined };
  }

  const safeUsername = username.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 32);
  const [user] = await db
    .insert(usersTable)
    .values({
      username: safeUsername,
      displayName: displayName || safeUsername,
      authProvider: provider,
      authProviderId: providerId,
    })
    .returning({ id: usersTable.id });

  const bunkerId = await assignBnkrId(user.id);

  return { id: user.id, bunkerId };
}

async function issueTokens(userId: number, req: Request, res: Response) {
  const sessionId = crypto.randomUUID();
  const { accessToken, refreshToken } = signToken(userId, sessionId);

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 60 * 60 * 1000);
  const refreshExpiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  await db.insert(sessionsTable).values({
    userId,
    token: accessToken,
    refreshToken,
    expiresAt,
    refreshExpiresAt,
  });

  const env = getEnv();
  const isMobile = req.query.platform === "mobile";
  if (isMobile) {
    res.redirect(302, `bunker://auth/success?token=${encodeURIComponent(accessToken)}`);
  } else {
    res.redirect(302, `${env.FRONTEND_URL}/auth/callback?token=${encodeURIComponent(accessToken)}`);
  }
}

// ── VK OAuth ──────────────────────────────────────────────────────
router.get("/auth/vk", (req, res) => {
  const env = getEnv();
  if (!env.VK_CLIENT_ID) {
    res.redirect(302, `${env.FRONTEND_URL}/?error=vk_not_configured`);
    return;
  }
  const params = new URLSearchParams({
    client_id: env.VK_CLIENT_ID,
    redirect_uri: getCallbackUrl("vk"),
    response_type: "code",
    v: "5.131",
    scope: "email",
    display: "page",
  });
  res.redirect(302, `https://oauth.vk.com/authorize?${params}`);
});

router.get("/auth/vk/callback", async (req, res) => {
  const { code, error: vkError } = req.query as { code?: string; error?: string };
  if (vkError || !code) {
    res.status(400).json({ error: vkError || "Отсутствует код авторизации" });
    return;
  }

  try {
    const env = getEnv();
    const tokenResp = await fetch("https://oauth.vk.com/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: env.VK_CLIENT_ID,
        client_secret: env.VK_CLIENT_SECRET,
        redirect_uri: getCallbackUrl("vk"),
        code,
      }),
    });

    const tokenData = await tokenResp.json() as { access_token?: string; user_id?: number; email?: string; error?: string };
    if (!tokenData.access_token || !tokenData.user_id) {
      logger.error(tokenData, "VK token exchange failed");
      res.redirect(302, `${env.FRONTEND_URL}/?error=vk_token_exchange_failed`);
      return;
    }

    const userId = String(tokenData.user_id);
    const displayName = tokenData.email || `vk_${userId}`;

    const user = await oauthFindOrCreateUser("vk", userId, `vk_${userId}`, displayName);
    await issueTokens(user.id, req, res);
  } catch (err) {
    logger.error(err, "VK callback failed");
    res.redirect(302, `${getEnv().FRONTEND_URL}/?error=vk_callback_failed`);
  }
});

// ── Yandex OAuth ──────────────────────────────────────────────────
router.get("/auth/yandex", (req, res) => {
  const env = getEnv();
  if (!env.YANDEX_CLIENT_ID) {
    res.redirect(302, `${env.FRONTEND_URL}/?error=yandex_not_configured`);
    return;
  }
  const params = new URLSearchParams({
    client_id: env.YANDEX_CLIENT_ID,
    redirect_uri: getCallbackUrl("yandex"),
    response_type: "code",
  });
  res.redirect(302, `https://oauth.yandex.ru/authorize?${params}`);
});

router.get("/auth/yandex/callback", async (req, res) => {
  const { code, error: yaError } = req.query as { code?: string; error?: string };
  if (yaError || !code) {
    res.status(400).json({ error: yaError || "Отсутствует код авторизации" });
    return;
  }

  try {
    const env = getEnv();
    const tokenResp = await fetch("https://oauth.yandex.ru/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: env.YANDEX_CLIENT_ID,
        client_secret: env.YANDEX_CLIENT_SECRET,
        redirect_uri: getCallbackUrl("yandex"),
        code,
      }),
    });

    const tokenData = await tokenResp.json() as { access_token?: string; error?: string };
    if (!tokenData.access_token) {
      logger.error(tokenData, "Yandex token exchange failed");
      res.redirect(302, `${env.FRONTEND_URL}/?error=yandex_token_exchange_failed`);
      return;
    }

    const userResp = await fetch("https://login.yandex.ru/info?format=json", {
      headers: { Authorization: `OAuth ${tokenData.access_token}` },
    });
    const userData = await userResp.json() as { id?: string; login?: string; display_name?: string; default_email?: string };
    if (!userData.id) {
      res.redirect(302, `${env.FRONTEND_URL}/?error=yandex_userinfo_failed`);
      return;
    }

    const providerId = String(userData.id);
    const displayName = userData.display_name || userData.login || userData.default_email || `ya_${providerId}`;

    const user = await oauthFindOrCreateUser("yandex", providerId, `ya_${providerId}`, displayName);
    await issueTokens(user.id, req, res);
  } catch (err) {
    logger.error(err, "Yandex callback failed");
    res.redirect(302, `${getEnv().FRONTEND_URL}/?error=yandex_callback_failed`);
  }
});

// POST /api/auth/yandex/callback - mobile Yandex OAuth (code from expo-web-browser)
router.post("/auth/yandex/callback", async (req, res: Response) => {
  const { code, redirect_uri } = req.body as { code?: string; redirect_uri?: string };

  if (!code) {
    res.status(400).json({ error: "Отсутствует код авторизации" });
    return;
  }

  try {
    const env = getEnv();
    if (!env.YANDEX_CLIENT_ID) {
      res.status(503).json({ error: "Яндекс OAuth не настроен" });
      return;
    }

    const tokenResp = await fetch("https://oauth.yandex.ru/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: env.YANDEX_CLIENT_ID,
        client_secret: env.YANDEX_CLIENT_SECRET,
        code,
        redirect_uri: redirect_uri || getCallbackUrl("yandex"),
      }),
    });

    const tokenData = await tokenResp.json() as { access_token?: string; error?: string };
    if (!tokenData.access_token) {
      logger.error(tokenData, "Yandex token exchange failed");
      res.status(502).json({ error: "Не удалось получить токен Яндекса" });
      return;
    }

    const userResp = await fetch("https://login.yandex.ru/info?format=json", {
      headers: { Authorization: `OAuth ${tokenData.access_token}` },
    });
    const userData = await userResp.json() as { id?: string; login?: string; display_name?: string; default_email?: string };
    if (!userData.id) {
      res.status(502).json({ error: "Не удалось загрузить профиль Яндекса" });
      return;
    }

    const providerId = String(userData.id);
    const email = userData.default_email || "";
    const displayName = userData.display_name || userData.login || email || `ya_${providerId}`;

    let username = email ? email.split("@")[0] : userData.login || `yandex_${providerId}`;
    username = username.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 32);

    const user = await oauthFindOrCreateUser("yandex", providerId, username, displayName);

    const sessionId = crypto.randomUUID();
    const { accessToken, refreshToken } = signToken(user.id, sessionId);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 60 * 60 * 1000);
    const refreshExpiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    await db.insert(sessionsTable).values({
      userId: user.id,
      token: accessToken,
      refreshToken,
      expiresAt,
      refreshExpiresAt,
    });

    const [fullUser] = await db
      .select({
        id: usersTable.id,
        username: usersTable.username,
        displayName: usersTable.displayName,
        avatarUrl: usersTable.avatarUrl,
        bunkerId: usersTable.bunkerId,
        publicKey: usersTable.publicKey,
        vpnClientKey: usersTable.vpnClientKey,
        meshEnabled: usersTable.meshEnabled,
      })
      .from(usersTable)
      .where(eq(usersTable.id, user.id))
      .limit(1);

    res.json({
      user: fullUser,
      accessToken,
      refreshToken,
    });
  } catch (err) {
    logger.error(err, "Yandex mobile callback failed");
    res.status(500).json({ error: "Ошибка авторизации через Яндекс" });
  }
});

// ── Generic fallback ─────────────────────────────────────────────
router.get("/auth/oauth/:provider", (req, res) => {
  const { provider } = req.params;
  const supportedProviders = ["google", "telegram", "vk", "yandex"];
  if (!supportedProviders.includes(provider)) {
    res.status(400).json({ error: "Неподдерживаемый провайдер" });
    return;
  }
  res.json({
    message: `OAuth for ${provider} not yet configured`,
    oauthUrl: null,
    provider,
  });
});

export default router;
