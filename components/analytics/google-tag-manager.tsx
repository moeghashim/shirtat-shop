"use client";

import { useEffect } from "react";

export const GTM_ID = "GTM-TDX7NTW3";
const AHREFS_KEY = "VYwSB5EaIOlVzu23N5ZNWg";
const EVENTS = ["keydown", "pointerdown", "scroll", "touchstart"] as const;

// Standard GTM loader, plus Ahrefs Web Analytics, deferred to the first user interaction
// so it never competes with LCP. GA4 still loads via components/analytics/google-tag.tsx.
declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

export function GoogleTagManager() {
  useEffect(() => {
    let done = false;
    const load = () => {
      if (done) return;
      done = true;
      for (const name of EVENTS) window.removeEventListener(name, load);
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
      const script = document.createElement("script");
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`;
      document.head.appendChild(script);
      const ahrefs = document.createElement("script");
      ahrefs.async = true;
      ahrefs.src = "https://analytics.ahrefs.com/analytics.js";
      ahrefs.dataset.key = AHREFS_KEY;
      document.head.appendChild(ahrefs);
    };
    for (const name of EVENTS) window.addEventListener(name, load, { once: true, passive: true });
    return () => {
      done = true;
      for (const name of EVENTS) window.removeEventListener(name, load);
    };
  }, []);
  return null;
}

export function GoogleTagManagerNoScript() {
  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
        title="Google Tag Manager"
      />
    </noscript>
  );
}
