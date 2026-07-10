import { getEnv } from "./env";
import { logger } from "./logger";

const TG_API = "https://api.telegram.org/bot";

function apiUrl(method: string): string {
  return `${TG_API}${getEnv().TELEGRAM_BOT_TOKEN}/${method}`;
}

export interface TgSendMessageOptions {
  parse_mode?: "HTML" | "Markdown";
  reply_markup?: Record<string, unknown>;
}

export async function sendMessage(
  chatId: number,
  text: string,
  options: TgSendMessageOptions = {},
): Promise<void> {
  const body: Record<string, unknown> = {
    chat_id: chatId,
    text,
    parse_mode: options.parse_mode ?? "HTML",
  };
  if (options.reply_markup) {
    body.reply_markup = options.reply_markup;
  }

  const res = await fetch(apiUrl("sendMessage"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    logger.error({ chatId, err }, "Telegram sendMessage failed");
  }
}

export async function answerCallbackQuery(
  callbackQueryId: string,
  text?: string,
  showAlert = false,
): Promise<void> {
  const body: Record<string, unknown> = {
    callback_query_id: callbackQueryId,
    show_alert: showAlert,
  };
  if (text) body.text = text;

  const res = await fetch(apiUrl("answerCallbackQuery"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    logger.error({ callbackQueryId, err }, "Telegram answerCallbackQuery failed");
  }
}

export async function editMessageText(
  chatId: number,
  messageId: number,
  text: string,
  replyMarkup?: Record<string, unknown>,
): Promise<void> {
  const body: Record<string, unknown> = {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: "HTML",
  };
  if (replyMarkup) body.reply_markup = replyMarkup;

  const res = await fetch(apiUrl("editMessageText"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    logger.error({ chatId, messageId, err }, "Telegram editMessageText failed");
  }
}

export async function setWebhook(url: string): Promise<void> {
  const res = await fetch(apiUrl("setWebhook"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, drop_pending_updates: true }),
  });

  if (!res.ok) {
    const err = await res.text();
    logger.error({ url, err }, "Telegram setWebhook failed");
    return;
  }

  const data = (await res.json()) as { ok: boolean; description?: string };
  if (data.ok) {
    logger.info({ url }, "Telegram webhook registered");
  } else {
    logger.error({ description: data.description }, "Telegram setWebhook error");
  }
}

export function buildStartKeyboard(loginUrl: string): Record<string, unknown> {
  return {
    inline_keyboard: [
      [{ text: "📱 Открыть Bunker", url: loginUrl }],
      [{ text: "📑 О проекте", callback_data: "about_project" }],
      [{ text: "💬 Поддержка", url: "https://t.me/bunker_support_bot" }],
    ],
  };
}

export const START_TEXT = `👋 Привет! Я официальный бот приложения Bunker.

Здесь ты можешь управлять своим аккаунтом и переходить в приложение.`;

export const ABOUT_TEXT = `📑 <b>О ПРОЕКТЕ</b>

Bunker — это приватная платформа, где ты можешь:

• Смотреть вертикальную видеоленту (аналог TikTok/Shorts)
• Общаться в защищённых чатах с E2E-шифрованием
• Использовать AI-помощников для генерации контента
• Управлять конфиденциальностью через VPN/Mesh

Оставайся с нами! 🚀`;
