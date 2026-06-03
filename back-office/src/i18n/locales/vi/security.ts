const viSecurity = {
  page: {
    title: "Bảo mật & Kiểm toán",
    subtitle: "Quản trị doanh nghiệp · Đạt chứng nhận SOC 2 Type II · Kiểm tra gần nhất: {{date}}",
  },
  badges: {
    ssoActive: "SSO đang hoạt động",
    mfaEnforced: "MFA · Bắt buộc",
  },
  kpis: {
    activeSessions: "Phiên đang hoạt động",
    activeSessionsHint: "trên {{n}} thành phố",
    privilegedUsers: "Tài khoản đặc quyền",
    privilegedUsersHint: "trong tổng số {{total}} tài khoản",
    failedLogins: "Đăng nhập thất bại · 24 giờ",
    failedLoginsHint: "tự động khóa",
    riskScore: "Điểm đánh giá Rủi ro",
    riskScoreHint: "Giám sát liên tục",
  },
  suspiciousAlert: {
    title: "Phát hiện hoạt động bất thường · Tài khoản: {{account}}",
    detail:
      "{{attempts}} lần đăng nhập thất bại từ {{ip}} (Không xác định). Tài khoản tự động bị khóa. CISO đã được thông báo.",
    action: "Điều tra",
  },
  auditLog: {
    title: "Audit Log · Thời gian thực",
    subtitle: "Mọi thao tác đặc quyền đều được ghi nhận và không thể xóa",
    columns: {
      timestamp: "Thời gian",
      actor: "Người thực hiện",
      action: "Thao tác",
      ip: "Địa chỉ IP",
      location: "Vị trí",
      risk: "Mức độ rủi ro",
    },
    risk: {
      high: "Cao",
      medium: "Trung bình",
      normal: "Bình thường",
    },
    actions: {
      viewedVIPProfile: "Xem hồ sơ thượng khách · Ông Tanaka",
      approvedRefund: "Phê duyệt hoàn tiền",
      sealedVaultTransfer: "Niêm phong và chuyển kho két · {{count}} số serial",
      failedLoginMultiple: "Đăng nhập thất bại {{count}} lần · Tài khoản: {{account}}",
      dailyReconCompleted: "Đối soát hàng ngày hoàn tất",
      publishedEditorial: "Đã xuất bản Bridal Editorial 2026",
    },
  },
  roleMatrix: {
    title: "Ma trận Phân quyền",
    subtitle: "{{users}} tài khoản thuộc {{roles}} vai trò · {{modules}} phân hệ",
    columns: {
      role: "Vai trò",
    },
    roles: {
      executive: "Ban lãnh đạo",
      operationsDirector: "Giám đốc Vận hành",
      concierge: "Chuyên viên Concierge",
      vaultKeeper: "Thủ kho Két bảo mật",
      artisan: "Nghệ nhân",
      finance: "Kế toán Tài chính",
      editor: "Biên tập viên",
    },
    modules: {
      dashboard: "Dashboard",
      commerce: "Commerce",
      vault: "Vault",
      atelier: "Atelier",
      crm: "CRM",
      ledger: "Ledger",
      cms: "CMS",
      security: "Bảo mật",
    },
  },
} as const;

export default viSecurity;
