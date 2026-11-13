/**
 * JSON contract between the storefront's owner API (/api/internal/admin/*) and the admin app.
 * Type-only: the admin app imports it with `import type`, so no storefront code ships there.
 */
import type { GradedCheck, ProjectedTurn, TurnFeedback } from "../chat-review";
import type { CreatorRecord, DesignRecord } from "../creators/types";

export interface AdminDesign extends DesignRecord {
  /** Category the apply form starts on: the saved one, else the keyword guess. */
  suggestedCategoryId: string;
  /** Words that drove the keyword guess, shown next to the select. */
  suggestedFrom: string[];
  typeLabel: string | null;
}

export interface AdminCreator extends Omit<CreatorRecord, "designs" | "detailsToken"> {
  avatarPath: string | null;
  designs: AdminDesign[];
  /** Only the expiry leaves the storefront; the token hash stays private. */
  detailsTokenExpiresAt: string | null;
  initials: string;
  latestEmail: { sentAt: string | null; sentFrom: string | null; status: string } | null;
}

export interface PerformanceRow {
  designsLive: number;
  designsRejected: number;
  designsSubmitted: number;
  earnings: number;
  handle: string;
  id: string;
  lastSignIn: string;
  lastUpload: string;
  name: string;
  net60: number;
  netQtd: number;
  payable: number;
  pending: number;
  rate: number;
  refunds: number;
  status: string;
  tier: string;
  units60: number;
  unitsQtd: number;
}

export interface AdminProductType {
  blueprint: string | null;
  colors: string[];
  cost: number;
  id: string;
  labelEn: string;
  retail: string;
}

export interface DesignersView {
  catalog: {
    categories: { id: string; labelAr: string; labelEn: string }[];
    productTypes: AdminProductType[];
    supplierName: string;
  };
  counts: { approved: number; pending: number; queuedEmails: number; total: number };
  creators: AdminCreator[];
  performance: { rows: PerformanceRow[]; salesUnavailable: boolean };
  storefrontUrl: string;
}

export type DesignerOp = "apply" | "create" | "delete" | "design" | "resend" | "update";

/** Outcome codes mirror the old /admin/creators?flag=… messages. */
export interface AdminActionResult {
  code: string;
  detail?: string;
  ok: boolean;
}

export interface ChatSessionSummary {
  direction: "ltr" | "rtl";
  preview: string;
  sessionId: string;
  turns: number;
}

export interface ChatsView {
  captureEnabled: boolean;
  sessions: ChatSessionSummary[];
  storeError: boolean;
}

export interface ChatTurnView {
  feedback: TurnFeedback | null;
  graded: GradedCheck[];
  replaced: boolean;
  turn: ProjectedTurn;
}

export interface ChatDetailView {
  liveUnavailable: boolean;
  sample: boolean;
  sessionId: string;
  storeError: boolean;
  turns: ChatTurnView[];
}
