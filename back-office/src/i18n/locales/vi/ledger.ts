const viLedger = {
  page: {
    title: "Sổ cái Tài chính",
    subtitle: "Kỳ kế toán: {{period}} · khóa sổ trong {{days}} ngày · kiểm toán bởi Mazars",
  },
  actions: {
    exportTrialBalance: "Xuất Bảng cân đối thử",
    beginPeriodClose: "Khóa sổ kỳ tài chính",
  },
  kpis: {
    revenueMTD: "Doanh thu thuần · Tháng này",
    cogsMTD: "Giá vốn hàng bán (COGS) · Tháng này",
    grossMargin: "Biên lợi nhuận gộp",
    openAR: "Phải thu khách hàng (AR)",
    openARHint: "{{n}} hóa đơn",
    reconciliation: "Tỷ lệ Đối soát",
    reconciliationHint: "Đang xem xét",
  },
  journal: {
    title: "Bút toán Nhật ký",
    subtitle: "Giao dịch gần nhất trên toàn hệ thống Maison",
    filters: {
      allAccounts: "Tất cả tài khoản",
      period: "Tháng {{month}} {{year}}",
    },
    columns: {
      date: "Ngày",
      ref: "Mã bút toán",
      description: "Mô tả",
      account: "Tài khoản kế toán",
      debit: "Nợ",
      credit: "Có",
      status: "Trạng thái",
    },
    status: {
      posted: "Đã ghi sổ",
      pendingReview: "Chờ kiểm tra",
      reconciled: "Đã đối soát",
    },
    totals: {
      showing: "Hiển thị {{shown}} trong tổng số {{total}} bút toán",
      totalDebits: "Tổng Nợ",
      totalCredits: "Tổng Có",
      variance: "Chênh lệch",
    },
    descriptions: {
      saleARMaison: "Bán hàng · Ghi nhận doanh thu",
      vatCollected: "VAT đầu ra thu được",
      refundPartial: "Hoàn tiền · hoàn trả từng phần",
      atelierLabour: "Trích trước chi phí nhân công Xưởng",
      inventoryWriteDown: "Điều chỉnh giảm giá trị hàng tồn kho · QC",
      wireReceived: "Nhận chuyển khoản · tiền đặt cọc",
    },
  },
  bankRecon: {
    title: "Đối soát Ngân hàng",
    subtitle: "BNP Paribas · Tài khoản chính Maison",
    status: {
      matched: "Khớp",
      unmatched: "Chưa khớp",
    },
  },
  refundWorkflow: {
    title: "Quy trình Phê duyệt Hoàn tiền & Thanh toán",
    alert: {
      title: "Hoàn tiền {{amount}} · {{order}}",
      subtitle: "Cần CFO phê duyệt · đang chờ {{duration}}",
    },
    stages: {
      request: "Yêu cầu hoàn tiền",
      conciergeValidation: "Concierge xác nhận",
      financeReview: "Tài chính kiểm tra",
      cfoApproval: "CFO phê duyệt",
      paymentDispatch: "Phát lệnh thanh toán",
      journalPosted: "Hạch toán bút toán vào sổ",
    },
    notifyCFO: "Nhắc nhở CFO",
    requestors: {
      boutiqueParis: "Boutique · Paris",
      pending: "Đang chờ",
    },
  },
} as const;

export default viLedger;
