import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Send, RefreshCw, Sparkles, Copy, Check } from "lucide-react";
import { T, CHARACTER_ID_MAP } from "@/lib/constants";
import { api } from "@/lib/api";
import { useTheme } from "@/context/ThemeContext";

// ── Branch tree ───────────────────────────────────────────
const NEON = "#00e5cc"; // teal accent for producer

type Leaf = { label: string; template: string };
type Branch = { label: string; emoji: string; subs: Record<string, Leaf> };

const TREE: Record<string, Branch> = {
  photo: {
    label: "Контент для Фото",
    emoji: "📷",
    subs: {
      cinematic: { label: "Кино-фото",        template: "Опиши кинематографичную фотосессию: освещение Rembrandt, золотой час, боке f/1.2, цветокоррекция в стиле film noir. Объект съёмки: [добавь свои детали]." },
      portrait:  { label: "Портрет",           template: "Концепция портретной съёмки: атмосфера, гардероб, локация, настроение, психологический портрет через взгляд. Объект: [добавь]." },
      product:   { label: "Продуктовая",       template: "Сценарий продуктовой съёмки: фон, схема освещения, дополнительные элементы композиции, акцентный цвет. Продукт: [добавь]." },
    },
  },
  video: {
    label: "Контент для Видео",
    emoji: "🎬",
    subs: {
      reels:   { label: "Viral Reels",     template: "Сценарий 60-сек Reels: 0–3 сек хук → 3–45 сек нарастающая ценность → 45–60 сек кульминация + CTA. Тема: [добавь]." },
      youtube: { label: "YouTube",          template: "Структура YouTube-видео: цепляющий хук, вступление, 3 смысловых блока, кульминация, мощный CTA. Тема: [добавь]." },
      stories: { label: "Истории / Stories", template: "5 последовательных Stories: интрига → вовлечение → ценность → социальное доказательство → призыв к действию. Тема: [добавь]." },
    },
  },
  business: {
    label: "Бизнес-идеи",
    emoji: "📊",
    subs: {
      plan:  { label: "Контент-план",     template: "30-дневный контент-план: 40% обучающий, 30% развлекательный, 20% продающий, 10% UGC. Форматы и хэштеги. Ниша: [добавь]." },
      voice: { label: "Голос бренда",     template: "Tone-of-voice гайдлайн: 3 прилагательных, ты/вы, запрещённые слова, 5 правильных фраз, 5 неправильных. Бренд: [добавь]." },
      sales: { label: "Продающий текст",  template: "AIDA-текст (200 слов): Внимание (шок/хук) → Интерес (боль+агравация) → Желание (3 выгоды) → Действие (срочность). Продукт: [добавь]." },
    },
  },
  social: {
    label: "Соцсети",
    emoji: "📱",
    subs: {
      bio:      { label: "Bio профиля",     template: "3 варианта Instagram bio (≤150 символов): профессиональный, дерзкий, сторителлинг. Кто ты и что делаешь: [добавь]." },
      target:   { label: "Целевая аудитория", template: "Детальный портрет ЦА: демография, психография, 5 болей, триггеры покупки, возражения, онлайн-среда. Продукт: [добавь]." },
      hashtags: { label: "Хэштеги",          template: "Стратегия хэштегов: 5 высоко-, 10 средне-, 10 низкочастотных. Сохранные группы под сохранки. Ниша: [добавь]." },
    },
  },
};

// ── Message types ─────────────────────────────────────────
type MsgKind = "assistant" | "user-choice" | "template" | "custom-input" | "result" | "error";

interface Msg {
  id:       string;
  kind:     MsgKind;
  text:     string;
  buttons?: Array<{ label: string; emoji?: string; onClick: () => void }>;
}

async function sendToBackend(message: string): Promise<string> {
  const data = await api.post<{ reply: string }>("/ai/chat", {
    message,
    characterId: CHARACTER_ID_MAP["content-producer"],
  });
  return data.reply;
}

