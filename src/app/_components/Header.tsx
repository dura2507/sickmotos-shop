import Image from "next/image";
import Link from "next/link";
import { MobileMenu } from "./MobileMenu";

const brands = [
  "All brands",
  "Beta",
  "Husqvarna",
  "KTM",
  "Aprilia",
  "Fantic",
  "Yamaha",
  "GasGas",
];

const nav = [
  { label: "LED Headlights", href: "#" },
  { label: "Exhaust", href: "#" },
  { label: "Carbon Parts", href: "#" },
  { label: "ECU Tuning", href: "#" },
  { label: "Merchandise", href: "#" },
  { label: "Titanium Screws", href: "#" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/95 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center gap-3 px-4 md:h-24 md:gap-4 md:px-6">
        <Link href="/" className="shrink-0">
          <Image
            src="/logo-alt-2.png"
            alt="SickMotos"
            width={974}
            height={626}
            priority
            className="h-14 w-auto sm:h-16 md:h-20"
          />
        </Link>

        <form
          role="search"
          className="hidden flex-1 items-center overflow-hidden rounded-full border border-border-strong bg-surface focus-within:border-accent md:flex"
        >
          <select
            aria-label="Select brand"
            defaultValue="All brands"
            className="cursor-pointer appearance-none border-r border-border bg-transparent py-2.5 pl-4 pr-8 text-sm text-fg-muted focus:outline-none"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23a1a1aa' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 0.5rem center",
              backgroundSize: "1rem",
            }}
          >
            {brands.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
          <input
            type="search"
            placeholder="Search exhausts, LEDs, carbon, parts..."
            className="flex-1 bg-transparent px-4 py-2.5 text-sm text-fg placeholder:text-fg-dim focus:outline-none"
          />
          <button
            type="submit"
            aria-label="Search"
            className="grid size-10 place-items-center text-fg-muted hover:text-accent"
          >
            <svg
              viewBox="0 0 24 24"
              className="size-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
            </svg>
          </button>
        </form>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            aria-label="Account"
            className="hidden size-9 place-items-center rounded-full border border-border-strong text-fg-muted hover:border-accent hover:text-fg md:grid"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c2-4 6-6 8-6s6 2 8 6" strokeLinecap="round" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Cart"
            className="relative grid size-9 place-items-center rounded-full border border-border-strong text-fg-muted hover:border-accent hover:text-fg"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <path d="M3 5h2l2.5 11h11l2-8H6.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="9" cy="20" r="1.4" />
              <circle cx="17" cy="20" r="1.4" />
            </svg>
            <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-accent text-[10px] font-bold text-fg">
              0
            </span>
          </button>
          <MobileMenu />
        </div>
      </div>

      <nav className="hidden border-t border-border md:block">
        <ul className="mx-auto flex max-w-7xl items-center gap-6 px-6 py-2.5">
          {nav.map((item) => (
            <li key={item.label}>
              <Link
                href={item.href}
                className="text-xs font-medium uppercase tracking-[0.12em] text-fg-muted transition-colors hover:text-accent"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
