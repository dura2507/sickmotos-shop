"use client";

import { useState } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useDictionary } from "@/app/_components/LocaleProvider";
import {
  loginAction,
  recoverAction,
  registerAction,
  type AuthState,
} from "./actions";

type Mode = "login" | "register" | "recover";

const initial: AuthState = {};

const inputCls =
  "w-full rounded-xl border border-border-strong bg-bg px-4 py-3 text-sm text-fg placeholder:text-fg-dim outline-none transition-colors focus:border-accent";

function SubmitButton({ label }: { label: string }) {
  const dict = useDictionary();
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-1 w-full rounded-full bg-accent px-5 py-3 text-xs font-bold uppercase tracking-wider text-fg transition-colors hover:bg-accent-hi disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? dict.login.pleaseWait : label}
    </button>
  );
}

function Feedback({ state }: { state: AuthState }) {
  if (state.error) {
    return (
      <p className="rounded-xl border border-accent/40 bg-accent/10 px-3 py-2.5 text-xs text-accent">
        {state.error}
      </p>
    );
  }
  if (state.notice) {
    return (
      <p className="rounded-xl border border-border-strong bg-surface/60 px-3 py-2.5 text-xs text-fg-muted">
        {state.notice}
      </p>
    );
  }
  return null;
}

export function LoginForm({ returnTo }: { returnTo: string }) {
  const dict = useDictionary();
  const [mode, setMode] = useState<Mode>("login");
  const [login, loginFormAction] = useActionState(loginAction, initial);
  const [register, registerFormAction] = useActionState(
    registerAction,
    initial
  );
  const [recover, recoverFormAction] = useActionState(recoverAction, initial);

  const tab = (m: Mode, label: string) => (
    <button
      type="button"
      onClick={() => setMode(m)}
      className={`flex-1 rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-wider transition-colors ${
        mode === m
          ? "bg-accent text-fg"
          : "text-fg-muted hover:text-fg"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-accent">
          {dict.login.kicker}
        </span>
        <h1 className="mt-2 font-display text-4xl uppercase tracking-tight md:text-5xl">
          {mode === "login"
            ? dict.login.signIn
            : mode === "register"
              ? dict.login.createAccount
              : dict.login.resetPassword}
        </h1>
      </div>

      {mode !== "recover" && (
        <div className="mb-6 flex items-center gap-1 rounded-full border border-border bg-surface/40 p-1">
          {tab("login", dict.login.signIn)}
          {tab("register", dict.login.createAccount)}
        </div>
      )}

      {mode === "login" && (
        <form action={loginFormAction} className="flex flex-col gap-3">
          <input type="hidden" name="returnTo" value={returnTo} />
          <Feedback state={login} />
          <input
            className={inputCls}
            type="email"
            name="email"
            autoComplete="email"
            placeholder={dict.login.emailPlaceholder}
            required
          />
          <input
            className={inputCls}
            type="password"
            name="password"
            autoComplete="current-password"
            placeholder={dict.login.passwordPlaceholder}
            required
          />
          <SubmitButton label={dict.login.signIn} />
          <button
            type="button"
            onClick={() => setMode("recover")}
            className="mt-1 text-center text-[11px] font-semibold uppercase tracking-wider text-fg-muted hover:text-accent"
          >
            {dict.login.forgotPassword}
          </button>
        </form>
      )}

      {mode === "register" && (
        <form action={registerFormAction} className="flex flex-col gap-3">
          <input type="hidden" name="returnTo" value={returnTo} />
          <Feedback state={register} />
          <div className="flex gap-3">
            <input
              className={inputCls}
              type="text"
              name="firstName"
              autoComplete="given-name"
              placeholder={dict.login.firstNamePlaceholder}
            />
            <input
              className={inputCls}
              type="text"
              name="lastName"
              autoComplete="family-name"
              placeholder={dict.login.lastNamePlaceholder}
            />
          </div>
          <input
            className={inputCls}
            type="email"
            name="email"
            autoComplete="email"
            placeholder={dict.login.emailPlaceholder}
            required
          />
          <input
            className={inputCls}
            type="password"
            name="password"
            autoComplete="new-password"
            placeholder={dict.login.passwordRegisterPlaceholder}
            minLength={5}
            required
          />
          <SubmitButton label={dict.login.createAccount} />
        </form>
      )}

      {mode === "recover" && (
        <form action={recoverFormAction} className="flex flex-col gap-3">
          <Feedback state={recover} />
          <p className="text-center text-xs text-fg-muted">
            {dict.login.recoverBody}
          </p>
          <input
            className={inputCls}
            type="email"
            name="email"
            autoComplete="email"
            placeholder={dict.login.emailPlaceholder}
            required
          />
          <SubmitButton label={dict.login.sendResetLink} />
          <button
            type="button"
            onClick={() => setMode("login")}
            className="mt-1 text-center text-[11px] font-semibold uppercase tracking-wider text-fg-muted hover:text-accent"
          >
            {dict.login.backToSignIn}
          </button>
        </form>
      )}

      <p className="mt-8 text-center text-[11px] leading-relaxed text-fg-dim">
        {dict.login.checkoutNote}
      </p>
    </div>
  );
}
