const viClienteling = {
  page: {
    title: "Chăm sóc Thượng khách VIP",
    subtitle:
      "{{count}} mối quan hệ đang chăm sóc · {{concierges}} chuyên viên Concierge · {{ateliers}} buổi tiếp đón tại Xưởng riêng tháng này",
  },
  actions: {
    openRelationship: "+ Mở mối quan hệ",
    newMessage: "+ Soạn tin nhắn",
  },
  kpis: {
    foundersCircle: "Vòng tròn Sáng lập",
    foundersCircleHint: "Tổng chi tiêu ≥ €2M",
    avgLTV: "Giá trị trọn đời TB (LTV)",
    conciergeLoad: "Tải trọng Concierge",
    conciergeLoadHint: "khách / mỗi Concierge",
    nps: "Chỉ số hài lòng NPS",
    npsHint: "90 ngày gần nhất",
  },
  table: {
    title: "Các mối quan hệ đang chăm sóc",
    columns: {
      client: "Khách hàng",
      tier: "Hạng thành viên",
      ltv: "Tổng chi tiêu (LTV)",
      concierge: "Concierge phụ trách",
      lastTouch: "Lần tiếp xúc gần nhất",
    },
    tiers: {
      foundersCircle: "Vòng tròn Sáng lập",
      atelierPrive: "Atelier Privé",
      maison: "Maison",
      prospects: "Khách tiềm năng",
    },
  },
  concierge: {
    panelTitle: "Hiệu suất Concierge",
    clients: "{{n}} khách",
    avgResponse: "Thời gian phản hồi TB",
  },
  profile: {
    subtitle: "Vòng tròn Sáng lập · Concierge phụ trách",
    preferences: "Sở thích",
    sizes: "Kích thước",
    ring: "Nhẫn",
    bracelet: "Vòng tay",
    necklace: "Vòng cổ preferred",
    lifeEvents: "Sự kiện cuộc đời",
    engagement: "Đính hôn",
    birthday: "Sinh nhật",
    giftReady: "Gợi ý quà tặng đã sẵn sàng",
    parisVisit: "Viếng thăm Paris",
    atelierVisitScheduled: "Đã đặt lịch xem Xưởng tại Vendôme",
    commissionInProgress: "Đơn chế tác BSP-441 đang tiến hành",
    lookbook: "Lookbook Cá nhân hóa",
    sentAwaitingFeedback: "Đã gửi · chờ phản hồi",
  },
  communication: {
    title: "Lịch sử liên lạc",
    channels: {
      whatsapp: "WhatsApp",
      email: "Email",
      atelierVisit: "Buổi tham quan Xưởng",
      gift: "Quà tặng",
    },
  },
  gestures: {
    title: "Gợi ý Hành động Thăm hỏi",
    subtitle: "AI curate · Concierge phê duyệt",
    types: {
      anniversaryGift: "Quà kỷ niệm",
      atelierVisit: "Mời tham quan Xưởng riêng",
      newCollectionPreview: "Xem trước bộ sưu tập mới",
    },
    actions: {
      approve: "Phê duyệt",
      dismiss: "Bỏ qua",
    },
    gestureSuggestions: {
      ferreira: "Gửi nước hoa Maison + thư viết tay",
      volkov: "Mời xem trước bộ sưu tập cufflink mới tại Geneva",
      foundersCircle: "Gửi lookbook Nocturne trước khi ra mắt công khai",
    },
  },
} as const;

export default viClienteling;
