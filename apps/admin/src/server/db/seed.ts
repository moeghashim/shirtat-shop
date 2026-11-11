import { eq } from "drizzle-orm";

import { getDatabase } from "./client.server.ts";
import { roles } from "./fixtures/roles.ts";
import { users } from "./fixtures/users.ts";
import { directoryUsers, displayRoles, rolePermissions, workspaceMemberships, workspaces } from "./schema.ts";
import { seedCommerce } from "./seed-commerce.ts";
import { seedCommunications } from "./seed-communications.ts";
import { seedCore } from "./seed-core.ts";
import { seedEcommerce } from "./seed-ecommerce.ts";
import { seedOperational } from "./seed-operational.ts";
import { seedPeople } from "./seed-people.ts";
import { seedProjects } from "./seed-projects.ts";
import { seedWorkspace } from "./seed-workspace.ts";

export async function seed() {
  await getDatabase().transaction(async (tx) => {
    await seedPeople(tx);
    await seedWorkspace(tx);
    await seedProjects(tx);
    await seedCommunications(tx);
    await seedCore(tx);
    await seedOperational(tx);
    await seedCommerce(tx);
    await seedEcommerce(tx);
    for (const [position, { workspace, ...user }] of users.entries()) {
      await tx
        .insert(directoryUsers)
        .values({ ...user, position })
        .onConflictDoUpdate({ target: directoryUsers.email, set: { ...user, position } });
      await tx.delete(workspaceMemberships).where(eq(workspaceMemberships.userEmail, user.email));
      for (const [order, name] of workspace.entries()) {
        await tx.insert(workspaces).values({ name }).onConflictDoNothing();
        await tx.insert(workspaceMemberships).values({ userEmail: user.email, workspaceName: name, position: order });
      }
    }
    for (const [position, { permissionSets, ...role }] of roles.entries()) {
      await tx
        .insert(displayRoles)
        .values({ ...role, position })
        .onConflictDoUpdate({ target: displayRoles.role, set: { ...role, position } });
      await tx.delete(rolePermissions).where(eq(rolePermissions.role, role.role));
      for (const [order, permission] of permissionSets.entries()) {
        await tx.insert(rolePermissions).values({ role: role.role, permission, position: order });
      }
    }
  });
}
