import { useState, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Shield, Plus, Radio, Wifi, Hexagon, X, UserPlus } from "lucide-react";
import { T, getUserId } from "@/lib/constants";
import { api } from "@/lib/api";
import { MOCK_CONVERSATIONS, MOCK_NODES } from "@/lib/fixtures";
import { useSecretPin } from "@/hooks/use-secret-pin";
import { PinModal } from "@/components/PinModal";
import { useTranslation } from "react-i18next";
import { useRealtime } from "@/hooks/use-realtime";
import { useToast } from "@/hooks/use-toast";

function rssiBar(rssi: number) {
  const pct   = Math.min(100, Math.max(0, ((rssi + 100) / 60) * 100));
  const color = pct > 60 ? "#00ff88" : pct > 30 ? "#ffd700" : "#ff3366";
  return { pct, color };
}

function RadarDot({ delay = 0, angle = 0, dist = 0.55 }: { delay?: number; angle?: number; dist?: number }) {
  const x = 50 + dist * 50 * Math.cos((angle * Math.PI) / 180);
  const y = 50 + dist * 50 * Math.sin((angle * Math.PI) / 180);
  return (
    <motion.circle cx={`${x}%`} cy={`${y}%`} r="3.5" fill="#00ff88"
      initial={{ opacity: 0, scale: 0 }} animate={{ opacity: [0, 1, 0.7], scale: [0, 1.2, 1] }}
      transition={{ delay, duration: 0.6 }} style={{ filter: "drop-shadow(0 0 4px #00ff88)" }} />
  );
}

function MeshRadar({ active }: { active: boolean }) {
  return (
    <div className="relative w-20 h-20 shrink-0">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {[38, 26, 14].map((r, i) => (
          <circle key={i} cx="50%" cy="50%" r={`${r}%`} fill="none"
            stroke={active ? "#00ff8830" : "#ffffff08"} strokeWidth="1" />
        ))}
        <line x1="50%" y1="8%" x2="50%" y2="92%" stroke={active ? "#00ff8820" : "#ffffff06"} strokeWidth="0.8" />
        <line x1="8%" y1="50%" x2="92%" y2="50%" stroke={active ? "#00ff8820" : "#ffffff06"} strokeWidth="0.8" />
        {active && (
          <motion.line x1="50%" y1="50%" x2="50%" y2="14%" stroke="#00ff88" strokeWidth="1.5" strokeLinecap="round"
            style={{ transformOrigin: "50% 50%", filter: "drop-shadow(0 0 3px #00ff88)" }}
            animate={{ rotate: 360 }} transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }} />
        )}
        <circle cx="50%" cy="50%" r="3" fill={active ? "#00ff88" : "#333"}
          style={{ filter: active ? "drop-shadow(0 0 5px #00ff88)" : "none" }} />
        {active && (
          <>
            <RadarDot delay={0.5} angle={-55}  dist={0.42} />
            <RadarDot delay={0.9} angle={110}  dist={0.62} />
            <RadarDot delay={1.3} angle={200}  dist={0.35} />
          </>
        )}
      </svg>
    </div>
  );
}

