import { MediaType, PrismaClient } from '@prisma/client';

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

export async function seedCatalog(prisma: PrismaClient) {
  console.log('🧹 Wiping existing catalog data...');
  // Delete all products. Cascading rules will clear variants, media, categories, and orders.
  await prisma.product.deleteMany({});
  
  const categoryData = await prisma.category.findMany();
  const categoryMap = new Map(categoryData.map((c) => [c.slug, c]));

  const materialsEN = ['18k Rose Gold', 'Platinum', 'White Gold', 'Sterling Silver', '18k Yellow Gold'];
  const materialsVI = ['Vàng Hồng 18k', 'Bạch Kim', 'Vàng Trắng', 'Bạc Nguyên Chất', 'Vàng Cổ Điển 18k'];
  const stonesEN = ['Sapphire', 'Diamond', 'Emerald', 'Ruby', 'Opal', 'Amethyst', 'Topaz'];
  const stonesVI = ['Sapphire', 'Kim Cương', 'Ngọc Lục Bảo', 'Hồng Ngọc', 'Đá Opal', 'Thạch Anh Tím', 'Hoàng Ngọc'];
  const adjsEN = ['Radiant', 'Ethereal', 'Vintage', 'Modern', 'Timeless', 'Exquisite', 'Imperial', 'Majestic'];
  const adjsVI = ['Rực Rỡ', 'Huyền Ảo', 'Cổ Điển', 'Hiện Đại', 'Vượt Thời Gian', 'Tinh Tế', 'Hoàng Gia', 'Tráng Lệ'];
  const inspEN = [
    'inspired by the gentle waves of the ocean',
    'drawing from the intricate patterns of Renaissance architecture',
    'capturing the essence of a starlit night',
    'reflecting the bold lines of Art Deco',
    'celebrating the raw beauty of untamed nature',
    'embodying the spirit of eternal love'
  ];
  const inspVI = [
    'lấy cảm hứng từ những con sóng êm đềm của đại dương',
    'mang âm hưởng từ những hoa văn tinh xảo của kiến trúc Phục Hưng',
    'thu trọn vẻ đẹp của một đêm đầy sao',
    'phản chiếu những đường nét mạnh mẽ của nghệ thuật Art Deco',
    'tôn vinh vẻ đẹp nguyên sơ của thiên nhiên hoang dã',
    'hiện thân cho tinh thần của tình yêu vĩnh cửu'
  ];

  const categoryImages: Record<string, string[]> = {
    rings: [
      '1589674781759-c21c37956a44', '1543294001-f7cd5d7fb516', '1605100804763-247f67b3557e',
      '1613945408026-6732d875e701', '1586104237516-5b7075e00d45', '1561995734-ef4b62bb6586',
      '1626456070685-613271cc4360', '1600861194942-8d0ba9ea6c3c', '1611591437281-460bfbe1220a'
    ],
    necklaces: [
      '1588444968576-f8fe92ce56fd', '1635767798638-3e25273a8236', '1611012844392-f4f96c7fd052',
      '1705326453292-f3d35cd96514', '1729518969028-474518ecde50', '1599643478524-fb252445b23b',
      '1611591437145-2b47f48a1c86'
    ],
    bracelets: [
      '1573408301185-9146fe634ad0', '1611107683227-e9060eccd846', '1689397136362-dce64e557fcc',
      '1663243818736-2b7148eeb2f5', '1691370298583-4364b396e1e3', '1639065643006-e217c4fee12e',
      '1535632066927-ab7c9ab60908'
    ],
    earrings: [
      '1629224316810-9d8805b95e76', '1588444650733-d0767b753fc8', '1535632787350-4e68ef0ac584',
      '1665159882377-385d68d2bdff', '1680181362119-5c9bf196805f', '1674329042475-de1a95b4ca62',
      '1769151591224-2eee6793b885'
    ],
  };

  const getRand = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
  const getShuffledImages = (catSlug: string) => {
    const images = [...(categoryImages[catSlug] || categoryImages.rings)];
    for (let i = images.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [images[i], images[j]] = [images[j], images[i]];
    }
    return images.slice(0, 4); // return 4 unique images
  };

  console.log('📦 Generating 100 Hyper-Realistic Products...');

  const categoryKeys = ['rings', 'necklaces', 'bracelets', 'earrings'];
  
  for (let i = 0; i < 100; i++) {
    const catSlug = categoryKeys[i % categoryKeys.length];
    const category = categoryMap.get(catSlug)!;
    const catNameEN = (category.name as any).en || 'Jewelry';
    const catNameVI = (category.name as any).vi || 'Trang sức';

    const matIdx = Math.floor(Math.random() * materialsEN.length);
    const stoneIdx = Math.floor(Math.random() * stonesEN.length);
    const adjIdx = Math.floor(Math.random() * adjsEN.length);
    const inspIdx = Math.floor(Math.random() * inspEN.length);

    const productNameEN = `The ${adjsEN[adjIdx]} ${stonesEN[stoneIdx]} ${catNameEN}`;
    const productNameVI = `${catNameVI} ${stonesVI[stoneIdx]} ${adjsVI[adjIdx]}`;
    // Add an index to slug to absolutely prevent collisions
    const slug = slugify(`${productNameEN} ${i}`);

    const basePrice = Math.floor(Math.random() * 80000000) + 10000000;
    
    // Rich Story Generation
    const descEN = `
      <p>A masterpiece of modern craftsmanship, <strong>${productNameEN}</strong> is meticulously forged from pure ${materialsEN[matIdx]}.</p>
      <p>This creation is ${inspEN[inspIdx]}, offering an unparalleled visual experience.</p>
      <p>Each ${stonesEN[stoneIdx].toLowerCase()} is hand-selected by our master gemologists to ensure perfect clarity, exceptional brilliance, and ethical sourcing. Wear it as a testament to your unique legacy.</p>
    `;
    const descVI = `
      <p>Một kiệt tác của nghệ thuật chế tác đương đại, <strong>${productNameVI}</strong> được rèn đúc tỉ mỉ từ ${materialsVI[matIdx]} nguyên chất.</p>
      <p>Tác phẩm này ${inspVI[inspIdx]}, mang lại một trải nghiệm thị giác không thể hòa lẫn.</p>
      <p>Mỗi viên ${stonesVI[stoneIdx].toLowerCase()} đều được tuyển chọn thủ công bởi các chuyên gia đá quý hàng đầu của chúng tôi, đảm bảo độ tinh khiết hoàn hảo, độ sáng chói đặc biệt và nguồn gốc đạo đức. Hãy diện nó như một minh chứng cho di sản độc tôn của riêng bạn.</p>
    `;

    const productImages = getShuffledImages(catSlug);

    const product = await prisma.product.create({
      data: {
        name: { en: productNameEN, vi: productNameVI },
        slug,
        description: { en: descEN, vi: descVI },
        displayPriceMin: basePrice,
        displayPriceMax: basePrice + 2000000,
        isActive: true,
        isFeatured: i < 8,
      },
    });

    // 1. Categories
    await prisma.productCategory.create({
      data: {
        productId: product.id,
        categoryId: category.id,
      },
    });

    // 2. Multiple Media (Gallery)
    const mediaInserts = productImages.map((imgId, idx) => ({
      productId: product.id,
      url: `https://images.unsplash.com/photo-${imgId}?auto=format&fit=crop&q=80&w=1200`,
      type: MediaType.image,
      isThumbnail: idx === 0,
      order: idx
    }));
    await prisma.productMedia.createMany({ data: mediaInserts });

    // 3. Variants
    await prisma.productVariant.createMany({
      data: [
        {
          productId: product.id,
          sku: `${slug.toUpperCase().substring(0, 15)}-${i}-01`,
          price: basePrice,
          variantTitle: { en: 'Standard Edition', vi: 'Bản Tiêu Chuẩn' },
          isDefault: true,
          thumbnailUrl: mediaInserts[0].url
        },
        {
          productId: product.id,
          sku: `${slug.toUpperCase().substring(0, 15)}-${i}-02`,
          price: basePrice + 2000000,
          variantTitle: { en: 'Premium Edition', vi: 'Bản Cao Cấp' },
          isDefault: false,
          thumbnailUrl: mediaInserts[1]?.url || mediaInserts[0].url
        },
      ],
    });

    if ((i + 1) % 20 === 0) console.log(`...Seeded ${i + 1}/100 products`);
  }
}
