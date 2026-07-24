import { Router, type IRouter, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getEnv } from "../lib/env";
import { logger } from "../lib/logger";
import {
  sendMessage,
  answerCallbackQuery,
  editMessageText,
  deleteMessage,
  setWebhook,
  buildMainKeyboard,
  buildAboutKeyboard,
  START_TEXT,
  CONCEPT_TEXT,
  FEATURES_TEXT,
  TERMS_TEXT,
  PRIVACY_TEXT,
  SUPPORT_TEXT,
  SUPPORT_SYSTEM_PROMPT,
  ABOUT_BUTTONS,
} from "../lib/telegram-bot";

const router: IRouter = Router();

interface TgMessage {
  message_id: number;
  chat: { id: number };
  text?: string;
  from?: { id: number; username?: string; first_name?: string };
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

const pendingRegistrations = new Map<number, {
  step: "awaiting_username" | "awaiting_password";
  username?: string;
  msgIds: number[];
}>();

const pendingPasswordChanges = new Map<number, {
  step: "awaiting_old_password" | "awaiting_new_password";
  msgIds: number[];
}>();

const pendingSupport = new Map<number, {
  messages: Array<{ role: string; content: string }>;
}>();

const ESCALATION_KEYWORDS = ["связаться с оператором", "оператор", "человек", "админ", "заявка"];

function scheduleCleanup(chatId: number, msgIds: number[], delayMs = 600_000) {
  if (msgIds.length === 0) return;
  setTimeout(async () => {
    for (const msgId of msgIds) {
      await deleteMessage(chatId, msgId).catch(() => {});
    }
  }, delayMs);
}

// POST /api/bot/webhook
router.post("/bot/webhook", async (req: Request, res: Response) => {
  try {
    const update = req.body as TgUpdate;

    if (update.callback_query) {
      await handleCallbackQuery(update.callback_query);
      res.sendStatus(200);
      return;
    }

    const msg = update.message;
    if (!msg?.chat?.id || !msg?.from?.id || !msg.text) {
      res.sendStatus(200);
      return;
    }

    const chatId = msg.chat.id;
    const fromId = msg.from.id;
    const text = msg.text.trim();

    if (text.startsWith("/")) {
      await handleCommand(chatId, fromId, text);
    } else if (Object.values(ABOUT_BUTTONS).includes(text as typeof ABOUT_BUTTONS[keyof typeof ABOUT_BUTTONS])) {
      await handleButtonPress(chatId, fromId, text);
    } else {
      await handleTextMessage(chatId, fromId, text, msg.message_id);
    }

    res.sendStatus(200);
  } catch (err) {
    logger.error({ err }, "Telegram webhook error");
    res.sendStatus(200);
  }
});

async function handleCommand(chatId: number, fromId: number, text: string) {
  switch (text) {
    case "/start":
      await sendMessage(chatId, START_TEXT, {
        reply_markup: buildMainKeyboard(),
      });
      break;

    case "/register":
      await startRegistration(chatId, fromId);
      break;

    case "/change_password":
      await startPasswordChange(chatId, fromId);
      break;

    case "/about":
      const msg = await sendMessage(chatId, "Выберите раздел:", {
        reply_markup: buildAboutKeyboard(),
      });
      break;

    case "/support":
      await startSupport(chatId, fromId);
      break;
  }
}

async function handleButtonPress(chatId: number, fromId: number, text: string) {
  switch (text) {
    case ABOUT_BUTTONS.REGISTER:
      await startRegistration(chatId, fromId);
      break;

    case ABOUT_BUTTONS.CHANGE_PASSWORD:
      await startPasswordChange(chatId, fromId);
      break;

    case ABOUT_BUTTONS.ABOUT:
      const msg = await sendMessage(chatId, "Выберите раздел:", {
        reply_markup: buildAboutKeyboard(),
      });
      break;

    case ABOUT_BUTTONS.SUPPORT:
      await startSupport(chatId, fromId);
      break;
  }
}

async function startRegistration(chatId: number, fromId: number) {
  const [existing] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.telegramId, fromId))
    .limit(1);

  if (existing) {
    await sendMessage(chatId, "У вас уже есть аккаунт. Используйте кнопку «Сменить пароль».");
    return;
  }

  const state = { step: "awaiting_username" as const, msgIds: [] as number[] };
  pendingRegistrations.set(fromId, state);

  const m = await sendMessage(
    chatId,
    "Введите желаемый логин (только латиница и цифры, от 3 до 20 символов):\n\n⚠️ Все сообщения с логином и паролем будут удалены через 10 минут.",
  );
  if (m) state.msgIds.push(m);
}

async function startPasswordChange(chatId: number, fromId: number) {
  const [user] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.telegramId, fromId))
    .limit(1);

  if (!user) {
    await sendMessage(chatId, "У вас нет аккаунта. Нажмите «Создать аккаунт».");
    return;
  }

  const state = { step: "awaiting_old_password" as const, msgIds: [] as number[] };
  pendingPasswordChanges.set(fromId, state);

  const m = await sendMessage(
    chatId,
    "Введите старый пароль:\n\n⚠️ Все сообщения будут удалены через 10 минут.",
  );
  if (m) state.msgIds.push(m);
}