function MeshBar() {
  const [active,   setActive]   = useState(false);
  const [scanning, setScanning] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const simulate = () => {
    if (active) { setActive(false); setExpanded(false); return; }
    setScanning(true);
    setTimeout(() => { setScanning(false); setActive(true); }, 1800);
  };

  const statusColor = active ? "#00ff88" : scanning ? "#ffd700" : "#333";
  const statusLabel = active   ? "Найдено узлов: 3"
                    : scanning ? "Сканирование..."
                    :            "Узлов в радиусе: 0";

  return (
    <motion.div layout className="mb-5 rounded-sm overflow-hidden"
      style={{ background: "rgba(0,0,0,0.5)", border: `1px solid ${active ? "#00ff8830" : scanning ? "#ffd70030" : "rgba(255,255,255,0.06)"}`, backdropFilter: "blur(12px)", boxShadow: active ? "0 0 24px rgba(0,255,136,0.08)" : "none", transition: "border-color 0.4s, box-shadow 0.4s" }}>
      <div className="flex items-center gap-4 p-4">
        <MeshRadar active={active} />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 shrink-0" style={{ color: statusColor, filter: active ? `drop-shadow(${T.glow(statusColor)})` : "none" }} />
            <span className="font-tech text-xs uppercase tracking-widest" style={{ color: statusColor, textShadow: active ? T.glowText(statusColor) : "none" }}>MESH</span>
            {active && (
              <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#00ff88", boxShadow: T.glow("#00ff88") }} />
            )}
          </div>
          <AnimatePresence mode="wait">
            <motion.p key={statusLabel} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.25 }}
              className="font-display font-bold text-sm uppercase tracking-wider" style={{ color: active ? "#fff" : "#444", textShadow: active ? T.glowText("#00ff88") : "none" }}>
              {statusLabel}
            </motion.p>
          </AnimatePresence>
          {active && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-end gap-0.5 h-3">
              {MOCK_NODES.map((node, i) => {
                const { pct, color } = rssiBar(node.rssi);
                return (
                  <motion.div key={node.id} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
                    transition={{ delay: 0.3 + i * 0.1, type: "spring", stiffness: 300 }}
                    className="w-5 rounded-sm origin-bottom"
                    style={{ height: `${Math.max(30, pct)}%`, background: color, boxShadow: `0 0 4px ${color}60` }} />
                );
              })}
              <span className="font-tech text-[9px] text-gray-600 ml-2 self-end uppercase tracking-widest">сигнал</span>
            </motion.div>
          )}
        </div>
        {active && (
          <button onClick={() => setExpanded(e => !e)} className="shrink-0 p-1 text-gray-600 hover:text-white transition-colors">
            <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <Wifi className="w-4 h-4" style={{ color: "#00ff8870" }} />
            </motion.div>
          </button>
        )}
      </div>
      <AnimatePresence>
        {active && expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }} style={{ borderTop: "1px solid rgba(0,255,136,0.1)", overflow: "hidden" }}>
            <div className="px-4 py-3 space-y-2">
              {MOCK_NODES.map((node, i) => {
                const { pct, color } = rssiBar(node.rssi);
                return (
                  <motion.div key={node.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                    className="flex items-center gap-3 py-2 px-3 rounded-sm"
                    style={{ background: "rgba(0,255,136,0.04)", border: "1px solid rgba(0,255,136,0.1)" }}>
                    <Hexagon className="w-4 h-4 shrink-0" style={{ color: "#00ff8870" }} />
                    <div className="flex-1 min-w-0">
                      <p className="font-tech text-xs text-white uppercase tracking-wider truncate">{node.name}</p>
                      <p className="font-tech text-[9px] text-gray-600 tracking-wider">{node.lat} · {node.lng}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-12 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
                          className="h-full rounded-full" style={{ background: color }} />
                      </div>
                      <span className="font-tech text-[9px] shrink-0" style={{ color }}>{node.rssi} дБм</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="px-4 pb-4">
        <motion.button onClick={simulate} disabled={scanning} whileTap={{ scale: 0.97 }}
          className="w-full py-2.5 font-display font-bold text-xs uppercase tracking-[0.2em] rounded-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60"
          style={{
            background: active ? "rgba(255,51,102,0.08)" : scanning ? "rgba(255,215,0,0.08)" : "rgba(0,255,136,0.08)",
            border:     active ? "1px solid rgba(255,51,102,0.35)" : scanning ? "1px solid rgba(255,215,0,0.3)" : "1px solid rgba(0,255,136,0.3)",
            color:      active ? "#ff3366" : scanning ? "#ffd700" : "#00ff88",
            boxShadow:  !active && !scanning ? T.glow("#00ff88") : active ? T.glow("#ff3366") : undefined,
          }}>
          {scanning ? (
            <><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}><Radio className="w-3.5 h-3.5" /></motion.div>Сканирование...</>
          ) : active ? (
            <><Radio className="w-3.5 h-3.5" />Сбросить Mesh</>
          ) : (
            <><Radio className="w-3.5 h-3.5" />Эмулировать Mesh-соседство</>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}

// ── Add Contact Modal ──────────────────────────────────────
function AddContactModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { t } = useTranslation();
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!userId.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await api.post("/contacts", { userId: userId.trim() });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("chats.errorGeneric"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
      onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="w-full max-w-sm rounded-sm overflow-hidden"
        style={{ background: "#0a0a0a", border: "1px solid rgba(255,0,204,0.3)", boxShadow: "0 0 40px rgba(255,0,204,0.1)" }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="font-display font-bold text-lg text-white uppercase tracking-wider"
            style={{ textShadow: "0 0 12px rgba(255,0,204,0.4)" }}>
            {t("chats.addContact")}
          </h2>
          <button onClick={onClose} className="p-1 text-gray-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 pb-5 space-y-4">
          <div>
            <input
              value={userId}
              onChange={e => setUserId(e.target.value)}
              placeholder={t("chats.userIdPlaceholder")}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              className="w-full px-4 py-3 rounded-sm text-sm font-sans text-white outline-none transition-all"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,0,204,0.2)" }}
              autoFocus
            />
          </div>
          {error && (
            <p className="text-[11px] font-sans" style={{ color: "#ff3366" }}>{error}</p>
          )}
          <motion.button
            onClick={handleSubmit}
            disabled={loading || !userId.trim()}
            whileTap={{ scale: 0.97 }}
            className="w-full py-3 font-display font-bold text-xs uppercase tracking-[0.15em] rounded-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            style={{
              background: "rgba(255,0,204,0.12)",
              border: "1px solid rgba(255,0,204,0.4)",
              color: "#ff00cc",
              boxShadow: "0 0 20px rgba(255,0,204,0.08)",
            }}>
            {loading ? (
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                <Radio className="w-3.5 h-3.5" />
              </motion.div>
            ) : (
              <UserPlus className="w-3.5 h-3.5" />
            )}
            {loading ? "..." : t("chats.sendRequest")}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────
export default function ChatsList() {
  const { t }        = useTranslation();
  const [, navigate] = useLocation();
  const { hasPinSet } = useSecretPin();
  const { toast }    = useToast();

  const [pinModal, setPinModal] = useState<"setup" | "verify" | null>(null);
  const [addModal, setAddModal] = useState(false);
  const [conversations, setConversations] = useState([...MOCK_CONVERSATIONS]);

  const fetchAndUpdateContacts = useCallback(async () => {
    try {
      const data = await api.get<Array<{ id: number; requesterId: string; addresseeId: string; status: string; createdAt: string }>>("/contacts");
      setConversations(prev => {
        const existingIds = new Set(prev.map(c => c.id));
        const newContacts = data
          .filter(c => c.status === "pending")
          .filter(c => !existingIds.has(`c_${c.id}`))
          .map(c => ({
            id: `c_${c.id}`,
            name: c.addresseeId,
            color: "#ff00cc",
            lastMsg: "Запрос на переписку",
            time: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "",
            unread: 1,
            encrypted: true,
          }));
        if (newContacts.length === 0) return prev;
        return [...newContacts, ...prev];
      });
    } catch { /* ignore */ }
  }, []);

  useRealtime({
    onContact: (data) => {
      if (data?.type === "created" && data?.contact) {
        const uid = getUserId();
        if (data.contact.addresseeId === uid) {
          toast({
            title: "Новый запрос в контакты",
            description: `Пользователь ${data.contact.requesterId} хочет добавить вас в контакты`,
          });
        }
      }
      fetchAndUpdateContacts();
    },
  });

  // ── Long-press on header (800ms, snappy) ──────────────
  const holdTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdActive = useRef(false);

  const startHold = () => {
    holdActive.current = true;
    holdTimer.current = setTimeout(() => {
      if (!holdActive.current) return;
      setPinModal(hasPinSet() ? "verify" : "setup");
    }, 800);
  };

  const cancelHold = () => {
    holdActive.current = false;
    if (holdTimer.current) clearTimeout(holdTimer.current);
  };

  const onPinSuccess = () => {
    setPinModal(null);
    navigate("/secret-archive");
  };

  return (
    <div className="min-h-screen pb-28 px-4 pt-12 no-scrollbar overflow-y-auto">

      {/* Header — long-press triggers archive */}
      <header className="mb-6 flex items-end justify-between">
        <div
          className="select-none cursor-default"
          onPointerDown={startHold}
          onPointerUp={cancelHold}
          onPointerLeave={cancelHold}
          onContextMenu={e => e.preventDefault()}
        >
          <p className="font-tech text-xs tracking-[0.3em] mb-1 uppercase"
            style={{ color: "#ff00cc", textShadow: T.glowText("#ff00cc") }}>
            {t("chats.subheader")}
          </p>
          <h1 className="font-display font-black text-3xl tracking-wider uppercase text-white"
            style={{ textShadow: T.glowText("#ff00cc") }}>
            {t("chats.header")}
          </h1>
          <div className="mt-3 h-[2px] w-14 rounded-full"
            style={{ background: "#ff00cc", boxShadow: T.glow("#ff00cc") }} />
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm"
          style={{ background: "rgba(0,255,136,0.08)", border: "1px solid rgba(0,255,136,0.2)" }}>
          <Lock className="w-3 h-3" style={{ color: "#00ff88" }} />
          <span className="font-tech text-[9px] uppercase tracking-widest" style={{ color: "#00ff88" }}>
            {t("chats.e2eActive")}
          </span>
        </div>
      </header>

      <MeshBar />

      {/* E2E info */}
      <div className="mb-5 p-3 flex gap-3 items-start rounded-sm"
        style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(0,240,255,0.1)", borderLeft: "2px solid rgba(0,240,255,0.5)", backdropFilter: "blur(8px)" }}>
        <Shield className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#00f0ff" }} />
        <div>
          <p className="font-tech text-[10px] text-white uppercase tracking-wider mb-0.5">{t("chats.protocolTitle")}</p>
          <p className="font-sans text-[10px] text-gray-500 leading-relaxed">{t("chats.protocolDesc")}</p>
        </div>
      </div>

      {/* Conversation list */}
      <div className="space-y-2">
        {conversations.map((chat, i) => (
          <motion.div key={chat.id}
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07, type: "spring", stiffness: 260, damping: 22 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-4 p-4 cursor-pointer transition-all rounded-sm"
            style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.04)", backdropFilter: "blur(8px)" }}>
            <div className="relative shrink-0">
              <div className="w-12 h-12 rounded-sm flex items-center justify-center font-display font-black text-xl text-black uppercase"
                style={{ background: `linear-gradient(135deg, ${chat.color}, ${chat.color}80)`, boxShadow: T.glow(chat.color) }}>
                {chat.name.charAt(0)}
              </div>
              {chat.unread > 0 && (
                <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-black border-2 border-black"
                  style={{ background: "#ff00cc", boxShadow: T.glow("#ff00cc") }}>
                  {chat.unread}
                </motion.div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between mb-1">
                <h3 className="font-display font-bold text-sm text-white uppercase tracking-wide truncate">{chat.name}</h3>
                <span className="font-tech text-[9px] text-gray-600 shrink-0 ml-2 tracking-wider">{chat.time}</span>
              </div>
              <p className="text-[11px] text-gray-500 truncate font-sans leading-snug">{chat.lastMsg}</p>
            </div>
            <Lock className="w-3 h-3 shrink-0" style={{ color: chat.encrypted ? "#00ff8840" : "#ff336640" }} />
          </motion.div>
        ))}
      </div>

      {/* FAB */}
      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        onClick={() => setAddModal(true)}
        className="fixed bottom-24 right-5 z-30 rounded-full flex items-center justify-center p-3.5"
        style={{ background: "rgba(255,0,204,0.12)", border: "1px solid rgba(255,0,204,0.4)", boxShadow: T.glow("#ff00cc") }}>
        <Plus className="w-5 h-5" style={{ color: "#ff00cc" }} />
      </motion.button>

      {/* PIN Modal */}
      <AnimatePresence>
        {pinModal && (
          <PinModal
            mode={pinModal}
            onSuccess={onPinSuccess}
            onCancel={() => setPinModal(null)}
          />
        )}
      </AnimatePresence>

      {/* Add Contact Modal */}
      <AnimatePresence>
        {addModal && (
          <AddContactModal
            onClose={() => setAddModal(false)}
            onSuccess={() => {
              api.get<Array<{ id: number; addresseeId: string; status: string; createdAt: string }>>("/contacts").then(data => {
                setConversations(prev => {
                  const newContacts = data
                    .filter(c => c.status === "pending")
                    .map(c => ({
                      id: `c_${c.id}`,
                      name: c.addresseeId,
                      color: "#ff00cc",
                      lastMsg: "Запрос на переписку",
                      time: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "",
                      unread: 1,
                      encrypted: true,
                    }));
                  return [...newContacts, ...prev];
                });
              });
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
