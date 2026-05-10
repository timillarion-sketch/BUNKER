import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Check, Lock, Sparkles, Volume2, Palette, Eye } from "lucide-react";
import { T } from "@/lib/constants";
import { useTheme } from "@/context/ThemeContext";

// ── Config data ───────────────────────────────────────────
const EYE_SHAPES  = [
  { id: "round",   label: "Круглые",    icon: "●" },
  { id: "almond",  label: "Миндальные", icon: "◉" },
  { id: "sharp",   label: "Острые",     icon: "◈" },
  { id: "wide",    label: "Широкие",    icon: "⬤" },
];
const EYE_COLORS  = ["#00f0ff", "#ff00cc", "#00ff88", "#ffd700", "#bf00ff", "#ff3366"];
const EYEBROW_STYLES = [
  { id: "thin",     label: "Тонкие"    },
  { id: "thick",    label: "Густые"    },
  { id: "arched",   label: "Арочные"   },
  { id: "straight", label: "Прямые"    },
];
const MAKEUP_STYLES = [
  { id: "none",     label: "Нет",       emoji: "✦" },
  { id: "minimal",  label: "Минимал",   emoji: "◌" },
  { id: "dramatic", label: "Драматик",  emoji: "★" },
  { id: "cyber",    label: "Кибер",     emoji: "⬡" },
];
const VOICE_TYPES = [
  { id: "calm-f",     label: "Спокойный женский",   desc: "Мягкий и эмпатичный",          icon: "♀" },
  { id: "assertive-f",label: "Уверенный женский",    desc: "Прямой и энергичный",           icon: "♀" },
  { id: "deep-m",     label: "Глубокий мужской",     desc: "Харизматичный и авторитетный",  icon: "♂" },
  { id: "robotic",    label: "Роботизированный",     desc: "Синтетический и точный",        icon: "⚙" },
  { id: "whisper",    label: "Шёпот",                desc: "Таинственный и интимный",       icon: "〜" },
];
const PERSONALITIES = [
  { id: "warm",        label: "Тёплый",       color: "#ffd700" },
  { id: "cool",        label: "Холодный",     color: "#00f0ff" },
  { id: "aggressive",  label: "Агрессивный",  color: "#ff3366" },
  { id: "mysterious",  label: "Таинственный", color: "#bf00ff" },
];
const ACCENT_COLORS = ["#00f0ff", "#ff00cc", "#00ff88", "#ffd700", "#bf00ff"];

// ── Tier chips ────────────────────────────────────────────
const TIERS = [
  { id: "free", label: "Free",  color: "#00ff88", desc: "Кастомизация + чат без изображения", locked: false },
  { id: "lite", label: "Lite",  color: "#00f0ff", desc: "Генерация изображения + голос",       locked: true  },
  { id: "pro",  label: "Pro",   color: "#ffd700", desc: "Все персонажи + создание",            locked: true  },
];

// ── State type ────────────────────────────────────────────
interface CustomState {
  name:        string;
  eyeShape:    string;
  eyeColor:    string;
  eyebrows:    string;
  makeup:      string;
  voice:       string;
  personality: string;
  bgStyle:     "dark" | "techgray";
  accent:      string;
}

const DEFAULT: CustomState = {
  name: "", eyeShape: "almond", eyeColor: "#00f0ff", eyebrows: "arched",
  makeup: "minimal", voice: "calm-f", personality: "mysterious",
  bgStyle: "dark", accent: "#00f0ff",
};

