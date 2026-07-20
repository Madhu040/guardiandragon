import type {
  DecisionPoint,
  GameState,
  Scene,
  ScenePhase,
  ScoreBand,
} from "../types/index.js";
import {
  CHAPTER_COMPLETE_DECISION,
  getDecisionPoint,
  getScene,
  MULTI_TAP_REQUIRED,
} from "../content/index.js";
import { DecisionResolver } from "./DecisionResolver.js";
import type { CompanionClient } from "../companion/CompanionClient.js";
import { API_RETRY_LINE, fallbackLine } from "../companion/fallbackLines.js";
import type { ProgressStore } from "../types/index.js";
import { insightForStep } from "../counselor/insights.js";
import { appConfig } from "../config/app.js";

export interface EngineCallbacks {
  onPhaseChange: (phase: ScenePhase) => void;
  onSceneChange: (sceneId: string) => void;
  onCompanionLine: (line: string) => void;
  onCounselorInsight: (insight: {
    child: string;
    parent: string;
    title: string;
    together?: string;
  }) => void;
  onMeterJuice: (skill: string) => void;
  /** Fires for every resolved decision, before the strong-only onMeterJuice (spec §17B.4). */
  onDecisionBand: (band: ScoreBand) => void;
  onCelebration: () => void;
  onError: (message: string) => void;
}

export class SceneEngine {
  private phase: ScenePhase = "loading";
  private inputFrozen = false;
  private resolver = new DecisionResolver();
  private multiTapCounts: Record<string, number> = {};

  constructor(
    private state: GameState,
    private store: ProgressStore,
    private companion: CompanionClient,
    private callbacks: EngineCallbacks,
  ) {}

  getPhase(): ScenePhase { return this.phase; }
  getState(): GameState { return this.state; }
  isInputFrozen(): boolean { return this.inputFrozen; }

  async loadScene(sceneId: string): Promise<Scene | null> {
    this.setPhase("loading");
    const scene = getScene(sceneId);
    if (!scene) {
      this.callbacks.onError("Scene not found");
      return null;
    }
    this.state.progress.currentSceneId = sceneId;
    this.state.profile.chapterId = scene.chapterId;
    await this.store.save(this.state);

    // Auto-advance narration-only scenes — unless a finish-advance stage object
    // exists, in which case the player walks to it instead.
    const hasAdvanceObject = (scene.objects ?? []).some(
      (o) => o.interaction.kind === "finish" && o.interaction.mode === "advance",
    );
    if (!scene.decisionPoints.length && scene.nextSceneId && !hasAdvanceObject) {
      this.setPhase("exploring");
      this.callbacks.onSceneChange(sceneId);
      setTimeout(() => { void this.loadScene(scene.nextSceneId!); }, appConfig.timing.narrationAutoAdvanceMs);
      return scene;
    }

    this.setPhase("exploring");
    this.callbacks.onSceneChange(sceneId);
    return scene;
  }

  getCurrentScene(): Scene | null {
    return getScene(this.state.progress.currentSceneId) ?? null;
  }

  startDecision(decisionPointId: string): void {
    const dp = getDecisionPoint(decisionPointId);
    if (!dp) return;
    this.setPhase("encounter");
    setTimeout(() => this.setPhase("decision"), 300);
  }

  async submitChoice(
    decisionPointId: string,
    optionId: string,
    parentReflection?: string,
  ): Promise<void> {
    const dp = getDecisionPoint(decisionPointId);
    if (!dp) return;

    const band = this.resolver.resolveChoice(dp, optionId);
    const option = dp.options?.find((o) => o.id === optionId);

    const requiredTaps = MULTI_TAP_REQUIRED[decisionPointId];
    if (requiredTaps) {
      this.multiTapCounts[decisionPointId] = (this.multiTapCounts[decisionPointId] ?? 0) + 1;
      const taps = this.multiTapCounts[decisionPointId];
      const isFinalOption = band === "strong";
      if (taps < requiredTaps && !isFinalOption) {
        const progressLine =
          decisionPointId === "dp_breathe"
            ? `Kindness ${taps}… Flicker's color returns.`
            : decisionPointId === "dp_crossing"
              ? `Step ${taps}… still nervous, still going.`
              : `Step ${taps} — keep going!`;
        this.callbacks.onCompanionLine(progressLine);
        this.emitInsight(dp, "partial");
        return;
      }
    }

    await this.fetchCompanionFeedback(dp, option?.label ?? optionId, band, parentReflection);
    await this.resolveDecision(dp, band, optionId);
  }

