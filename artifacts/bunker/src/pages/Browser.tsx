import { useState } from "react";
import { useAnalyzePage } from "@workspace/api-client-react";
import { Brain, Search, X, ShieldAlert, ShieldCheck, Shield, Wifi, Eye, EyeOff, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { T } from "@/lib/constants";
import { useTranslation } from "react-i18next";

const PRIVACY = { vpn: true, tor: false, trackers: 7 };

function PrivacyBar({ url }: { url: string }) {
  const { t } = useTranslation();
  const riskColor = PRIVACY.trackers > 5 ? "#ff3366" : PRIVACY.trackers > 2 ? "#ffd700" : "#00ff88";
  const chip = (color: string, icon: React.ReactNode, label: string) => (
    <div className="flex items-center gap-1 px-2 py-0.5 rounded-sm shrink-0 font-tech text-[10px] uppercase tracking-widest"
      style={{ background: `${color}10`, border: `1px solid ${color}30`, color }}>
      {icon}<span>{label}</span>
    </div>
  );
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 overflow-x-auto no-scrollbar"
      style={{ background: "rgba(0,0,0,0.6)", borderBottom: "1px solid rgba(0,240,255,0.1)" }}>
      {chip(PRIVACY.vpn ? "#00ff88" : "#ff3366", <Wifi className="w-3 h-3" />, PRIVACY.vpn ? t("browser.vpnOn") : t("browser.vpnOff"))}
      {chip(PRIVACY.tor ? "#00f0ff" : "#555", <Eye className="w-3 h-3" />, PRIVACY.tor ? t("browser.torOn") : t("browser.torOff"))}
      {chip(riskColor, <EyeOff className="w-3 h-3" />, t("browser.trackers", { count: PRIVACY.trackers }))}
      <div className="ml-auto shrink-0 text-gray-600 font-mono text-[10px] truncate max-w-[100px]">
        {(() => { try { return new URL(url).hostname; } catch { return url; } })()}
      </div>
    </div>
  );
}

