import type { DecisionPoint, DialogRecord, GameState, Scene, ScenePhase } from "../types/index.js";
import { getDecisionPoint, getDialog } from "../content/index.js";
import { objectSprite, objectWorldPos, sceneObjects } from "../content/stageObjects.js";
import { renderFullBodyCharacter } from "../render/characters.js";
import type { JourneyReflection } from "../counselor/insights.js";
import { discussPrompt } from "../counselor/coPlay.js";
import { zoneFromBackground, zoneForChapter } from "../content/zones.js";
import { isGridDebug, resolveGridLevel } from "../content/gridLevels.js";
import { renderGridBackground } from "../render/gridBackground.js";
import { contentConfig } from "../config/content.js";
import { isSpeechSupported, isVoiceEnabled, setVoiceEnabled, speakLine, stopSpeaking } from "../audio/speech.js";

export interface CounselorPanelData {
  title: string;
  child: string;
  parent: string;
  together?: string;
}

export type CoPlayStep = "discuss" | "choose";

/** Currently open stage-object dialog (id + page index), owned by `main.ts`. */
export interface DialogViewState {
  id: string;
  page: number;
}

export function renderGameView(
  container: HTMLElement,
  state: GameState,
  scene: Scene | null,
  phase: ScenePhase,
  companionLine: string | null,
  activeDecisionId: string | null,
  counselor: CounselorPanelData | null,
  onChoice: (dpId: string, optionId: string, parentReflection?: string) => void,
  onTyped: (dpId: string, text: string, parentReflection?: string) => void,
  onTrigger: (target: string) => void,
  togetherMode = false,
  coPlayStep: CoPlayStep = "discuss",
  onCoPlayReady?: () => void,
  onWorldReady?: (viewport: HTMLElement, scene: Scene, exploring: boolean) => void,
  onObject?: (objectId: string) => void,
  dialogState: DialogViewState | null = null,
  onDialogNext?: () => void,
  onDialogClose?: () => void,
): void {
  container.innerHTML = "";

  const root = document.createElement("div");
  root.className = "game-root";

  const viewport = document.createElement("div");
  viewport.className = "game-viewport";
  viewport.setAttribute("role", "main");
  viewport.setAttribute("aria-label", "TruNorth game scene");

  if (state.flags.demoMode) {
    const pill = document.createElement("div");
    pill.className = "demo-pill";
    pill.textContent = "Demo Mode";
    viewport.appendChild(pill);
  }

  if (togetherMode) {
    const togetherPill = document.createElement("div");
    togetherPill.className = "together-pill";
    togetherPill.textContent = "Playing Together";
    viewport.appendChild(togetherPill);
  }

  const brownie = document.createElement("div");
  brownie.className = "brownie-counter crystal-counter";
  brownie.setAttribute("aria-label", `Crystals collected: ${state.progress.browniePoints}`);
  brownie.textContent = `💎 ${state.progress.browniePoints}`;
  viewport.appendChild(brownie);

  const gridLevel = scene ? resolveGridLevel(scene) : null;

  // A scene can recast the follower companion (ch2: Wize guides while Flicker
  // blocks the bridge) — show that cast's name, not the profile's.
  const companionName = scene?.characters
    .find((c) => c.id === "companion")
    ?.assetRef.includes("wize")
    ? "Wize"
    : state.profile.companionName;

  const stageTag = document.createElement("div");
  stageTag.className = "stage-tag";
  const zone = scene ? (zoneFromBackground(scene.background) ?? zoneForChapter(scene.chapterId)) : null;
  stageTag.textContent = gridLevel?.name ?? zone?.name ?? "SCENE";
  viewport.appendChild(stageTag);

  const hud = document.createElement("div");
  hud.className = "hud";
  hud.setAttribute("role", "group");
  hud.setAttribute("aria-label", "Skill meters");
  for (const skill of ["empathy", "calm", "courage"] as const) {
    const meter = document.createElement("div");
    meter.className = "meter";
    meter.setAttribute("aria-label", `${skill} level ${state.meters[skill].level}`);
    const icons: Record<string, string> = { empathy: "❤️", calm: "🌊", courage: "⭐" };
    meter.textContent = icons[skill] ?? "●";
    hud.appendChild(meter);
  }
  viewport.appendChild(hud);

  if (isSpeechSupported()) {
    const voiceToggle = document.createElement("button");
    voiceToggle.className = "voice-toggle";
    const syncVoiceToggle = () => {
      const on = isVoiceEnabled();
      voiceToggle.textContent = on ? "🔊" : "🔇";
      voiceToggle.setAttribute("aria-label", on ? "Turn companion voice off" : "Turn companion voice on");
      voiceToggle.setAttribute("aria-pressed", String(on));
    };
    syncVoiceToggle();
    voiceToggle.onclick = () => {
      setVoiceEnabled(!isVoiceEnabled());
      syncVoiceToggle();
    };
    viewport.appendChild(voiceToggle);
  }

  if (scene) {
    const zoneMeta = zoneFromBackground(scene.background) ?? zoneForChapter(scene.chapterId);
    if (gridLevel) {
      renderGridBackground(viewport, gridLevel, isGridDebug());
    } else {
      const bg = document.createElement("div");
      const legacyClass = scene.background.includes("treehouse")
        ? "treehouse"
        : scene.background.includes("classroom")
          ? "classroom"
          : scene.background.includes("playground")
            ? "playground"
            : "";
      bg.className = `scene-bg zone-${zoneMeta.id}${legacyClass ? ` ${legacyClass}` : ""}`;
      bg.style.backgroundImage = `url(${zoneMeta.image})`;
      viewport.appendChild(bg);
    }

    const sign = document.createElement("div");
    sign.className = "zone-sign";
    sign.textContent = gridLevel?.name ?? zoneMeta.name;
    viewport.appendChild(sign);

    for (const ch of scene.characters) {
      const el = document.createElement("div");
      el.className = "character full-body";
      el.dataset.charId = ch.id;
      const [x, y] = ch.position;
      el.style.left = `${(x / 1920) * 100}%`;
      el.style.top = `${(y / 1080) * 100}%`;
      el.style.zIndex = String(10 + Math.floor(y / 20));
      el.style.setProperty("--char-size", ch.id === "worry_cloud" ? "120" : "110");

      const sprite = document.createElement("div");
      sprite.className = `char-fullbody ${ch.id}${
        ch.expression?.includes("glow") || ch.expression?.includes("excited") ? " glow" : ""
      }`;
      sprite.innerHTML = renderFullBodyCharacter({
        id: ch.id,
        assetRef: ch.assetRef,
        expression: ch.expression,
        skinTone: state.profile.avatar.skinTone,
        companionArchetype: state.profile.companionArchetype,
        size: ch.id === "worry_cloud" ? 120 : 110,
      });
      el.appendChild(sprite);

      const label = document.createElement("div");
      label.className = "char-label";
      label.textContent =
        ch.id === "companion"
          ? companionName
          : ch.id === "avatar"
            ? "You"
            : ch.id === "wize"
              ? "Wize"
              : ch.id === "leftout"
                ? "Friend"
                : ch.id === "hothead"
                  ? "Friend"
                  : ch.id === "grownup"
                    ? "Grown-up"
                    : ch.id === "helper_bear"
                      ? "Bear"
                      : ch.id === "helper_deer"
                        ? "Deer"
                        : ch.id === "worry_cloud"
                          ? ""
                          : ch.id === "robin"
                            ? "Fox"
                            : ch.id.charAt(0).toUpperCase() + ch.id.slice(1);
      if (label.textContent) el.appendChild(label);

      if (companionLine && ch.id === "companion" && (phase === "consequence" || phase === "awaitingCompanion")) {
        const bubble = document.createElement("div");
        bubble.className = "bubble";
        bubble.textContent = companionLine;
        el.appendChild(bubble);
        // A speaking character (and its bubble) must never be hidden behind
        // other characters (z up to ~64) or the counselor panel (z 70).
        el.style.zIndex = "75";
      }

      viewport.appendChild(el);
    }

    for (const item of scene.collectibles) {
      const spark = document.createElement("div");
      spark.className = "world-collectible";
      spark.dataset.collectibleId = item.id;
      spark.style.left = `${(item.position[0] / 1920) * 100}%`;
      spark.style.top = `${(item.position[1] / 1080) * 100}%`;
      spark.setAttribute("aria-label", "Kindness spark");
      spark.textContent = "✨";
      viewport.appendChild(spark);
    }

    for (const obj of sceneObjects(scene)) {
      const exploring = phase === "exploring";
      const el = document.createElement(exploring ? "button" : "div");
      el.className = "stage-object";
      el.dataset.objectId = obj.id;
      const pos = objectWorldPos(obj);
      el.style.left = `${(pos.x / 1920) * 100}%`;
      el.style.top = `${(pos.y / 1080) * 100}%`;
      el.style.zIndex = String(10 + Math.floor(pos.y / 20));
      el.setAttribute("aria-label", obj.label ?? obj.hint ?? "Stage object");

      const sprite = document.createElement("span");
      sprite.className = "stage-object-sprite";
      sprite.textContent = objectSprite(obj.assetRef);
      el.appendChild(sprite);

      if (obj.label) {
        const label = document.createElement("span");
        label.className = "char-label";
        label.textContent = obj.label;
        el.appendChild(label);
      }

      if (exploring && onObject) {
        (el as HTMLButtonElement).onclick = () => onObject(obj.id);
      }
      viewport.appendChild(el);
    }

    if (phase === "exploring") {
      for (const trigger of scene.triggers) {
        const zone = document.createElement("button");
        zone.className = "trigger-zone";
        zone.dataset.target = trigger.target;
        zone.setAttribute("aria-label", "Interact with hot spot");
        const [x, y, w, h] = trigger.bounds;
        zone.style.left = `${(x / 1920) * 100}%`;
        zone.style.top = `${(y / 1080) * 100}%`;
        zone.style.width = `${(w / 1920) * 100}%`;
        zone.style.height = `${(h / 1080) * 100}%`;
        zone.onclick = () => onTrigger(trigger.target);
        viewport.appendChild(zone);
      }
    }

    onWorldReady?.(viewport, scene, phase === "exploring");
  }

  if (phase === "awaitingCompanion") {
    const thinking = document.createElement("div");
    thinking.className = "companion-thinking";
    thinking.textContent = `${companionName} is reflecting with you...`;
    viewport.appendChild(thinking);
  }

  root.appendChild(viewport);

  if (
    counselor &&
    (phase === "consequence" || phase === "decision" || phase === "exploring") &&
    counselorKey(counselor) !== dismissedCounselorKey
  ) {
    root.appendChild(buildCounselorPanel(counselor));
  }

  container.appendChild(root);

  if ((phase === "decision" || phase === "encounter") && activeDecisionId) {
    renderDecisionOverlay(
      container,
      activeDecisionId,
      onChoice,
      onTyped,
      togetherMode,
      coPlayStep,
      onCoPlayReady,
    );
  } else if (dialogState && getDialog(dialogState.id)) {
    renderDialogOverlay(
      container,
      getDialog(dialogState.id)!,
      dialogState.page,
      onDialogNext ?? (() => {}),
      onDialogClose ?? (() => {}),
    );
  } else {
    lastSpokenOverlayKey = null;
  }
}

