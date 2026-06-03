const viDashboard = {
  greeting: {
    dayTime: "Thứ Năm · 28 Tháng 5 năm 2026 · Paris",
    welcome: "Bonsoir, Amélie.",
    summary:
      "Nhà chế tác đang vận hành trong các thông số định mức. Có 3 sự vụ cần xử lý trước khi kết thúc ngày làm việc.",
  },
  badges: {
    q2Pace: "Quý 2 · Tiến độ đạt 112%",
  },
  kpis: {
    netRevenueMTD: "Doanh thu thuần · Tháng này",
    ordersInAtelier: "Đơn hàng tại Xưởng",
    ordersInAtelierHint: "6 đơn chế tác cá nhân hóa",
    vaultCoverage: "Tỉ lệ an toàn kho két",
    vaultCoverageHint: "3 mã SKU sắp hết",
    vipActive: "Thượng khách đang hoạt động",
    vipActiveHint: "22 sự kiện",
    vsMay25: "so với tháng 5/25",
  },
  revenuePanel: {
    title: "Tốc độ Doanh thu",
    subtitle: "12 tháng gần nhất · Toàn bộ Boutique",
    today: "Hôm nay",
    forecastEoM: "Dự báo cuối tháng",
    vsAvg: "so với trung bình",
    confidence: "độ tin cậy",
  },
  atelierPipeline: {
    title: "Dây chuyền Xưởng chế tác",
    subtitle: "Đơn hàng đang chế tác theo công đoạn",
    stages: {
      stoneSelection: "Tuyển chọn đá quý",
      cadWax: "Thiết kế CAD & Mẫu sáp",
      casting: "Đúc khuôn",
      handFinishing: "Hoàn thiện thủ công",
      qcHallmark: "Kiểm định & Khắc dấu",
    },
  },
  attentionPanel: {
    title: "Cần xử lý",
    subtitle: "3 sự vụ vận hành",
    openQueue: "Mở hàng đợi",
    columns: {
      ref: "Mã sự vụ",
      matter: "Nội dung",
      owner: "Người phụ trách",
      sla: "SLA",
    },
    incidents: {
      vaultDiscrepancy: "Lệch kho két · Place Vendôme",
      vaultDiscrepancyCtx: "1 số serial chưa được xác nhận sau chu kỳ kiểm kho",
      vipEscalation: "Khiếu nại VIP · Ông Tanaka",
      vipEscalationCtx: "Đơn chế tác cá nhân hóa đã bị lùi lịch 2 lần",
      gemstoneMismatch: "Sai lệch chứng chỉ đá quý",
      gemstoneMismatchCtx: "Báo cáo GIA khác biệt về cấp độ tạp chất — Mã SKU RP-2104-S",
      today: "Hôm nay",
      tomorrow: "Ngày mai",
    },
  },
  pulse: {
    title: "Nhịp đập Maison",
    revenuePulse: "Doanh thu · 12 tháng",
    ordersPulse: "Đơn hàng · 12 tháng",
    newCommissions: "3 đơn chế tác mới mở tại flagship Tokyo",
    auditComplete: "Chu kỳ kiểm kho hoàn thành trong",
    shippingReview: "Lô hàng đi Riyadh cần kiểm tra thủ tục hải quan",
    diamondLow: "Tồn kho kim cương dưới ngưỡng (D-VVS1, từ 2ct trở lên)",
  },
  topBoutiques: {
    title: "Boutique Dẫn đầu · Tháng này",
    boutique: "Boutique",
    revenue: "Doanh thu",
    yoy: "YoY",
  },
  vipLifecycle: {
    title: "Vòng đời Thượng khách VIP",
    tiers: {
      foundersCircle: "Vòng tròn Sáng lập",
      foundersCircleDesc: "Tổng chi tiêu ≥ €2M",
      atelierPrive: "Atelier Privé",
      atelierPriveDesc: "Khách chế tác cá nhân hóa",
      maison: "Maison",
      maisonDesc: "Thượng khách đang hoạt động",
      prospects: "Khách tiềm năng",
      prospectsDesc: "Đang nuôi dưỡng qua Concierge",
    },
  },
  auditTrail: {
    title: "Lịch sử Kiểm toán · Hôm nay",
    actions: {
      approvedRefund: "Phê duyệt hoàn tiền €18.400 · ORD-9914",
      vaultMovement: "Biến động kho két: 4 số serial → Geneva",
      dailyRecon: "Đối soát hàng ngày hoàn tất · 0 lệch số",
      publishedEditorial: "Đã xuất bản Bridal Editorial 2026",
      onboardedVIP: "Tiếp nhận VIP mới · Bà Ferreira",
    },
  },
} as const;

export default viDashboard;
