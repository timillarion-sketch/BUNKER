const ru = {
  nav: {
    prompts: "ПРОМПТЫ",
    browser: "БРАУЗЕР",
    chats:   "СВЯЗЬ",
    feed:    "ЛЕНТА",
    profile: "ПРОФИЛЬ",
  },

  login: {
    tagline1:   "Максимальная приватность.",
    tagline2:   "Нулевой компромисс.",
    secureNode: "Безопасная аутентификация",
    initiateVk: "Войти через VK",
    yandexBio:  "Биометрия Яндекс",
  },

  characters: {
    nodeStatus:  "УЗЕЛ: АЛЬФА",
    onlineCount: "{{count}} АГЕНТОВ ОНЛАЙН",
    header:      "ИИ ЛОББИ",
    premium:     "Premium",
    locked:      "Недоступно",
    status: {
      online:  "Онлайн",
      busy:    "Занят",
      offline: "Оффлайн",
    },
  },

  chat: {
    encrypted:    "E2E Шифрование",
    sessionStart: "Сессия начата · Ключи согласованы",
    burn:         "СЖЕЧЬ",
    burnConfirm:  "ПОДТВЕРДИТЬ",
    placeholder:  "[ ВВЕДИТЕ СООБЩЕНИЕ ]",
    send:         "ОТПРАВИТЬ",
    greeting:     "Соединение установлено. Напишите сообщение.",
  },

  browser: {
    secure:           "ЗАЩИЩЕНО",
    trackers:         "{{count}} ТРЕКЕРА",
    blocked:          "{{count}} заблокировано",
    shieldActive:     "Щит активен",

    tabAnalysis:      "Анализ",
    tabCookies:       "Куки",

    runAnalysis:      "Запустить анализ",
    analysisIdleDesc: "Нажмите кнопку для запуска нейронного анализа текущей страницы.",
    analyzing:        "Извлечение данных...",
    neuralAnalysis:   "Нейронный Анализ",
    threatLevel:      "Уровень угрозы",
    coreSynthesis:    "Основной синтез",
    vectors:          "Ключевые факты",
    error:            "[ОШИБКА] Нейросвязь разорвана. Цель блокирует доступ.",
    risk: {
      low:    "НИЗКИЙ",
      medium: "СРЕДНИЙ",
      high:   "ВЫСОКИЙ",
    },

    cookieManager:   "Менеджер Куки",
    cookiesFound:    "{{count}} куки найдено",
    deleteAll:       "Удалить всё",
    deleteForSite:   "Удалить для этого сайта",
    noCookies:       "Куки не обнаружены",
    cookieExpires:   "Истекает",
    cookieSecure:    "Secure",
    allSites:        "Все сайты",
  },

  chats: {
    header:        "Сообщения",
    subheader:     "Защищённая связь",
    e2eActive:     "E2E активно",
    protocolTitle: "Шифрование сообщений",
    protocolDesc:  "Все сообщения защищены сквозным шифрованием. Метаданные не сохраняются.",
  },

  feed: {
    header:     "Лента",
    subheader:  "Входящая трансляция",
    comingSoon: "Приватные Ролики — Скоро",
    desc:       "Готовится зашифрованная видеолента. Весь контент будет защищён от слежки.",
    loading:    "ЗАГРУЗКА МОДУЛЯ",
  },

  profile: {
    header:    "Профиль",
    operative: "Оперативник",
    logout:    "Выйти",

    verify:       "Верификация личности",
    vkLinked:     "VK ID — ПРИВЯЗАН",
    yandexLinked: "ЯНДЕКС ID — ПРИВЯЗАН",

    ghostMode:        "Призрак Режим",
    ghostModeDesc:    "Сообщения остаются только на устройстве. Сеть не задействована.",

    privacy:           "Настройки",
    notifications:    "Уведомления",
    notificationsDesc: "Системные push-уведомления",
    screenshots:      "Скриншоты",
    screenshotsDesc:  "Разрешить захват экрана приложения",

    apiEndpoint: "API-Эндпоинт",
    save:        "СОХРАНИТЬ",

    protocolZero: "Протокол Ноль",
    protocolDesc: "Стирает всё локальное состояние, ключи, кеш и данные сессии. Двойное нажатие для подтверждения. Необратимо.",
    selfDestruct: "САМОУНИЧТОЖЕНИЕ",
    tapAgain:     "НАЖМИТЕ ЕЩЁ РАЗ",
    detonating:   "ПОДРЫВ ЧЕРЕЗ {{count}}...",
  },
} as const;

export default ru;
