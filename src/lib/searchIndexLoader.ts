// Laedt den Header-Suchindex erst bei Bedarf von /api/search-index und haelt
// ihn in einer Modulvariable, damit er pro Browser-Session genau einmal geholt
// wird. Ein laufender Fetch wird geteilt: Hover, Fokus und Tastendruck koennen
// kurz hintereinander feuern, ohne dass der Index zweimal geladen wird.
// Schlaegt der Fetch fehl, wird das Promise verworfen, der naechste Trigger
// versucht es erneut.

import type { SearchEntry } from "@/lib/products";

export const SEARCH_INDEX_URL = "/api/search-index";

let cached: SearchEntry[] | null = null;
let inflight: Promise<SearchEntry[]> | null = null;

export function getCachedSearchIndex(): SearchEntry[] | null {
  return cached;
}

export function loadSearchIndex(): Promise<SearchEntry[]> {
  if (cached) return Promise.resolve(cached);
  if (inflight) return inflight;
  inflight = fetch(SEARCH_INDEX_URL, { headers: { accept: "application/json" } })
    .then((res) => {
      if (!res.ok) throw new Error(`search index ${res.status}`);
      return res.json() as Promise<unknown>;
    })
    .then((data) => {
      if (!Array.isArray(data)) throw new Error("search index: unexpected payload");
      cached = data as SearchEntry[];
      return cached;
    })
    .catch((err: unknown) => {
      inflight = null;
      throw err;
    });
  return inflight;
}
