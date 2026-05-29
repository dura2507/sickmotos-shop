import { redirect } from "next/navigation";
import { getCustomerToken } from "@/lib/customerStorefront";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata = {
  title: "Sign in — SickMotos",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  // Already signed in? Skip the form.
  if (await getCustomerToken()) redirect("/account");

  const sp = await searchParams;
  const returnTo =
    sp.returnTo && sp.returnTo.startsWith("/") && !sp.returnTo.startsWith("//")
      ? sp.returnTo
      : "/account";

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center justify-center px-4 py-16 md:py-24">
      <LoginForm returnTo={returnTo} />
    </div>
  );
}
