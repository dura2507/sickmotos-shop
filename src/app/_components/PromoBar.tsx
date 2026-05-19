export function PromoBar() {
  return (
    <div className="relative z-50 bg-accent text-fg">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-3 px-6 py-2 text-center text-xs font-semibold uppercase tracking-wider">
        <span>5% off your first order</span>
        <span className="hidden h-3 w-px bg-fg/40 sm:inline-block" />
        <span className="hidden sm:inline">
          Use code{" "}
          <span className="rounded bg-fg/15 px-1.5 py-0.5 font-mono tracking-normal">
            EXTRA5
          </span>
        </span>
      </div>
    </div>
  );
}
