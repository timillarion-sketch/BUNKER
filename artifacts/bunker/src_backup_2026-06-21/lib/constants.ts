import { storage } from "@/core";
import { getUserId as coreGetUserId } from "@/core/constants";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

export const CHARACTER_ID_MAP: Record<string, string> = {
  psychologist: "psycho",
  altushka: "altushka",
  alfons: "alfons",
  "content-producer": "producer",
};

export function getUserId(): string {
  return coreGetUserId(storage);
}

export const T = {
  glow:       (color: string) => `0 0 8px ${color}, 0 0 20px ${color}40`,
  glowStrong: (color: string) => `0 0 10px ${color}, 0 0 30px ${color}, 0 0 60px ${color}40`,
  glowText:   (color: string) => `0 0 10px ${color}80, 0 0 20px ${color}40`,
  borderGlow: (color: string) => `inset 0 0 12px ${color}20, 0 0 18px ${color}30`,
} as const;

export const COLORS = {
  blue:   { hex: "#00f0ff" },
  pink:   { hex: "#ff00cc" },
  green:  { hex: "#00ff88" },
  purple: { hex: "#bf00ff" },
  orange: { hex: "#ff6600" },
  gold:   { hex: "#ffd700" },
  red:    { hex: "#ff3366" },
  teal:   { hex: "#00e5cc" },
} as const;

export const AI_CHARACTERS = [
  {
    id: "psychologist", webhookName: "psychologist",
    name: "ИИ Психолог", avatar: "🧠",
    status: "online" as const, specialty: "Психология",
    description: "Эмпатичный ИИ-психолог. Поможет разобраться в себе.",
    color: COLORS.blue,
    greeting: "Привет. Я здесь, чтобы слушать. Расскажи, что тебя беспокоит.",
    locked: false, tier: "free" as const,
  },
  {
    id: "altushka", webhookName: "altushka",
    name: "Альтушка", avatar: "🖤",
    status: "online" as const, specialty: "Стиль и эстетика",
    description: "Дерзкая и честная. Не боится говорить правду.",
    color: COLORS.pink,
    greeting: "О, ещё один человек. Ну давай, удиви меня чем-нибудь интересным.",
    locked: false, tier: "free" as const,
  },
  {
    id: "alfons", webhookName: "alfons",
    name: "Альфонс", avatar: "😎",
    status: "online" as const, specialty: "Харизма и уверенность",
    description: "Мастер обаяния. Знает, как произвести впечатление.",
    color: COLORS.purple,
    greeting: "Привет, дружище. Готов прокачать твою игру? Начнём.",
    locked: false, tier: "free" as const,
  },
  {
    id: "content-producer", webhookName: "content-producer",
    name: "Контент Продюсер", avatar: "🎬",
    status: "online" as const, specialty: "Вирусный контент",
    description: "Генерирует идеи видео, сценарии Reels и стратегии роста.",
    color: COLORS.teal,
    greeting: "Привет! Давай создадим контент, который взорвёт ленту. Какова твоя ниша?",
    locked: false, tier: "free" as const,
  },
  {
    id: "prophet", webhookName: "prophet",
    name: "Пророк", avatar: "🔮",
    status: "busy" as const, specialty: "Цифровой оракул",
    description: "Предсказывает успех и видит блоки будущего.",
    color: COLORS.gold, greeting: "", locked: true, tier: "pro" as const,
  },
  {
    id: "stalker", webhookName: "stalker",
    name: "Станкер", avatar: "🗺️",
    status: "online" as const, specialty: "Техно-гид",
    description: "Обучает цифровой анонимности и поиску данных.",
    color: COLORS.green, greeting: "", locked: true, tier: "pro" as const,
  },
  {
    id: "hater", webhookName: "hater",
    name: "Хейтер", avatar: "🔥",
    status: "online" as const, specialty: "Критик системы",
    description: "Жёстко прожаривает за любые ошибки.",
    color: COLORS.red, greeting: "", locked: true, tier: "pro" as const,
  },
] as const;

export type CharacterId = (typeof AI_CHARACTERS)[number]["id"];

export const NAV_ITEMS = [
  { id: "personnel", label: "ПЕРСОНАЛ", path: "/",        icon: "Users"         },
  { id: "browser",   label: "БРАУЗЕР",  path: "/browser",  icon: "Globe"         },
  { id: "chats",     label: "СВЯЗЬ",    path: "/chats",    icon: "MessageSquare" },
  { id: "feed",      label: "КОНТЕНТ",  path: "/feed",     icon: "Film"          },
  { id: "profile",   label: "ПРОФИЛЬ",  path: "/profile",  icon: "UserCircle"    },
] as const;