/** Re-renders happen on every phase/meter update; only read each pop-up aloud once. */
let lastSpokenOverlayKey: string | null = null;

function speakOverlayOnce(key: string, text: string): void {
  if (lastSpokenOverlayKey === key) return;
  lastSpokenOverlayKey = key;
  speakLine(text);
}

/* Counselor panel drag position + dismissal live at module scope because
   renderGameView rebuilds the whole DOM on every phase/meter update. */
let counselorPanelPos: { left: number; top: number } | null = null;
let dismissedCounselorKey: string | null = null;

function counselorKey(counselor: CounselorPanelData): string {
  return `${counselor.title}|${counselor.child}|${counselor.parent}|${counselor.together ?? ""}`;
}

function buildCounselorPanel(counselor: CounselorPanelData): HTMLElement {
  const panel = document.createElement("aside");
  panel.className = "counselor-panel";
  panel.setAttribute("aria-label", "Counselor insight");
  panel.innerHTML = `
    <div class="counselor-panel-header">
      <div class="counselor-badge">SEL Coach Insight</div>
      <button class="counselor-close" type="button" aria-label="Close insight">✕</button>
    </div>
    <h3>${escapeText(counselor.title)}</h3>
    <p class="counselor-child"><strong>For you:</strong> ${escapeText(counselor.child)}</p>
    ${counselor.parent ? `<p class="counselor-parent"><strong>For grown-ups:</strong> ${escapeText(counselor.parent)}</p>` : ""}
    ${counselor.together ? `<p class="counselor-together"><strong>Try together:</strong> ${escapeText(counselor.together)}</p>` : ""}
    <p class="counselor-note">Supportive guidance — not a clinical diagnosis.</p>
  `;

  const applyPos = (left: number, top: number) => {
    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
    panel.style.right = "auto";
    panel.style.bottom = "auto";
  };
  if (counselorPanelPos) {
    // Clamp so a saved position never strands the panel fully off-screen.
    applyPos(
      Math.max(0, Math.min(counselorPanelPos.left, window.innerWidth - 80)),
      Math.max(0, Math.min(counselorPanelPos.top, window.innerHeight - 60)),
    );
  }

  const closeBtn = panel.querySelector(".counselor-close") as HTMLButtonElement;
  closeBtn.onclick = () => {
    dismissedCounselorKey = counselorKey(counselor);
    panel.remove();
  };

  const header = panel.querySelector(".counselor-panel-header") as HTMLElement;
  header.addEventListener("pointerdown", (e: PointerEvent) => {
    if ((e.target as HTMLElement).closest(".counselor-close")) return;
    e.preventDefault();
    const rect = panel.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    header.setPointerCapture(e.pointerId);
    const onMove = (ev: PointerEvent) => {
      const left = Math.max(0, Math.min(ev.clientX - offsetX, window.innerWidth - rect.width));
      const top = Math.max(0, Math.min(ev.clientY - offsetY, window.innerHeight - rect.height));
      counselorPanelPos = { left, top };
      applyPos(left, top);
    };
    const onUp = () => {
      header.removeEventListener("pointermove", onMove);
      header.removeEventListener("pointerup", onUp);
      header.removeEventListener("pointercancel", onUp);
    };
    header.addEventListener("pointermove", onMove);
    header.addEventListener("pointerup", onUp);
    header.addEventListener("pointercancel", onUp);
  });

  return panel;
}

