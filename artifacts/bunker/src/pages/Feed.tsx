import { motion } from "framer-motion";
import { Radio, Lock } from "lucide-react";
import { T } from "@/lib/constants";

export default function Feed() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center pb-24 px-6 text-center" style={{ background: "#050508" }}>
      {/* Decorative rings */}
      <div className="relative mb-12">
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            animate={{ scale: [1, 1.4 + i * 0.25, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.6, ease: "easeOut" }}
            className="absolute rounded-full border"
            style={{
              inset: `${-i * 20}px`,
              borderColor: `rgba(0,240,255,${0.15 - i * 0.04})`,
            }}
          />
        ))}
        <div
          className="relative w-20 h-20 rounded-full flex items-center justify-center"
          style={{
            background: "rgba(0,240,255,0.08)",
            border: "1px solid rgba(0,240,255,0.25)",
            boxShadow: T.borderGlow("#00f0ff"),
          }}
        >
          <Radio className="w-9 h-9" style={{ color: "#00f0ff", filter: `drop-shadow(${T.glow("#00f0ff")})` }} />
        </div>
      </div>

      <h1
        className="font-display font-black text-4xl tracking-wider uppercase text-white mb-3"
        style={{ textShadow: T.glowText("#00f0ff") }}
      >
        Feed
      </h1>
      <p className="font-tech text-xs tracking-[0.3em] uppercase mb-6" style={{ color: "#00f0ff80" }}>
        Incoming Transmission
      </p>

      <div
        className="flex items-center gap-2 px-5 py-3 rounded-sm mb-4"
        style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(0,240,255,0.15)" }}
      >
        <Lock className="w-4 h-4" style={{ color: "#00ff88" }} />
        <span className="font-tech text-xs tracking-widest uppercase" style={{ color: "#00ff88" }}>
          Private Reels — Coming Soon
        </span>
      </div>

      <p className="font-sans text-xs text-gray-600 max-w-xs leading-relaxed">
        An encrypted, zero-trace video feed is being prepared. All content will be decentralized and surveillance-proof.
      </p>

      {/* Blinking cursor */}
      <div className="mt-10 flex items-center gap-1">
        <span className="font-tech text-xs text-gray-700 tracking-widest">LOADING MODULE</span>
        <motion.span
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 1.1, repeat: Infinity }}
          className="font-tech text-xs"
          style={{ color: "#00f0ff" }}
        >
          _
        </motion.span>
      </div>
    </div>
  );
}
