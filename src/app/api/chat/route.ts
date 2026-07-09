// SickMotos support chatbot endpoint.
//
// Takes the conversation so far, answers as the support assistant using the
// knowledge base in src/lib/botKnowledge.ts. Powered by the Claude API.
//
// SETUP (one-time, in Vercel -> Settings -> Environment Variables):
//   ANTHROPIC_API_KEY=sk-ant-...        (required; server-side only, no NEXT_PUBLIC_)
//   SICKMOTOS_BOT_MODEL=claude-haiku-4-5   (optional; default below)
//
// Cost: the knowledge base is sent with cache_control so it's billed at the
// cheap cache-read rate after the first request. A typical Q&A is a few cents
// on Haiku. Switch SICKMOTOS_BOT_MODEL to claude-opus-4-8 for higher quality
// at ~5x the token price.

import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildSystemPrompt } from "@/lib/botKnowledge";
import { appendConversation } from "@/lib/adminStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Haiku 4.5: fast + cheap, ideal for FAQ. Override via env for Opus-tier.
const MODEL = process.env.SICKMOTOS_BOT_MODEL || "claude-haiku-4-5";
const MAX_TURNS = 20; // guard against runaway histories

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

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 600,
      // Cache the (large, stable) knowledge base so repeat requests are cheap.
      system: [
        {
          type: "text",
          text: buildSystemPrompt(),
          cache_control: { type: "ephemeral" },
        },
      ],
      messages,
    });

    const reply = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    const finalReply =
      reply ||
      "Sorry, I couldn't generate a reply just now — please try rephrasing your question.";

    // Log the turn for Thomas's admin panel. Best-effort — never let a logging
    // failure break the customer-facing chat.
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
    console.error("[chat] Anthropic error:", e);
    return NextResponse.json(
      { error: "Chat is temporarily unavailable. Please try again in a moment." },
      { status: 502 }
    );
  }
}
