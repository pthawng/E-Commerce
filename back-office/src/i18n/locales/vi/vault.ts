const viVault = {
  page: {
    title: "Kho két & Hàng tồn kho",
    subtitle:
      "{{locations}} địa điểm bảo mật · {{items}} tài sản định danh RFID · Tổng giá trị bảo hiểm {{value}}",
  },
  badges: {
    rfidOnline: "RFID trực tuyến",
    auditLeft: "Kiểm kho · còn {{time}}",
  },
  kpis: {
    totalInsuredValue: "Tổng giá trị bảo hiểm",
    totalInsuredValueHint: "Hợp đồng Lloyd's 884-A",
    serializedItems: "Tài sản định danh RFID",
    inTransit: "Đang vận chuyển",
    inTransitHint: "{{n}} chuyến có hộ tống",
    discrepancies: "Lệch số liệu",
    discrepanciesHint: "Paris V1, đang xử lý",
  },
  locations: {
    title: "Địa điểm Kho két",
    subtitle: "Trạng thái RFID và niêm phong theo thời gian thực",
    columns: {
      vault: "Kho két",
      items: "Số lượng",
      value: "Giá trị",
      health: "Tình trạng",
      status: "Trạng thái",
    },
    status: {
      secured: "Bảo mật nghiêm ngặt",
      auditCycle: "Đang kiểm kho",
      sealed: "Đã niêm phong",
    },
  },
  inventoryHealth: {
    title: "Sức khỏe Hàng tồn kho",
    subtitle: "Phân loại theo danh mục",
    categories: {
      diamondsDFVVS: "Kim cương · D-F · VVS trở lên",
      diamonds2ct: "Kim cương · từ 2ct trở lên",
      colourStonesBurmese: "Đá màu · Miến Điện",
      pearlsSouthSea: "Ngọc trai · Nam Thái Bình Dương",
      platinumGold: "Bạch kim Pt950 · Vàng 9999",
    },
  },
  movements: {
    title: "Biến động Kho hàng · Hôm nay",
    subtitle: "Tất cả giao dịch vận chuyển, kiểm kho và niêm phong",
    columns: {
      time: "Thời gian",
      ref: "Mã giao dịch",
      asset: "Tài sản",
      from: "Xuất kho",
      to: "Nhận kho",
      operation: "Loại nghiệp vụ",
      status: "Trạng thái",
    },
    operations: {
      transferEscorted: "Vận chuyển · có hộ tống",
      loan24h: "Cho mượn · 24 giờ",
      saleFinal: "Bán hàng · hoàn tất",
      inboundGIA: "Nhập kho · chứng chỉ GIA",
      inspection: "Kiểm tra chất lượng",
    },
    status: {
      inTransit: "Đang vận chuyển",
      released: "Đã xuất kho",
      delivered: "Đã bàn giao",
      sealed: "Đã niêm phong",
      pending: "Đang chờ duyệt",
    },
  },
} as const;

export default viVault;
