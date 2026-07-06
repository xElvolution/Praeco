// Isolate the structured-output call. Usage: node --env-file=.env.local scripts/test-claude.mjs
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();
const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    plan: { type: "string" },
    picks: { type: "array", items: { type: "string" } },
  },
  required: ["plan", "picks"],
};

try {
  const msg = await anthropic.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 1000,
    thinking: { type: "adaptive" },
    output_config: { effort: "high", format: { type: "json_schema", schema: SCHEMA } },
    messages: [{ role: "user", content: "Pick 2 of: apples, time, mushrooms, money — for a topic about value. Return plan + picks." }],
  });
  console.log("stop_reason:", msg.stop_reason);
  console.log("content types:", msg.content.map((b) => b.type).join(", "));
  for (const b of msg.content) {
    if (b.type === "text") console.log("TEXT >>>", b.text.slice(0, 300));
  }
} catch (e) {
  console.log("ERROR:", e.constructor.name, "-", e.message?.slice(0, 300));
  if (e.status) console.log("status:", e.status);
}