function escapeText(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function renderDecisionOverlay(
  container: HTMLElement,
  decisionId: string,
  onChoice: (dpId: string, optionId: string, parentReflection?: string) => void,
  onTyped: (dpId: string, text: string, parentReflection?: string) => void,
  togetherMode = false,
  coPlayStep: CoPlayStep = "discuss",
  onCoPlayReady?: () => void,
): void {
  const dp = getDecisionPoint(decisionId);
  if (!dp) return;

  const overlay = document.createElement("div");
  overlay.className = "overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", togetherMode ? "Talk and choose together" : "Make a choice");

  const panel = document.createElement("div");
  panel.className = "choice-panel";

  if (togetherMode && coPlayStep === "discuss") {
    const badge = document.createElement("div");
    badge.className = "coplay-badge";
    badge.textContent = "Step 1 · Talk together";
    panel.appendChild(badge);

    const discuss = document.createElement("p");
    discuss.className = "coplay-discuss";
    discuss.textContent = discussPrompt(decisionId);
    panel.appendChild(discuss);

    const ready = document.createElement("button");
    ready.className = "btn-primary coplay-ready";
    ready.textContent = "We're ready to choose";
    ready.onclick = () => {
      stopSpeaking();
      onCoPlayReady?.();
    };
    panel.appendChild(ready);

    overlay.appendChild(panel);
    container.appendChild(overlay);
    speakOverlayOnce(`${decisionId}:discuss`, discussPrompt(decisionId));
    return;
  }

  if (togetherMode) {
    const badge = document.createElement("div");
    badge.className = "coplay-badge";
    badge.textContent = "Step 2 · Pick together";
    panel.appendChild(badge);
  }

  const title = document.createElement("h2");
  title.textContent = dp.prompt;
  panel.appendChild(title);

  let parentNote: HTMLTextAreaElement | null = null;
  if (togetherMode) {
    parentNote = document.createElement("textarea");
    parentNote.className = "typed-input coplay-parent-note";
    parentNote.placeholder = "Parent: what did you notice? (optional)";
    parentNote.setAttribute("aria-label", "Parent reflection");
    parentNote.rows = 2;
    panel.appendChild(parentNote);
  }

  if (dp.options) {
    for (const opt of dp.options) {
      const btn = document.createElement("button");
      btn.className = "choice-btn";
      btn.textContent = opt.label;
      btn.onclick = () => {
        stopSpeaking();
        onChoice(decisionId, opt.id, parentNote?.value.trim() || undefined);
      };
      panel.appendChild(btn);
    }
  }

  if (dp.inputMode === "typed" || dp.inputMode === "both") {
    const input = document.createElement("textarea");
    input.className = "typed-input";
    input.placeholder = togetherMode ? "Type what you'd say together..." : "Type what you'd say...";
    input.setAttribute("aria-label", "Type your response");
    input.rows = 2;
    panel.appendChild(input);

    const submit = document.createElement("button");
    submit.className = "typed-submit";
    submit.textContent = "Say it";
    submit.onclick = () => {
      const text = input.value.trim();
      if (text) {
        stopSpeaking();
        onTyped(decisionId, text, parentNote?.value.trim() || undefined);
      }
    };
    panel.appendChild(submit);
  }

  overlay.appendChild(panel);
  container.appendChild(overlay);
  speakOverlayOnce(`${decisionId}:choose`, buildOverlayScript(dp));
}

