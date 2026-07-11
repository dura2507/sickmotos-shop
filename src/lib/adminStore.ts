import "server-only";
import { Redis } from "@upstash/redis";

let redis: Redis | null = null;
try {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    redis = new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    });
  }
} catch {
  redis = null;
}

const memory = {
  conversations: new Map<string, StoredConversation>(),
  order: [] as string[],
  corrections: [] as BotCorrection[],
  knowledge: "",
};

export type StoredMessage = {
  role: "user" | "assistant";
  content: string;
  at: number;
};

export type StoredConversation = {
  id: string;
  createdAt: number;
  updatedAt: number;
  messages: StoredMessage[];
  preview: string;
  reviewed: boolean;
  note?: string;
};

// A single correction Thomas made on a bot answer. The raw list is the audit
// trail shown in the admin; the merged, structured knowledge doc is what the
// bot actually reads (see botCorrections.ts).
export type BotCorrection = {
  id: string;
  at: number;
  chatId?: string;
  question: string;
  wrongAnswer?: string;
  correction: string;
};

const KEY_CONV = (id: string) => `sm:conv:${id}`;
const KEY_INDEX = "sm:conv:index";
const KEY_CORR = "sm:bot:corrections";
const KEY_KNOW = "sm:bot:knowledge";

function makeId(): string {
  const t = Date.now().toString(36);
  const r = Math.random().toString(36).slice(2, 8);
  return `${t}-${r}`;
}

function shortPreview(text: string): string {
  const s = text.replace(/\s+/g, " ").trim();
  return s.length > 120 ? s.slice(0, 117) + "…" : s;
}

// Append a new turn to an existing conversation, or start one when id is null.
// Returns the conversation id so the client can send it back next turn.
export async function appendConversation(
  id: string | null,
  turns: StoredMessage[]
): Promise<string> {
  const now = Date.now();
  const convId = id || makeId();

  if (redis) {
    const raw = await redis.get<StoredConversation>(KEY_CONV(convId));
    const existing: StoredConversation =
      raw ?? {
        id: convId,
        createdAt: now,
        updatedAt: now,
        messages: [],
        preview: shortPreview(turns[0]?.content || ""),
        reviewed: false,
      };
    existing.messages = [...existing.messages, ...turns];
    existing.updatedAt = now;
    if (!existing.preview && turns[0]) {
      existing.preview = shortPreview(turns[0].content);
    }
    await redis.set(KEY_CONV(convId), existing);
    // lpush prepends → index is newest-first
    await redis.lpush(KEY_INDEX, convId);
    await redis.ltrim(KEY_INDEX, 0, 999); // keep last 1000
    return convId;
  }

  // fallback: in-memory
  const existing = memory.conversations.get(convId) ?? {
    id: convId,
    createdAt: now,
    updatedAt: now,
    messages: [],
    preview: shortPreview(turns[0]?.content || ""),
    reviewed: false,
  };
  existing.messages = [...existing.messages, ...turns];
  existing.updatedAt = now;
  memory.conversations.set(convId, existing);
  if (!memory.order.includes(convId)) memory.order.unshift(convId);
  if (memory.order.length > 1000) memory.order.length = 1000;
  return convId;
}

export async function listConversations(
  limit = 50,
  offset = 0
): Promise<StoredConversation[]> {
  if (redis) {
    const ids = (await redis.lrange<string>(KEY_INDEX, offset, offset + limit - 1)) ?? [];
    // Deduplicate — lpush on every turn can leave duplicates.
    const uniq = [...new Set(ids)];
    if (uniq.length === 0) return [];
    const rows = (await redis.mget<StoredConversation[]>(...uniq.map(KEY_CONV))) ?? [];
    return rows.filter((r): r is StoredConversation => !!r);
  }
  return memory.order
    .slice(offset, offset + limit)
    .map((id) => memory.conversations.get(id))
    .filter((c): c is StoredConversation => !!c);
}

export async function getConversation(id: string): Promise<StoredConversation | null> {
  if (redis) {
    const raw = await redis.get<StoredConversation>(KEY_CONV(id));
    return raw ?? null;
  }
  return memory.conversations.get(id) ?? null;
}

export async function markReviewed(id: string, reviewed: boolean): Promise<void> {
  const conv = await getConversation(id);
  if (!conv) return;
  conv.reviewed = reviewed;
  if (redis) {
    await redis.set(KEY_CONV(id), conv);
  } else {
    memory.conversations.set(id, conv);
  }
}

export async function saveNote(id: string, note: string): Promise<void> {
  const conv = await getConversation(id);
  if (!conv) return;
  conv.note = note;
  if (redis) {
    await redis.set(KEY_CONV(id), conv);
  } else {
    memory.conversations.set(id, conv);
  }
}

export function isPersistent(): boolean {
  return !!redis;
}

// ---- Bot corrections + merged knowledge doc ----

export async function addCorrection(
  input: Omit<BotCorrection, "id" | "at">
): Promise<BotCorrection> {
  const entry: BotCorrection = { ...input, id: makeId(), at: Date.now() };
  if (redis) {
    await redis.lpush(KEY_CORR, JSON.stringify(entry));
    await redis.ltrim(KEY_CORR, 0, 499);
  } else {
    memory.corrections.unshift(entry);
    if (memory.corrections.length > 500) memory.corrections.length = 500;
  }
  return entry;
}

export async function listCorrections(limit = 300): Promise<BotCorrection[]> {
  if (redis) {
    const rows = (await redis.lrange<string>(KEY_CORR, 0, limit - 1)) ?? [];
    return rows
      .map((r) => {
        try {
          return typeof r === "string" ? (JSON.parse(r) as BotCorrection) : (r as BotCorrection);
        } catch {
          return null;
        }
      })
      .filter((c): c is BotCorrection => !!c);
  }
  return memory.corrections.slice(0, limit);
}

export async function deleteCorrection(id: string): Promise<void> {
  if (redis) {
    const all = await listCorrections(500);
    const kept = all.filter((c) => c.id !== id);
    await redis.del(KEY_CORR);
    if (kept.length) {
      // preserve newest-first order (rpush oldest→newest of the reversed list)
      await redis.rpush(KEY_CORR, ...kept.map((c) => JSON.stringify(c)));
    }
  } else {
    memory.corrections = memory.corrections.filter((c) => c.id !== id);
  }
}

export async function getBotKnowledge(): Promise<string> {
  if (redis) {
    const doc = await redis.get<string>(KEY_KNOW);
    return doc ?? "";
  }
  return memory.knowledge;
}

export async function setBotKnowledge(doc: string): Promise<void> {
  if (redis) {
    await redis.set(KEY_KNOW, doc);
  } else {
    memory.knowledge = doc;
  }
}
