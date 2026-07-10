import "server-only";
import { cookies, headers } from "next/headers";
import { LOCALE_COOKIE, isLocale, pickLocale, DEFAULT_LOCALE, type Locale } from "./config";

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(LOCALE_COOKIE)?.value;
  if (isLocale(fromCookie)) return fromCookie;
  const hdrs = await headers();
  const accept = hdrs.get("accept-language");
  return accept ? pickLocale(accept) : DEFAULT_LOCALE;
}
