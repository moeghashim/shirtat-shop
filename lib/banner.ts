/** Example garments shown on the homepage hero rail. Images live in public/banner. Prices in USD. */
export interface BannerItem {
  category: "poetry" | "humor" | "cultures" | "occasions";
  image: string;
  nameAr: string;
  nameEn: string;
  priceUsd: number;
  sideImage?: string;
  slug: string;
}

export const bannerItems: BannerItem[] = [
  {
    category: "poetry",
    image: "/banner/poetry-mutanabbi-tee.png",
    nameAr: "تيشيرت المتنبي",
    nameEn: "Al-Mutanabbi Tee",
    priceUsd: 30,
    slug: "poetry-mutanabbi-tee",
  },
  {
    category: "humor",
    image: "/banner/humor-mosh-fadi-tee.png",
    nameAr: "تيشيرت «مش فاضي»",
    nameEn: '"Mosh Fadi" Tee',
    priceUsd: 30,
    slug: "humor-mosh-fadi-tee",
  },
  {
    category: "occasions",
    image: "/banner/occasions-eid-hoodie.png",
    nameAr: "هودي عيد مبارك",
    nameEn: "Eid Mubarak Hoodie",
    priceUsd: 55,
    slug: "occasions-eid-hoodie",
  },
  {
    category: "cultures",
    image: "/banner/cultures-mint-tea-sweatshirt.png",
    nameAr: "سويتشيرت شاي بالنعناع",
    nameEn: "Mint Tea Sweatshirt",
    priceUsd: 50,
    slug: "cultures-mint-tea-sweatshirt",
  },
  {
    category: "occasions",
    image: "/banner/occasions-birthday-tee.png",
    nameAr: "تيشيرت عيد الميلاد",
    nameEn: "Birthday Tee",
    priceUsd: 30,
    slug: "occasions-birthday-tee",
  },
  {
    category: "humor",
    image: "/banner/humor-khalliha-hoodie.png",
    nameAr: "هودي «خلّيها على الله»",
    nameEn: '"Khalliha Ala Allah" Hoodie',
    priceUsd: 55,
    slug: "humor-khalliha-hoodie",
  },
  {
    category: "cultures",
    image: "/banner/cultures-bread-salt-tote.png",
    nameAr: "حقيبة عيش وملح",
    nameEn: "Bread & Salt Tote",
    priceUsd: 22,
    slug: "cultures-bread-salt-tote",
  },
  {
    category: "poetry",
    image: "/banner/poetry-qifa-nabki-sweatshirt.png",
    nameAr: "سويتشيرت قفا نبكِ",
    nameEn: "Qifa Nabki Sweatshirt",
    priceUsd: 50,
    slug: "poetry-qifa-nabki-sweatshirt",
  },
  {
    category: "occasions",
    image: "/banner/occasions-laylat-al-omr-tee.png",
    nameAr: "تيشيرت ليلة العمر",
    nameEn: "Engagement Night Tee",
    priceUsd: 30,
    slug: "occasions-laylat-al-omr-tee",
  },
];
