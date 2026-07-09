import { LoginForm } from "./login-form";

export const metadata = {
  title: "Admin · SickMotos",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-5 text-fg">
      <div className="w-full max-w-sm">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.3em] text-fg-dim">
          SickMotos · Admin
        </p>
        <h1 className="mb-7 font-display text-5xl uppercase tracking-tight text-fg">
          Sign in
        </h1>
        <LoginForm redirectTo={from ?? "/admin"} />
      </div>
    </main>
  );
}
