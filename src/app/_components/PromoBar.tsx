export function PromoBar() {
  return (
    <div className="relative z-50 bg-accent text-fg">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 py-2 text-center text-[11px] font-semibold uppercase tracking-wider md:gap-3 md:px-6 md:text-xs">
        <span>5% off first order</span>
        <span className="h-3 w-px bg-fg/40" />
        <span>
          Code{" "}
          <span className="rounded bg-fg/15 px-1.5 py-0.5 font-mono tracking-normal">
            EXTRA5
          </span>
        </span>
      </div>
    </div>
  );
}
