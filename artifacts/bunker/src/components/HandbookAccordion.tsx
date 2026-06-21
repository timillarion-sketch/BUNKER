import { useState } from "react"
import { X, ChevronDown, ChevronRight, Users, Globe, MessageSquare, FileText, UserCircle, Brain, Sparkles, Star, Video, ShieldAlert, Cookie, Lock, Share2, Eye, Film, Lightbulb, Ghost, Server, Wifi, Skull } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"
import { T } from "@/lib/constants"

interface Subsection {
  id: string
  title: string
  icon: any
  text: string
  color: string
}

interface Section {
  id: string
  title: string
  icon: any
  preview: string
  color: string
  subsections: Subsection[]
}

const SECTIONS: Section[] = [
  {
    id: "personnel",
    title: "ПЕРСОНАЛ",
    icon: Users,
    preview: "Ваши личные ИИ-агенты, специализированные на разных задачах.",
    color: "#00f0ff",
    subsections: [
      {
        id: "psychologist",
        title: "ИИ-Психолог",
        icon: Brain,
        text: "Твой личный, абсолютно толерантный слушатель. Поможет разобраться во внутренних проблемах, страхах и переживаниях, о которых тяжело рассказать живым людям. Помогает взглянуть на ситуацию со стороны. (Внимание: это ИИ, его советы носят рекомендательный характер и он может ошибаться).",
        color: "#00f0ff",
      },
      {
        id: "altushka",
        title: "Альтушка",
        icon: Sparkles,
        text: "Стиль и эстетика. Идеальный собеседник со своим дерзким стилем. Знает, чего хочет, с ней можно обсудить абсолютно любые темы — от моды до философии.",
        color: "#ff00cc",
      },
      {
        id: "alfons",
        title: "Альфонс",
        icon: Star,
        text: "Харизма и уверенность. Крутой парень, видит мир абсолютно реалистично и без розовых очков. Ответит на жизненные вопросы на понятном сленге и даст жесткие, но рабочие советы.",
        color: "#bf00ff",
      },
      {
        id: "content-producer",
        title: "Контент Продюсер",
        icon: Video,
        text: "Вирусный контент. Твой личный режиссер. Подскажет, что снимать, как писать тексты и выставлять свет. Работает на любые темы и отвечает максимально честно и без цензуры (в рамках алгоритмов).",
        color: "#00e5cc",
      },
    ],
  },
  {
    id: "browser",
    title: "БРАУЗЕР",
    icon: Globe,
    preview: "Защищенный серфинг без цифровых следов.",
    color: "#00ff88",
    subsections: [
      {
        id: "neural-analysis",
        title: "Нейронный анализ",
        icon: ShieldAlert,
        text: "Встроенный ИИ мгновенно сканирует сайты на угрозы, скрытые скрипты и рекламные трекеры, выдавая уровень угрозы.",
        color: "#00ff88",
      },
      {
        id: "cookie-manager",
        title: "Менеджер Куки (Cookies)",
        icon: Cookie,
        text: "Куки — это заметки сайтов, чтобы помнить вас (например, товары в корзине). Если их много, рекламные сети могут следить за вами. Если удалить их все через наш менеджер, сайты забудут вас — придется заново вводить пароли, но вы полностью восстановите свою приватность.",
        color: "#ffd700",
      },
    ],
  },
  {
    id: "chats",
    title: "СВЯЗЬ",
    icon: MessageSquare,
    preview: "Анонимное общение без привязки к номеру телефона или SIM-карте.",
    color: "#ff00cc",
    subsections: [
      {
        id: "encryption",
        title: "Шифрование",
        icon: Lock,
        text: "Все переписки защищены сквозным шифрованием (E2E). Текст превращается в сложный математический код, который летит через интернет, и расшифровать его может только устройство собеседника. Никто другой переписку прочитать не может.",
        color: "#00f0ff",
      },
      {
        id: "mesh-network",
        title: "Mesh-сеть",
        icon: Share2,
        text: "Эмуляция связи без центрального сервера. Сообщения «прыгают» по цепочке от одного устройства к другому напрямую.",
        color: "#00ff88",
      },
      {
        id: "secret-chat",
        title: "Скрытые сообщения (Секрет)",
        icon: Eye,
        text: "Инкогнито-чаты не оставляют следов и живут только в оперативной памяти (RAM), исчезая после закрытия. КАК ОТКРЫТЬ: Зажмите и удерживайте палец на заголовке \"СООБЩЕНИЯ\" на главном экране связи, чтобы попасть в скрытый бункер.",
        color: "#ff3366",
      },
    ],
  },
  {
    id: "content",
    title: "КОНТЕНТ",
    icon: FileText,
    preview: "Управление файлами и база знаний.",
    color: "#ffd700",
    subsections: [
      {
        id: "publications",
        title: "Публикации",
        icon: Film,
        text: "Место для ваших секретных (только для вас) и открытых роликов. Полная свобода в рамках закона.",
        color: "#ffd700",
      },
      {
        id: "prompts-ideas",
        title: "Промпты и Идеи",
        icon: Lightbulb,
        text: "Библиотека готовых шаблонов для нейросетей. Если не знаете, как правильно попросить ИИ написать сценарий, просто возьмите готовый шаблон отсюда. База постоянно обновляется.",
        color: "#bf00ff",
      },
    ],
  },
  {
    id: "profile-section",
    title: "ПРОФИЛЬ",
    icon: UserCircle,
    preview: "Центр управления. Важно: Авторизация через VK или Яндекс нужна исключительно для генерации вашего уникального ID. Приложение не собирает ваши личные данные.",
    color: "#bf00ff",
    subsections: [
      {
        id: "ghost-mode",
        title: "Призрак Режим",
        icon: Ghost,
        text: "Делает вас невидимкой. Скрывает статус \"Онлайн\", \"Печатает...\" и галочки прочтения сообщений.",
        color: "#888888",
      },
      {
        id: "api-endpoint",
        title: "API-эндпоинт",
        icon: Server,
        text: "Техническая настройка. Нужна для подключения личных ключей, чтобы использовать своего персонажа на бесплатной версии приложения.",
        color: "#ff00cc",
      },
      {
        id: "gateway-key",
        title: "Ключ безопасного шлюза",
        icon: Wifi,
        text: "Приватная маршрутизация. Вставьте сюда свой ключ для направления трафика через зашифрованные маршруты.",
        color: "#00ff88",
      },
      {
        id: "protocol-zero",
        title: "Протокол Ноль",
        icon: Skull,
        text: "Необратимое стирание всех локальных чатов, сессий и ключей. Приложение возвращается к заводским настройкам.",
        color: "#ff3366",
      },
    ],
  },
]

