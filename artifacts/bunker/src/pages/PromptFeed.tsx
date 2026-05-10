import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, Search, Sparkles, ChevronLeft, Zap } from "lucide-react";
import { T } from "@/lib/constants";
import { useTheme } from "@/context/ThemeContext";

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
  { id: "p1", emoji: "🎬", title: "Кино-фото",       category: "Фото",    desc: "Кинематографичный снимок с освещением Rembrandt и золотым часом",   prompt: "Создай описание для генерации изображения: кинематографичный портрет, освещение Rembrandt, золотой час, глубина резкости, боке, профессиональная цветокоррекция, 8K, hyperrealistic." },
  { id: "p2", emoji: "📹", title: "Вирусный Reels",  category: "Видео",   desc: "Сценарий 60-секундного Reels с хуком и призывом к действию",          prompt: "Напиши сценарий 60-секундного Reels: 0-3 сек — хук (вопрос/шок), 3-45 сек — ценность с нарастающим напряжением, 45-60 сек — кульминация + CTA. Тема: [вставь тему]." },
  { id: "p3", emoji: "🧬", title: "3D Аватар",       category: "Аватар",  desc: "Гиперреалистичный 3D-персонаж в стиле киберпанк",                      prompt: "Создай промпт для 3D-аватара: киберпанк, неоновое освещение #00f0ff и #ff00cc, голографические детали, hyperrealistic кожа, Unreal Engine 5, 4K." },
  { id: "p4", emoji: "📊", title: "Контент-план",    category: "Бизнес",  desc: "30-дневный план публикаций для Instagram и TikTok",                    prompt: "Контент-план на 30 дней для [ниша/бренд]. Таблица: день, платформа, тип (Reels/пост/Stories), тема, хэштеги, CTA. 40% обучающий, 30% развлеч., 20% продающий, 10% UGC." },
  { id: "p5", emoji: "✍️", title: "Голос бренда",   category: "Бизнес",  desc: "Tone-of-voice гайдлайн с примерами правильных формулировок",           prompt: "Разработай tone-of-voice для [бренда]: 3 прилагательных, аудитория, ты/вы, запрещённые слова, 5 правильных фраз, 5 неправильных фраз, эмодзи-политика." },
  { id: "p6", emoji: "🛒", title: "Продающий текст", category: "Бизнес",  desc: "Конвертирующее описание продукта по формуле AIDA",                     prompt: "Продающий текст для [продукта] по AIDA: Внимание (хук), Интерес (боль+агравация), Желание (3 выгоды с доказательствами), Действие (ограниченный CTA). До 200 слов." },
  { id: "p7", emoji: "📱", title: "Bio соцсетей",    category: "Соцсети", desc: "Цепляющая биография с ключевыми словами и CTA",                        prompt: "Напиши 3 варианта Instagram bio (до 150 символов). Включи: кто я + что делаю + кому помогаю + результат + CTA. Варианты: профессиональный, дерзкий, сторителлинг." },
  { id: "p8", emoji: "🎯", title: "Портрет ЦА",      category: "Бизнес",  desc: "Детальный профиль целевой аудитории с болями и триггерами",             prompt: "Портрет ЦА для [продукта]: демография, психография, 5 болей, скрытые страхи, триггеры покупки, возражения, онлайн-среда, форматы контента." },
  { id: "p9", emoji: "🎥", title: "YouTube заголовки", category: "Видео", desc: "10 вариантов кликбейт-заголовков с прогнозом CTR",                     prompt: "10 заголовков YouTube на тему [тема]. Формулы: число+результат, секрет+выгода, ошибка+решение. Добавь прогноз CTR (низкий/средний/высокий)." },
];

