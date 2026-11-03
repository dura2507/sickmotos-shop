import Link from "next/link";
import { loadShopifyHistory, SHOPIFY_LAST_FULL_DAY } from "@/lib/shopifyHistory";
import { importHistory } from "./actions";

export const dynamic = "force-dynamic";

// Einmaliger Import der Shopify-Besucherzahlen aus der Zeit vor dem Umzug.
// Quelle: Shopify Analytics, ShopifyQL
//   FROM sessions SHOW online_store_visitors, sessions,
//   sessions_with_cart_additions, sessions_that_reached_checkout
//   WHERE human_or_bot_session = 'human' TIMESERIES day
export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ r?: string }>;
}) {
  const { r } = await searchParams;
  const history = await loadShopifyHistory();
  const dates = history ? Array.from(history.keys()).sort() : [];
  const ok = r?.startsWith("ok:");
  const message = r ? r.slice(r.indexOf(":") + 1) : null;

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 md:px-8">
      <Link href="/admin/dashboard" className="text-xs text-fg-muted hover:text-fg">
        ← zurück zu Analytics
      </Link>
      <h1 className="mt-3 font-display text-4xl uppercase tracking-tight text-fg">
        Shopify-Verlauf
      </h1>
      <p className="mt-2 text-sm text-fg-muted">
        Besucher, Warenkörbe und Kassen-Aufrufe pro Tag aus Shopify Analytics, für die Zeit bis
        zum Umzug der Storefront (letzter voller Tag {SHOPIFY_LAST_FULL_DAY}). Danach zählt
        Shopify nur noch die Kasse.
      </p>

      <div className="mt-5 rounded-xl border border-border bg-surface/40 p-4 text-sm">
        {history === undefined ? (
          <span className="text-accent">Datenbank antwortet gerade nicht.</span>
        ) : dates.length === 0 ? (
          <span className="text-fg-muted">Noch nichts importiert.</span>
        ) : (
          <span className="text-fg">
            {dates.length} Tage gespeichert, {dates[0]} bis {dates[dates.length - 1]}.
          </span>
        )}
      </div>

      {message && (
        <p className={`mt-4 text-sm ${ok ? "text-emerald-400" : "text-accent"}`}>{message}</p>
      )}

      <form action={importHistory} className="mt-6 space-y-3">
        <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-fg-dim">
          CSV: date,visitors,sessions,cart_sessions,checkout_sessions
        </label>
        <textarea
          name="csv"
          required
          rows={10}
          className="w-full rounded-lg border border-border bg-bg p-3 font-mono text-xs text-fg"
          placeholder={"date,visitors,sessions,cart_sessions,checkout_sessions\n2026-07-08,954,1082,34,20"}
        />
        <p className="text-[11px] text-fg-dim">
          Ersetzt den gespeicherten Verlauf komplett. Tage nach {SHOPIFY_LAST_FULL_DAY} werden
          ignoriert.
        </p>
        <button
          type="submit"
          className="h-10 rounded-full bg-accent px-6 text-xs font-bold uppercase tracking-widest text-white hover:bg-accent-hi"
        >
          Importieren
        </button>
      </form>
    </div>
  );
}
