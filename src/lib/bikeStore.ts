// Tiny client-side store for the user's currently picked bike. Shared by
// the BikeFinder (writes) and the header search (reads). localStorage
// keeps it across sessions; a custom event keeps tabs and components in
// sync within the same tab (the native storage event only fires for
// OTHER tabs).

export type SavedBike = {
  brand: string | null;
  model: string | null;
  year: number | null;
};

const KEY = "sickmotos:bike-finder";
const EVT = "sickmotos:bike-changed";

export function readBike(): SavedBike {
  if (typeof window === "undefined") return { brand: null, model: null, year: null };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { brand: null, model: null, year: null };
    const data = JSON.parse(raw) as Partial<SavedBike>;
    return {
      brand: data.brand ?? null,
      model: data.model ?? null,
      year: typeof data.year === "number" ? data.year : null,
    };
  } catch {
    return { brand: null, model: null, year: null };
  }
}

export function writeBike(bike: SavedBike): void {
  if (typeof window === "undefined") return;
  const empty = !bike.brand && !bike.model && !bike.year;
  if (empty) window.localStorage.removeItem(KEY);
  else window.localStorage.setItem(KEY, JSON.stringify(bike));
  window.dispatchEvent(new CustomEvent(EVT, { detail: bike }));
}

export function subscribeBike(cb: (b: SavedBike) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onCustom = () => cb(readBike());
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) cb(readBike());
  };
  window.addEventListener(EVT, onCustom);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVT, onCustom);
    window.removeEventListener("storage", onStorage);
  };
}
