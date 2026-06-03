const viAssistant = {
  page: {
    title: "Maison AI",
    subtitle: "Trợ lý vận hành · đồng bộ dữ liệu Maison nội bộ · bảo mật phân quyền nghiêm ngặt",
  },
  badge: {
    privateModel: "Mô hình riêng · chủ quyền dữ liệu EU",
  },
  conversation: {
    title: "Hội thoại",
    subtitle: "Hôm nay · cùng Amélie",
    placeholder: "Đặt câu hỏi về Maison · phân quyền được thực thi",
    sendHint: "để gửi",
    groundedIn: "Kết nối với {{n}} nguồn dữ liệu",
    send: "Gửi",
    actions: {
      draftMessages: "Soạn tin nhắn",
      openFullList: "Xem đầy đủ danh sách",
    },
  },
  sampleMessages: {
    user1:
      "Cho tôi xem danh sách thượng khách VIP tại khu vực APAC chưa được liên hệ trong 30 ngày qua.",
    ai1Intro:
      "Tôi tìm thấy {{count}} thượng khách VIP tại APAC chưa có điểm tiếp xúc trong hơn 30 ngày. Đáng chú ý nhất:",
    ai1Suggestion:
      "Bạn có muốn tôi soạn các tin nhắn tái kết nối cá nhân hóa để S. Chen xét duyệt không?",
    clients: {
      park: "{{n}} ngày · Vòng tròn Sáng lập · LTV {{ltv}}",
      nakamura: "{{n}} ngày · Atelier Privé · sinh nhật trong {{days}} ngày",
      wong: "{{n}} ngày · Maison · đã lưu Empress Ruby",
    },
    user2: "Tại sao tồn kho kim cương D-VVS1 từ 2ct trở lên đang thấp?",
    ai2Intro: "Tồn kho hiện tại là {{current}} viên (ngưỡng: {{threshold}}). Trong 90 ngày qua:",
    ai2Bullets: {
      consumed: "{{n}} viên đã sử dụng cho các đơn chế tác cá nhân hóa",
      lastProcurement: "Nhập hàng gần nhất: {{date}} · {{count}} viên từ Diamond House Geneva",
      projectedStockout: "Dự kiến hết hàng: ~{{days}} ngày với tốc độ tiêu thụ hiện tại",
    },
    ai2Recommendation:
      "Tôi khuyến nghị phát lệnh mua {{count}} viên để đảm bảo tồn kho đủ dùng trong 60 ngày.",
  },
  insights: {
    title: "Phân tích thông minh AI · Hôm nay",
    items: {
      tokyoGrowth: "Tokyo +34% YoY",
      tokyoGrowthDetail:
        "Thúc đẩy bởi 3 đơn chế tác từ Vòng tròn Sáng lập. Cân nhắc mở rộng giờ làm việc tại Xưởng.",
      reorderThreshold: "Ngưỡng nhập hàng",
      reorderThresholdDetail: "Kim cương D-VVS1 từ 2ct dự kiến hết hàng trong 14 ngày.",
      crossSellSignal: "Tín hiệu bán chéo",
      crossSellSignalDetail: "Ông Volkov đã xem Cassiopée Cuff 3 lần trong tuần này.",
    },
  },
  search: {
    title: "Tìm kiếm Ngữ nghĩa",
    placeholder: "Ví dụ: nhẫn đá Ruby Miến Điện dưới €100K",
    suggestions: {
      label: "Thử với:",
      anniversaries: "Khách hàng có kỷ niệm trong tháng tới",
      vaultIdle: "Tài sản kho két không có biến động trong 180 ngày",
      slaRisk: "Đơn chế tác có nguy cơ vi phạm SLA",
    },
  },
  drafting: {
    title: "Trợ lý Soạn thảo",
    templates: {
      conciergeFollowup: "Theo dõi Concierge",
      conciergeFollowupCtx: "Ông Tanaka · Cập nhật đá quý",
      pressNote: "Thông cáo báo chí",
      pressNoteCtx: "Ra mắt Nocturne 2026",
      internalMemo: "Biên bản nội bộ",
      internalMemoCtx: "Kết quả kiểm tra Vendôme",
    },
  },
} as const;

export default viAssistant;
