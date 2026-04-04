const ru = {
  nav: {
    lobby:   "ЛОББИ",
    browser: "СЕТЬ",
    chats:   "СВЯЗЬ",
    feed:    "ЛЕНТА",
    profile: "ПРОФИЛЬ",
  },

  login: {
    tagline1:   "Максимальная приватность.",
    tagline2:   "Нулевой компромисс.",
    secureNode: "Безопасная аутентификация узла",
    initiateVk: "Войти через VK",
    yandexBio:  "Биометрия Яндекс",
  },

  characters: {
    nodeStatus: "УЗЕЛ: АЛЬФА",
    onlineCount: "{{count}} АГЕНТОВ ОНЛАЙН",
    header: "ИИ ЛОББИ",
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
    placeholder:  "[ ВВЕДИТЕ КОМАНДУ ]",
    send:         "ОТПРАВИТЬ",
    greeting:     "Соединение установлено. Укажите директиву.",
  },

  browser: {
    vpnOn:     "VPN ВКЛ",
    vpnOff:    "VPN ВЫКЛ",
    torOn:     "TOR ВКЛ",
    torOff:    "TOR ВЫКЛ",
    trackers:  "{{count}} ТРЕКЕРА",
    analyzing: "Извлечение данных...",
    neuralAnalysis: "Нейронный Анализ",
    privacyThreat:  "Уровень угрозы приватности",
    coreSynthesis:  "Основной синтез",
    vectors:        "Извлечённые векторы",
    error:          "[ОШИБКА] Нейросвязь разорвана. Цель блокирует доступ.",
    risk: {
      low:    "НИЗКИЙ",
      medium: "СРЕДНИЙ",
      high:   "ВЫСОКИЙ",
    },
  },

  chats: {
    header:       "Сообщения",
    subheader:    "Защищённая связь",
    e2eActive:    "E2E активно",
    protocolTitle: "Протокол полной анонимности",
    protocolDesc:  "Сообщения зашифрованы по нулевому знанию и маршрутизируются через децентрализованные узлы. Метаданные удалены.",
  },

  feed: {
    header:     "Лента",
    subheader:  "Входящая трансляция",
    comingSoon: "Приватные Ролики — Скоро",
    desc:       "Готовится зашифрованная видеолента без следов. Весь контент будет децентрализован и защищён от слежки.",
    loading:    "ЗАГРУЗКА МОДУЛЯ",
  },

  profile: {
    header:    "Профиль",
    operative: "Оперативник",
    logout:    "Выйти",

    verify:       "Верификация личности",
    vkLinked:     "VK ID — ПРИВЯЗАН",
    yandexLinked: "ЯНДЕКС ID — ПРИВЯЗАН",

    privacy:          "Настройки приватности",
    vpn:              "VPN-туннель",
    vpnDesc:          "Маршрутизировать весь трафик через зашифрованный туннель",
    tor:              "TOR-маршрутизация",
    torDesc:          "Анонимизировать через сеть Tor",
    notifications:    "Уведомления",
    notificationsDesc:"Системные push-уведомления (отключено в режиме стелс)",
    screenshots:      "Скриншоты",
    screenshotsDesc:  "Разрешить внешний захват экрана приложения",

    apiEndpoint: "API-Эндпоинт",
    save:        "СОХРАНИТЬ",

    protocolZero: "Протокол Ноль",
    protocolDesc: "Стирает всё локальное состояние, ключи, кеш и данные сессии. Двойное нажатие для подтверждения. Необратимо.",
    selfDestruct: "САМОУНИЧТОЖЕНИЕ",
    tapAgain:     "НАЖМИТЕ ЕЩЁ РАЗ",
    detonating:   "ПОДРЫВ ЧЕРЕЗ {{count}}...",

    language:     "Язык",
    langEn:       "EN",
    langRu:       "RU",
  },
} as const;

export default ru;
