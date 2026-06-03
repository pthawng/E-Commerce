const enAtelier = {
  page: {
    title: "Atelier Production",
    subtitle:
      "{{count}} active references across {{collections}} collections · last sync {{time}} ago",
  },
  actions: {
    timelineView: "Timeline view",
    newCommission: "New commission",
    addCard: "+ Add",
    openDossier: "Open full dossier",
  },
  kpis: {
    onSchedule: "On Schedule",
    atRisk: "At Risk",
    atRiskHint: "SLA < 48h",
    avgLeadTime: "Avg. Lead Time",
    avgLeadTimeHint: "bespoke",
    qcPassRate: "QC Pass Rate",
  },
  kanban: {
    title: "Production Kanban",
    subtitle: "Drag between stages · click for full dossier",
    stages: {
      stone: "Stone Selection",
      cad: "CAD & Wax",
      cast: "Casting",
      finish: "Hand Finishing",
      qc: "QC & Hallmark",
    },
    priority: "Priority",
    artisan: "Artisan",
    due: "Due",
  },
  dossier: {
    title: "Commission Dossier",
    subtitle: "Bespoke engagement ring",
    fields: {
      centreStone: "Centre stone",
      setting: "Setting",
      sidestones: "Side stones",
      engraving: "Engraving",
      box: "Box",
      delivery: "Delivery",
    },
    timeline: {
      title: "Crafting Timeline",
      stages: {
        stoneSelection: "Stone selection · {{count}} candidates approved by client",
        cadValidated: "CAD validated · client signature received",
        waxApproved: "Wax model approved",
        castingInProgress: "Casting in progress",
        handFinishing: "Hand finishing · M. Laurent",
        qcHallmark: "QC, hallmark & dossier",
        conciergeHandover: "Concierge handover · Ginza",
      },
    },
    financials: {
      quote: "Quote",
      deposit: "Deposit",
      depositReceived: "received",
      balance: "Balance",
    },
    boxMaisonSignature: "Maison signature, lacquer",
  },
  artisanWorkload: {
    title: "Artisan Workload",
    active: "{{n}} active",
    roles: {
      masterJeweller: "Maître bijoutier",
      stonesetter: "Sertisseur",
      cadLead: "CAD lead",
      paveSpecialist: "Pavé specialist",
      qualityControl: "Quality control",
    },
  },
  qcPanel: {
    title: "QC Checkpoints · Last 24h",
    results: {
      pass: "Pass",
      repolish: "Re-polish",
    },
  },
} as const;

export default enAtelier;
