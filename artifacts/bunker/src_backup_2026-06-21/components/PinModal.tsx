import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSecretPin } from "@/hooks/use-secret-pin";
import { Archive, Delete } from "lucide-react";

interface Props {
  mode: "setup" | "verify";
  onSuccess: () => void;
  onCancel:  () => void;
}

const PAD = [1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, "⌫"] as const;

export function PinModal({ mode, onSuccess, onCancel }: Props) {
  const { setPin, verifyPin } = useSecretPin();

  const [stage, setStage]         = useState<"enter" | "confirm">(mode === "setup" ? "enter" : "enter");
  const [pin, setPin_]            = useState("");
  const [firstPin, setFirstPin]   = useState("");
  const [error, setError]         = useState("");
  const [shake, setShake]         = useState(false);
  const [success, setSuccess]     = useState(false);
  const shakeTimer                = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerShake = (msg: string) => {
    setError(msg);
    setShake(true);
    setPin_("");
    if (shakeTimer.current) clearTimeout(shakeTimer.current);
    shakeTimer.current = setTimeout(() => { setShake(false); setError(""); }, 1200);
  };

  const handleKey = (key: typeof PAD[number]) => {
    if (key === null) return;
    if (key === "⌫") {
      setPin_(p => p.slice(0, -1));
      return;
    }
    const next = pin + String(key);
    if (next.length > 4) return;
    setPin_(next);

    if (next.length === 4) {
      setTimeout(() => processPin(next), 80);
    }
  };

  const processPin = (p: string) => {
    if (mode === "verify") {
      if (verifyPin(p)) {
        setSuccess(true);
        setTimeout(onSuccess, 500);
      } else {
        triggerShake("Неверный код");
      }
      return;
    }

    // Setup mode
    if (stage === "enter") {
      setFirstPin(p);
      setPin_("");
      setStage("confirm");
    } else {
      if (p === firstPin) {
        setPin(p);
        setSuccess(true);
        setTimeout(onSuccess, 500);
      } else {
        setStage("enter");
        setFirstPin("");
        triggerShake("Коды не совпадают");
      }
    }
  };

  // Block tap-to-close backdrop
  const stageLabel = mode === "setup"
    ? (stage === "enter" ? "Создай PIN-код" : "Повтори PIN-код")
    : "Введи PIN-код";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
      style={{ background: "rgba(0,0,0,0.97)", backdropFilter: "blur(20px)" }}
    >
      {/* Archive icon */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.08 }}
        className="mb-6 flex flex-col items-center gap-3"
      >
        <div className="w-14 h-14 rounded-sm flex items-center justify-center"
          style={{ background: "rgba(255,51,102,0.08)", border: "1px solid rgba(255,51,102,0.25)" }}>
          <Archive className="w-7 h-7" style={{ color: "#ff3366" }} />
        </div>
        <div className="text-center">
          <p className="font-tech text-[9px] uppercase tracking-[0.4em] text-gray-700 mb-1">СЕКРЕТНЫЙ АРХИВ</p>
          <AnimatePresence mode="wait">
            <motion.p key={stageLabel}
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              className="font-display font-bold text-sm uppercase tracking-widest"
              style={{ color: shake ? "#ff3366" : "#666" }}>
              {error || stageLabel}
            </motion.p>
          </AnimatePresence>
        </div>
      </motion.div>

      {/* PIN dots */}
      <motion.div
        animate={shake ? { x: [-8, 8, -6, 6, -4, 4, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="flex gap-4 mb-8"
      >
        {[0, 1, 2, 3].map(i => {
          const filled = i < pin.length;
          return (
            <motion.div
              key={i}
              animate={filled
                ? { scale: [1, 1.3, 1], background: success ? "#00ff88" : shake ? "#ff3366" : "#ff3366" }
                : { scale: 1 }
              }
              className="w-3.5 h-3.5 rounded-full"
              style={{
                background:  filled ? (shake ? "#ff3366" : success ? "#00ff88" : "#ff3366") : "rgba(255,255,255,0.1)",
                boxShadow:   filled ? `0 0 10px ${shake ? "#ff3366" : success ? "#00ff88" : "#ff3366"}` : "none",
                transition:  "background 0.2s",
              }}
            />
          );
        })}
      </motion.div>

      {/* Numpad */}
      <div className="grid grid-cols-3 gap-3 w-60">
        {PAD.map((key, idx) => {
          if (key === null) return <div key={idx} />;
          return (
            <motion.button
              key={idx}
              whileTap={{ scale: 0.88, background: "rgba(255,51,102,0.18)" }}
              onClick={() => handleKey(key)}
              className="h-14 rounded-sm flex items-center justify-center transition-all"
              style={{
                background: "rgba(255,255,255,0.04)",
                border:     "1px solid rgba(255,255,255,0.07)",
              }}
            >
              {key === "⌫"
                ? <Delete className="w-4 h-4 text-gray-600" />
                : <span className="font-display font-bold text-xl text-white">{key}</span>
              }
            </motion.button>
          );
        })}
      </div>

      {/* Cancel */}
      <button
        onClick={onCancel}
        className="mt-8 font-tech text-[10px] uppercase tracking-widest text-gray-700 hover:text-gray-500 transition-colors"
      >
        Отмена
      </button>
    </motion.div>
  );
}
