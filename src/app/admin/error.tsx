"use client";

import { useEffect } from "react";
import Link from "next/link";

// Letztes Netz fuer das Admin-Panel. Faengt jeden Fehler im /admin-Baum ab,
// damit Thomas nie wieder eine nackte Serverfehler-Seite sieht. Das Layout
// bleibt gemountet, die Navigation funktioniert also weiter. In Produktion
// entfernt Next die Fehlermeldung und liefert nur error.digest, deshalb bleibt
// das console.error stehen: diese Zeile landet im Vercel-Runtime-Log.

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin] render failed:", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl px-5 py-16 md:px-8">
      <h1 className="font-display text-4xl uppercase tracking-tight text-fg md:text-5xl">
        Etwas ist schiefgelaufen
      </h1>
      <p className="mt-3 text-sm text-fg-muted">
        Diese Seite konnte nicht geladen werden. Die anderen Bereiche im Admin
        funktionieren normal weiter, über die Navigation oben kommst du überall
        hin. Bestellungen und Umsatz liegen bei Shopify und sind davon nicht
        betroffen.
      </p>
      {error.digest && (
        <p className="mt-4 font-mono text-[11px] text-fg-dim">
          Fehler-ID {error.digest}
        </p>
      )}
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          onClick={reset}
          className="rounded-full bg-accent px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-accent-hi"
        >
          Nochmal versuchen
        </button>
        <Link
          href="/admin"
          className="rounded-full border border-border-strong px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-fg-muted transition-colors hover:border-accent hover:text-accent"
        >
          Zum Dashboard
        </Link>
      </div>
    </div>
  );
}
