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

export interface StoredFile {
  contentType: string;
  name: string;
  pathname: string;
  size: number;
}

export type DesignStatus = "submitted" | "draft" | "published" | "rejected";

export interface DesignRecord {
  colors: string[];
  createdAt: string;
  descriptionAr: string;
  descriptionEn: string;
  error?: string;
  file: StoredFile;
  id: string;
  productTypeId: string;
  shopifyProductHandle?: string;
  shopifyProductId?: string;
  status: DesignStatus;
  tags: string[];
  title: string;
  updatedAt: string;
}

export interface CreatorDetails {
  address: string;
  avatar?: StoredFile;
  bio: string;
  country: string;
  displayName: string;
  legalName: string;
  payoutEmail: string;
  payoutMethod: PayoutMethod;
  socialHandles: string;
  submittedAt: string;
  taxId: string;
  wiseDetails: string;
}

export interface CreatorRecord {
  designs?: DesignRecord[];
  details?: CreatorDetails;
  detailsEmail?: {
    error?: string;
    sentAt?: string;
    status: "sent" | "failed" | "not_configured" | "queued";
  };
  detailsLink?: string;
  detailsToken?: { expiresAt: string; hash: string };
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
