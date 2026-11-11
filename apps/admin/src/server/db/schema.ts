import { sql } from "drizzle-orm";
import { check, foreignKey, integer, numeric, pgTable, primaryKey, text, unique } from "drizzle-orm/pg-core";

export const directoryUsers = pgTable("directory_users", {
  email: text().primaryKey(),
  position: integer().notNull(),
  name: text().notNull(),
  role: text().notNull(),
  status: text({ enum: ["Active", "Pending invite", "Deactivated", "Locked", "Suspended"] }).notNull(),
  team: text({
    enum: ["Platform", "Growth", "Revenue", "Customer Ops", "Internal Tools", "Compliance", "People Ops", "Finance"],
  }).notNull(),
  joinedDate: text().notNull(),
  lastActive: integer().notNull(),
});
export const workspaces = pgTable("workspaces", { name: text().primaryKey() });
export const workspaceMemberships = pgTable(
  "workspace_memberships",
  {
    userEmail: text()
      .notNull()
      .references(() => directoryUsers.email),
    workspaceName: text()
      .notNull()
      .references(() => workspaces.name),
    position: integer().notNull(),
  },
  (t) => [primaryKey({ columns: [t.userEmail, t.workspaceName] }), unique().on(t.userEmail, t.position)],
);
// These display roles intentionally do not claim an auth relationship to directory role labels.
export const displayRoles = pgTable("display_roles", {
  role: text().primaryKey(),
  position: integer().notNull(),
  group: text().notNull(),
  accessLevel: text().notNull(),
  users: integer().notNull(),
  lastReview: text().notNull(),
  owner: text().notNull(),
  status: text({ enum: ["Active", "Needs review"] }).notNull(),
});
export const rolePermissions = pgTable(
  "role_permissions",
  {
    role: text()
      .notNull()
      .references(() => displayRoles.role),
    permission: text().notNull(),
    position: integer().notNull(),
  },
  (t) => [primaryKey({ columns: [t.role, t.permission] }), unique().on(t.role, t.position)],
);

// Numeric stays a decimal string until a domain explicitly projects its typed DTO.
// Entity rows never use this metric contract as an untyped payload store.
export const metricPoints = pgTable(
  "metric_points",
  {
    domain: text().notNull(),
    series: text().notNull(),
    pointKey: text().notNull(),
    position: integer().notNull(),
    value: numeric().notNull(),
    unit: text({ enum: ["count", "percent", "currency", "duration", "ratio"] }).notNull(),
    currency: text(),
  },
  (t) => [
    primaryKey({ columns: [t.domain, t.series, t.pointKey] }),
    unique().on(t.domain, t.series, t.position),
    check("metric_currency_unit", sql`(${t.unit} = 'currency') = (${t.currency} IS NOT NULL)`),
  ],
);
export const metricDimensions = pgTable(
  "metric_dimensions",
  {
    domain: text().notNull(),
    series: text().notNull(),
    pointKey: text().notNull(),
    name: text().notNull(),
    value: text().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.domain, t.series, t.pointKey, t.name] }),
    foreignKey({
      columns: [t.domain, t.series, t.pointKey],
      foreignColumns: [metricPoints.domain, metricPoints.series, metricPoints.pointKey],
    }),
  ],
);

export * from "./auth-schema.ts";
export * from "./commerce-schema.ts";
export * from "./communications-schema.ts";
export * from "./core-entity-schema.ts";
export * from "./ecommerce-schema.ts";
export * from "./operational-schema.ts";
export * from "./people-schema.ts";
export * from "./project-schema.ts";
export * from "./workspace-schema.ts";
