import { UserRoundCheckIcon, UserRoundIcon } from "lucide-react";

import { T } from "@/components/i18n/t";
import { Link } from "@/components/ui/link";
import { isCustomerLoggedIn } from "@/lib/auth/server";

export async function NavAccount() {
  const loggedIn = await isCustomerLoggedIn();
  if (!loggedIn) {
    return (
      // oxlint-disable-next-line next/no-html-link-for-pages -- Sign-in must be a full document navigation that is never prefetched, because the proxy starts OAuth.
      <a
        href="/account/login"
        className="flex size-11 items-center justify-center text-foreground hover:text-foreground/80 transition-colors"
      >
        <UserRoundIcon className="size-5" />
        <span className="sr-only">
          <T k="Sign in" />
        </span>
      </a>
    );
  }
  return (
    <Link
      href="/account"
      className="flex size-11 items-center justify-center text-foreground hover:text-foreground/80 transition-colors"
    >
      <UserRoundCheckIcon className="size-5" />
      <span className="sr-only">
        <T k="Account" />
      </span>
    </Link>
  );
}

export function NavAccountFallback() {
  return (
    <span className="flex items-center justify-center text-foreground">
      <UserRoundIcon className="size-5" />
    </span>
  );
}
