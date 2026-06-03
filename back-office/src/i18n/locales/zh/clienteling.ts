const zhClienteling = {
  page: {
    title: "VIP客户服务",
    subtitle:
      "{{count}} 段活跃客户关系 · {{concierges}} 位礼宾专员 · 本月 {{ateliers}} 场私人工坊接待",
  },
  actions: {
    openRelationship: "+ 建立关系",
    newMessage: "+ 新消息",
  },
  kpis: {
    foundersCircle: "创始人圈",
    foundersCircleHint: "终身消费 ≥ €200万",
    avgLTV: "平均终身价值（LTV）",
    conciergeLoad: "礼宾专员负载",
    conciergeLoadHint: "客户/礼宾专员",
    nps: "NPS净推荐值",
    npsHint: "滚动90天",
  },
  table: {
    title: "活跃客户关系",
    columns: {
      client: "客户",
      tier: "会员等级",
      ltv: "终身消费（LTV）",
      concierge: "负责礼宾专员",
      lastTouch: "最近联系",
    },
    tiers: {
      foundersCircle: "创始人圈",
      atelierPrive: "Atelier Privé",
      maison: "Maison",
      prospects: "潜在客户",
    },
  },
  concierge: {
    panelTitle: "礼宾专员动态",
    clients: "{{n}} 位客户",
    avgResponse: "平均响应时间",
  },
  profile: {
    subtitle: "创始人圈 · 礼宾专员",
    preferences: "偏好",
    sizes: "尺寸",
    ring: "戒指",
    bracelet: "手镯",
    necklace: "项链首选",
    lifeEvents: "人生大事",
    engagement: "订婚",
    birthday: "生日",
    giftReady: "礼品建议已准备",
    parisVisit: "巴黎之行",
    atelierVisitScheduled: "已预约旺多姆工坊参观",
    commissionInProgress: "委托单BSP-441正在制作中",
    lookbook: "个性化Lookbook",
    sentAwaitingFeedback: "已发送 · 等待反馈",
  },
  communication: {
    title: "沟通记录",
    channels: {
      whatsapp: "WhatsApp",
      email: "邮件",
      atelierVisit: "工坊参观",
      gift: "礼品",
    },
  },
  gestures: {
    title: "建议关怀举措",
    subtitle: "AI策划 · 礼宾专员审批",
    types: {
      anniversaryGift: "周年纪念礼",
      atelierVisit: "工坊私人参观",
      newCollectionPreview: "新品预览",
    },
    actions: {
      approve: "批准",
      dismiss: "忽略",
    },
    gestureSuggestions: {
      ferreira: "送出品牌香水 + 手写贺卡",
      volkov: "邀请私人预览新款袖扣系列",
      foundersCircle: "在公开发布前发送Nocturne系列Lookbook",
    },
  },
} as const;

export default zhClienteling;
