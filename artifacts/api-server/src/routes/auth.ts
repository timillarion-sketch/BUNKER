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

const router: IRouter = Router();

// Brute-force protection for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Try again later." },
});

// POST /api/auth/register
router.post("/auth/register", authLimiter, async (req, res: Response) => {
  const { username, password, displayName } = req.body as {
    username?: string;
    password?: string;
    displayName?: string;
  };

  if (!username || typeof username !== "string" || username.length < 3) {
    res.status(400).json({ error: "Username must be at least 3 characters" });
    return;
  }

  if (!password || typeof password !== "string" || password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }

  try {
    const existing = await db
      .select()
      .from(usersTable)
      .where(ilike(usersTable.username, username))
      .limit(1);

    if (existing.length > 0) {
      res.status(409).json({ error: "Username already taken" });
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
        publicKey: user.publicKey,
        vpnClientKey: user.vpnClientKey,
        meshEnabled: user.meshEnabled,
      },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    logger.error(err, "Registration failed");
    res.status(500).json({ error: "Registration failed" });
  }
});

// POST /api/auth/login
router.post("/auth/login", authLimiter, async (req, res: Response) => {
  const { username, password } = req.body as {
    username?: string;
    password?: string;
  };

  if (!username || !password) {
    res.status(400).json({ error: "Username and password are required" });
    return;
  }

  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(ilike(usersTable.username, username))
      .limit(1);

    if (!user || !user.passwordHash) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

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
        publicKey: user.publicKey,
        vpnClientKey: user.vpnClientKey,
        meshEnabled: user.meshEnabled,
      },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    logger.error({ err }, "Login failed");
    res.status(500).json({ error: "Internal error" });
  }
});

// POST /api/auth/refresh
router.post("/auth/refresh", async (req, res: Response) => {
  const { refreshToken: token } = req.body as { refreshToken?: string };

  if (!token) {
    res.status(400).json({ error: "Refresh token is required" });
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
      res.status(401).json({ error: "Invalid session" });
      return;
    }

    if (new Date() > existing.refreshExpiresAt) {
      await db.delete(sessionsTable).where(eq(sessionsTable.id, existing.id));
      res.status(401).json({ error: "Session expired" });
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
    res.status(401).json({ error: "Invalid refresh token" });
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
    res.status(500).json({ error: "Logout failed" });
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
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      publicKey: user.publicKey,
      vpnClientKey: user.vpnClientKey,
      meshEnabled: user.meshEnabled,
    });
  } catch (err) {
    logger.error(err, "Failed to fetch user");
    res.status(500).json({ error: "Failed to fetch user" });
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
      res.status(400).json({ error: "No fields to update" });
      return;
    }

    await db
      .update(usersTable)
      .set(updates)
      .where(eq(usersTable.id, req.userId!));

    res.json({ success: true });
  } catch (err) {
    logger.error(err, "Failed to update settings");
    res.status(500).json({ error: "Failed to update settings" });
  }
});

// PUT /api/auth/public-key
router.put("/auth/public-key", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { publicKey } = req.body as { publicKey?: string };

  if (!publicKey || typeof publicKey !== "string") {
    res.status(400).json({ error: "publicKey is required" });
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
    res.status(500).json({ error: "Failed to save public key" });
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
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({ publicKey: user.publicKey });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch public key" });
  }
});

async function oauthFindOrCreateUser(provider: string, providerId: string, username: string, displayName: string | null): Promise<{ id: number }> {
  const [existing] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(
      and(
        eq(usersTable.authProvider, provider),
        eq(usersTable.authProviderId, providerId),
      ),
    )
    .limit(1);

  if (existing) return existing;

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

  return user;
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
    res.status(400).json({ error: vkError || "Missing code" });
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
    res.status(400).json({ error: yaError || "Missing code" });
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
    res.status(400).json({ error: "Missing authorization code" });
    return;
  }

  try {
    const env = getEnv();
    if (!env.YANDEX_CLIENT_ID) {
      res.status(503).json({ error: "Yandex OAuth not configured" });
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
      res.status(502).json({ error: "Yandex token exchange failed" });
      return;
    }

    const userResp = await fetch("https://login.yandex.ru/info?format=json", {
      headers: { Authorization: `OAuth ${tokenData.access_token}` },
    });
    const userData = await userResp.json() as { id?: string; login?: string; display_name?: string; default_email?: string };
    if (!userData.id) {
      res.status(502).json({ error: "Failed to fetch Yandex profile" });
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
    res.status(500).json({ error: "Yandex authentication failed" });
  }
});

// ── Generic fallback ─────────────────────────────────────────────
router.get("/auth/oauth/:provider", (req, res) => {
  const { provider } = req.params;
  const supportedProviders = ["google", "telegram", "vk", "yandex"];
  if (!supportedProviders.includes(provider)) {
    res.status(400).json({ error: "Unsupported provider" });
    return;
  }
  res.json({
    message: `OAuth for ${provider} not yet configured`,
    oauthUrl: null,
    provider,
  });
});

export default router;
