import type { CompanionRequest, CompanionResponse, ScoreBand } from "../types/index.js";
import showcaseBundle from "../../content/demo/showcase.bundle.json";
import { insightForStep } from "../counselor/insights.js";
import { appConfig } from "../config/app.js";

export interface CompanionClient {
  request(req: CompanionRequest): Promise<CompanionResponse>;
}

export class LiveCompanionClient implements CompanionClient {
  constructor(private apiUrl: string, private token?: string) {}

  async request(req: CompanionRequest): Promise<CompanionResponse> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (this.token) headers.Authorization = `Bearer ${this.token}`;

    const res = await fetch(`${this.apiUrl}/api/companion`, {
      method: "POST",
      headers,
      body: JSON.stringify(req),
    });

    if (!res.ok) throw new Error("Companion request failed");
    return res.json() as Promise<CompanionResponse>;
  }
}

export class DemoCompanionClient implements CompanionClient {
  async request(req: CompanionRequest): Promise<CompanionResponse> {
    await new Promise((r) => setTimeout(r, appConfig.timing.demoCompanionDelayMs));

    const band = inferBandFromInput(req);
    const key = `${req.sceneId}:${req.decisionPointId}:${band}`;
    const bundle = showcaseBundle as {
      responses: Record<string, CompanionResponse>;
    };

    const canned = bundle.responses[key];
    const insight = insightForStep(req.decisionPointId, band);

    if (canned) {
      return {
        ...canned,
        counselorInsight: insight.forChild,
        parentTip: insight.forParent,
      };
    }

    return {
      scoreBand: band,
      skill: insight.skillFocus === "general" ? "empathy" : insight.skillFocus,
      confidence: 1,
      companionLine: insight.forChild.slice(0, 140),
      counselorInsight: insight.forChild,
      parentTip: insight.forParent,
      redirect: false,
      safetyFlag: "none",
    };
  }
}

function inferBandFromInput(req: CompanionRequest): ScoreBand {
  const text = req.childInput.toLowerCase();
  if (
    text.includes("scared") ||
    text.includes("together") ||
    text.includes("okay") ||
    text.includes("invite") ||
    text.includes("breath") ||
    text.includes("room for you") ||
    text.includes("check in") ||
    text.includes("rematch") ||
    text.includes("first step")
  ) {
    return "strong";
  }
  if (
    text.includes("just") ||
    text.includes("hurry") ||
    text.includes("already") ||
    text.includes("dramatic") ||
    text.includes("pretend") ||
    text.includes("don't tell") ||
    text.includes("ruined") ||
    text.includes("don't play")
  ) {
    return "poor";
  }
  return "partial";
}
