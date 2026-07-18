# UI screens & game view

**Sources:** `trunorth/src/ui/GameView.ts`, `trunorth/src/ui/screens.ts`, `trunorth/src/ui/auth.ts`

All UI is imperative DOM construction (no framework). Dynamic text goes through
`textContent` or a local `escapeText`/`escapeHtml` helper before `innerHTML`.

## `GameView.ts`

- `renderGameView(container, state, scene, phase, companionLine, activeDecisionId, counselor, onChoice, onTyped, onTrigger, togetherMode, coPlayStep, onCoPlayReady, onWorldReady)` —
  builds the play screen each render:
  - Viewport with demo/together pills, crystal (brownie) counter, zone stage tag,
    HUD meters (empathy ❤️ / calm 🌊 / courage ⭐ with level aria-labels).
  - Scene background from `zoneFromBackground`/`zoneForChapter` (`contentConfig.zones` image),
    plus legacy `treehouse|classroom|playground` CSS classes.
  - Characters via `renderFullBodyCharacter` SVG, per-character labels (companion uses the
    child's chosen name), depth z-index from y-position; companion speech `bubble` shown during
    `consequence`/`awaitingCompanion`.
  - Collectible ✨ sparks (`data-collectible-id`), clickable dashed `trigger-zone` buttons while
    `exploring`, "…is reflecting with you" indicator during `awaitingCompanion`.
    (The bottom narration bar was removed 2026-07-18 — `scene.narration` is no longer
    displayed; story text is carried by stage-object dialogs. Engine narration
    auto-advance timing is unchanged.)
  - **Stage z-layering (2026-07-18)** — guarantees no dialogue is blocked by a
    character: characters get `10 + floor(y/20)` (max ~64) < counselor panel 70 <
    speaking character (bubble host, inline z 75) = interact hint 75 < thinking pill 80
    < modal `.overlay` (decision + stage-object dialogs) 100. The companion bubble is
    wider (`360 * --px` max), bordered, with a ::after tail. In demo mode the stage tag
    drops below the demo pill (`.demo-pill ~ .stage-tag`); the together-pill sits below
    the crystal counter; the move hint lives bottom-left (clear of the counselor panel).
  - Calls `onWorldReady(viewport, scene, exploring)` so `worldRuntime.attach` can take over movement.
  - **Responsive stage scaling:** `.game-viewport` (global.css) is a CSS size container
    (`container-type: size`) defining `--px: 0.0520833cqw` = 1 design px of the 1920×1080
    scene space. Characters set `--char-size` (110; worry cloud 120) inline and
    `.character` width is `calc(var(--char-size) * var(--px))` with the SVG at
    `width:100%; height:auto` (the SVG's own width/height attrs remain as fallback).
    Labels, bubbles, collectibles, move/interact hints, HUD meters, pills, zone sign,
    and stage tag are sized in `calc(n * var(--px))`; text uses
    `clamp(min, calc(n * var(--px)), n px)` so it shrinks with the stage but never below
    a legibility floor. Positions were already %-based (world coords / 1920 or 1080).
  - Counselor side panel (`buildCounselorPanel`) during exploring/decision/consequence.
    **Draggable + closable (2026-07-18):** the header row (badge + ✕ button,
    `.counselor-panel-header`) is a pointer-capture drag handle — dragging sets inline
    `left/top` clamped to the window; the ✕ dismisses the panel. Both survive re-renders
    via module-scope state (`counselorPanelPos`, `dismissedCounselorKey` keyed on the
    insight's text via `counselorKey`), so a dismissed insight stays closed until a
    *different* insight arrives, and the dragged position persists for the session.
  - Decision overlay (`renderDecisionOverlay`) during `decision`/`encounter`.
- `renderDecisionOverlay` (private) — modal dialog. Together Mode is a two-step machine:
  step 1 "Talk together" shows `discussPrompt(dpId)` + ready button; step 2 shows the prompt,
  optional parent-reflection textarea, choice buttons, and (for `typed`/`both` DPs) a textarea +
  "Say it" submit.
- `renderCelebration(container, chapterTitle, onReflect, onHub)` — Courage Feather trophy,
  Flicker/player lessons, achievement checklist and quote from `contentConfig.celebration`.
- `renderJourneyReflection(container, reflection, onContinue)` — renders a
  `JourneyReflection`: summary, strengths, growth edges, per-step child/parent/practice
  insights, parent coach notes, closing disclaimer.
- `renderParentGate(container, onPass, onFail)` — 4-digit PIN gate. First use stores
  SHA-256 hash in `localStorage["trunorth_pin_hash"]`; 3 failures → 30s lockout + `onFail`.
- `renderTrustScreen(container, onContinue)` — safety promises list; continue sets
  `trunorth_trust_seen` (caller side).
- Types: `CounselorPanelData { title, child, parent, together? }`, `CoPlayStep = "discuss" | "choose"`.

## `screens.ts`

- `renderLanding(container, onPlay, onPlayTogether, onAuth)` — landing card with Play,
  Play Together, demo hint, and parent Login / Create Account buttons.
- `renderAuthForm(container, mode, onSuccess, onBack)` — email+password form calling
  `apiLogin`/`apiRegister`, stores session via `setSession`.
- `renderOnboarding(container, onComplete)` — 3 steps: companion archetype
  (dragon/fox/sprite), companion name (default from `appConfig.defaults`), avatar skin tone;
  returns collected profile data.
- `renderScenarioHub(container, completedChapters, playMode, onSelectSolo, onSelectTogether, onParentCoach, onBack)` —
  child scenario cards (done/together badges, age + minutes) from `SCENARIOS` (now 2:
  ch2 Singing Bridge, ch1 Everbright Meadow); thumbnails are grid canvases
  (`createGridThumbnail`) when the start scene binds a `gridMapId`, PNG zone thumbs
  otherwise; parent-audience card wired to the PIN-gated coach corner.
- `renderCheckin(container, scenario, companionName, onDone, onBack)` — pre-level
  check-in between hub and `startScenario`. Renders 3 questions from
  `questionsForChapter(scenario.id)` (`src/counselor/checkin.ts`), one card at a time:
  tappable options (0–2 pts) or an "in your own words" input (sanitized +
  `filterInput`-checked, keyword-scored; distress → supportive line + flag). Ends on a
  compass result screen (bright/steady/gentle label, 10-dot 0–10 starting-point scale,
  companion line) → `onDone(CheckinRecord)`; "Skip and start playing" → `onDone(null)`.
- `isAuthenticated()` / `logout()` — thin wrappers over `auth.ts` (currently unused by callers).
- Local `type Screen = landing|login|register|dashboard` — **"dashboard" is not an `AppScreen`
  in `main.ts`, which is one of the open typecheck errors.**

## `auth.ts`

- `AuthSession { token, user }`; session persisted in `localStorage["trunorth_session"]`.
- `getToken` / `setSession` / `clearSession` — session helpers.
- `apiRegister(email, password)` / `apiLogin(email, password)` — POST to
  `{VITE_API_URL}/api/auth/*`, throw server `error` message on failure.
- `hashPin(pin)` / `verifyPin(pin, hash)` — SHA-256 via WebCrypto, used by the parent gate.
