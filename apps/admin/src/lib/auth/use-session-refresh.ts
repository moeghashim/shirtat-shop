import { useEffect } from "react";

import { authDestination } from "./redirect";
import { getAuthState } from "./server-functions";

// Navigation always checks on the server. Refocus also drops a document whose
// authority changed in another tab, without polling or storing a session token.
export function useSessionRefresh(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    let pending = false;
    let disposed = false;
    const refresh = async () => {
      if (pending || document.visibilityState === "hidden") return;
      pending = true;
      try {
        const state = await getAuthState();
        if (!disposed && state.mode === "auth" && !state.user) {
          const destination = authDestination(window.location.pathname + window.location.search + window.location.hash);
          window.location.replace(`/auth/v2/login?redirect=${encodeURIComponent(destination)}`);
        }
      } catch {
        // A fresh server document reports an unavailable service; never downgrade
        // an authenticated document to demo mode after a failed session check.
        if (!disposed) window.location.reload();
      } finally {
        pending = false;
      }
    };
    window.addEventListener("focus", refresh);
    window.addEventListener("pageshow", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      disposed = true;
      window.removeEventListener("focus", refresh);
      window.removeEventListener("pageshow", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [enabled]);
}