export default function HandbookAccordion({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(12px)" }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="w-full max-w-lg rounded-sm overflow-hidden max-h-[85vh] flex flex-col"
            style={{
              background: "#0a0a0a",
              border: "1px solid rgba(0,240,255,0.25)",
              boxShadow: "0 0 50px rgba(0,240,255,0.06), inset 0 0 30px rgba(0,240,255,0.03)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 pt-5 pb-4 shrink-0"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
            >
              <div>
                <h2
                  className="font-display font-bold text-sm text-white uppercase tracking-wider"
                  style={{ textShadow: "0 0 12px rgba(0,240,255,0.4)" }}
                >
                  Справочник выживающего
                </h2>
                <p className="font-tech text-[9px] uppercase tracking-widest text-gray-600 mt-1">
                  База знаний Бункера
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-sm text-gray-500 hover:text-white transition-colors"
                style={{ border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Accordion body */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-5 pt-3">
              <AccordionPrimitive.Root type="multiple" className="space-y-2">
                {SECTIONS.map((section) => (
                  <SectionItem key={section.id} section={section} />
                ))}
              </AccordionPrimitive.Root>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function SectionItem({ section }: { section: Section }) {
  const iconColor = section.color
  const [open, setOpen] = useState(false)

  return (
    <div
      className="rounded-sm overflow-hidden transition-all duration-300"
      style={{
        background: open ? `${iconColor}06` : "rgba(0,0,0,0.3)",
        border: `1px solid ${open ? `${iconColor}30` : "rgba(255,255,255,0.06)"}`,
        boxShadow: open ? `inset 0 0 15px ${iconColor}08` : undefined,
      }}
    >
      <AccordionPrimitive.Item value={section.id}>
        <AccordionPrimitive.Header>
          <AccordionPrimitive.Trigger
            onClick={() => setOpen(!open)}
            className="flex w-full items-center gap-3 px-4 py-3.5 text-left group"
          >
            <div
              className="shrink-0 w-8 h-8 rounded-sm flex items-center justify-center"
              style={{
                background: `${iconColor}12`,
                border: `1px solid ${iconColor}25`,
              }}
            >
              <section.icon className="w-4 h-4" style={{ color: iconColor }} />
            </div>
            <div className="flex-1 min-w-0">
              <span
                className="font-display font-bold text-xs uppercase tracking-wider block"
                style={{ color: iconColor, textShadow: open ? T.glowText(iconColor) : undefined }}
              >
                {section.title}
              </span>
              <span className="font-sans text-[10px] text-gray-600 leading-snug mt-0.5 block line-clamp-2">
                {section.preview}
              </span>
            </div>
            <motion.div
              animate={{ rotate: open ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="shrink-0"
            >
              <ChevronDown className="w-3.5 h-3.5" style={{ color: open ? iconColor : "#555" }} />
            </motion.div>
          </AccordionPrimitive.Trigger>
        </AccordionPrimitive.Header>
        <AccordionPrimitive.Content
          className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
        >
          <div className="px-4 pb-4 pt-1 space-y-1.5">
            {section.subsections.map((sub) => (
              <SubsectionItem key={sub.id} sub={sub} />
            ))}
          </div>
        </AccordionPrimitive.Content>
      </AccordionPrimitive.Item>
    </div>
  )
}

function SubsectionItem({ sub }: { sub: Subsection }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <CollapsiblePrimitive.Root open={expanded} onOpenChange={setExpanded}>
      <CollapsiblePrimitive.Trigger asChild>
        <button
          className="flex w-full items-center gap-2.5 px-3 py-2.5 rounded-sm text-left transition-all duration-200 group"
          style={{
            background: expanded ? `${sub.color}08` : "transparent",
            border: `1px solid ${expanded ? `${sub.color}20` : "transparent"}`,
          }}
        >
          <motion.div
            animate={{ rotate: expanded ? 90 : 0 }}
            transition={{ duration: 0.15 }}
          >
            <ChevronRight className="w-3 h-3 shrink-0" style={{ color: expanded ? sub.color : "#444" }} />
          </motion.div>
          <sub.icon className="w-3.5 h-3.5 shrink-0" style={{ color: expanded ? sub.color : "#444" }} />
          <span
            className="font-tech text-xs uppercase tracking-wider"
            style={{ color: expanded ? sub.color : "#999" }}
          >
            {sub.title}
          </span>
        </button>
      </CollapsiblePrimitive.Trigger>
      <AnimatePresence initial={false}>
        {expanded && (
          <CollapsiblePrimitive.Content forceMount>
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div
                className="mx-3 mb-2.5 px-3 py-2.5 rounded-sm"
                style={{
                  background: `${sub.color}06`,
                  border: `1px solid ${sub.color}15`,
                  borderLeft: `2px solid ${sub.color}50`,
                }}
              >
                <p className="font-sans text-[11px] leading-relaxed text-gray-400">
                  {sub.text}
                </p>
              </div>
            </motion.div>
          </CollapsiblePrimitive.Content>
        )}
      </AnimatePresence>
    </CollapsiblePrimitive.Root>
  )
}
