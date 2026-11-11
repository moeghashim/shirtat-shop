export const OWNER_EMAIL = "moe@10claws.com";

export function isOwner(user: { email: string; role?: string } | null | undefined): boolean {
  if (!user) return false;
  return user.role === "owner" || user.email.toLowerCase() === OWNER_EMAIL;
}
