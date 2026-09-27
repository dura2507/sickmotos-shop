// Suchindex fuer die Header-Typeahead. Bis 2026-09 wurde der Index als Prop in
// die Client-Komponente gereicht und damit auf JEDER Seite (~180 KB Produkt-JSON)
// in den HTML/RSC-Payload serialisiert, auch auf Mobile, wo die Header-Suche gar
// nicht sichtbar ist. Jetzt liegt er hinter diesem Endpunkt und wird erst
// geladen, wenn jemand die Suche wirklich anfasst (Hover, Fokus, Tastendruck).
//
// Die Daten kommen aus products.json, die bei jedem Deploy per prebuild frisch
// gezogen wird. Der Endpunkt ist deshalb statisch (force-static): er wird beim
// Build gerendert, Vercel liefert ihn aus dem Edge-Cache, ein neues Deployment
// invalidiert ihn. revalidate = 1 Tag als Sicherheitsnetz. robots.txt sperrt
// /api/ ohnehin, der Index gehoert nicht in den Google-Index.

import { getSearchIndex } from "@/lib/products";

export const dynamic = "force-static";
export const revalidate = 86400;

export async function GET() {
  return Response.json(getSearchIndex(), {
    headers: {
      "cache-control":
        "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