function renderDialogOverlay(
  container: HTMLElement,
  dialog: DialogRecord,
  pageIndex: number,
  onNext: () => void,
  onClose: () => void,
): void {
  const page = dialog.pages[Math.min(pageIndex, dialog.pages.length - 1)];
  const isLast = pageIndex >= dialog.pages.length - 1;
  const speaker = page.speaker ?? dialog.speaker;

  const overlay = document.createElement("div");
  overlay.className = "overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", speaker ? `${speaker} speaks` : "Dialog");

  const panel = document.createElement("div");
  panel.className = "choice-panel dialog-panel";

  const closeBtn = document.createElement("button");
  closeBtn.className = "dialog-close";
  closeBtn.setAttribute("aria-label", "Close dialog");
  closeBtn.textContent = "✕";
  closeBtn.onclick = () => {
    stopSpeaking();
    onClose();
  };
  panel.appendChild(closeBtn);

  if (speaker) {
    const header = document.createElement("div");
    header.className = "dialog-speaker";
    if (dialog.speakerAssetRef) {
      const portrait = document.createElement("span");
      portrait.className = "dialog-portrait";
      portrait.innerHTML = renderFullBodyCharacter({
        id: "npc",
        assetRef: dialog.speakerAssetRef,
        size: 64,
      });
      header.appendChild(portrait);
    }
    const name = document.createElement("span");
    name.className = "dialog-speaker-name";
    name.textContent = speaker;
    header.appendChild(name);
    panel.appendChild(header);
  }

  const text = document.createElement("p");
  text.className = "dialog-text";
  text.textContent = page.text;
  panel.appendChild(text);

  const footer = document.createElement("div");
  footer.className = "dialog-footer";

  if (dialog.pages.length > 1) {
    const counter = document.createElement("span");
    counter.className = "dialog-page-counter";
    counter.textContent = `${pageIndex + 1} / ${dialog.pages.length}`;
    footer.appendChild(counter);
  }

  const nextBtn = document.createElement("button");
  nextBtn.className = "btn-primary dialog-next";
  nextBtn.textContent = isLast ? "Done" : "Next";
  nextBtn.autofocus = true;
  nextBtn.onclick = () => {
    stopSpeaking();
    (isLast ? onClose : onNext)();
  };
  footer.appendChild(nextBtn);
  panel.appendChild(footer);

  overlay.appendChild(panel);
  container.appendChild(overlay);
  nextBtn.focus();
  speakOverlayOnce(
    `dialog:${dialog.id}:${pageIndex}`,
    speaker ? `${speaker} says: ${page.text}` : page.text,
  );
}

