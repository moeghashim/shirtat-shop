import { CartNotifications } from "./notifications";
import { CartOverlay } from "./overlay";
import { getT } from "@/lib/i18n/server";

export async function CartUI() {
  const t = await getT();
  return (
    <>
      <CartNotifications />
      <CartOverlay description="Review your cart items and proceed to checkout" title={t("Cart")} />
    </>
  );
}
