const enCatalog = {
  page: {
    title: "Product Catalog",
    subtitle:
      "{{count}} active references across {{collections}} collections · last sync {{time}} ago",
  },
  actions: {
    import: "Import",
    newReference: "New Reference",
    editPricingModel: "Edit pricing model →",
    openLibrary: "Open library →",
  },
  kpis: {
    activeSKUs: "Active SKUs",
    activeSKUsHint: "this month",
    avgTicket: "Avg. Ticket",
    inAtelier: "In Atelier",
    inAtelierHint: "bespoke commissions",
    drafts: "Drafts",
    draftsHint: "{{n}} pending approval",
  },
  table: {
    search: "Search by name, SKU, certificate…",
    filterCount: "Filters · {{n}}",
    columns: {
      sku: "SKU",
      reference: "Reference",
      certificate: "Certificate",
      retail: "Retail",
      stock: "Stock",
      status: "Status",
      updated: "Updated",
    },
    collections: {
      all: "All collections",
      bridal: "Bridal",
      highJewelry: "High Jewelry",
      atelierPrive: "Atelier Privé",
      heritage: "Heritage",
    },
    status: {
      published: "Published",
      draft: "Draft",
      outOfStock: "Out of stock",
      reserved: "Reserved",
      atelierReview: "Atelier review",
    },
    showing: "Showing {{shown}} of {{total}} · {{selected}} selected actions available",
  },
  pricing: {
    title: "Pricing Formula",
    subtitle: "Auto-applied to new references",
    materialCost: "Material cost",
    materialCostVal: "Σ stones + metal × purity",
    atelierLabor: "Atelier labor",
    atelierLaborVal: "× 1.85 (hand-finished)",
    maisonMargin: "Maison margin",
    maisonMarginVal: "× 4.2",
    boutiqueMarkup: "Boutique markup",
    boutiqueMarkupVal: "+ regional index",
  },
  publishingWorkflow: {
    title: "Publishing Workflow",
    stages: {
      draft: "Draft",
      mediaReview: "Media & copy review",
      pricingApproval: "Pricing approval",
      boutiqueDistribution: "Boutique distribution",
      live: "Live",
    },
    roles: {
      curator: "Curator",
      editorial: "Editorial",
      finance: "Finance",
      operations: "Operations",
    },
    inReview: "In review",
  },
  media: {
    title: "Media Library",
    assetCount: "{{count}} assets",
  },
} as const;

export default enCatalog;
