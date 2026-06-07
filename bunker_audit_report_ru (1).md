# BUNKER — честный технический аудит проекта

Архив: `bunker-golden-backup-2026-06-07_16-27-39.tar.gz`  
Метод проверки: статический аудит архива без запуска приложения, без установки зависимостей и без выполнения пользовательского кода.

## 1. Краткий вердикт

Проект сейчас больше похож на красивый Replit/Vibe Coding прототип, чем на production-ready систему. Визуально идея собрана неплохо, но почти все критичные для реальной нагрузки и безопасности вещи либо моковые, либо сделаны на клиенте, либо отсутствуют.

Главный вывод: **в текущем виде проект нельзя выпускать на пользователей как приватный/безопасный сервис**. Его можно использовать как UI-концепт/демо, но backend, авторизацию, хранение данных, AI-интеграцию, realtime, безопасность и структуру доменов нужно переделывать.

## 2. Что в проекте есть

Структура архива:

```text
artifacts/bunker          React + Vite frontend
artifacts/api-server      Express API
lib/db                    Drizzle + PostgreSQL, фактически только contacts
lib/api-spec              OpenAPI spec
lib/api-client-react      сгенерированный API client
lib/api-zod               сгенерированные Zod-схемы
artifacts/mockup-sandbox  отдельный sandbox/donor UI
```

Положительные моменты:

- Есть попытка сделать monorepo через pnpm workspace.
- Есть TypeScript.
- Есть зачатки OpenAPI/codegen.
- Есть React Query клиент.
- Есть Drizzle ORM и PostgreSQL-зависимость.
- UI уже имеет общий стиль и набор экранов.
- Есть разделение на frontend и api-server.

Но эти плюсы пока больше про форму, чем про рабочую production-архитектуру.

## 3. Критические проблемы

### 3.1. Авторизация ненастоящая

Файл: `artifacts/bunker/src/hooks/use-auth.ts`

Фактически вход — это запись флага в `localStorage`:

```ts
localStorage.setItem("bunker_auth", "true")
```

Любой пользователь может открыть DevTools и выставить этот флаг сам. На сервере нет сессий, нет JWT, нет OAuth-проверки, нет user_id из доверенного источника.

Последствия:

- Нельзя отличить одного пользователя от другого.
- Нельзя защищать premium-функции.
- Нельзя безопасно хранить чаты/контакты.
- Нельзя строить подписки и лимиты.
- Любые frontend-защиты обходятся за секунды.

Нужно переделать: нормальная серверная авторизация через OAuth/логин, серверные сессии в `HttpOnly Secure SameSite` cookie или аккуратная token-схема, refresh rotation, таблицы `users`, `sessions`, `oauth_accounts`.

### 3.2. Прямой n8n webhook зашит во frontend

Файл: `artifacts/bunker/src/lib/constants.ts`

```ts
export const N8N_WEBHOOK = "https://timgood.app.n8n.cloud/webhook-test/bunkerV2";
```

Файлы, которые вызывают его напрямую:

- `artifacts/bunker/src/pages/Chat.tsx`
- `artifacts/bunker/src/pages/ContentProducerChat.tsx`

Проблема: webhook виден всем в собранном frontend-бандле. Пользователь может дергать n8n напрямую, обходя приложение, лимиты, оплату, роли и логику доступа.

Нужно переделать: frontend должен ходить только в `/api/chat` или `/api/ai/tasks`, а backend уже сам вызывает n8n/LLM-провайдера. На backend должны быть лимиты, авторизация, очереди, логирование, billing и защита от спама.

### 3.3. В архив включён `.env` с реальными значениями

В корне архива лежит `.env`, где есть:

- `DATABASE_URL`
- `SESSION_SECRET`
- `PORT`
- `NODE_ENV`
- `BASE_PATH`
- `LOG_LEVEL`

`.gitignore` не содержит `.env`, то есть риск случайного попадания секретов очень высокий. Даже если `.env` не был в git history, он уже попал в backup-архив.

Нужно сделать:

