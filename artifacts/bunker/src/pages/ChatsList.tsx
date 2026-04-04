import { motion } from "framer-motion";
import { Lock, Shield, Plus } from "lucide-react";
import { T } from "@/lib/constants";
import { useTranslation } from "react-i18next";

const CONVERSATIONS = [
  { id: "c1", name: "Agent K",   color: "#00f0ff", lastMsg: "Drop point secured. Awaiting signal.",         time: "14:23", unread: 2,  encrypted: true },
  { id: "c2", name: "ZeroCool",  color: "#ff00cc", lastMsg: "The mainframe is patched. Need another way.", time: "09:11", unread: 0,  encrypted: true },
  { id: "c3", name: "Morpheus",  color: "#00ff88", lastMsg: "Hack the planet.",                            time: "Yesterday", unread: 0, encrypted: true },
  { id: "c4", name: "Trinity",   color: "#bf00ff", lastMsg: "Follow the white rabbit.",                    time: "Tuesday",   unread: 1, encrypted: true },
  { id: "c5", name: "Ghost",     color: "#ffd700", lastMsg: "Signal lost. Reconnecting...",               time: "Tuesday",   unread: 0, encrypted: false },
];

export default function ChatsList() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen pb-28 px-4 pt-12 no-scrollbar overflow-y-auto">
      <header className="mb-6 flex items-end justify-between">
        <div>
          <p className="font-tech text-xs tracking-[0.3em] mb-1 uppercase" style={{ color: "#ff00cc", textShadow: T.glowText("#ff00cc") }}>
            {t("chats.subheader")}
          </p>
          <h1 className="font-display font-black text-3xl tracking-wider uppercase text-white" style={{ textShadow: T.glowText("#ff00cc") }}>
            {t("chats.header")}
          </h1>
          <div className="mt-3 h-[2px] w-14 rounded-full" style={{ background: "#ff00cc", boxShadow: T.glow("#ff00cc") }} />
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm"
          style={{ background: "rgba(0,255,136,0.08)", border: "1px solid rgba(0,255,136,0.2)" }}>
          <Lock className="w-3 h-3" style={{ color: "#00ff88" }} />
          <span className="font-tech text-[9px] uppercase tracking-widest" style={{ color: "#00ff88" }}>{t("chats.e2eActive")}</span>
        </div>
      </header>

      <div className="mb-6 p-3 flex gap-3 items-start rounded-sm"
        style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(0,240,255,0.1)", borderLeft: "2px solid rgba(0,240,255,0.5)", backdropFilter: "blur(8px)" }}>
        <Shield className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#00f0ff" }} />
        <div>
          <p className="font-tech text-[10px] text-white uppercase tracking-wider mb-0.5">{t("chats.protocolTitle")}</p>
          <p className="font-sans text-[10px] text-gray-500 leading-relaxed">{t("chats.protocolDesc")}</p>
        </div>
      </div>

      <div className="space-y-2">
        {CONVERSATIONS.map((chat, i) => (
          <motion.div key={chat.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07, type: "spring", stiffness: 260, damping: 22 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-4 p-4 cursor-pointer transition-all rounded-sm group"
            style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.04)", backdropFilter: "blur(8px)" }}>
            <div className="relative shrink-0">
              <div className="w-12 h-12 rounded-sm flex items-center justify-center font-display font-black text-xl text-black uppercase"
                style={{ background: `linear-gradient(135deg, ${chat.color}, ${chat.color}80)`, boxShadow: T.glow(chat.color) }}>
                {chat.name.charAt(0)}
              </div>
              {chat.unread > 0 && (
                <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-black border-2 border-black"
                  style={{ background: "#ff00cc", boxShadow: T.glow("#ff00cc") }}>{chat.unread}</motion.div>
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

      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        className="fixed bottom-24 right-5 z-30 w-13 h-13 rounded-full flex items-center justify-center p-3.5"
        style={{ background: "rgba(255,0,204,0.12)", border: "1px solid rgba(255,0,204,0.4)", boxShadow: T.glow("#ff00cc") }}>
        <Plus className="w-5 h-5" style={{ color: "#ff00cc" }} />
      </motion.button>
    </div>
  );
}
