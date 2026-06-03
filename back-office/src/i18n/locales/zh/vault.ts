const zhVault = {
  page: {
    title: "保险库与库存",
    subtitle: "{{locations}} 个安全地点 · {{items}} 件RFID序列化资产 · 总保险价值 {{value}}",
  },
  badges: {
    rfidOnline: "RFID在线",
    auditLeft: "盘点 · 还剩 {{time}}",
  },
  kpis: {
    totalInsuredValue: "总保险价值",
    totalInsuredValueHint: "Lloyd's保单 884-A",
    serializedItems: "RFID序列化资产",
    inTransit: "运输中",
    inTransitHint: "{{n}} 次有护送的转运",
    discrepancies: "盘点差异",
    discrepanciesHint: "巴黎V1，审核中",
  },
  locations: {
    title: "保险库地点",
    subtitle: "实时RFID与封存状态",
    columns: {
      vault: "保险库",
      items: "数量",
      value: "价值",
      health: "健康度",
      status: "状态",
    },
    status: {
      secured: "严密保管",
      auditCycle: "盘点中",
      sealed: "已封存",
    },
  },
  inventoryHealth: {
    title: "库存健康度",
    subtitle: "按品类分类",
    categories: {
      diamondsDFVVS: "钻石 · D-F · VVS级以上",
      diamonds2ct: "钻石 · 2克拉以上",
      colourStonesBurmese: "彩色宝石 · 缅甸产",
      pearlsSouthSea: "珍珠 · 南洋珍珠",
      platinumGold: "Pt950铂金 · 9999纯金",
    },
  },
  movements: {
    title: "今日库存变动",
    subtitle: "所有转运、盘点及封存事件",
    columns: {
      time: "时间",
      ref: "参考编号",
      asset: "资产",
      from: "来源",
      to: "目的地",
      operation: "操作类型",
      status: "状态",
    },
    operations: {
      transferEscorted: "有护送转运",
      loan24h: "24小时借用",
      saleFinal: "销售完成",
      inboundGIA: "入库 · GIA证书",
      inspection: "质量检验",
    },
    status: {
      inTransit: "运输中",
      released: "已出库",
      delivered: "已交付",
      sealed: "已封存",
      pending: "待审核",
    },
  },
} as const;

export default zhVault;
