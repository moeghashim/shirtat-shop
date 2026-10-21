/** Garments on the homepage hero rack. Images live in public/banner: 800x960, transparent, hanger included. */
export interface BannerItem {
  image: string;
  nameAr: string;
  nameEn: string;
  sideImage?: string;
  slug: string;
}

export const bannerItems: BannerItem[] = [
  {
    image: "/banner/rose-tee.webp",
    nameAr: "تيشيرت وردي",
    nameEn: "Dusty Rose Tee",
    slug: "rose-tee",
  },
  {
    image: "/banner/forest-tee.webp",
    nameAr: "تيشيرت أخضر",
    nameEn: "Forest Green Tee",
    slug: "forest-tee",
  },
  {
    image: "/banner/sand-tee.webp",
    nameAr: "تيشيرت رملي",
    nameEn: "Sand Tee",
    slug: "sand-tee",
  },
  {
    image: "/banner/navy-tee.webp",
    nameAr: "تيشيرت كحلي",
    nameEn: "Navy Tee",
    slug: "navy-tee",
  },
  {
    image: "/banner/black-tee.webp",
    nameAr: "تيشيرت أسود",
    nameEn: "Black Tee",
    slug: "black-tee",
  },
];
