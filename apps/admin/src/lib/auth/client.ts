import { createAuthClient } from "better-auth/react";

import { authDestination } from "./redirect";

export const authClient = createAuthClient();
export function authError(error?: { code?: string; status?: number } | null) {
  if (error?.status === 429) return "Too many attempts. Wait a moment, then try again.";
  if (error?.code === "INVALID_EMAIL_OR_PASSWORD") return "Email or password is incorrect. Please try again.";
  if (error?.code === "USER_ALREADY_EXISTS" || error?.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL")
    return "Unable to register with this email. Try signing in.";
  if (error?.code === "INVALID_NAME") return "Enter a name of 1–100 characters.";
  if (error?.code === "INVALID_PASSWORD") return "The current password is incorrect.";
  if (error?.code === "SESSION_NOT_FRESH") return "Please sign in again before making this change.";
  return "Unable to complete this request. Check your details and connection, then try again.";
}
export function finishSignIn(destination: unknown) {
  // A fresh document discards all router/user caches and revalidates server state.
  window.location.replace(authDestination(destination));
}
export async function signOut() {
  const result = await authClient.signOut();
  if (result.error) throw new Error(authError(result.error));
  window.location.replace("/auth/v2/login");
}
