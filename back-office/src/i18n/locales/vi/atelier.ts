const viAtelier = {
  page: {
    title: "Xưởng chế tác",
    subtitle: "{{count}} sản phẩm đang trong quy trình chế tác · đồng bộ {{time}} trước",
  },
  actions: {
    timelineView: "Xem dạng Timeline",
    newCommission: "Đơn chế tác mới",
    addCard: "+ Thêm",
    openDossier: "Mở toàn bộ hồ sơ",
  },
  kpis: {
    onSchedule: "Đúng tiến độ",
    atRisk: "Có rủi ro",
    atRiskHint: "SLA còn < 48 giờ",
    avgLeadTime: "Thời gian chế tác trung bình",
    avgLeadTimeHint: "đơn cá nhân hóa",
    qcPassRate: "Tỷ lệ đạt kiểm định",
  },
  kanban: {
    title: "Kanban Quy trình chế tác",
    subtitle: "Kéo thả giữa các công đoạn · nhấn để xem đầy đủ hồ sơ",
    stages: {
      stone: "Tuyển chọn đá quý",
      cad: "Thiết kế CAD & Mẫu sáp",
      cast: "Đúc khuôn",
      finish: "Hoàn thiện thủ công",
      qc: "Kiểm định & Khắc dấu",
    },
    priority: "Ưu tiên",
    artisan: "Nghệ nhân",
    due: "Hạn giao",
  },
  dossier: {
    title: "Hồ sơ Đơn chế tác",
    subtitle: "Nhẫn đính hôn chế tác cá nhân hóa",
    fields: {
      centreStone: "Đá chủ",
      setting: "Ổ nhẫn",
      sidestones: "Đá tấm",
      engraving: "Khắc chữ",
      box: "Hộp đựng",
      delivery: "Giao hàng",
    },
    timeline: {
      title: "Tiến trình chế tác",
      stages: {
        stoneSelection: "Tuyển chọn đá · {{count}} mẫu được khách duyệt",
        cadValidated: "CAD được phê duyệt · khách hàng đã ký",
        waxApproved: "Mẫu sáp được chấp thuận",
        castingInProgress: "Đúc khuôn đang tiến hành",
        handFinishing: "Hoàn thiện thủ công",
        qcHallmark: "Kiểm định, khắc dấu & hoàn thiện hồ sơ",
        conciergeHandover: "Bàn giao qua Concierge",
      },
    },
    financials: {
      quote: "Báo giá",
      deposit: "Đặt cọc",
      depositReceived: "đã nhận",
      balance: "Số dư còn lại",
    },
    boxMaisonSignature: "Hộp chữ ký Maison, sơn mài",
  },
  artisanWorkload: {
    title: "Tải trọng Nghệ nhân",
    active: "{{n}} đơn đang thực hiện",
    roles: {
      masterJeweller: "Thợ kim hoàn bậc thầy",
      stonesetter: "Thợ nạm đính đá",
      cadLead: "Trưởng phòng Thiết kế CAD",
      paveSpecialist: "Chuyên gia Pavé",
      qualityControl: "Kiểm soát chất lượng",
    },
  },
  qcPanel: {
    title: "Điểm Kiểm định · 24 giờ qua",
    results: {
      pass: "Đạt",
      repolish: "Đánh bóng lại",
    },
  },
} as const;

export default viAtelier;
