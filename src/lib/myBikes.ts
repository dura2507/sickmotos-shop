"use client";

// Simple garage: the rider adds their bike(s) once and every list on the site
// can then offer a one-tap "filter by my bikes" button.
//
// Stored in localStorage (no account required, no server roundtrip). Later this
// can be mirrored to a Shopify customer metafield for cross-device sync.

export type Bike = {
  id: string;
  brand: string;
  model: string;
  year: number;
};

const KEY = "sickmotos:bikes:v1";
const EVT = "sickmotos:bikes-changed";

export function readBikes(): Bike[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Bike[]) : [];
  } catch {
    return [];
  }
}

export function writeBikes(bikes: Bike[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(bikes));
    window.dispatchEvent(new CustomEvent(EVT));
  } catch {
    // ignore private-mode / disabled storage
  }
}

export function addBike(b: Omit<Bike, "id">): Bike[] {
  const list = readBikes();
  const bike: Bike = { ...b, id: cryptoRandomId() };
  const next = [...list, bike];
  writeBikes(next);
  return next;
}

export function removeBike(id: string): Bike[] {
  const next = readBikes().filter((b) => b.id !== id);
  writeBikes(next);
  return next;
}

export function subscribeBikes(fn: () => void): () => void {
  window.addEventListener(EVT, fn);
  window.addEventListener("storage", fn);
  return () => {
    window.removeEventListener(EVT, fn);
    window.removeEventListener("storage", fn);
  };
}

function cryptoRandomId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return String(Date.now()) + Math.random().toString(36).slice(2, 8);
  }
}
