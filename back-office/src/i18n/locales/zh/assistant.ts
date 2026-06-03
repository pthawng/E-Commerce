const zhAssistant = {
  page: {
    title: "Maison AI",
    subtitle: "运营副驾驶 · 基于品牌内部数据 · 严格权限管理",
  },
  badge: {
    privateModel: "私有模型 · 欧盟数据主权",
  },
  conversation: {
    title: "对话",
    subtitle: "今日 · 与Amélie",
    placeholder: "询问任何品牌相关问题 · 权限严格执行",
    sendHint: "发送",
    groundedIn: "连接 {{n}} 个数据源",
    send: "发送",
    actions: {
      draftMessages: "起草消息",
      openFullList: "查看完整列表",
    },
  },
  sampleMessages: {
    user1: "请显示亚太区30天内无联系记录的VIP客户。",
    ai1Intro: "我在亚太区找到 {{count}} 位30天以上未有接触记录的VIP客户，最值得关注的有：",
    ai1Suggestion: "是否需要我为S. Chen起草个性化的重新联系消息？",
    clients: {
      park: "{{n}} 天 · 创始人圈 · LTV {{ltv}}",
      nakamura: "{{n}} 天 · Atelier Privé · {{days}} 天后生日",
      wong: "{{n}} 天 · Maison · 已收藏皇后红宝石鸡尾酒戒",
    },
    user2: "为什么我们的D-VVS1 2克拉以上钻石库存偏低？",
    ai2Intro: "当前库存为 {{current}} 颗（警戒线：{{threshold}} 颗）。过去90天情况如下：",
    ai2Bullets: {
      consumed: "{{n}} 颗已用于定制委托",
      lastProcurement: "最近采购：{{date}} · 从日内瓦Diamond House采购 {{count}} 颗",
      projectedStockout: "预计断货：按当前消耗速度约 {{days}} 天后",
    },
    ai2Recommendation: "建议采购 {{count}} 颗，以保持60天库存覆盖。",
  },
  insights: {
    title: "AI洞察 · 今日",
    items: {
      tokyoGrowth: "东京同比增长34%",
      tokyoGrowthDetail: "由3笔创始人圈定制委托拉动，建议考虑扩展工坊工作时间。",
      reorderThreshold: "补货预警",
      reorderThresholdDetail: "D-VVS1 2克拉以上钻石预计14天后断货。",
      crossSellSignal: "交叉销售信号",
      crossSellSignalDetail: "沃尔科夫先生本周已3次浏览Cassiopée手环。",
    },
  },
  search: {
    title: "语义搜索",
    placeholder: "例如：价格低于€10万的缅甸红宝石戒指",
    suggestions: {
      label: "试试以下搜索：",
      anniversaries: "下个月有纪念日的客户",
      vaultIdle: "180天未有动态的保险库资产",
      slaRisk: "存在SLA违约风险的工坊订单",
    },
  },
  drafting: {
    title: "起草助手",
    templates: {
      conciergeFollowup: "礼宾专员跟进",
      conciergeFollowupCtx: "田中先生 · 宝石进展更新",
      pressNote: "新闻稿",
      pressNoteCtx: "Nocturne 2026发布",
      internalMemo: "内部备忘录",
      internalMemoCtx: "旺多姆审计调查结果",
    },
  },
} as const;

export default zhAssistant;