/** Spoken version of a decision pop-up: the prompt, then each option in order. */
function buildOverlayScript(dp: DecisionPoint): string {
  const parts: string[] = [dp.prompt];
  if (dp.options && dp.options.length > 0) {
    const ordinals = ["First choice", "Second choice", "Third choice", "Fourth choice"];
    parts.push("Your choices are:");
    dp.options.forEach((opt, i) => {
      parts.push(`${ordinals[i] ?? `Choice ${i + 1}`}: ${opt.label}.`);
    });
  }
  if (dp.inputMode === "typed" || dp.inputMode === "both") {
    parts.push(dp.options?.length ? "Or type your own answer." : "Type what you would say.");
  }
  return parts.join(" ");
}

export function renderCelebration(
  container: HTMLElement,
  chapterTitle: string,
  onReflect: () => void,
  onHub: () => void,
): void {
  container.innerHTML = "";
  const overlay = document.createElement("div");
  overlay.className = "overlay celebration-overlay";
  const celeb = document.createElement("div");
  celeb.className = "celebration mountain-celebration";
  const celebCfg = contentConfig.celebration;
  celeb.style.backgroundImage = `url(${celebCfg.backgroundImage})`;
  celeb.innerHTML = `
    <div class="celebration-content">
      <div class="celebration-trophy">${escapeText(celebCfg.trophyLabel)}</div>
      <h1>${escapeText(celebCfg.title)}</h1>
      <p class="celebration-zone">${escapeText(chapterTitle)}</p>
      <p class="celebration-lessons"><strong>Today Flicker learned:</strong> “${escapeText(celebCfg.flickerLesson)}”</p>
      <p class="celebration-lessons"><strong>Today you learned:</strong> “${escapeText(celebCfg.playerLesson)}”</p>
      <ul class="achievement-checklist">
        ${contentConfig.achievementChecklist.map((item) => `<li>✓ ${item}</li>`).join("")}
      </ul>
      <p class="celebration-quote">${escapeText(celebCfg.quote)}</p>
    </div>
  `;

  const reflectBtn = document.createElement("button");
  reflectBtn.className = "btn-primary";
  reflectBtn.style.maxWidth = "260px";
  reflectBtn.style.margin = "0 auto 10px";
  reflectBtn.textContent = "See counselor insights";
  reflectBtn.onclick = onReflect;
  celeb.appendChild(reflectBtn);

  const hubBtn = document.createElement("button");
  hubBtn.className = "btn-secondary";
  hubBtn.style.maxWidth = "260px";
  hubBtn.style.margin = "0 auto";
  hubBtn.textContent = "Back to scenarios";
  hubBtn.onclick = onHub;
  celeb.appendChild(hubBtn);

  overlay.appendChild(celeb);
  container.appendChild(overlay);
}

