import { reviewAccess, type ReviewSession } from "../chat-review";

export function seoDashboardAccess(session: ReviewSession | null): session is ReviewSession {
  return reviewAccess(session);
}

/** Logged-out and non-owner requests get the same 404 the chat export uses. */
export function seoDashboardHttpStatus(session: ReviewSession | null): 200 | 404 {
  return seoDashboardAccess(session) ? 200 : 404;
}
