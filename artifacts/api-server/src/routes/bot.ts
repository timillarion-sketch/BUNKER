import { Router, type IRouter, type Request, type Response } from "express";
import { getEnv } from "../lib/env";
import { logger } from "../lib/logger";
import {
  sendMessage,
  answerCallbackQuery,
  editMessageText,
  buildStartKeyboard,
  START_TEXT,
  ABOUT_TEXT,
  setWebhook,
} from "../lib/telegram-bot";

const router: IRouter = Router();

interface TgMessage {
  message_id: number;
  chat: { id: number };
  text?: string;
}

interface TgCallbackQuery {
  id: string;
  data?: string;
  message?: TgMessage;
}

interface TgUpdate {
  message?: TgMessage;
  callback_query?: TgCallbackQuery;
}

// POST /api/bot/webhook — точка входа для обновлений от Telegram
router.post("/bot/webhook", async (req: Request, res: Response) => {
  try {
    const update = req.body as TgUpdate;

    if (update.message?.text === "/start") {
      const chatId = update.message.chat.id;
      const loginUrl = `${getEnv().API_URL}/auth/telegram/login`;

      await sendMessage(chatId, START_TEXT, {
        reply_markup: buildStartKeyboard(loginUrl),
      });

      logger.info({ chatId }, "Telegram /start handled");
    }

    if (update.callback_query) {
      const { id: cbId, data, message } = update.callback_query;

      if (data === "about_project" && message) {
        await answerCallbackQuery(cbId, "📑 Загружаю информацию...");
        await editMessageText(message.chat.id, message.message_id, ABOUT_TEXT, {
          inline_keyboard: [
            [{ text: "◀ Назад", callback_data: "back_to_start" }],
          ],
        });
      }

      if (data === "back_to_start" && message) {
        const chatId = message.chat.id;
        const loginUrl = `${getEnv().API_URL}/auth/telegram/login`;

        await answerCallbackQuery(cbId, "🏠 Главное меню");
        await editMessageText(chatId, message.message_id, START_TEXT, {
          reply_markup: buildStartKeyboard(loginUrl),
        });
      }
    }

    // Всегда отвечаем 200, чтобы Telegram не повторял отправку
    res.sendStatus(200);
  } catch (err) {
    logger.error({ err }, "Telegram webhook error");
    res.sendStatus(200);
  }
});

export default router;

export async function registerBotWebhook(): Promise<void> {
  const env = getEnv();
  const webhookUrl = `${env.API_URL}/api/bot/webhook`;
  await setWebhook(webhookUrl);
}