- Добавить `.env` в `.gitignore`.
- Создать `.env.example` без секретов.
- Ротировать `DATABASE_URL` и `SESSION_SECRET`, потому что они уже были в переносимом архиве.
- Не класть `.env` в backup для передачи третьим лицам.

### 3.4. Backend почти не защищён

Файл: `artifacts/api-server/src/app.ts`

```ts
app.use(cors());
app.use(express.json());
```

Проблемы:

- CORS открыт для всех.
- Нет `helmet`/security headers.
- Нет rate-limit.
- Нет auth middleware.
- Нет CSRF-стратегии, если будут cookie-сессии.
- Нет явного body-size лимита.
- Нет централизованного error handler.
- Нет request-id/correlation-id как полноценной инфраструктуры.
- Нет проверки прав доступа на route-level.

Нужно переделать: добавить CORS whitelist, helmet/CSP, rate-limit, validation middleware, auth middleware, request context, централизованную обработку ошибок.

### 3.5. Чаты на backend хранятся в памяти процесса

Файл: `artifacts/api-server/src/routes/messages.ts`

```ts
const messageStore: Record<string, Array<...>> = {};
```

Проблемы:

- После рестарта сервера всё пропадает.
- При двух Node-инстансах данные расходятся.
- Нет user_id, значит сообщения разных пользователей могут смешиваться по `characterId`.
- Нет лимитов на длину сообщений и историю.
- Нет настоящего AI-вызова — ответы выбираются случайно из массива.

Нужно переделать: таблицы `conversations`, `messages`, `message_events`, привязка к `user_id`, серверная авторизация, пагинация, лимиты, индексы, хранение статусов, idempotency keys.

### 3.6. Contacts сделаны через `default_user`

Файл: `artifacts/api-server/src/routes/contacts.ts`

```ts
const requesterId = "default_user";
```

Frontend тоже фильтрует `default_user` в `ChatsList.tsx`.

Это означает, что контактная система не знает настоящего пользователя. При реальном трафике это сразу ломается: все пользователи живут в одной общей логической зоне.

Нужно переделать: `requester_id` брать только из серверной сессии, `addressee_id` проверять по таблице users, добавить статусы `pending/accepted/blocked/declined`, уникальные индексы, права на удаление/принятие заявок.

### 3.7. SSE realtime не масштабируется горизонтально

Файлы:

- `artifacts/api-server/src/routes/sse.ts`
- `artifacts/api-server/src/lib/sse-events.ts`

Сейчас подписчики хранятся в `Map` внутри одного Node-процесса. При нескольких инстансах сервера события будут доходить только до части пользователей.

Нужно переделать: Redis Pub/Sub, NATS или managed WebSocket gateway. Для начала можно оставить SSE, но с Redis broker и авторизацией канала пользователя.

### 3.8. “Приватность”, “E2E”, “RAM only” — в основном фасад

Примеры:

- `use-secret-pin.ts` хранит PIN как `btoa("bunker:${pin}:secure")`. Это не хеш и не безопасность.
- `SecretArchive.tsx` содержит mock-данные и RAM-only только в рамках текущего React state.
- В UI написано “E2E Шифрование”, но реального E2E-протокола нет.
- “Cookie Manager” в `Browser.tsx` генерирует fake cookies через `Math.random`, а не читает реальные cookie сайтов.
- “Ad-block injection” через iframe почти всегда не сможет работать на чужих сайтах из-за cross-origin ограничений.

Нужно переделать: либо честно переименовать это в демо/симуляцию, либо строить реальную криптографическую модель, key management, threat model, и отдельную privacy-архитектуру.

### 3.9. Browser-функция технически неверная для web-приложения

Файл: `artifacts/bunker/src/pages/Browser.tsx`

Проблема: обычный сайт в браузере не может быть полноценным браузером внутри iframe для произвольных сайтов. Многие сайты запрещают iframe через `X-Frame-Options`/CSP, а доступ к DOM/cookies чужого сайта запрещён same-origin policy.

То есть заявленные функции блокировки рекламы, чтения cookies и анализа страницы не будут работать надёжно в web-версии.

Реальные варианты:

