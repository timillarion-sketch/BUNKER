import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { User, Shield, Server, Eye, Wifi, Bell, Camera, Skull, LogOut, Globe, Key } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { T, API_BASE_URL } from "@/lib/constants";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";

function NeonToggle({ on, onChange, color = "#00f0ff" }: { on: boolean; onChange: (v: boolean) => void; color?: string }) {
  return (
    <button onClick={() => onChange(!on)}
      className="shrink-0 relative w-11 h-6 rounded-full transition-all duration-300"
      style={{ background: on ? `${color}25` : "rgba(255,255,255,0.06)",
        border: `1px solid ${on ? `${color}50` : "rgba(255,255,255,0.1)"}`,
        boxShadow: on ? T.glow(color) : undefined }}>
      <motion.div animate={{ x: on ? 20 : 2 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="absolute top-1 w-4 h-4 rounded-full"
        style={{ background: on ? color : "#555", boxShadow: on ? T.glow(color) : undefined }} />
    </button>
  );
}

function ToggleRow({ icon: Icon, label, description, value, onChange, neon = "#00f0ff" }:
  { icon: any; label: string; description: string; value: boolean; onChange: (v: boolean) => void; neon?: string }) {
  return (
    <div className="flex items-start gap-4 py-3">
      <div className="mt-0.5 shrink-0">
        <Icon className="w-4 h-4" style={{ color: value ? neon : "#444" }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-tech text-xs uppercase tracking-wider text-white">{label}</p>
        <p className="font-sans text-[10px] text-gray-600 mt-0.5 leading-snug">{description}</p>
      </div>
      <NeonToggle on={value} onChange={onChange} color={neon} />
    </div>
  );
}

function DestructButton({ onConfirm, labels }: { onConfirm: () => void; labels: { idle: string; armed: string; detonating: (c: number) => string } }) {
  const [phase, setPhase] = useState<"idle" | "armed" | "countdown">("idle");
  const [count, setCount] = useState(3);
  const handleClick = () => {
    if (phase === "idle") { setPhase("armed"); setTimeout(() => setPhase("idle"), 4000); }
    else if (phase === "armed") {
      setPhase("countdown");
      let c = 3; setCount(c);
      const iv = setInterval(() => { c -= 1; setCount(c); if (c === 0) { clearInterval(iv); onConfirm(); } }, 600);
    }
  };
  return (
    <motion.button onClick={handleClick} whileTap={{ scale: 0.96 }}
      className="w-full py-4 font-display font-bold tracking-[0.2em] text-sm uppercase rounded-sm flex items-center justify-center gap-3 transition-all"
      style={{ background: phase !== "idle" ? "rgba(255,51,102,0.18)" : "rgba(255,51,102,0.08)",
        border: `1px solid ${phase !== "idle" ? "rgba(255,51,102,0.7)" : "rgba(255,51,102,0.3)"}`,
        color: "#ff3366", boxShadow: phase !== "idle" ? T.glow("#ff3366") : undefined }}>
      <Skull className={`w-5 h-5 ${phase === "countdown" ? "animate-bounce" : ""}`} />
      {phase === "idle"      && labels.idle}
      {phase === "armed"     && labels.armed}
      {phase === "countdown" && labels.detonating(count)}
    </motion.button>
  );
}

export default function Profile() {
  const { logout, selfDestruct } = useAuth();
  const { t } = useTranslation();

  const [apiUrl, setApiUrl] = useState(() => localStorage.getItem("bunker_api_url") ?? API_BASE_URL);
  const [editingUrl, setEditingUrl] = useState(false);
  const [vpn, setVpn]               = useState(true);
  const [tor, setTor]               = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [screenshots, setScreenshots]     = useState(false);
  const [lang, setLang] = useState<"ru" | "en">(() => (localStorage.getItem("bunker_lang") ?? "ru") as "ru" | "en");

  const saveUrl = () => { localStorage.setItem("bunker_api_url", apiUrl); setEditingUrl(false); };

  const switchLang = (target: "ru" | "en") => {
    if (target === lang) return;
    setLang(target);
    i18n.changeLanguage(target);
    localStorage.setItem("bunker_lang", target);
  };

  const langBtnStyle = (target: "ru" | "en", color: string) => ({
    background: lang === target ? `${color}18` : "transparent",
    border:     `1px solid ${lang === target ? color : "rgba(255,255,255,0.07)"}`,
    color:      lang === target ? color : "#444",
    boxShadow:  lang === target ? T.glow(color) : "none",
  });

  return (
    <div className="min-h-screen pb-28 px-4 pt-12 no-scrollbar overflow-y-auto">
      {/* Header */}
      <header className="mb-8 flex justify-between items-start">
        <div>
          <p className="font-tech text-xs tracking-[0.3em] mb-1 uppercase" style={{ color: "#00f0ff", textShadow: T.glowText("#00f0ff") }}>
            {t("profile.operative")}
          </p>
          <h1 className="font-display font-black text-3xl tracking-wider uppercase text-white" style={{ textShadow: T.glowText("#00f0ff") }}>
            {t("profile.header")}
          </h1>
          <div className="mt-3 h-[2px] w-14 rounded-full" style={{ background: "#00f0ff", boxShadow: T.glow("#00f0ff") }} />
        </div>
        <button onClick={logout}
          className="flex items-center gap-1.5 px-3 py-2 text-gray-500 hover:text-white transition-colors rounded-sm font-tech text-xs uppercase tracking-wider"
          style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
          <LogOut className="w-4 h-4" />
          <span>{t("profile.logout")}</span>
        </button>
      </header>

      <div className="space-y-5">

        {/* ── Language Toggle ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-sm"
          style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(191,0,255,0.2)", backdropFilter: "blur(12px)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-4 h-4" style={{ color: "#bf00ff" }} />
            <span className="font-tech text-[10px] uppercase tracking-widest" style={{ color: "#bf00ff" }}>
              {t("profile.language")}
            </span>
            <div className="flex-1 h-[1px] ml-1" style={{ background: "linear-gradient(90deg, rgba(191,0,255,0.4), transparent)" }} />
          </div>
          <div className="flex gap-3">
            {(["ru", "en"] as const).map((code) => {
              const color  = code === "ru" ? "#bf00ff" : "#00f0ff";
              const label  = code === "ru" ? t("profile.langRu") : t("profile.langEn");
              const active = lang === code;
              return (
                <motion.button key={code} onClick={() => switchLang(code)} whileTap={{ scale: 0.94 }}
                  className="flex-1 py-3 font-display font-bold text-sm uppercase tracking-[0.3em] rounded-sm relative overflow-hidden transition-all"
                  style={langBtnStyle(code, color)}>
                  {active && (
                    <motion.div layoutId="lang-indicator" className="absolute inset-0 rounded-sm pointer-events-none"
                      style={{ background: `radial-gradient(ellipse at 50% 100%, ${color}20 0%, transparent 70%)` }} />
                  )}
                  <span className="relative z-10">{label}</span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* ── User card ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="p-5 flex items-center gap-5 rounded-sm"
          style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(0,240,255,0.15)", backdropFilter: "blur(12px)" }}>
          <div className="relative">
            <div className="rounded-sm p-[2px]" style={{ background: "linear-gradient(135deg, #00f0ff, #ff00cc)" }}>
              <div className="rounded-sm bg-black flex items-center justify-center" style={{ width: 68, height: 68 }}>
                <User className="w-9 h-9 text-white/40" />
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-black"
              style={{ background: "#00ff88", boxShadow: T.glow("#00ff88") }} />
          </div>
          <div>
            <h2 className="font-display font-bold text-xl text-white uppercase tracking-wider mb-1">GHOST_USER</h2>
            <p className="font-tech text-[10px] text-gray-500 uppercase tracking-widest">
              ID: {Math.random().toString(36).substring(2, 10).toUpperCase()}
            </p>
          </div>
        </motion.div>

        {/* ── Identity verification ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-sm overflow-hidden"
          style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="px-4 pt-4 pb-3 flex items-center gap-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            <Shield className="w-4 h-4" style={{ color: "#00f0ff" }} />
            <span className="font-tech text-[10px] uppercase tracking-widest text-gray-400">{t("profile.verify")}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 p-4">
            {[
              { label: t("profile.vkLinked"),    icon: Key,    color: "#00f0ff" },
              { label: t("profile.yandexLinked"), icon: Shield, color: "#ff00cc" },
            ].map(({ label, icon: Icon, color }) => (
              <div key={label} className="py-3 px-3 flex items-center gap-2 rounded-sm"
                style={{ background: `${color}06`, border: `1px solid ${color}20`, color }}>
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="font-tech text-[9px] uppercase tracking-wider truncate">{label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Privacy toggles ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="rounded-sm overflow-hidden"
          style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="px-4 pt-4 pb-3 flex items-center gap-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            <Shield className="w-4 h-4" style={{ color: "#ff00cc" }} />
            <span className="font-tech text-[10px] uppercase tracking-widest text-gray-400">{t("profile.privacy")}</span>
          </div>
          <div className="px-4 divide-y" style={{ borderColor: "rgba(255,255,255,0.03)" }}>
            <ToggleRow icon={Wifi}   label={t("profile.vpn")}           description={t("profile.vpnDesc")}           value={vpn}           onChange={setVpn}           neon="#00ff88" />
            <ToggleRow icon={Eye}    label={t("profile.tor")}           description={t("profile.torDesc")}           value={tor}           onChange={setTor}           neon="#00f0ff" />
            <ToggleRow icon={Bell}   label={t("profile.notifications")} description={t("profile.notificationsDesc")} value={notifications} onChange={setNotifications} neon="#ffd700" />
            <ToggleRow icon={Camera} label={t("profile.screenshots")}   description={t("profile.screenshotsDesc")}   value={screenshots}   onChange={setScreenshots}   neon="#bf00ff" />
          </div>
        </motion.div>

        {/* ── API endpoint ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="p-4 rounded-sm"
          style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4" style={{ color: "#ff00cc" }} />
              <span className="font-tech text-[10px] uppercase tracking-widest text-gray-400">{t("profile.apiEndpoint")}</span>
            </div>
            <button onClick={() => setEditingUrl(!editingUrl)} className="text-gray-600 hover:text-white transition-colors font-tech text-[9px] uppercase tracking-wider px-2 py-1"
              style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
              {editingUrl ? "✕" : "EDIT"}
            </button>
          </div>
          <AnimatePresence mode="wait">
            {editingUrl ? (
              <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex gap-2">
                <input type="text" value={apiUrl} onChange={(e) => setApiUrl(e.target.value)}
                  className="flex-1 bg-black px-3 py-2 text-sm font-mono focus:outline-none"
                  style={{ border: "1px solid rgba(0,240,255,0.4)", color: "#00f0ff", caretColor: "#00f0ff" }} />
                <button onClick={saveUrl} className="px-4 py-2 font-tech text-xs uppercase tracking-wider"
                  style={{ background: "rgba(0,240,255,0.1)", border: "1px solid rgba(0,240,255,0.4)", color: "#00f0ff" }}>
                  {t("profile.save")}
                </button>
              </motion.div>
            ) : (
              <motion.p key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="font-mono text-xs text-gray-500 truncate">
                {apiUrl}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Danger zone — Self-Destruct ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <div className="p-5 rounded-sm"
            style={{ background: "rgba(255,51,102,0.04)", border: "1px solid rgba(255,51,102,0.2)" }}>
            <div className="flex items-start gap-4 mb-5">
              <div className="p-2.5 rounded-sm"
                style={{ background: "rgba(255,51,102,0.12)", border: "1px solid rgba(255,51,102,0.3)" }}>
                <Skull className="w-5 h-5" style={{ color: "#ff3366" }} />
              </div>
              <div>
                <h3 className="font-display font-bold text-base uppercase tracking-wider mb-1"
                  style={{ color: "#ff3366", textShadow: T.glowText("#ff3366") }}>
                  {t("profile.protocolZero")}
                </h3>
                <p className="font-sans text-[11px] text-red-900 leading-relaxed">{t("profile.protocolDesc")}</p>
              </div>
            </div>
            <DestructButton onConfirm={selfDestruct}
              labels={{ idle: t("profile.selfDestruct"), armed: t("profile.tapAgain"), detonating: (c) => t("profile.detonating", { count: c }) }} />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
