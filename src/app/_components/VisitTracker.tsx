"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Client tracker. Fires a single POST to /api/track on every route the
// customer visits. Skips /admin and /api paths so internal traffic doesn't
// pollute the visitor counter.

export function VisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    if (pathname.startsWith("/admin") || pathname.startsWith("/api")) return;

    const body = JSON.stringify({
      path: pathname,
      referrer: document.referrer || null,
      locale: navigator.language || null,
    });

    // sendBeacon fires-and-forgets and survives page navigation better than
    // fetch, which is what we want for a hit counter.
    try {
      if (navigator.sendBeacon) {
        const blob = new Blob([body], { type: "application/json" });
        navigator.sendBeacon("/api/track", blob);
        return;
      }
    } catch {
      // fall through to fetch
    }
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  return null;
}
