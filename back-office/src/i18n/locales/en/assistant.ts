const enAssistant = {
  page: {
    title: "Maison AI",
    subtitle: "Operational copilot · grounded in maison data · permission-aware",
  },
  badge: {
    privateModel: "Private model · sovereign EU",
  },
  conversation: {
    title: "Conversation",
    subtitle: "Today · with Amélie",
    placeholder: "Ask anything about the maison · permissions enforced",
    sendHint: "to send",
    groundedIn: "Grounded in {{n}} data sources",
    send: "Send",
    actions: {
      draftMessages: "Draft messages",
      openFullList: "Open full list",
    },
  },
  sampleMessages: {
    user1: "Show me VIP clients in APAC with no contact in the last 30 days.",
    ai1Intro:
      "I found {{count}} VIP clients in APAC with no recorded touchpoint in 30+ days. The most notable:",
    ai1Suggestion:
      "Would you like me to draft personalised re-engagement messages for S. Chen to review?",
    clients: {
      park: "{{n}} days · Founder's Circle · LTV {{ltv}}",
      nakamura: "{{n}} days · Atelier Privé · birthday in {{days}} days",
      wong: "{{n}} days · Maison · saved Empress Ruby",
    },
    user2: "Why is our D-VVS1 2ct+ inventory low?",
    ai2Intro:
      "Current stock is {{current}} stones (threshold: {{threshold}}). Over the past 90 days:",
    ai2Bullets: {
      consumed: "{{n}} stones consumed by bespoke commissions",
      lastProcurement: "Last procurement: {{date}} · {{count}} stones from Diamond House Geneva",
      projectedStockout: "Projected stockout: ~{{days}} days at current velocity",
    },
    ai2Recommendation:
      "I recommend issuing a procurement request for {{count}} stones to maintain 60-day coverage.",
  },
  insights: {
    title: "AI Insights · Today",
    items: {
      tokyoGrowth: "Tokyo +34% YoY",
      tokyoGrowthDetail:
        "Driven by 3 Founder's Circle commissions. Consider expanded atelier hours.",
      reorderThreshold: "Reorder threshold",
      reorderThresholdDetail: "D-VVS1 2ct+ projected stockout in 14 days.",
      crossSellSignal: "Cross-sell signal",
      crossSellSignalDetail: "Mr. Volkov viewed Cassiopée Cuff 3 times this week.",
    },
  },
  search: {
    title: "Semantic Search",
    placeholder: "e.g. rings with Burmese rubies under €100K",
    suggestions: {
      label: "Try:",
      anniversaries: "clients celebrating anniversaries next month",
      vaultIdle: "vault items not moved in 180 days",
      slaRisk: "atelier orders at risk of SLA breach",
    },
  },
  drafting: {
    title: "Drafting Assistant",
    templates: {
      conciergeFollowup: "Concierge follow-up",
      conciergeFollowupCtx: "Mr. Tanaka · stone update",
      pressNote: "Press note",
      pressNoteCtx: "Nocturne 2026 launch",
      internalMemo: "Internal memo",
      internalMemoCtx: "Vendôme audit findings",
    },
  },
} as const;

export default enAssistant;
