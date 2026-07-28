// Wird gezeigt, wenn der Datenspeicher zwar eingerichtet ist, aber nicht
// antwortet (Kommando-Kontingent aufgebraucht, Ausfall). isPersistent() kann
// das nicht erkennen, es prueft nur ob die Env-Variablen gesetzt sind.
export function StoreNotice({ what, detail }: { what: string; detail?: string }) {
  return (
    <div className="mb-6 rounded-xl border border-accent/50 bg-accent/[0.06] p-4">
      <p className="font-semibold text-accent">{what} aktuell nicht abrufbar</p>
      <p className="mt-1 text-sm text-fg-muted">
        Der Datenspeicher antwortet gerade nicht, deshalb stehen hier keine
        Zahlen. Bestellungen und Umsatz kommen direkt von Shopify und sind davon
        nicht betroffen. Sobald der Speicher wieder antwortet, sind die
        gespeicherten Daten wieder da.
      </p>
      {detail && (
        <p className="mt-1 font-mono text-[11px] text-fg-dim">{detail}</p>
      )}
    </div>
  );
}
