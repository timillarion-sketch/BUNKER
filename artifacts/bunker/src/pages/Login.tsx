import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Fingerprint, Zap, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { T } from "@/lib/constants";

// ─── Matrix rain canvas ───────────────────────────────────
function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const chars = "01アイウエオカキクケコサシスセソタチツテトナニヌネノ#@%&*";
    const fontSize = 13;
    let cols = Math.floor(canvas.width / fontSize);
    let drops: number[] = Array(cols).fill(1);

    const draw = () => {
      ctx.fillStyle = "rgba(0,0,0,0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${fontSize}px monospace`;
      cols = Math.floor(canvas.width / fontSize);
      if (drops.length < cols) drops = drops.concat(Array(cols - drops.length).fill(1));

      drops.forEach((y, i) => {
        const char = chars[Math.floor(Math.random() * chars.length)];
        const isHead = Math.random() > 0.96;
        ctx.fillStyle = isHead ? "#ffffff" : i % 3 === 0 ? "#ff00cc" : "#00f0ff";
        ctx.globalAlpha = isHead ? 1 : Math.random() * 0.7 + 0.1;
        ctx.fillText(char, i * fontSize, y * fontSize);
        ctx.globalAlpha = 1;

        if (y * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      });
    };

    const interval = setInterval(draw, 50);
    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full opacity-30 pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
}

// ─── Glitch text ──────────────────────────────────────────
function GlitchText({ text }: { text: string }) {
  const [glitch, setGlitch] = useState(false);

  useEffect(() => {
    const cycle = () => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 150 + Math.random() * 100);
    };
    const id = setInterval(cycle, 2800 + Math.random() * 2000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative inline-block select-none">
      <span
        className="font-display font-black text-6xl tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-cyan-400"
        style={{ textShadow: T.glowText("#00f0ff"), filter: glitch ? "blur(1px)" : "none" }}
      >
        {text}
      </span>
      {/* glitch layers */}
      <AnimatePresence>
        {glitch && (
          <>
            <motion.span
              key="g1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8, x: -3, skewX: -3 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.08 }}
              className="absolute inset-0 font-display font-black text-6xl tracking-tighter text-pink-500 pointer-events-none"
              style={{ clipPath: "polygon(0 20%, 100% 20%, 100% 40%, 0 40%)" }}
              aria-hidden
            >
              {text}
            </motion.span>
            <motion.span
              key="g2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6, x: 3, skewX: 2 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              className="absolute inset-0 font-display font-black text-6xl tracking-tighter text-cyan-400 pointer-events-none"
              style={{ clipPath: "polygon(0 60%, 100% 60%, 100% 80%, 0 80%)" }}
              aria-hidden
            >
              {text}
            </motion.span>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Scanline CRT overlay ─────────────────────────────────
function CRTOverlay() {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        zIndex: 50,
        background:
          "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)",
        backgroundSize: "100% 4px",
      }}
    />
  );
}

// ─── Neon button ──────────────────────────────────────────
interface NeonBtnProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: "blue" | "pink";
  icon?: React.ReactNode;
}
function NeonBtn({ onClick, children, variant = "blue", icon }: NeonBtnProps) {
  const blue = variant === "blue";
  const color = blue ? "#00f0ff" : "#ff00cc";
  const bg = blue ? "rgba(0,240,255,0.08)" : "rgba(255,0,204,0.08)";
  const border = blue ? "rgba(0,240,255,0.4)" : "rgba(255,0,204,0.4)";

  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className="w-full flex items-center justify-center gap-3 py-4 font-display font-bold tracking-[0.2em] text-sm uppercase transition-all duration-200 rounded-sm"
      style={{
        background: bg,
        border: `1px solid ${border}`,
        color,
        boxShadow: T.glow(color),
        letterSpacing: "0.25em",
      }}
    >
      {icon}
      {children}
    </motion.button>
  );
}

// ─── Main Login page ──────────────────────────────────────
export default function Login() {
  const { login } = useAuth();

  return (
    <div className="min-h-screen w-full relative flex flex-col items-center justify-center overflow-hidden bg-black">
      {/* Background image */}
      <div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage: `url(${import.meta.env.BASE_URL}images/cyber-bg.png)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          zIndex: 0,
        }}
      />

      {/* Matrix rain */}
      <MatrixRain />

      {/* CRT scanlines */}
      <CRTOverlay />

      {/* Content */}
      <div className="relative w-full max-w-sm px-6 flex flex-col items-center" style={{ zIndex: 10 }}>
        {/* Logo */}
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="mb-12 flex flex-col items-center gap-5"
        >
          <div className="relative w-28 h-28">
            <div
              className="absolute inset-0 rounded-full"
              style={{ background: "radial-gradient(circle, rgba(0,240,255,0.25) 0%, transparent 70%)", filter: "blur(8px)", animation: "pulse 2s infinite" }}
            />
            <img
              src={`${import.meta.env.BASE_URL}images/bunker-logo.png`}
              alt="BUNKER"
              className="w-full h-full object-contain"
              style={{ filter: `drop-shadow(${T.glow("#00f0ff")})` }}
            />
          </div>

          <GlitchText text="BUNKER" />

          <p
            className="font-tech text-xs tracking-[0.35em] uppercase text-center"
            style={{ color: "#ff00cc", textShadow: T.glowText("#ff00cc") }}
          >
            Maximum Privacy.
            <br />
            Zero Compromise.
          </p>
        </motion.div>

        {/* Auth card */}
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.25, ease: "easeOut" }}
          className="w-full rounded-sm overflow-hidden"
          style={{
            background: "rgba(0,0,0,0.75)",
            border: "1px solid rgba(0,240,255,0.2)",
            boxShadow: "0 0 40px rgba(0,240,255,0.08), inset 0 0 20px rgba(0,0,0,0.5)",
            backdropFilter: "blur(20px)",
          }}
        >
          {/* top accent bar */}
          <div
            style={{
              height: 1,
              background: "linear-gradient(90deg, transparent, #00f0ff, #ff00cc, transparent)",
            }}
          />
          <div className="p-8 space-y-4">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span className="font-tech text-xs tracking-[0.25em] text-gray-400 uppercase">
                Secure Node Authentication
              </span>
            </div>

            <NeonBtn variant="blue" icon={<Zap className="w-4 h-4" />} onClick={() => login("VK")}>
              Initiate VK Link
            </NeonBtn>

            <NeonBtn variant="pink" icon={<Fingerprint className="w-4 h-4" />} onClick={() => login("Yandex")}>
              Yandex Biometrics
            </NeonBtn>
          </div>
          {/* bottom accent bar */}
          <div
            style={{
              height: 1,
              background: "linear-gradient(90deg, transparent, #ff00cc, #00f0ff, transparent)",
            }}
          />
        </motion.div>
      </div>
    </div>
  );
}
