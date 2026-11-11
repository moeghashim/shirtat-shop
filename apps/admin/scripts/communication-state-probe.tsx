import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";

import { ChatProvider, useChat } from "../src/routes/(main)/chat/-components/use-chat";
import { MailProvider, useMail } from "../src/routes/(main)/mail/-components/use-mail";
import { demoChat } from "../src/server/data/chat";
import type { MailData } from "../src/server/data/mail.types";
import { accounts, mailCounts, mailDefinitions } from "../src/server/db/fixtures/mail";

let setMail: ReturnType<typeof useMail>[1];
let setChat: ReturnType<typeof useChat>[1];
function MailProbe() {
  const [s, set] = useMail();
  setMail = set;
  return <output>{s.selected ?? "empty"}</output>;
}
function ChatProbe() {
  const [s, set] = useChat();
  setChat = set;
  return <output>{s.selected ?? "empty"}</output>;
}

export async function runCommunicationStateProbe() {
  const mail: MailData = {
    renderedAt: "2026-10-23T12:00:00Z",
    accounts,
    counts: mailCounts,
    mails: mailDefinitions.map(({ minutesAgo, ...m }) => ({
      ...m,
      receivedAt: new Date(Date.parse("2026-10-23T12:00:00Z") - minutesAgo * 60000).toISOString(),
    })),
  };
  const chat = await demoChat();
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  const expect = (value: string) => {
    if (container.textContent !== value) throw new Error(`Selection mismatch: ${container.textContent} !== ${value}`);
  };
  try {
    flushSync(() =>
      root.render(
        <MailProvider data={mail}>
          <MailProbe />
        </MailProvider>,
      ),
    );
    expect(mail.mails[0].id);
    flushSync(() => setMail({ selected: mail.mails[1].id }));
    expect(mail.mails[1].id);
    flushSync(() =>
      root.render(
        <MailProvider data={{ ...mail, mails: [mail.mails[0]] }}>
          <MailProbe />
        </MailProvider>,
      ),
    );
    expect("empty");
    flushSync(() =>
      root.render(
        <MailProvider key="empty" data={{ ...mail, mails: [] }}>
          <MailProbe />
        </MailProvider>,
      ),
    );
    expect("empty");
    flushSync(() =>
      root.render(
        <>
          <MailProvider key="a" data={mail}>
            <MailProbe />
          </MailProvider>
          <MailProvider key="b" data={{ ...mail, mails: mail.mails.slice(1) }}>
            <MailProbe />
          </MailProvider>
        </>,
      ),
    );
    expect(mail.mails[0].id + mail.mails[1].id);
    flushSync(() =>
      root.render(
        <ChatProvider data={chat}>
          <ChatProbe />
        </ChatProvider>,
      ),
    );
    expect(String(chat.conversations[0].id));
    flushSync(() => setChat({ selected: chat.conversations[1].id }));
    expect(String(chat.conversations[1].id));
    flushSync(() =>
      root.render(
        <ChatProvider data={{ ...chat, conversations: [chat.conversations[0]] }}>
          <ChatProbe />
        </ChatProvider>,
      ),
    );
    expect("empty");
    flushSync(() =>
      root.render(
        <ChatProvider key="empty" data={{ ...chat, conversations: [] }}>
          <ChatProbe />
        </ChatProvider>,
      ),
    );
    expect("empty");
    flushSync(() =>
      root.render(
        <>
          <ChatProvider key="a" data={chat}>
            <ChatProbe />
          </ChatProvider>
          <ChatProvider key="b" data={{ ...chat, conversations: chat.conversations.slice(1) }}>
            <ChatProbe />
          </ChatProvider>
        </>,
      ),
    );
    expect(String(chat.conversations[0].id) + String(chat.conversations[1].id));
    return "PASS Mail/Chat initial, changed, removed, empty and independent provider selection";
  } finally {
    flushSync(() => root.unmount());
    container.remove();
  }
}
