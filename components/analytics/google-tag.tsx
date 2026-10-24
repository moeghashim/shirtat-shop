"use client";

import { useEffect } from "react";

const GA_ID = "G-6DT5S4QRGT";
const EVENTS = ["keydown", "pointerdown", "scroll", "touchstart"] as const;

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

// Loads gtag after the first interaction, or once the page has been idle for a few seconds.
export function GoogleTag() {
  useEffect(() => {
    let done = false;
    let timer = 0;
    const load = () => {
      if (done) return;
      done = true;
      window.clearTimeout(timer);
      for (const name of EVENTS) window.removeEventListener(name, load);
      window.dataLayer = window.dataLayer || [];
      // gtag.js only processes `arguments` objects, not arrays.
      function gtag(..._args: unknown[]) {
        // biome-ignore lint: arguments object required
        window.dataLayer?.push(arguments);
      }
      gtag("js", new Date());
      gtag("config", GA_ID);
      const script = document.createElement("script");
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
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
