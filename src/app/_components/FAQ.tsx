const faqs = [
  {
    q: "What types of products does SickMotos offer?",
    a: "Performance parts for Supermoto and Enduro: titanium exhausts, LED headlights, ECU tuning modules, carbon parts, titanium screws, racing brake discs, supermoto rim sets, graphics kits and merchandise.",
  },
  {
    q: "Do you ship internationally?",
    a: "Yes. SickMotos ships worldwide. We deliver across Europe, the Middle East, North America and Asia. Most orders arrive within 5 to 10 business days.",
  },
  {
    q: "Do SickMotos products come with a warranty?",
    a: "All products carry a manufacturer's warranty of up to 6 months against defects in materials or workmanship. Optional 1-year extended warranty available at €49.",
  },
  {
    q: "Which payment methods do you accept?",
    a: "Visa, Mastercard, Maestro, American Express, Apple Pay and Bitcoin. All transactions are encrypted and secure.",
  },
  {
    q: "Can I get a custom performance setup for my motorbike?",
    a: "Yes. Contact Thomas directly via WhatsApp or email with your bike details and goals, and we'll put together a tailored package.",
  },
];

export function FAQ() {
  return (
    <section className="border-b border-border py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="mb-10 font-display text-4xl uppercase tracking-tight md:text-5xl">
          Frequently asked
        </h2>

        <div className="divide-y divide-border rounded-lg border border-border bg-surface/40">
          {faqs.map((f) => (
            <details key={f.q} className="group">
              <summary className="flex cursor-pointer items-center justify-between gap-4 px-6 py-5 text-base font-medium text-fg list-none [&::-webkit-details-marker]:hidden">
                {f.q}
                <svg
                  viewBox="0 0 24 24"
                  className="size-5 shrink-0 text-fg-muted transition-transform group-open:rotate-45"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  aria-hidden
                >
                  <path
                    d="M12 5v14M5 12h14"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </summary>
              <div className="px-6 pb-5 text-sm leading-relaxed text-fg-muted">
                {f.a}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
