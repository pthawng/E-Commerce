const enLedger = {
  page: {
    title: "Financial Ledger",
    subtitle: "Period: {{period}} · close in {{days}} days · audited by Mazars",
  },
  actions: {
    exportTrialBalance: "Export trial balance",
    beginPeriodClose: "Begin period close",
  },
  kpis: {
    revenueMTD: "Revenue · MTD",
    cogsMTD: "COGS · MTD",
    grossMargin: "Gross Margin",
    openAR: "Open AR",
    openARHint: "{{n}} invoices",
    reconciliation: "Reconciliation",
    reconciliationHint: "under review",
  },
  journal: {
    title: "Journal Entries",
    subtitle: "Most recent activity across the maison",
    filters: {
      allAccounts: "All accounts",
      period: "{{month}} {{year}}",
    },
    columns: {
      date: "Date",
      ref: "Ref",
      description: "Description",
      account: "Account",
      debit: "Debit",
      credit: "Credit",
      status: "Status",
    },
    status: {
      posted: "Posted",
      pendingReview: "Pending review",
      reconciled: "Reconciled",
    },
    totals: {
      showing: "Showing {{shown}} of {{total}} entries",
      totalDebits: "Total debits",
      totalCredits: "Total credits",
      variance: "Variance",
    },
    descriptions: {
      saleARMaison: "Sale · Revenue recognized",
      vatCollected: "VAT collected",
      refundPartial: "Refund · partial",
      atelierLabour: "Atelier labour accrual",
      inventoryWriteDown: "Inventory write-down · QC",
      wireReceived: "Wire received · deposit",
    },
  },
  bankRecon: {
    title: "Bank Reconciliation",
    subtitle: "BNP Paribas · Maison principal",
    status: {
      matched: "Matched",
      unmatched: "Match",
    },
  },
  refundWorkflow: {
    title: "Refund & Payout Workflow",
    alert: {
      title: "Refund {{amount}} · {{order}}",
      subtitle: "Requires CFO approval · awaiting since {{duration}}",
    },
    stages: {
      request: "Request",
      conciergeValidation: "Concierge validation",
      financeReview: "Finance review",
      cfoApproval: "CFO approval",
      paymentDispatch: "Payment dispatch",
      journalPosted: "Journal entry posted",
    },
    notifyCFO: "Notify CFO",
    requestors: {
      boutiqueParis: "Boutique · Paris",
      pending: "Pending",
    },
  },
} as const;

export default enLedger;
