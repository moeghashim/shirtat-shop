"use client";

import { useEffect } from "react";

export const GTM_ID = "GTM-TDX7NTW3";
const EVENTS = ["keydown", "pointerdown", "scroll", "touchstart"] as const;

// Standard GTM loader, deferred to the first interaction or a few seconds after load
// so it never competes with LCP. Shares window.dataLayer with GoogleTag.
export function GoogleTagManager() {
  useEffect(() => {
    let done = false;
    let timer = 0;
    const load = () => {
      if (done) return;
      done = true;
      window.clearTimeout(timer);
      for (const name of EVENTS) window.removeEventListener(name, load);
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
      const script = document.createElement("script");
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`;
      document.head.appendChild(script);
    };
    for (const name of EVENTS) window.addEventListener(name, load, { once: true, passive: true });
    const arm = () => {
      timer = window.setTimeout(load, 4000);
    };
    if (document.readyState === "complete") arm();
    else window.addEventListener("load", arm, { once: true });
    return () => {
      done = true;
      window.clearTimeout(timer);
      window.removeEventListener("load", arm);
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
