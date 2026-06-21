import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Archive, Trash2, EyeOff, Timer, Lock, UserPlus, User, X } from "lucide-react";
import { useLocation } from "wouter";
import { T } from "@/lib/constants";

// ── Mock archive data (RAM only — won't persist) ──────────
interface ArchiveChat {
  id:          string;
  name:        string;
  color:       string;
  lastMsg:     string;
  time:        string;
  incognito:   boolean;
  expiresAt?:  number; // timestamp for incognito self-destruct
}

const INITIAL_CHATS: ArchiveChat[] = [
  {
    id:        "a1",
    name:      "Оперативник Α",
    color:     "#ff3366",
    lastMsg:   "Пакет доставлен. Точка Б подтверждена.",
    time:      "03:17",
    incognito: true,
    expiresAt: Date.now() + 8 * 60 * 1000 + 33 * 1000, // 8:33 remaining
  },
  {
    id:        "a2",
    name:      "DELTA-7",
    color:     "#bf00ff",
    lastMsg:   "Координаты зафиксированы. Жди сигнала.",
    time:      "Вчера",
    incognito: false,
  },
  {
    id:        "a3",
    name:      "Призрак-9",
    color:     "#ffd700",
    lastMsg:   "Выход через чёрный ход. Не светись.",
    time:      "Пн",
    incognito: true,
    expiresAt: Date.now() + 3 * 60 * 1000 + 12 * 1000, // 3:12 remaining
  },
];

// ── Countdown hook ────────────────────────────────────────
function useCountdown(expiresAt?: number): string | null {
  const [remaining, setRemaining] = useState(() =>
    expiresAt ? Math.max(0, expiresAt - Date.now()) : null
  );

  useEffect(() => {
    if (!expiresAt) return;
    const iv = setInterval(() => {
      const r = Math.max(0, expiresAt - Date.now());
      setRemaining(r);
    }, 1000);
    return () => clearInterval(iv);
  }, [expiresAt]);

  if (remaining === null) return null;
  const m = Math.floor(remaining / 60000);
  const s = Math.floor((remaining % 60000) / 1000);
  return `${m}:${String(s).padStart(2, "0")}`;
}

