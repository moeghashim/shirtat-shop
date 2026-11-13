import { connection } from "next/server";

import { isDesignerOp, readDesignersView, runDesignerOp } from "@/lib/admin-api/designers";
import { authorizeAdminRequest, formOf, json, notFound } from "@/lib/admin-api/request";

/** Owner-only Designers data for admin.shirtat.co. Read-only. */
export async function GET(request: Request): Promise<Response> {
  await connection();
  if (!(await authorizeAdminRequest(request))) return notFound();
  return json(await readDesignersView());
}

/** Owner-only Designers changes: ?op=update|delete|resend|design|apply|create with a form body. */
export async function POST(request: Request): Promise<Response> {
  await connection();
  const authorized = await authorizeAdminRequest(request);
  if (!authorized) return notFound();
  const op = authorized.url.searchParams.get("op");
  const form = await formOf(request, authorized.body);
  if (!isDesignerOp(op) || !form) return json({ code: "invalid", ok: false }, 400);
  console.info(`[admin-api] designers ${op} by ${authorized.actor}`);
  try {
    return json(await runDesignerOp(op, form));
  } catch (error) {
    const detail = error instanceof Error ? error.message.slice(0, 300) : undefined;
    return json({ code: "failed", detail, ok: false }, 500);
  }
}
