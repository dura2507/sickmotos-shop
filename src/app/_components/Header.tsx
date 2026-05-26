import Image from "next/image";
import Link from "next/link";
import { getSearchIndex } from "@/lib/products";
import { CartButton } from "./CartButton";
import { MobileMenu } from "./MobileMenu";
import { HeaderSearch } from "./HeaderSearch";

const nav = [
  { label: "All Parts", href: "/shop" },
  { label: "Exhaust", href: "/shop?category=Exhaust" },
  { label: "LED Headlights", href: "/shop?category=LED+Headlights" },
  { label: "Carbon Parts", href: "/shop?category=Carbon+Parts" },
  { label: "Graphics", href: "/shop?category=Graphics" },
  { label: "Merchandise", href: "/shop?category=Merchandise" },
];

export function Header() {
  const searchIndex = getSearchIndex();
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

        <HeaderSearch index={searchIndex} />

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/account"
            aria-label="My account"
            className="hidden size-9 place-items-center rounded-full border border-border-strong text-fg-muted transition-colors hover:border-accent hover:text-fg md:grid"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c2-4 6-6 8-6s6 2 8 6" strokeLinecap="round" />
            </svg>
          </Link>
          <CartButton />
          <MobileMenu />
        </div>
      </div>

      <nav className="hidden md:block">
        <ul className="flex w-full items-center justify-center gap-7 px-6 pb-3">
          {nav.map((item) => (
            <li key={item.label}>
              <Link
                href={item.href}
                className="text-[10px] font-medium uppercase tracking-[0.18em] text-fg-muted transition-colors hover:text-accent"
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
