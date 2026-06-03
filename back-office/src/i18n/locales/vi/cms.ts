const viCms = {
  page: {
    title: "Storytelling Studio",
    subtitle: "Quy trình biên tập nội dung thương hiệu · {{count}} chiến dịch đang chạy",
  },
  actions: {
    newStory: "Thêm bài viết mới",
    addBlock: "+ Thêm khối nội dung",
    previewLive: "Xem trước bản thật",
    upload: "Tải lên",
  },
  kpis: {
    publishedStories: "Bài viết đã xuất bản",
    inReview: "Đang xét duyệt",
    inReviewHint: "chờ biên tập",
    scheduled: "Đã lên lịch",
    scheduledHint: "gần nhất: {{date}}",
    mediaAssets: "Tài nguyên phương tiện",
  },
  builder: {
    title: "Trình dựng Trang · Nocturne 2026",
    subtitle: "Chiến dịch Hero · Bộ sưu tập Trang sức cao cấp",
    blockTypes: {
      hero: "Ảnh bìa",
      editorial: "Bài xã luận",
      gallery: "Bộ sưu tập ảnh",
      quote: "Trích dẫn",
      product: "Nổi bật sản phẩm",
      cta: "Kêu gọi hành động",
    },
    blockLabels: {
      heroCoverFilm: "Nocturne · phim bìa",
      letterFromAtelier: "Thư ngỏ từ Xưởng chế tác",
      stoneProvenance: "Nguồn gốc đá quý · {{count}} hình ảnh",
      maitreLaurentQuote: "Maître Laurent nói về nghề thủ công",
      featuredEmpress: "Nổi bật · Empress Ruby Cocktail",
      bookPrivateViewing: "Đặt lịch xem riêng tư",
    },
    sidebar: {
      status: "Trạng thái",
      schedule: "Lịch xuất bản",
      distribution: "Kênh phân phối",
      inReview: "Đang xét duyệt",
      distributionChannels: {
        maisonSite: "Trang web Maison",
        emailVIP: "Email · Thượng khách VIP",
        wechat: "WeChat",
        instagram: "Instagram",
      },
    },
  },
  pipeline: {
    title: "Hàng đợi Biên tập",
    editor: "biên tập: A.M.",
    stages: {
      editorialReview: "Xét duyệt biên tập",
      copyEditing: "Hiệu đính văn bản",
      photography: "Nhiếp ảnh",
      live: "Đã đăng",
      draft: "Bản nháp",
    },
    stories: {
      nocturne: "Nocturne 2026",
      lettersFromVendome: "Thư từ Vendôme · Tập III",
      atelierPortraitRavel: "Chân dung Xưởng chế tác: C. Ravel",
      bridalHeritage: "Di sản Bridal",
      provenanceBurmeseRubies: "Nguồn gốc · Đá Ruby Miến Điện",
    },
  },
  media: {
    title: "Thư viện Tài nguyên",
    subtitle: "Tài nguyên được tuyển chọn · chuẩn chất lượng xã luận",
  },
} as const;

export default viCms;
