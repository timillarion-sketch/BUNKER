import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, Search, Sparkles, ChevronRight, Zap } from "lucide-react";
import { T } from "@/lib/constants";

// ── Prompt data ───────────────────────────────────────────
const CATEGORIES = ["Все", "Видео", "Фото", "Бизнес", "Соцсети", "Аватар"] as const;

const CATEGORY_COLORS: Record<string, string> = {
  "Видео":   "#ff00cc",
  "Фото":    "#00f0ff",
  "Бизнес":  "#ffd700",
  "Соцсети": "#bf00ff",
  "Аватар":  "#00ff88",
};

const PROMPTS = [
  {
    id: "p1",
    emoji: "🎬",
    title: "Кино-фото",
    category: "Фото",
    desc: "Создай кинематографичный снимок с освещением Rembrandt и золотым часом",
    prompt: "Создай описание для генерации изображения: кинематографичный портрет с освещением Rembrandt, съёмка в золотой час, глубина поля, боке на фоне, профессиональная цветокоррекция, 8K, hyperrealistic.",
  },
  {
    id: "p2",
    emoji: "📹",
    title: "Вирусный Reels",
    category: "Видео",
    desc: "Сценарий 60-секундного Reels с хуком, кульминацией и призывом к действию",
    prompt: "Напиши сценарий 60-секундного Reels: 0-3 сек — резкий хук (вопрос или шок-факт), 3-45 сек — ценность или история с нарастающим напряжением, 45-60 сек — кульминация + призыв подписаться. Тема: [вставь тему].",
  },
  {
    id: "p3",
    emoji: "🧬",
    title: "3D Аватар",
    category: "Аватар",
    desc: "Настройка гиперреалистичного 3D-персонажа в стиле киберпанк",
    prompt: "Создай промпт для 3D-аватара: киберпанк эстетика, неоновое освещение #00f0ff и #ff00cc, голографические детали, текстура кожи hyperrealistic, рефлексы из HDR окружения, Unreal Engine 5 rendering, 4K.",
  },
  {
    id: "p4",
    emoji: "📊",
    title: "Контент-план",
    category: "Бизнес",
    desc: "30-дневный план публикаций для Instagram и TikTok с темами и форматами",
    prompt: "Составь контент-план на 30 дней для [ниша/бренд]. Формат таблицы: день, платформа (Instagram/TikTok), тип контента (Reels/пост/Stories), тема, хэштеги (5 шт), CTA. Распредели: 40% обучающий, 30% развлекательный, 20% продающий, 10% UGC.",
  },
  {
    id: "p5",
    emoji: "✍️",
    title: "Голос бренда",
    category: "Бизнес",
    desc: "Tone-of-voice гайдлайн с примерами правильных и неправильных формулировок",
    prompt: "Разработай tone-of-voice для бренда [название]. Опиши: 3 ключевых прилагательных, целевая аудитория, стиль общения (ты/вы), запрещённые слова и темы, 5 примеров правильных фраз, 5 примеров неправильных фраз, эмодзи политика.",
  },
  {
    id: "p6",
    emoji: "🛒",
    title: "Продающий текст",
    category: "Бизнес",
    desc: "Конвертирующее описание продукта по формуле AIDA",
    prompt: "Напиши продающий текст для [продукт] по формуле AIDA: Внимание (1 предложение-хук), Интерес (боль клиента + агравация), Желание (3 ключевых выгоды с доказательствами), Действие (призыв с ограниченностью). До 200 слов.",
  },
  {
    id: "p7",
    emoji: "📱",
    title: "Bio для соцсетей",
    category: "Соцсети",
    desc: "Цепляющая биография с ключевыми словами, эмодзи и призывом к действию",
    prompt: "Напиши 3 варианта bio для Instagram (до 150 символов каждое). Включи: кто я + что делаю + кому помогаю + результат/цифра + CTA с ссылкой. Используй эмодзи. Варианты: профессиональный, дерзкий, сторителлинг.",
  },
  {
    id: "p8",
    emoji: "🎯",
    title: "Портрет аудитории",
    category: "Бизнес",
    desc: "Детальный профиль ЦА с болями, триггерами и точками входа",
    prompt: "Составь детальный портрет целевой аудитории для [продукт/услуга]: демография, психография, основные боли (5 шт), скрытые страхи, триггеры покупки, возражения, где проводит время онлайн, любимые блогеры/форматы контента.",
  },
  {
    id: "p9",
    emoji: "🎥",
    title: "YouTube заголовки",
    category: "Видео",
    desc: "10 вариантов кликбейт-заголовков с прогнозируемым высоким CTR",
    prompt: "Придумай 10 заголовков для YouTube-видео на тему [тема]. Используй формулы: число + результат, секрет + выгода, ошибка + решение, я сделал X и вот что случилось, почему Y не работает. Добавь прогноз CTR (низкий/средний/высокий) для каждого.",
  },
];

