<div align="center">

```
██████╗ ██╗   ██╗███╗   ██╗██╗  ██╗███████╗██████╗
██╔══██╗██║   ██║████╗  ██║██║ ██╔╝██╔════╝██╔══██╗
██████╔╝██║   ██║██╔██╗ ██║█████╔╝ █████╗  ██████╔╝
██╔══██╗██║   ██║██║╚██╗██║██╔═██╗ ██╔══╝  ██╔══██╗
██████╔╝╚██████╔╝██║ ╚████║██║  ██╗███████╗██║  ██║
╚═════╝  ╚═════╝ ╚═╝  ╚═══╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝
```

**МАКСИМАЛЬНАЯ ПРИВАТНОСТЬ. НУЛЕВОЙ КОМПРОМИСС.**

[![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-7-646cff?style=flat-square&logo=vite&logoColor=white)](https://vite.dev)
[![Express](https://img.shields.io/badge/Express-5-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com)
[![n8n](https://img.shields.io/badge/n8n-AI_Webhook-ef5b23?style=flat-square&logo=n8n&logoColor=white)](https://n8n.io)
[![License](https://img.shields.io/badge/License-MIT-00f0ff?style=flat-square)](#license)

</div>

---

## Что это?

**BUNKER** — кибerpunk Super-App с максимальной ориентацией на приватность. Тёмный интерфейс с неоновой эстетикой, ИИ-персонажи, зашифрованный мессенджер, встроенный браузер с блокировкой рекламы и Mesh-сетевой радар. Всё на русском языке.

> Приложение построено как полноценный pnpm-монорепозиторий с контрактным OpenAPI, кодогенерацией и PostgreSQL через Drizzle ORM.

---

## Скриншоты

| Вход | ИИ Лобби | Чат | Браузер |
|------|----------|-----|---------|
| Matrix-rain логин, VK / Яндекс OAuth | Сетка персонажей с неоновым свечением | Зашифрованный чат с ИИ через n8n | Полноэкранный браузер с блокировщиком |

---

## Функциональность

### 🤖 ИИ Лобби (`/`)
Шесть персонажей — три бесплатных, три премиальных.

| Персонаж | Роль | Статус |
|----------|------|--------|
| **ИИ Психолог** 🧠 | Эмпатичный советник | ✅ Активен |
| **Альтушка** 🖤 | Честный критик с характером | ✅ Активна |
| **Альфонс** 😎 | Мастер харизмы | ✅ Активен |
| **Пророк** 🔮 | Цифровой оракул будущего | 🔒 Premium |
| **Станкер** 🗺️ | Техно-гид по анонимности | 🔒 Premium |
| **Хейтер** 🔥 | Жёсткий критик системы | 🔒 Premium |

Нажатие на Premium-персонажа открывает модал **«ДОСТУП ОГРАНИЧЕН»** с информацией о нейронной калибровке.

### 💬 Чат с ИИ
- Сообщения уходят напрямую в **n8n webhook** (`/webhook/bunker-chat`)
- Формат запроса: `{ "character": "psychologist", "message": "текст" }`
- Ответ читается из поля `reply`
- Индикатор печатания с анимированными точками
- Кнопка **🔥 СЖЕЧЬ** — двойное нажатие полностью уничтожает историю с анимацией огня
- Каждый чат открывается с приветствием персонажа

### 🌐 Браузер (`/browser`)
- Полноэкранный iframe-браузер с навигацией
- **CSS-инжекция** для блокировки рекламы + MutationObserver
- Анимированный **Shield-бейдж** с счётчиком заблокированных элементов
- **Cookie Manager** — просмотр, удаление отдельных или всех cookie
- Кнопка **«Запустить анализ»** — AI-разбор текущей страницы через бэкенд

### 📡 СВЯЗЬ (`/chats`)
- Список зашифрованных диалогов
- **Mesh Status Bar** — радар с анимацией поиска узлов
  - `Узлов в радиусе: 0` → нажать **«Эмулировать Mesh-соседство»**
  - Сканирование 1.8 сек → `Найдено узлов: 3` с зелёным неоном
  - Разворачиваемый список узлов с RSSI и координатами

### 👤 Профиль (`/profile`)
- Верификация VK ID / Яндекс ID (заглушки)
- Тогглы: уведомления, скриншоты
- **Самоуничтожение** — двойной тап, обратный отсчёт 3-2-1, `localStorage.clear()` + перезагрузка
- Настройка URL эндпоинта API

---

## Стек

```
Монорепозиторий
├── artifacts/bunker          React 19 + Vite 7 + Tailwind + Framer Motion
├── artifacts/api-server      Express 5 + Pino (логи)
├── lib/db                    Drizzle ORM + PostgreSQL
├── lib/api-spec              OpenAPI 3.1 + Orval codegen
├── lib/api-client-react      Сгенерированные React Query хуки
└── lib/api-zod               Сгенерированные Zod-схемы
```

### Ключевые зависимости

| Категория | Пакет |
|-----------|-------|
| UI | React 19, Framer Motion, Lucide React |
| Стили | Tailwind CSS, clsx, tailwind-merge |
| Маршрутизация | Wouter |
| Запросы | TanStack Query |
| Локализация | i18next (только русский) |
| Шрифты | Orbitron · Rajdhani · Inter |
| ORM | Drizzle ORM + postgres.js |
| Валидация | Zod v4 |
| Логи | Pino + pino-pretty |

---

## Быстрый старт

```bash
# Клонировать репозиторий
git clone https://github.com/your-username/bunker.git
cd bunker

# Установить зависимости
pnpm install

# Настроить переменные среды
cp .env.example .env
# Заполните DATABASE_URL и SESSION_SECRET

# Запустить миграции
pnpm --filter @workspace/db run migrate

# Запустить оба сервиса
pnpm --filter @workspace/api-server run dev   # :8080
pnpm --filter @workspace/bunker run dev       # :19890
```

### Переменные среды

| Переменная | Описание |
|-----------|----------|
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | Секрет для сессий Express |
| `PORT` | Порт API-сервера (по умолчанию 8080) |

---

## Архитектура AI-чата

```
Пользователь → BUNKER Frontend
                    │
                    ▼
        POST https://timhook.app.n8n.cloud
             /webhook/bunker-chat
        { "character": "psychologist",
          "message":   "текст" }
                    │
                    ▼
              n8n Workflow
         (маршрутизация по персонажу)
                    │
                    ▼
        { "reply": "ответ персонажа" }
                    │
                    ▼
        Отображение в чат-пузыре
```

---

## Кодогенерация

```bash
# Обновить OpenAPI spec → сгенерировать хуки и Zod-схемы
pnpm --filter @workspace/api-spec run codegen

# Полная проверка типов всего монорепозитория
pnpm run typecheck
```

---

## Структура проекта

```
bunker/
├── artifacts/
│   ├── api-server/
│   │   └── src/
│   │       ├── app.ts              # Express app + CORS
│   │       ├── index.ts            # Точка входа
│   │       └── routes/
│   │           ├── health.ts       # GET /api/healthz
│   │           ├── characters.ts   # GET /api/characters
│   │           ├── messages.ts     # CRUD /api/messages/:id
│   │           └── browser.ts      # POST /api/browser/analyze
│   └── bunker/
│       └── src/
│           ├── pages/
│           │   ├── Login.tsx       # Matrix-rain + OAuth
│           │   ├── Characters.tsx  # Лобби персонажей
│           │   ├── Chat.tsx        # Чат → n8n webhook
│           │   ├── Browser.tsx     # ИИ-браузер
│           │   ├── ChatsList.tsx   # СВЯЗЬ + Mesh-радар
│           │   ├── Feed.tsx        # Лента
│           │   └── Profile.tsx     # Профиль + самоуничтожение
│           ├── lib/
│           │   └── constants.ts    # Цвета, персонажи, навигация
│           └── i18n/
│               └── ru.ts           # Все строки интерфейса
├── lib/
│   ├── api-spec/                   # openapi.yaml + orval.config.ts
│   ├── api-client-react/           # Сгенерированные хуки
│   ├── api-zod/                    # Сгенерированные схемы
│   └── db/                         # Drizzle schema + migrations
├── tsconfig.base.json
├── pnpm-workspace.yaml
└── README.md
```

---

## Дизайн-система

```
Цвета:
  Electric Blue  #00f0ff   — основной акцент
  Neon Pink      #ff00cc   — СВЯЗЬ, заголовки
  Neon Green     #00ff88   — статус онлайн, Mesh
  Gold           #ffd700   — Premium-бейдж
  Red            #ff3366   — ошибки, сжигание

Шрифты:
  Orbitron   — display, заголовки
  Rajdhani   — tech, метки, бейджи
  Inter      — body, сообщения чата

Эффекты:
  Glassmorphism  backdrop-filter: blur(12-24px)
  Glow           box-shadow многослойный
  Grid bg        SVG-сетка с opacity 0.04
```

---

## Лицензия

MIT © 2025 BUNKER Project

---

<div align="center">

*Построено для тех, кто понимает цену приватности.*

`[ СИСТЕМА АКТИВНА ]`

</div>
