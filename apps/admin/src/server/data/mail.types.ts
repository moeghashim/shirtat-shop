import type { Mail, MailAccount } from "../../routes/(main)/mail/-components/data.tsx";
export type MailData = {
  renderedAt: string;
  mails: Mail[];
  accounts: MailAccount[];
  counts: { id: string; label: string }[];
};
