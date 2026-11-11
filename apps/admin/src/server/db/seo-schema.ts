import { sql } from "drizzle-orm";
import { boolean, check, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { authUser } from "./auth-schema.ts";

// task_id matches a plan task id. A row is the owner's saved check; absence means the plan status stands.
export const seoTaskCheck = pgTable(
  "seo_task_check",
  {
    taskId: text("task_id").primaryKey(),
    done: boolean("done").notNull(),
    doneAt: timestamp("done_at", { withTimezone: true }),
    doneBy: text("done_by").references(() => authUser.id, { onDelete: "set null" }),
  },
  (table) => [check("seo_task_check_done_stamp", sql`${table.done} = false OR ${table.doneAt} IS NOT NULL`)],
);
