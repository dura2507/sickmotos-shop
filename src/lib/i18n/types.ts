import type deDict from "./dictionaries/de.json";

// The German dictionary is the source-of-truth shape. Kept in its own module
// (no "server-only") so both server and client code can import the type.
export type Dictionary = typeof deDict;
