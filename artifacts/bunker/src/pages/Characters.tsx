import { Link } from "wouter";
import { motion } from "framer-motion";
import { AI_CHARACTERS, T } from "@/lib/constants";

const STATUS_COLORS: Record<string, string> = {
  online: "#00ff88",
  busy:   "#ffd700",
  offline: "#ff3366",
};

export default function Characters() {
  return (
    <div className="min-h-screen pb-28 px-4 pt-12 no-scrollbar overflow-y-auto">
      {/* Header */}
      <header className="mb-8">
        <p
          className="font-tech text-xs tracking-[0.3em] mb-1 uppercase"
          style={{ color: "#00f0ff", textShadow: T.glowText("#00f0ff") }}
        >
          NODE: ALPHA — {AI_CHARACTERS.filter(c => c.status === "online").length} AGENTS ONLINE
        </p>
        <h1
          className="font-display font-black text-3xl tracking-wider uppercase text-white"
          style={{ textShadow: T.glowText("#00f0ff") }}
        >
          AI LOBBY
        </h1>
        <div
          className="mt-3 h-[2px] w-14 rounded-full"
          style={{ background: "#00f0ff", boxShadow: T.glow("#00f0ff") }}
        />
      </header>

      {/* Grid — 2 cols */}
      <div className="grid grid-cols-2 gap-4">
        {AI_CHARACTERS.map((char, i) => {
          const neon = char.color.hex;
          const statusColor = STATUS_COLORS[char.status] ?? "#888";

          return (
            <Link key={char.id} href={`/chat/${char.id}`}>
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07, type: "spring", stiffness: 260, damping: 20 }}
                whileTap={{ scale: 0.95 }}
                className="relative h-52 p-4 flex flex-col justify-between cursor-pointer overflow-hidden rounded-sm group"
                style={{
                  background: "rgba(0,0,0,0.55)",
                  border: `1px solid ${neon}30`,
                  boxShadow: `inset 0 0 20px ${neon}08`,
                  backdropFilter: "blur(12px)",
                  transition: "box-shadow 0.25s, border-color 0.25s",
                }}
                onHoverStart={(e) => {
                  const el = e.target as HTMLElement;
                  el.closest?.(".group")?.setAttribute(
                    "style",
                    `background:rgba(0,0,0,0.55);border:1px solid ${neon}80;box-shadow:${T.borderGlow(neon)};backdrop-filter:blur(12px);transition:box-shadow 0.25s,border-color 0.25s`
                  );
                }}
              >
                {/* Pulsing corner glow */}
                <motion.div
                  animate={{ opacity: [0.3, 0.7, 0.3] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
                  className="absolute top-0 right-0 w-16 h-16 rounded-full pointer-events-none"
                  style={{ background: `radial-gradient(circle, ${neon}30 0%, transparent 70%)` }}
                />

                {/* Scan line on hover */}
                <motion.div
                  initial={{ y: "-100%", opacity: 0 }}
                  whileHover={{ y: "400%", opacity: [0, 0.6, 0] }}
                  transition={{ duration: 0.6 }}
                  className="absolute inset-x-0 h-8 pointer-events-none"
                  style={{ background: `linear-gradient(0deg, transparent, ${neon}30, transparent)` }}
                />

                {/* Top row: avatar + status */}
                <div className="flex items-start justify-between z-10">
                  <div
                    className="w-11 h-11 rounded-sm flex items-center justify-center text-2xl"
                    style={{
                      background: `${neon}12`,
                      border: `1px solid ${neon}35`,
                      boxShadow: `0 0 10px ${neon}25`,
                    }}
                  >
                    {char.avatar}
                  </div>

                  <div
                    className="flex items-center gap-1.5 px-2 py-1 rounded-sm"
                    style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <motion.div
                      animate={char.status === "online" ? { opacity: [1, 0.3, 1] } : {}}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: statusColor, boxShadow: `0 0 6px ${statusColor}` }}
                    />
                    <span className="font-tech text-[9px] uppercase tracking-widest" style={{ color: statusColor }}>
                      {char.status}
                    </span>
                  </div>
                </div>

                {/* Bottom: name + specialty */}
                <div className="z-10">
                  <h3
                    className="font-display font-bold text-lg text-white uppercase tracking-wide leading-tight"
                    style={{ textShadow: T.glowText(neon) }}
                  >
                    {char.name}
                  </h3>
                  <p className="font-tech text-[11px] text-gray-500 mt-1 uppercase tracking-wider">
                    {char.specialty}
                  </p>
                  {/* neon bottom line */}
                  <div
                    className="mt-3 h-[1px] w-full rounded-full opacity-40"
                    style={{ background: `linear-gradient(90deg, ${neon}, transparent)` }}
                  />
                </div>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
