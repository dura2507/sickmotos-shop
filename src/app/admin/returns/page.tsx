import { listReturnRequests } from "@/lib/returnsStore";
import { StoreNotice } from "../StoreNotice";
import { toggleReturnStatus } from "./actions";

export const dynamic = "force-dynamic";

function fmtDate(ts: number): string {
  return new Date(ts).toLocaleString("de-DE", {
    timeZone: "Europe/Berlin",
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminReturns({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  const requests = await listReturnRequests(200);
  // undefined heisst der Speicher hat nicht geantwortet. Eine leere Liste
  // wuerde behaupten es gebe keine Anfragen.
  const storeOk = requests !== undefined;
  const all = requests ?? [];
  const open = all.filter((r) => r.status === "open");
  const list = filter === "done" ? all.filter((r) => r.status === "done") : open;

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 md:px-8">
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-4">
        <h1 className="font-display text-4xl uppercase tracking-tight text-fg md:text-5xl">
          Rückgaben
        </h1>
        <div className="flex gap-4 text-xs font-bold uppercase tracking-[0.15em]">
          <a
            href="/admin/returns"
            className={filter !== "done" ? "text-accent" : "text-fg-muted hover:text-fg"}
          >
            Offen ({open.length})
          </a>
          <a
            href="/admin/returns?filter=done"
            className={filter === "done" ? "text-accent" : "text-fg-muted hover:text-fg"}
          >
            Erledigt ({all.length - open.length})
          </a>
        </div>
      </div>

      {!storeOk && <StoreNotice what="Rückgabe-Anfragen" />}

      {storeOk && list.length === 0 && (
        <p className="rounded-xl border border-border-strong bg-surface/60 px-4 py-6 text-sm text-fg-muted">
          {filter === "done"
            ? "Noch keine erledigten Anfragen."
            : "Keine offenen Rückgabe-Anfragen."}
        </p>
      )}

      <div className="flex flex-col gap-4">
        {list.map((r) => (
          <div
            key={r.id}
            className="rounded-2xl border border-border-strong bg-surface/60 p-5"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="font-display text-xl uppercase tracking-tight text-fg">
                  Bestellung {r.orderNumber}
                </span>
                <span className="text-xs text-fg-dim">{fmtDate(r.ts)}</span>
                {r.locale && (
                  <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase text-fg-dim">
                    {r.locale}
                  </span>
                )}
              </div>
              <form action={toggleReturnStatus}>
                <input type="hidden" name="id" value={r.id} />
                <input
                  type="hidden"
                  name="to"
                  value={r.status === "open" ? "done" : "open"}
                />
                <button
                  type="submit"
                  className="rounded-full border border-border-strong px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-fg-muted transition-colors hover:border-accent hover:text-fg"
                >
                  {r.status === "open" ? "Als erledigt markieren" : "Wieder öffnen"}
                </button>
              </form>
            </div>
            <div className="mt-3 grid gap-1 text-sm text-fg-muted md:grid-cols-2">
              <span>{r.name}</span>
              <a href={`mailto:${r.email}`} className="text-accent hover:underline">
                {r.email}
              </a>
              <span>
                {r.street}, {r.zip} {r.city}, {r.country}
              </span>
            </div>
            <p className="mt-3 whitespace-pre-wrap rounded-xl bg-bg/60 px-4 py-3 text-sm leading-relaxed text-fg">
              {r.reason}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