// ── Long-press hook ───────────────────────────────────────
function useLongPress(callback: () => void, ms = 1400) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [holding, setHolding] = useState(false);

  const start = () => {
    setHolding(true);
    timerRef.current = setTimeout(() => { setHolding(false); callback(); }, ms);
  };
  const cancel = () => {
    setHolding(false);
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  return { holding, start, cancel };
}

// ── PromptCard ────────────────────────────────────────────
function PromptCard({ p, onCopy, copied }: {
  p: typeof PROMPTS[number];
  onCopy: (id: string, text: string) => void;
  copied: string | null;
}) {
  const color = CATEGORY_COLORS[p.category] ?? "#00f0ff";
  const isCopied = copied === p.id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      layout
      className="rounded-sm overflow-hidden flex flex-col"
      style={{
        background:     "rgba(8,8,16,0.85)",
        border:         `1px solid rgba(255,255,255,0.07)`,
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Card header */}
      <div className="p-4 flex items-start gap-3 flex-1">
        {/* Emoji */}
        <div
          className="w-10 h-10 rounded-sm shrink-0 flex items-center justify-center text-xl"
          style={{ background: `${color}10`, border: `1px solid ${color}25` }}
        >
          {p.emoji}
        </div>

        <div className="flex-1 min-w-0">
          {/* Category badge */}
          <span
            className="inline-block font-tech text-[8px] uppercase tracking-widest px-1.5 py-0.5 rounded-sm mb-2"
            style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}
          >
            {p.category}
          </span>

          <h3 className="font-display font-bold text-sm text-white uppercase tracking-wide leading-tight mb-1">
            {p.title}
          </h3>
          <p className="font-sans text-[11px] text-gray-500 leading-relaxed">
            {p.desc}
          </p>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "rgba(255,255,255,0.04)" }} />

      {/* Footer */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Zap className="w-3 h-3" style={{ color: `${color}60` }} />
          <span className="font-tech text-[9px] uppercase tracking-widest" style={{ color: `${color}60` }}>
            Шаблон готов
          </span>
        </div>

        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={() => onCopy(p.id, p.prompt)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm font-tech text-[10px] uppercase tracking-wider transition-all"
          style={{
            background: isCopied ? `${color}18` : "rgba(255,255,255,0.04)",
            border:     `1px solid ${isCopied ? `${color}50` : "rgba(255,255,255,0.1)"}`,
            color:      isCopied ? color : "#666",
            boxShadow:  isCopied ? T.glow(color) : undefined,
          }}
        >
          <AnimatePresence mode="wait" initial={false}>
            {isCopied ? (
              <motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                className="flex items-center gap-1.5">
                <Check className="w-3 h-3" />
                Скопировано
              </motion.span>
            ) : (
              <motion.span key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                className="flex items-center gap-1.5">
                <Copy className="w-3 h-3" />
                Шаблон
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </motion.div>
  );
}

// ── Page ─────────────────────────────────────────────────
export default function PromptFeed() {
  const [, navigate]        = useLocation();
  const [copied, setCopied] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("Все");
  const [unlockFlash, setUnlockFlash] = useState(false);

  const { holding, start, cancel } = useLongPress(() => {
    setUnlockFlash(true);
    setTimeout(() => { setUnlockFlash(false); navigate("/lobby"); }, 400);
  }, 1400);

  const copyPrompt = (id: string, text: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(id);
    setTimeout(() => setCopied(null), 1800);
  };

  const filtered = PROMPTS.filter(p => {
    const matchCat = category === "Все" || p.category === category;
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase())
      || p.desc.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen pb-28 no-scrollbar overflow-y-auto"
      style={{ background: "#050508" }}>

      {/* ── Unlock flash ── */}
      <AnimatePresence>
        {unlockFlash && (
          <motion.div key="flash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(0,240,255,0.18) 0%, transparent 70%)" }}
          />
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <div className="px-4 pt-12 pb-5">
        <div className="flex items-start justify-between mb-1">

          {/* Logo — long press to unlock lobby */}
          <div
            className="select-none cursor-default"
            onPointerDown={start}
            onPointerUp={cancel}
            onPointerLeave={cancel}
          >
            <p className="font-tech text-[10px] tracking-[0.35em] uppercase mb-1"
              style={{ color: "#00f0ff60" }}>
              AI PROMPT STUDIO
            </p>
            <motion.h1
              animate={holding
                ? { textShadow: [`0 0 10px #00f0ff40`, `0 0 30px #00f0ffcc`, `0 0 10px #00f0ff40`] }
                : { textShadow: "0 0 10px #00f0ff20" }
              }
              transition={holding ? { duration: 0.6, repeat: Infinity } : {}}
              className="font-display font-black text-3xl tracking-wider uppercase text-white"
            >
              ПРОМПТЫ
            </motion.h1>
            <div className="mt-2 h-[2px] w-14 rounded-full"
              style={{ background: "#00f0ff", boxShadow: T.glow("#00f0ff") }} />
          </div>

          {/* Stats chip */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm mt-1"
            style={{ background: "rgba(0,240,255,0.06)", border: "1px solid rgba(0,240,255,0.15)" }}>
            <Sparkles className="w-3 h-3" style={{ color: "#00f0ff" }} />
            <span className="font-tech text-[9px] uppercase tracking-widest" style={{ color: "#00f0ff" }}>
              {PROMPTS.length} шаблонов
            </span>
          </div>
        </div>
      </div>

      {/* ── Search ── */}
      <div className="px-4 mb-4">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-sm"
          style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <Search className="w-4 h-4 shrink-0 text-gray-600" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск шаблонов..."
            className="flex-1 bg-transparent text-sm font-sans focus:outline-none placeholder:text-gray-700"
            style={{ color: "rgba(255,255,255,0.85)", caretColor: "#00f0ff" }}
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-gray-600 hover:text-white transition-colors">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── Category pills ── */}
      <div className="px-4 mb-5 flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {CATEGORIES.map(cat => {
          const active = category === cat;
          const color  = cat === "Все" ? "#00f0ff" : (CATEGORY_COLORS[cat] ?? "#00f0ff");
          return (
            <motion.button
              key={cat}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCategory(cat)}
              className="shrink-0 px-3 py-1.5 rounded-sm font-tech text-[9px] uppercase tracking-widest transition-all"
              style={{
                background: active ? `${color}18` : "rgba(255,255,255,0.04)",
                border:     `1px solid ${active ? `${color}50` : "rgba(255,255,255,0.08)"}`,
                color:      active ? color : "#444",
                boxShadow:  active ? T.glow(color) : undefined,
              }}
            >
              {cat}
            </motion.button>
          );
        })}
      </div>

      {/* ── Cards ── */}
      <div className="px-4 space-y-3">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="py-16 text-center">
              <p className="font-tech text-xs uppercase tracking-widest text-gray-700">
                Шаблоны не найдены
              </p>
            </motion.div>
          ) : (
            filtered.map((p, i) => (
              <motion.div key={p.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ delay: i * 0.04 }}>
                <PromptCard p={p} onCopy={copyPrompt} copied={copied} />
              </motion.div>
            ))
          )}
        </AnimatePresence>

        {/* Secret hint — subtle */}
        <div className="py-6 text-center">
          <p className="font-tech text-[8px] uppercase tracking-[0.4em]"
            style={{ color: "rgba(255,255,255,0.04)" }}>
            v2.4.1 · СИСТЕМА АКТИВНА
          </p>
        </div>
      </div>
    </div>
  );
}
