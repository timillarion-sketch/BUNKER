import { Link, useLocation } from "wouter";
import { Users, Globe, MessageSquare, Film, UserCircle } from "lucide-react";
import { motion } from "framer-motion";
import { NAV_ITEMS, T } from "@/lib/constants";
import { useTranslation } from "react-i18next";

const ICON_MAP: Record<string, any> = {
  Users, Globe, MessageSquare, Film, UserCircle,
};

export function BottomNav() {
  const [location] = useLocation();
  const { t }      = useTranslation();

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background:     "rgba(3,3,8,0.96)",
        borderTop:      "1px solid rgba(0,240,255,0.10)",
        backdropFilter: "blur(24px)",
        boxShadow:      "0 -8px 30px rgba(0,0,0,0.7)",
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
              className="flex-1 flex flex-col items-center justify-center py-2 relative"
            >
              {isActive && (
                <motion.div layoutId="nav-bar"
                  className="absolute top-0 inset-x-2 h-[2px] rounded-full"
                  style={{ background: neon, boxShadow: T.glow(neon) }}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              {isActive && (
                <motion.div layoutId="nav-glow"
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: `radial-gradient(ellipse at 50% 0%, ${neon}10 0%, transparent 70%)` }}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <Icon
                className="w-5 h-5 mb-1 z-10 transition-all duration-200"
                style={{
                  color:     isActive ? neon : "#333",
                  filter:    isActive ? `drop-shadow(${T.glow(neon)})` : undefined,
                  transform: isActive ? "scale(1.1)" : undefined,
                }}
              />
              <span
                className="font-tech text-[8px] uppercase tracking-widest z-10 leading-none"
                style={{ color: isActive ? neon : "#2a2a2a" }}
              >
                {t(`nav.${tab.id}`)}
              </span>
            </Link>
          );
        })}
      </nav>
      <div style={{ height: "env(safe-area-inset-bottom, 0px)" }} />
    </div>
  );
}
