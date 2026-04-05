import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Star, X, Cpu } from "lucide-react";
import { AI_CHARACTERS, T } from "@/lib/constants";
import { useTranslation } from "react-i18next";

const STATUS_COLORS: Record<string, string> = {
  online:  "#00ff88",
  busy:    "#ffd700",
  offline: "#ff3366",
};

// ── Premium "В разработке" modal ─────────────────────────
type LockedChar = (typeof AI_CHARACTERS)[number] & { locked: true };

function PremiumModal({ char, onClose }: { char: LockedChar; onClose: () => void }) {
  const neon = char.color.hex;
  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center px-6"
        style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)" }}
      >
        <motion.div
          key="modal"
          initial={{ scale: 0.88, opacity: 0, y: 24 }}
          animate={{ scale: 1,    opacity: 1, y: 0  }}
          exit={{    scale: 0.92, opacity: 0, y: 12 }}
          transition={{ type: "spring", stiffness: 320, damping: 26 }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-sm rounded-sm overflow-hidden"
          style={{
            background:    "rgba(5,5,12,0.97)",
            border:        `1px solid ${neon}35`,
            boxShadow:     `0 0 60px ${neon}18, 0 0 120px rgba(0,0,0,0.8)`,
            backdropFilter: "blur(24px)",
          }}
        >
          {/* Top accent line */}
          <div style={{ height: 2, background: `linear-gradient(90deg, transparent, ${neon}, transparent)` }} />

          <div className="p-7 flex flex-col items-center text-center gap-5">
            {/* Icon */}
            <div className="relative">
              <motion.div
                animate={{ opacity: [0.3, 0.65, 0.3], scale: [1, 1.12, 1] }}
                transition={{ duration: 2.8, repeat: Infinity }}
                className="absolute -inset-4 rounded-full pointer-events-none"
                style={{ background: `radial-gradient(circle, ${neon}22 0%, transparent 70%)` }}
              />
              <div
                className="w-16 h-16 rounded-sm flex items-center justify-center text-4xl relative z-10"
                style={{ background: `${neon}10`, border: `1px solid ${neon}35` }}
              >
                {char.avatar}
              </div>
            </div>

            {/* Access restricted label */}
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-sm"
              style={{ background: "rgba(255,215,0,0.08)", border: "1px solid rgba(255,215,0,0.3)" }}
            >
              <Lock className="w-3 h-3 text-yellow-400" />
              <span className="font-tech text-[10px] tracking-[0.3em] uppercase text-yellow-400">
                ДОСТУП ОГРАНИЧЕН
              </span>
            </div>

            {/* Body text */}
            <div className="space-y-2">
              <p className="font-sans text-sm text-white/90 leading-relaxed">
                Профиль{" "}
                <span className="font-bold" style={{ color: neon, textShadow: T.glowText(neon) }}>
                  «{char.name}»
                </span>{" "}
                проходит стадию нейронной калибровки.
              </p>
              <p className="font-sans text-sm text-white/60 leading-relaxed">
                Ожидайте развертывания в ближайших обновлениях системы{" "}
                <span className="font-bold text-white/80">БУНКЕР</span>.
              </p>
              <p className="font-sans text-xs text-gray-600 leading-relaxed pt-1">
                Чтобы не пропустить, следите за новостями проекта.
              </p>
            </div>

            {/* Specialty chip */}
            <div
              className="flex items-center gap-1.5 px-3 py-1 rounded-sm"
              style={{ background: `${neon}08`, border: `1px solid ${neon}20` }}
            >
              <Cpu className="w-3 h-3" style={{ color: neon }} />
              <span className="font-tech text-[9px] uppercase tracking-widest" style={{ color: `${neon}90` }}>
                {char.specialty}
              </span>
            </div>

            {/* OK button */}
            <motion.button
              onClick={onClose}
              whileTap={{ scale: 0.96 }}
              whileHover={{ scale: 1.02 }}
              className="w-full py-3.5 font-display font-bold text-sm uppercase tracking-[0.3em] rounded-sm"
              style={{
                background:  `${neon}12`,
                border:      `1px solid ${neon}50`,
                color:        neon,
                boxShadow:    T.glow(neon),
              }}
            >
              ОК
            </motion.button>
          </div>

          {/* Bottom accent */}
          <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${neon}40, transparent)` }} />
        </motion.div>

        {/* Close X */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-gray-600 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Characters grid ───────────────────────────────────────
export default function Characters() {
  const { t } = useTranslation();
  const [premiumModal, setPremiumModal] = useState<LockedChar | null>(null);

  const onlineCount = AI_CHARACTERS.filter(c => c.status === "online" && !c.locked).length;

  return (
    <div className="min-h-screen pb-28 px-4 pt-12 no-scrollbar overflow-y-auto">
      <header className="mb-8">
        <p className="font-tech text-xs tracking-[0.3em] mb-1 uppercase"
          style={{ color: "#00f0ff", textShadow: T.glowText("#00f0ff") }}>
          {t("characters.nodeStatus")} — {t("characters.onlineCount", { count: onlineCount })}
        </p>
        <h1 className="font-display font-black text-3xl tracking-wider uppercase text-white"
          style={{ textShadow: T.glowText("#00f0ff") }}>
          {t("characters.header")}
        </h1>
        <div className="mt-3 h-[2px] w-14 rounded-full"
          style={{ background: "#00f0ff", boxShadow: T.glow("#00f0ff") }} />
      </header>

      <div className="grid grid-cols-2 gap-4">
        {AI_CHARACTERS.map((char, i) => {
          const neon        = char.locked ? "#555" : char.color.hex;
          const statusColor = STATUS_COLORS[char.status] ?? "#888";

          const card = (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, type: "spring", stiffness: 260, damping: 20 }}
              whileTap={{ scale: 0.95 }}
              className="relative h-52 p-4 flex flex-col justify-between overflow-hidden rounded-sm cursor-pointer"
              style={{
                background:     char.locked ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0.55)",
                border:        `1px solid ${char.locked ? "rgba(255,255,255,0.07)" : `${neon}30`}`,
                boxShadow:      char.locked ? "none" : `inset 0 0 20px ${neon}08`,
                backdropFilter: "blur(12px)",
              }}
            >
              {/* Ambient glow — free only */}
              {!char.locked && (
                <motion.div
                  animate={{ opacity: [0.3, 0.7, 0.3] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
                  className="absolute top-0 right-0 w-16 h-16 rounded-full pointer-events-none"
                  style={{ background: `radial-gradient(circle, ${neon}30 0%, transparent 70%)` }}
                />
              )}

              {/* Hover scan sweep — free only */}
              {!char.locked && (
                <motion.div
                  initial={{ y: "-100%", opacity: 0 }}
                  whileHover={{ y: "400%", opacity: [0, 0.6, 0] }}
                  transition={{ duration: 0.6 }}
                  className="absolute inset-x-0 h-8 pointer-events-none"
                  style={{ background: `linear-gradient(0deg, transparent, ${neon}30, transparent)` }}
                />
              )}

              {/* Dim overlay — locked */}
              {char.locked && (
                <div className="absolute inset-0 rounded-sm pointer-events-none"
                  style={{ background: "rgba(0,0,0,0.42)" }} />
              )}

              {/* Top row */}
              <div className="flex items-start justify-between z-10">
                <div
                  className="w-11 h-11 rounded-sm flex items-center justify-center text-2xl"
                  style={{
                    background: char.locked ? "rgba(255,255,255,0.03)" : `${neon}12`,
                    border:    `1px solid ${char.locked ? "rgba(255,255,255,0.07)" : `${neon}35`}`,
                    filter:     char.locked ? "grayscale(0.85) brightness(0.55)" : undefined,
                  }}>
                  {char.avatar}
                </div>

                {char.locked ? (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-sm"
                    style={{ background: "rgba(255,215,0,0.1)", border: "1px solid rgba(255,215,0,0.32)" }}>
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span className="font-tech text-[9px] uppercase tracking-widest text-yellow-400">
                      {t("characters.premium")}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-sm"
                    style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <motion.div
                      animate={char.status === "online" ? { opacity: [1, 0.3, 1] } : {}}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: statusColor, boxShadow: `0 0 6px ${statusColor}` }}
                    />
                    <span className="font-tech text-[9px] uppercase tracking-widest" style={{ color: statusColor }}>
                      {t(`characters.status.${char.status}`)}
                    </span>
                  </div>
                )}
              </div>

              {/* Bottom */}
              <div className="z-10">
                <h3
                  className="font-display font-bold text-lg uppercase tracking-wide leading-tight"
                  style={{
                    color:      char.locked ? "#4a4a4a" : "white",
                    textShadow: char.locked ? "none" : T.glowText(neon),
                  }}>
                  {char.name}
                </h3>
                <p className="font-tech text-[11px] mt-1 uppercase tracking-wider"
                  style={{ color: char.locked ? "#2e2e2e" : "#555" }}>
                  {char.specialty}
                </p>

                {char.locked ? (
                  <div className="mt-3 flex items-center gap-1.5">
                    <Lock className="w-3 h-3 text-yellow-600" />
                    <span className="font-tech text-[9px] text-yellow-700 uppercase tracking-wider">
                      {t("characters.locked")}
                    </span>
                  </div>
                ) : (
                  <div className="mt-3 h-[1px] w-full rounded-full opacity-40"
                    style={{ background: `linear-gradient(90deg, ${neon}, transparent)` }} />
                )}
              </div>
            </motion.div>
          );

          // Locked → open premium modal; free → navigate to chat
          if (char.locked) {
            return (
              <div key={char.id} onClick={() => setPremiumModal(char as unknown as LockedChar)}>
                {card}
              </div>
            );
          }
          return <Link key={char.id} href={`/chat/${char.id}`}>{card}</Link>;
        })}
      </div>

      {/* Premium modal */}
      {premiumModal && (
        <PremiumModal char={premiumModal} onClose={() => setPremiumModal(null)} />
      )}
    </div>
  );
}
