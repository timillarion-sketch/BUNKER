import { Router, type IRouter, type Request, type Response } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getEnv } from "../lib/env";
import { verifyTelegramAuth, type TelegramAuthData } from "../lib/telegram-auth";
import { issueTokensJson, oauthFindOrCreateUser } from "./auth-utils";

const router: IRouter = Router();

// GET /auth/telegram/login — HTML страница с Telegram Login Widget
router.get("/auth/telegram/login", (req: Request, res: Response) => {
  const env = getEnv();
  const botUsername = env.TELEGRAM_BOT_USERNAME;
  const redirectUri = encodeURIComponent(
    (req.query.redirect_uri as string) || `${env.API_URL}/auth/telegram/callback`,
  );

  const html = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Вход через Telegram</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #050508;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      min-height: 100vh; padding: 24px;
    }
    .card {
      background: rgba(25,25,27,0.95);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 24px; padding: 40px 32px;
      text-align: center; max-width: 360px; width: 100%;
    }
    h1 { color: #e0e0ff; font-size: 22px; font-weight: 600; letter-spacing: 0.5px; margin-bottom: 8px; }
    p { color: #606080; font-size: 13px; margin-bottom: 28px; line-height: 1.5; }
    #tg-widget { display: flex; justify-content: center; }
    .footer { margin-top: 24px; color: #404060; font-size: 11px; font-family: monospace; letter-spacing: 1px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>БУНКЕР</h1>
    <p>Авторизация через Telegram</p>
    <div id="tg-widget">
      <script async src="https://telegram.org/js/telegram-widget.js?22"
        data-telegram-login="${botUsername}"
        data-size="large"
        data-radius="16"
        data-request-access="write"
        data-redirect-url="${env.API_URL}/auth/telegram/callback?redirect_uri=${redirectUri}">
      </script>
    </div>
    <div class="footer">// защищённый вход</div>
  </div>
</body>
</html>`;

  res.type("html").send(html);
});

// GET /auth/telegram/callback — редирект от Telegram после авторизации
router.get("/auth/telegram/callback", async (req: Request, res: Response) => {
  try {
    const authData: TelegramAuthData = {
      id: Number(req.query.id) || 0,
      first_name: (req.query.first_name as string) || undefined,
      last_name: (req.query.last_name as string) || undefined,
      username: (req.query.username as string) || undefined,
      photo_url: (req.query.photo_url as string) || undefined,
      auth_date: Number(req.query.auth_date) || 0,
      hash: (req.query.hash as string) || "",
    };

    const redirectUri = (req.query.redirect_uri as string) || undefined;

    if (!authData.id || !authData.hash) {
      return renderError(res, "Неверные данные авторизации");
    }

    if (!verifyTelegramAuth(authData)) {
      return renderError(res, "Подпись не прошла проверку");
    }

    const displayName = [authData.first_name, authData.last_name]
      .filter(Boolean)
      .join(" ") || `tg_${authData.id}`;

    const safeUsername = authData.username
      ? authData.username.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 32)
      : `tg_${authData.id}`;

    let user = await db
      .select({ id: usersTable.id, telegramId: usersTable.telegramId })
      .from(usersTable)
      .where(eq(usersTable.telegramId, authData.id))
      .limit(1)
      .then((rows) => rows[0] || null);

    if (!user) {
      const created = await oauthFindOrCreateUser(
        "telegram",
        String(authData.id),
        safeUsername,
        displayName,
      );

      await db
        .update(usersTable)
        .set({ telegramId: authData.id })
        .where(eq(usersTable.id, created.id));

      user = created;
    }

    const { accessToken, refreshToken } = await issueTokensJson(user.id);
    return redirectSuccess(res, accessToken, refreshToken, redirectUri);
  } catch (err) {
    console.error("[telegram-callback] error:", err);
    return renderError(res, "Внутренняя ошибка сервера");
  }
});

// POST /api/auth/telegram — прямой JSON-вход (для fallback)
router.post("/api/auth/telegram", async (req: Request, res: Response) => {
  try {
    const body = req.body as TelegramAuthData;

    if (!body.id || !body.hash) {
      return res.status(400).json({ error: "id and hash are required" });
    }

    if (!verifyTelegramAuth(body)) {
      return res.status(403).json({ error: "Invalid signature" });
    }

    const displayName = [body.first_name, body.last_name]
      .filter(Boolean)
      .join(" ") || `tg_${body.id}`;

    const safeUsername = body.username
      ? body.username.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 32)
      : `tg_${body.id}`;

    let user = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.telegramId, body.id))
      .limit(1)
      .then((rows) => rows[0] || null);

    if (!user) {
      const created = await oauthFindOrCreateUser(
        "telegram",
        String(body.id),
        safeUsername,
        displayName,
      );

      await db
        .update(usersTable)
        .set({ telegramId: body.id })
        .where(eq(usersTable.id, created.id));

      user = created;
    }

    const tokens = await issueTokensJson(user.id);
    return res.json(tokens);
  } catch (err) {
    console.error("[telegram-post] error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

function renderError(res: Response, message: string) {
  const html = `<!DOCTYPE html>
<html lang="ru">
<head><meta charset="UTF-8"><title>Ошибка</title>
<style>
  body { font-family: sans-serif; background: #050508; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
  .card { background: rgba(25,25,27,0.95); border: 1px solid rgba(255,255,255,0.08); border-radius: 24px; padding: 32px; text-align: center; }
  h2 { color: #ff6b6b; font-size: 18px; margin-bottom: 8px; }
  p { color: #606080; font-size: 14px; }
</style></head>
<body><div class="card"><h2>Ошибка</h2><p>${message}</p></div></body>
</html>`;
  res.type("html").status(400).send(html);
}

function redirectSuccess(
  res: Response,
  accessToken: string,
  refreshToken: string,
  customRedirectUri?: string,
) {
  const url = customRedirectUri
    ? `${customRedirectUri}?accessToken=${encodeURIComponent(accessToken)}&refreshToken=${encodeURIComponent(refreshToken)}`
    : `bunker://auth/success?accessToken=${encodeURIComponent(accessToken)}&refreshToken=${encodeURIComponent(refreshToken)}`;
  res.redirect(302, url);
}

export default router;
