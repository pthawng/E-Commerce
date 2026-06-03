const enCms = {
  page: {
    title: "Storytelling Studio",
    subtitle: "Editorial workflow for the maison's narrative · {{count}} campaigns in motion",
  },
  actions: {
    newStory: "New story",
    addBlock: "+ Add block",
    previewLive: "Preview live",
    upload: "Upload",
  },
  kpis: {
    publishedStories: "Published stories",
    inReview: "In review",
    inReviewHint: "awaiting editorial",
    scheduled: "Scheduled",
    scheduledHint: "next: {{date}}",
    mediaAssets: "Media assets",
  },
  builder: {
    title: "Page Builder · Nocturne 2026",
    subtitle: "Hero campaign · High Jewelry collection",
    blockTypes: {
      hero: "Hero",
      editorial: "Editorial",
      gallery: "Gallery",
      quote: "Quote",
      product: "Product",
      cta: "CTA",
    },
    blockLabels: {
      heroCoverFilm: "Nocturne · cover film",
      letterFromAtelier: "Letter from the atelier",
      stoneProvenance: "Stone provenance · {{count}} images",
      maitreLaurentQuote: "Maître Laurent on craftsmanship",
      featuredEmpress: "Featured · Empress Ruby Cocktail",
      bookPrivateViewing: "Book private viewing",
    },
    sidebar: {
      status: "Status",
      schedule: "Schedule",
      distribution: "Distribution",
      inReview: "In review",
      distributionChannels: {
        maisonSite: "Maison site",
        emailVIP: "Email · VIP",
        wechat: "WeChat",
        instagram: "Instagram",
      },
    },
  },
  pipeline: {
    title: "Editorial Pipeline",
    editor: "editor: A.M.",
    stages: {
      editorialReview: "Editorial review",
      copyEditing: "Copy editing",
      photography: "Photography",
      live: "Live",
      draft: "Draft",
    },
    stories: {
      nocturne: "Nocturne 2026",
      lettersFromVendome: "Letters from Vendôme · Vol. III",
      atelierPortraitRavel: "Atelier portrait: C. Ravel",
      bridalHeritage: "Bridal Heritage",
      provenanceBurmeseRubies: "Provenance · Burmese rubies",
    },
  },
  media: {
    title: "Media Library",
    subtitle: "Curated assets · editorial grade",
  },
} as const;

export default enCms;
