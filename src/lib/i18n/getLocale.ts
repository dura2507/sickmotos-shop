import "server-only";
import { cookies, headers } from "next/headers";
import { LOCALE_COOKIE, isLocale, pickLocale, type Locale } from "./config";

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(LOCALE_COOKIE)?.value;
  if (isLocale(fromCookie)) return fromCookie;
  const hdrs = await headers();
  // pickLocale handles a null header and unmatched languages (falls back to
  // English). German is only returned for German browsers.
  return pickLocale(hdrs.get("accept-language"));
}