// ── Message bubble ────────────────────────────────────────
function Bubble({ msg, isNew }: { msg: Msg; isNew: boolean }) {
  const [copied, setCopied] = useState(false);
  const isUser = msg.kind === "user-choice";

  const copy = (text: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <motion.div
      initial={isNew ? { opacity: 0, y: 12 } : { opacity: 1 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 24 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && (
        <div className="w-7 h-7 rounded-sm flex items-center justify-center text-sm mr-2 mt-1 shrink-0"
          style={{ background: `${NEON}12`, border: `1px solid ${NEON}25` }}>
          🎬
        </div>
      )}
      <div className="max-w-[85%]">
        <div
          className="px-4 py-3 relative"
          style={{
            background:   isUser ? `${NEON}12` : "rgba(15,15,22,0.9)",
            border:       `1px solid ${isUser ? `${NEON}35` : "rgba(255,255,255,0.07)"}`,
            borderRadius: isUser ? "12px 2px 12px 12px" : "2px 12px 12px 12px",
            boxShadow:    isUser ? `0 0 12px ${NEON}10` : undefined,
          }}
        >
          {msg.kind === "template" ? (
            <div>
              <p className="font-tech text-[9px] uppercase tracking-widest mb-2" style={{ color: `${NEON}70` }}>
                Шаблон
              </p>
              <p className="font-mono text-[11px] text-gray-400 leading-relaxed whitespace-pre-wrap">{msg.text}</p>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => copy(msg.text)}
                className="mt-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm font-tech text-[9px] uppercase tracking-wider"
                style={{
                  background: copied ? `${NEON}18` : "rgba(255,255,255,0.04)",
                  border:     `1px solid ${copied ? `${NEON}40` : "rgba(255,255,255,0.08)"}`,
                  color:      copied ? NEON : "#444",
                }}>
                {copied ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                {copied ? "Скопировано" : "Скопировать шаблон"}
              </motion.button>
            </div>
          ) : msg.kind === "result" ? (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles className="w-3 h-3" style={{ color: NEON }} />
                <span className="font-tech text-[9px] uppercase tracking-widest" style={{ color: `${NEON}80` }}>
                  Экспертный промпт
                </span>
              </div>
              <p className="font-mono text-[11px] text-gray-300 leading-relaxed whitespace-pre-wrap">{msg.text}</p>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => copy(msg.text)}
                className="mt-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm font-tech text-[9px] uppercase tracking-wider"
                style={{ background: `${NEON}15`, border: `1px solid ${NEON}40`, color: NEON, boxShadow: T.glow(NEON) }}>
                {copied ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                {copied ? "Скопировано" : "Скопировать"}
              </motion.button>
            </div>
          ) : (
            <p className="text-sm leading-relaxed whitespace-pre-wrap"
              style={{ color: msg.kind === "error" ? "#ff6680" : isUser ? NEON : "rgba(255,255,255,0.88)" }}>
              {msg.text}
            </p>
          )}
        </div>

        {/* Action buttons under assistant message */}
        {msg.buttons && msg.buttons.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {msg.buttons.map((btn, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.06 }}
                whileTap={{ scale: 0.94 }}
                onClick={btn.onClick}
                className="flex items-center gap-1.5 px-3 py-2 rounded-sm font-tech text-[10px] uppercase tracking-wider"
                style={{
                  background:     `${NEON}08`,
                  border:         `1px solid ${NEON}30`,
                  color:          NEON,
                  backdropFilter: "blur(8px)",
                }}
              >
                {btn.emoji && <span>{btn.emoji}</span>}
                {btn.label}
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Typing dots ───────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex justify-start">
      <div className="w-7 h-7 rounded-sm flex items-center justify-center text-sm mr-2 mt-1 shrink-0"
        style={{ background: `${NEON}12`, border: `1px solid ${NEON}25` }}>
        🎬
      </div>
      <div className="px-5 py-3.5 flex items-center gap-1.5"
        style={{ background: "rgba(15,15,22,0.9)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "2px 12px 12px 12px" }}>
        {[0, 0.22, 0.44].map((d, i) => (
          <motion.div key={i} animate={{ y: [0, -5, 0] }} transition={{ duration: 0.65, repeat: Infinity, delay: d }}
            className="w-1.5 h-1.5 rounded-full" style={{ background: NEON, boxShadow: `0 0 6px ${NEON}` }} />
        ))}
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────
export default function ContentProducerChat() {
  const { bg }       = useTheme();
  const [, navigate] = useLocation();
  const scrollRef    = useRef<HTMLDivElement>(null);

  const [messages,   setMessages]   = useState<Msg[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [showInput,  setShowInput]  = useState(false);
  const [input,      setInput]      = useState("");
  const [context,    setContext]    = useState<string[]>([]);  // breadcrumb of choices
  const [newIds,     setNewIds]     = useState<Set<string>>(new Set());
  const [finished,   setFinished]   = useState(false);

  const addMsg = (msg: Omit<Msg, "id">) => {
    const id = `m_${Date.now()}_${Math.random()}`;
    setMessages(prev => [...prev, { ...msg, id }]);
    setNewIds(prev => new Set([...prev, id]));
    return id;
  };

  const scrollDown = () => {
    setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, 100);
  };

  // Init flow
  useEffect(() => {
    setTimeout(() => {
      addMsg({
        kind: "assistant",
        text: "Что создаём сегодня? Выбери направление:",
        buttons: Object.entries(TREE).map(([key, branch]) => ({
          label:   branch.label,
          emoji:   branch.emoji,
          onClick: () => chooseBranch(key, branch),
        })),
      });
      scrollDown();
    }, 400);
  }, []);

  useEffect(() => { scrollDown(); }, [messages, loading]);

  const chooseBranch = (key: string, branch: Branch) => {
    // Remove buttons from previous message (flush)
    setMessages(prev => prev.map(m => m.buttons ? { ...m, buttons: undefined } : m));

    addMsg({ kind: "user-choice", text: `${branch.emoji} ${branch.label}` });
    setContext([branch.label]);

    setTimeout(() => {
      addMsg({
        kind: "assistant",
        text: `Отличный выбор! Какой формат нужен?`,
        buttons: Object.entries(branch.subs).map(([subKey, leaf]) => ({
          label:   leaf.label,
          onClick: () => chooseSub(branch.label, subKey, leaf),
        })),
      });
      scrollDown();
    }, 500);
  };

  const chooseSub = (catLabel: string, _subKey: string, leaf: Leaf) => {
    setMessages(prev => prev.map(m => m.buttons ? { ...m, buttons: undefined } : m));

    addMsg({ kind: "user-choice", text: leaf.label });
    setContext([catLabel, leaf.label]);

    setTimeout(() => {
      addMsg({ kind: "template", text: leaf.template });
      setTimeout(() => {
        addMsg({
          kind: "assistant",
          text: "Хочешь использовать этот шаблон или создать собственный промпт?",
          buttons: [
            { label: "Создать своё",  emoji: "✨", onClick: () => startCustom(catLabel, leaf.label, leaf.template) },
            { label: "Начать заново", emoji: "↩", onClick: restart },
          ],
        });
        scrollDown();
      }, 300);
    }, 400);
  };

  const startCustom = (cat: string, sub: string, template: string) => {
    setMessages(prev => prev.map(m => m.buttons ? { ...m, buttons: undefined } : m));
    setContext([cat, sub, template]);
    addMsg({ kind: "assistant", text: "Опиши свою задачу. Я составлю уникальный экспертный промпт на основе твоего запроса:" });
    setShowInput(true);
    scrollDown();
  };

  const sendCustom = async () => {
    if (!input.trim() || loading) return;
    const userText = input.trim();
    setInput("");
    setShowInput(false);
    setMessages(prev => prev.map(m => m.buttons ? { ...m, buttons: undefined } : m));
    addMsg({ kind: "user-choice", text: userText });
    setLoading(true);

    const aggregated = `КОНТЕКСТ: ${context.join(" → ")}\nЗАПРОС: ${userText}\nСоставь экспертный промпт для контент-продюсера, объединив все параметры.`;

    try {
      const reply = await sendToBackend(aggregated);
      addMsg({ kind: "result", text: reply });
    } catch {
      addMsg({ kind: "error", text: "Соединение разорвано. Повтори попытку." });
    } finally {
      setLoading(false);
      setFinished(true);
      setTimeout(() => {
        addMsg({
          kind: "assistant",
          text: "Готово! Могу помочь ещё с чем-нибудь?",
          buttons: [{ label: "Начать заново", emoji: "↩", onClick: restart }],
        });
        scrollDown();
      }, 600);
    }
  };

  const restart = () => {
    setMessages([]);
    setContext([]);
    setShowInput(false);
    setInput("");
    setFinished(false);
    setNewIds(new Set());
    setTimeout(() => {
      addMsg({
        kind: "assistant",
        text: "Что создаём сегодня? Выбери направление:",
        buttons: Object.entries(TREE).map(([key, branch]) => ({
          label:   branch.label,
          emoji:   branch.emoji,
          onClick: () => chooseBranch(key, branch),
        })),
      });
      scrollDown();
    }, 200);
  };

  return (
    <div className="flex flex-col h-screen" style={{ background: bg }}>
      {/* Grid bg */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: `linear-gradient(${NEON}55 1px, transparent 1px), linear-gradient(90deg, ${NEON}55 1px, transparent 1px)`, backgroundSize: "24px 24px" }} />
      <div className="fixed top-0 inset-x-0 h-32 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 50% 0%, ${NEON}12 0%, transparent 70%)` }} />

      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 z-10 sticky top-0"
        style={{ background: `${bg}ee`, borderBottom: `1px solid ${NEON}20`, backdropFilter: "blur(16px)" }}>
        <button onClick={() => navigate("/feed")} className="p-2 -ml-2 text-gray-500 hover:text-white transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎬</span>
            <h2 className="font-display font-bold text-base tracking-widest uppercase text-white"
              style={{ textShadow: T.glowText(NEON) }}>
              Контент Продюсер
            </h2>
          </div>
          <p className="font-tech text-[8px] uppercase tracking-widest" style={{ color: `${NEON}60` }}>
            Интерактивный гид
          </p>
        </div>
        <motion.button whileTap={{ scale: 0.9 }} onClick={restart} className="p-2 -mr-2 text-gray-600 hover:text-white transition-colors">
          <RefreshCw className="w-5 h-5" />
        </motion.button>
      </header>

      {/* Session banner */}
      <div className="z-10 px-4 pt-3">
        <div className="flex items-center justify-center py-1.5 rounded-sm"
          style={{ background: `${NEON}08`, border: `1px solid ${NEON}15` }}>
          <Sparkles className="w-3 h-3 mr-1.5" style={{ color: `${NEON}80` }} />
          <span className="font-tech text-[9px] tracking-[0.25em] uppercase" style={{ color: `${NEON}80` }}>
            Ветвистый конструктор промптов
          </span>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 z-10 no-scrollbar">
        {messages.map(msg => (
          <Bubble key={msg.id} msg={msg} isNew={newIds.has(msg.id)} />
        ))}
        {loading && <TypingDots />}
      </div>

      {/* Custom input bar */}
      <AnimatePresence>
        {showInput && (
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            className="px-4 pb-5 pt-3 z-10"
            style={{ background: `${bg}f0`, borderTop: `1px solid ${NEON}20`, backdropFilter: "blur(16px)" }}
          >
            <form onSubmit={e => { e.preventDefault(); sendCustom(); }} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Опиши свою задачу..."
                autoFocus
                className="flex-1 bg-transparent py-3 px-4 text-sm font-sans focus:outline-none"
                style={{
                  background:  "rgba(0,0,0,0.5)",
                  border:      `1px solid ${input ? `${NEON}50` : "rgba(255,255,255,0.08)"}`,
                  color:       "white",
                  caretColor:  NEON,
                }}
              />
              <motion.button type="submit" disabled={!input.trim() || loading} whileTap={{ scale: 0.9 }}
                className="px-5 flex items-center justify-center disabled:opacity-30 transition-all"
                style={{ background: `${NEON}15`, border: `1px solid ${NEON}50`, color: NEON, boxShadow: input.trim() ? T.glow(NEON) : undefined }}>
                <Send className="w-5 h-5" />
              </motion.button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
