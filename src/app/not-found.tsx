import Link from "next/link";

export const metadata = {
  title: "404 — SickMotos",
};

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center gap-6 px-6 py-20 text-center">
      <span className="font-display text-7xl uppercase tracking-tight text-accent md:text-9xl">
        404
      </span>
      <h1 className="font-display text-2xl uppercase tracking-tight md:text-3xl">
        Off the track
      </h1>
      <p className="max-w-md text-sm text-fg-muted md:text-base">
        Diese Seite gibt es nicht (mehr). Vielleicht hast du dich vertippt,
        oder das Teil ist gerade ausgelistet.
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="rounded-full bg-accent px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-fg transition-colors hover:bg-accent-hi"
        >
          Home
        </Link>
        <Link
          href="/shop"
          className="rounded-full border border-border-strong px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-fg-muted transition-colors hover:border-accent hover:text-accent"
        >
          Shop the catalog
        </Link>
      </div>
    </div>
  );
}
