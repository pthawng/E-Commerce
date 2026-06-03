const viCommon = {
  brand: {
    name: "Ray Paradis",
    subtitle: "Maison · Vận hành",
  },
  nav: {
    overview: "Tổng quan",
    operations: "Vận hành",
    clientsFinance: "Khách hàng & Tài chính",
    studio: "Studio sáng tạo",
    governance: "Quản trị hệ thống",
    items: {
      executive: "Điều hành",
      commerce: "Thương mại & Catalog",
      vault: "Kho két & Hàng tồn",
      atelier: "Xưởng chế tác",
      clienteling: "VIP Care",
      ledger: "Sổ cái Tài chính",
      cms: "Storytelling CMS",
      security: "Cấu hình Bảo mật",
      staff: "Quản trị nhân sự",
      assistant: "Trợ lý AI",
    },
  },
  topbar: {
    search: "Tìm kiếm khách hàng, đơn hàng, mã SKU...",
    askAI: "Hỏi Maison AI",
    routes: {
      "/": {
        crumbs: ["Maison", "Tổng quan Điều hành"],
        sub: "Tín hiệu thời gian thực trên toàn bộ hệ thống vận hành",
      },
      "/commerce": {
        crumbs: ["Thương mại", "Danh mục sản phẩm"],
        sub: "Quản trị danh mục sản phẩm của Maison",
      },
      "/vault": {
        crumbs: ["Vận hành", "Kho két & Hàng tồn kho"],
        sub: "Tài sản bảo mật trên các chi nhánh",
      },
      "/atelier": {
        crumbs: ["Xưởng chế tác", "Quy trình chế tác"],
        sub: "Đơn hàng chế tác riêng & Kiểm định chất lượng",
      },
      "/vip-care": {
        crumbs: ["Khach hang", "VIP Care"],
        sub: "Client 360, concierge, qua tang, aftercare, su kien va rui ro quan he",
      },
      "/ledger": {
        crumbs: ["Tài chính", "Sổ cái tổng hợp"],
        sub: "Đối soát giao dịch & Kiểm toán tài chính",
      },
      "/cms": {
        crumbs: ["Studio", "Storytelling"],
        sub: "Biên tập nội dung xã luận & Chiến dịch thương hiệu",
      },
      "/back-office/settings/security": {
        crumbs: ["Thiết lập", "Cấu hình Bảo mật"],
        sub: "Quản lý phiên làm việc & thông tin bảo mật cá nhân",
      },
      "/back-office/staff": {
        crumbs: ["Quản trị", "Nhân sự"],
        sub: "Quản trị quyền truy cập & tài khoản nhân sự Maison",
      },
      "/assistant": {
        crumbs: ["Trí tuệ nhân tạo", "Trợ lý AI"],
        sub: "Trợ lý vận hành thương hiệu — bảo mật phân quyền nghiêm ngặt",
      },
    },
  },
  user: {
    role: "Giám đốc Vận hành",
  },
  status: {
    allNominal: "Hệ thống vận hành ổn định",
    live: "Trực tiếp",
    online: "Trực tuyến",
    rfidOnline: "RFID trực tuyến",
  },
  badge: {
    success: "Hoàn thành",
    warning: "Cảnh báo",
    error: "Lỗi",
    info: "Thông tin",
    pending: "Đang chờ",
  },
  actions: {
    view: "Xem",
    edit: "Chỉnh sửa",
    delete: "Xóa",
    approve: "Phê duyệt",
    dismiss: "Bỏ qua",
    open: "Mở",
    close: "Đóng",
    save: "Lưu",
    cancel: "Hủy",
    confirm: "Xác nhận",
    export: "Xuất dữ liệu",
    import: "Nhập dữ liệu",
    upload: "Tải lên",
    download: "Tải xuống",
    previous: "Trước",
    next: "Tiếp theo",
    addNew: "Thêm mới",
    openLibrary: "Mở thư viện",
    requestRestock: "Yêu cầu nhập hàng",
    investigate: "Điều tra",
  },
  pagination: {
    showing: "Hiển thị {{shown}} trong tổng số {{total}}",
    page: "Trang {{current}} / {{total}}",
  },
  lang: {
    vi: "VI",
    en: "EN",
    zh: "ZH",
  },
} as const;

export default viCommon;
