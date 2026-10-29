import { getCartId } from "@shopify/hydrogen";
import { checkBotId } from "botid/server";
import { disableRoute } from "eve/channels";
import { type AuthFn, ForbiddenError, localDev, none, vercelOidc } from "eve/channels/auth";
import { eveChannel } from "eve/channels/eve";

import { shopConfig } from "../../lib/config";

const anonymous = none<Request>();

// Eve's router decodes the path and ignores a trailing slash, so match the normalized path.
function isAgentInfoRequest(request: Request) {
  try {
    const path = decodeURIComponent(new URL(request.url).pathname).replace(/\/+/g, "/");
    return path.replace(/\/$/, "").endsWith("/eve/v1/info");
  } catch {
    return true;
  }
}

const browserAuth: AuthFn<Request> = async (request) => {
  // Agent info exposes compiled instructions and tool config, so only operators may read it.
  if (isAgentInfoRequest(request)) return null;
  // Preview-only escape hatch so automated checks can reach the chat; never honoured in production.
  const skipBotId =
    process.env.VERCEL_ENV === "preview" && process.env.SUPPORT_CHAT_SKIP_BOTID === "1";
  if (
    shopConfig.botid.isEnabled &&
    !skipBotId &&
    (
      await checkBotId({
        advancedOptions: {
          checkLevel: shopConfig.botid.checkLevel,
          headers: Object.fromEntries(request.headers.entries()),
        },
      })
    ).isBot
  )
    throw new ForbiddenError();
  return anonymous(request);
};

export default shopConfig.agent.isEnabled
  ? eveChannel({
      auth: [vercelOidc(), localDev(), browserAuth],
      onMessage({ eve }) {
        const caller = eve.caller;
        if (!caller) return { auth: null };
        const cartId = getCartId({ cookie: eve.request.headers.get("cookie") ?? undefined });
        return {
          auth: { ...caller, attributes: { ...caller.attributes, ...(cartId ? { cartId } : {}) } },
        };
      },
      turnPolicy: "queue",
      uploadPolicy: "disabled",
    })
  : disableRoute();
