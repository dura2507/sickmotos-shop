"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const nav = [
  { label: "All Parts", href: "/shop" },
  { label: "Exhaust", href: "/shop?category=Exhaust" },
  { label: "LED Headlights", href: "/shop?category=LED+Headlights" },
  { label: "Carbon Parts", href: "/shop?category=Carbon+Parts" },
  { label: "Graphics", href: "/shop?category=Graphics" },
  { label: "Merchandise", href: "/shop?category=Merchandise" },
];

const brands = ["Beta", "Husqvarna", "KTM", "Aprilia", "Fantic", "Yamaha"];

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="grid size-9 place-items-center rounded-full border border-border-strong text-fg-muted hover:border-accent hover:text-fg md:hidden"
      >
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2}>
          {open ? (
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          ) : (
            <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
          )}
        </svg>
      </button>

      {mounted && open &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex flex-col md:hidden"
            style={{ backgroundColor: "#0a0a0a" }}
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-4">
              <span className="font-display text-2xl uppercase tracking-tight">
                Menu
              </span>
              <button
                type="button"
                aria-label="Close menu"
                onClick={close}
                className="grid size-9 place-items-center rounded-full border border-border-strong text-fg-muted hover:border-accent hover:text-fg"
              >
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="no-scrollbar flex flex-1 flex-col gap-6 overflow-y-auto p-4">
              <form
                role="search"
                action="/shop"
                method="get"
                onSubmit={close}
                className="flex items-center gap-2 border-b border-fg/30 pb-2 focus-within:border-accent"
              >
                <svg viewBox="0 0 24 24" className="size-5 text-fg-muted" fill="none" stroke="currentColor" strokeWidth={2}>
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
                </svg>
                <input
                  type="search"
                  name="q"
                  placeholder="Search your bike or part..."
                  className="flex-1 bg-transparent py-2 text-base text-fg placeholder:text-fg-dim focus:outline-none"
                />
              </form>

              <nav>
                <ul className="flex flex-col">
                  {nav.map((item) => (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        onClick={close}
                        className="flex items-center justify-between border-b border-border py-4 font-display text-xl uppercase tracking-tight text-fg"
                      >
                        {item.label}
                        <svg viewBox="0 0 24 24" className="size-4 text-fg-muted" fill="none" stroke="currentColor" strokeWidth={1.8}>
                          <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>

              <div className="flex flex-col gap-3">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-fg-dim">
                  Shop by bike
                </span>
                <div className="flex flex-wrap gap-2">
                  {brands.map((b) => (
                    <Link
                      key={b}
                      href={`/shop?brand=${encodeURIComponent(b)}`}
                      onClick={close}
                      className="rounded-full border border-border-strong px-3 py-1.5 text-sm font-medium uppercase tracking-wider text-fg-muted hover:border-accent hover:text-accent"
                    >
                      {b}
                    </Link>
                  ))}
                </div>
              </div>

              <a
                href="https://wa.me/4917634658003"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto flex items-center justify-center gap-2 rounded-full bg-[#25D366] py-3 text-sm font-bold uppercase tracking-wider text-white"
              >
                <svg viewBox="0 0 24 24" className="size-5" fill="currentColor">
                  <path d="M20.5 3.5A11.8 11.8 0 0012 0C5.4 0 0 5.4 0 12c0 2.1.5 4.1 1.6 5.9L0 24l6.3-1.6c1.7.9 3.7 1.4 5.7 1.4 6.6 0 12-5.4 12-12 0-3.2-1.3-6.2-3.5-8.3z" />
                </svg>
                Chat on WhatsApp
              </a>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
