import { useState, useRef, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Flame, ChevronLeft, ShieldCheck, AlertTriangle, Ghost } from "lucide-react";
import { AI_CHARACTERS, N8N_WEBHOOK, T, CHARACTER_ID_MAP, getUserId } from "@/lib/constants";
import { useGhostMode } from "@/hooks/use-ghost-mode";
import { useTranslation } from "react-i18next";

// ── Types ──────────────────────────────────────────────────
interface Msg {
  id:        string;
  role:      "user" | "assistant" | "error" | "ghost";
  content:   string;
  timestamp: string;
}

// ── n8n send ───────────────────────────────────────────────
async function sendToN8n(characterId: string, message: string): Promise<string> {
  const res = await fetch(N8N_WEBHOOK, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ message, userId: getUserId(), characterId }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const reply = data?.reply ?? data?.message ?? data?.text ?? data?.output ?? null;
  if (!reply) throw new Error("no reply field");
  return String(reply);
}

// ── Component ──────────────────────────────────────────────
export default function Chat() {
  const { id }          = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { t }           = useTranslation();
  const scrollRef       = useRef<HTMLDivElement>(null);
  const { isGhostMode } = useGhostMode();

  const char = AI_CHARACTERS.find(c => c.id === id) ?? {
    id:          id ?? "unknown",
    webhookName: id ?? "unknown",
    name:        "Агент",
    avatar:      "🤖",
    status:      "online" as const,
    specialty:   "",
    description: "",
    color:       { hex: "#00f0ff" },
    greeting:    t("chat.greeting"),
    locked:      false,
  };
  const neon = char.color.hex;

  const [messages, setMessages] = useState<Msg[]>([
    {
      id:        "greeting",
      role:      "assistant",
      content:   char.greeting || t("chat.greeting"),
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input,       setInput]       = useState("");
  const [loading,     setLoading]     = useState(false);
  const [burnConfirm, setBurnConfirm] = useState(false);
  const [burning,     setBurning]     = useState(false);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  // ── Send ────────────────────────────────────────────────
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Msg = {
      id:        `u_${Date.now()}`,
      role:      "user",
      content:   text,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput("");

    // Ghost mode: no network call, just a local ghost indicator
    if (isGhostMode) {
      setMessages(prev => [...prev, {
        id:        `ghost_${Date.now()}`,
        role:      "ghost",
        content:   "[ ПРИЗРАК ] Сообщение не передано. Только локальная запись.",
        timestamp: new Date().toISOString(),
      }]);
      return;
    }

    setLoading(true);
    try {
      const charId = CHARACTER_ID_MAP[char.id] ?? char.id;
      const reply  = await sendToN8n(charId, text);
      setMessages(prev => [...prev, {
        id:        `a_${Date.now()}`,
        role:      "assistant",
        content:   reply,
        timestamp: new Date().toISOString(),
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id:        `e_${Date.now()}`,
        role:      "error",
        content:   "Соединение разорвано. Повторите попытку.",
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  // ── Burn ────────────────────────────────────────────────
  const handleBurnClick = () => {
    if (!burnConfirm) {
      setBurnConfirm(true);
      setTimeout(() => setBurnConfirm(false), 3000);
      return;
    }
    setBurnConfirm(false);
    setBurning(true);
    setTimeout(() => { setMessages([]); setBurning(false); }, 600);
  };

  return (
    <div className="flex flex-col h-screen relative overflow-hidden" style={{ background: "#050508" }}>
      {/* Grid bg */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(${neon}55 1px, transparent 1px), linear-gradient(90deg, ${neon}55 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
        }} />
      <div className="absolute top-0 inset-x-0 h-32 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 50% 0%, ${neon}15 0%, transparent 70%)` }} />

      {/* ── Header ── */}
      <header className="flex items-center justify-between px-4 py-3 z-10 sticky top-0"
        style={{
          background:     "rgba(5,5,10,0.88)",
          borderBottom:   `1px solid ${isGhostMode ? "rgba(255,255,255,0.08)" : `${neon}25`}`,
          backdropFilter: "blur(16px)",
          boxShadow:      `0 4px 20px ${neon}08`,
        }}>
        <button onClick={() => setLocation("/")}
          className="p-2 -ml-2 text-gray-400 hover:text-white transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2">
            <span className="text-xl">{char.avatar}</span>
            <h2 className="font-display font-bold text-base tracking-widest uppercase text-white"
              style={{ textShadow: isGhostMode ? "none" : T.glowText(neon) }}>
              {char.name}
            </h2>
          </div>
          <div className="flex items-center gap-1.5">
            {isGhostMode
              ? <Ghost className="w-3 h-3" style={{ color: "#666" }} />
              : <ShieldCheck className="w-3 h-3" style={{ color: "#00ff88" }} />
            }
            <span className="font-tech text-[9px] tracking-widest uppercase"
              style={{ color: isGhostMode ? "#666" : "#00ff88" }}>
              {isGhostMode ? "ПРИЗРАК РЕЖИМ" : t("chat.encrypted")}
            </span>
          </div>
        </div>

        <motion.button onClick={handleBurnClick} whileTap={{ scale: 0.9 }}
          className="p-2 -mr-2 flex flex-col items-center gap-0.5 transition-all"
          style={{
            color:  burnConfirm ? "#ff3366" : "#444",
            filter: burnConfirm ? `drop-shadow(${T.glow("#ff3366")})` : "none",
          }}>
          <Flame className={`w-6 h-6 ${burnConfirm ? "animate-pulse" : ""}`} />
          <span className="font-tech text-[8px] tracking-wider uppercase">
            {burnConfirm ? t("chat.burnConfirm") : t("chat.burn")}
          </span>
        </motion.button>
      </header>

      {/* ── Ghost Mode banner ── */}
      <AnimatePresence>
        {isGhostMode && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="z-10 overflow-hidden"
          >
            <div className="mx-4 mt-3 px-3 py-2 rounded-sm flex items-center gap-2"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <Ghost className="w-3 h-3 shrink-0 text-gray-600" />
              <span className="font-tech text-[9px] uppercase tracking-[0.2em] text-gray-600">
                Призрак режим · Сообщения не покидают устройство
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Session banner ── */}
      <div className="z-10 px-4 pt-3">
        <div className="flex items-center justify-center py-1.5 rounded-sm"
          style={{ background: `${neon}08`, border: `1px solid ${neon}15` }}>
          <span className="font-tech text-[9px] tracking-[0.25em] uppercase"
            style={{ color: `${neon}80` }}>
            {t("chat.sessionStart")}
          </span>
        </div>
      </div>

      {/* ── Messages ── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 z-10 no-scrollbar">

        {/* Burn flash */}
        <AnimatePresence>
          {burning && (
            <motion.div key="burn"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center"
              style={{ background: "rgba(255,0,0,0.07)" }}>
              <motion.div
                animate={{ scale: [1, 1.4, 0.8, 1.2, 0], opacity: [1, 0.8, 1, 0.5, 0] }}
                transition={{ duration: 0.6 }}
                style={{ color: "#ff3366", filter: `drop-shadow(${T.glowStrong("#ff3366")})` }}>
                <Flame className="w-24 h-24" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bubbles */}
        <AnimatePresence initial={false}>
          {messages.map(msg => {
            const isUser  = msg.role === "user";
            const isError = msg.role === "error";
            const isGhost = msg.role === "ghost";

            const bubbleBg =
              isUser  ? `${neon}10`
            : isError ? "rgba(255,51,102,0.08)"
            : isGhost ? "rgba(255,255,255,0.03)"
            :           "rgba(20,20,30,0.8)";

            const bubbleBorder =
              isUser  ? `${neon}35`
            : isError ? "rgba(255,51,102,0.3)"
            : isGhost ? "rgba(255,255,255,0.08)"
            :           "rgba(255,255,255,0.07)";

            const textColor =
              isError ? "#ff6680"
            : isGhost ? "#555"
            :           "rgba(255,255,255,0.9)";

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, x: isUser ? 16 : -16 }}
                animate={{ opacity: 1, y: 0, x: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}
              >
                {/* Avatar */}
                {!isUser && (
                  <div className="flex-shrink-0 mr-2 mt-1">
                    <div className="w-7 h-7 rounded-sm flex items-center justify-center text-sm"
                      style={{
                        background: isError ? "rgba(255,51,102,0.12)" : isGhost ? "rgba(255,255,255,0.04)" : `${neon}15`,
                        border:     `1px solid ${isError ? "rgba(255,51,102,0.3)" : isGhost ? "rgba(255,255,255,0.08)" : `${neon}30`}`,
                      }}>
                      {isError ? <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                       : isGhost ? <Ghost className="w-3.5 h-3.5 text-gray-700" />
                       : char.avatar}
                    </div>
                  </div>
                )}

                <div className="max-w-[78%] px-4 py-3 relative"
                  style={{
                    background:   bubbleBg,
                    border:       `1px solid ${bubbleBorder}`,
                    boxShadow:    isUser ? `0 0 12px ${neon}12` : undefined,
                    borderRadius: isUser ? "12px 2px 12px 12px" : "2px 12px 12px 12px",
                  }}>
                  <div className="absolute w-2 h-2 border-t"
                    style={{
                      top: 0,
                      [isUser ? "right" : "left"]: 0,
                      borderRight:    isUser ? `1px solid ${neon}60` : undefined,
                      borderLeft:    !isUser ? `1px solid ${bubbleBorder}` : undefined,
                      borderTopColor: isUser ? `${neon}60` : bubbleBorder,
                    }} />
                  <p className="text-sm leading-relaxed whitespace-pre-wrap font-mono"
                    style={{ color: textColor, fontFamily: isGhost ? "monospace" : undefined }}>
                    {msg.content}
                  </p>
                  <p className="font-tech text-[9px] tracking-wider mt-2 text-right"
                    style={{ color: isUser ? `${neon}60` : "rgba(255,255,255,0.2)" }}>
                    {format(new Date(msg.timestamp), "HH:mm:ss")}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Typing dots */}
        <AnimatePresence>
          {loading && (
            <motion.div key="typing"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex justify-start">
              <div className="flex-shrink-0 mr-2 mt-1">
                <div className="w-7 h-7 rounded-sm flex items-center justify-center text-sm"
                  style={{ background: `${neon}15`, border: `1px solid ${neon}30` }}>
                  {char.avatar}
                </div>
              </div>
              <div className="px-5 py-3.5 flex items-center gap-1.5"
                style={{
                  background:   "rgba(20,20,30,0.8)",
                  border:       "1px solid rgba(255,255,255,0.07)",
                  borderRadius: "2px 12px 12px 12px",
                }}>
                {[0, 0.2, 0.4].map((d, i) => (
                  <motion.div key={i}
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 0.65, repeat: Infinity, delay: d }}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: neon, boxShadow: `0 0 6px ${neon}` }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Input bar ── */}
      <div className="px-4 pb-5 pt-3 z-10"
        style={{
          background:     "rgba(5,5,10,0.92)",
          borderTop:      `1px solid ${isGhostMode ? "rgba(255,255,255,0.06)" : `${neon}20`}`,
          backdropFilter: "blur(16px)",
        }}>
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={isGhostMode ? "[ ПРИЗРАК РЕЖИМ ]" : t("chat.placeholder")}
            disabled={loading}
            className="flex-1 bg-transparent py-3 px-4 text-sm font-tech uppercase tracking-wider placeholder:tracking-wider focus:outline-none transition-all disabled:opacity-50"
            style={{
              background:  "rgba(0,0,0,0.5)",
              border:     `1px solid ${input ? (isGhostMode ? "rgba(255,255,255,0.2)" : `${neon}50`) : "rgba(255,255,255,0.08)"}`,
              color:       isGhostMode ? "#888" : neon,
              caretColor:  isGhostMode ? "#888" : neon,
            }}
          />
          <motion.button
            type="submit"
            disabled={!input.trim() || loading}
            whileTap={{ scale: 0.9 }}
            className="px-5 flex items-center justify-center font-display font-bold text-xs tracking-widest uppercase disabled:opacity-30 transition-all"
            style={{
              background: isGhostMode ? "rgba(255,255,255,0.05)" : `${neon}15`,
              border:     `1px solid ${isGhostMode ? "rgba(255,255,255,0.15)" : `${neon}50`}`,
              color:       isGhostMode ? "#666" : neon,
              boxShadow:   input.trim() && !loading && !isGhostMode ? T.glow(neon) : undefined,
            }}>
            {isGhostMode ? <Ghost className="w-5 h-5" /> : <Send className="w-5 h-5" />}
          </motion.button>
        </form>
      </div>
    </div>
  );
}
