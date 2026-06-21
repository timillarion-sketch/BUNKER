export interface Conversation {
  id: string;
  name: string;
  color: string;
  lastMsg: string;
  time: string;
  unread: number;
  encrypted: boolean;
}

export const MOCK_CONVERSATIONS: Conversation[] = [
  { id: "c1", name: "Agent K",  color: "#00f0ff", lastMsg: "Точка сброса закреплена. Жду сигнала.",      time: "14:23",   unread: 2, encrypted: true  },
  { id: "c2", name: "ZeroCool", color: "#ff00cc", lastMsg: "Мейнфрейм пропатчен. Нужен другой путь.",   time: "09:11",   unread: 0, encrypted: true  },
  { id: "c3", name: "Morpheus", color: "#00ff88", lastMsg: "Взломай планету.",                           time: "Вчера",   unread: 0, encrypted: true  },
  { id: "c4", name: "Trinity",  color: "#bf00ff", lastMsg: "Следуй за белым кроликом.",                  time: "Вторник", unread: 1, encrypted: true  },
  { id: "c5", name: "Ghost",    color: "#ffd700", lastMsg: "Сигнал потерян. Переподключение...",         time: "Вторник", unread: 0, encrypted: false },
];

export const MOCK_NODES = [
  { id: "n1", name: "BUNKER_7F2A", rssi: -42, lat: "55.75°N", lng: "37.61°E" },
  { id: "n2", name: "BUNKER_3C9D", rssi: -61, lat: "55.74°N", lng: "37.62°E" },
  { id: "n3", name: "BUNKER_A1F6", rssi: -78, lat: "55.76°N", lng: "37.60°E" },
];

export const AD_SELECTORS = [
  "[id*='ad']", "[id*='ads']", "[id*='AD']", "[id*='banner']", "[id*='Banner']",
  "[class*='ad-']", "[class*='-ad']", "[class*='ads-']", "[class*='advert']",
  "[class*='banner']", "[class*='Banner']", "[class*='popup']", "[class*='Popup']",
  "[class*='overlay']", "[class*='interstitial']", "[class*='sponsored']",
  "[class*='promo']", "[class*='promoted']", "[class*='outbrain']",
  "[class*='taboola']", "[class*='teaser']", "[class*='widget-ad']",
  "iframe[src*='doubleclick']", "iframe[src*='googlesyndication']",
  "iframe[src*='adservice']", "iframe[src*='amazon-adsystem']",
  "iframe[src*='outbrain']", "iframe[src*='taboola']",
  "ins.adsbygoogle", ".yandex-ad", "[data-ad]", "[data-ads]",
  "[data-advertisement]", "[data-sponsored]",
].join(",");

export const AD_BLOCK_CSS = `
  ${AD_SELECTORS} { display: none !important; visibility: hidden !important; height: 0 !important; }
  .cookie-notice, .cookie-banner, .gdpr-banner, #cookie-notice,
  #cookie-banner, [class*="cookie-consent"], [id*="cookie-consent"],
  [class*="gdpr"], [id*="gdpr"], .cc-window, #CybotCookiebotDialog { display: none !important; }
`;

export interface ArchiveChat {
  id:          string;
  name:        string;
  color:       string;
  lastMsg:     string;
  time:        string;
  incognito:   boolean;
  expiresAt?:  number;
}

export const INITIAL_ARCHIVE_CHATS: ArchiveChat[] = [
  {
    id: "a1", name: "Оперативник Α", color: "#ff3366",
    lastMsg: "Пакет доставлен. Точка Б подтверждена.", time: "03:17",
    incognito: true, expiresAt: Date.now() + 8 * 60 * 1000 + 33 * 1000,
  },
  {
    id: "a2", name: "DELTA-7", color: "#bf00ff",
    lastMsg: "Координаты зафиксированы. Жди сигнала.", time: "Вчера",
    incognito: false,
  },
  {
    id: "a3", name: "Призрак-9", color: "#ffd700",
    lastMsg: "Выход через чёрный ход. Не светись.", time: "Пн",
    incognito: true, expiresAt: Date.now() + 3 * 60 * 1000 + 12 * 1000,
  },
];

export interface CookieEntry {
  name: string;
  value: string;
  expires: string;
  secure: boolean;
  httpOnly: boolean;
}

export function generateCookies(): CookieEntry[] {
  const rnd = (n = 16) => Math.random().toString(36).slice(2, 2 + n);
  const futureDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + Math.floor(Math.random() * 365 + 30));
    return d.toLocaleDateString("ru");
  };
  const pool: CookieEntry[] = [
    { name: "_ga",         value: `GA1.2.${rnd(10)}.${Date.now()}`, expires: futureDate(), secure: false, httpOnly: false },
    { name: "_gid",        value: `GA1.2.${rnd(12)}`,               expires: futureDate(), secure: false, httpOnly: false },
    { name: "session_id",  value: rnd(24),                          expires: "По окончании сессии", secure: true,  httpOnly: true  },
    { name: "csrf_token",  value: rnd(32),                          expires: "По окончании сессии", secure: true,  httpOnly: false },
    { name: "user_pref",   value: `lang=ru&theme=dark&ts=${Date.now()}`, expires: futureDate(), secure: false, httpOnly: false },
    { name: "_fbp",        value: `fb.1.${Date.now()}.${rnd(10)}`,  expires: futureDate(), secure: false, httpOnly: false },
    { name: "ym_uid",      value: rnd(16),                          expires: futureDate(), secure: false, httpOnly: false },
    { name: "ab_group",    value: String(Math.floor(Math.random() * 10)), expires: futureDate(), secure: false, httpOnly: false },
  ];
  const count = 2 + Math.floor(Math.random() * (pool.length - 2));
  return pool.slice(0, count);
}
