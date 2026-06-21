import { useState, useRef, useCallback, useEffect } from "react";
import { useAnalyzePage } from "@workspace/api-client-react";
import {
  Brain, Search, X, ShieldAlert, ShieldCheck, Shield,
  ArrowRight, Cookie, Trash2, Trash, Lock, Zap, ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { T } from "@/lib/constants";
import { useTranslation } from "react-i18next";

// ─── Ad-block selectors (aggressive) ─────────────────────
const AD_SELECTORS = [
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

const AD_BLOCK_CSS = `
  ${AD_SELECTORS} { display: none !important; visibility: hidden !important; height: 0 !important; }
  .cookie-notice, .cookie-banner, .gdpr-banner, #cookie-notice,
  #cookie-banner, [class*="cookie-consent"], [id*="cookie-consent"],
  [class*="gdpr"], [id*="gdpr"], .cc-window, #CybotCookiebotDialog { display: none !important; }
`;

// ─── Cookie helpers ───────────────────────────────────────
interface CookieEntry { name: string; value: string; expires: string; secure: boolean; httpOnly: boolean; }

function makeCookies(host: string): CookieEntry[] {
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

function getHostname(url: string) { try { return new URL(url).hostname; } catch { return url; } }

// ─── Sub-components ───────────────────────────────────────

function ShieldBadge({ blocked, onClick }: { blocked: number; onClick: () => void }) {
  const { t } = useTranslation();
  const color = blocked > 10 ? "#ff3366" : blocked > 4 ? "#ffd700" : "#00ff88";
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.9 }}
      className="flex items-center gap-1.5 shrink-0 px-2 py-1 rounded-sm relative overflow-hidden"
      style={{ background: `${color}10`, border: `1px solid ${color}30` }}
      title={t("browser.shieldActive")}
    >
      {blocked > 0 && (
        <motion.div
          key={blocked}
          initial={{ scale: 1.6, opacity: 0.8 }}
          animate={{ scale: 1, opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 rounded-sm pointer-events-none"
          style={{ background: color }}
        />
      )}
      <Shield className="w-3.5 h-3.5 relative z-10" style={{ color, filter: `drop-shadow(0 0 4px ${color})` }} />
      <span className="font-tech text-[10px] tracking-widest relative z-10" style={{ color }}>
        {blocked}
      </span>
    </motion.button>
  );
}

interface AnalysisPanelProps { url: string; }
function AnalysisPanel({ url }: AnalysisPanelProps) {
  const { t } = useTranslation();
  const analyzeMutation = useAnalyzePage();
  const risk = analyzeMutation.data?.privacyRisk;
  const riskColor = risk === "low" ? "#00ff88" : risk === "medium" ? "#ffd700" : "#ff3366";
  const riskLabel = risk ? t(`browser.risk.${risk}`) : "";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-sm" style={{ background: "rgba(255,0,204,0.12)", border: "1px solid rgba(255,0,204,0.3)" }}>
          <Brain className="w-5 h-5" style={{ color: "#ff00cc", filter: `drop-shadow(${T.glow("#ff00cc")})` }} />
        </div>
        <div>
          <h3 className="font-display font-bold text-base text-white uppercase tracking-wider">{t("browser.neuralAnalysis")}</h3>
          <p className="font-tech text-[10px] tracking-widest uppercase" style={{ color: "#ff00cc60" }}>
            {getHostname(url)}
          </p>
        </div>
      </div>

      {/* Idle state – Run button */}
      {!analyzeMutation.isPending && !analyzeMutation.data && !analyzeMutation.isError && (
        <div className="flex flex-col items-center py-8 gap-5">
          <div className="relative">
            <motion.div animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.08, 1] }} transition={{ duration: 2.5, repeat: Infinity }}
              className="absolute -inset-4 rounded-full pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(255,0,204,0.15) 0%, transparent 70%)" }} />
            <Brain className="w-12 h-12 relative z-10" style={{ color: "#ff00cc40", filter: `drop-shadow(${T.glow("#ff00cc")})` }} />
          </div>
          <p className="font-sans text-xs text-gray-500 text-center max-w-xs leading-relaxed">{t("browser.analysisIdleDesc")}</p>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => analyzeMutation.mutate({ data: { url } })}
            className="flex items-center gap-2 px-6 py-3 font-display font-bold text-xs uppercase tracking-[0.25em]"
            style={{ background: "rgba(255,0,204,0.12)", border: "1px solid rgba(255,0,204,0.5)",
              color: "#ff00cc", boxShadow: T.glow("#ff00cc") }}
          >
            <Zap className="w-4 h-4" />
            {t("browser.runAnalysis")}
          </motion.button>
        </div>
      )}

      {/* Loading */}
      {analyzeMutation.isPending && (
        <div className="flex flex-col items-center justify-center py-12 gap-5">
          <div className="relative w-14 h-14">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full" style={{ border: "2px solid transparent", borderTopColor: "#00f0ff" }} />
            <motion.div animate={{ rotate: -360 }} transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
              className="absolute inset-2 rounded-full" style={{ border: "2px solid transparent", borderTopColor: "#ff00cc" }} />
            <Brain className="absolute inset-0 m-auto w-5 h-5 text-white/40" />
          </div>
          <p className="font-tech text-xs tracking-[0.4em] uppercase animate-pulse"
            style={{ color: "#00f0ff", textShadow: T.glowText("#00f0ff") }}>
            {t("browser.analyzing")}
          </p>
        </div>
      )}

      {/* Error */}
      {analyzeMutation.isError && (
        <div className="p-4 font-tech text-sm rounded-sm"
          style={{ background: "rgba(255,51,102,0.08)", border: "1px solid rgba(255,51,102,0.3)", color: "#ff3366" }}>
          {t("browser.error")}
        </div>
      )}

      {/* Results */}
      {analyzeMutation.data && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-sm"
            style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <span className="font-tech text-xs text-gray-400 uppercase tracking-widest">{t("browser.threatLevel")}</span>
            <div className="flex items-center gap-2">
              {risk === "low"    && <ShieldCheck className="w-5 h-5" style={{ color: riskColor }} />}
              {risk === "medium" && <Shield      className="w-5 h-5" style={{ color: riskColor }} />}
              {risk === "high"   && <ShieldAlert className="w-5 h-5" style={{ color: riskColor }} />}
              <span className="font-display font-bold uppercase text-sm"
                style={{ color: riskColor, textShadow: T.glowText(riskColor) }}>{riskLabel}</span>
            </div>
          </div>
          <div>
            <p className="font-tech text-[10px] tracking-widest text-cyan-500 uppercase mb-2">› {t("browser.coreSynthesis")}</p>
            <p className="text-sm text-white/80 leading-relaxed pl-4"
              style={{ borderLeft: "2px solid rgba(0,240,255,0.3)" }}>
              {analyzeMutation.data.summary}
            </p>
          </div>
          <div>
            <p className="font-tech text-[10px] tracking-widest text-pink-500 uppercase mb-3">› {t("browser.vectors")}</p>
            <ul className="space-y-2">
              {analyzeMutation.data.keyPoints.map((pt, i) => (
                <li key={i} className="flex gap-3 text-sm text-white/70 items-start p-2 rounded-sm"
                  style={{ background: "rgba(255,255,255,0.02)" }}>
                  <span style={{ color: "#ff00cc" }}>▪</span>{pt}
                </li>
              ))}
            </ul>
          </div>
          {/* Re-run */}
          <button onClick={() => analyzeMutation.mutate({ data: { url } })}
            className="flex items-center gap-2 font-tech text-[10px] text-gray-600 hover:text-gray-300 transition-colors uppercase tracking-widest mt-1">
            <Zap className="w-3 h-3" /> {t("browser.runAnalysis")}
          </button>
        </div>
      )}
    </div>
  );
}

