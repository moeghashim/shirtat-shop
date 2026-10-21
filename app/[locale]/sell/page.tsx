import { redirect } from "next/navigation";

import { localizePath } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";

/** /sell is an alias for the Sell on Shirtat page at /creators. */
export default async function SellPage() {
  redirect(localizePath(await getLocale(), "/creators"));
}
