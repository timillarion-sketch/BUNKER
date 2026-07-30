function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

export function detectDomainSquatting(hostname: string): { brand: string | null; distance: number } {
  const cleanHost = hostname.replace(/^www\./, '').split('.')[0];
  let closest: { brand: string | null; distance: number } = { brand: null, distance: Infinity };
  for (const [brand, domains] of Object.entries(BRAND_DOMAINS)) {
    for (const domain of domains) {
      const ref = domain.replace(/^www\./, '').split('.')[0];
      const dist = levenshteinDistance(cleanHost.toLowerCase(), ref.toLowerCase());
      if (dist < closest.distance) {
        closest = { brand, distance: dist };
      }
    }
  }
  return closest;
}

export const BRAND_DOMAINS: Record<string, string[]> = {
  sberbank: ["sberbank.ru", "sber.ru", "online.sberbank.ru"],
  tinkoff: ["tinkoff.ru", "tbank.ru"],
  vtb: ["vtb.ru", "online.vtb.ru"],
  gazprombank: ["gazprombank.ru", "gpbonline.ru"],
  alfabank: ["alfabank.ru", "alfabankale.ru"],
  rosselkhozbank: ["rshb.ru"],
  otkritie: ["open.ru", "bankotkritie.ru"],
  sovcombank: ["sovcombank.ru"],
  raiffeisen: ["raiffeisen.ru", "rfb.ru"],
  rosbank: ["rosbank.ru"],
  yandex: ["yandex.ru", "ya.ru", "dzen.ru"],
  google: ["google.com", "google.ru"],
  youtube: ["youtube.com"],
  gosuslugi: ["gosuslugi.ru", "esia.gosuslugi.ru"],
  mail: ["mail.ru", "e.mail.ru", "vk.com", "ok.ru"],
  ozon: ["ozon.ru", "ozon.com"],
  wildberries: ["wildberries.ru", "wb.ru"],
  avito: ["avito.ru"],
  citilink: ["citilink.ru"],
  mvideo: ["mvideo.ru"],
  eldorado: ["eldorado.ru"],
  apple: ["apple.com"],
  microsoft: ["microsoft.com", "live.com", "outlook.com"],
  telegram: ["telegram.org", "t.me"],
  whatsapp: ["whatsapp.com"],
  github: ["github.com"],
  stackoverflow: ["stackoverflow.com"],
  wikipedia: ["wikipedia.org", "wikimedia.org"],
  facebook: ["facebook.com", "fb.com"],
  instagram: ["instagram.com"],
  netflix: ["netflix.com"],
  spotify: ["spotify.com"],
  steam: ["steampowered.com", "steamcommunity.com"],
  twitch: ["twitch.tv"],
  discord: ["discord.com", "discordapp.com"],
  paypal: ["paypal.com"],
  cloudflare: ["cloudflare.com"],
  amazon: ["amazon.com", "amazon.ru"],
  aliexpress: ["aliexpress.com", "aliexpress.ru"],
  alibaba: ["alibaba.com"],
  taobao: ["taobao.com"],
  jivo: ["jivo.ru", "jivosite.com"],
  cdek: ["cdek.ru"],
  pochta: ["pochta.ru"],
  rostelecom: ["rt.ru", "rostelecom.ru"],
  megafon: ["megafon.ru"],
  mts: ["mts.ru"],
  beeline: ["beeline.ru"],
  tele2: ["tele2.ru"],
};
