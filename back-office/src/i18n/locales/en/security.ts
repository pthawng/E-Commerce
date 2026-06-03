const enSecurity = {
  page: {
    title: "Security & Audit",
    subtitle: "Enterprise governance · SOC 2 Type II · last audit: {{date}}",
  },
  badges: {
    ssoActive: "SSO active",
    mfaEnforced: "MFA · enforced",
  },
  kpis: {
    activeSessions: "Active sessions",
    activeSessionsHint: "across {{n}} cities",
    privilegedUsers: "Privileged users",
    privilegedUsersHint: "of {{total}} total",
    failedLogins: "Failed logins · 24h",
    failedLoginsHint: "auto-blocked",
    riskScore: "Risk Score",
    riskScoreHint: "continuous monitoring",
  },
  suspiciousAlert: {
    title: "Suspicious activity detected · acct: {{account}}",
    detail: "{{attempts}} failed logins from {{ip}} (Unknown). Account auto-locked. CISO notified.",
    action: "Investigate",
  },
  auditLog: {
    title: "Audit Log · Live",
    subtitle: "Every privileged action is recorded and immutable",
    columns: {
      timestamp: "Timestamp",
      actor: "Actor",
      action: "Action",
      ip: "IP",
      location: "Location",
      risk: "Risk",
    },
    risk: {
      high: "High",
      medium: "Medium",
      normal: "Normal",
    },
    actions: {
      viewedVIPProfile: "Viewed VIP profile · Mr. Tanaka",
      approvedRefund: "Approved refund",
      sealedVaultTransfer: "Sealed vault transfer · {{count}} serials",
      failedLoginMultiple: "Failed login × {{count}} · acct: {{account}}",
      dailyReconCompleted: "Daily reconciliation completed",
      publishedEditorial: "Published Bridal Editorial 2026",
    },
  },
  roleMatrix: {
    title: "Role Matrix",
    subtitle: "{{users}} users across {{roles}} roles · {{modules}} modules",
    columns: {
      role: "Role",
    },
    roles: {
      executive: "Executive",
      operationsDirector: "Operations Director",
      concierge: "Concierge",
      vaultKeeper: "Vault Keeper",
      artisan: "Artisan",
      finance: "Finance",
      editor: "Editor",
    },
    modules: {
      dashboard: "Dashboard",
      commerce: "Commerce",
      vault: "Vault",
      atelier: "Atelier",
      crm: "CRM",
      ledger: "Ledger",
      cms: "CMS",
      security: "Security",
    },
  },
} as const;

export default enSecurity;