// ── Archive Chat Row ──────────────────────────────────────
function ArchiveChatRow({ chat, onDelete }: { chat: ArchiveChat; onDelete: () => void }) {
  const countdown = useCountdown(chat.expiresAt);
  const expired   = chat.expiresAt && Date.now() >= chat.expiresAt;

  if (expired) return null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, scale: 0.95 }}
      className="relative overflow-hidden rounded-sm"
      style={{
        background:     "rgba(0,0,0,0.75)",
        border:         `1px solid ${chat.incognito ? "rgba(255,51,102,0.15)" : "rgba(255,255,255,0.06)"}`,
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Incognito left accent */}
      {chat.incognito && (
        <div className="absolute left-0 top-0 bottom-0 w-[2px]"
          style={{ background: "#ff3366", boxShadow: T.glow("#ff3366") }} />
      )}

      <div className="flex items-center gap-3 px-4 py-3.5 pl-5">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-sm flex items-center justify-center font-display font-black text-base text-black"
            style={{
              background: `linear-gradient(135deg, ${chat.color}55, ${chat.color}22)`,
              border:     `1px solid ${chat.color}30`,
            }}>
            <span style={{ color: chat.color }}>{chat.name.charAt(0)}</span>
          </div>
          {/* Pulsing red incognito dot */}
          {chat.incognito && (
            <motion.div
              animate={{ opacity: [1, 0.3, 1], scale: [1, 1.3, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              className="absolute -top-1 -right-1 w-3 h-3 rounded-full border border-black"
              style={{ background: "#ff3366", boxShadow: T.glow("#ff3366") }}
            />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="font-display font-bold text-sm text-white uppercase tracking-wider truncate">
                {chat.name}
              </h3>
              {chat.incognito && (
                <span className="shrink-0 flex items-center gap-0.5">
                  <EyeOff className="w-2.5 h-2.5" style={{ color: "#ff336670" }} />
                </span>
              )}
            </div>
            <span className="font-tech text-[9px] text-gray-700 shrink-0 ml-2">{chat.time}</span>
          </div>
          <p className="font-mono text-[10px] text-gray-600 truncate leading-snug">{chat.lastMsg}</p>
          {/* Self-destruct countdown */}
          {chat.incognito && countdown !== null && (
            <div className="flex items-center gap-1 mt-1">
              <Timer className="w-2.5 h-2.5 shrink-0" style={{ color: "#ff336650" }} />
              <span className="font-tech text-[8px] tracking-wider" style={{ color: "#ff336650" }}>
                Самоуничтожение через {countdown}
              </span>
            </div>
          )}
        </div>

        {/* Delete */}
        <motion.button whileTap={{ scale: 0.88 }} onClick={e => { e.stopPropagation(); onDelete(); }}
          className="shrink-0 p-2 ml-1 rounded-sm transition-colors"
          style={{ color: "#333", background: "rgba(255,255,255,0.03)" }}>
          <Trash2 className="w-3.5 h-3.5" />
        </motion.button>
      </div>
    </motion.div>
  );
}

// ── Pick Contact Modal ────────────────────────────────────
function PickContactModal({ onClose, onSelect }: { onClose: () => void; onSelect: (name: string) => void }) {
  const [contacts, setContacts] = useState<{ id: number; addresseeId: string }[]>([]);

  useEffect(() => {
    fetch("/api/contacts")
      .then(r => r.json())
      .then(data => setContacts(data.filter((c: { status: string }) => c.status === "pending")))
      .catch(() => {});
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
      onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="w-full max-w-sm rounded-sm overflow-hidden"
        style={{ background: "#0a0a0a", border: "1px solid rgba(255,51,102,0.3)", boxShadow: "0 0 40px rgba(255,51,102,0.1)" }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="font-display font-bold text-sm text-white uppercase tracking-wider"
            style={{ textShadow: "0 0 12px rgba(255,51,102,0.4)" }}>
            Выбрать из контактов
          </h2>
          <button onClick={onClose} className="p-1 text-gray-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 pb-5 max-h-60 overflow-y-auto no-scrollbar space-y-2">
          {contacts.length === 0 && (
            <p className="font-tech text-[10px] text-gray-600 text-center py-4">Нет доступных контактов</p>
          )}
          {contacts.map(c => (
            <motion.button key={c.id} whileTap={{ scale: 0.97 }}
              onClick={() => { onSelect(c.addresseeId); onClose(); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-sm text-left transition-all"
              style={{ background: "rgba(255,51,102,0.06)", border: "1px solid rgba(255,51,102,0.15)" }}>
              <User className="w-4 h-4" style={{ color: "#ff3366" }} />
              <span className="font-tech text-xs text-white uppercase tracking-wider">{c.addresseeId}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Enter ID Modal ────────────────────────────────────────
function EnterIdModal({ onClose, onSelect }: { onClose: () => void; onSelect: (id: string) => void }) {
  const [value, setValue] = useState("");

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
      onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="w-full max-w-sm rounded-sm overflow-hidden"
        style={{ background: "#0a0a0a", border: "1px solid rgba(255,51,102,0.3)", boxShadow: "0 0 40px rgba(255,51,102,0.1)" }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="font-display font-bold text-sm text-white uppercase tracking-wider"
            style={{ textShadow: "0 0 12px rgba(255,51,102,0.4)" }}>
            Ввести ID
          </h2>
          <button onClick={onClose} className="p-1 text-gray-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 pb-5 space-y-4">
          <input value={value} onChange={e => setValue(e.target.value)}
            placeholder="ID пользователя"
            onKeyDown={e => e.key === "Enter" && value.trim() && onSelect(value.trim())}
            className="w-full px-4 py-3 rounded-sm text-sm font-sans text-white outline-none"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,51,102,0.2)" }}
            autoFocus />
          <motion.button whileTap={{ scale: 0.97 }}
            onClick={() => value.trim() && onSelect(value.trim())}
            disabled={!value.trim()}
            className="w-full py-3 font-display font-bold text-xs uppercase tracking-[0.15em] rounded-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            style={{
              background: "rgba(255,51,102,0.12)",
              border: "1px solid rgba(255,51,102,0.4)",
              color: "#ff3366",
              boxShadow: "0 0 20px rgba(255,51,102,0.08)",
            }}>
            <UserPlus className="w-3.5 h-3.5" />
            Создать инкогнито чат
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── New Incognito Chat dropdown ────────────────────────────
function NewIncognitoDropdown({ onPickContact, onEnterId }: { onPickContact: () => void; onEnterId: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={() => setOpen(o => !o)}
        className="w-full py-3 flex items-center justify-center gap-2 rounded-sm transition-all"
        style={{
          background: open ? "rgba(255,51,102,0.08)" : "rgba(255,51,102,0.04)",
          border:     open ? "1px solid rgba(255,51,102,0.4)" : "1px dashed rgba(255,51,102,0.2)",
        }}
      >
        <EyeOff className="w-3.5 h-3.5" style={{ color: open ? "#ff3366" : "rgba(255,51,102,0.4)" }} />
        <span className="font-tech text-[9px] uppercase tracking-widest" style={{ color: open ? "#ff3366" : "rgba(255,51,102,0.4)" }}>
          Новый инкогнито чат
        </span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="absolute bottom-full mb-2 left-0 right-0 z-30 rounded-sm overflow-hidden"
            style={{ background: "#0a0a0a", border: "1px solid rgba(255,51,102,0.3)", boxShadow: "0 -4px 20px rgba(255,51,102,0.1)" }}>
            <button onClick={() => { setOpen(false); onPickContact(); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors">
              <User className="w-4 h-4" style={{ color: "#ff3366" }} />
              <span className="font-tech text-[10px] uppercase tracking-wider text-white">Выбрать из контактов</span>
            </button>
            <div className="h-px mx-4" style={{ background: "rgba(255,51,102,0.1)" }} />
            <button onClick={() => { setOpen(false); onEnterId(); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors">
              <UserPlus className="w-4 h-4" style={{ color: "#ff3366" }} />
              <span className="font-tech text-[10px] uppercase tracking-wider text-white">Ввести ID</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────
export default function SecretArchive() {
  const [, navigate] = useLocation();
  const [chats, setChats] = useState<ArchiveChat[]>(INITIAL_CHATS);
  const [pickContactModal, setPickContactModal] = useState(false);
  const [enterIdModal, setEnterIdModal] = useState(false);

  // Auto-remove expired incognito chats
  useEffect(() => {
    const iv = setInterval(() => {
      setChats(prev => prev.filter(c => !c.expiresAt || Date.now() < c.expiresAt));
    }, 5000);
    return () => clearInterval(iv);
  }, []);

  const deleteChat = (id: string) => {
    setChats(prev => prev.filter(c => c.id !== id));
  };

  const createIncognitoChat = (name: string) => {
    const colors = ["#ff3366", "#ff00cc", "#ffd700", "#ff6600"];
    setChats(prev => [{
      id:        `i_${Date.now()}`,
      name,
      color:     colors[Math.floor(Math.random() * colors.length)],
      lastMsg:   "Новый инкогнито чат открыт",
      time:      "Сейчас",
      incognito: true,
      expiresAt: Date.now() + 10 * 60 * 1000,
    }, ...prev]);
  };

  const regular   = chats.filter(c => !c.incognito);
  const incognito = chats.filter(c => c.incognito);

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#030305" }}>
      {/* Grid texture */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.025]"
        style={{ backgroundImage: "linear-gradient(rgba(255,51,102,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,51,102,0.8) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-4 sticky top-0 z-20"
        style={{ background: "rgba(3,3,5,0.96)", borderBottom: "1px solid rgba(255,51,102,0.1)", backdropFilter: "blur(20px)" }}>
        <button onClick={() => navigate("/chats")} className="p-2 -ml-2 text-gray-700 hover:text-white transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 flex-1">
          <Archive className="w-4 h-4" style={{ color: "#ff3366" }} />
          <div>
            <p className="font-tech text-[8px] uppercase tracking-[0.4em]" style={{ color: "rgba(255,51,102,0.4)" }}>
              СЕКРЕТНЫЙ АРХИВ
            </p>
            <h1 className="font-display font-bold text-sm uppercase tracking-widest text-white leading-tight">
              Скрытые чаты
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-sm"
          style={{ background: "rgba(255,51,102,0.06)", border: "1px solid rgba(255,51,102,0.18)" }}>
          <Lock className="w-2.5 h-2.5" style={{ color: "rgba(255,51,102,0.5)" }} />
          <span className="font-tech text-[8px] uppercase tracking-wider" style={{ color: "rgba(255,51,102,0.5)" }}>
            PIN
          </span>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 px-4 py-5 space-y-5 overflow-y-auto no-scrollbar">

        {/* Incognito chats */}
        {incognito.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.1, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full" style={{ background: "#ff3366", boxShadow: T.glow("#ff3366") }} />
              <span className="font-tech text-[9px] uppercase tracking-[0.3em]" style={{ color: "rgba(255,51,102,0.5)" }}>
                Инкогнито · RAM only
              </span>
            </div>
            <div className="space-y-2">
              <AnimatePresence>
                {incognito.map(c => (
                  <ArchiveChatRow key={c.id} chat={c} onDelete={() => deleteChat(c.id)} />
                ))}
              </AnimatePresence>
            </div>
          </section>
        )}

        {/* Regular hidden chats */}
        {regular.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#333" }} />
              <span className="font-tech text-[9px] uppercase tracking-[0.3em] text-gray-700">
                Скрытые чаты
              </span>
            </div>
            <div className="space-y-2">
              <AnimatePresence>
                {regular.map(c => (
                  <ArchiveChatRow key={c.id} chat={c} onDelete={() => deleteChat(c.id)} />
                ))}
              </AnimatePresence>
            </div>
          </section>
        )}

        {/* Empty state */}
        {chats.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Archive className="w-10 h-10 mb-4" style={{ color: "#1a1a1a" }} />
            <p className="font-tech text-[10px] uppercase tracking-widest text-gray-800">Архив пуст</p>
          </div>
        )}

        {/* Info block */}
        <div className="p-4 rounded-sm"
          style={{ background: "rgba(255,51,102,0.03)", border: "1px solid rgba(255,51,102,0.08)" }}>
          <p className="font-tech text-[9px] uppercase tracking-widest leading-relaxed"
            style={{ color: "rgba(255,51,102,0.3)" }}>
            Инкогнито чаты хранятся только в RAM устройства.
            Автоматически удаляются через 10 минут после выхода из сессии.
            Не оставляют следов в постоянной памяти.
          </p>
        </div>

        {/* Add new incognito */}
        <NewIncognitoDropdown
          onPickContact={() => setPickContactModal(true)}
          onEnterId={() => setEnterIdModal(true)}
        />

      </div>

      <AnimatePresence>
        {pickContactModal && (
          <PickContactModal
            onClose={() => setPickContactModal(false)}
            onSelect={(name) => { createIncognitoChat(name); setPickContactModal(false); }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {enterIdModal && (
          <EnterIdModal
            onClose={() => setEnterIdModal(false)}
            onSelect={(id) => { createIncognitoChat(id); setEnterIdModal(false); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
