import { Link, useLocation } from "wouter";
import { Sparkles, Globe, MessageSquare, Radio, UserCircle } from "lucide-react";
import { motion } from "framer-motion";
import { NAV_ITEMS, T } from "@/lib/constants";
import { useTranslation } from "react-i18next";

const ICON_MAP: Record<string, any> = {
  Sparkles, Globe, MessageSquare, Radio, UserCircle,
};

export function BottomNav() {
  const [location] = useLocation();
  const { t } = useTranslation();

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background:     "rgba(3,3,8,0.94)",
        borderTop:      "1px solid rgba(0,240,255,0.10)",
        backdropFilter: "blur(24px)",
        boxShadow:      "0 -8px 30px rgba(0,0,0,0.6), 0 -1px 0 rgba(0,240,255,0.06)",
      }}
    >
      <nav className="flex justify-around items-center h-16 max-w-md mx-auto px-2 relative">
        {NAV_ITEMS.map((tab) => {
          const isActive =
            tab.path === "/"
              ? location === "/"
              : location === tab.path || location.startsWith(tab.path);
          const Icon = ICON_MAP[tab.icon];
          const neon = "#00f0ff";

          return (
            <Link
              key={tab.path}
              href={tab.path}
              className="flex-1 flex flex-col items-center justify-center py-2 relative group"
            >
              {isActive && (
                <motion.div
                  layoutId="nav-bar"
                  className="absolute top-0 inset-x-3 h-[2px] rounded-full"
                  style={{ background: neon, boxShadow: T.glow(neon) }}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              {isActive && (
                <motion.div
                  layoutId="nav-glow"
                  className="absolute inset-0 rounded-sm pointer-events-none"
                  style={{ background: `radial-gradient(ellipse at 50% 0%, ${neon}10 0%, transparent 70%)` }}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <Icon
                className="w-5 h-5 mb-1 transition-all duration-200 z-10"
                style={{
                  color:  isActive ? neon : "#3a3a3a",
                  filter: isActive ? `drop-shadow(${T.glow(neon)})` : undefined,
                  transform: isActive ? "scale(1.1)" : undefined,
                }}
              />
              <span
                className="font-tech text-[8px] uppercase tracking-widest z-10 transition-colors duration-200 leading-none text-center"
                style={{ color: isActive ? neon : "#2e2e2e" }}
              >
                {t(`nav.${tab.id}`)}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Safe area padding for phones with home indicator */}
      <div className="h-safe-bottom" style={{ height: "env(safe-area-inset-bottom, 0px)" }} />
    </div>
  );
}
