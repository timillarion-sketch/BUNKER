import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Sparkles, Film, Lock, ChevronRight } from "lucide-react";
import { T } from "@/lib/constants";
import { useTheme } from "@/context/ThemeContext";
import { useTranslation } from "react-i18next";

// ── Cinematic video placeholder ────────────────────────────
function VideoPlaceholder() {
  return (
    <div className="relative w-full rounded-sm overflow-hidden"
      style={{ aspectRatio: "9/14", background: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.06)" }}>
      {/* Film grain overlay */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "150px",
        }} />

      {/* Center icon */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
        <div className="relative">
          {[1, 2, 3].map(i => (
            <motion.div key={i}
              animate={{ scale: [1, 1.5 + i * 0.2, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ duration: 3, repeat: Infinity, delay: i * 0.7 }}
              className="absolute rounded-full border"
              style={{ inset: `${-i * 16}px`, borderColor: `rgba(0,240,255,${0.12 - i * 0.03})` }}
            />
          ))}
          <div className="relative w-16 h-16 rounded-sm flex items-center justify-center"
            style={{ background: "rgba(0,240,255,0.06)", border: "1px solid rgba(0,240,255,0.2)" }}>
            <Film className="w-8 h-8" style={{ color: "#00f0ff", filter: `drop-shadow(${T.glow("#00f0ff")})` }} />
          </div>
        </div>

        {/* Coming soon text */}
        <div className="text-center px-4">
          <motion.p
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            className="font-display font-black text-2xl uppercase tracking-widest text-white mb-2"
            style={{ textShadow: T.glowText("#00f0ff") }}>
            ПРИВАТНЫЕ РОЛИКИ
          </motion.p>
          <p className="font-tech text-xs uppercase tracking-[0.35em]"
            style={{ color: "rgba(0,240,255,0.4)" }}>
            скоро...
          </p>
        </div>

        {/* Lock badge */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-sm"
          style={{ background: "rgba(0,255,136,0.06)", border: "1px solid rgba(0,255,136,0.18)" }}>
          <Lock className="w-3 h-3" style={{ color: "#00ff88" }} />
          <span className="font-tech text-[9px] uppercase tracking-widest" style={{ color: "#00ff88" }}>
            Зашифрованная лента
          </span>
        </div>
      </div>

      {/* Scan line animation */}
      <motion.div
        animate={{ y: ["0%", "100%"] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        className="absolute inset-x-0 h-[2px] pointer-events-none"
        style={{ background: "linear-gradient(90deg, transparent, rgba(0,240,255,0.3), transparent)" }}
      />

      {/* Side timestamps (cinematic feel) */}
      <div className="absolute left-3 top-3 bottom-3 flex flex-col justify-between">
        {["00:00", "00:30", "01:00", "01:30"].map(t => (
          <span key={t} className="font-tech text-[8px] text-white/10 tracking-wider">{t}</span>
        ))}
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────
export default function Feed() {
  const { t }        = useTranslation();
  const { bg }       = useTheme();
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen pb-28 px-4 pt-12 no-scrollbar overflow-y-auto" style={{ background: bg }}>

      {/* Header row */}
      <header className="mb-6 flex items-start justify-between gap-3">
        <div>
          <p className="font-tech text-xs tracking-[0.3em] mb-1 uppercase"
            style={{ color: "#ff00cc", textShadow: T.glowText("#ff00cc") }}>
            {t("feed.subheader")}
          </p>
          <h1 className="font-display font-black text-3xl tracking-wider uppercase text-white"
            style={{ textShadow: T.glowText("#ff00cc") }}>
            {t("feed.header")}
          </h1>
          <div className="mt-3 h-[2px] w-14 rounded-full"
            style={{ background: "#ff00cc", boxShadow: T.glow("#ff00cc") }} />
        </div>

        {/* ── Prompts button ── */}
        <motion.button
          whileTap={{ scale: 0.94 }}
          whileHover={{ scale: 1.02 }}
          onClick={() => navigate("/prompts")}
          className="shrink-0 relative overflow-hidden rounded-sm px-4 py-3 flex flex-col items-center gap-1.5"
          style={{
            background:     "rgba(0,240,255,0.08)",
            border:         "1px solid rgba(0,240,255,0.35)",
            boxShadow:      T.glow("#00f0ff"),
            backdropFilter: "blur(12px)",
            minWidth:       80,
          }}
        >
          {/* Shimmer */}
          <motion.div
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
            className="absolute inset-y-0 w-8 pointer-events-none"
            style={{ background: "linear-gradient(90deg, transparent, rgba(0,240,255,0.2), transparent)" }}
          />
          <Sparkles className="w-5 h-5" style={{ color: "#00f0ff", filter: `drop-shadow(${T.glow("#00f0ff")})` }} />
          <span className="font-tech text-[8px] uppercase tracking-widest text-center leading-tight"
            style={{ color: "#00f0ff" }}>
            {t("feed.promptsBtn")}
          </span>
        </motion.button>
      </header>

      {/* Description */}
      <p className="font-sans text-xs text-gray-600 mb-5 leading-relaxed">
        {t("feed.videosDesc")}
      </p>

      {/* Video placeholder */}
      <VideoPlaceholder />

      {/* Prompts CTA row */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        onClick={() => navigate("/prompts")}
        className="mt-4 p-4 rounded-sm flex items-center gap-4 cursor-pointer"
        style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(0,240,255,0.12)", backdropFilter: "blur(8px)" }}
      >
        <div className="w-10 h-10 rounded-sm shrink-0 flex items-center justify-center"
          style={{ background: "rgba(0,240,255,0.08)", border: "1px solid rgba(0,240,255,0.2)" }}>
          <Sparkles className="w-5 h-5" style={{ color: "#00f0ff" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-sm text-white uppercase tracking-wide">
            {t("feed.promptsBtn")}
          </p>
          <p className="font-tech text-[10px] mt-0.5 uppercase tracking-wider text-gray-600">
            {t("feed.promptsDesc")}
          </p>
        </div>
        <ChevronRight className="w-4 h-4 shrink-0 text-gray-600" />
      </motion.div>
    </div>
  );
}
