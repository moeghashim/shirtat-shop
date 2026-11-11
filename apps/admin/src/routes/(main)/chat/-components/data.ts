import type { LucideIcon } from "lucide-react";
import { Clock3, Inbox, Mail, MessageCircle, Phone, Send, Star, User } from "lucide-react";

export type Conversation = {
  id: number;
  group: "Pinned" | "Today" | "Yesterday";
  name: string;
  subject: string;
  preview: string;
  time: string;
  isUnread: boolean;
  isOnline: boolean;
  unreadCount: number;
  contact: Contact;
  messages: Message[];
};

export type Message = {
  id: number;
  align: "start" | "end";
  text: string;
  time: string;
  reaction?: string;
};

export type Contact = {
  name: string;
  role: string;
  company: string;
  email: string;
  phone: string;
  website: string;
  location: string;
  timezone: string;
  status: string;
  qualifiedAt: string;
  tags: string[];
};

export type NavItem = {
  id: string;
  title: string;
  label?: string;
  icon: LucideIcon;
  isActive: boolean;
};

export const navItems: NavItem[] = [
  { id: "inbox", title: "Inbox", icon: Inbox, isActive: true },
  { id: "mentions", title: "Mentions", icon: Mail, isActive: false },
  { id: "snoozed", title: "Snoozed", icon: Clock3, isActive: false },
  { id: "sent", title: "Sent", icon: Send, isActive: false },
  { id: "all", title: "All conversations", icon: MessageCircle, isActive: false },
  { id: "unassigned", title: "Unassigned", icon: User, isActive: false },
];

export const channelItems: NavItem[] = [
  { id: "email", title: "Email", icon: Mail, isActive: false },
  { id: "chat", title: "Chat", icon: MessageCircle, isActive: false },
  { id: "whatsapp", title: "WhatsApp", icon: Phone, isActive: false },
  { id: "instagram", title: "Instagram", icon: Phone, isActive: false },
  { id: "facebook", title: "Facebook", icon: Phone, isActive: false },
  { id: "phone", title: "Phone", icon: Phone, isActive: false },
];

export const viewItems: NavItem[] = [
  { id: "vip", title: "VIP Customers", icon: Star, isActive: false },
  { id: "orders", title: "Orders & Returns", icon: Inbox, isActive: false },
  { id: "feedback", title: "Product Feedback", icon: MessageCircle, isActive: false },
];