// ── Helpers ───────────────────────────────────────────────
function buildPrompt(s: CustomState) {
  const eyeShape   = EYE_SHAPES.find(e => e.id === s.eyeShape)?.label ?? s.eyeShape;
  const eyebrow    = EYEBROW_STYLES.find(e => e.id === s.eyebrows)?.label ?? s.eyebrows;
  const makeupLbl  = MAKEUP_STYLES.find(e => e.id === s.makeup)?.label ?? s.makeup;
  const voiceLbl   = VOICE_TYPES.find(v => v.id === s.voice)?.label ?? s.voice;
  const persLbl    = PERSONALITIES.find(p => p.id === s.personality)?.label ?? s.personality;
  const bgLbl      = s.bgStyle === "dark" ? "тёмная" : "тех-серая";
  return `Создай аниме/киберпанк-персонажа${s.name ? ` «${s.name}»` : ""}:
• Форма глаз: ${eyeShape}
• Цвет глаз: ${s.eyeColor}
• Брови: ${eyebrow}
• Макияж: ${makeupLbl}
• Голос: ${voiceLbl}
• Личность: ${persLbl}
• Фон: ${bgLbl}, акцент ${s.accent}
• Стиль: киберпанк, неоновые блики, высокая детализация`;
}

// ── Step components ───────────────────────────────────────
function StepAppearance({ s, set }: { s: CustomState; set: (p: Partial<CustomState>) => void }) {
  return (
    <div className="space-y-6">
      {/* Name */}
      <div>
        <p className="font-tech text-[10px] uppercase tracking-widest text-gray-500 mb-2">Имя персонажа</p>
        <input
          type="text" value={s.name} onChange={e => set({ name: e.target.value })}
          placeholder="Введи имя..."
          className="w-full bg-transparent px-4 py-3 font-display text-sm text-white uppercase tracking-wider focus:outline-none"
          style={{ background: "rgba(0,0,0,0.5)", border: `1px solid ${s.accent}35`, caretColor: s.accent }}
        />
      </div>

      {/* Eye Shape */}
      <div>
        <p className="font-tech text-[10px] uppercase tracking-widest text-gray-500 mb-2 flex items-center gap-1.5">
          <Eye className="w-3 h-3" /> Форма глаз
        </p>
        <div className="grid grid-cols-4 gap-2">
          {EYE_SHAPES.map(es => (
            <motion.button key={es.id} whileTap={{ scale: 0.95 }} onClick={() => set({ eyeShape: es.id })}
              className="py-3 flex flex-col items-center gap-1.5 rounded-sm transition-all"
              style={{
                background: s.eyeShape === es.id ? `${s.accent}18` : "rgba(0,0,0,0.4)",
                border:     `1px solid ${s.eyeShape === es.id ? `${s.accent}60` : "rgba(255,255,255,0.07)"}`,
                boxShadow:  s.eyeShape === es.id ? T.glow(s.accent) : undefined,
              }}>
              <span className="text-lg" style={{ color: s.eyeShape === es.id ? s.accent : "#444" }}>{es.icon}</span>
              <span className="font-tech text-[8px] uppercase tracking-wider"
                style={{ color: s.eyeShape === es.id ? s.accent : "#333" }}>
                {es.label}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Eye Color */}
      <div>
        <p className="font-tech text-[10px] uppercase tracking-widest text-gray-500 mb-2">Цвет глаз</p>
        <div className="flex gap-3 flex-wrap">
          {EYE_COLORS.map(c => (
            <motion.button key={c} whileTap={{ scale: 0.9 }} onClick={() => set({ eyeColor: c })}
              className="w-9 h-9 rounded-sm relative"
              style={{ background: c, boxShadow: s.eyeColor === c ? T.glow(c) : undefined }}>
              {s.eyeColor === c && (
                <Check className="absolute inset-0 m-auto w-4 h-4 text-black" />
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Eyebrows */}
      <div>
        <p className="font-tech text-[10px] uppercase tracking-widest text-gray-500 mb-2">Брови</p>
        <div className="grid grid-cols-2 gap-2">
          {EYEBROW_STYLES.map(eb => (
            <motion.button key={eb.id} whileTap={{ scale: 0.96 }} onClick={() => set({ eyebrows: eb.id })}
              className="py-2.5 font-tech text-xs uppercase tracking-wider rounded-sm transition-all"
              style={{
                background: s.eyebrows === eb.id ? `${s.accent}18` : "rgba(0,0,0,0.4)",
                border:     `1px solid ${s.eyebrows === eb.id ? `${s.accent}50` : "rgba(255,255,255,0.07)"}`,
                color:      s.eyebrows === eb.id ? s.accent : "#444",
              }}>
              {eb.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Makeup */}
      <div>
        <p className="font-tech text-[10px] uppercase tracking-widest text-gray-500 mb-2">Макияж</p>
        <div className="grid grid-cols-4 gap-2">
          {MAKEUP_STYLES.map(mk => (
            <motion.button key={mk.id} whileTap={{ scale: 0.95 }} onClick={() => set({ makeup: mk.id })}
              className="py-3 flex flex-col items-center gap-1 rounded-sm transition-all"
              style={{
                background: s.makeup === mk.id ? `${s.accent}18` : "rgba(0,0,0,0.4)",
                border:     `1px solid ${s.makeup === mk.id ? `${s.accent}55` : "rgba(255,255,255,0.07)"}`,
              }}>
              <span className="text-base" style={{ color: s.makeup === mk.id ? s.accent : "#333" }}>{mk.emoji}</span>
              <span className="font-tech text-[7px] uppercase tracking-wider"
                style={{ color: s.makeup === mk.id ? s.accent : "#2a2a2a" }}>
                {mk.label}
              </span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepVoice({ s, set }: { s: CustomState; set: (p: Partial<CustomState>) => void }) {
  return (
    <div className="space-y-6">
      {/* Voice Type */}
      <div>
        <p className="font-tech text-[10px] uppercase tracking-widest text-gray-500 mb-3 flex items-center gap-1.5">
          <Volume2 className="w-3 h-3" /> Тип голоса
        </p>
        <div className="space-y-2">
          {VOICE_TYPES.map(v => (
            <motion.button key={v.id} whileTap={{ scale: 0.98 }} onClick={() => set({ voice: v.id })}
              className="w-full flex items-center gap-4 p-4 rounded-sm text-left transition-all"
              style={{
                background: s.voice === v.id ? `${s.accent}10` : "rgba(0,0,0,0.4)",
                border:     `1px solid ${s.voice === v.id ? `${s.accent}45` : "rgba(255,255,255,0.07)"}`,
                boxShadow:  s.voice === v.id ? `0 0 12px ${s.accent}10` : undefined,
              }}>
              <span className="text-xl w-6 text-center" style={{ color: s.voice === v.id ? s.accent : "#333" }}>
                {v.icon}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold text-xs uppercase tracking-wider"
                  style={{ color: s.voice === v.id ? "white" : "#555" }}>{v.label}</p>
                <p className="font-tech text-[9px] mt-0.5 tracking-wider"
                  style={{ color: s.voice === v.id ? `${s.accent}80` : "#2a2a2a" }}>{v.desc}</p>
              </div>
              {s.voice === v.id && <Check className="w-4 h-4 shrink-0" style={{ color: s.accent }} />}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Personality */}
      <div>
        <p className="font-tech text-[10px] uppercase tracking-widest text-gray-500 mb-3">Личность</p>
        <div className="grid grid-cols-2 gap-2">
          {PERSONALITIES.map(p => (
            <motion.button key={p.id} whileTap={{ scale: 0.95 }} onClick={() => set({ personality: p.id })}
              className="py-4 rounded-sm font-display font-bold text-xs uppercase tracking-widest transition-all"
              style={{
                background: s.personality === p.id ? `${p.color}18` : "rgba(0,0,0,0.4)",
                border:     `1px solid ${s.personality === p.id ? `${p.color}55` : "rgba(255,255,255,0.07)"}`,
                color:      s.personality === p.id ? p.color : "#333",
                boxShadow:  s.personality === p.id ? T.glow(p.color) : undefined,
              }}>
              {p.label}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepAtmosphere({ s, set }: { s: CustomState; set: (p: Partial<CustomState>) => void }) {
  return (
    <div className="space-y-6">
      {/* Background Style */}
      <div>
        <p className="font-tech text-[10px] uppercase tracking-widest text-gray-500 mb-3 flex items-center gap-1.5">
          <Palette className="w-3 h-3" /> Стиль фона
        </p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { id: "dark",     label: "Глубокая тьма",  bg: "#050508", desc: "Абсолютный чёрный" },
            { id: "techgray", label: "Тех-серый",       bg: "#0d1117", desc: "Технологичный серый" },
          ].map(opt => {
            const active = s.bgStyle === opt.id;
            return (
              <motion.button key={opt.id} whileTap={{ scale: 0.96 }} onClick={() => set({ bgStyle: opt.id as any })}
                className="relative overflow-hidden py-5 flex flex-col items-center gap-2 rounded-sm transition-all"
                style={{
                  background: active ? `${s.accent}12` : "rgba(0,0,0,0.4)",
                  border:     `1px solid ${active ? `${s.accent}50` : "rgba(255,255,255,0.07)"}`,
                }}>
                <div className="w-10 h-6 rounded-sm" style={{ background: opt.bg, border: "1px solid rgba(255,255,255,0.1)" }} />
                <span className="font-display font-bold text-[10px] uppercase tracking-wider"
                  style={{ color: active ? s.accent : "#444" }}>{opt.label}</span>
                <span className="font-tech text-[8px]" style={{ color: active ? `${s.accent}70` : "#252525" }}>
                  {opt.desc}
                </span>
                {active && <Check className="absolute top-2 right-2 w-3 h-3" style={{ color: s.accent }} />}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Accent Color */}
      <div>
        <p className="font-tech text-[10px] uppercase tracking-widest text-gray-500 mb-3">Акцентный цвет</p>
        <div className="flex gap-4 flex-wrap">
          {ACCENT_COLORS.map(c => (
            <motion.button key={c} whileTap={{ scale: 0.88 }} onClick={() => set({ accent: c })}
              className="w-12 h-12 rounded-sm relative flex items-center justify-center"
              style={{
                background: `${c}18`,
                border:     `2px solid ${s.accent === c ? c : `${c}35`}`,
                boxShadow:  s.accent === c ? T.glow(c) : undefined,
              }}>
              <div className="w-5 h-5 rounded-full" style={{ background: c }} />
              {s.accent === c && (
                <Check className="absolute top-1 right-1 w-2.5 h-2.5" style={{ color: c }} />
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Preview panel */}
      <div className="p-4 rounded-sm" style={{ background: `${s.accent}07`, border: `1px solid ${s.accent}20` }}>
        <p className="font-tech text-[9px] uppercase tracking-widest mb-2" style={{ color: `${s.accent}80` }}>
          Предпросмотр атмосферы
        </p>
        <div className="h-16 rounded-sm flex items-center justify-center"
          style={{ background: s.bgStyle === "dark" ? "#050508" : "#0d1117", border: `1px solid ${s.accent}30` }}>
          <span className="font-display font-black text-sm uppercase tracking-widest"
            style={{ color: s.accent, textShadow: T.glowText(s.accent) }}>
            {s.name || "ПЕРСОНАЖ"}
          </span>
        </div>
      </div>
    </div>
  );
}

function StepResult({ s }: { s: CustomState }) {
  const prompt = buildPrompt(s);
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard?.writeText(prompt).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-5">
      {/* Character preview */}
      <div className="p-5 rounded-sm flex flex-col items-center gap-3 text-center"
        style={{ background: `${s.accent}08`, border: `1px solid ${s.accent}25` }}>
        <motion.div
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-20 h-20 rounded-sm flex items-center justify-center text-5xl"
          style={{ background: `${s.accent}10`, border: `1px solid ${s.accent}30` }}>
          ✦
        </motion.div>
        <div>
          <h3 className="font-display font-black text-xl uppercase tracking-widest text-white"
            style={{ textShadow: T.glowText(s.accent) }}>
            {s.name || "НОВЫЙ ПЕРСОНАЖ"}
          </h3>
          <p className="font-tech text-[10px] mt-1 uppercase tracking-widest" style={{ color: `${s.accent}70` }}>
            {VOICE_TYPES.find(v => v.id === s.voice)?.label} · {PERSONALITIES.find(p => p.id === s.personality)?.label}
          </p>
        </div>
      </div>

      {/* Generated prompt */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="font-tech text-[10px] uppercase tracking-widest text-gray-500 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" /> Промпт генерации
          </p>
          <motion.button whileTap={{ scale: 0.95 }} onClick={copy}
            className="flex items-center gap-1 px-2 py-1 rounded-sm font-tech text-[8px] uppercase tracking-wider"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#666" }}>
            {copied ? <Check className="w-2.5 h-2.5" /> : null}
            {copied ? "Скопировано" : "Копировать"}
          </motion.button>
        </div>
        <div className="p-3 rounded-sm" style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="font-mono text-[10px] text-gray-500 leading-relaxed whitespace-pre-line">{prompt}</p>
        </div>
      </div>

      {/* Subscription tiers */}
      <div>
        <p className="font-tech text-[10px] uppercase tracking-widest text-gray-600 mb-3">Тарифные планы</p>
        <div className="space-y-2">
          {TIERS.map(tier => (
            <div key={tier.id}
              className="flex items-center gap-3 p-3.5 rounded-sm"
              style={{
                background: tier.locked ? "rgba(0,0,0,0.3)" : `${tier.color}08`,
                border:     `1px solid ${tier.locked ? "rgba(255,255,255,0.06)" : `${tier.color}30`}`,
              }}>
              <div className="w-8 h-8 rounded-sm shrink-0 flex items-center justify-center"
                style={{ background: tier.locked ? "rgba(255,255,255,0.03)" : `${tier.color}15`, border: `1px solid ${tier.locked ? "rgba(255,255,255,0.08)" : `${tier.color}35`}` }}>
                {tier.locked
                  ? <Lock className="w-3.5 h-3.5" style={{ color: "#333" }} />
                  : <Check className="w-3.5 h-3.5" style={{ color: tier.color }} />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold text-xs uppercase tracking-widest"
                  style={{ color: tier.locked ? "#333" : tier.color }}>
                  {tier.label}
                </p>
                <p className="font-tech text-[9px] mt-0.5 tracking-wider" style={{ color: tier.locked ? "#222" : `${tier.color}70` }}>
                  {tier.desc}
                </p>
              </div>
              {!tier.locked && (
                <span className="font-tech text-[8px] uppercase tracking-wider px-2 py-1 rounded-sm"
                  style={{ background: `${tier.color}15`, color: tier.color, border: `1px solid ${tier.color}30` }}>
                  Активно
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="space-y-2 pt-1">
        <motion.button whileTap={{ scale: 0.97 }}
          className="w-full py-4 font-display font-bold text-sm uppercase tracking-[0.2em] rounded-sm"
          style={{ background: `${s.accent}15`, border: `1px solid ${s.accent}50`, color: s.accent, boxShadow: T.glow(s.accent) }}>
          Начать общение (Free)
        </motion.button>
        <motion.button whileTap={{ scale: 0.97 }}
          className="w-full py-3.5 font-display font-bold text-xs uppercase tracking-[0.2em] rounded-sm flex items-center justify-center gap-2"
          style={{ background: "rgba(0,240,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#333" }}>
          <Lock className="w-3.5 h-3.5" />
          Разблокировать изображение (Lite)
        </motion.button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────
const STEPS = [
  { label: "Внешность", icon: Eye },
  { label: "Голос",     icon: Volume2 },
  { label: "Атмосфера", icon: Palette },
  { label: "Результат", icon: Sparkles },
];

export default function CharacterCustomizer() {
  const [, navigate] = useLocation();
  const { bg }       = useTheme();
  const [step, setStep]         = useState(0);
  const [state, setState]       = useState<CustomState>(DEFAULT);

  const set = (patch: Partial<CustomState>) => setState(prev => ({ ...prev, ...patch }));

  const accent = state.accent;

  return (
    <div className="flex flex-col min-h-screen" style={{ background: bg }}>
      {/* Grid bg */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: `linear-gradient(${accent}55 1px, transparent 1px), linear-gradient(90deg, ${accent}55 1px, transparent 1px)`, backgroundSize: "28px 28px" }} />

      {/* Header */}
      <header className="sticky top-0 z-20 px-4 py-4 flex items-center gap-3"
        style={{ background: `${bg}ee`, borderBottom: `1px solid ${accent}15`, backdropFilter: "blur(16px)" }}>
        <button onClick={() => navigate("/")} className="p-2 -ml-2 text-gray-500 hover:text-white transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex-1">
          <p className="font-tech text-[9px] uppercase tracking-widest" style={{ color: `${accent}70` }}>
            КОНСТРУКТОР ПЕРСОНАЖА
          </p>
          <h2 className="font-display font-bold text-base uppercase tracking-wider text-white">
            {STEPS[step].label}
          </h2>
        </div>
      </header>

      {/* Step progress */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-2">
        {STEPS.map((s, i) => {
          const done   = i < step;
          const active = i === step;
          const StepIcon = s.icon;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full h-1 rounded-full overflow-hidden"
                style={{ background: "rgba(255,255,255,0.06)" }}>
                <motion.div
                  animate={{ width: done || active ? "100%" : "0%" }}
                  transition={{ duration: 0.4 }}
                  className="h-full rounded-full"
                  style={{ background: done ? accent : active ? `${accent}80` : "transparent" }}
                />
              </div>
              <div className="flex items-center gap-1">
                <StepIcon className="w-2.5 h-2.5"
                  style={{ color: active ? accent : done ? `${accent}60` : "#2a2a2a" }} />
                <span className="font-tech text-[7px] uppercase tracking-wider hidden sm:block"
                  style={{ color: active ? accent : done ? `${accent}50` : "#2a2a2a" }}>
                  {s.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-32 no-scrollbar">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25 }}
          >
            {step === 0 && <StepAppearance s={state} set={set} />}
            {step === 1 && <StepVoice s={state} set={set} />}
            {step === 2 && <StepAtmosphere s={state} set={set} />}
            {step === 3 && <StepResult s={state} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="fixed bottom-0 inset-x-0 z-20 px-4 pb-6 pt-3 max-w-md mx-auto"
        style={{ background: `${bg}f0`, borderTop: `1px solid ${accent}12`, backdropFilter: "blur(16px)" }}>
        <div className="flex gap-3">
          {step > 0 && (
            <motion.button whileTap={{ scale: 0.96 }} onClick={() => setStep(s => s - 1)}
              className="flex-1 py-3.5 font-display font-bold text-xs uppercase tracking-widest rounded-sm flex items-center justify-center gap-2"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#666" }}>
              <ChevronLeft className="w-4 h-4" /> Назад
            </motion.button>
          )}
          {step < STEPS.length - 1 ? (
            <motion.button whileTap={{ scale: 0.96 }} onClick={() => setStep(s => s + 1)}
              className="flex-1 py-3.5 font-display font-bold text-sm uppercase tracking-widest rounded-sm flex items-center justify-center gap-2"
              style={{ background: `${accent}18`, border: `1px solid ${accent}55`, color: accent, boxShadow: T.glow(accent) }}>
              Далее <ChevronRight className="w-4 h-4" />
            </motion.button>
          ) : (
            <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate("/")}
              className="flex-1 py-3.5 font-display font-bold text-sm uppercase tracking-widest rounded-sm flex items-center justify-center gap-2"
              style={{ background: `${accent}18`, border: `1px solid ${accent}55`, color: accent, boxShadow: T.glow(accent) }}>
              <Check className="w-4 h-4" /> Готово
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}
