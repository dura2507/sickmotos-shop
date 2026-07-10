import type { ReactNode } from "react";
import {
  isPersistent,
  loadAnalytics,
  type TopRow,
} from "@/lib/analyticsStore";
import { Flag, type FlagCode } from "@/app/_components/Flag";

const SUPPORTED_FLAGS: ReadonlySet<FlagCode> = new Set([
  "DE", "AT", "CH", "RO", "LU", "GB", "IT", "ES",
  "FR", "PL", "NL", "BE", "HR", "SI", "CZ", "SK",
  "HU", "PT", "DK", "SE", "NO", "FI", "US",
]);

function renderCountry(code: string): ReactNode {
  const upper = code.toUpperCase();
  if (upper === "??") return "Unbekannt";
  const known = SUPPORTED_FLAGS.has(upper as FlagCode);
  return (
    <span className="inline-flex items-center gap-2">
      {known && <Flag code={upper as FlagCode} className="h-3 w-[18px]" />}
      <span>{upper}</span>
    </span>
  );
}

export const dynamic = "force-dynamic";

function formatAverage(n: number): string {
  if (n === 0) return "0";
  if (n < 10) return n.toFixed(1);
  return String(Math.round(n));
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface/40 p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-fg-dim">
        {label}
      </p>
      <p className="mt-1 font-display text-4xl leading-none text-fg tabular-nums">
        {value}
      </p>
      <p className="mt-1 text-xs text-fg-muted">{sub}</p>
    </div>
  );
}

function TopTable({
  title,
  rows,
  empty,
  formatKey,
  renderKey,
}: {
  title: string;
  rows: TopRow[];
  empty: string;
  formatKey?: (key: string) => string;
  renderKey?: (key: string) => ReactNode;
}) {
  const max = rows.reduce((m, r) => Math.max(m, r.views), 0);
  return (
    <section className="rounded-xl border border-border bg-surface/40 p-4">
      <h2 className="mb-3 text-[10px] font-bold uppercase tracking-[0.15em] text-fg-dim">
        {title}
      </h2>
      {rows.length === 0 ? (
        <p className="text-xs text-fg-muted">{empty}</p>
      ) : (
        <ul className="space-y-1">
          {rows.map((r) => (
            <li key={r.key} className="flex items-center gap-3 text-sm">
              <div className="relative min-w-0 flex-1">
                <div
                  className="absolute inset-y-0 left-0 bg-accent/15"
                  style={{
                    width: `${max > 0 ? (r.views / max) * 100 : 0}%`,
                  }}
                  aria-hidden
                />
                <span className="relative block truncate px-2 py-1 text-fg">
                  {renderKey ? renderKey(r.key) : formatKey ? formatKey(r.key) : r.key}
                </span>
              </div>
              <span className="shrink-0 text-sm font-bold tabular-nums text-fg">
                {r.views}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default async function AdminVisitors() {
  const data = await loadAnalytics();
  const persistent = isPersistent();
  const maxDay = data.perDay.reduce((m, d) => Math.max(m, d.views), 0);

  return (
    <div className="mx-auto max-w-7xl px-5 py-8 md:px-8">
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-4">
        <h1 className="font-display text-4xl uppercase tracking-tight text-fg md:text-5xl">
          Besucher
        </h1>
        <p className="text-xs text-fg-muted">
          Self-hosted Zähler · anonym · keine Cookies
        </p>
      </div>

      {!persistent && (
        <div className="mb-6 rounded-xl border border-accent/50 bg-accent/[0.06] p-4">
          <p className="font-semibold text-accent">
            Kein persistenter Speicher aktiv
          </p>
          <p className="mt-1 text-sm text-fg-muted">
            Ohne Upstash Redis werden keine Besuche gezählt. Env-Variablen{" "}
            <code className="rounded bg-surface-2 px-1">KV_REST_API_URL</code> +{" "}
            <code className="rounded bg-surface-2 px-1">KV_REST_API_TOKEN</code>{" "}
            in Vercel setzen.
          </p>
        </div>
      )}

      <section className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Besucher 7 Tage"
          value={String(data.totalVisitors7d)}
          sub={`${data.totalViews7d} Seitenaufrufe`}
        />
        <StatCard
          label="Besucher 30 Tage"
          value={String(data.totalVisitors30d)}
          sub={`${data.totalViews30d} Seitenaufrufe`}
        />
        <StatCard
          label="Ø pro Tag (7 T)"
          value={formatAverage(data.totalVisitors7d / 7)}
          sub="Einzel-Besucher"
        />
        <StatCard
          label="Seiten pro Besuch"
          value={
            data.totalVisitors30d > 0
              ? (data.totalViews30d / data.totalVisitors30d).toFixed(1)
              : "0"
          }
          sub="letzte 30 Tage"
        />
      </section>

      <section className="mb-8 rounded-xl border border-border bg-surface/40 p-4">
        <h2 className="mb-4 text-[10px] font-bold uppercase tracking-[0.15em] text-fg-dim">
          Letzte 30 Tage
        </h2>
        {maxDay === 0 ? (
          <p className="text-xs text-fg-muted">
            Noch keine Besuche gezählt. Sobald jemand die Seite aufruft,
            erscheint hier ein Balken.
          </p>
        ) : (
          <>
            <div className="flex h-32 items-end gap-1">
              {data.perDay.map((d) => {
                const heightPct = maxDay > 0 ? (d.views / maxDay) * 100 : 0;
                return (
                  <div
                    key={d.date}
                    className="group relative flex h-full flex-1 flex-col items-center justify-end"
                    title={`${d.date}: ${d.views} Aufrufe · ${d.visitors} Besucher`}
                  >
                    <div
                      className="w-full bg-accent/70 transition-colors hover:bg-accent"
                      style={{
                        height: `${heightPct}%`,
                        minHeight: d.views > 0 ? "2px" : "0",
                      }}
                    />
                    <span className="invisible absolute bottom-full z-10 mb-1 whitespace-nowrap rounded border border-border bg-bg px-1.5 py-0.5 text-[10px] font-bold text-fg group-hover:visible">
                      {d.views} / {d.visitors}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-2 flex justify-between font-mono text-[10px] text-fg-dim">
              <span>{data.perDay[0]?.date.slice(5)}</span>
              <span>heute</span>
            </div>
          </>
        )}
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <TopTable
          title="Top Seiten (30 T)"
          rows={data.topPaths}
          empty="Noch keine Seitenaufrufe."
        />
        <TopTable
          title="Top Länder (30 T)"
          rows={data.topCountries}
          empty="Noch keine Länderdaten."
          renderKey={renderCountry}
        />
        <TopTable
          title="Top Referrer (30 T)"
          rows={data.topReferrers}
          empty="Noch keine Referrer-Daten."
        />
        <TopTable
          title="Top Sprachen (7 T)"
          rows={data.topLocales}
          empty="Noch keine Sprachdaten."
          formatKey={(k) => k.toUpperCase()}
        />
      </section>
    </div>
  );
}
