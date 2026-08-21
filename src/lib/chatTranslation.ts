import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { redis, safe } from "@/lib/redisSafe";
import type { StoredConversation } from "@/lib/adminStore";

// Thomas (20.08.): "Bot fragen in deutsch übersetzen. Erleichtert die
// Korrektur". Non-German chat messages get a German translation rendered
// underneath them in /admin/chats/[id]. One Haiku call per conversation
// state, cached in Redis, so the cost is paid only the first time Thomas
// opens a chat (and again only after new messages arrive).

const MODEL = process.env.SICKMOTOS_BOT_MODEL || "claude-haiku-4-5";
const KEY = (id: string) => `sm:chat:translation:${id}`;
const TTL_SEC = 60 * 60 * 24 * 180;

// message index -> German translation. Already-German messages are absent.
export type TranslationMap = Record<number, string>;

type CacheShape = { count: number; map: TranslationMap };

export async function getConversationTranslations(
  conv: StoredConversation
): Promise<TranslationMap> {
  if (conv.messages.length === 0) return {};

  if (redis) {
    const cached = await safe<CacheShape | null | undefined>(
      "chatTranslation.read",
      () => redis!.get<CacheShape>(KEY(conv.id)),
      undefined
    );
    if (cached && cached.count === conv.messages.length) return cached.map;
  }

  const map = await translate(conv);
  if (map === null) return {};

  if (redis) {
    await safe(
      "chatTranslation.write",
      () =>
        redis!.set(
          KEY(conv.id),
          JSON.stringify({ count: conv.messages.length, map }),
          { ex: TTL_SEC }
        ),
      null
    );
  }
  return map;
}

// null = translation unavailable (no key, upstream error). The page then
// simply renders without translations; nothing else may break.
async function translate(
  conv: StoredConversation
): Promise<TranslationMap | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const items = conv.messages.map((m, i) => ({
    i,
    von: m.role === "user" ? "Kunde" : "Bot",
    text: m.content.slice(0, 2000),
  }));

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 4000,
      system:
        "Du übersetzt Support-Chat-Nachrichten eines Motorradteile-Shops ins Deutsche, " +
        "damit der Inhaber sie prüfen kann. Antworte NUR mit einem JSON-Objekt der Form " +
        '{"translations": {"<index>": "<deutsche Übersetzung>"}}. Nimm AUSSCHLIESSLICH ' +
        "Nachrichten auf, die nicht bereits auf Deutsch sind. Ist der gesamte Chat deutsch, " +
        'antworte {"translations": {}}. Übersetze vollständig, wörtlich und neutral, ohne ' +
        "Kommentare oder Auslassungen. Produktnamen, Codes und Bestellnummern unverändert lassen.",
      messages: [{ role: "user", content: JSON.stringify(items) }],
    });
    const raw = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim()
      .replace(/^```(json)?\s*/i, "")
      .replace(/\s*```$/, "");
    const parsed = JSON.parse(raw) as { translations?: Record<string, unknown> };
    const map: TranslationMap = {};
    for (const [k, v] of Object.entries(parsed.translations ?? {})) {
      const idx = Number(k);
      if (Number.isInteger(idx) && idx >= 0 && idx < conv.messages.length && typeof v === "string" && v.trim()) {
        map[idx] = v.trim();
      }
    }
    return map;
  } catch (e) {
    console.error("[chatTranslation] failed:", e);
    return null;
  }
}
