const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

const replacement = `const INITIAL_CONFIG_KR = {
  labels: {
    newSeason: '뉴 시즌',
    taxIncluded: '관세 포함',
    oneSize: '원사이즈 상품',
    addToBag: '쇼핑백에 담기',
    wishlist: '위시리스트',
    deliveryEstimate: '예상 배송일',
    deliveryDates: '5월 7일 - 5월 12일',
    freeReturnTitle: '30일 무료 반품 | 집으로 찾아오는 간편한 반품 픽업',
    descTitle: '상품 설명',
    shippingTitle: '배송 & 반품',
    shippingDesc: '모든 주문에 대해 반품 픽업 서비스가 무료로 제공됩니다.',
    breadcrumbRoot: '여성',
    shopTitle: '주얼리',
    allBrands: '전체 브랜드',
    allCategories: '전체',
    backLink: '액세서리 돌아가기'
  },
  navMainMenu: [
    {
      id: 'women', label: '여성 컬렉션', subCategories: [
        { id: 'w1', label: '새로운 게 필요할 땐' },
        { id: 'w2', label: '바캉스' },
        { id: 'w3', label: '브랜드' },
        { id: 'w4', label: '의류' },
        { id: 'w5', label: '슈즈' },
        { id: 'w6', label: '백' },
        { id: 'w7', label: '액세서리' },
        { id: 'w8', label: '주얼리' },
      ]
    },
    {
       id: 'men', label: '남성 컬렉션', subCategories: [
        { id: 'm1', label: '새로운 컬렉션' },
        { id: 'm2', label: '브랜드' },
        { id: 'm3', label: '의류' },
        { id: 'm4', label: '슈즈' },
        { id: 'm5', label: '백' },
        { id: 'm6', label: '액세서리' },
       ]
    },
    {
       id: 'kids', label: '키즈 컬렉션', subCategories: [
        { id: 'k1', label: '여아 (2-12세)' },
        { id: 'k2', label: '남아 (2-12세)' },
        { id: 'k3', label: '베이비 (0-36개월)' },
       ]
    }
  ],
  marquee: {
    text: 'NEW COLLECTION OUT NOW — FREE WORLDWIDE SHIPPING ON ALL ORDERS OVER $500 — HANDCRAFTED IN ITALY'
  },
  brand: {
    name: 'MEI MAREA',
    concept: '이탈리아 장인 주얼리 셀렉션 부티크',
    description: '장인 정신과 현대적 미학을 결합한 프리미엄 주얼리 브랜드',
    selectionBoutique: {
      title: 'SELECTION BOUTIQUE',
      subtitle: '이탈리아 장인 정신의 정수',
      description: '메이 마레아는 이탈리아 전역의 유서 깊은 공방과 현대적 장인들로부터 가장 독창적인 주얼리를 엄선합니다. 우리는 전통적인 금속 공예 기술과 전위적인 디자인이 교차하는 지점을 탐구하며, 단순한 장신구를 넘어선 하나의 예술 작품으로서의 가치를 지향합니다.',
      image: 'https://images.unsplash.com/photo-1573333243148-5256e076633f?q=80&w=2072&auto=format&fit=crop'
    }
  },
  navigation: [
    { label: '컬렉션', href: '#' },
    { label: '장인', href: '#', active: true },
    { label: '에디토리얼', href: '#' },
    { label: '아카이브', href: '#' },
  ],
  hero: {
    title: '예술적\\n숙련',
    description: '손과 재료 사이의 고요한 대화.\\n과정, 존재, 그리고 장식의 미학에 관한 기록입니다.',
    cta: '제작자 알아보기',
    image: 'https://images.unsplash.com/photo-1610492421943-88cc2974ab6e?q=80&w=2070&auto=format&fit=crop',
  },
  theme: {
    photoFilter: 'retro-filter',
    imageFilters: {}
  },
  curatedSeries: {
    label: 'SERIES 01 — FORM',
    title: '엄선된 제품',
    products: [
      { id: 'eclipse', name: '이클립스 링', material: 'STERLING SILVER', img: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=2070&auto=format&fit=crop' },
      { id: 'void', name: '보이드 네크리스', material: 'OXIDIZED SILVER', img: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?q=80&w=1974&auto=format&fit=crop' },
      { id: 'fracture', name: '프랙처 이어링', material: 'WHITE GOLD', img: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=1974&auto=format&fit=crop' },
      { id: 'linear', name: '리니어 브레이슬릿', material: 'PLATINUM', img: 'https://images.unsplash.com/photo-1611085583191-a3b1aee33433?q=80&w=2070&auto=format&fit=crop' }
    ]
  },
  profiles: {
    label: 'VOL. 01 — FLORENCE',
    title: '아카이브: 선정된 프로필',
    viewCollectionLabel: '컬렉션 보기',
    primary: {
      name: '엘레나 로시 (ELENA ROSSI)',
      role: '마스터 실버헤드',
      bio: '"구조적 기하학을 전문으로 하는 마스터 실버헤드. 그녀의 작업은 브루탈리즘 건축의 렌즈를 통해 전통적인 기술을 재정의합니다."',
      image: 'https://images.unsplash.com/photo-1611095773767-114b53ef539f?q=80&w=2070&auto=format&fit=crop'
    },
    secondary: {
      name: '마테오 비앙키 (MATTEO BIANCHI)',
      bio: '"여백에 집중하다. 비앙키의 접근 방식은 필수적인 구조만 남을 때까지 재료를 제거하여, 부정적인 공간(negative space)에 의해 정의되는 작품을 창조합니다."',
      image: 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?q=80&w=2070&auto=format&fit=crop'
    },
    study: {
      label: '재질 연구',
      name: '001. 원석 은 (RAW SILVER)',
      image: 'https://images.unsplash.com/photo-1626497746870-394200787593?q=80&w=1964&auto=format&fit=crop'
    }
  },
  featured: {
    title: '장식의 미학',
    description: '형태, 그림자, 그리고 여백에 대한 연구.\\n실용적인 디자인과 조각적 주얼리의 교차점을 조명합니다.',
    mainImage: 'https://images.unsplash.com/photo-1515562141207-7a88fb0ce33e?q=80&w=2070&auto=format&fit=crop',
    mainLabel: '대표 제품 // OBLIVION CHOKER',
    detail1: 'https://images.unsplash.com/photo-1630019017590-f024b6e0c0b4?q=80&w=1969&auto=format&fit=crop',
    detail1Label: '상세 / 01',
    detail2: 'https://images.unsplash.com/photo-1543840922-38379ba4a29a?q=80&w=2070&auto=format&fit=crop',
    detail2Label: '상세 / 02'
  },
  footer: {
    links: [
      { label: '인스타그램', href: '#' },
      { label: '저널', href: '#' },
      { label: '개인정보 보호 정책', href: '#' },
      { label: '문의하기', href: '#' }
    ],
    copyright: '© 2024 MEI MAREA. ALL RIGHTS RESERVED.'
  }
};

const INITIAL_CONFIG_EN = {
  labels: {
    newSeason: 'NEW SEASON',
    taxIncluded: 'TAX INCLUDED',
    oneSize: 'ONE SIZE',
    addToBag: 'ADD TO BAG',
    wishlist: 'WISHLIST',
    deliveryEstimate: 'ESTIMATED DELIVERY',
    deliveryDates: 'MAY 7 - MAY 12',
    freeReturnTitle: '30-DAY FREE RETURNS | EASY PICKUP FROM HOME',
    descTitle: 'PRODUCT DESCRIPTION',
    shippingTitle: 'SHIPPING & RETURNS',
    shippingDesc: 'Complimentary return pickup service is provided for all orders.',
    breadcrumbRoot: 'WOMEN',
    shopTitle: 'JEWELRY',
    allBrands: 'ALL BRANDS',
    allCategories: 'ALL CATEGORIES',
    backLink: 'BACK TO ACCESSORIES'
  },
  navMainMenu: [
    {
      id: 'women', label: 'WOMEN', subCategories: [
        { id: 'w1', label: 'NEW ARRIVALS' },
        { id: 'w2', label: 'VACATION' },
        { id: 'w3', label: 'BRANDS' },
        { id: 'w4', label: 'CLOTHING' },
        { id: 'w5', label: 'SHOES' },
        { id: 'w6', label: 'BAGS' },
        { id: 'w7', label: 'ACCESSORIES' },
        { id: 'w8', label: 'JEWELRY' },
      ]
    },
    {
       id: 'men', label: 'MEN', subCategories: [
        { id: 'm1', label: 'NEW COLLECTION' },
        { id: 'm2', label: 'BRANDS' },
        { id: 'm3', label: 'CLOTHING' },
        { id: 'm4', label: 'SHOES' },
        { id: 'm5', label: 'BAGS' },
        { id: 'm6', label: 'ACCESSORIES' },
       ]
    },
    {
       id: 'kids', label: 'KIDS', subCategories: [
        { id: 'k1', label: 'GIRLS (2-12Y)' },
        { id: 'k2', label: 'BOYS (2-12Y)' },
        { id: 'k3', label: 'BABY (0-36M)' },
       ]
    }
  ],
  marquee: {
    text: 'NEW COLLECTION OUT NOW — FREE WORLDWIDE SHIPPING ON ALL ORDERS OVER $500 — HANDCRAFTED IN ITALY'
  },
  brand: {
    name: 'MEI MAREA',
    concept: 'Italian Artisan Jewelry Selection Boutique',
    description: 'Premium jewelry brand combining craftsmanship and modern aesthetics',
    selectionBoutique: {
      title: 'SELECTION BOUTIQUE',
      subtitle: 'The Essence of Italian Craftsmanship',
      description: 'Mei Marea carefully curates the most original jewelry from historic workshops and modern artisans across Italy. We explore the intersection of traditional metalworking techniques and avant-garde design, aiming for value as a work of art beyond simple ornaments.',
      image: 'https://images.unsplash.com/photo-1573333243148-5256e076633f?q=80&w=2072&auto=format&fit=crop'
    }
  },
  navigation: [
    { label: 'COLLECTIONS', href: '#' },
    { label: 'ARTISANS', href: '#', active: true },
    { label: 'EDITORIAL', href: '#' },
    { label: 'ARCHIVE', href: '#' },
  ],
  hero: {
    title: 'ARTISTIC\\nMASTERY',
    description: 'A silent conversation between hands and materials.\\nA record of process, existence, and the aesthetics of ornamentation.',
    cta: 'DISCOVER OUR ARTISANS',
    image: 'https://images.unsplash.com/photo-1610492421943-88cc2974ab6e?q=80&w=2070&auto=format&fit=crop',
  },
  theme: {
    photoFilter: 'retro-filter',
    imageFilters: {}
  },
  curatedSeries: {
    label: 'SERIES 01 — FORM',
    title: 'Curated Products',
    products: [
      { id: 'eclipse', name: 'Eclipse Ring', material: 'STERLING SILVER', img: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=2070&auto=format&fit=crop' },
      { id: 'void', name: 'Void Necklace', material: 'OXIDIZED SILVER', img: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?q=80&w=1974&auto=format&fit=crop' },
      { id: 'fracture', name: 'Fracture Earrings', material: 'WHITE GOLD', img: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=1974&auto=format&fit=crop' },
      { id: 'linear', name: 'Linear Bracelet', material: 'PLATINUM', img: 'https://images.unsplash.com/photo-1611085583191-a3b1aee33433?q=80&w=2070&auto=format&fit=crop' }
    ]
  },
  profiles: {
    label: 'VOL. 01 — FLORENCE',
    title: 'ARCHIVE: SELECTED PROFILES',
    viewCollectionLabel: 'VIEW COLLECTION',
    primary: {
      name: 'ELENA ROSSI',
      role: 'MASTER SILVERSMITH',
      bio: '"Master silversmith specializing in structural geometry. Her work redefines traditional techniques through the lens of brutalist architecture."',
      image: 'https://images.unsplash.com/photo-1611095773767-114b53ef539f?q=80&w=2070&auto=format&fit=crop'
    },
    secondary: {
      name: 'MATTEO BIANCHI',
      bio: '"Focusing on the void. Bianchi\\'s approach removes material until only the essential structure remains, creating pieces defined by negative space."',
      image: 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?q=80&w=2070&auto=format&fit=crop'
    },
    study: {
      label: 'MATERIAL STUDY',
      name: '001. RAW SILVER',
      image: 'https://images.unsplash.com/photo-1626497746870-394200787593?q=80&w=1964&auto=format&fit=crop'
    }
  },
  featured: {
    title: 'Aesthetics of Ornament',
    description: 'A study of form, shadow, and void.\\nHighlighting the intersection of utilitarian design and sculptural jewelry.',
    mainImage: 'https://images.unsplash.com/photo-1515562141207-7a88fb0ce33e?q=80&w=2070&auto=format&fit=crop',
    mainLabel: 'FEATURED // OBLIVION CHOKER',
    detail1: 'https://images.unsplash.com/photo-1630019017590-f024b6e0c0b4?q=80&w=1969&auto=format&fit=crop',
    detail1Label: 'DETAIL / 01',
    detail2: 'https://images.unsplash.com/photo-1543840922-38379ba4a29a?q=80&w=2070&auto=format&fit=crop',
    detail2Label: 'DETAIL / 02'
  },
  footer: {
    links: [
      { label: 'Instagram', href: '#' },
      { label: 'Journal', href: '#' },
      { label: 'Privacy Policy', href: '#' },
      { label: 'Contact Us', href: '#' }
    ],
    copyright: '© 2024 MEI MAREA. ALL RIGHTS RESERVED.'
  }
};
`;

const lines = content.split('\\n');
const startIdx = lines.findIndex(l => l.startsWith('const INITIAL_CONFIG = {'));
let endIdx = -1;
for (let i = startIdx; i < lines.length; i++) {
  if (lines[i] === '};' && lines[i+1] === '' && lines[i+2] && lines[i+2].includes('PRODUCT CARD COMPONENT')) {
    endIdx = i;
    break;
  }
}

if (startIdx !== -1 && endIdx !== -1) {
    const before = lines.slice(0, startIdx).join('\\n');
    const after = lines.slice(endIdx + 1).join('\\n');
    const newContent = before + '\\n' + replacement + '\\n' + after;
    fs.writeFileSync('src/App.tsx', newContent);
    console.log("Config replaced successfully.");
} else {
    console.log("Could not exact match lines. start", startIdx, "end", endIdx);
}
