import "server-only";
import { redis, safe } from "./redisSafe";

// Lesekonvention fuer alles hier drunter: undefined heisst der Speicher hat
// nicht geantwortet (Ausfall, Kontingent aufgebraucht). null / [] / "" heissen
// er hat geantwortet und da ist nichts. Wer zurueckschreibt, muss die beiden
// Faelle unterscheiden, sonst loescht ein fehlgeschlagener Lesevorgang plus
// erfolgreicher Schreibvorgang echte Daten.

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
    // undefined heisst der Lesevorgang selbst ist gescheitert. Das als "noch
    // kein Gespraech" zu behandeln wuerde einen echten Verlauf mit einem
    // einzeiligen Stummel ueberschreiben.
    const raw = await safe<StoredConversation | null | undefined>(
      "adminStore.appendConversation.read",
      () => redis!.get<StoredConversation>(KEY_CONV(convId)),
      undefined
    );
    if (raw === undefined) return convId;

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
    // Eine Pipeline statt drei Roundtrips.
    await safe(
      "adminStore.appendConversation.write",
      async () => {
        const pipe = redis!.pipeline();
        pipe.set(KEY_CONV(convId), existing);
        pipe.lpush(KEY_INDEX, convId); // lpush prepends, index is newest-first
        pipe.ltrim(KEY_INDEX, 0, 999); // keep last 1000
        await pipe.exec();
        return true;
      },
      false
    );
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
): Promise<StoredConversation[] | undefined> {
  if (redis) {
    const ids = await safe<string[] | undefined>(
      "adminStore.listConversations.index",
      () => redis!.lrange<string>(KEY_INDEX, offset, offset + limit - 1),
      undefined
    );
    if (ids === undefined) return undefined;
    // Deduplicate, lpush on every turn can leave duplicates.
    const uniq = [...new Set(ids)];
    if (uniq.length === 0) return [];
    const rows = await safe<StoredConversation[] | undefined>(
      "adminStore.listConversations.rows",
      () => redis!.mget<StoredConversation[]>(...uniq.map(KEY_CONV)),
      undefined
    );
    if (rows === undefined) return undefined;
    return rows.filter((r): r is StoredConversation => !!r);
  }
  return memory.order
    .slice(offset, offset + limit)
    .map((id) => memory.conversations.get(id))
    .filter((c): c is StoredConversation => !!c);
}

export async function getConversation(
  id: string
): Promise<StoredConversation | null | undefined> {
  if (redis) {
    return safe<StoredConversation | null | undefined>(
      "adminStore.getConversation",
      () => redis!.get<StoredConversation>(KEY_CONV(id)),
      undefined
    );
  }
  return memory.conversations.get(id) ?? null;
}

export async function markReviewed(id: string, reviewed: boolean): Promise<boolean> {
  const conv = await getConversation(id);
  // Deckt "nicht gefunden" und "Lesen fehlgeschlagen" ab: ohne den aktuellen
  // Stand darf nicht geschrieben werden.
  if (!conv) return false;
  conv.reviewed = reviewed;
  if (redis) {
    return safe(
      "adminStore.markReviewed",
      async () => {
        await redis!.set(KEY_CONV(id), conv);
        return true;
      },
      false
    );
  }
  memory.conversations.set(id, conv);
  return true;
}

export async function saveNote(id: string, note: string): Promise<boolean> {
  const conv = await getConversation(id);
  if (!conv) return false;
  conv.note = note;
  if (redis) {
    return safe(
      "adminStore.saveNote",
      async () => {
        await redis!.set(KEY_CONV(id), conv);
        return true;
      },
      false
    );
  }
  memory.conversations.set(id, conv);
  return true;
}

export function isPersistent(): boolean {
  return !!redis;
}

// ---- Bot corrections + merged knowledge doc ----

export async function addCorrection(
  input: Omit<BotCorrection, "id" | "at">
): Promise<BotCorrection | undefined> {
  const entry: BotCorrection = { ...input, id: makeId(), at: Date.now() };
  if (redis) {
    const ok = await safe(
      "adminStore.addCorrection",
      async () => {
        const pipe = redis!.pipeline();
        pipe.lpush(KEY_CORR, JSON.stringify(entry));
        pipe.ltrim(KEY_CORR, 0, 499);
        await pipe.exec();
        return true;
      },
      false
    );
    return ok ? entry : undefined;
  }
  memory.corrections.unshift(entry);
  if (memory.corrections.length > 500) memory.corrections.length = 500;
  return entry;
}

export async function listCorrections(
  limit = 300
): Promise<BotCorrection[] | undefined> {
  if (redis) {
    const rows = await safe<string[] | undefined>(
      "adminStore.listCorrections",
      () => redis!.lrange<string>(KEY_CORR, 0, limit - 1),
      undefined
    );
    if (rows === undefined) return undefined;
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

export async function deleteCorrection(id: string): Promise<boolean> {
  if (redis) {
    const all = await listCorrections(500);
    // Ein fehlgeschlagener Lesevorgang sieht aus wie eine leere Liste. Darauf
    // zu loeschen wuerde den ganzen Korrektur-Verlauf ausradieren.
    if (all === undefined) return false;
    const kept = all.filter((c) => c.id !== id);
    if (kept.length === all.length) return true; // nichts getroffen
    return safe(
      "adminStore.deleteCorrection",
      async () => {
        // Eine Transaktion, damit ein Fehler die Liste nie geloescht aber
        // ungeschrieben zuruecklassen kann.
        const tx = redis!.multi();
        tx.del(KEY_CORR);
        if (kept.length) {
          // preserve newest-first order (rpush oldest to newest)
          tx.rpush(KEY_CORR, ...kept.map((c) => JSON.stringify(c)));
        }
        await tx.exec();
        return true;
      },
      false
    );
  }
  memory.corrections = memory.corrections.filter((c) => c.id !== id);
  return true;
}

export async function getBotKnowledge(): Promise<string | undefined> {
  if (redis) {
    const doc = await safe<string | null | undefined>(
      "adminStore.getBotKnowledge",
      () => redis!.get<string>(KEY_KNOW),
      undefined
    );
    // undefined = Lesen fehlgeschlagen, "" = wirklich leer. applyCorrection und
    // der Editor brauchen den Unterschied: in ein faelschlich leeres Dokument
    // zu mergen und das zurueckzuschreiben loescht jede Korrektur.
    return doc === undefined ? undefined : doc ?? "";
  }
  return memory.knowledge;
}

export async function setBotKnowledge(doc: string): Promise<boolean> {
  if (redis) {
    return safe(
      "adminStore.setBotKnowledge",
      async () => {
        await redis!.set(KEY_KNOW, doc);
        return true;
      },
      false
    );
  }
  memory.knowledge = doc;
  return true;
}
