const enCommon = {
  brand: {
    name: "Ray Paradis",
    subtitle: "Maison · Operations",
  },
  nav: {
    overview: "Overview",
    operations: "Operations",
    clientsFinance: "Clients & Finance",
    studio: "Studio",
    governance: "Governance",
    items: {
      executive: "Executive",
      commerce: "Commerce & Catalog",
      vault: "Vault & Inventory",
      atelier: "Atelier",
      clienteling: "VIP Care",
      ledger: "Financial Ledger",
      cms: "Storytelling CMS",
      security: "Security Settings",
      staff: "Staff Management",
      assistant: "AI Assistant",
    },
  },
  topbar: {
    search: "Search clients, orders, SKUs…",
    askAI: "Ask Maison AI",
    routes: {
      "/": {
        crumbs: ["Maison", "Executive Overview"],
        sub: "Real-time signals across operations",
      },
      "/commerce": {
        crumbs: ["Commerce", "Product Catalog"],
        sub: "Curate the maison's offering",
      },
      "/vault": {
        crumbs: ["Operations", "Vault & Inventory"],
        sub: "Secured assets across locations",
      },
      "/atelier": {
        crumbs: ["Atelier", "Production Workflow"],
        sub: "Bespoke crafting & QC",
      },
      "/vip-care": {
        crumbs: ["Clients", "VIP Care"],
        sub: "Client 360, concierge work, gestures, aftercare, events, and relationship risk",
      },
      "/ledger": {
        crumbs: ["Finance", "General Ledger"],
        sub: "Reconciliation & audit",
      },
      "/cms": {
        crumbs: ["Studio", "Storytelling"],
        sub: "Editorial & campaigns",
      },
      "/back-office/settings/security": {
        crumbs: ["Settings", "Security Settings"],
        sub: "Manage sessions & security configurations",
      },
      "/back-office/staff": {
        crumbs: ["Governance", "Staff Management"],
        sub: "Manage staff accounts & permissions",
      },
      "/assistant": {
        crumbs: ["Intelligence", "AI Assistant"],
        sub: "Operational copilot",
      },
    },
  },
  user: {
    role: "Operations Director",
  },
  status: {
    allNominal: "All systems nominal",
    live: "Live",
    online: "Online",
    rfidOnline: "RFID online",
  },
  badge: {
    success: "Success",
    warning: "Warning",
    error: "Error",
    info: "Info",
    pending: "Pending",
  },
  actions: {
    view: "View",
    edit: "Edit",
    delete: "Delete",
    approve: "Approve",
    dismiss: "Dismiss",
    open: "Open",
    close: "Close",
    save: "Save",
    cancel: "Cancel",
    confirm: "Confirm",
    export: "Export",
    import: "Import",
    upload: "Upload",
    download: "Download",
    previous: "Previous",
    next: "Next",
    addNew: "Add new",
    openLibrary: "Open library →",
    requestRestock: "Request restock →",
    investigate: "Investigate",
  },
  pagination: {
    showing: "Showing {{shown}} of {{total}}",
    page: "Page {{current}} / {{total}}",
  },
  lang: {
    vi: "VI",
    en: "EN",
    zh: "ZH",
  },
} as const;

export default enCommon;
