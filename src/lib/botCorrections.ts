import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import {
  addCorrection,
  getBotKnowledge,
  setBotKnowledge,
  type BotCorrection,
} from "./adminStore";

// Turning Thomas's per-answer corrections into a single, self-structuring
// knowledge document. Instead of appending forever (which bloats and creates
// contradictions), each new correction is merged by a small model: same topic
// gets replaced, new topics get added, the whole thing stays compact and
// grouped. The result is injected into the bot's system prompt with the
// highest priority (see api/chat/route.ts).

const MERGE_MODEL = process.env.SICKMOTOS_MERGE_MODEL || "claude-haiku-4-5";

const HEADING = "# Owner corrections";

function mergePrompt(current: string, c: {
  question: string;
  wrongAnswer?: string;
  correction: string;
}): string {
  return `You maintain the shop owner's private correction knowledge for the SickMotos support bot. This document is layered on top of the base knowledge with the HIGHEST priority, so whatever it says overrides the base.

CURRENT DOCUMENT (may be empty):
"""
${current || "(empty)"}
"""

NEW CORRECTION FROM THE OWNER:
- Customer asked: ${c.question || "(unknown)"}
${c.wrongAnswer ? `- The bot wrongly answered: ${c.wrongAnswer}\n` : ""}- The owner says the correct answer / rule is: ${c.correction}

Rewrite and return the FULL updated document following these rules:
- Keep it a concise Markdown document grouped by topic with "## Topic" sections and short bullet rules or Q/A lines.
- If the new correction concerns a topic already present, REPLACE the outdated information with the corrected version. Do not keep the old wrong statement.
- If it is a new topic, add a new bullet or section in the right place.
- CRITICAL, NEVER LOSE INFORMATION: every distinct rule, fact, price, discount code,
  part name, link, or model-specific detail already in the current document MUST remain
  in your output. Do NOT drop, shorten away, or summarize out any existing content to
  save space. The only things you may remove are EXACT duplicates and information the
  new correction explicitly overrides as outdated.
- Merge exact duplicates into one clear statement, but keep every unique detail.
- Never contradict yourself. The newest correction always wins on the same specific point.
- Write the rules as direct instructions/answers the bot should follow, in the language the owner used.
- Do not include meta commentary, the customer question, or the word "correction". Output ONLY the document, starting with the line "${HEADING}".`;
}

// Merge a single correction into the stored knowledge doc. Best-effort: if the
// API is unavailable, we still keep the raw correction (audit) and fall back to
// a plain append so nothing is lost.
export async function applyCorrection(input: {
  question: string;
  wrongAnswer?: string;
  correction: string;
  chatId?: string;
}): Promise<{ ok: boolean; doc: string; entry: BotCorrection; error?: string }> {
  const entry = await addCorrection({
    question: input.question,
    wrongAnswer: input.wrongAnswer,
    correction: input.correction,
    chatId: input.chatId,
  });

  const current = await getBotKnowledge();
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    const doc = appendFallback(current, input.correction);
    await setBotKnowledge(doc);
    return { ok: true, doc, entry, error: "no_api_key_used_append" };
  }

  try {
    const client = new Anthropic({ apiKey });
    const res = await client.messages.create({
      model: MERGE_MODEL,
      // High enough that the merged doc never has to drop existing corrections to
      // fit. The doc stays small in practice, this is just headroom so nothing is lost.
      max_tokens: 4000,
      messages: [{ role: "user", content: mergePrompt(current, input) }],
    });
    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
    const doc = text.startsWith(HEADING) ? text : `${HEADING}\n\n${text}`;
    await setBotKnowledge(doc);
    return { ok: true, doc, entry };
  } catch (e) {
    // Don't lose the correction: fall back to a plain append.
    const doc = appendFallback(current, input.correction);
    await setBotKnowledge(doc);
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: true, doc, entry, error: `merge_failed_appended: ${msg}` };
  }
}

function appendFallback(current: string, correction: string): string {
  const base = current || HEADING;
  return `${base}\n- ${correction.replace(/\s+/g, " ").trim()}`;
}
