const enDashboard = {
  greeting: {
    dayTime: "Thursday · 28 May 2026 · Paris",
    welcome: "Bonsoir, Amélie.",
    summary:
      "The maison is operating within nominal parameters. Three matters require your attention before the close of day.",
  },
  badges: {
    q2Pace: "Q2 · On pace 112%",
  },
  kpis: {
    netRevenueMTD: "Net Revenue · MTD",
    ordersInAtelier: "Orders in Atelier",
    ordersInAtelierHint: "6 bespoke",
    vaultCoverage: "Vault Coverage",
    vaultCoverageHint: "3 SKUs low",
    vipActive: "VIP Active",
    vipActiveHint: "22 events",
    vsMay25: "vs. May '25",
  },
  revenuePanel: {
    title: "Revenue Velocity",
    subtitle: "Rolling 12 months · all boutiques",
    today: "Today",
    forecastEoM: "Forecast EoM",
    vsAvg: "vs avg",
    confidence: "confidence",
  },
  atelierPipeline: {
    title: "Atelier Pipeline",
    subtitle: "Active commissions by stage",
    stages: {
      stoneSelection: "Stone Selection",
      cadWax: "CAD & Wax",
      casting: "Casting",
      handFinishing: "Hand Finishing",
      qcHallmark: "QC & Hallmark",
    },
  },
  attentionPanel: {
    title: "Requires Attention",
    subtitle: "3 operational incidents",
    openQueue: "Open queue",
    columns: {
      ref: "Ref",
      matter: "Matter",
      owner: "Owner",
      sla: "SLA",
    },
    incidents: {
      vaultDiscrepancy: "Vault discrepancy · Place Vendôme",
      vaultDiscrepancyCtx: "1 serial unaccounted after audit cycle",
      vipEscalation: "VIP escalation · Mr. Tanaka",
      vipEscalationCtx: "Custom commission delivery rescheduled twice",
      gemstoneMismatch: "Gemstone certificate mismatch",
      gemstoneMismatchCtx: "GIA report differs on inclusion grade — SKU RP-2104-S",
      today: "Today",
      tomorrow: "Tomorrow",
    },
  },
  pulse: {
    title: "Maison Pulse",
    revenuePulse: "Revenue · 12mo",
    ordersPulse: "Orders · 12mo",
    newCommissions: "3 new commissions opened in Tokyo flagship",
    auditComplete: "Audit cycle completes in",
    shippingReview: "Shipping to Riyadh requires customs review",
    diamondLow: "Diamond inventory below threshold (D-VVS1, 2ct+)",
  },
  topBoutiques: {
    title: "Top Boutiques · MTD",
    boutique: "Boutique",
    revenue: "Revenue",
    yoy: "YoY",
  },
  vipLifecycle: {
    title: "VIP Lifecycle",
    tiers: {
      foundersCircle: "Founder's Circle",
      foundersCircleDesc: "Lifetime ≥ €2M",
      atelierPrive: "Atelier Privé",
      atelierPriveDesc: "Bespoke clients",
      maison: "Maison",
      maisonDesc: "Active VIP",
      prospects: "Prospects",
      prospectsDesc: "Concierge nurture",
    },
  },
  auditTrail: {
    title: "Audit Trail · Today",
    actions: {
      approvedRefund: "Approved refund €18,400 · ORD-9914",
      vaultMovement: "Vault movement: 4 serials → Geneva",
      dailyRecon: "Daily reconciliation completed · 0 deltas",
      publishedEditorial: "Published Bridal Editorial 2026",
      onboardedVIP: "Onboarded VIP · Mme. Ferreira",
    },
  },
} as const;

export default enDashboard;