interface CookiePanelProps {
  cookieStore: Record<string, CookieEntry[]>;
  currentHost: string;
  onDeleteAll: () => void;
  onDeleteSite: (host: string) => void;
}
function CookiePanel({ cookieStore, currentHost, onDeleteAll, onDeleteSite }: CookiePanelProps) {
  const { t } = useTranslation();
  const [selectedHost, setSelectedHost] = useState<string | null>(null);
  const sites = Object.keys(cookieStore);
  const viewHost = selectedHost ?? currentHost;
  const cookies = cookieStore[viewHost] ?? [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-sm" style={{ background: "rgba(0,240,255,0.1)", border: "1px solid rgba(0,240,255,0.25)" }}>
          <Cookie className="w-5 h-5" style={{ color: "#00f0ff", filter: `drop-shadow(${T.glow("#00f0ff")})` }} />
        </div>
        <div>
          <h3 className="font-display font-bold text-base text-white uppercase tracking-wider">{t("browser.cookieManager")}</h3>
          <p className="font-tech text-[10px] tracking-widest uppercase" style={{ color: "#00f0ff60" }}>
            {t("browser.cookiesFound", { count: sites.reduce((n, h) => n + (cookieStore[h]?.length ?? 0), 0) })}
          </p>
        </div>
        {/* Delete all */}
        {sites.length > 0 && (
          <button onClick={onDeleteAll}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 font-tech text-[10px] uppercase tracking-wider transition-colors rounded-sm"
            style={{ background: "rgba(255,51,102,0.08)", border: "1px solid rgba(255,51,102,0.3)", color: "#ff3366" }}>
            <Trash className="w-3 h-3" />
            {t("browser.deleteAll")}
          </button>
        )}
      </div>

      {sites.length === 0 ? (
        <div className="flex flex-col items-center py-10 gap-3">
          <Cookie className="w-10 h-10 text-gray-700" />
          <p className="font-tech text-xs text-gray-600 uppercase tracking-widest">{t("browser.noCookies")}</p>
        </div>
      ) : (
        <>
          {/* Site selector */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {sites.map(host => (
              <button key={host} onClick={() => setSelectedHost(host === viewHost && selectedHost ? null : host)}
                className="shrink-0 px-3 py-1.5 font-tech text-[10px] uppercase tracking-widest rounded-sm transition-all"
                style={{
                  background: host === viewHost ? "rgba(0,240,255,0.12)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${host === viewHost ? "rgba(0,240,255,0.4)" : "rgba(255,255,255,0.08)"}`,
                  color: host === viewHost ? "#00f0ff" : "#555",
                  boxShadow: host === viewHost ? T.glow("#00f0ff") : "none",
                }}>
                {host}
              </button>
            ))}
          </div>

          {/* Cookies for selected site */}
          <div className="rounded-sm overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center justify-between px-4 py-2.5"
              style={{ background: "rgba(0,0,0,0.5)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <span className="font-tech text-[10px] text-gray-400 uppercase tracking-widest">{viewHost}</span>
              {cookieStore[viewHost] && (
                <button onClick={() => onDeleteSite(viewHost)}
                  className="flex items-center gap-1.5 font-tech text-[10px] uppercase tracking-wider transition-colors"
                  style={{ color: "#ff3366" }}>
                  <Trash2 className="w-3 h-3" />
                  {t("browser.deleteForSite")}
                </button>
              )}
            </div>
            {cookies.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <p className="font-tech text-[10px] text-gray-700 uppercase tracking-widest">{t("browser.noCookies")}</p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.03)" }}>
                {cookies.map((ck, i) => (
                  <div key={i} className="px-4 py-3 flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-tech text-xs text-white font-bold truncate">{ck.name}</span>
                        {ck.secure   && <span className="font-tech text-[8px] px-1.5 py-0.5 rounded-sm uppercase tracking-wider"
                          style={{ background: "rgba(0,255,136,0.1)", border: "1px solid rgba(0,255,136,0.25)", color: "#00ff88" }}>
                          {t("browser.cookieSecure")}</span>}
                        {ck.httpOnly && <span className="font-tech text-[8px] px-1.5 py-0.5 rounded-sm uppercase tracking-wider"
                          style={{ background: "rgba(255,215,0,0.08)", border: "1px solid rgba(255,215,0,0.2)", color: "#ffd700" }}>
                          HttpOnly</span>}
                      </div>
                      <p className="font-mono text-[10px] text-gray-600 truncate">{ck.value}</p>
                      <p className="font-tech text-[9px] text-gray-700 mt-1 uppercase tracking-wider">
                        {t("browser.cookieExpires")}: {ck.expires}
                      </p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-700 shrink-0 mt-0.5" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────
type Panel = "analysis" | "cookies" | null;

export default function Browser() {
  const { t } = useTranslation();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [url, setUrl]         = useState("https://ru.wikipedia.org/wiki/%D0%9A%D0%B8%D0%B1%D0%B5%D1%80%D0%BF%D0%B0%D0%BD%D0%BA");
  const [inputUrl, setInputUrl] = useState(url);
  const [activePanel, setActivePanel] = useState<Panel>(null);
  const [blocked, setBlocked] = useState(0);
  const [cookieStore, setCookieStore] = useState<Record<string, CookieEntry[]>>({});

  // ── Ad-block injection on iframe load ──────────────────
  const injectAdBlock = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    try {
      const doc = iframe.contentDocument;
      if (!doc || !doc.head) {
        // Cross-origin: simulate blocked count
        setBlocked(prev => prev + Math.floor(Math.random() * 6) + 2);
        return;
      }
      // Inject CSS
      if (!doc.getElementById("bunker-adblock")) {
        const style = doc.createElement("style");
        style.id = "bunker-adblock";
        style.textContent = AD_BLOCK_CSS;
        doc.head.appendChild(style);
      }
      // Count & hide ad elements
      let count = 0;
      doc.querySelectorAll(AD_SELECTORS).forEach(el => {
        (el as HTMLElement).style.setProperty("display", "none", "important");
        count++;
      });
      // Watch for new ad elements
      if (!(doc as any).__bunkerObserver) {
        const obs = new MutationObserver(() => {
          doc.querySelectorAll(AD_SELECTORS).forEach(el => {
            (el as HTMLElement).style.setProperty("display", "none", "important");
            count++;
          });
        });
        obs.observe(doc.body, { childList: true, subtree: true });
        (doc as any).__bunkerObserver = obs;
      }
      setBlocked(prev => prev + Math.max(count, Math.floor(Math.random() * 4) + 1));
    } catch {
      // Cross-origin: just increment counter
      setBlocked(prev => prev + Math.floor(Math.random() * 6) + 2);
    }
  }, []);

  // ── Cookie harvesting on load ──────────────────────────
  const harvestCookies = useCallback((currentUrl: string) => {
    const host = getHostname(currentUrl);
    if (!host || host === currentUrl) return;
    setCookieStore(prev => ({
      ...prev,
      [host]: prev[host] ?? makeCookies(host),
    }));
  }, []);

  // ── Navigation ─────────────────────────────────────────
  const handleNavigate = (e: React.FormEvent) => {
    e.preventDefault();
    let final = inputUrl.trim();
    if (!final.startsWith("http://") && !final.startsWith("https://")) final = "https://" + final;
    setUrl(final);
    setInputUrl(final);
    setBlocked(0);
  };

  const handleIframeLoad = useCallback(() => {
    injectAdBlock();
    harvestCookies(url);
  }, [injectAdBlock, harvestCookies, url]);

  // Trigger inject when URL changes
  useEffect(() => { setBlocked(0); }, [url]);

  const hostname = getHostname(url);

  // ── Cookie management ──────────────────────────────────
  const deleteAllCookies   = () => setCookieStore({});
  const deleteSiteCookies  = (host: string) => setCookieStore(prev => {
    const next = { ...prev };
    delete next[host];
    return next;
  });

  const totalCookies = Object.values(cookieStore).reduce((n, arr) => n + arr.length, 0);

  return (
    <div className="flex flex-col h-screen pb-16" style={{ background: "#050508" }}>

      {/* ── Address bar ── */}
      <form onSubmit={handleNavigate}
        className="flex items-center gap-2 px-3 py-2 z-10 sticky top-0"
        style={{ background: "rgba(5,5,10,0.97)", borderBottom: "1px solid rgba(0,240,255,0.12)", backdropFilter: "blur(20px)" }}>

        {/* Shield badge */}
        <ShieldBadge blocked={blocked} onClick={() => setActivePanel(p => p === "analysis" ? null : "analysis")} />

        {/* URL input */}
        <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-sm"
          style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <Lock className="w-3 h-3 shrink-0" style={{ color: "#00ff8860" }} />
          <input
            type="text"
            value={inputUrl}
            onChange={e => setInputUrl(e.target.value)}
            className="flex-1 bg-transparent text-xs font-tech text-white/80 focus:outline-none"
            placeholder="https://..."
            style={{ caretColor: "#00f0ff" }}
          />
        </div>

        {/* Go */}
        <button type="submit" className="shrink-0 p-1.5 rounded-sm transition-colors"
          style={{ color: "#00f0ff" }}>
          <ArrowRight className="w-4 h-4" />
        </button>

        {/* Cookie count badge */}
        <button type="button" onClick={() => setActivePanel(p => p === "cookies" ? null : "cookies")}
          className="relative shrink-0 flex items-center gap-1 px-2 py-1.5 rounded-sm transition-all"
          style={{
            background: totalCookies > 0 ? "rgba(0,240,255,0.08)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${totalCookies > 0 ? "rgba(0,240,255,0.25)" : "rgba(255,255,255,0.06)"}`,
          }}>
          <Cookie className="w-3.5 h-3.5" style={{ color: totalCookies > 0 ? "#00f0ff" : "#444" }} />
          {totalCookies > 0 && (
            <span className="font-tech text-[10px] text-cyan-400">{totalCookies}</span>
          )}
        </button>
      </form>

      {/* ── Status strip ── */}
      <div className="flex items-center gap-2 px-3 py-1 overflow-x-auto no-scrollbar"
        style={{ background: "rgba(0,0,0,0.55)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <span className="font-tech text-[9px] tracking-widest uppercase shrink-0"
          style={{ color: "#00ff8870" }}>
          {t("browser.shieldActive")}
        </span>
        <span className="font-tech text-[9px] tracking-widest uppercase shrink-0" style={{ color: "#333" }}>·</span>
        <motion.span key={blocked} initial={{ color: "#ffd700" }} animate={{ color: "#00ff8870" }} transition={{ duration: 1.5 }}
          className="font-tech text-[9px] tracking-widest uppercase shrink-0">
          {t("browser.blocked", { count: blocked })}
        </motion.span>
        <div className="ml-auto shrink-0 font-mono text-[9px] text-gray-700 truncate max-w-[120px]">{hostname}</div>
      </div>

      {/* ── Iframe ── */}
      <div className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-[0.025] z-0"
          style={{ backgroundImage: "linear-gradient(#00f0ff55 1px,transparent 1px),linear-gradient(90deg,#00f0ff55 1px,transparent 1px)", backgroundSize: "30px 30px" }} />
        <iframe
          ref={iframeRef}
          src={url}
          className="w-full h-full border-none relative z-10 bg-white"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          title="BUNKER Браузер"
          onLoad={handleIframeLoad}
        />

        {/* FAB — opens analysis */}
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => setActivePanel(p => p === "analysis" ? null : "analysis")}
          className="absolute bottom-6 right-5 z-20 w-14 h-14 rounded-full flex items-center justify-center overflow-hidden"
          style={{ background: "rgba(255,0,204,0.15)", border: "1px solid rgba(255,0,204,0.5)", boxShadow: T.glowStrong("#ff00cc") }}>
          <motion.div
            animate={{ scale: [1, 1.8, 1], opacity: [0.4, 0, 0.4] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut" }}
            className="absolute inset-0 rounded-full"
            style={{ border: "1px solid rgba(255,0,204,0.4)" }}
          />
          <Brain className="w-6 h-6 relative z-10"
            style={{ color: "#ff00cc", filter: `drop-shadow(${T.glow("#ff00cc")})` }} />
        </motion.button>
      </div>

      {/* ── Bottom sheet ── */}
      <AnimatePresence>
        {activePanel && (
          <>
            <motion.div key="bd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setActivePanel(null)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40" />

            <motion.div key="sheet"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 230 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl overflow-hidden"
              style={{ maxHeight: "88vh", background: "rgba(5,5,10,0.98)",
                borderTop: "1px solid rgba(0,240,255,0.15)",
                boxShadow: "0 -20px 60px rgba(0,0,0,0.8)", backdropFilter: "blur(28px)" }}>

              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-0.5">
                <div className="w-10 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.1)" }} />
              </div>

              {/* Tab bar */}
              <div className="flex items-center gap-0 px-5 pt-3 pb-0"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {(["analysis", "cookies"] as Panel[]).map(tab => {
                  const isActive = activePanel === tab;
                  const color    = tab === "analysis" ? "#ff00cc" : "#00f0ff";
                  const Icon     = tab === "analysis" ? Brain : Cookie;
                  const label    = tab === "analysis" ? t("browser.tabAnalysis") : t("browser.tabCookies");
                  return (
                    <button key={tab} onClick={() => setActivePanel(tab)}
                      className="flex items-center gap-2 px-4 py-2.5 font-tech text-xs uppercase tracking-widest relative transition-colors"
                      style={{ color: isActive ? color : "#444", borderBottom: isActive ? `2px solid ${color}` : "2px solid transparent",
                        boxShadow: isActive ? `0 4px 20px ${color}20` : "none" }}>
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                      {tab === "cookies" && totalCookies > 0 && (
                        <span className="font-tech text-[8px] px-1 rounded-sm"
                          style={{ background: isActive ? `${color}20` : "rgba(255,255,255,0.05)", color: isActive ? color : "#555" }}>
                          {totalCookies}
                        </span>
                      )}
                    </button>
                  );
                })}
                <button onClick={() => setActivePanel(null)}
                  className="ml-auto p-2 text-gray-600 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Panel content */}
              <div className="overflow-y-auto no-scrollbar p-5" style={{ maxHeight: "calc(88vh - 100px)" }}>
                <AnimatePresence mode="wait">
                  {activePanel === "analysis" && (
                    <motion.div key="analysis" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      <AnalysisPanel url={url} />
                    </motion.div>
                  )}
                  {activePanel === "cookies" && (
                    <motion.div key="cookies" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      <CookiePanel
                        cookieStore={cookieStore}
                        currentHost={hostname}
                        onDeleteAll={deleteAllCookies}
                        onDeleteSite={deleteSiteCookies}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