- Для web: это должен быть не “браузер”, а URL analyzer через backend crawler/proxy.
- Для мобильного: React Native WebView с нативным уровнем контроля.
- Для расширения: браузерное расширение с permissions.

### 3.10. OpenAPI/codegen рассинхронизированы

`lib/api-spec/openapi.yaml` описывает health, characters, messages, browser/analyze. Но generated zod уже содержит `AddContactBody`, `ContactResponse`, `ListContactsResponse`, которых нет в текущем openapi.yaml.

Это означает, что контракт API и generated код не являются единым источником правды.

Нужно переделать: OpenAPI должен быть единственным контрактом. После каждого изменения route — обновление spec, codegen, typecheck, тесты.

### 3.11. Нет миграций БД

Есть Drizzle schema только для `contacts`, но нет нормальной папки миграций. Скрипт есть только `push`/`push-force`.

Для production это риск: невозможно безопасно воспроизводить изменения схемы на сервере.

Нужно: `drizzle-kit generate`, папка migrations, миграции в CI/CD, запрет `push-force` в production.

### 3.12. Нет lockfile

В архиве нет `pnpm-lock.yaml`. При этом проект зависит от множества пакетов и catalog overrides.

Последствия:

- Нельзя гарантировать повторяемую установку.
- На другом сервере могут установиться другие версии.
- Сборка через месяц может сломаться.

Нужно: зафиксировать `pnpm-lock.yaml` и вести его в репозитории.

### 3.13. В архив попали build artifacts и git bundle

В архиве есть:

- `artifacts/api-server/dist`
- `artifacts/bunker/dist`
- `lib/*/dist`
- `git-temp.bundle`

`git-temp.bundle` содержит полный git history. Это не должно лежать в обычном production backup/package для передачи.

Нужно разделить:

- source archive;
- production build artifact;
- private backup;
- git bundle только для отдельного recovery-сценария.

### 3.14. Большие компоненты, много inline-style и смешение логики

Крупные frontend-файлы:

- `Browser.tsx` — 577 строк
- `CharacterCustomizer.tsx` — 534 строки
- `ChatsList.tsx` — 471 строка
- `SecretArchive.tsx` — 449 строк
- `ContentProducerChat.tsx` — 432 строки
- `Chat.tsx` — 389 строк
- `Profile.tsx` — 344 строки

Проблема: page-файлы содержат одновременно UI, бизнес-логику, mock data, API-вызовы, стили и локальные состояния. При росте проекта это быстро станет трудно поддерживать.

Нужно разделить по feature/domain архитектуре.

## 4. Что можно оставить

Можно оставить как основу:

- Визуальный стиль BUNKER.
- Общую идею monorepo.
- React + Vite frontend.
- Express или заменить на Nest/Fastify — зависит от планов.
- PostgreSQL + Drizzle, но схему нужно расширять правильно.
- OpenAPI/codegen подход, но привести в порядок.
- React Query клиент.
- Часть UI-компонентов, если почистить зависимости и вынести дизайн-систему.

## 5. Что лучше выбросить/переделать полностью

Полностью переделать:

- `use-auth.ts` localStorage auth.
- Прямые n8n вызовы из frontend.
- `messageStore` в памяти процесса.
- `default_user` в contacts.
- `use-secret-pin.ts` с base64 PIN.
- Browser iframe как “реальный браузер”.
- Fake cookie manager.
- Fake adblock counter.
- Fake privacy claims без реализации.
- Хранение gateway key в localStorage.
- OpenAPI/generated рассинхрон.
- Сборку/backup, где `.env`, dist и git bundle лежат вместе.

## 6. Правильная целевая архитектура

Рекомендуемая структура:

```text
apps/
  web/                      # React/Vite frontend
  api/                      # backend API
packages/
  db/                       # schema + migrations + repositories
  contracts/                # OpenAPI/Zod contracts
  api-client/               # generated client
  ui/                       # дизайн-система
  config/                   # typed env config
  shared/                   # общие типы/утилиты без бизнес-логики
services/
  ai-gateway/               # n8n/LLM proxy, queue workers
  realtime/                 # websocket/SSE gateway или модуль внутри api
infra/
  docker/
  nginx/
  migrations/
  ci/
```

