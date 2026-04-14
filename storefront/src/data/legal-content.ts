export interface LegalSectionContent {
  id: string;
  title: string;
  content: string | string[];
  subsections?: { title: string; content: string }[];
}

export interface LegalPageContent {
  title: string;
  subtitle: string;
  lastUpdated: string;
  sections: LegalSectionContent[];
}

export const legalContent: Record<'en' | 'vi', { privacy: LegalPageContent; terms: LegalPageContent }> = {
  en: {
    privacy: {
      title: "Privacy Policy",
      subtitle: "Commitment to Client Confidentiality",
      lastUpdated: "January 14, 2026",
      sections: [
        {
          id: "our-commitment",
          title: "Our Commitment",
          content: "At Ray Paradis, we recognize that the trust our clients place in us is as precious as the materials we use in our creations. This Privacy Policy outlines how we safeguard your personal information when you interact with our digital atelier and boutiques."
        },
        {
          id: "data-collection",
          title: "Data We Collect",
          content: [
            "To provide a personalized luxury experience, we collect information that you share with us through account creation, order placement, and newsletter subscription.",
            "This includes, but is not limited to: your name, contact information, billing and shipping addresses, and preferences that help us curate treasures suited to your taste."
          ]
        },
        {
          id: "artistry-and-data",
          title: "How We Use Your Information",
          content: "Your data is used exclusively to facilitate your orders, enhance your shopping experience, and inform you of new masterpieces or exclusive events. We do not sell or trade your information with third parties for marketing purposes.",
          subsections: [
            {
              title: "Personalization",
              content: "We use your browsing history to suggest creations that resonate with your personal style."
            },
            {
              title: "Security",
              content: "To protect your transactions, we utilize industry-standard encryption and fraud prevention measures."
            }
          ]
        },
        {
          id: "client-rights",
          title: "Your Rights as a Connoisseur",
          content: "As a valued client of Ray Paradis, you have the right to access, correct, or request the deletion of your personal data at any time. Our concierge team is available to assist with any inquiries regarding your privacy."
        },
        {
          id: "cookie-policy",
          title: "Digital Footprint",
          content: "Our website uses cookies to maintain your session and understand how our collection is explored. These are small files used to enhance performance and are never used to track you outside the Ray Paradis ecosystem."
        }
      ]
    },
    terms: {
      title: "Terms of Service",
      subtitle: "Governing the Ray Paradis Experience",
      lastUpdated: "January 14, 2026",
      sections: [
        {
          id: "acceptance",
          title: "Acceptance of Terms",
          content: "By entering the digital world of Ray Paradis, you agree to be bound by these Terms of Service. These terms govern your use of our website, the purchase of our creations, and your interaction with our brand."
        },
        {
          id: "craftsmanship",
          title: "Authenticity & Craftsmanship",
          content: "Every Ray Paradis piece is a genuine creation of our master artisans. We guarantee the authenticity and quality of our materials, including the provenance of our gems and the purity of our metals."
        },
        {
          id: "sales-conditions",
          title: "Conditions of Sale",
          content: "All orders are subject to availability and confirmation of the order price. Due to the handcrafted nature of our work, minor variations may exist, making every piece uniquely yours.",
          subsections: [
            {
              title: "Pricing",
              content: "Prices are shown in the currency of your region and are subject to change without notice."
            },
            {
              title: "Payment",
              content: "We accept secure payments via VNPAY, PayPal, and VietQR. Ownership of the creation passes only upon full payment."
            }
          ]
        },
        {
          id: "shipping-returns",
          title: "Delivery & Returns",
          content: "We provide complimentary white-glove delivery for all treasures. Returns of unworn masterpieces in their original condition and packaging are accepted within 30 days of receipt."
        },
        {
          id: "intellectual-property",
          title: "Intellectual Property",
          content: "The designs, photography, and brand essence of Ray Paradis are protected by international intellectual property laws. Any unauthorized use of our creative assets is strictly prohibited."
        }
      ]
    }
  },
  vi: {
    privacy: {
      title: "Chính Sách Bảo Mật",
      subtitle: "Cam Kết Bảo Mật Thông Tin Khách Hàng",
      lastUpdated: "Ngày 14 tháng 01 năm 2026",
      sections: [
        {
          id: "our-commitment",
          title: "Cam Kết Của Chúng Tôi",
          content: "Tại Ray Paradis, chúng tôi hiểu rằng sự tin tưởng của quý khách cũng quý giá như những nguyên liệu chúng tôi sử dụng trong từng tạo tác. Chính sách này tuân thủ Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân tại Việt Nam, đảm bảo mọi thông tin của bạn được bảo vệ ở cấp độ cao nhất."
        },
        {
          id: "data-collection",
          title: "Thông Tin Chúng Tôi Thu Thập",
          content: [
            "Để mang lại trải nghiệm xa xỉ cá nhân hóa, chúng tôi thu thập thông tin bạn chia sẻ khi tạo tài khoản, đặt hàng hoặc đăng ký nhận tin bản từ xưởng chế tác.",
            "Các thông tin này bao gồm: họ tên, thông tin liên lạc, địa chỉ giao hàng, và các sở thích cá nhân nhằm giúp chúng tôi tuyển chọn những báu vật phù hợp nhất với phong cách của bạn."
          ]
        },
        {
          id: "artistry-and-data",
          title: "Mục Đích Sử Dụng Thông Tin",
          content: "Dữ liệu của bạn được sử dụng duy nhất cho mục đích xử lý đơn hàng, nâng cao trải nghiệm mua sắm và thông báo về các kiệt tác mới hoặc sự kiện độc quyền. Chúng tôi cam kết không mua bán hoặc chia sẻ dữ liệu với bên thứ ba vì mục đích tiếp thị.",
          subsections: [
            {
              title: "Cá nhân hóa",
              content: "Sử dụng lịch sử tìm kiếm để gợi ý những bộ sưu tập vang vọng phong cách cá nhân của quý khách."
            },
            {
              title: "An ninh",
              content: "Bảo vệ các giao dịch bằng công nghệ mã hóa tiêu chuẩn quốc tế và các biện pháp phòng chống gian lận."
            }
          ]
        },
        {
          id: "client-rights",
          title: "Quyền Lợi Của Chủ Thể Dữ Liệu",
          content: "Theo pháp luật Việt Nam, quý khách có quyền truy cập, chỉnh sửa, xóa dữ liệu hoặc rút lại sự đồng ý xử lý dữ liệu bất kỳ lúc nào. Đội ngũ quản gia (Concierge) của chúng tôi luôn sẵn sàng hỗ trợ mọi yêu cầu về quyền riêng tư của quý khách."
        },
        {
          id: "cookie-policy",
          title: "Dấu Ấn Kỹ Thuật Số",
          content: "Website sử dụng cookie để duy trì phiên làm việc và tìm hiểu cách bộ sưu tập được khám phá. Đây là những tệp nhỏ giúp tối ưu hiệu năng và tuyệt đối không dùng để theo dõi quý khách ngoài hệ sinh thái của Ray Paradis."
        }
      ]
    },
    terms: {
      title: "Điều Khoản Dịch Vụ",
      subtitle: "Quy Định Trải Nghiệm Ray Paradis",
      lastUpdated: "Ngày 14 tháng 01 năm 2026",
      sections: [
        {
          id: "acceptance",
          title: "Chấp Nhận Điều Khoản",
          content: "Bằng việc truy cập vào thế giới kỹ thuật số của Ray Paradis, quý khách đồng ý tuân thủ các Điều khoản Dịch vụ này. Các quy định này điều chỉnh việc sử dụng website, giao dịch mua sắm và tương tác của quý khách với thương hiệu."
        },
        {
          id: "craftsmanship",
          title: "Tính Xác Thực & Chế Tác",
          content: "Mỗi tạo tác của Ray Paradis là nguyên bản từ các nghệ nhân bậc thầy. Chúng tôi đảm bảo tính xác thực và chất lượng của nguyên vật liệu, bao gồm nguồn gốc đá quý và độ tinh khiết của kim loại quý."
        },
        {
          id: "sales-conditions",
          title: "Điều Kiện Giao Dịch",
          content: "Mọi đơn hàng đều phụ thuộc vào tình trạng sẵn có và xác nhận giá cuối cùng. Do tính chất chế tác thủ công, các biến thể nhỏ có thể tồn tại, khiến mỗi tác phẩm trở thành duy nhất dành cho quý khách.",
          subsections: [
            {
              title: "Giá cả",
              content: "Giá hiển thị theo đơn vị tiền tệ khu vực (VND/USD) và có thể thay đổi tùy theo giá nguyên liệu mà không cần báo trước."
            },
            {
              title: "Thanh toán",
              content: "Chúng tôi chấp nhận thanh toán bảo mật qua VNPAY, PayPal và VietQR. Quyền sở hữu tạo tác chỉ được chuyển giao sau khi thanh toán hoàn tất."
            }
          ]
        },
        {
          id: "shipping-returns",
          title: "Giao Hàng & Đổi Trả",
          content: "Dịch vụ giao hàng tận tâm (White-glove delivery) được áp dụng miễn phí. Chúng tôi chấp nhận đổi trả các kiệt tác trong vòng 30 ngày nếu sản phẩm còn nguyên trạng, đầy đủ bao bì và chưa qua sử dụng."
        },
        {
          id: "intellectual-property",
          title: "Sở Hữu Trí Tuệ",
          content: "Các thiết kế, hình ảnh và bản sắc thương hiệu Ray Paradis được bảo hộ bởi luật sở hữu trí tuệ quốc tế và Việt Nam. Mọi hành vi sao chép hoặc sử dụng trái phép đều bị nghiêm cấm."
        }
      ]
    }
  }
};
