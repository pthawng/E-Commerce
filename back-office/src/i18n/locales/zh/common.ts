const zhCommon = {
  brand: {
    name: "Ray Paradis",
    subtitle: "品牌 · 运营中心",
  },
  nav: {
    overview: "概览",
    operations: "运营",
    clientsFinance: "客户与财务",
    studio: "创意工作室",
    governance: "系统治理",
    items: {
      executive: "高管总览",
      commerce: "商品与目录",
      vault: "保险库与库存",
      atelier: "工坊制作",
      clienteling: "VIP Care",
      ledger: "财务总账",
      cms: "品牌叙事CMS",
      security: "安全设置",
      staff: "员工管理",
      assistant: "AI助手",
    },
  },
  topbar: {
    search: "搜索客户、订单、SKU...",
    askAI: "咨询Maison AI",
    routes: {
      "/": {
        crumbs: ["Maison", "高管总览"],
        sub: "实时运营信号监控",
      },
      "/commerce": {
        crumbs: ["商务", "商品目录"],
        sub: "管理品牌商品目录",
      },
      "/vault": {
        crumbs: ["运营", "保险库与库存"],
        sub: "各地点安全资产管理",
      },
      "/atelier": {
        crumbs: ["工坊", "制作工序"],
        sub: "定制制作与质量控制",
      },
      "/vip-care": {
        crumbs: ["Clients", "VIP Care"],
        sub: "Client 360, concierge work, gestures, aftercare, events, and relationship risk",
      },
      "/ledger": {
        crumbs: ["财务", "财务总账"],
        sub: "账目核对与审计",
      },
      "/cms": {
        crumbs: ["工作室", "品牌叙事"],
        sub: "编辑内容与品牌营销活动",
      },
      "/back-office/settings/security": {
        crumbs: ["设置", "安全设置"],
        sub: "管理会话与安全配置",
      },
      "/back-office/staff": {
        crumbs: ["治理", "员工管理"],
        sub: "管理员工账户与权限",
      },
      "/assistant": {
        crumbs: ["人工智能", "AI助手"],
        sub: "运营副驾驶 — 严格权限管理",
      },
    },
  },
  user: {
    role: "运营总监",
  },
  status: {
    allNominal: "系统运行正常",
    live: "实时",
    online: "在线",
    rfidOnline: "RFID在线",
  },
  badge: {
    success: "成功",
    warning: "警告",
    error: "错误",
    info: "信息",
    pending: "待处理",
  },
  actions: {
    view: "查看",
    edit: "编辑",
    delete: "删除",
    approve: "批准",
    dismiss: "忽略",
    open: "打开",
    close: "关闭",
    save: "保存",
    cancel: "取消",
    confirm: "确认",
    export: "导出",
    import: "导入",
    upload: "上传",
    download: "下载",
    previous: "上一页",
    next: "下一页",
    addNew: "新增",
    openLibrary: "打开素材库 →",
    requestRestock: "申请补货 →",
    investigate: "调查",
  },
  pagination: {
    showing: "显示 {{shown}} / {{total}} 条",
    page: "第 {{current}} / {{total}} 页",
  },
  lang: {
    vi: "VI",
    en: "EN",
    zh: "ZH",
  },
} as const;

export default zhCommon;
