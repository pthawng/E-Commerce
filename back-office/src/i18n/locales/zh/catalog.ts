const zhCatalog = {
  page: {
    title: "商品目录",
    subtitle: "{{count}} 个在售款式，覆盖 {{collections}} 个系列 · 上次同步于 {{time}} 前",
  },
  actions: {
    import: "导入数据",
    newReference: "新增款式",
    editPricingModel: "编辑定价模型 →",
    openLibrary: "打开素材库 →",
  },
  kpis: {
    activeSKUs: "在售SKU数量",
    activeSKUsHint: "本月",
    avgTicket: "平均客单价",
    inAtelier: "工坊制作中",
    inAtelierHint: "件定制委托",
    drafts: "草稿",
    draftsHint: "{{n}} 件待审批",
  },
  table: {
    search: "按名称、SKU、证书搜索...",
    filterCount: "筛选条件 · {{n}}",
    columns: {
      sku: "SKU编码",
      reference: "款式名称",
      certificate: "宝石证书",
      retail: "零售价",
      stock: "库存",
      status: "状态",
      updated: "更新时间",
    },
    collections: {
      all: "全部系列",
      bridal: "婚嫁系列",
      highJewelry: "高级珠宝",
      atelierPrive: "Atelier Privé",
      heritage: "传承系列",
    },
    status: {
      published: "已上架",
      draft: "草稿",
      outOfStock: "缺货",
      reserved: "已预订",
      atelierReview: "工坊审核中",
    },
    showing: "显示 {{shown}} / {{total}} 条 · {{selected}} 项操作可用",
  },
  pricing: {
    title: "定价公式",
    subtitle: "自动应用于新款式",
    materialCost: "原料成本",
    materialCostVal: "Σ 宝石 + 金属 × 纯度",
    atelierLabor: "工坊人工费",
    atelierLaborVal: "× 1.85（手工精制）",
    maisonMargin: "品牌利润率",
    maisonMarginVal: "× 4.2",
    boutiqueMarkup: "精品店加成",
    boutiqueMarkupVal: "+ 区域指数",
  },
  publishingWorkflow: {
    title: "上架发布流程",
    stages: {
      draft: "草稿",
      mediaReview: "图文审核",
      pricingApproval: "定价审批",
      boutiqueDistribution: "精品店分发",
      live: "已上线",
    },
    roles: {
      curator: "策展专员",
      editorial: "编辑部",
      finance: "财务部",
      operations: "运营部",
    },
    inReview: "审核中",
  },
  media: {
    title: "素材库",
    assetCount: "{{count}} 个素材",
  },
} as const;

export default zhCatalog;
