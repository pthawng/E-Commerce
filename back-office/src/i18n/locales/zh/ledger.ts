const zhLedger = {
  page: {
    title: "财务总账",
    subtitle: "会计期间：{{period}} · 结账还剩 {{days}} 天 · 由马泽会计师事务所审计",
  },
  actions: {
    exportTrialBalance: "导出试算平衡表",
    beginPeriodClose: "开始期末结账",
  },
  kpis: {
    revenueMTD: "本月净收入",
    cogsMTD: "本月销售成本（COGS）",
    grossMargin: "毛利率",
    openAR: "应收账款（AR）",
    openARHint: "{{n}} 张发票",
    reconciliation: "对账完成率",
    reconciliationHint: "审核中",
  },
  journal: {
    title: "日记账凭证",
    subtitle: "品牌全系统最新交易记录",
    filters: {
      allAccounts: "全部账户",
      period: "{{month}}月 {{year}}年",
    },
    columns: {
      date: "日期",
      ref: "凭证编号",
      description: "摘要",
      account: "会计科目",
      debit: "借方",
      credit: "贷方",
      status: "状态",
    },
    status: {
      posted: "已记账",
      pendingReview: "待审核",
      reconciled: "已对账",
    },
    totals: {
      showing: "显示 {{shown}} / {{total}} 条凭证",
      totalDebits: "借方合计",
      totalCredits: "贷方合计",
      variance: "差额",
    },
    descriptions: {
      saleARMaison: "销售 · 确认收入",
      vatCollected: "已收销项增值税",
      refundPartial: "退款 · 部分退款",
      atelierLabour: "工坊人工费用计提",
      inventoryWriteDown: "存货跌价准备 · 质检",
      wireReceived: "收到电汇 · 定金",
    },
  },
  bankRecon: {
    title: "银行对账",
    subtitle: "法国巴黎银行 · 品牌主账户",
    status: {
      matched: "已匹配",
      unmatched: "待匹配",
    },
  },
  refundWorkflow: {
    title: "退款与付款审批流程",
    alert: {
      title: "退款 {{amount}} · {{order}}",
      subtitle: "需要CFO审批 · 等待已 {{duration}}",
    },
    stages: {
      request: "申请退款",
      conciergeValidation: "礼宾专员确认",
      financeReview: "财务审核",
      cfoApproval: "CFO审批",
      paymentDispatch: "发起付款",
      journalPosted: "记账入账",
    },
    notifyCFO: "通知CFO",
    requestors: {
      boutiqueParis: "精品店 · 巴黎",
      pending: "待确认",
    },
  },
} as const;

export default zhLedger;
