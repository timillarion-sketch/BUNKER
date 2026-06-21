import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Star, X, Cpu, Plus, Zap } from "lucide-react";
import { AI_CHARACTERS, T } from "@/lib/constants";
import { useTheme } from "@/context/ThemeContext";
import { useTranslation } from "react-i18next";

const STATUS_COLORS: Record<string, string> = {
  online:  "#00ff88",
  busy:    "#ffd700",
  offline: "#ff3366",
};

// ── Pro Modal ─────────────────────────────────────────────
type LockedChar = (typeof AI_CHARACTERS)[number] & { locked: true };

function ProModal({ char, onClose }: { char: LockedChar; onClose: () => void }) {
  const neon = char.color.hex;
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(16px)" }}
    >
      <motion.div
        initial={{ scale: 0.88, y: 24, opacity: 0 }}
        animate={{ scale: 1,    y: 0,  opacity: 1 }}
        exit={{    scale: 0.92, y: 12, opacity: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-sm rounded-sm overflow-hidden"
        style={{
          background:     "rgba(5,5,12,0.98)",
          border:         `1px solid ${neon}35`,
          boxShadow:      `0 0 60px ${neon}18`,
          backdropFilter: "blur(24px)",
        }}
      >
        <div style={{ height: 2, background: `linear-gradient(90deg, transparent, ${neon}, transparent)` }} />
        <div className="p-7 flex flex-col items-center text-center gap-5">
          <motion.div
            animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.08, 1] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            className="w-16 h-16 rounded-sm flex items-center justify-center text-4xl"
            style={{ background: `${neon}10`, border: `1px solid ${neon}35` }}>
            {char.avatar}
          </motion.div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-sm"
            style={{ background: "rgba(255,215,0,0.08)", border: "1px solid rgba(255,215,0,0.3)" }}>
            <Lock className="w-3 h-3 text-yellow-400" />
            <span className="font-tech text-[10px] tracking-[0.3em] uppercase text-yellow-400">
              ДОСТУП ОГРАНИЧЕН
            </span>
          </div>
          <div className="space-y-2">
            <p className="font-sans text-sm text-white/90 leading-relaxed">
              Профиль{" "}
              <span className="font-bold" style={{ color: neon, textShadow: T.glowText(neon) }}>
                «{char.name}»
              </span>{" "}
              проходит стадию нейронной калибровки.
            </p>
            <p className="font-sans text-sm text-white/55 leading-relaxed">
              Ожидайте развертывания в ближайших обновлениях системы <strong className="text-white/70">БУНКЕР</strong>.
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-sm"
            style={{ background: `${neon}08`, border: `1px solid ${neon}20` }}>
            <Cpu className="w-3 h-3" style={{ color: neon }} />
            <span className="font-tech text-[9px] uppercase tracking-widest" style={{ color: `${neon}90` }}>
              {char.specialty}
            </span>
          </div>
          <motion.button onClick={onClose} whileTap={{ scale: 0.96 }}
            className="w-full py-3.5 font-display font-bold text-sm uppercase tracking-[0.3em] rounded-sm"
            style={{
              background: `${neon}12`, border: `1px solid ${neon}50`,
              color: neon, boxShadow: T.glow(neon),
            }}>
            ОК
          </motion.button>
        </div>
        <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${neon}40, transparent)` }} />
      </motion.div>
      <button onClick={onClose} className="absolute top-5 right-5 p-2 text-gray-600 hover:text-white transition-colors">
        <X className="w-5 h-5" />
      </button>
    </motion.div>
  );
}

// ── Character Card ────────────────────────────────────────
function CharCard({ char, index, onLockClick }: {
  char: typeof AI_CHARACTERS[number];
  index: number;
  onLockClick: () => void;
}) {
  const neon        = char.locked ? "#3a3a3a" : char.color.hex;
  const statusColor = STATUS_COLORS[char.status] ?? "#888";

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, type: "spring", stiffness: 260, damping: 20 }}
      whileTap={{ scale: 0.95 }}
      className="relative h-52 p-4 flex flex-col justify-between overflow-hidden rounded-sm cursor-pointer"
      style={{
        background:     char.locked ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.6)",
        border:         `1px solid ${char.locked ? "rgba(255,255,255,0.06)" : `${neon}28`}`,
        boxShadow:      char.locked ? "none" : `inset 0 0 20px ${neon}07`,
        backdropFilter: "blur(12px)",
      }}
      onClick={char.locked ? onLockClick : undefined}
    >
      {/* Ambient glow */}
      {!char.locked && (
        <motion.div
          animate={{ opacity: [0.3, 0.65, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, delay: index * 0.4 }}
          className="absolute top-0 right-0 w-20 h-20 rounded-full pointer-events-none"
          style={{ background: `radial-gradient(circle, ${neon}28 0%, transparent 70%)` }}
        />
      )}
      {/* Hover scan sweep */}
      {!char.locked && (
        <motion.div
          initial={{ y: "-100%", opacity: 0 }}
          whileHover={{ y: "400%", opacity: [0, 0.5, 0] }}
          transition={{ duration: 0.55 }}
          className="absolute inset-x-0 h-10 pointer-events-none"
          style={{ background: `linear-gradient(0deg, transparent, ${neon}28, transparent)` }}
        />
      )}
      {/* Locked overlay */}
      {char.locked && (
        <div className="absolute inset-0 rounded-sm pointer-events-none"
          style={{ background: "rgba(0,0,0,0.38)" }} />
      )}

      {/* Top row */}
      <div className="flex items-start justify-between z-10">
        <div className="w-11 h-11 rounded-sm flex items-center justify-center text-2xl"
          style={{
            background: char.locked ? "rgba(255,255,255,0.03)" : `${neon}12`,
            border:     `1px solid ${char.locked ? "rgba(255,255,255,0.06)" : `${neon}30`}`,
            filter:     char.locked ? "grayscale(0.9) brightness(0.5)" : undefined,
          }}>
          {char.avatar}
        </div>

        {char.locked ? (
          <div className="flex items-center gap-1 px-2 py-1 rounded-sm"
            style={{ background: "rgba(255,215,0,0.08)", border: "1px solid rgba(255,215,0,0.28)" }}>
            <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
            <span className="font-tech text-[9px] uppercase tracking-widest text-yellow-500">Pro</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-sm"
            style={{ background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <motion.div
              animate={char.status === "online" ? { opacity: [1, 0.3, 1] } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: statusColor, boxShadow: `0 0 5px ${statusColor}` }}
            />
            <span className="font-tech text-[9px] uppercase tracking-widest" style={{ color: statusColor }}>
              {STATUS_COLORS[char.status] ? char.status === "online" ? "Онлайн" : char.status === "busy" ? "Занят" : "Офлайн" : ""}
            </span>
          </div>
        )}
      </div>

      {/* Bottom */}
      <div className="z-10">
        <h3 className="font-display font-bold text-lg uppercase tracking-wide leading-tight"
          style={{ color: char.locked ? "#3a3a3a" : "white", textShadow: char.locked ? "none" : T.glowText(neon) }}>
          {char.name}
        </h3>
        <p className="font-tech text-[10px] mt-0.5 uppercase tracking-wider"
          style={{ color: char.locked ? "#252525" : "#4a4a4a" }}>
          {char.specialty}
        </p>
        {char.locked ? (
          <div className="mt-3 flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-yellow-700" />
            <span className="font-tech text-[9px] text-yellow-800 uppercase tracking-wider">Pro Feature</span>
          </div>
        ) : (
          <div className="mt-2.5 h-[1px] w-full rounded-full opacity-30"
            style={{ background: `linear-gradient(90deg, ${neon}, transparent)` }} />
        )}
      </div>
    </motion.div>
  );
}

// ── Create Your Own Card ──────────────────────────────────
function CreateCard({ index, onClick }: { index: number; onClick: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, type: "spring", stiffness: 260, damping: 20 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="relative h-52 p-4 flex flex-col items-center justify-center gap-3 overflow-hidden rounded-sm cursor-pointer"
      style={{
        background:     "rgba(0,0,0,0.35)",
        border:         "1px dashed rgba(0,240,255,0.2)",
        backdropFilter: "blur(12px)",
      }}
    >
      <motion.div
        animate={{ opacity: [0.15, 0.4, 0.15] }}
        transition={{ duration: 2.5, repeat: Infinity }}
        className="absolute inset-0 rounded-sm pointer-events-none"
        style={{ background: "radial-gradient(circle at center, rgba(0,240,255,0.05) 0%, transparent 70%)" }}
      />
      <div className="w-14 h-14 rounded-sm flex items-center justify-center relative"
        style={{ background: "rgba(0,240,255,0.06)", border: "1px dashed rgba(0,240,255,0.3)" }}>
        <span className="font-display font-black text-3xl text-white/20">?</span>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-sm"
          style={{ border: "1px dashed rgba(0,240,255,0.15)" }}
        />
      </div>
      <div className="text-center z-10">
        <p className="font-display font-bold text-sm uppercase tracking-wide text-white/50">Создать своего</p>
        <p className="font-tech text-[9px] mt-1 uppercase tracking-wider text-white/25">
          Настрой внешность и голос
        </p>
      </div>
      <div className="flex items-center gap-1 px-2 py-1 rounded-sm z-10"
        style={{ background: "rgba(0,240,255,0.05)", border: "1px solid rgba(0,240,255,0.15)" }}>
        <Plus className="w-2.5 h-2.5" style={{ color: "rgba(0,240,255,0.5)" }} />
        <span className="font-tech text-[8px] uppercase tracking-widest" style={{ color: "rgba(0,240,255,0.5)" }}>
          Конструктор
        </span>
      </div>
    </motion.div>
  );
}

// ── Page ─────────────────────────────────────────────────
export default function Characters() {
  const { t }   = useTranslation();
  const { bg }  = useTheme();
  const [, navigate] = useLocation();
  const [proModal, setProModal] = useState<LockedChar | null>(null);

  const freeChars = AI_CHARACTERS.filter(c => !c.locked);
  const proChars  = AI_CHARACTERS.filter(c => c.locked);
  const onlineCount = freeChars.filter(c => c.status === "online").length;

  return (
    <div className="min-h-screen pb-28 px-4 pt-12 no-scrollbar overflow-y-auto" style={{ background: bg }}>

      {/* Header */}
      <header className="mb-6">
        <p className="font-tech text-xs tracking-[0.3em] mb-1 uppercase"
          style={{ color: "#00f0ff", textShadow: T.glowText("#00f0ff") }}>
          {t("personnel.nodeStatus")} — {t("personnel.onlineCount", { count: onlineCount })}
        </p>
        <h1 className="font-display font-black text-3xl tracking-wider uppercase text-white"
          style={{ textShadow: T.glowText("#00f0ff") }}>
          {t("personnel.header")}
        </h1>
        <div className="mt-3 h-[2px] w-14 rounded-full"
          style={{ background: "#00f0ff", boxShadow: T.glow("#00f0ff") }} />
      </header>

      {/* ── Active agents ── */}
      <div className="mb-2 flex items-center gap-2">
        <Zap className="w-3 h-3" style={{ color: "#00ff88" }} />
        <span className="font-tech text-[10px] uppercase tracking-[0.3em]" style={{ color: "#00ff88" }}>
          {t("personnel.active")}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {freeChars.map((char, i) => (
          <Link key={char.id} href={`/chat/${char.id}`}>
            <CharCard char={char} index={i} onLockClick={() => {}} />
          </Link>
        ))}
      </div>

      {/* ── Pro agents ── */}
      <div className="mb-2 flex items-center gap-2">
        <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
        <span className="font-tech text-[10px] uppercase tracking-[0.3em] text-yellow-600">
          {t("personnel.pro")}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {proChars.map((char, i) => (
          <CharCard
            key={char.id}
            char={char}
            index={freeChars.length + i}
            onLockClick={() => setProModal(char as unknown as LockedChar)}
          />
        ))}
        {/* Create Your Own card */}
        <CreateCard
          index={freeChars.length + proChars.length}
          onClick={() => navigate("/character-create")}
        />
      </div>

      {/* Pro Modal */}
      <AnimatePresence>
        {proModal && <ProModal char={proModal} onClose={() => setProModal(null)} />}
      </AnimatePresence>
    </div>
  );
}
