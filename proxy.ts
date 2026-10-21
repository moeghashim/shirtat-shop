import { handleShopifyRoutes } from "@shopify/hydrogen";
import {
  createCustomerAccountServerHandlers,
  CUSTOMER_ACCOUNT_AUTHORIZE_PATH,
  CUSTOMER_ACCOUNT_LOGIN_PATH,
  CUSTOMER_ACCOUNT_LOGOUT_PATH,
  CUSTOMER_ACCOUNT_REFRESH_PATH,
} from "@shopify/hydrogen/customer-account";
import { NextResponse, type NextRequest } from "next/server";

import {
  createCustomerRequestContext,
  createCustomerSessionManager,
  forwardCustomerRefreshAttempt,
  getCustomerRequestOrigin,
  getHydrogenCustomerSession,
} from "@/lib/auth/server";
import { cartHandlers, createCustomerCartHandlers } from "@/lib/cart/server";
import { getRefinedCollectionPath, isRefinedCollectionPath } from "@/lib/collections";
import { shopConfig } from "@/lib/config";
import { isUnlocalizedPath, stripLocale } from "@/lib/i18n";
import { getMarkdownRewritePath } from "@/lib/markdown/representation";
import { predictiveSearchHandlers } from "@/lib/search/server";
import { SHOPIFY_ROUTE_TEMPLATES } from "@/lib/shopify/routing";
import { createRequestStorefrontClient } from "@/lib/shopify/storefront/server";

const AUTH_PATHS = new Set<string>([
  CUSTOMER_ACCOUNT_AUTHORIZE_PATH,
  CUSTOMER_ACCOUNT_LOGIN_PATH,
  CUSTOMER_ACCOUNT_LOGOUT_PATH,
  CUSTOMER_ACCOUNT_REFRESH_PATH,
]);

const NOOP_SESSION_MANAGER = {
  getSessionItem: () => undefined,
  getSessionOrigin: () => "",
  removeSessionItem: () => {},
  setSessionItem: () => {},
};

const NON_PAGE_PREFIXES = [
  "/api",
  "/md",
  "/agent",
  "/sitemap",
  "/eve",
  "/_eve_internal",
  "/_next",
  "/_vercel",
  "/.well-known",
  "/__shopify",
];

function isLocalizablePagePath(pathname: string): boolean {
  if (NON_PAGE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return false;
  return !/\.[a-zA-Z0-9]+$/.test(pathname);
}

export async function proxy(request: NextRequest): Promise<Response> {
  const pathname = request.nextUrl.pathname;
  const requestContext = createCustomerRequestContext(request);
  const isAuthPath = shopConfig.auth.isEnabled && AUTH_PATHS.has(pathname);
  const customerSession =
    isAuthPath || (shopConfig.auth.isEnabled && pathname === "/api/cart")
      ? await getHydrogenCustomerSession()
      : undefined;

  const shopifyRoute = handleShopifyRoutes({
    handlers: customerSession
      ? customerHandlers(customerSession, isAuthPath)
      : [cartHandlers, predictiveSearchHandlers],
    request,
    requestContext,
    routeTemplates: SHOPIFY_ROUTE_TEMPLATES,
    sessionManager: customerSession ? createCustomerSessionManager(request) : NOOP_SESSION_MANAGER,
    storefrontClient: createRequestStorefrontClient(requestContext),
  });
  if (shopifyRoute) return shopifyRoute;

  // Locale routing: English is unprefixed (internally /en), Arabic lives under /ar.
  const pageRoute = isLocalizablePagePath(pathname);
  const prefix = pageRoute && /^\/ar(?:\/|$)/.test(pathname) ? "ar" : "en";
  const basePath = stripLocale(pathname);
  if (pageRoute && (/^\/en(?:\/|$)/.test(pathname) || (prefix === "ar" && isUnlocalizedPath(basePath)))) {
    const target = new URL(`${basePath}${request.nextUrl.search}`, request.url);
    return NextResponse.redirect(target, 308);
  }
  if (isRefinedCollectionPath(basePath)) return new Response("Not Found", { status: 404 });

  const headers = requestContext.getForwardedRequestHeaders();
  const refinedPath = pageRoute
    ? getRefinedCollectionPath(basePath, request.nextUrl.search)
    : null;
  const localizedPath = pageRoute ? `/${prefix}${basePath === "/" ? "" : basePath}` : null;
  const rewritePath =
    getMarkdownRewritePath(request) ??
    (refinedPath ? `/${prefix}${refinedPath}` : localizedPath);
  const response = rewritePath
    ? NextResponse.rewrite(new URL(`${rewritePath}${request.nextUrl.search}`, request.url), {
        request: { headers },
      })
    : NextResponse.next({
        request: { headers: forwardCustomerRefreshAttempt(request.nextUrl, headers) },
      });
  requestContext.applyResponseHeaders(response.headers);
  return response;
}

function customerHandlers(
  customerSession: Awaited<ReturnType<typeof getHydrogenCustomerSession>>,
  isAuthPath: boolean,
) {
  const cart = createCustomerCartHandlers(customerSession);
  if (!isAuthPath) return [cart, predictiveSearchHandlers];

  const auth = createCustomerAccountServerHandlers({
    cartServerHandlers: cart,
    customerSession,
    defaultPostLoginRedirectPathname: "/account",
    loginFailedRedirectPath: "/account/sign-in-failed",
    origin: getCustomerRequestOrigin,
    postLogoutRedirectUri: "/",
  });
  return [auth, cart, predictiveSearchHandlers];
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|_next/data|_vercel|eve(?:/|$)|_eve_internal(?:/|$)|favicon.ico).*)",
  ],
};
