const zhAtelier = {
  page: {
    title: "工坊制作",
    subtitle: "{{count}} 件产品正在制作流程中 · 上次同步于 {{time}} 前",
  },
  actions: {
    timelineView: "时间轴视图",
    newCommission: "新增定制委托",
    addCard: "+ 添加",
    openDossier: "查看完整档案",
  },
  kpis: {
    onSchedule: "按时完成率",
    atRisk: "存在风险",
    atRiskHint: "SLA剩余 < 48小时",
    avgLeadTime: "平均制作周期",
    avgLeadTimeHint: "定制件",
    qcPassRate: "质检通过率",
  },
  kanban: {
    title: "制作流程看板",
    subtitle: "跨阶段拖拽 · 点击查看完整档案",
    stages: {
      stone: "宝石遴选",
      cad: "CAD设计与蜡模",
      cast: "铸造成型",
      finish: "手工精修",
      qc: "质检与打标",
    },
    priority: "优先级",
    artisan: "工匠",
    due: "交期",
  },
  dossier: {
    title: "委托档案",
    subtitle: "定制订婚戒指",
    fields: {
      centreStone: "主石",
      setting: "镶嵌方式",
      sidestones: "配石",
      engraving: "刻字",
      box: "包装盒",
      delivery: "交货",
    },
    timeline: {
      title: "制作时间轴",
      stages: {
        stoneSelection: "宝石遴选 · {{count}} 颗候选石经客户确认",
        cadValidated: "CAD方案确认 · 客户已签字",
        waxApproved: "蜡模方案批准",
        castingInProgress: "铸造进行中",
        handFinishing: "手工精修",
        qcHallmark: "质检、打标及档案归档",
        conciergeHandover: "礼宾专员交接 · 银座",
      },
    },
    financials: {
      quote: "报价",
      deposit: "定金",
      depositReceived: "已收",
      balance: "尾款",
    },
    boxMaisonSignature: "品牌定制漆盒",
  },
  artisanWorkload: {
    title: "工匠工作量",
    active: "{{n}} 件进行中",
    roles: {
      masterJeweller: "首席珠宝工匠",
      stonesetter: "镶石专家",
      cadLead: "CAD设计主管",
      paveSpecialist: "密镶专家",
      qualityControl: "质量控制",
    },
  },
  qcPanel: {
    title: "质检节点 · 过去24小时",
    results: {
      pass: "通过",
      repolish: "重新抛光",
    },
  },
} as const;

export default zhAtelier;
