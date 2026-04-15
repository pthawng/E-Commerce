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

export const legalContent: Record<'en' | 'vi' | 'zh', { privacy: LegalPageContent; terms: LegalPageContent }> = {
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
  },
  zh: {
    privacy: {
      title: "隐私政策",
      subtitle: "恪守客户隐私承诺",
      lastUpdated: "2026年1月14日",
      sections: [
        {
          id: "our-commitment",
          title: "我们的承诺",
          content: "在 Ray Paradis，我们深知客户对我们的信任与我们在创作中所使用的材料一样珍贵。本隐私政策概述了当您通过我们的数字工坊和精品店与我们互动时，我们如何保护您的个人信息。"
        },
        {
          id: "data-collection",
          title: "我们收集的数据",
          content: [
            "为了提供个性化的奢华体验，我们会收集您通过创建账户、下单和订阅简报所分享的信息。",
            "这包括但不限于：您的姓名、联系方式、账单和收货地址，以及帮助我们为您挑选符合您品味的珍宝的喜好设置。"
          ]
        },
        {
          id: "artistry-and-data",
          title: "我们如何使用您的信息",
          content: "您的数据仅用于处理您的订单、提升您的购物体验，并向您通报新的杰作或独家活动。我们不会出于营销目的向第三方出售或交易您的信息。",
          subsections: [
            {
              title: "个性化",
              content: "我们使用您的浏览历史来建议符合您个人风格的创作。"
            },
            {
              title: "安全性",
              content: "为了保护您的交易，我们采用行业标准的加密和欺诈预防措施。"
            }
          ]
        },
        {
          id: "client-rights",
          title: "作为鉴赏家的您的权利",
          content: "作为 Ray Paradis 的珍贵客户，您有权随时访问、更正或要求删除您的个人数据。我们的礼宾团队随时为您提供有关隐私问题的咨询服务。"
        },
        {
          id: "cookie-policy",
          title: "数字足迹",
          content: "我们的网站使用 cookie 来维护您的会话并了解访客如何探索我们的系列。这些小文件用于提升性能，绝不会用于在 Ray Paradis 生态系统之外追踪您。"
        }
      ]
    },
    terms: {
      title: "服务条款",
      subtitle: "规范 Ray Paradis 品牌体验",
      lastUpdated: "2026年1月14日",
      sections: [
        {
          id: "acceptance",
          title: "条款确认",
          content: "进入 Ray Paradis 的数字世界，即表示您同意接受本服务条款的约束。这些条款规范您对我们网站的使用、对我们创作的购买以及您与我们品牌的互动。"
        },
        {
          id: "craftsmanship",
          title: "正品保障与匠心工艺",
          content: "每一件 Ray Paradis 的作品都是由我们的资深匠人倾心打造。我们保证材料的真实性与品质，包括宝石的来源以及贵金属的纯度。"
        },
        {
          id: "sales-conditions",
          title: "销售条款",
          content: "所有订单均视供应情况和订单价格确认而定。由于我们的作品由手工打造，可能存在细微差异，使每一件作品都成为您独一无二的专属之选。",
          subsections: [
            {
              title: "定价",
              content: "价格以您所在地区的货币显示，并可能随时更改，恕不另行通知。"
            },
            {
              title: "付款",
              content: "我们接受通过 VNPAY、PayPal 和 VietQR 进行的安全支付。作品的所有权仅在全额付款后转移。"
            }
          ]
        },
        {
          id: "shipping-returns",
          title: "配送与退货",
          content: "我们为所有珍宝提供免费的尊享配送服务。在原始状态和包装下，未佩戴过的杰作可在签收后30天内申请退货。"
        },
        {
          id: "intellectual-property",
          title: "知识产权",
          content: "Ray Paradis 的设计、摄影及品牌精髓受国际知识产权法保护。严禁任何未经授权使用我们创意资产的行为。"
        }
      ]
    }
  }
};
