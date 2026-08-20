import "server-only";
import { redis, safe } from "@/lib/redisSafe";

// Abuse handling for SickBot, requested by Thomas on 2026-08-20 after a chat
// with 140+ insults: from the third insulting message on, the conversation is
// terminated with his exact wording and the sender is blocked on IP and
// session level. The termination text claims that IP, timestamp and technical
// log data are stored as evidence, so recordAbuseEvidence must actually run
// before the text goes out, otherwise the message would lie.

// Thomas' wording, verbatim (Telegram 2026-08-20). Do not edit.
export const TERMINATION_MESSAGE =
  "Aufgrund von wiederholten Beleidigungen wird dieses Gespräch hiermit beendet. " +
  "Der Chatverlauf wurde zusammen mit Ihrer IP-Adresse, dem Zeitstempel und technischen " +
  "Protokolldaten zur Beweissicherung gespeichert. Wir behalten uns rechtliche Schritte " +
  "(wie eine Strafanzeige wegen Beleidigung gemäß § 185 StGB) vor.";

export const ABUSE_THRESHOLD = 3;

// Personal insults and abuse patterns only. Plain swearing about a product
// ("das ist scheisse") stays out on purpose, the bot answers that itself via
// Thomas' Beschimpfungs-Konter in the knowledge doc.
const INSULT_PATTERNS: RegExp[] = [
  /\barschloch\b/i,
  /\barsch\s*loch\b/i,
  /\bwichser\b/i,
  /\bhurensohn\b/i,
  /\bhuren\s*sohn\b/i,
  /\bfotze\b/i,
  /\bmissgeburt\b/i,
  /\bspast(i|en)?\b/i,
  /\b(voll)?idiot(en)?\b/i,
  /\bvollpfosten\b/i,
  /\bdepp(en)?\b/i,
  /\btrottel\b/i,
  /\bdummkopf\b/i,
  /\bschwachkopf\b/i,
  /\bdrecks?\s*(bot|teil|laden|seite)\b/i,
  /\bschei(ss|ß)\s*(bot|laden|seite|teil)\b/i,
  /\bfick\s*dich\b/i,
  /\bverpiss\s*dich\b/i,
  /\bhalt('?s|\s+die)\s*(fresse|maul|schnauze)\b/i,
  /\bbastard\b/i,
  /\bmistst(ü|ue)ck\b/i,
  /\bpenner\b/i,
  /\bopfer\b.*\bbot\b/i,
  /\basshole\b/i,
  /\bfuck\s*(you|off|u)\b/i,
  /\bmotherfucker\b/i,
  /\bmoron\b/i,
  /\bdumbass\b/i,
  /\bdipshit\b/i,
  /\bbitch\b/i,
  /\bcunt\b/i,
  /\bwanker\b/i,
  /\bretard(ed)?\b/i,
  /\bstupid\s+(bot|thing|machine|ai)\b/i,
  /\buseless\s+(bot|piece|thing|ai)\b/i,
];

export function isInsulting(text: string): boolean {
  return INSULT_PATTERNS.some((re) => re.test(text));
}

// Counted over the client-sent history (capped at 20 turns upstream), so the
// counter works even when Redis is down. A trimmed history therefore forgets
// old insults; acceptable, sustained abuse re-triggers within a few messages.
export function countAbusiveMessages(
  messages: { role: string; content: string }[]
): number {
  return messages.filter((m) => m.role === "user" && isInsulting(m.content))
    .length;
}

const BLOCK_TTL_SEC = 60 * 60 * 24 * 30;
const EVIDENCE_TTL_SEC = 60 * 60 * 24 * 90;
const ipKey = (ip: string) => `sm:chat:block:ip:${ip}`;
const convKey = (id: string) => `sm:chat:block:conv:${id}`;

// Fail-open: a dead Redis must not kill the bot for everyone. The in-history
// counter above still terminates sustained abuse in that case.
export async function isChatBlocked(
  ip: string,
  conversationId: string | null
): Promise<boolean> {
  if (!redis) return false;
  return safe(
    "botModeration.isBlocked",
    async () => {
      const keys = [ip ? ipKey(ip) : null, conversationId ? convKey(conversationId) : null].filter(
        (k): k is string => !!k
      );
      if (keys.length === 0) return false;
      const vals = await redis!.mget<(string | number | null)[]>(...keys);
      return vals.some((v) => v !== null);
    },
    false
  );
}

export async function blockChat(
  ip: string,
  conversationId: string,
  evidence: { ua: string; insultCount: number }
): Promise<void> {
  if (!redis) return;
  await safe(
    "botModeration.block",
    async () => {
      const at = Date.now();
      if (ip) await redis!.set(ipKey(ip), at, { ex: BLOCK_TTL_SEC });
      await redis!.set(convKey(conversationId), at, { ex: BLOCK_TTL_SEC });
      // Evidence record backing the claims in TERMINATION_MESSAGE. The chat
      // transcript itself already lives in the admin conversation store.
      await redis!.set(
        `sm:chat:abuse:${conversationId}`,
        JSON.stringify({ ip, ua: evidence.ua, insultCount: evidence.insultCount, at, conversationId }),
        { ex: EVIDENCE_TTL_SEC }
      );
      return true;
    },
    false
  );
}
