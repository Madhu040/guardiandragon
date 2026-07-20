import type { CompanionRequest, CompanionResponse } from "../types/index.js";
import showcaseBundle from "../../content/demo/showcase.bundle.json";
import { insightForStep } from "../counselor/insights.js";
import { scoreTypedResponse } from "../counselor/typedScoring.js";
import { filterInput } from "../safety/filters.js";
import { fallbackLine } from "./fallbackLines.js";
import { appConfig } from "../config/app.js";

/**
 * Hooks the caller can pass per-request. `onRetry` fires once, *before* the single
 * auto-retry, so the companion can say something in-character while the retry is in
 * flight (spec §17D).
 */
export interface CompanionRequestHooks {
  onRetry?: () => void;
}

export interface CompanionClient {
  request(req: CompanionRequest, hooks?: CompanionRequestHooks): Promise<CompanionResponse>;
}

/** Thrown when both the initial call and the single auto-retry fail. */
export class CompanionUnavailableError extends Error {
  constructor(cause?: unknown) {
    super("Companion unavailable after retry");
    this.name = "CompanionUnavailableError";
    this.cause = cause;
  }
}

export class LiveCompanionClient implements CompanionClient {
  constructor(
    private apiUrl: string,
    private token?: string,
    private retryDelayMs = appConfig.timing.companionRetryDelayMs,
  ) {}

  /**
   * Spec §17D: on failure the proxy **auto-retries once**; if it still fails the caller
   * falls to a hand-authored fallback line and continues. A raw error or an endless
   * spinner must never reach the child.
   */
  async request(req: CompanionRequest, hooks?: CompanionRequestHooks): Promise<CompanionResponse> {
    try {
      return await this.attempt(req);
    } catch (first) {
      hooks?.onRetry?.();
      if (this.retryDelayMs > 0) {
        await new Promise((r) => setTimeout(r, this.retryDelayMs));
      }
      try {
        return await this.attempt(req);
      } catch {
        throw new CompanionUnavailableError(first);
      }
    }
  }

  private async attempt(req: CompanionRequest): Promise<CompanionResponse> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (this.token) headers.Authorization = `Bearer ${this.token}`;

    const res = await fetch(`${this.apiUrl}/api/companion`, {
      method: "POST",
      headers,
      body: JSON.stringify(req),
    });

    if (!res.ok) throw new Error(`Companion request failed (${res.status})`);
    return (await res.json()) as CompanionResponse;
  }
}

export class DemoCompanionClient implements CompanionClient {
  async request(req: CompanionRequest): Promise<CompanionResponse> {
    await new Promise((r) => setTimeout(r, appConfig.timing.demoCompanionDelayMs));

    // Safety filter FIRST, mirroring the server's `/api/companion` order. Demo mode used to
    // score typed text without ever calling `filterInput`, so distress/PII/jailbreak input
    // was silently scored as an ordinary answer with no network path to catch it — the one
    // mode guaranteed to be running on stage was the one without the filter.
    const inputCheck = filterInput(req.childInput ?? "");
    if (!inputCheck.allowed) {
      const insight = insightForStep(req.decisionPointId, "partial");
      return {
        scoreBand: "partial",
        skill: "empathy",
        confidence: 1,
        companionLine: fallbackLine(req.decisionPointId, "safety"),
        counselorInsight: insight.forChild,
        parentTip: insight.forParent,
        redirect: true,
        safetyFlag: inputCheck.safetyFlag,
      };
    }

    const score = scoreTypedResponse(req.childInput, req.typedRubricRef);
    const band = score.band;
    const key = `${req.sceneId}:${req.decisionPointId}:${band}`;
    const bundle = showcaseBundle as {
      responses: Record<string, CompanionResponse>;
    };

    const canned = bundle.responses[key];
    const insight = insightForStep(req.decisionPointId, band);

    if (canned) {
      return {
        ...canned,
        matchedCriterion: score.matchedCriterion ?? canned.matchedCriterion,
        counselorInsight: insight.forChild,
        parentTip: insight.forParent,
      };
    }

    return {
      scoreBand: band,
      skill: insight.skillFocus === "general" ? "empathy" : insight.skillFocus,
      matchedCriterion: score.matchedCriterion,
      confidence: 1,
      companionLine: insight.forChild.slice(0, 140),
      counselorInsight: insight.forChild,
      parentTip: insight.forParent,
      redirect: false,
      safetyFlag: "none",
    };
  }
}
