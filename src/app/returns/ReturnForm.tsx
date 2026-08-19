"use client";

import { useState } from "react";
import { useDictionary, useLocale } from "@/app/_components/LocaleProvider";

// Thomas' rule set for return requests: every field required, reason with a
// minimum length, no attachments. Nothing incomplete can be sent, his inbox
// stays clean; requests land in /admin/returns instead of the mailbox.

const REASON_MIN = 150;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ORDER_RE = /^#?[0-9A-Za-z-]{2,12}$/;

type Fields = {
  orderNumber: string;
  name: string;
  email: string;
  street: string;
  zip: string;
  city: string;
  country: string;
  reason: string;
};

const EMPTY: Fields = {
  orderNumber: "",
  name: "",
  email: "",
  street: "",
  zip: "",
  city: "",
  country: "",
  reason: "",
};

const inputCls =
  "w-full rounded-xl border border-border-strong bg-bg px-4 py-3 text-sm text-fg placeholder:text-fg-dim outline-none transition-colors focus:border-accent";

export function ReturnForm() {
  const dict = useDictionary();
  const locale = useLocale();
  const t = dict.returnsPage;
  const [f, setF] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>({});
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState("");

  const set = (k: keyof Fields) => (v: string) => {
    setF((prev) => ({ ...prev, [k]: v }));
    setErrors((prev) => ({ ...prev, [k]: undefined }));
  };

  const validate = (): Partial<Record<keyof Fields, string>> => {
    const e: Partial<Record<keyof Fields, string>> = {};
    if (!ORDER_RE.test(f.orderNumber.trim())) e.orderNumber = t.errors.orderNumber;
    if (f.name.trim().length < 3) e.name = t.errors.name;
    if (!EMAIL_RE.test(f.email.trim())) e.email = t.errors.email;
    if (f.street.trim().length < 5) e.street = t.errors.street;
    if (f.zip.trim().length < 3) e.zip = t.errors.zip;
    if (f.city.trim().length < 2) e.city = t.errors.city;
    if (f.country.trim().length < 2) e.country = t.errors.country;
    if (f.reason.trim().length < REASON_MIN) e.reason = t.errors.reason;
    return e;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setServerError(null);
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    setPending(true);
    try {
      const res = await fetch("/api/returns", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...f, website: honeypot, locale }),
      });
      if (res.ok) {
        setSent(true);
      } else if (res.status === 429) {
        setServerError(t.errors.tooMany);
      } else {
        setServerError(t.errors.server);
      }
    } catch {
      setServerError(t.errors.server);
    } finally {
      setPending(false);
    }
  };

  if (sent) {
    return (
      <div className="rounded-2xl border border-border-strong bg-surface/60 px-6 py-8 text-center">
        <h2 className="font-display text-2xl uppercase tracking-tight text-fg">
          {t.successTitle}
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-fg-muted">
          {t.successBody}
        </p>
      </div>
    );
  }

  const reasonLen = f.reason.trim().length;
  const field = (
    k: keyof Fields,
    label: string,
    props: React.InputHTMLAttributes<HTMLInputElement> = {}
  ) => (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-bold uppercase tracking-wider text-fg-muted">
        {label}
      </span>
      <input
        className={inputCls}
        value={f[k]}
        onChange={(ev) => set(k)(ev.target.value)}
        {...props}
      />
      {errors[k] && <span className="text-xs text-accent">{errors[k]}</span>}
    </label>
  );

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      {field("orderNumber", t.orderNumber, {
        placeholder: t.orderNumberPlaceholder,
        autoComplete: "off",
        maxLength: 20,
      })}
      <p className="-mt-2 text-xs text-fg-dim">{t.orderNumberHint}</p>

      {field("name", t.name, { autoComplete: "name", maxLength: 120 })}
      {field("email", t.email, {
        type: "email",
        autoComplete: "email",
        maxLength: 120,
      })}
      <p className="-mt-2 text-xs text-fg-dim">{t.emailHint}</p>

      {field("street", t.street, {
        autoComplete: "street-address",
        maxLength: 160,
      })}
      <div className="grid grid-cols-[1fr_2fr] gap-3">
        {field("zip", t.zip, { autoComplete: "postal-code", maxLength: 12 })}
        {field("city", t.city, { autoComplete: "address-level2", maxLength: 120 })}
      </div>
      {field("country", t.country, { autoComplete: "country-name", maxLength: 60 })}

      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-fg-muted">
          {t.reason}
        </span>
        <textarea
          className={`${inputCls} min-h-40 resize-y`}
          value={f.reason}
          onChange={(ev) => set("reason")(ev.target.value)}
          placeholder={t.reasonPlaceholder}
          maxLength={3000}
        />
        <span
          className={`text-xs ${reasonLen >= REASON_MIN ? "text-fg-dim" : "text-fg-muted"}`}
        >
          {t.reasonCounter.replace("{n}", String(reasonLen))}
        </span>
        {errors.reason && <span className="text-xs text-accent">{errors.reason}</span>}
      </label>

      {/* Honeypot, invisible for customers, bots fill it and get discarded. */}
      <div aria-hidden className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden">
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(ev) => setHoneypot(ev.target.value)}
        />
      </div>

      {serverError && (
        <p className="rounded-xl border border-accent/40 bg-accent/10 px-3 py-2.5 text-xs text-accent">
          {serverError}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 w-full rounded-full bg-accent px-5 py-3 text-xs font-bold uppercase tracking-wider text-fg transition-colors hover:bg-accent-hi disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? t.sending : t.submit}
      </button>
    </form>
  );
}
