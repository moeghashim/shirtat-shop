/** Garments on the homepage hero rack. Images live in public/banner: 800x960, transparent, hanger included. */
export interface BannerItem {
  href: string;
  image: string;
  nameAr: string;
  nameEn: string;
  sideImage?: string;
  slug: string;
}

export const bannerItems: BannerItem[] = [
  {
    href: "/products/al-zulm-t-shirt",
    image: "/banner/al-zulm-t-shirt-front.webp",
    nameAr: "تيشيرت الظلم",
    nameEn: "Al Zulm T-shirt",
    sideImage: "/banner/al-zulm-t-shirt-side.webp",
    slug: "al-zulm-t-shirt",
  },
  {
    href: "/products/tafakkar-hoodie",
    image: "/banner/tafakkar-hoodie-front.webp",
    nameAr: "هودي تفكّر",
    nameEn: "Tafakkar Hoodie",
    sideImage: "/banner/tafakkar-hoodie-side.webp",
    slug: "tafakkar-hoodie",
  },
  {
    href: "/products/al-adab-sweatshirt",
    image: "/banner/al-adab-sweatshirt-front.webp",
    nameAr: "سويتشيرت الأدب",
    nameEn: "Al Adab Sweatshirt",
    sideImage: "/banner/al-adab-sweatshirt-side.webp",
    slug: "al-adab-sweatshirt",
  },
  {
    href: "/products/sa-ateer-yawman-sweatshirt",
    image: "/banner/sa-ateer-yawman-sweatshirt-front.webp",
    nameAr: "سويتشيرت سأطير يوماً",
    nameEn: "I Will Fly One Day Sweatshirt",
    sideImage: "/banner/sa-ateer-yawman-sweatshirt-side.webp",
    slug: "sa-ateer-yawman-sweatshirt",
  },
  {
    href: "/products/la-ghina-kal-aql-hoodie",
    image: "/banner/la-ghina-kal-aql-hoodie-front.webp",
    nameAr: "هودي لا غنى كالعقل",
    nameEn: "No Wealth Like the Mind Hoodie",
    sideImage: "/banner/la-ghina-kal-aql-hoodie-side.webp",
    slug: "la-ghina-kal-aql-hoodie",
  },
  {
    href: "/products/tafakkar-t-shirt",
    image: "/banner/tafakkar-t-shirt-front.webp",
    nameAr: "تيشيرت تفكّر",
    nameEn: "Tafakkar T-shirt",
    sideImage: "/banner/tafakkar-t-shirt-side.webp",
    slug: "tafakkar-t-shirt",
  },
];