export function renderJourneyReflection(
  container: HTMLElement,
  reflection: JourneyReflection,
  onContinue: () => void,
): void {
  container.innerHTML = "";
  const surface = document.createElement("div");
  surface.className = "parent-surface reflection-surface";

  const card = document.createElement("div");
  card.className = "parent-card reflection-card";
  card.innerHTML = `
    <div class="counselor-badge">Journey Reflection</div>
    <h1>How this adventure went</h1>
    <p>${escapeText(reflection.summary)}</p>
    <h3>Strengths noticed</h3>
    <ul>${reflection.strengths.map((s) => `<li>${escapeText(s)}</li>`).join("")}</ul>
    <h3>Growth edges</h3>
    <ul>${reflection.growthEdges.map((s) => `<li>${escapeText(s)}</li>`).join("")}</ul>
    <h3>Step-by-step insights</h3>
  `;

  for (const step of reflection.stepInsights) {
    const block = document.createElement("div");
    block.className = "insight-block";
    block.innerHTML = `
      <h4>${escapeText(step.title)}</h4>
      <p><strong>Child:</strong> ${escapeText(step.forChild)}</p>
      <p><strong>Parent coaching:</strong> ${escapeText(step.forParent)}</p>
      <p class="practice"><strong>Try at home:</strong> ${escapeText(step.practiceTip)}</p>
    `;
    card.appendChild(block);
  }

  const coaching = document.createElement("div");
  coaching.innerHTML = `<h3>Parent coach notes</h3><ul>${reflection.parentCoaching.map((c) => `<li>${escapeText(c)}</li>`).join("")}</ul>
    <p class="counselor-note">${escapeText(reflection.closingNote)}</p>`;
  card.appendChild(coaching);

  const btn = document.createElement("button");
  btn.className = "btn-primary";
  btn.textContent = "Return to scenario hub";
  btn.onclick = onContinue;
  card.appendChild(btn);

  surface.appendChild(card);
  container.appendChild(surface);
}

