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
): Promise<number | null> {
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
    return null;
  }

  const data = (await res.json()) as { ok: boolean; result?: { message_id: number } };
  return data.result?.message_id ?? null;
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

export async function deleteMessage(chatId: number, messageId: number): Promise<void> {
  const res = await fetch(apiUrl("deleteMessage"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, message_id: messageId }),
  });

  if (!res.ok) {
    const err = await res.text();
    logger.error({ chatId, messageId, err }, "Telegram deleteMessage failed");
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

export function buildMainKeyboard(): Record<string, unknown> {
  return {
    keyboard: [
      [{ text: "🔑 Создать аккаунт" }, { text: "🔄 Сменить пароль" }],
      [{ text: "ℹ️ О проекте" }, { text: "🆘 Поддержка" }],
    ],
    resize_keyboard: true,
    is_persistent: true,
  };
}

export function buildAboutKeyboard(): Record<string, unknown> {
  return {
    inline_keyboard: [
      [{ text: "🛡 Концепция безопасности", callback_data: "about_security" }],
      [{ text: "⚡ Возможности", callback_data: "about_features" }],
      [{ text: "📄 Пользовательское соглашение", callback_data: "about_terms" }],
      [{ text: "📋 Согласие на обработку ПД", callback_data: "about_privacy" }],
      [{ text: "◀ Главное меню", callback_data: "back_to_start" }],
    ],
  };
}

export const START_TEXT = `👋 Добро пожаловать в <b>BUNKER</b>.

Я официальный бот приложения. Здесь ты можешь создать аккаунт или управлять им.

Используй кнопки ниже 👇`;

export const CONCEPT_TEXT = `🛡 <b>КОНЦЕПЦИЯ БЕЗОПАСНОСТИ BUNKER</b>

<b>Приватность — не опция, а архитектура.</b>

🔐 <b>E2E-шифрование</b>
Все сообщения в P2P-чатах защищены сквозным шифрованием на протоколе Signal. Даже сервер не может прочитать содержимое — только отправитель и получатель.

🚫 <b>Ноль логов</b>
Мы не храним историю соединений, IP-адреса, метаданные переписки или сессионные данные дольше необходимого минимума.

🧅 <b>VPN + Mesh</b>
Встроенная поддержка VPN-туннелей и Mesh-сети делает твоё подключение анонимным и децентрализованным.

👤 <b>Псевдонимность</b>
Твой идентификатор в системе — BNKR-ID. Никакой привязки к телефону, email или реальному имени.

📦 <b>Локальное шифрование</b>
Ключи шифрования генерируются и хранятся на твоём устройстве. Сервер не имеет к ним доступа.`;

export const FEATURES_TEXT = `⚡ <b>ВОЗМОЖНОСТИ ПРИЛОЖЕНИЯ</b>

🎬 <b>Видеолента</b>
Вертикальные видео (аналог TikTok/Shorts) с умной рекомендательной системой.

💬 <b>Защищённые чаты</b>
P2P-мессенджер с E2E-шифрованием. Контакты только по BNKR-ID — никаких телефонов.

🤖 <b>AI-персонажи</b>
Интеллектуальные собеседники для консультаций, генерации идей и психологической поддержки.

🌐 <b>VPN/Mesh</b>
Встроенная сеть для анонимного и безопасного соединения.

🔐 <b>Секретный архив</b>
Защищённое PIN-кодом хранилище для приватных заметок и паролей.`;

export const TERMS_TEXT = `📄 <b>ПОЛЬЗОВАТЕЛЬСКОЕ СОГЛАШЕНИЕ</b>

1. <b>Общие положения</b>
1.1. Используя Bunker, вы соглашаетесь с условиями настоящего соглашения.
1.2. Bunker предоставляется как платформа для защищённого общения и обмена контентом.

2. <b>Обязанности пользователя</b>
2.1. Вы обязуетесь не использовать платформу для незаконной деятельности.
2.2. Вы несёте полную ответственность за сохранность своих учётных данных (логин и пароль).
2.3. Запрещена передача аккаунта третьим лицам.

3. <b>Ограничение ответственности</b>
3.1. Bunker не несёт ответственности за содержание сообщений пользователей.
3.2. Администрация не имеет доступа к содержимому E2E-зашифрованных сообщений.

4. <b>Конфиденциальность</b>
4.1. Bunker не собирает и не передаёт третьим лицам личные данные пользователей.
4.2. Данные шифруются на стороне клиента и не доступны серверу в открытом виде.

5. <b>Блокировка аккаунта</b>
5.1. Администрация вправе заблокировать аккаунт при нарушении условий соглашения.
5.2. Споры решаются через обратную связь: @bunker_support_bot`;

export const PRIVACY_TEXT = `📋 <b>СОГЛАСИЕ НА ОБРАБОТКУ ПЕРСОНАЛЬНЫХ ДАННЫХ</b>

Нажимая «Принимаю» при регистрации, вы соглашаетесь с:

1. <b>Перечень обрабатываемых данных:</b>
- Имя пользователя (логин)
- Хэш пароля (bcrypt)
- Идентификатор Telegram (при привязке)
- Публичный ключ шифрования
- BNKR-ID (автоматически генерируемый псевдоним)

2. <b>Цели обработки:</b>
- Обеспечение функционирования аккаунта
- Реализация E2E-шифрования
- Техническая поддержка

3. <b>Срок хранения:</b>
Данные хранятся до момента удаления аккаунта пользователем.

4. <b>Права пользователя:</b>
- В любой момент потребовать удаления аккаунта
- Отозвать согласие на обработку данных
- Экспортировать свои данные

5. <b>Защита данных:</b>
Пароли хранятся в bcrypt-хэше (невозможно восстановить исходный пароль).
Ключи шифрования генерируются на устройстве и не покидают его.

Для удаления аккаунта — @bunker_support_bot`;

export const SUPPORT_TEXT = `🆘 <b>Поддержка BUNKER</b>

Опишите проблему, какая ошибка или вопрос по структуре или просто задайте интересующий вас вопрос.

<i>Если ответ не найден, можете связаться с оператором, оставив заявку написав "связаться с оператором"</i>`;

export const SUPPORT_SYSTEM_PROMPT = `Ты — официальный бот технической поддержки приложения BUNKER. Твоя задача — помогать пользователям с любыми вопросами.

ВАЖНЫЕ ПРАВИЛА:
1. Отвечай как живой человек — естественно, дружелюбно, без шаблонных AI-фраз. Не говори "как AI-ассистент", "как языковая модель" и т.п.
2. Используй русский язык, общайся простым и понятным языком.
3. Если не знаешь ответа — честно скажи и предложи написать "связаться с оператором".

ИНФОРМАЦИЯ О СИСТЕМЕ BUNKER:

Архитектура:
- Сервер: Express.js на Node.js, порт 8080
- База данных: PostgreSQL
- Кэш: Redis
- Фронтенд: React + Vite, отдаётся через nginx на 443 порту
- Всё запущено через Docker Compose на одном сервере

Функции приложения:
- Регистрация по логину/паролю (bcrypt хэширование) или через OAuth (Яндекс, Google)
- P2P-чаты с E2E-шифрованием
- AI-персонажи с разными ролями
- Видеолента (Shorts)
- Секретный архив с PIN-кодом
- VPN/Mesh сеть
- Память AI (глобальные факты и персональные воспоминания)

Telegram бот:
- Команды: /start, /register, /change_password, /about, /support
- Кнопки главного меню: Создать аккаунт, Сменить пароль, О проекте, Поддержка
- Регистрация: ввод логина -> проверка уникальности -> ввод пароля -> bcrypt(12) хэш -> сохранение
- Смена пароля: проверка старого -> ввод нового -> bcrypt(12) -> обновление
- Авто-удаление сообщений с паролями через 10 минут
- Раздел "О проекте": безопасность, возможности, соглашение, приватность

Возможные проблемы и решения:
1. "Не запускается приложение" — проверь https://176.12.72.246.nip.io
2. "Ошибка 502" — проблема с nginx или API контейнером, напиши оператору
3. "Не могу войти" — проверь логин/пароль, используй кнопку "Сменить пароль" в боте
4. "Не приходит код OAuth" — проверь callback URL в консоли разработчика Яндекс/Google
5. "Не отправляется сообщение в чат" — проверь подключение к интернету, перезапусти приложение
6. "AI не отвечает" — возможен таймаут, попробуй ещё раз через минуту
7. "Ошибка регистрации" — убедись что логин 3-20 символов (латиница и цифры), пароль минимум 6 символов

Если пользователь просит связать с оператором, написал "связаться с оператором" или аналогично — сообщи что заявка принята и будет передана администратору. Больше ничего не спрашивай, просто скажи что заявка принята.`;

export const ABOUT_BUTTONS = {
  REGISTER: "🔑 Создать аккаунт",
  CHANGE_PASSWORD: "🔄 Сменить пароль",
  ABOUT: "ℹ️ О проекте",
  SUPPORT: "🆘 Поддержка",
} as const;
