const enVault = {
  page: {
    title: "Vault & Inventory",
    subtitle:
      "{{locations}} secured locations · {{items}} serialized assets · {{value}} total insured value",
  },
  badges: {
    rfidOnline: "RFID online",
    auditLeft: "Audit · {{time}} left",
  },
  kpis: {
    totalInsuredValue: "Total Insured Value",
    totalInsuredValueHint: "Lloyd's policy 884-A",
    serializedItems: "Serialized Items",
    inTransit: "In Transit",
    inTransitHint: "{{n}} escorted couriers",
    discrepancies: "Discrepancies",
    discrepanciesHint: "Paris V1, under review",
  },
  locations: {
    title: "Vault Locations",
    subtitle: "Real-time RFID and seal status",
    columns: {
      vault: "Vault",
      items: "Items",
      value: "Value",
      health: "Health",
      status: "Status",
    },
    status: {
      secured: "Secured",
      auditCycle: "Audit cycle",
      sealed: "Sealed",
    },
  },
  inventoryHealth: {
    title: "Inventory Health",
    subtitle: "By category",
    categories: {
      diamondsDFVVS: "Diamonds · D-F · VVS+",
      diamonds2ct: "Diamonds · 2ct+",
      colourStonesBurmese: "Coloured Stones · Burmese",
      pearlsSouthSea: "Pearls · South Sea",
      platinumGold: "Pt950 · 9999 Gold",
    },
  },
  movements: {
    title: "Stock Movement · Today",
    subtitle: "All transfers, audits, and seal events",
    columns: {
      time: "Time",
      ref: "Ref",
      asset: "Asset",
      from: "From",
      to: "To",
      operation: "Operation",
      status: "Status",
    },
    operations: {
      transferEscorted: "Transfer · escorted",
      loan24h: "Loan · 24h",
      saleFinal: "Sale · final",
      inboundGIA: "Inbound · GIA cert",
      inspection: "Inspection",
    },
    status: {
      inTransit: "In transit",
      released: "Released",
      delivered: "Delivered",
      sealed: "Sealed",
      pending: "Pending",
    },
  },
} as const;

export default enVault;
