const en = {
  nav: {
    lobby:   "LOBBY",
    browser: "NET",
    chats:   "COMMS",
    feed:    "FEED",
    profile: "ID",
  },

  login: {
    tagline1:   "Maximum Privacy.",
    tagline2:   "Zero Compromise.",
    secureNode: "Secure Node Authentication",
    initiateVk: "Initiate VK Link",
    yandexBio:  "Yandex Biometrics",
  },

  characters: {
    nodeStatus: "NODE: ALPHA",
    onlineCount: "{{count}} AGENTS ONLINE",
    header: "AI LOBBY",
    status: {
      online:  "Online",
      busy:    "Busy",
      offline: "Offline",
    },
  },

  chat: {
    encrypted:      "E2E Encrypted",
    sessionStart:   "Session Initiated · Keys Exchanged",
    burn:           "BURN",
    burnConfirm:    "CONFIRM",
    placeholder:    "[ ENTER DIRECTIVE ]",
    send:           "SEND",
    greeting:       "Connection established. State your directive.",
  },

  browser: {
    vpnOn:     "VPN ON",
    vpnOff:    "VPN OFF",
    torOn:     "TOR ON",
    torOff:    "TOR OFF",
    trackers:  "{{count}} TRACKERS",
    analyzing: "Extracting Intelligence...",
    neuralAnalysis: "Neural Analysis",
    privacyThreat:  "Privacy Threat Level",
    coreSynthesis:  "Core Synthesis",
    vectors:        "Extracted Vectors",
    error:          "[ERROR] Neural link failed. Target may be blocking extraction.",
    risk: {
      low:    "LOW",
      medium: "MEDIUM",
      high:   "HIGH",
    },
  },

  chats: {
    header:       "Chats",
    subheader:    "Secure Comms",
    e2eActive:    "E2E Active",
    protocolTitle: "Total Anonymity Protocol",
    protocolDesc:  "Messages are zero-knowledge encrypted and routed through decentralized nodes. Metadata stripped.",
  },

  feed: {
    header:      "Feed",
    subheader:   "Incoming Transmission",
    comingSoon:  "Private Reels — Coming Soon",
    desc:        "An encrypted, zero-trace video feed is being prepared. All content will be decentralized and surveillance-proof.",
    loading:     "LOADING MODULE",
  },

  profile: {
    header:    "Profile",
    operative: "Operative",
    logout:    "Logout",

    verify:      "Identity Verification",
    vkLinked:    "VK ID — LINKED",
    yandexLinked: "YANDEX ID — LINKED",

    privacy:          "Privacy Controls",
    vpn:              "VPN Tunnel",
    vpnDesc:          "Route all traffic through encrypted tunnel",
    tor:              "TOR Routing",
    torDesc:          "Anonymize through Tor onion network",
    notifications:    "Notifications",
    notificationsDesc:"System-level push alerts (disabled for stealth mode)",
    screenshots:      "Screenshots",
    screenshotsDesc:  "Allow external screenshot capture of the app",

    apiEndpoint: "API Endpoint",
    save:        "SAVE",

    protocolZero: "Protocol Zero",
    protocolDesc: "Wipes all local state, keys, cache, and session data. Double-tap to confirm. Cannot be undone.",
    selfDestruct: "SELF-DESTRUCT",
    tapAgain:     "TAP AGAIN TO CONFIRM",
    detonating:   "DETONATING IN {{count}}...",

    language:     "Language",
    langEn:       "EN",
    langRu:       "RU",
  },
} as const;

export default en;
