import type { DecisionPoint, DialogRecord, GameState, Scene, ScenePhase } from "../types/index.js";
import { getDecisionPoint, getDialog } from "../content/index.js";
import { objectSprite, objectWorldPos, sceneObjects } from "../content/stageObjects.js";
import { renderFullBodyCharacter } from "../render/characters.js";
import type { JourneyReflection } from "../counselor/insights.js";
import { discussPrompt } from "../counselor/coPlay.js";
import { zoneFromBackground, zoneForChapter } from "../content/zones.js";
import { isGridDebug, resolveGridLevel } from "../content/gridLevels.js";
import { visibleSparks } from "../content/sparks.js";
import { renderGridBackground } from "../render/gridBackground.js";
import { renderAmbientLife } from "../render/ambientLife.js";
import { renderProgressPath } from "../render/progressPath.js";
import { backgroundImageUrl, characterImageUrl, objectImageUrl } from "../content/assetManifest.js";
import { personalize } from "../content/personalize.js";
import { celebrationFor } from "../config/content.js";
import { isSpeechSupported, isVoiceEnabled, setVoiceEnabled, speakLine, stopSpeaking } from "../audio/speech.js";
import { isSfxEnabled, isSfxSupported, setSfxEnabled } from "../audio/sfx.js";
import { COLOR_TUNES, type TogetherPlayer } from "../together/inviteStore.js";

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
  togetherPlayers: TogetherPlayer[] = [],
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

    if (togetherPlayers.length > 0) {
      const badges = document.createElement("div");
      badges.className = "together-player-badges";
      badges.setAttribute("aria-label", "Players");
      for (const player of togetherPlayers) {
        const badge = document.createElement("div");
        badge.className = "together-player-badge";
        badge.style.setProperty("--player-accent", COLOR_TUNES[player.colorTune].accent);
        badge.style.setProperty("--player-soft", COLOR_TUNES[player.colorTune].soft);
        const role = player.role === "parent" ? "Parent" : "Child";
        badge.innerHTML = `<span class="badge-dot"></span><span class="badge-name">${escapeText(player.displayName)}</span><span class="badge-role">${role}</span>`;
        badges.appendChild(badge);
      }
      viewport.appendChild(badges);
    }
  }

  const brownie = document.createElement("div");
  brownie.className = "brownie-counter crystal-counter";
  brownie.setAttribute("aria-label", `Crystals collected: ${state.progress.browniePoints}`);
  brownie.textContent = `💎 ${state.progress.browniePoints}`;
  viewport.appendChild(brownie);

  /**
   * Discovery counter — "🔍 1 of 3". Tells the child there IS something to look for and
   * how much is left, which is what makes exploring feel like a search rather than
   * wandering. Deliberately a quiet chip, not a progress bar: §7.7 warns that HUD chrome
   * "measures the child" and turns a felt story into a task.
   */
  const discoverables = (scene?.objects ?? []).filter(
    (o) => o.interaction.kind === "openDialog",
  );
  if (scene && discoverables.length > 0) {
    const found = (state.progress.discoveries?.[scene.id] ?? []).length;
    const chip = document.createElement("div");
    chip.className = found >= discoverables.length ? "discovery-chip complete" : "discovery-chip";
    chip.textContent = `🔍 ${found} of ${discoverables.length}`;
    chip.setAttribute("aria-label", `Discovered ${found} of ${discoverables.length} things to look at`);
    viewport.appendChild(chip);
  }

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
    const { fill, level } = state.meters[skill];
    const meter = document.createElement("div");
    meter.className = "meter";
    // Flight destination for the §17B.2 particle burst — see src/render/juice.ts.
    meter.dataset.meterSkill = skill;
    // §7.2 requires a *visible fill state*. Until now the meter was a static emoji circle
    // with a fixed border, so a skill filling up changed nothing on screen — the particle
    // flight landed on a target that never responded. The ring below is that fill.
    meter.style.setProperty("--fill", String(Math.max(0, Math.min(100, fill))));
    meter.setAttribute(
      "aria-label",
      `${skill.replace(/_/g, " ")}: level ${level}, ${Math.round(fill)}% full`,
    );
    const icons: Record<string, string> = { empathy: "❤️", calm: "🌊", courage: "⭐" };
    const face = document.createElement("span");
    face.className = "meter-face";
    face.textContent = icons[skill] ?? "●";
    meter.appendChild(face);
    if (level > 1) {
      const badge = document.createElement("span");
      badge.className = "meter-level";
      badge.textContent = String(level);
      meter.appendChild(badge);
    }
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

  if (isSfxSupported()) {
    const sfxToggle = document.createElement("button");
    sfxToggle.className = "sfx-toggle";
    const syncSfxToggle = () => {
      const on = isSfxEnabled();
      sfxToggle.textContent = on ? "🎵" : "🔕";
      sfxToggle.setAttribute("aria-label", on ? "Turn sound effects off" : "Turn sound effects on");
      sfxToggle.setAttribute("aria-pressed", String(on));
    };
    syncSfxToggle();
    sfxToggle.onclick = () => {
      setSfxEnabled(!isSfxEnabled());
      syncSfxToggle();
    };
    viewport.appendChild(sfxToggle);
  }

  if (scene) {
    const zoneMeta = zoneFromBackground(scene.background) ?? zoneForChapter(scene.chapterId);

    // The camera layer. All *world-space* content (background, characters, collectibles,
    // stage objects, hotspots, move hint) lives inside this and is transformed as one by
    // WorldRuntime to follow the avatar — turning the fixed one-screen diorama into a
    // world you scroll through. Screen chrome (HUD, pills, counter, discovery chip,
    // overlays) stays on `viewport` and does not move. The layer is the same box as the
    // viewport, so every child's `%` position is unchanged — the camera is a pure display
    // transform over the same 1920×1080 world coordinates.
    const world = document.createElement("div");
    world.className = "world-layer";

    if (gridLevel) {
      const debug = isGridDebug();
      renderGridBackground(world, gridLevel, debug);
      // Real art overlays the canvas grid (which stays underneath as the walk-map and,
      // in ?gridDebug=1, the visible cell tint). If the PNG 404s, drop it and the canvas
      // shows through — the offline demo never breaks on a missing background.
      const artUrl = debug ? null : backgroundImageUrl(gridLevel.id);
      if (artUrl) {
        const art = document.createElement("img");
        art.className = "grid-art";
        art.src = artUrl;
        art.alt = "";
        art.setAttribute("aria-hidden", "true");
        art.draggable = false;
        art.onerror = () => art.remove();
        world.appendChild(art);
      }
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
      world.appendChild(bg);
    }

    // Ambient life + the diegetic stepping-stone path (spec §7.7) go into the world layer
    // *before* the characters, so the camera carries them with the ground and they tuck
    // behind everyone. Both are decorative (aria-hidden, pointer-events:none) and freeze
    // under prefers-reduced-motion.
    renderAmbientLife(world, zoneMeta.id);
    renderProgressPath(world, scene.chapterId, scene.id);

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
      const svg = renderFullBodyCharacter({
        id: ch.id,
        assetRef: ch.assetRef,
        expression: ch.expression,
        skinTone: state.profile.avatar.skinTone,
        companionArchetype: state.profile.companionArchetype,
        size: ch.id === "worry_cloud" ? 120 : 110,
      });
      // Use the AI PNG when the manifest has one; if it fails to load, restore the SVG so
      // the character never vanishes (spec §10.3 fallback).
      const charUrl = characterImageUrl(
        ch.id,
        ch.assetRef,
        state.profile.companionArchetype,
        state.profile.avatar.skinTone,
      );
      if (charUrl) {
        const img = document.createElement("img");
        img.className = "sprite-png";
        img.src = charUrl;
        img.alt = "";
        img.draggable = false;
        img.onerror = () => {
          sprite.innerHTML = svg;
        };
        sprite.appendChild(img);
      } else {
        sprite.innerHTML = svg;
      }
      el.appendChild(sprite);

      const label = document.createElement("div");
      label.className = "char-label";
      label.textContent =
        ch.id === "companion"
          ? companionName
          : ch.id === "avatar"
            ? state.profile.childDisplayName || "You"
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

      world.appendChild(el);
    }

    // §7.6: gated sparks only exist once the kind action has happened, so a second run is
    // "find what I missed" rather than a replay of the same lesson.
    for (const item of visibleSparks(scene, state)) {
      const alreadyFound = (state.progress.kindnessSparksFound[scene.id] ?? []).includes(item.id);
      // Crystals (§7.1 scattered fun) read differently from Kindness Sparks (§7.6 replay
      // mechanic) so the child can tell "a treat on my way" from "something I earned".
      const isCrystal = item.kind === "crystal";
      const spark = document.createElement("div");
      spark.className = [
        "world-collectible",
        isCrystal ? "crystal" : "spark",
        alreadyFound ? "collected" : "",
      ]
        .filter(Boolean)
        .join(" ");
      spark.dataset.collectibleId = item.id;
      spark.style.left = `${(item.position[0] / 1920) * 100}%`;
      spark.style.top = `${(item.position[1] / 1080) * 100}%`;
      spark.setAttribute("aria-label", isCrystal ? "Crystal" : "Kindness spark");
      spark.textContent = isCrystal ? "💎" : "✨";
      world.appendChild(spark);
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
      // Off the explore phase the object is a plain <div> (not a button), so an aria-label
      // needs an explicit role to be permitted (WCAG aria-prohibited-attr). It is a labelled
      // piece of scenery → role="img". Buttons carry their own role.
      if (!exploring) el.setAttribute("role", "img");

      const sprite = document.createElement("span");
      sprite.className = "stage-object-sprite";
      const emoji = objectSprite(obj.assetRef);
      const objUrl = objectImageUrl(obj.assetRef);
      if (objUrl) {
        const img = document.createElement("img");
        img.className = "sprite-png object";
        img.src = objUrl;
        img.alt = "";
        img.draggable = false;
        img.onerror = () => {
          sprite.textContent = emoji;
        };
        sprite.appendChild(img);
      } else {
        sprite.textContent = emoji;
      }
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
      world.appendChild(el);
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
        world.appendChild(zone);
      }
    }

    viewport.appendChild(world);
    onWorldReady?.(world, scene, phase === "exploring");
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
    root.appendChild(buildCounselorPanel(counselor, togetherMode, state.profile.companionName));
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
      {
        childName: state.profile.childDisplayName,
        companionName: state.profile.companionName,
      },
    );
  } else if (dialogState && getDialog(dialogState.id)) {
    renderDialogOverlay(
      container,
      getDialog(dialogState.id)!,
      dialogState.page,
      onDialogNext ?? (() => {}),
      onDialogClose ?? (() => {}),
      {
        childName: state.profile.childDisplayName,
        companionName: state.profile.companionName,
      },
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

/**
 * Reflection panel.
 *
 * ⚠️ **Two different audiences, and they must not be mixed.**
 *
 * A child playing alone must never be shown that they are being assessed. Until now this
 * panel rendered an "SEL Coach Insight" badge, a `For grown-ups:` paragraph carrying the
 * clinical parent tip (e.g. *"Naming and questioning worry (ACT/CBT) reduces fusion with
 * catastrophic thoughts for ages 5–8"*), and a "not a clinical diagnosis" disclaimer —
 * all of it on screen, mid-game, to a five-year-old.
 *
 * That breaks the §1.1 stealth-learning pillar (the child should experience a story, not a
 * test) and §12.4, which requires grown-up surfaces to be a *deliberately different* screen
 * the child can tell at a glance is not for them. §7.7 makes the same argument about a HUD
 * progress bar: chrome that "measures the child" turns a felt story into a task.
 *
 * So:
 * - **Solo child play** → the companion speaks. One warm line, in their friend's voice.
 *   No badge, no grown-up paragraph, no clinical disclaimer.
 * - **Together Mode** → a parent is deliberately sitting alongside, so the coach framing and
 *   the parent tip are appropriate and stay.
 *
 * Parent-facing content is not lost: it already has a proper home behind the parent gate in
 * `renderJourneyReflection`, which is where a grown-up is actually the reader.
 */
function buildCounselorPanel(
  counselor: CounselorPanelData,
  togetherMode: boolean,
  companionName: string,
): HTMLElement {
  const panel = document.createElement("aside");
  panel.className = togetherMode ? "counselor-panel" : "counselor-panel companion-note";

  if (!togetherMode) {
    // Child-facing: their companion reflecting with them, not a report about them.
    panel.setAttribute("aria-label", `${companionName} says`);
    panel.innerHTML = `
      <div class="counselor-panel-header">
        <div class="counselor-badge">${escapeText(companionName)}</div>
        <button class="counselor-close" type="button" aria-label="Close message">✕</button>
      </div>
      <p class="counselor-child">${escapeText(counselor.child)}</p>
    `;
    return finishCounselorPanel(panel, counselor);
  }

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
  return finishCounselorPanel(panel, counselor);
}

function finishCounselorPanel(
  panel: HTMLElement,
  counselor: CounselorPanelData,
): HTMLElement {

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
  names: { childName?: string; companionName?: string } = {},
): void {
  const dp = getDecisionPoint(decisionId);
  if (!dp) return;
  // The prompt and choices are the most-read copy in the game, and they named the child
  // and the companion literally. Fill in the names the child actually chose.
  const prompt = personalize(dp.prompt, names);

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
  title.textContent = prompt;
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
      btn.textContent = personalize(opt.label, names);
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
  speakOverlayOnce(`${decisionId}:choose`, buildOverlayScript(dp, names));
}

function renderDialogOverlay(
  container: HTMLElement,
  dialog: DialogRecord,
  pageIndex: number,
  onNext: () => void,
  onClose: () => void,
  names: { childName?: string; companionName?: string } = {},
): void {
  const page = dialog.pages[Math.min(pageIndex, dialog.pages.length - 1)];
  const isLast = pageIndex >= dialog.pages.length - 1;
  // The speaker label is authored copy too — a companion the child renamed must not be
  // announced as "Flicker" on its own speech bubble.
  const speaker = personalize(page.speaker ?? dialog.speaker ?? "", names) || undefined;

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
      const svg = renderFullBodyCharacter({
        id: "npc",
        assetRef: dialog.speakerAssetRef,
        size: 64,
      });
      // Use the real AI PNG (e.g. Wize the owl) when the manifest has one, so the pop-up
      // matches the in-world sprite; fall back to the SVG if it fails to load (spec §10.3).
      const portraitUrl = characterImageUrl("npc", dialog.speakerAssetRef);
      if (portraitUrl) {
        const img = document.createElement("img");
        img.src = portraitUrl;
        img.alt = "";
        img.draggable = false;
        img.style.cssText = "width:64px;height:64px;object-fit:contain;display:block;";
        img.onerror = () => {
          portrait.innerHTML = svg;
        };
        portrait.appendChild(img);
      } else {
        portrait.innerHTML = svg;
      }
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
  const pageText = personalize(page.text, names);
  text.textContent = pageText;
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
  // Speak just the line, in the character's voice — no "Wize says:" narrator prefix, which
  // reads as robotic instruction rather than a character talking to the child (who the
  // speaker is is already shown by the portrait + name, and announced via the aria-label).
  speakOverlayOnce(`dialog:${dialog.id}:${pageIndex}`, pageText);
}

/** Spoken version of a decision pop-up: the prompt, then each option in order. */
function buildOverlayScript(
  dp: DecisionPoint,
  names: { childName?: string; companionName?: string } = {},
): string {
  const parts: string[] = [personalize(dp.prompt, names)];
  if (dp.options && dp.options.length > 0) {
    const ordinals = ["First choice", "Second choice", "Third choice", "Fourth choice"];
    parts.push("Your choices are:");
    dp.options.forEach((opt, i) => {
      parts.push(`${ordinals[i] ?? `Choice ${i + 1}`}: ${personalize(opt.label, names)}.`);
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
  chapterId = "ch2",
  sparks?: { found: number; total: number },
): void {
  container.innerHTML = "";
  const overlay = document.createElement("div");
  overlay.className = "overlay celebration-overlay";
  const celeb = document.createElement("div");
  celeb.className = "celebration mountain-celebration";
  const celebCfg = celebrationFor(chapterId);
  celeb.style.backgroundImage = `url(${celebCfg.backgroundImage})`;

  /**
   * §7.6 — the spark tally is deliberately **not maxed** on a first play. That's the whole
   * mechanism: the child sees what they missed, and the only way to find the rest is to
   * explore and be kind. Framed as an invitation, never as a score or a failure.
   */
  const sparkLine =
    sparks && sparks.total > 0
      ? `<p class="celebration-sparks">✨ You found <strong>${sparks.found} of ${sparks.total}</strong> Kindness Sparks${
          sparks.found < sparks.total
            ? " — some only appear when you're kind or curious. Want to find the rest?"
            : " — you found every single one!"
        }</p>`
      : "";

  celeb.innerHTML = `
    <div class="celebration-content">
      <div class="celebration-trophy">${escapeText(celebCfg.trophyLabel)}</div>
      <h1>${escapeText(celebCfg.title)}</h1>
      <p class="celebration-zone">${escapeText(chapterTitle)}</p>
      <p class="celebration-lessons"><strong>Today ${escapeText(celebCfg.companionName)} learned:</strong> “${escapeText(celebCfg.companionLesson)}”</p>
      <p class="celebration-lessons"><strong>Today you learned:</strong> “${escapeText(celebCfg.playerLesson)}”</p>
      ${sparkLine}
      <ul class="achievement-checklist">
        ${celebCfg.achievements.map((item) => `<li>✓ ${escapeText(item)}</li>`).join("")}
      </ul>
      <p class="celebration-quote">${escapeText(celebCfg.quote)}</p>
    </div>
  `;

  const reflectBtn = document.createElement("button");
  reflectBtn.className = "btn-primary";
  reflectBtn.style.maxWidth = "260px";
  reflectBtn.style.margin = "0 auto 10px";
  // This button leads to the parent gate, so it is addressed to the grown-up, not the
  // child — "counselor insights" told the child an assessment of them exists (§1.1, §12.4).
  // §12.1 also frames the gate as a connection ritual rather than a report.
  reflectBtn.textContent = "Grown-up corner";
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