Backend-домены:

```text
auth/
users/
oauth-accounts/
sessions/
characters/
conversations/
messages/
contacts/
subscriptions/
ai-gateway/
browser-analysis/
audit-logs/
realtime/
```

Минимальная БД:

```text
users
sessions
oauth_accounts
ai_characters
conversations
messages
contact_requests
contacts/subscriptions
user_settings
api_usage_events
ai_requests
payments/subscriptions, если будет premium
security_events
audit_logs
```

## 7. Что делать по этапам

### Этап 0 — остановить риск

1. Убрать `.env` из архивов и git.
2. Добавить `.env` в `.gitignore`.
3. Создать `.env.example`.
4. Ротировать `DATABASE_URL` и `SESSION_SECRET`.
5. Убрать прямой n8n webhook из frontend bundle.
6. Убрать публичные claims “E2E”, “максимальная приватность”, если они не реализованы.

### Этап 1 — серверная основа

1. Typed env config через Zod.
2. Auth/session middleware.
3. CORS whitelist.
4. Helmet/security headers.
5. Rate limits.
6. Central error handler.
7. Request validation middleware.
8. PostgreSQL migrations.
9. Structured logging + request-id.

### Этап 2 — пользователи и контакты

1. Таблица users.
2. OAuth accounts.
3. Sessions.
4. Contacts/contact requests с requester из session.
5. Уникальные индексы.
6. Права доступа на каждую операцию.

### Этап 3 — чаты и AI

1. Таблицы conversations/messages.
2. Backend endpoint `/api/ai/chat`.
3. Backend вызывает n8n/LLM.
4. Очередь задач: Redis/BullMQ или аналог.
5. Rate limit по user_id.
6. Лимиты токенов/сообщений.
7. История и пагинация.
8. Отмена/таймауты/повторы.

### Этап 4 — realtime

1. SSE/WebSocket только после auth.
2. Каналы по user_id.
3. Redis Pub/Sub для нескольких серверов.
4. Heartbeat и cleanup.
5. Backpressure и лимиты соединений.

### Этап 5 — frontend cleanup

1. Разделить большие страницы на feature-модули.
2. Убрать direct fetch, использовать единый API client.
3. Убрать бизнес-логику из UI-компонентов.
4. Вынести mock data в fixtures/dev-only.
5. Вынести inline styles в design tokens/components.
6. Привести i18n к одному источнику.

### Этап 6 — production deployment

1. Dockerfile/docker-compose или нормальный deploy pipeline.
2. Nginx reverse proxy.
3. Health/readiness endpoints.
4. CI: lint, typecheck, tests, build.
5. Backup/restore policy.
6. Monitoring: uptime, logs, metrics, alerts.
7. Error tracking.

## 8. Оценка по направлениям

| Направление | Оценка | Комментарий |
|---|---:|---|
| UI/визуальная идея | 7/10 | Красивый прототип, но много inline и крупных файлов |
| Frontend-архитектура | 4/10 | Есть React/TS, но страницы перегружены и смешивают всё |
| Backend-архитектура | 2/10 | Есть Express shell, но нет настоящих доменов и auth |
| Безопасность | 1/10 | localStorage auth, открытый CORS, secrets в архиве, fake privacy |
| Масштабирование | 2/10 | in-memory state, SSE без broker, нет очередей и лимитов |
| БД/данные | 2/10 | Только contacts, нет users/messages/sessions/migrations |
| Production readiness | 1/10 | Нельзя запускать как публичный сервис |

## 9. Итог

Проект не нужно “чуть-чуть починить”. Его нужно признать UI-прототипом и построить нормальный backend/foundation вокруг него.

Правильный путь: сохранить визуальную концепцию, но переписать ядро: auth, users, sessions, contacts, messages, AI gateway, realtime, security, migrations, deployment. Только после этого можно думать о наплыве пользователей.

Коротко: **дизайн можно развивать, архитектуру нужно пересобрать.**