async function startSupport(chatId: number, fromId: number) {
  pendingRegistrations.delete(fromId);
  pendingPasswordChanges.delete(fromId);

  pendingSupport.set(fromId, { messages: [] });

  await sendMessage(chatId, SUPPORT_TEXT, {
    reply_markup: {
      inline_keyboard: [
        [{ text: "◀ Назад в меню", callback_data: "support_exit" }],
      ],
    },
  });
}

async function callSupportAI(history: Array<{ role: string; content: string }>): Promise<string> {
  const env = getEnv();
  const response = await fetch(`${env.OPENROUTER_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.OPENROUTER_API_KEY_1}`,
    },
    body: JSON.stringify({
      model: "openrouter/free",
      messages: [
        { role: "system", content: SUPPORT_SYSTEM_PROMPT },
        ...history.slice(-10),
      ],
      max_tokens: 1000,
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const text = await response.text();
    logger.error({ status: response.status, body: text }, "Support AI call failed");
    return "Извините, сервис временно недоступен. Попробуйте позже или напишите «связаться с оператором».";
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return data?.choices?.[0]?.message?.content ?? "...";
}

function isEscalation(text: string): boolean {
  const lower = text.toLowerCase().trim();
  return ESCALATION_KEYWORDS.some((kw) => lower.includes(kw));
}

async function handleEscalation(chatId: number, fromId: number, session: { messages: Array<{ role: string; content: string }> }) {
  const conversationLog = session.messages
    .map((m) => `${m.role === "user" ? "Пользователь" : "Бот"}: ${m.content}`)
    .join("\n---\n");

  logger.info({ telegramId: fromId, conversation: conversationLog }, "Support escalation");

  await sendMessage(
    chatId,
    "✅ Ваша заявка принята. Администратор свяжется с вами в ближайшее время.",
    { reply_markup: buildMainKeyboard() },
  );
}

async function handleSupportMessage(chatId: number, fromId: number, text: string) {
  const session = pendingSupport.get(fromId);
  if (!session) return;

  if (isEscalation(text)) {
    pendingSupport.delete(fromId);
    await handleEscalation(chatId, fromId, session);
    return;
  }

  session.messages.push({ role: "user", content: text });

  const reply = await callSupportAI(session.messages);

  session.messages.push({ role: "assistant", content: reply });

  await sendMessage(chatId, reply, {
    reply_markup: {
      inline_keyboard: [
        [{ text: "◀ Назад в меню", callback_data: "support_exit" }],
      ],
    },
  });
}

async function handleTextMessage(chatId: number, fromId: number, text: string, incomingMsgId: number) {
  const support = pendingSupport.get(fromId);
  if (support) {
    await handleSupportMessage(chatId, fromId, text);
    return;
  }
  const reg = pendingRegistrations.get(fromId);
  if (reg) {
    reg.msgIds.push(incomingMsgId);

    if (reg.step === "awaiting_username") {
      if (text.length < 3 || text.length > 20) {
        const m = await sendMessage(chatId, "Логин должен быть от 3 до 20 символов. Попробуйте ещё раз:");
        if (m) reg.msgIds.push(m);
        return;
      }

      const safeUsername = text.replace(/[^a-zA-Z0-9_]/g, "_");
      if (safeUsername !== text) {
        const m = await sendMessage(chatId, "Логин может содержать только латиницу, цифры и _. Попробуйте ещё раз:");
        if (m) reg.msgIds.push(m);
        return;
      }

      const [existing] = await db
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(eq(usersTable.username, safeUsername))
        .limit(1);

      if (existing) {
        const m = await sendMessage(chatId, "Этот логин уже занят. Попробуйте другой:");
        if (m) reg.msgIds.push(m);
        return;
      }

      reg.username = safeUsername;
      reg.step = "awaiting_password";
      const m = await sendMessage(chatId, "Отлично! Теперь введите пароль (минимум 6 символов):");
      if (m) reg.msgIds.push(m);
      return;
    }

    if (reg.step === "awaiting_password") {
      if (text.length < 6) {
        const m = await sendMessage(chatId, "Пароль должен быть не менее 6 символов. Попробуйте ещё раз:");
        if (m) reg.msgIds.push(m);
        return;
      }

      try {
        const passwordHash = await bcrypt.hash(text, 12);
        await db.insert(usersTable).values({
          username: reg.username!,
          displayName: reg.username!,
          passwordHash,
          authProvider: "credentials",
          telegramId: fromId,
        });

        const m = await sendMessage(
          chatId,
          "✅ Аккаунт создан!\n\nЛогин и пароль нигде не сохраняются — в базе только хэш пароля (bcrypt).\nДаже разработчик не сможет узнать ваш пароль.\n\nВсе сообщения будут удалены через 10 минут.",
          { reply_markup: buildMainKeyboard() },
        );
        if (m) reg.msgIds.push(m);

        scheduleCleanup(chatId, reg.msgIds);
        logger.info({ telegramId: fromId, username: reg.username }, "User registered via Telegram bot");
      } catch (err) {
        logger.error({ err, telegramId: fromId }, "Registration via Telegram bot failed");
        const m = await sendMessage(chatId, "Ошибка при создании аккаунта. Попробуйте позже.");
        if (m) reg.msgIds.push(m);
      }

      pendingRegistrations.delete(fromId);
      return;
    }
  }

  const pwChange = pendingPasswordChanges.get(fromId);
  if (pwChange) {
    pwChange.msgIds.push(incomingMsgId);

    if (pwChange.step === "awaiting_old_password") {
      const [user] = await db
        .select({ id: usersTable.id, passwordHash: usersTable.passwordHash })
        .from(usersTable)
        .where(eq(usersTable.telegramId, fromId))
        .limit(1);

      if (!user || !user.passwordHash) {
        const m = await sendMessage(chatId, "Аккаунт не найден.");
        if (m) pwChange.msgIds.push(m);
        pendingPasswordChanges.delete(fromId);
        return;
      }

      const valid = await bcrypt.compare(text, user.passwordHash);
      if (!valid) {
        const m = await sendMessage(chatId, "Неверный пароль. Попробуйте ещё раз:");
        if (m) pwChange.msgIds.push(m);
        return;
      }

      pwChange.step = "awaiting_new_password";
      const m = await sendMessage(chatId, "Введите новый пароль (минимум 6 символов):");
      if (m) pwChange.msgIds.push(m);
      return;
    }

    if (pwChange.step === "awaiting_new_password") {
      if (text.length < 6) {
        const m = await sendMessage(chatId, "Пароль должен быть не менее 6 символов. Попробуйте ещё раз:");
        if (m) pwChange.msgIds.push(m);
        return;
      }

      try {
        const newHash = await bcrypt.hash(text, 12);
        await db
          .update(usersTable)
          .set({ passwordHash: newHash })
          .where(eq(usersTable.telegramId, fromId));

        const m = await sendMessage(chatId, "✅ Пароль изменён. Все сообщения будут удалены через 10 минут.");
        if (m) pwChange.msgIds.push(m);

        scheduleCleanup(chatId, pwChange.msgIds);
        logger.info({ telegramId: fromId }, "Password changed via Telegram bot");
      } catch (err) {
        logger.error({ err, telegramId: fromId }, "Password change via Telegram bot failed");
        const m = await sendMessage(chatId, "Ошибка при смене пароля. Попробуйте позже.");
        if (m) pwChange.msgIds.push(m);
      }

      pendingPasswordChanges.delete(fromId);
      return;
    }
  }
}

async function handleCallbackQuery(cb: TgCallbackQuery) {
  const { id: cbId, data, message } = cb;
  if (!data || !message) return;

  await answerCallbackQuery(cbId);

  switch (data) {
    case "about_security":
      await editMessageText(message.chat.id, message.message_id, CONCEPT_TEXT, {
        reply_markup: {
          inline_keyboard: [
            [{ text: "◀ Назад к разделам", callback_data: "about_menu" }],
          ],
        },
      });
      break;

    case "about_features":
      await editMessageText(message.chat.id, message.message_id, FEATURES_TEXT, {
        reply_markup: {
          inline_keyboard: [
            [{ text: "◀ Назад к разделам", callback_data: "about_menu" }],
          ],
        },
      });
      break;

    case "about_terms":
      await editMessageText(message.chat.id, message.message_id, TERMS_TEXT, {
        reply_markup: {
          inline_keyboard: [
            [{ text: "◀ Назад к разделам", callback_data: "about_menu" }],
          ],
        },
      });
      break;

    case "about_privacy":
      await editMessageText(message.chat.id, message.message_id, PRIVACY_TEXT, {
        reply_markup: {
          inline_keyboard: [
            [{ text: "◀ Назад к разделам", callback_data: "about_menu" }],
          ],
        },
      });
      break;

    case "about_menu":
      await editMessageText(message.chat.id, message.message_id, "Выберите раздел:", {
        reply_markup: buildAboutKeyboard(),
      });
      break;

    case "back_to_start":
      await editMessageText(message.chat.id, message.message_id, START_TEXT, {
        reply_markup: buildMainKeyboard(),
      });
      break;

    case "support_exit":
      pendingSupport.delete(message.chat.id);
      await editMessageText(message.chat.id, message.message_id, "◀ Вы вышли из режима поддержки.");
      await sendMessage(message.chat.id, START_TEXT, {
        reply_markup: buildMainKeyboard(),
      });
      break;
  }
}

export default router;

export async function registerBotWebhook(): Promise<void> {
  const env = getEnv();
  const webhookUrl = `${env.API_URL}/api/bot/webhook`;
  await setWebhook(webhookUrl);
}
