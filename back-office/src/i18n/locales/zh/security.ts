const zhSecurity = {
  page: {
    title: "安全与审计",
    subtitle: "企业级治理 · SOC 2 Type II认证 · 最近审计时间：{{date}}",
  },
  badges: {
    ssoActive: "SSO已启用",
    mfaEnforced: "MFA · 强制开启",
  },
  kpis: {
    activeSessions: "活跃会话",
    activeSessionsHint: "覆盖 {{n}} 个城市",
    privilegedUsers: "特权账户",
    privilegedUsersHint: "共 {{total}} 个账户",
    failedLogins: "登录失败次数 · 24小时",
    failedLoginsHint: "已自动封锁",
    riskScore: "风险评分",
    riskScoreHint: "持续监控中",
  },
  suspiciousAlert: {
    title: "发现异常活动 · 账户：{{account}}",
    detail: "来自 {{ip}}（未知地点）的 {{attempts}} 次登录失败。账户已自动锁定，CISO已收到通知。",
    action: "立即调查",
  },
  auditLog: {
    title: "Audit Log · 实时",
    subtitle: "所有特权操作均已记录且不可篡改",
    columns: {
      timestamp: "时间戳",
      actor: "操作人",
      action: "操作内容",
      ip: "IP地址",
      location: "地点",
      risk: "风险等级",
    },
    risk: {
      high: "高",
      medium: "中",
      normal: "正常",
    },
    actions: {
      viewedVIPProfile: "查看VIP客户资料 · 田中先生",
      approvedRefund: "批准退款",
      sealedVaultTransfer: "封存保险库转移 · {{count}} 枚序列号",
      failedLoginMultiple: "登录失败 {{count}} 次 · 账户：{{account}}",
      dailyReconCompleted: "每日对账完成",
      publishedEditorial: "已发布2026婚嫁系列编辑内容",
    },
  },
  roleMatrix: {
    title: "权限矩阵",
    subtitle: "{{users}} 个账户 · {{roles}} 个角色 · {{modules}} 个功能模块",
    columns: {
      role: "角色",
    },
    roles: {
      executive: "高管",
      operationsDirector: "运营总监",
      concierge: "礼宾专员",
      vaultKeeper: "保险库管理员",
      artisan: "工匠",
      finance: "财务人员",
      editor: "编辑人员",
    },
    modules: {
      dashboard: "仪表盘",
      commerce: "商务",
      vault: "保险库",
      atelier: "工坊",
      crm: "CRM",
      ledger: "总账",
      cms: "CMS",
      security: "安全",
    },
  },
} as const;

export default zhSecurity;
