import Image from "next/image";

type Props = {
  kicker?: string;
  title: string;
  subtitle?: string;
  viewAllHref?: string;
  backdropImage?: string;
  index?: string;
};

export function SectionHeader({
  kicker,
  title,
  subtitle,
  viewAllHref,
  backdropImage,
  index,
}: Props) {
  return (
    <div className="reveal relative isolate mb-10 overflow-hidden rounded-lg border border-border bg-surface/50">
      {backdropImage && (
        <>
          <Image
            src={backdropImage}
            alt=""
            fill
            sizes="100vw"
            className="-z-10 object-cover opacity-20"
          />
          <div
            aria-hidden
            className="absolute inset-0 -z-10"
            style={{
              background:
                "linear-gradient(90deg, rgba(10,10,10,0.92) 0%, rgba(10,10,10,0.4) 60%, transparent 100%)",
            }}
          />
        </>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4 px-6 py-8 md:px-8">
        <div className="flex items-end gap-4 md:gap-6">
          {index && (
            <span
              aria-hidden
              className="font-display text-5xl leading-none text-accent/30 md:text-7xl"
            >
              {index}
            </span>
          )}
          <div className="flex flex-col gap-2">
            {kicker && (
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-accent">
                {kicker}
              </span>
            )}
            <h2 className="font-display text-4xl uppercase leading-none tracking-tight md:text-5xl">
              {title}
            </h2>
            <span aria-hidden className="h-0.5 w-12 bg-accent" />
            {subtitle && (
              <p className="max-w-md text-sm text-fg-muted">{subtitle}</p>
            )}
          </div>
        </div>
        {viewAllHref && (
          <a
            href={viewAllHref}
            className="group inline-flex items-center gap-2 text-sm font-semibold text-fg-muted underline-offset-4 hover:text-accent hover:underline"
          >
            View all
            <svg
              viewBox="0 0 24 24"
              className="size-4 transition-transform group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                d="M5 12h14M13 6l6 6-6 6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        )}
      </div>
    </div>
  );
}
