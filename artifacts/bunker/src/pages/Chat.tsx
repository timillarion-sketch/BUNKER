import { useState, useRef, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import {
  useGetMessages,
  useSendMessage,
  useBurnHistory,
} from "@workspace/api-client-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Flame, ChevronLeft, ShieldCheck } from "lucide-react";
import { AI_CHARACTERS, T } from "@/lib/constants";

export default function Chat() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const [localMessages, setLocalMessages] = useState<any[]>([]);
  const [burnConfirm, setBurnConfirm] = useState(false);  // double-tap state
  const [burning, setBurning] = useState(false);

  const char = AI_CHARACTERS.find((c) => c.id === id) ?? {
    id: id ?? "echo",
    name: "Unknown",
    avatar: "?",
    status: "online" as const,
    specialty: "Unknown",
    description: "",
    color: { hex: "#00f0ff" } as any,
    greeting: "Connection established.",
  };
  const neon = char.color.hex;

  // API hooks
  const { data: apiMessages, refetch } = useGetMessages(id ?? "", {
    query: { retry: 1, enabled: !!id },
  });

  const sendMutation = useSendMessage({
    mutation: {
      onSuccess: (msg) => {
        setLocalMessages((prev) => [...prev, msg]);
      },
    },
  });

  const burnMutation = useBurnHistory({
    mutation: {
      onSuccess: () => {
        setBurning(true);
        setTimeout(() => {
          setLocalMessages([]);
          setBurning(false);
          refetch();
        }, 600);
      },
    },
  });

  // Seed greeting + API messages
  useEffect(() => {
    const greeting = {
      id: "greeting",
      characterId: id,
      content: char.greeting,
      role: "assistant",
      timestamp: new Date().toISOString(),
    };
    if (apiMessages && apiMessages.length > 0) {
      setLocalMessages(apiMessages);
    } else {
      setLocalMessages([greeting]);
    }
  }, [apiMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [localMessages, sendMutation.isPending]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !id) return;
    const userMsg = {
      id: `u_${Date.now()}`,
      characterId: id,
      content: input,
      role: "user",
      timestamp: new Date().toISOString(),
    };
    setLocalMessages((prev) => [...prev, userMsg]);
    setInput("");
    sendMutation.mutate({ characterId: id, data: { content: userMsg.content } });
  };

  const handleBurnClick = () => {
    if (!burnConfirm) {
      setBurnConfirm(true);
      setTimeout(() => setBurnConfirm(false), 3000);
      return;
    }
    setBurnConfirm(false);
    burnMutation.mutate({ characterId: id ?? "" });
  };

  return (
    <div className="flex flex-col h-screen relative overflow-hidden" style={{ background: "#050508" }}>
      {/* Grid background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(${neon}55 1px, transparent 1px), linear-gradient(90deg, ${neon}55 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
        }}
      />

      {/* Top glow */}
      <div
        className="absolute top-0 inset-x-0 h-32 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 50% 0%, ${neon}15 0%, transparent 70%)` }}
      />

      {/* Header */}
      <header
        className="flex items-center justify-between px-4 py-3 z-10 sticky top-0"
        style={{
          background: "rgba(5,5,10,0.85)",
          borderBottom: `1px solid ${neon}25`,
          backdropFilter: "blur(16px)",
          boxShadow: `0 4px 20px ${neon}08`,
        }}
      >
        <button
          onClick={() => setLocation("/")}
          className="p-2 -ml-2 text-gray-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2">
            <span className="text-xl">{char.avatar}</span>
            <h2
              className="font-display font-bold text-base tracking-widest uppercase text-white"
              style={{ textShadow: T.glowText(neon) }}
            >
              {char.name}
            </h2>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3 h-3" style={{ color: "#00ff88" }} />
            <span className="font-tech text-[9px] tracking-widest uppercase" style={{ color: "#00ff88" }}>
              E2E Encrypted
            </span>
          </div>
        </div>

        {/* Double-tap BURN */}
        <motion.button
          onClick={handleBurnClick}
          disabled={burnMutation.isPending}
          whileTap={{ scale: 0.9 }}
          className="p-2 -mr-2 flex flex-col items-center gap-0.5 transition-all"
          style={{
            color: burnConfirm ? "#ff3366" : "#444",
            filter: burnConfirm ? `drop-shadow(${T.glow("#ff3366")})` : "none",
          }}
          title={burnConfirm ? "Tap again to confirm BURN" : "Burn history (double-tap)"}
        >
          <Flame className={`w-6 h-6 ${burnConfirm ? "animate-pulse" : ""}`} />
          <span className="font-tech text-[8px] tracking-wider uppercase">
            {burnConfirm ? "CONFIRM" : "BURN"}
          </span>
        </motion.button>
      </header>

      {/* Session banner */}
      <div className="z-10 px-4 pt-4">
        <div
          className="flex items-center justify-center py-1.5 rounded-sm"
          style={{ background: `${neon}08`, border: `1px solid ${neon}15` }}
        >
          <span className="font-tech text-[9px] tracking-[0.25em] uppercase" style={{ color: `${neon}80` }}>
            Session Initiated · Keys Exchanged
          </span>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 z-10 no-scrollbar">
        <AnimatePresence>
          {burning && (
            <motion.div
              key="burn-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center"
              style={{ background: "rgba(255,0,0,0.08)" }}
            >
              <motion.div
                animate={{ scale: [1, 1.4, 0.8, 1.2, 0], opacity: [1, 0.8, 1, 0.5, 0] }}
                transition={{ duration: 0.6 }}
                style={{ color: "#ff3366", filter: `drop-shadow(${T.glowStrong("#ff3366")})` }}
              >
                <Flame className="w-24 h-24" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {localMessages.map((msg) => {
            const isUser = msg.role === "user";
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, x: isUser ? 16 : -16 }}
                animate={{ opacity: 1, y: 0, x: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}
              >
                {!isUser && (
                  <div className="flex-shrink-0 mr-2 mt-1">
                    <div
                      className="w-7 h-7 rounded-sm flex items-center justify-center text-sm"
                      style={{ background: `${neon}15`, border: `1px solid ${neon}30` }}
                    >
                      {char.avatar}
                    </div>
                  </div>
                )}

                <div
                  className="max-w-[78%] px-4 py-3 relative"
                  style={{
                    background: isUser ? `${neon}10` : "rgba(20,20,30,0.8)",
                    border: `1px solid ${isUser ? `${neon}35` : "rgba(255,255,255,0.07)"}`,
                    boxShadow: isUser ? `0 0 12px ${neon}12` : undefined,
                    borderRadius: isUser ? "12px 2px 12px 12px" : "2px 12px 12px 12px",
                  }}
                >
                  {/* Corner accent */}
                  <div
                    className="absolute w-2 h-2 border-t"
                    style={{
                      top: 0,
                      [isUser ? "right" : "left"]: 0,
                      borderRight: isUser ? `1px solid ${neon}60` : undefined,
                      borderLeft: !isUser ? `1px solid rgba(255,255,255,0.2)` : undefined,
                      borderTopColor: isUser ? `${neon}60` : "rgba(255,255,255,0.2)",
                    }}
                  />

                  <p className="text-sm text-white/90 leading-relaxed">{msg.content}</p>
                  <p
                    className="font-tech text-[9px] tracking-wider mt-2 text-right"
                    style={{ color: isUser ? `${neon}60` : "rgba(255,255,255,0.25)" }}
                  >
                    {format(new Date(msg.timestamp), "HH:mm:ss")}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* AI typing indicator */}
        <AnimatePresence>
          {sendMutation.isPending && (
            <motion.div
              key="typing"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex justify-start"
            >
              <div
                className="px-5 py-3 flex items-center gap-1.5"
                style={{
                  background: "rgba(20,20,30,0.8)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: "2px 12px 12px 12px",
                }}
              >
                {[0, 0.2, 0.4].map((d, i) => (
                  <motion.div
                    key={i}
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: d }}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: neon, boxShadow: `0 0 6px ${neon}` }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input */}
      <div
        className="px-4 pb-5 pt-3 z-10"
        style={{
          background: "rgba(5,5,10,0.9)",
          borderTop: `1px solid ${neon}20`,
          backdropFilter: "blur(16px)",
        }}
      >
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="[ ENTER DIRECTIVE ]"
            className="flex-1 bg-transparent py-3 px-4 text-sm font-tech uppercase tracking-wider placeholder:tracking-wider focus:outline-none transition-all"
            style={{
              background: "rgba(0,0,0,0.5)",
              border: `1px solid ${input ? `${neon}50` : "rgba(255,255,255,0.08)"}`,
              color: neon,
              boxShadow: input ? `inset 0 0 10px ${neon}08` : undefined,
            }}
          />
          <motion.button
            type="submit"
            disabled={!input.trim() || sendMutation.isPending}
            whileTap={{ scale: 0.9 }}
            className="px-5 flex items-center justify-center font-display font-bold text-xs tracking-widest uppercase disabled:opacity-30 transition-all"
            style={{
              background: `${neon}15`,
              border: `1px solid ${neon}50`,
              color: neon,
              boxShadow: input.trim() ? T.glow(neon) : undefined,
            }}
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </form>
      </div>
    </div>
  );
}
