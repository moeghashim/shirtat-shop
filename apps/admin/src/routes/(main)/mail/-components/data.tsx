import { Archive, CircleHelp, File, Inbox, Keyboard, type LucideIcon, Send, Star, Trash2 } from "lucide-react";
import { siFigma, siGoogledocs, siGooglephotos } from "simple-icons";

export type Recipient = {
  name: string;
  email: string;
};

export type Attachment = {
  id: string;
  name: string;
  size: string;
  icon: "figma" | "docs" | "photos";
};

export type Mail = {
  id: string;
  accountId: number;
  from: Recipient;
  to: Recipient[];
  cc?: Recipient[];
  subject: string;
  body: string;
  receivedAt: string;
  folder: "inbox" | "drafts" | "sent" | "archive" | "trash";
  isRead: boolean;
  isPinned: boolean;
  isPriority: boolean;
  labels: string[];
  attachments?: Attachment[];
  messageCount?: number;
};

export type MailNavItem = {
  id: string;
  title: string;
  label?: string;
  icon: LucideIcon;
  isActive: boolean;
};

type MailNavigation = {
  navMain: MailNavItem[];
  folders: MailNavItem[];
  navFooter: MailNavItem[];
};

export const mailNavigation: MailNavigation = {
  navMain: [
    {
      id: "inbox",
      title: "Inbox",
      icon: Inbox,
      isActive: true,
    },
    {
      id: "priority",
      title: "Priority",
      icon: Star,
      isActive: false,
    },
  ],
  folders: [
    {
      id: "drafts",
      title: "Drafts",
      icon: File,
      isActive: false,
    },
    {
      id: "sent",
      title: "Sent",
      icon: Send,
      isActive: false,
    },
    {
      id: "archive",
      title: "Archive",
      icon: Archive,
      isActive: false,
    },
    {
      id: "trash",
      title: "Trash",
      icon: Trash2,
      isActive: false,
    },
  ],
  navFooter: [
    {
      id: "help-feedback",
      title: "Help & feedback",
      icon: CircleHelp,
      isActive: false,
    },
    {
      id: "keyboard-shortcuts",
      title: "Keyboard shortcuts",
      icon: Keyboard,
      isActive: false,
    },
  ],
};

export const attachmentIcons = { figma: siFigma, docs: siGoogledocs, photos: siGooglephotos };
export type MailAccount = { id: number; label: string; email: string };