export function renderParentGate(
  container: HTMLElement,
  onPass: () => void,
  onFail: () => void,
): void {
  container.innerHTML = "";
  const surface = document.createElement("div");
  surface.className = "parent-surface";

  const card = document.createElement("div");
  card.className = "parent-card";
  card.innerHTML = `
    <h1>Parent Gate</h1>
    <p>Enter the 4-digit PIN to open parent tools and reflections.</p>
  `;

  const storedHash = localStorage.getItem("trunorth_pin_hash");
  let fails = 0;

  const input = document.createElement("input");
  input.type = "password";
  input.maxLength = 4;
  input.pattern = "[0-9]{4}";
  input.placeholder = "••••";
  input.style.cssText = "width:100%;padding:12px;font-size:24px;text-align:center;letter-spacing:8px;border-radius:8px;border:1px solid #555;background:#2d3142;color:white;margin-bottom:12px;";
  card.appendChild(input);

  const error = document.createElement("div");
  error.className = "error-msg";
  card.appendChild(error);

  const btn = document.createElement("button");
  btn.className = "btn-primary";
  btn.textContent = "Unlock";
  btn.onclick = async () => {
    if (!storedHash) {
      const hash = await import("./auth.js").then((m) => m.hashPin(input.value));
      localStorage.setItem("trunorth_pin_hash", hash);
      onPass();
      return;
    }
    const valid = await import("./auth.js").then((m) => m.verifyPin(input.value, storedHash));
    if (valid) {
      onPass();
    } else {
      fails++;
      error.textContent = `Incorrect PIN (${fails}/3)`;
      if (fails >= 3) {
        error.textContent = "Too many attempts. Please wait.";
        btn.disabled = true;
        setTimeout(() => { btn.disabled = false; fails = 0; error.textContent = ""; }, 30000);
        onFail();
      }
    }
  };
  card.appendChild(btn);

  surface.appendChild(card);
  container.appendChild(surface);
}

export function renderTrustScreen(container: HTMLElement, onContinue: () => void): void {
  container.innerHTML = "";
  const surface = document.createElement("div");
  surface.className = "parent-surface";
  const card = document.createElement("div");
  card.className = "parent-card";
  card.innerHTML = `
    <h1>Trust & Safety</h1>
    <p>TruNorth is designed with your child's safety in mind:</p>
    <ul style="color:#b0b3c0;line-height:1.8;margin-bottom:20px;padding-left:20px;">
      <li>The companion is a fixed character — no open chat</li>
      <li>Counselor-style insights are SEL coaching, not clinical therapy</li>
      <li>No real-world meetups or personal info collection</li>
      <li>All AI calls are server-side — no API keys in the browser</li>
      <li>If something feels really hard, a trusted grown-up can help</li>
    </ul>
  `;
  const btn = document.createElement("button");
  btn.className = "btn-primary";
  btn.textContent = "I understand — continue";
  btn.onclick = onContinue;
  card.appendChild(btn);
  surface.appendChild(card);
  container.appendChild(surface);
}
