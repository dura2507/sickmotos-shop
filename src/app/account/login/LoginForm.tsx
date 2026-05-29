"use client";

import { useState } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
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
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-1 w-full rounded-full bg-accent px-5 py-3 text-xs font-bold uppercase tracking-wider text-fg transition-colors hover:bg-accent-hi disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Please wait..." : label}
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
          SickMotos account
        </span>
        <h1 className="mt-2 font-display text-4xl uppercase tracking-tight md:text-5xl">
          {mode === "login"
            ? "Sign in"
            : mode === "register"
              ? "Create account"
              : "Reset password"}
        </h1>
      </div>

      {mode !== "recover" && (
        <div className="mb-6 flex items-center gap-1 rounded-full border border-border bg-surface/40 p-1">
          {tab("login", "Sign in")}
          {tab("register", "Create account")}
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
            placeholder="Email"
            required
          />
          <input
            className={inputCls}
            type="password"
            name="password"
            autoComplete="current-password"
            placeholder="Password"
            required
          />
          <SubmitButton label="Sign in" />
          <button
            type="button"
            onClick={() => setMode("recover")}
            className="mt-1 text-center text-[11px] font-semibold uppercase tracking-wider text-fg-muted hover:text-accent"
          >
            Forgot your password?
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
              placeholder="First name"
            />
            <input
              className={inputCls}
              type="text"
              name="lastName"
              autoComplete="family-name"
              placeholder="Last name"
            />
          </div>
          <input
            className={inputCls}
            type="email"
            name="email"
            autoComplete="email"
            placeholder="Email"
            required
          />
          <input
            className={inputCls}
            type="password"
            name="password"
            autoComplete="new-password"
            placeholder="Password (min. 5 characters)"
            minLength={5}
            required
          />
          <SubmitButton label="Create account" />
        </form>
      )}

      {mode === "recover" && (
        <form action={recoverFormAction} className="flex flex-col gap-3">
          <Feedback state={recover} />
          <p className="text-center text-xs text-fg-muted">
            Enter your email and we will send you a link to reset your password.
          </p>
          <input
            className={inputCls}
            type="email"
            name="email"
            autoComplete="email"
            placeholder="Email"
            required
          />
          <SubmitButton label="Send reset link" />
          <button
            type="button"
            onClick={() => setMode("login")}
            className="mt-1 text-center text-[11px] font-semibold uppercase tracking-wider text-fg-muted hover:text-accent"
          >
            Back to sign in
          </button>
        </form>
      )}

      <p className="mt-8 text-center text-[11px] leading-relaxed text-fg-dim">
        Checkout is handled securely by Shopify. Your account here lets you
        track orders and speed up future checkouts.
      </p>
    </div>
  );
}
