const viCatalog = {
  page: {
    title: "Danh mục Sản phẩm",
    subtitle:
      "{{count}} mẫu thiết kế đang hiển thị trên {{collections}} bộ sưu tập · đồng bộ {{time}} trước",
  },
  actions: {
    import: "Nhập dữ liệu",
    newReference: "Thêm mẫu thiết kế mới",
    editPricingModel: "Chỉnh sửa mô hình định giá →",
    openLibrary: "Mở thư viện →",
  },
  kpis: {
    activeSKUs: "Mã SKU đang hoạt động",
    activeSKUsHint: "tháng này",
    avgTicket: "Giá trị đơn hàng trung bình",
    inAtelier: "Đang chế tác tại Xưởng",
    inAtelierHint: "đơn chế tác cá nhân hóa",
    drafts: "Bản nháp",
    draftsHint: "{{n}} chờ phê duyệt",
  },
  table: {
    search: "Tìm kiếm theo tên, mã SKU, chứng chỉ...",
    filterCount: "Bộ lọc · {{n}}",
    columns: {
      sku: "Mã SKU",
      reference: "Mẫu thiết kế",
      certificate: "Chứng chỉ",
      retail: "Giá bán lẻ",
      stock: "Tồn kho",
      status: "Trạng thái",
      updated: "Cập nhật",
    },
    collections: {
      all: "Tất cả bộ sưu tập",
      bridal: "Bridal",
      highJewelry: "Trang sức cao cấp",
      atelierPrive: "Atelier Privé",
      heritage: "Di sản",
    },
    status: {
      published: "Đã đăng",
      draft: "Bản nháp",
      outOfStock: "Hết hàng",
      reserved: "Đã đặt trước",
      atelierReview: "Xưởng đang duyệt",
    },
    showing: "Hiển thị {{shown}} trong tổng số {{total}} · {{selected}} thao tác khả dụng",
  },
  pricing: {
    title: "Công thức Định giá",
    subtitle: "Áp dụng tự động cho các mẫu thiết kế mới",
    materialCost: "Chi phí nguyên liệu",
    materialCostVal: "Σ đá quý + kim loại × tuổi vàng",
    atelierLabor: "Nhân công Xưởng chế tác",
    atelierLaborVal: "× 1,85 (hoàn thiện thủ công)",
    maisonMargin: "Biên lợi nhuận Maison",
    maisonMarginVal: "× 4,2",
    boutiqueMarkup: "Hệ số Boutique",
    boutiqueMarkupVal: "+ chỉ số theo vùng",
  },
  publishingWorkflow: {
    title: "Quy trình Xuất bản Sản phẩm",
    stages: {
      draft: "Bản nháp",
      mediaReview: "Duyệt hình ảnh & nội dung",
      pricingApproval: "Phê duyệt định giá",
      boutiqueDistribution: "Phân phối tới Boutique",
      live: "Trực tuyến",
    },
    roles: {
      curator: "Chuyên viên Curation",
      editorial: "Biên tập viên",
      finance: "Tài chính",
      operations: "Vận hành",
    },
    inReview: "Đang duyệt",
  },
  media: {
    title: "Thư viện Tài nguyên",
    assetCount: "{{count}} tài nguyên",
  },
} as const;

export default viCatalog;
