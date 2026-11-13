import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildSystemPrompt, buildStockPrompt } from "@/lib/botKnowledge";
import {
  PRODUCT_SEARCH_TOOL,
  runProductSearchTool,
  sanitizeBotReply,
} from "@/lib/botProductSearch";
import { appendConversation, getBotKnowledge } from "@/lib/adminStore";
import {
  ABUSE_THRESHOLD,
  TERMINATION_MESSAGE,
  blockChat,
  countAbusiveMessages,
  isChatBlocked,
} from "@/lib/botModeration";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Bis zu 4 Modellaufrufe nacheinander (Produktsuche), je 20 s Limit, ab 20 s
// keine weitere Suche mehr. Puffer fuer einen Wiederholversuch.
export const maxDuration = 90;

const MODEL = process.env.SICKMOTOS_BOT_MODEL || "claude-haiku-4-5";
const MAX_TURNS = 20;

type ClientMessage = { role: "user" | "assistant"; content: string };

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Chat is not configured yet." },
      { status: 503 }
    );
  }

  let body: { messages?: ClientMessage[]; conversationId?: string | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const incoming = Array.isArray(body.messages) ? body.messages : [];
  // Sanitize: keep only well-formed user/assistant turns, cap length.
  const messages = incoming
    .filter(
      (m): m is ClientMessage =>
        !!m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim().length > 0
    )
    .slice(-MAX_TURNS)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));

  if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
    return NextResponse.json(
      { error: "Expected a user message." },
      { status: 400 }
    );
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "";
  const ua = req.headers.get("user-agent") || "";

  // Blocked senders get Thomas' termination text and never reach the model,
  // so a flood of follow-up insults costs no tokens.
  if (await isChatBlocked(ip, body.conversationId ?? null)) {
    return NextResponse.json({
      reply: TERMINATION_MESSAGE,
      conversationId: body.conversationId ?? null,
      terminated: true,
    });
  }

  // From the third insulting message on, the conversation ends with Thomas'
  // exact wording (2026-08-20). Evidence is stored BEFORE the text goes out,
  // because the text claims it.
  if (countAbusiveMessages(messages) >= ABUSE_THRESHOLD) {
    const now = Date.now();
    let conversationId = body.conversationId ?? null;
    try {
      conversationId = await appendConversation(conversationId, [
        { role: "user", content: messages[messages.length - 1].content, at: now },
        { role: "assistant", content: TERMINATION_MESSAGE, at: now + 1 },
      ]);
    } catch (logErr) {
      console.error("[chat] failed to log terminated conversation:", logErr);
    }
    await blockChat(ip, conversationId ?? "unknown", {
      ua,
      insultCount: countAbusiveMessages(messages),
    });
    return NextResponse.json({
      reply: TERMINATION_MESSAGE,
      conversationId,
      terminated: true,
    });
  }

  // Kurzes Limit pro Aufruf, damit bei einer haengenden API der Rueckfall und
  // die Fehlermeldung noch innerhalb der Funktionslaufzeit greifen.
  const client = new Anthropic({ apiKey, timeout: 20_000, maxRetries: 1 });

  // Owner corrections override the base knowledge. Kept in a separate,
  // uncached block so a fresh correction takes effect on the very next answer.
  // safe() wirft nicht mehr, undefined heisst der Speicher hat nicht
  // geantwortet. Der Bot antwortet dann ohne Thomas' Korrekturen (H4-Adapter,
  // 3-Pin vs 4-Pin, EXTRA5), was man der Antwort nicht ansieht, deshalb ins Log.
  const corrections = await getBotKnowledge();
  if (corrections === undefined) {
    console.warn("[chat] keine Korrekturen geladen, Antwort nur auf Basiswissen");
  }
  const system: Anthropic.MessageCreateParams["system"] = [
    {
      type: "text",
      text: buildSystemPrompt(),
      cache_control: { type: "ephemeral" },
    },
    // Current stock. Uncached so it always reflects the latest deploy's data.
    {
      type: "text",
      text: buildStockPrompt(),
    },
  ];
  if (corrections && corrections.trim()) {
    system.push({
      type: "text",
      text:
        "The following are corrections from the shop owner. They have the HIGHEST priority and OVERRIDE anything above if they conflict. Follow them exactly.\n\n" +
        corrections,
    });
  }

  const textOf = (r: Anthropic.Message) =>
    r.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

  // Produktsuche als Tool (2026-11-13, Thomas: "Bot soll Produktlinks
  // senden"). Hoechstens MAX_TOOL_ROUNDS Suchrunden, die letzte Anfrage
  // erzwingt eine Textantwort. Schlaegt der Tool-Weg fehl, antwortet der Bot
  // wie vorher ohne Tools, damit der Chat nie wegen der Suche ausfaellt.
  const MAX_TOOL_ROUNDS = 3;
  const offered: string[] = [];
  const started = Date.now();
  // Kleine Diagnose in der Antwort (vom Widget ignoriert, keine Kundendaten).
  const diag = { rounds: 0, searches: [] as string[], fallback: false, error: "" };
  async function answerWithTools(): Promise<string> {
    let convo: Anthropic.MessageParam[] = [...messages];
    // Antwort = letzter Textteil. Zusammenkleben aller Runden ergab live
    // Widersprueche (erst Rueckfrage, nach der Suche "Perfekt, hier ist ...").
    // Text vor einer Suche bleibt nur als Ersatz, falls danach nichts kommt.
    const parts: string[] = [];
    for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
      // Letzte Runde oder nach 20 s: keine weitere Suche, nur antworten.
      const finalRound = round === MAX_TOOL_ROUNDS || Date.now() - started > 20_000;
      diag.rounds++;
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 1200,
        system,
        tools: [PRODUCT_SEARCH_TOOL],
        tool_choice: finalRound ? { type: "none" } : { type: "auto" },
        messages: convo,
      });
      if (response.stop_reason === "refusal") return "";
      const text = textOf(response);
      if (text) parts.push(text);
      if (response.stop_reason !== "tool_use" || finalRound) {
        // Abgeschnitten: auf den letzten vollstaendigen Satz kuerzen.
        if (response.stop_reason === "max_tokens" && parts.length) {
          const lastPart = parts[parts.length - 1];
          const cut = Math.max(lastPart.lastIndexOf(". "), lastPart.lastIndexOf(".\n"), lastPart.lastIndexOf(")\n"));
          if (cut > 0) parts[parts.length - 1] = lastPart.slice(0, cut + 1);
        }
        return parts[parts.length - 1] ?? "";
      }
      const toolUses = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
      );
      const results: Anthropic.ToolResultBlockParam[] = toolUses.map((tu) => {
        const r =
          tu.name === PRODUCT_SEARCH_TOOL.name
            ? runProductSearchTool(tu.input)
            : { content: `Unknown tool ${tu.name}`, isError: true, urls: [] };
        offered.push(...r.urls);
        diag.searches.push(
          `${String((tu.input as { query?: unknown })?.query ?? "").slice(0, 80)} => ${r.urls.length}`
        );
        return {
          type: "tool_result",
          tool_use_id: tu.id,
          content: r.content,
          is_error: r.isError,
        };
      });
      convo = [
        ...convo,
        { role: "assistant", content: response.content },
        { role: "user", content: results },
      ];
    }
    return parts[parts.length - 1] ?? "";
  }

  try {
    let reply = "";
    try {
      reply = await answerWithTools();
    } catch (toolErr) {
      console.error("[chat] tool path failed, answering without tools:", toolErr);
      diag.fallback = true;
      diag.error = String((toolErr as Error)?.message ?? toolErr).slice(0, 200);
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 600,
        system: [
          ...system,
          {
            type: "text",
            text: "The product search is unavailable right now. Do not promise to look anything up and do not write product links. Point the customer to the shop search at sickmotos.com/shop.",
          },
        ],
        messages,
      });
      reply = textOf(response);
    }

    const finalReply =
      sanitizeBotReply(reply, offered) ||
      "Sorry, da ist gerade etwas schiefgelaufen. Frag gerne nochmal. (Sorry, something went wrong, please ask again.)";

    let conversationId = body.conversationId ?? null;
    try {
      const lastUser = messages[messages.length - 1];
      const now = Date.now();
      conversationId = await appendConversation(conversationId, [
        { role: "user", content: lastUser.content, at: now },
        { role: "assistant", content: finalReply, at: now + 1 },
      ]);
    } catch (logErr) {
      console.error("[chat] failed to log conversation:", logErr);
    }

    return NextResponse.json({ reply: finalReply, conversationId, diag });
  } catch (e) {
    console.error("[chat] upstream error:", e);
    return NextResponse.json(
      { error: "Chat is temporarily unavailable. Please try again in a moment." },
      { status: 502 }
    );
  }
}
