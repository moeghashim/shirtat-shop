import type { Conversation } from "../../routes/(main)/chat/-components/data.ts";
export type ChatData = {
  conversations: Conversation[];
  currentUser: { name: string; email: string };
  display: { threadDate: string; threadDateLabel: string; counts: { all: number; open: number; snoozed: number } };
  counts: { id: string; label: string }[];
};
