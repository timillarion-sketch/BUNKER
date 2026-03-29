// ─────────────────────────────────────────────────────────
// BUNKER — Central Config
// Vibe-coding friendly: change anything here, it propagates everywhere.
// ─────────────────────────────────────────────────────────

/** Central API endpoint. Change this to your n8n/VPS URL. */
export const API_BASE_URL = "/api";

// ─── Glow helpers ─────────────────────────────────────────
// "Change glow intensity" → edit these values.
export const T = {
  glow: (color: string) => `0 0 8px ${color}, 0 0 20px ${color}40`,
  glowStrong: (color: string) => `0 0 10px ${color}, 0 0 30px ${color}, 0 0 60px ${color}40`,
  glowText: (color: string) => `0 0 10px ${color}80, 0 0 20px ${color}40`,
  borderGlow: (color: string) => `inset 0 0 12px ${color}20, 0 0 18px ${color}30`,
  pulse: "animate-pulse",
} as const;

// ─── Neon palette ─────────────────────────────────────────
export const COLORS = {
  blue:   { hex: "#00f0ff", tw: "blue",   tailwindText: "text-blue-400",   tailwindBorder: "border-blue-500" },
  pink:   { hex: "#ff00cc", tw: "pink",   tailwindText: "text-pink-400",   tailwindBorder: "border-pink-500" },
  green:  { hex: "#00ff88", tw: "green",  tailwindText: "text-emerald-400", tailwindBorder: "border-emerald-500" },
  purple: { hex: "#bf00ff", tw: "purple", tailwindText: "text-purple-400", tailwindBorder: "border-purple-500" },
  orange: { hex: "#ff6600", tw: "orange", tailwindText: "text-orange-400", tailwindBorder: "border-orange-500" },
  gold:   { hex: "#ffd700", tw: "yellow", tailwindText: "text-yellow-300", tailwindBorder: "border-yellow-400" },
} as const;

// ─── AI Characters ────────────────────────────────────────
// "Add a new AI character" → append an object here.
export const AI_CHARACTERS = [
  {
    id: "echo",
    name: "Echo",
    avatar: "🤖",
    status: "online" as const,
    specialty: "Deep Analysis",
    description: "Neural language specialist. Master of context and conversation.",
    color: COLORS.blue,
    greeting: "Signal locked. I am Echo. State your directive.",
  },
  {
    id: "cipher",
    name: "Cipher",
    avatar: "🔐",
    status: "online" as const,
    specialty: "Encryption",
    description: "Cryptography and security expert. Keeper of secrets.",
    color: COLORS.pink,
    greeting: "Cipher online. All comms are encrypted. What must be concealed?",
  },
  {
    id: "nexus",
    name: "Nexus",
    avatar: "🌐",
    status: "online" as const,
    specialty: "Web Research",
    description: "Web intelligence agent. Navigates the digital realm.",
    color: COLORS.green,
    greeting: "Nexus connected. Web nodes active. Where shall we search?",
  },
  {
    id: "phantom",
    name: "Phantom",
    avatar: "👻",
    status: "online" as const,
    specialty: "Privacy Ops",
    description: "Ghost protocol operative. Zero trace, maximum privacy.",
    color: COLORS.purple,
    greeting: "Ghost protocol active. I leave no trace. What must vanish?",
  },
  {
    id: "vex",
    name: "Vex",
    avatar: "⚡",
    status: "online" as const,
    specialty: "Automation",
    description: "Rapid-fire code executor. Automation at light speed.",
    color: COLORS.orange,
    greeting: "Vex initialized. Running at 100%. Give me a task.",
  },
  {
    id: "oracle",
    name: "Oracle",
    avatar: "🔮",
    status: "busy" as const,
    specialty: "Prediction",
    description: "Predictive intelligence. Sees patterns others miss.",
    color: COLORS.gold,
    greeting: "The Oracle speaks when ready. Your question shapes the answer.",
  },
] as const;

export type CharacterId = (typeof AI_CHARACTERS)[number]["id"];

// ─── Navigation ───────────────────────────────────────────
// "Add a new tab" → append here and add a case in App.tsx renderTab.
export const NAV_ITEMS = [
  { id: "lobby",   label: "LOBBY",  path: "/",        icon: "Users" },
  { id: "browser", label: "NET",    path: "/browser",  icon: "Globe" },
  { id: "chats",   label: "COMMS",  path: "/chats",    icon: "MessageSquare" },
  { id: "feed",    label: "FEED",   path: "/feed",     icon: "Radio" },
  { id: "profile", label: "ID",     path: "/profile",  icon: "UserCircle" },
] as const;
