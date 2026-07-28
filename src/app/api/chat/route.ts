import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildSystemPrompt, buildStockPrompt } from "@/lib/botKnowledge";
import { appendConversation, getBotKnowledge } from "@/lib/adminStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  const client = new Anthropic({ apiKey });

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

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 600,
      system,
      messages,
    });

    const reply = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    const finalReply =
      reply ||
      "Sorry, I couldn't generate a reply just now. Please try rephrasing your question.";

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

    return NextResponse.json({ reply: finalReply, conversationId });
  } catch (e) {
    console.error("[chat] upstream error:", e);
    return NextResponse.json(
      { error: "Chat is temporarily unavailable. Please try again in a moment." },
      { status: 502 }
    );
  }
}
