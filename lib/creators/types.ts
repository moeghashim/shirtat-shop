export type CreatorStatus = "pending" | "approved" | "rejected";
export type PayoutMethod = "paypal" | "wise";
export type TierOverride = "auto" | "standard" | "top";

export interface UserRecord {
  createdAt: string;
  email: string;
  id: string;
  name: string;
  passwordHash: string;
}

export interface DesignSubmission {
  createdAt: string;
  files: { contentType: string; name: string; pathname: string; size: number }[];
  links: string[];
  note: string;
}

export interface CreatorRecord {
  agreedToTermsAt: string;
  bio: string;
  country: string;
  createdAt: string;
  email: string;
  handle: string | null;
  id: string;
  locale: "en" | "ar";
  name: string;
  payoutMethod: PayoutMethod;
  portfolioLinks: string[];
  reviewedAt: string | null;
  status: CreatorStatus;
  submissions: DesignSubmission[];
  tierOverride: TierOverride;
  updatedAt: string;
}