export default function Browser() {
  const { t } = useTranslation();
  const [url, setUrl] = useState("https://en.wikipedia.org/wiki/Cyberpunk");
  const [inputUrl, setInputUrl] = useState(url);
  const [showSheet, setShowSheet] = useState(false);
  const analyzeMutation = useAnalyzePage();

  const handleNavigate = (e: React.FormEvent) => {
    e.preventDefault();
    let final = inputUrl.trim();
    if (!final.startsWith("http://") && !final.startsWith("https://")) final = "https://" + final;
    setUrl(final); setInputUrl(final);
  };

  const handleAnalyze = () => { setShowSheet(true); analyzeMutation.mutate({ data: { url } }); };
  const risk = analyzeMutation.data?.privacyRisk;
  const riskLabel = risk ? t(`browser.risk.${risk}`) : "";
  const riskColor = risk === "low" ? "#00ff88" : risk === "medium" ? "#ffd700" : "#ff3366";

  return (
    <div className="flex flex-col h-screen pb-16" style={{ background: "#050508" }}>
      <form onSubmit={handleNavigate} className="flex items-center gap-2 px-3 py-2 z-10 sticky top-0"
        style={{ background: "rgba(5,5,10,0.95)", borderBottom: "1px solid rgba(0,240,255,0.15)", backdropFilter: "blur(16px)" }}>
        <Search className="w-4 h-4 shrink-0" style={{ color: "#00f0ff" }} />
        <input type="text" value={inputUrl} onChange={e => setInputUrl(e.target.value)}
          className="flex-1 bg-transparent text-sm font-tech text-white tracking-wide focus:outline-none"
          placeholder="https://..." style={{ caretColor: "#00f0ff" }} />
        <button type="submit" className="shrink-0 p-1.5" style={{ color: "#00f0ff" }}>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <PrivacyBar url={url} />

      <div className="flex-1 relative">
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{ backgroundImage: "linear-gradient(#00f0ff55 1px, transparent 1px), linear-gradient(90deg, #00f0ff55 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
        <iframe src={url} className="w-full h-full border-none relative z-10 bg-white"
          sandbox="allow-scripts allow-same-origin allow-forms" title="BUNKER AI Browser" />
        <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }} onClick={handleAnalyze}
          className="absolute bottom-6 right-5 z-20 w-14 h-14 rounded-full flex items-center justify-center overflow-hidden"
          style={{ background: "rgba(255,0,204,0.15)", border: "1px solid rgba(255,0,204,0.5)", boxShadow: T.glowStrong("#ff00cc") }}>
          <motion.div animate={{ scale: [1, 1.8, 1], opacity: [0.4, 0, 0.4] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut" }}
            className="absolute inset-0 rounded-full" style={{ border: "1px solid rgba(255,0,204,0.4)" }} />
          <Brain className="w-6 h-6 relative z-10" style={{ color: "#ff00cc", filter: `drop-shadow(${T.glow("#ff00cc")})` }} />
        </motion.button>
      </div>

      <AnimatePresence>
        {showSheet && (
          <>
            <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowSheet(false)} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40" />
            <motion.div key="sheet" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] overflow-y-auto no-scrollbar rounded-t-2xl"
              style={{ background: "rgba(5,5,10,0.97)", borderTop: "1px solid rgba(255,0,204,0.3)",
                boxShadow: "-0px -20px 60px rgba(255,0,204,0.1)", backdropFilter: "blur(24px)" }}>
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full" style={{ background: "rgba(255,0,204,0.3)" }} />
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-sm"
                      style={{ background: "rgba(255,0,204,0.12)", border: "1px solid rgba(255,0,204,0.3)" }}>
                      <Brain className="w-5 h-5" style={{ color: "#ff00cc", filter: `drop-shadow(${T.glow("#ff00cc")})` }} />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-lg text-white uppercase tracking-wider">{t("browser.neuralAnalysis")}</h3>
                      <p className="font-tech text-[10px] tracking-widest uppercase" style={{ color: "#ff00cc80" }}>
                        {(() => { try { return new URL(url).hostname; } catch { return url; } })()}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setShowSheet(false)} className="p-2 rounded-full text-gray-500 hover:text-white hover:bg-white/10 transition-colors"><X className="w-5 h-5" /></button>
                </div>

                {analyzeMutation.isPending ? (
                  <div className="flex flex-col items-center justify-center py-14 gap-5">
                    <div className="relative w-16 h-16">
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 rounded-full" style={{ border: "2px solid transparent", borderTopColor: "#00f0ff" }} />
                      <motion.div animate={{ rotate: -360 }} transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-2 rounded-full" style={{ border: "2px solid transparent", borderTopColor: "#ff00cc" }} />
                      <Brain className="absolute inset-0 m-auto w-6 h-6 text-white/40" />
                    </div>
                    <p className="font-tech text-xs tracking-[0.4em] uppercase animate-pulse" style={{ color: "#00f0ff", textShadow: T.glowText("#00f0ff") }}>
                      {t("browser.analyzing")}
                    </p>
                  </div>
                ) : analyzeMutation.isError ? (
                  <div className="p-4 font-tech text-sm rounded-sm"
                    style={{ background: "rgba(255,51,102,0.08)", border: "1px solid rgba(255,51,102,0.3)", color: "#ff3366" }}>
                    {t("browser.error")}
                  </div>
                ) : analyzeMutation.data ? (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between p-4 rounded-sm"
                      style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <span className="font-tech text-xs text-gray-400 uppercase tracking-widest">{t("browser.privacyThreat")}</span>
                      <div className="flex items-center gap-2">
                        {risk === "low"    && <ShieldCheck className="w-5 h-5" style={{ color: riskColor }} />}
                        {risk === "medium" && <Shield className="w-5 h-5"      style={{ color: riskColor }} />}
                        {risk === "high"   && <ShieldAlert className="w-5 h-5" style={{ color: riskColor }} />}
                        <span className="font-display font-bold uppercase text-sm" style={{ color: riskColor, textShadow: T.glowText(riskColor) }}>{riskLabel}</span>
                      </div>
                    </div>
                    <div>
                      <p className="font-tech text-[10px] tracking-widest text-cyan-500 uppercase mb-2">› {t("browser.coreSynthesis")}</p>
                      <p className="text-sm text-white/80 leading-relaxed pl-4" style={{ borderLeft: "2px solid rgba(0,240,255,0.3)" }}>
                        {analyzeMutation.data.summary}
                      </p>
                    </div>
                    <div>
                      <p className="font-tech text-[10px] tracking-widest text-pink-500 uppercase mb-3">› {t("browser.vectors")}</p>
                      <ul className="space-y-2">
                        {analyzeMutation.data.keyPoints.map((pt, i) => (
                          <li key={i} className="flex gap-3 text-sm text-white/70 items-start p-2 rounded-sm" style={{ background: "rgba(255,255,255,0.02)" }}>
                            <span style={{ color: "#ff00cc" }}>▪</span>{pt}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : null}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
