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
    image: "/banner/al-zulm-t-shirt-front-v2.webp",
    nameAr: "تيشيرت الظلم",
    nameEn: "Al Zulm T-shirt",
    sideImage: "/banner/al-zulm-t-shirt-side-v2.webp",
    slug: "al-zulm-t-shirt",
  },
  {
    href: "/products/tafakkar-hoodie",
    image: "/banner/tafakkar-hoodie-front-v2.webp",
    nameAr: "هودي تفكّر",
    nameEn: "Tafakkar Hoodie",
    sideImage: "/banner/tafakkar-hoodie-side-v2.webp",
    slug: "tafakkar-hoodie",
  },
  {
    href: "/products/al-adab-sweatshirt",
    image: "/banner/al-adab-sweatshirt-front-v2.webp",
    nameAr: "سويتشيرت الأدب",
    nameEn: "Al Adab Sweatshirt",
    sideImage: "/banner/al-adab-sweatshirt-side-v2.webp",
    slug: "al-adab-sweatshirt",
  },
  {
    href: "/products/sa-ateer-yawman-sweatshirt",
    image: "/banner/sa-ateer-yawman-sweatshirt-front-v2.webp",
    nameAr: "سويتشيرت سأطير يوماً",
    nameEn: "I Will Fly One Day Sweatshirt",
    sideImage: "/banner/sa-ateer-yawman-sweatshirt-side-v2.webp",
    slug: "sa-ateer-yawman-sweatshirt",
  },
  {
    href: "/products/la-ghina-kal-aql-hoodie",
    image: "/banner/la-ghina-kal-aql-hoodie-maroon-front-v2.webp",
    nameAr: "هودي لا غنى كالعقل",
    nameEn: "No Wealth Like the Mind Hoodie",
    sideImage: "/banner/la-ghina-kal-aql-hoodie-maroon-side-v2.webp",
    slug: "la-ghina-kal-aql-hoodie",
  },
  {
    href: "/products/tafakkar-t-shirt",
    image: "/banner/tafakkar-t-shirt-front-v2.webp",
    nameAr: "تيشيرت تفكّر",
    nameEn: "Tafakkar T-shirt",
    sideImage: "/banner/tafakkar-t-shirt-side-v2.webp",
    slug: "tafakkar-t-shirt",
  },
  {
    href: "/products/lahez-kalamak-garh-hoodie",
    image: "/banner/lahez-kalamak-garh-hoodie-front-v2.webp",
    nameAr: "هودي لاحظ إن كلامك جارح",
    nameEn: "Lahez en Kalamak Garh Hoodie",
    slug: "lahez-kalamak-garh-hoodie",
  },
];
