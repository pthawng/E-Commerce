const enClienteling = {
  page: {
    title: "VIP Clienteling",
    subtitle:
      "{{count}} active relationships · {{concierges}} concierges · {{ateliers}} ateliers privés this month",
  },
  actions: {
    openRelationship: "+ Open relationship",
    newMessage: "+ New",
  },
  kpis: {
    foundersCircle: "Founder's Circle",
    foundersCircleHint: "Lifetime ≥ €2M",
    avgLTV: "Avg. LTV",
    conciergeLoad: "Concierge load",
    conciergeLoadHint: "clients / concierge",
    nps: "NPS",
    npsHint: "rolling 90d",
  },
  table: {
    title: "Active Relationships",
    columns: {
      client: "Client",
      tier: "Tier",
      ltv: "LTV",
      concierge: "Concierge",
      lastTouch: "Last touch",
    },
    tiers: {
      foundersCircle: "Founder's Circle",
      atelierPrive: "Atelier Privé",
      maison: "Maison",
      prospects: "Prospects",
    },
  },
  concierge: {
    panelTitle: "Concierge Pulse",
    clients: "{{n}} clients",
    avgResponse: "avg response",
  },
  profile: {
    subtitle: "Founder's Circle · Concierge: S. Chen",
    preferences: "Preferences",
    sizes: "Sizes",
    ring: "Ring",
    bracelet: "Bracelet",
    necklace: "Necklace preferred",
    lifeEvents: "Life Events",
    engagement: "Engagement",
    birthday: "Birthday",
    giftReady: "Gift suggestion ready",
    parisVisit: "Paris visit",
    atelierVisitScheduled: "Vendôme atelier visit scheduled",
    commissionInProgress: "Commission BSP-441 in progress",
    lookbook: "Curated Lookbook",
    sentAwaitingFeedback: "Sent · awaiting feedback",
  },
  communication: {
    title: "Communication",
    channels: {
      whatsapp: "WhatsApp",
      email: "Email",
      atelierVisit: "Atelier visit",
      gift: "Gift",
    },
  },
  gestures: {
    title: "Suggested Gestures",
    subtitle: "AI-curated · concierge-approved",
    types: {
      anniversaryGift: "Anniversary gift",
      atelierVisit: "Atelier visit",
      newCollectionPreview: "New collection preview",
    },
    actions: {
      approve: "Approve",
      dismiss: "Dismiss",
    },
    gestureSuggestions: {
      ferreira: "Send Maison fragrance + handwritten note",
      volkov: "Invite for private cufflink preview",
      foundersCircle: "Send Nocturne lookbook ahead of public launch",
    },
  },
} as const;

export default enClienteling;