  async submitTyped(
    decisionPointId: string,
    text: string,
    parentReflection?: string,
  ): Promise<void> {
    const dp = getDecisionPoint(decisionPointId);
    if (!dp) return;

    this.setPhase("awaitingCompanion");
    this.freezeInput(true);

    try {
      const response = await this.companion.request(
        this.buildCompanionRequest(dp, text, "typed", parentReflection),
        this.retryHooks(),
      );
      this.state.flags.lastSafetyFlag = response.safetyFlag;
      this.callbacks.onCompanionLine(response.companionLine);
      if (response.counselorInsight || response.parentTip) {
        this.emitCounselorFromResponse(dp, response);
      } else {
        this.emitInsight(dp, response.scoreBand);
      }
      await this.resolveDecision(dp, response.scoreBand, undefined, response.skill);
    } catch {
      // §17D: the retry has already happened and still failed. Fall to the hand-authored
      // line for this decision (§17B.9 guard 3) and keep the story moving — never a raw
      // error, never a dead end.
      this.callbacks.onCompanionLine(fallbackLine(dp.id, "timeout"));
      this.emitInsight(dp, "partial");
      await this.resolveDecision(dp, "partial");
    } finally {
      this.freezeInput(false);
    }
  }

  private async fetchCompanionFeedback(
    dp: DecisionPoint,
    childInput: string,
    fallbackBand: ScoreBand,
    parentReflection?: string,
  ): Promise<void> {
    this.setPhase("awaitingCompanion");
    this.freezeInput(true);
    try {
      const response = await this.companion.request(
        this.buildCompanionRequest(dp, childInput, "choice", parentReflection),
        this.retryHooks(),
      );
      this.callbacks.onCompanionLine(response.companionLine);
      if (response.counselorInsight || response.parentTip) {
        this.emitCounselorFromResponse(dp, response);
      } else {
        this.emitInsight(dp, fallbackBand);
      }
    } catch {
      // Same §17D path as submitTyped: authored copy, not a generated or generic string.
      this.emitInsight(dp, fallbackBand);
      this.callbacks.onCompanionLine(fallbackLine(dp.id, fallbackBand));
    } finally {
      this.freezeInput(false);
    }
  }

  /**
   * Spec §17D — while the single auto-retry is in flight, the companion says something
   * in-character rather than the child watching a spinner. The engine stays in
   * `awaitingCompanion` with input frozen (§17B.9 guard 1) throughout.
   */
  private retryHooks() {
    return {
      onRetry: () => this.callbacks.onCompanionLine(API_RETRY_LINE),
    };
  }

  private buildCompanionRequest(
    dp: DecisionPoint,
    childInput: string,
    inputMode: "choice" | "typed",
    parentReflection?: string,
  ) {
    const together = this.state.flags.playMode === "together";
    return {
      decisionPointId: dp.id,
      sceneId: this.state.progress.currentSceneId,
      chapterId: this.state.profile.chapterId,
      ageBand: this.state.profile.ageBand,
      inputMode,
      childInput,
      companionContext: dp.companionContext,
      companion: {
        name: this.state.profile.companionName,
        archetype: this.state.profile.companionArchetype,
      },
      ...(dp.typedRubricRef ? { typedRubricRef: dp.typedRubricRef } : {}),
      ...(together ? { playMode: "together" as const } : {}),
      ...(together && parentReflection ? { parentReflection } : {}),
    };
  }

