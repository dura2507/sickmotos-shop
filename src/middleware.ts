import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, isValidSession } from "@/lib/adminSession";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Set a request header the root layout can read to decide whether to
  // suppress the storefront chrome. Server components can't call useRouter,
  // so this is how we get the current path into the layout.
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-sm-path", pathname);

  // Admin gate. Every /admin/* path except the login page and the auth API
  // requires a valid HMAC session cookie. When it's missing we redirect to
  // /admin/login with a `from` param so the login flow can bounce back.
  if (
    pathname.startsWith("/admin") &&
    !pathname.startsWith("/admin/login") &&
    !pathname.startsWith("/api/admin/auth")
  ) {
    const cookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const password = process.env.ADMIN_PASSWORD ?? "";
    const authed = await isValidSession(cookie, password);
    if (!authed) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("from", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico).*)"],
};