function PromptCard({ p, onCopy, copied }: { p: typeof PROMPTS[number]; onCopy: (id: string, text: string) => void; copied: string | null }) {
  const color    = CATEGORY_COLORS[p.category] ?? "#00f0ff";
  const isCopied = copied === p.id;
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} layout
      className="rounded-sm overflow-hidden flex flex-col"
      style={{ background: "rgba(8,8,16,0.88)", border: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(12px)" }}>
      <div className="p-4 flex items-start gap-3 flex-1">
        <div className="w-10 h-10 rounded-sm shrink-0 flex items-center justify-center text-xl"
          style={{ background: `${color}10`, border: `1px solid ${color}22` }}>
          {p.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <span className="inline-block font-tech text-[8px] uppercase tracking-widest px-1.5 py-0.5 rounded-sm mb-2"
            style={{ background: `${color}14`, color, border: `1px solid ${color}28` }}>
            {p.category}
          </span>
          <h3 className="font-display font-bold text-sm text-white uppercase tracking-wide leading-tight mb-1">{p.title}</h3>
          <p className="font-sans text-[11px] text-gray-500 leading-relaxed">{p.desc}</p>
        </div>
      </div>
      <div style={{ height: 1, background: "rgba(255,255,255,0.04)" }} />
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Zap className="w-3 h-3" style={{ color: `${color}55` }} />
          <span className="font-tech text-[8px] uppercase tracking-widest" style={{ color: `${color}55` }}>Готов</span>
        </div>
        <motion.button whileTap={{ scale: 0.94 }} onClick={() => onCopy(p.id, p.prompt)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm font-tech text-[10px] uppercase tracking-wider transition-all"
          style={{
            background: isCopied ? `${color}18` : "rgba(255,255,255,0.04)",
            border:     `1px solid ${isCopied ? `${color}50` : "rgba(255,255,255,0.08)"}`,
            color:      isCopied ? color : "#555",
            boxShadow:  isCopied ? T.glow(color) : undefined,
          }}>
          <AnimatePresence mode="wait" initial={false}>
            {isCopied
              ? <motion.span key="c" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex items-center gap-1.5"><Check className="w-3 h-3" />Скопировано</motion.span>
              : <motion.span key="n" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex items-center gap-1.5"><Copy className="w-3 h-3" />Шаблон</motion.span>
            }
          </AnimatePresence>
        </motion.button>
      </div>
    </motion.div>
  );
}

export default function PromptFeed() {
  const [, navigate]        = useLocation();
  const { bg }              = useTheme();
  const [copied, setCopied] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("Все");

  const copyPrompt = (id: string, text: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(id);
    setTimeout(() => setCopied(null), 1800);
  };

  const filtered = PROMPTS.filter(p => {
    const matchCat    = category === "Все" || p.category === category;
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.desc.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen pb-28 no-scrollbar overflow-y-auto" style={{ background: bg }}>

      {/* Header */}
      <div className="px-4 pt-12 pb-4">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => navigate("/feed")}
            className="p-2 -ml-2 text-gray-500 hover:text-white transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <p className="font-tech text-[10px] tracking-[0.35em] uppercase mb-0.5" style={{ color: "#00f0ff60" }}>
              AI PROMPT STUDIO
            </p>
            <h1 className="font-display font-black text-2xl tracking-wider uppercase text-white"
              style={{ textShadow: T.glowText("#00f0ff") }}>
              ПРОМПТЫ
            </h1>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm"
            style={{ background: "rgba(0,240,255,0.06)", border: "1px solid rgba(0,240,255,0.15)" }}>
            <Sparkles className="w-3 h-3" style={{ color: "#00f0ff" }} />
            <span className="font-tech text-[9px] uppercase tracking-widest" style={{ color: "#00f0ff" }}>
              {PROMPTS.length}
            </span>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-sm mb-4"
          style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <Search className="w-4 h-4 shrink-0 text-gray-700" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Поиск шаблонов..."
            className="flex-1 bg-transparent text-sm font-sans focus:outline-none placeholder:text-gray-700"
            style={{ color: "rgba(255,255,255,0.85)", caretColor: "#00f0ff" }} />
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {CATEGORIES.map(cat => {
            const active = category === cat;
            const color  = cat === "Все" ? "#00f0ff" : (CATEGORY_COLORS[cat] ?? "#00f0ff");
            return (
              <motion.button key={cat} whileTap={{ scale: 0.95 }} onClick={() => setCategory(cat)}
                className="shrink-0 px-3 py-1.5 rounded-sm font-tech text-[9px] uppercase tracking-widest transition-all"
                style={{
                  background: active ? `${color}18` : "rgba(255,255,255,0.04)",
                  border:     `1px solid ${active ? `${color}50` : "rgba(255,255,255,0.07)"}`,
                  color:      active ? color : "#3a3a3a",
                  boxShadow:  active ? T.glow(color) : undefined,
                }}>
                {cat}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Cards */}
      <div className="px-4 space-y-3">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="py-16 text-center">
              <p className="font-tech text-xs uppercase tracking-widest text-gray-700">Шаблоны не найдены</p>
            </motion.div>
          ) : filtered.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }} transition={{ delay: i * 0.04 }}>
              <PromptCard p={p} onCopy={copyPrompt} copied={copied} />
            </motion.div>
          ))}
        </AnimatePresence>
        <div className="py-4 text-center">
          <p className="font-tech text-[8px] uppercase tracking-[0.4em]" style={{ color: "rgba(255,255,255,0.04)" }}>
            v2.5.0 · СИСТЕМА АКТИВНА
          </p>
        </div>
      </div>
    </div>
  );
}