  private emitCounselorFromResponse(
    dp: DecisionPoint,
    response: { counselorInsight?: string; parentTip?: string; companionLine: string; scoreBand: ScoreBand },
  ): void {
    const local = insightForStep(dp.id, response.scoreBand);
    this.callbacks.onCounselorInsight({
      title: this.state.flags.playMode === "together" ? "Together reflection" : "Counselor insight",
      child: response.counselorInsight ?? response.companionLine,
      parent: response.parentTip ?? "",
      together: this.state.flags.playMode === "together" ? local.practiceTip : undefined,
    });
  }

  private emitInsight(dp: DecisionPoint, band: ScoreBand): void {
    const insight = insightForStep(dp.id, band);
    this.callbacks.onCounselorInsight({
      title: insight.title,
      child: insight.forChild,
      parent: insight.forParent,
      together: this.state.flags.playMode === "together" ? insight.practiceTip : undefined,
    });
  }

  private async resolveDecision(
    dp: DecisionPoint,
    band: ScoreBand,
    _optionId?: string,
    skill?: string,
  ): Promise<void> {
    this.setPhase("consequence");
    this.callbacks.onDecisionBand(band);
    const { nextSceneId, repairAction } = this.resolver.applyConsequence(this.state, dp, band);

    if (band === "strong") {
      this.callbacks.onMeterJuice(skill ?? dp.selSkills[0] ?? "empathy");
    }

    if (repairAction) {
      const repairLine =
        dp.id === "dp_choose_path"
          ? "I'm not broken — I care a lot. Can we try a thank-you instead?"
          : dp.id === "dp_fact_sort"
            ? "Yanking made more flowers. Let's try looking with the magnifying glass instead."
            : "Let's try a kinder way together.";
      this.callbacks.onCompanionLine(repairLine);
      this.setPhase("decision");
      return;
    }

    await this.store.save(this.state);

    const chapterId = this.state.profile.chapterId;
    const requiredTaps = MULTI_TAP_REQUIRED[dp.id] ?? 0;
    const tapsDone = this.multiTapCounts[dp.id] ?? 0;
    const isFinaleDecision =
      CHAPTER_COMPLETE_DECISION[chapterId] === dp.id &&
      band === "strong" &&
      (requiredTaps === 0 || tapsDone >= requiredTaps);

    if (isFinaleDecision) {
      if (!this.state.progress.chaptersCompleted.includes(chapterId)) {
        this.state.progress.chaptersCompleted.push(chapterId);
      }
      await this.store.save(this.state);
      this.callbacks.onCelebration();
      return;
    }

    if (nextSceneId !== this.state.progress.currentSceneId) {
      this.setPhase("transitioning");
      if (MULTI_TAP_REQUIRED[dp.id]) this.multiTapCounts[dp.id] = 0;
      await this.loadScene(nextSceneId);
    } else {
      this.setPhase("exploring");
    }
  }

  triggerEncounter(triggerTarget: string): void {
    this.startDecision(triggerTarget);
  }

  /** Finish-object path: jump to an explicit target scene or this scene's nextSceneId. */
  async advanceScene(targetSceneId?: string): Promise<void> {
    const next = targetSceneId ?? this.getCurrentScene()?.nextSceneId;
    if (!next || !getScene(next)) {
      this.callbacks.onError("No scene to advance to");
      return;
    }
    this.setPhase("transitioning");
    await this.loadScene(next);
  }

  /** Finish-object path: complete the whole chapter → celebration (same effect as the finale decision). */
  async completeChapter(): Promise<void> {
    const chapterId = this.state.profile.chapterId;
    if (!this.state.progress.chaptersCompleted.includes(chapterId)) {
      this.state.progress.chaptersCompleted.push(chapterId);
    }
    await this.store.save(this.state);
    this.callbacks.onCelebration();
  }

  private setPhase(phase: ScenePhase): void {
    this.phase = phase;
    this.callbacks.onPhaseChange(phase);
  }

  private freezeInput(frozen: boolean): void {
    this.inputFrozen = frozen;
  }
}
