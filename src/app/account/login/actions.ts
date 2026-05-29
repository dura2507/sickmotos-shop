"use server";

import { redirect } from "next/navigation";
import {
  customerLogin,
  customerRecover,
  customerRegister,
  friendlyAuthError,
  setCustomerToken,
} from "@/lib/customerStorefront";

export type AuthState = { error?: string; notice?: string };

// Only allow same-origin relative paths, so a crafted ?returnTo= can't
// bounce the user to another site after login.
function safeReturn(value: FormDataEntryValue | null): string {
  const s = typeof value === "string" ? value : "";
  return s.startsWith("/") && !s.startsWith("//") ? s : "/account";
}

export async function loginAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const returnTo = safeReturn(formData.get("returnTo"));
  if (!email || !password) {
    return { error: "Enter your email and password." };
  }
  const res = await customerLogin(email, password);
  if (!res.ok) return { error: friendlyAuthError(res.errors) };
  await setCustomerToken(res.token, res.expiresAt);
  redirect(returnTo);
}

export async function registerAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const returnTo = safeReturn(formData.get("returnTo"));
  if (!email || !password) {
    return { error: "Enter your email and a password." };
  }
  if (password.length < 5) {
    return { error: "Password must be at least 5 characters." };
  }
  const reg = await customerRegister({
    email,
    password,
    firstName: firstName || undefined,
    lastName: lastName || undefined,
  });
  if (!reg.ok) return { error: friendlyAuthError(reg.errors) };

  // Try to sign them straight in. If the store requires email activation,
  // login fails with CUSTOMER_DISABLED and we tell them to check their mail.
  const res = await customerLogin(email, password);
  if (!res.ok) {
    return {
      notice:
        "Account created. Please check your email to activate it, then sign in.",
    };
  }
  await setCustomerToken(res.token, res.expiresAt);
  redirect(returnTo);
}

export async function recoverAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Enter your email." };
  const res = await customerRecover(email);
  if (!res.ok) return { error: friendlyAuthError(res.errors) };
  return {
    notice:
      "If an account exists for that email, we sent a reset link. Check your inbox.",
  };
}
