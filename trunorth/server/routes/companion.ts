import { Hono } from "hono";
import Anthropic from "@anthropic-ai/sdk";
import fallbacks from "../../content/fallbacks/companion-fallbacks.json";
import { filterInput, filterOutput } from "../../src/safety/filters.js";
import { insightForStep } from "../../src/counselor/insights.js";
import { serverConfig } from "../config.js";
import type {
  CompanionRequest,
  CompanionResponse,
  ScoreBand,
  SkillId,
} from "../../src/types/index.js";

const { confidenceFloor: CONFIDENCE_FLOOR, timeoutMs: TIMEOUT_MS, model: COMPANION_MODEL, apiKey } =
  serverConfig.companion;

const companion = new Hono();

companion.post("/companion", async (c) => {
  const req = await c.req.json<CompanionRequest>();

  if (!req.decisionPointId || !req.sceneId) {
    return c.json({ error: "decisionPointId and sceneId required" }, 400);
  }

  const inputCheck = filterInput(req.childInput ?? "");
  if (!inputCheck.allowed) {
    const line = getFallback(req.decisionPointId, "safety");
    const insight = insightForStep(req.decisionPointId, "partial");
    const response: CompanionResponse = {
      scoreBand: "partial",
      skill: "empathy",
      confidence: 1,
      companionLine: line,
      counselorInsight: insight.forChild,
      parentTip: insight.forParent,
      redirect: true,
      safetyFlag: inputCheck.safetyFlag,
    };
    return c.json(response);
  }

  if (!apiKey) {
    return c.json(scoreLocally(req));
  }

  try {
    const client = new Anthropic({ apiKey });
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const message = await client.messages.create({
      model: COMPANION_MODEL,
      max_tokens: 420,
      system: buildSystemPrompt(req),
      messages: [{
        role: "user",
        content: req.parentReflection
          ? `Child/family choice: ${req.childInput}\nParent reflection: ${req.parentReflection}`
          : req.childInput,
      }],
    }, { signal: controller.signal });

    clearTimeout(timer);

    const text = message.content[0]?.type === "text" ? message.content[0].text : "";
    const parsed = parseModelResponse(text, req);

    if (!filterOutput(parsed.companionLine) || (parsed.counselorInsight && !filterOutput(parsed.counselorInsight))) {
      parsed.companionLine = getFallback(req.decisionPointId, "safety");
      parsed.safetyFlag = "off_topic";
    }

    if (parsed.confidence < CONFIDENCE_FLOOR) {
      parsed.scoreBand = "partial";
      parsed.companionLine = getFallback(req.decisionPointId, "partial");
    }

    enrichWithLocalInsight(parsed, req);
    return c.json(parsed);
  } catch {
    return c.json(scoreLocally(req, "timeout"));
  }
});

companion.post("/reflect", async (c) => {
  const body = await c.req.json<{
    events?: Array<{ decisionPointId: string; scoreBand: ScoreBand }>;
    companionName?: string;
  }>();

  const events = body.events ?? [];
  const insights = events.map((e) => insightForStep(e.decisionPointId, e.scoreBand));

  return c.json({
    role: "sel_counselor_coach",
    disclaimer:
      "Supportive SEL coaching only — not a clinical diagnosis or substitute for licensed therapy.",
    insights,
    parentCoaching: insights.map((i) => i.forParent),
    practiceTips: insights.map((i) => i.practiceTip),
  });
});

function buildSystemPrompt(req: CompanionRequest): string {
  const together = req.playMode === "together";
  const parentCtx = req.parentReflection
    ? `\n- Parent reflection on the discussion: ${req.parentReflection}`
    : "";

  return `You are ${req.companion.name}, a warm SEL companion in TruNorth, speaking with the supportive tone of a child counselor / play therapist — WITHOUT diagnosing, labeling disorders, prescribing treatment, or replacing licensed care.

Boundaries (strict):
- Stay inside the current decision point only. No open chat.
- Never request PII, encourage secrecy from caregivers, or suggest real-world meetups.
- Never give medical/clinical advice.
- Use validating, growth-oriented language (feelings, skills, repair, bravery).
${together ? "- This is TOGETHER MODE: parent and child are playing side by side. Speak to both. Encourage their joint discussion. parentTip should coach the parent on how to reinforce the skill during co-play, not after the fact." : ""}

Context:
- Age band: ${req.ageBand}
- Situation: ${req.companionContext.situation}
- NPC emotion: ${req.companionContext.npcEmotion ?? "unknown"}${parentCtx}

Respond ONLY with JSON:
{
  "scoreBand":"strong|partial|poor",
  "skill":"empathy|calm|courage|worry_brave|self_worth|adapting_to_change|friendship_repair",
  "confidence":0.0-1.0,
  "companionLine":"max 120 chars, child-facing, warm${together ? " (may acknowledge parent+child teamwork)" : ""}",
  "counselorInsight":"2-3 sentences of reflective insight for the child (supportive, non-clinical)",
  "parentTip":"1-2 sentences coaching the parent on how to reinforce this skill ${together ? "together during play" : "at home"}",
  "redirect":false,
  "safetyFlag":"none"
}`;
}

function parseModelResponse(text: string, req: CompanionRequest): CompanionResponse {
  try {
    const json = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? "{}");
    return {
      scoreBand: json.scoreBand ?? "partial",
      skill: json.skill ?? "empathy",
      confidence: json.confidence ?? 0.7,
      companionLine: (json.companionLine ?? getFallback(req.decisionPointId, "partial")).slice(0, 120),
      counselorInsight: json.counselorInsight?.slice(0, 400),
      parentTip: json.parentTip?.slice(0, 300),
      redirect: json.redirect ?? false,
      safetyFlag: json.safetyFlag ?? "none",
    };
  } catch {
    return scoreLocally(req);
  }
}

function enrichWithLocalInsight(parsed: CompanionResponse, req: CompanionRequest): void {
  const local = insightForStep(req.decisionPointId, parsed.scoreBand);
  if (!parsed.counselorInsight) parsed.counselorInsight = local.forChild;
  if (!parsed.parentTip) parsed.parentTip = local.forParent;
}

function scoreLocally(req: CompanionRequest, mode: "normal" | "timeout" = "normal"): CompanionResponse {
  const text = (req.childInput ?? "").toLowerCase();
  let band: ScoreBand = "partial";
  if (
    text.includes("scared") || text.includes("together") || text.includes("okay") ||
    text.includes("feel") || text.includes("breath") || text.includes("invite") ||
    text.includes("room for") || text.includes("check in") || text.includes("rematch")
  ) {
    band = "strong";
  } else if (
    text.includes("just") || text.includes("hurry") || text.includes("already") ||
    text.includes("dramatic") || text.includes("pretend") || text.includes("don't tell") ||
    text.includes("ruined")
  ) {
    band = "poor";
  }

  const insight = insightForStep(req.decisionPointId, band);
  return {
    scoreBand: band,
    skill: (insight.skillFocus === "general" ? "empathy" : insight.skillFocus) as SkillId,
    confidence: mode === "timeout" ? 1 : 0.88,
    companionLine: mode === "timeout"
      ? getFallback(req.decisionPointId, "timeout")
      : insight.forChild.slice(0, 120),
    counselorInsight: insight.forChild,
    parentTip: insight.forParent,
    redirect: false,
    safetyFlag: "none",
  };
}

function getFallback(decisionPointId: string, band: string): string {
  const fb = fallbacks as Record<string, Record<string, string>>;
  return fb[decisionPointId]?.[band] ?? "You're doing your best — let's keep going together.";
}

export { companion as companionRoutes };
