const zhCms = {
  page: {
    title: "品牌叙事工作室",
    subtitle: "品牌内容编辑工作流 · {{count}} 个活跃营销活动",
  },
  actions: {
    newStory: "新建故事",
    addBlock: "+ 添加内容块",
    previewLive: "实时预览",
    upload: "上传",
  },
  kpis: {
    publishedStories: "已发布故事",
    inReview: "审核中",
    inReviewHint: "等待编辑",
    scheduled: "已排期",
    scheduledHint: "最近: {{date}}",
    mediaAssets: "媒体素材",
  },
  builder: {
    title: "页面构建器 · Nocturne 2026",
    subtitle: "主视觉活动 · 高级珠宝系列",
    blockTypes: {
      hero: "主视觉",
      editorial: "编辑内容",
      gallery: "图集",
      quote: "引言",
      product: "产品展示",
      cta: "行动号召",
    },
    blockLabels: {
      heroCoverFilm: "Nocturne · 封面影片",
      letterFromAtelier: "来自工坊的信",
      stoneProvenance: "宝石产地 · {{count}} 张图片",
      maitreLaurentQuote: "Maître Laurent谈手工艺",
      featuredEmpress: "精选 · 皇后红宝石鸡尾酒戒",
      bookPrivateViewing: "预约私人观赏",
    },
    sidebar: {
      status: "状态",
      schedule: "排期",
      distribution: "分发渠道",
      inReview: "审核中",
      distributionChannels: {
        maisonSite: "品牌官网",
        emailVIP: "邮件 · VIP客户",
        wechat: "微信",
        instagram: "Instagram",
      },
    },
  },
  pipeline: {
    title: "编辑流水线",
    editor: "编辑：A.M.",
    stages: {
      editorialReview: "编辑审核",
      copyEditing: "文案校对",
      photography: "摄影拍摄",
      live: "已发布",
      draft: "草稿",
    },
    stories: {
      nocturne: "Nocturne 2026",
      lettersFromVendome: "来自旺多姆的信 · 第三卷",
      atelierPortraitRavel: "工坊肖像：C. Ravel",
      bridalHeritage: "婚嫁传承系列",
      provenanceBurmeseRubies: "产地溯源 · 缅甸红宝石",
    },
  },
  media: {
    title: "素材库",
    subtitle: "精选素材 · 编辑级品质",
  },
} as const;

export default zhCms;
