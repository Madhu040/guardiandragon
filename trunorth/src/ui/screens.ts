import { apiLogin, apiRegister, setSession, clearSession, getToken } from "./auth.js";
import { SCENARIOS } from "../content/scenarios.js";
import { getScene } from "../content/index.js";
import { getGridLevel } from "../content/gridLevels.js";
import { createGridThumbnail } from "../render/gridBackground.js";
import { zoneForChapter } from "../content/zones.js";
import { appConfig } from "../config/app.js";
import {
  questionsForChapter,
  scoreTypedCheckinAnswer,
  buildCheckinResult,
  checkinPlacementLabel,
  checkinCompanionLine,
  CHECKIN_DISTRESS_LINE,
  type CheckinAnswer,
} from "../counselor/checkin.js";
import type { ScenarioMeta, CheckinRecord } from "../types/index.js";

type Screen = "landing" | "login" | "register" | "dashboard";

export function renderLanding(
  container: HTMLElement,
  onPlay: () => void,
  onPlayTogether: () => void,
  onAuth: (s: Screen) => void,
): void {
  container.innerHTML = "";
  const surface = document.createElement("div");
  surface.className = "onboarding";

  const card = document.createElement("div");
  card.className = "onboarding-card";
  card.innerHTML = `
    <h1>🧭 TruNorth</h1>
    <p>Kids learn empathy, courage, and calm through play. Parents get coaching insights to help at home.</p>
  `;

  const playBtn = document.createElement("button");
  playBtn.className = "btn-primary";
  playBtn.style.marginBottom = "12px";
  playBtn.textContent = "Play Now (Guest)";
  playBtn.onclick = onPlay;
  card.appendChild(playBtn);

  const togetherBtn = document.createElement("button");
  togetherBtn.className = "btn-secondary";
  togetherBtn.style.marginBottom = "12px";
  togetherBtn.textContent = "Play Together";
  togetherBtn.onclick = onPlayTogether;
  card.appendChild(togetherBtn);

  const demoBtn = document.createElement("button");
  demoBtn.className = "btn-secondary";
  demoBtn.textContent = "Demo Mode (Offline)";
  demoBtn.onclick = () => {
    window.location.search = "?demo=1";
    onPlay();
  };
  card.appendChild(demoBtn);

  const authRow = document.createElement("div");
  authRow.style.marginTop = "24px";
  authRow.innerHTML = `<p style="font-size:14px;opacity:0.6;margin-bottom:8px;">Parents</p>`;

  const loginBtn = document.createElement("button");
  loginBtn.className = "btn-secondary";
  loginBtn.textContent = "Parent Login";
  loginBtn.onclick = () => onAuth("login");
  authRow.appendChild(loginBtn);

  const regBtn = document.createElement("button");
  regBtn.className = "btn-secondary";
  regBtn.textContent = "Create Parent Account";
  regBtn.onclick = () => onAuth("register");
  authRow.appendChild(regBtn);

  card.appendChild(authRow);
  surface.appendChild(card);
  container.appendChild(surface);
}

export function renderAuthForm(
  container: HTMLElement,
  mode: "login" | "register",
  onSuccess: () => void,
  onBack: () => void,
): void {
  container.innerHTML = "";
  const surface = document.createElement("div");
  surface.className = "parent-surface";

  const card = document.createElement("div");
  card.className = "parent-card";
  card.innerHTML = `<h1>${mode === "login" ? "Parent Login" : "Create Account"}</h1>
    <p>${mode === "login" ? "Sign in to manage child profiles and sync progress." : "Parents only — children never log in directly."}</p>`;

  const emailGroup = document.createElement("div");
  emailGroup.className = "form-group";
  emailGroup.innerHTML = `<label>Email</label>`;
  const emailInput = document.createElement("input");
  emailInput.type = "email";
  emailInput.required = true;
  emailGroup.appendChild(emailInput);
  card.appendChild(emailGroup);

  const passGroup = document.createElement("div");
  passGroup.className = "form-group";
  passGroup.innerHTML = `<label>Password</label>`;
  const passInput = document.createElement("input");
  passInput.type = "password";
  passInput.minLength = 8;
  passInput.required = true;
  passGroup.appendChild(passInput);
  card.appendChild(passGroup);

  const error = document.createElement("div");
  error.className = "error-msg";
  card.appendChild(error);

  const submit = document.createElement("button");
  submit.className = "btn-primary";
  submit.textContent = mode === "login" ? "Sign In" : "Create Account";
  submit.onclick = async () => {
    try {
      const session = mode === "login"
        ? await apiLogin(emailInput.value, passInput.value)
        : await apiRegister(emailInput.value, passInput.value);
      setSession(session);
      onSuccess();
    } catch (e) {
      error.textContent = e instanceof Error ? e.message : "Error";
    }
  };
  card.appendChild(submit);

  const back = document.createElement("button");
  back.className = "btn-secondary";
  back.textContent = "Back";
  back.onclick = onBack;
  card.appendChild(back);

  surface.appendChild(card);
  container.appendChild(surface);
}

export function renderOnboarding(
  container: HTMLElement,
  onComplete: (data: {
    companionName: string;
    companionArchetype: string;
    avatar: { skinTone: string; hair: string };
    ageBand: string;
    baselineStrength: string;
  }) => void,
): void {
  container.innerHTML = "";
  let step = 0;
  const { defaults } = appConfig;
  const data = {
    companionName: defaults.companionName,
    companionArchetype: defaults.companionArchetype,
    avatar: { skinTone: "tone_3", hair: "hair_curly" },
    ageBand: defaults.ageBand,
    baselineStrength: defaults.baselineStrength,
  };

  const surface = document.createElement("div");
  surface.className = "onboarding";
  const card = document.createElement("div");
  card.className = "onboarding-card";

  function renderStep(): void {
    card.innerHTML = "";

    if (step === 0) {
      card.innerHTML = `<h1>Meet ${defaults.companionName}!</h1><p>Every child in Everbright has a Guardian Dragon. Choose yours for Nova's Star Crystal quest.</p>`;
      const archetypes = [
        { id: "companion_dragon", emoji: "🐉", name: `Dragon (${defaults.companionName})` },
        { id: "companion_fox", emoji: "🦊", name: "Fox" },
        { id: "companion_sprite", emoji: "✨", name: "Sprite" },
      ];
      for (const a of archetypes) {
        const btn = document.createElement("button");
        btn.className = "choice-btn";
        btn.style.maxWidth = "200px";
        btn.style.margin = "8px auto";
        btn.textContent = `${a.emoji} ${a.name}`;
        btn.onclick = () => { data.companionArchetype = a.id; step++; renderStep(); };
        card.appendChild(btn);
      }
    } else if (step === 1) {
      card.innerHTML = `<h1>Name your companion</h1>`;
      const input = document.createElement("input");
      input.className = "typed-input";
      input.value = defaults.companionName;
      input.maxLength = 20;
      card.appendChild(input);
      const btn = document.createElement("button");
      btn.className = "btn-primary";
      btn.textContent = "Next";
      btn.onclick = () => { data.companionName = input.value.trim() || defaults.companionName; step++; renderStep(); };
      card.appendChild(btn);
    } else if (step === 2) {
      card.innerHTML = `<h1>Pick your look</h1>`;
      const grid = document.createElement("div");
      grid.className = "avatar-grid";
      const tones = ["tone_1", "tone_2", "tone_3", "tone_4", "tone_5"];
      const emojis = ["👧🏻", "👦🏽", "🧒🏾", "👧🏿", "👦"];
      tones.forEach((t, i) => {
        const opt = document.createElement("button");
        opt.className = `avatar-option${data.avatar.skinTone === t ? " selected" : ""}`;
        opt.textContent = emojis[i];
        opt.onclick = () => { data.avatar.skinTone = t; renderStep(); };
        grid.appendChild(opt);
      });
      card.appendChild(grid);
      const btn = document.createElement("button");
      btn.className = "btn-primary";
      btn.textContent = "Start Adventure!";
      btn.onclick = () => onComplete(data);
      card.appendChild(btn);
    }
  }

  renderStep();
  surface.appendChild(card);
  container.appendChild(surface);
}

export function renderCheckin(
  container: HTMLElement,
  scenario: ScenarioMeta,
  companionName: string,
  onDone: (result: CheckinRecord | null) => void,
  onBack: () => void,
): void {
  container.innerHTML = "";
  const questions = questionsForChapter(scenario.id);
  const answers: CheckinAnswer[] = [];
  let index = 0;

  const surface = document.createElement("div");
  surface.className = "onboarding";
  const card = document.createElement("div");
  card.className = "onboarding-card checkin-card";

  function recordAnswer(answer: CheckinAnswer): void {
    answers.push(answer);
    index++;
    if (index < questions.length) {
      renderQuestion();
    } else {
      renderResult();
    }
  }

  function renderQuestion(): void {
    card.innerHTML = "";
    const q = questions[index];

    const progress = document.createElement("div");
    progress.className = "checkin-progress";
    progress.textContent = `Check-in with ${companionName} · ${index + 1} of ${questions.length}`;
    card.appendChild(progress);

    const prompt = document.createElement("h1");
    prompt.textContent = q.prompt;
    card.appendChild(prompt);

    const hint = document.createElement("p");
    hint.textContent = "There are no wrong answers — just pick what feels true today.";
    card.appendChild(hint);

    for (const opt of q.options) {
      const btn = document.createElement("button");
      btn.className = "choice-btn";
      btn.style.maxWidth = "320px";
      btn.style.margin = "8px auto";
      btn.textContent = opt.label;
      btn.onclick = () =>
        recordAnswer({ questionId: q.id, points: opt.points, source: "option", safetyFlag: "none" });
      card.appendChild(btn);
    }

    if (q.allowTyped) {
      const divider = document.createElement("p");
      divider.className = "checkin-divider";
      divider.textContent = "…or tell me in your own words:";
      card.appendChild(divider);

      const input = document.createElement("input");
      input.className = "typed-input";
      input.maxLength = 200;
      input.placeholder = "Type here…";
      card.appendChild(input);

      const say = document.createElement("button");
      say.className = "btn-primary";
      say.textContent = `Tell ${companionName}`;
      say.onclick = () => {
        if (!input.value.trim()) return;
        const scored = scoreTypedCheckinAnswer(input.value);
        recordAnswer({ questionId: q.id, points: scored.points, source: "typed", safetyFlag: scored.safetyFlag });
      };
      card.appendChild(say);
      input.onkeydown = (e) => { if (e.key === "Enter") say.click(); };
    }

    const skip = document.createElement("button");
    skip.className = "btn-secondary";
    skip.textContent = "Skip and start playing";
    skip.onclick = () => onDone(null);
    card.appendChild(skip);

    if (index === 0) {
      const back = document.createElement("button");
      back.className = "btn-secondary";
      back.textContent = "Back";
      back.onclick = onBack;
      card.appendChild(back);
    }
  }

  function renderResult(): void {
    card.innerHTML = "";
    const result = buildCheckinResult(scenario.id, answers);

    const compass = document.createElement("div");
    compass.className = "checkin-compass";
    compass.textContent = "🧭";
    card.appendChild(compass);

    const title = document.createElement("h1");
    title.textContent = checkinPlacementLabel(result.placement);
    card.appendChild(title);

    const scale = document.createElement("div");
    scale.className = "checkin-scale";
    scale.setAttribute("role", "img");
    scale.setAttribute("aria-label", `Starting point ${result.startingPoint} out of 10`);
    for (let i = 1; i <= 10; i++) {
      const dot = document.createElement("span");
      dot.className = `checkin-dot${i <= result.startingPoint ? " filled" : ""}`;
      scale.appendChild(dot);
    }
    card.appendChild(scale);

    const line = document.createElement("p");
    line.className = "checkin-companion-line";
    line.textContent = checkinCompanionLine(result.placement, companionName);
    card.appendChild(line);

    if (result.safetyFlag === "distress") {
      const support = document.createElement("p");
      support.className = "checkin-support";
      support.textContent = CHECKIN_DISTRESS_LINE;
      card.appendChild(support);
    }

    const start = document.createElement("button");
    start.className = "btn-primary";
    start.textContent = `Start ${scenario.title}!`;
    start.onclick = () => onDone(result);
    card.appendChild(start);
  }

  renderQuestion();
  surface.appendChild(card);
  container.appendChild(surface);
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function logout(): void {
  clearSession();
}

export function renderScenarioHub(
  container: HTMLElement,
  completedChapters: string[],
  playMode: "solo" | "together",
  onSelectSolo: (scenario: ScenarioMeta) => void,
  onSelectTogether: (scenario: ScenarioMeta) => void,
  onParentCoach: () => void,
  onBack: () => void,
): void {
  container.innerHTML = "";
  const surface = document.createElement("div");
  surface.className = "hub-surface";

  const header = document.createElement("div");
  header.className = "hub-header";
  header.innerHTML = `
    <h1>🧭 Your Journey</h1>
    <p>${playMode === "together" ? "Pick a phase to explore side by side with your child." : "Choose a Little Dragon phase (or the bonus meadow), or open the parent coach corner."}</p>
  `;
  surface.appendChild(header);

  const kidTitle = document.createElement("h2");
  kidTitle.className = "hub-section-title";
  kidTitle.textContent = playMode === "together" ? "Play together" : "Little Dragon phases";
  surface.appendChild(kidTitle);

  const kidGrid = document.createElement("div");
  kidGrid.className = "scenario-grid";

  const onSelect = playMode === "together" ? onSelectTogether : onSelectSolo;

  for (const scenario of SCENARIOS.filter((s) => s.audience === "child")) {
    const card = document.createElement("button");
    card.className = `scenario-card${playMode === "together" ? " together" : ""}`;
    const done = completedChapters.includes(scenario.id);
    card.innerHTML = `
      <div class="scenario-eyebrow">${scenario.subtitle}${done ? " · Done" : ""}${playMode === "together" ? " · Together" : ""}</div>
      <h3>${scenario.title}</h3>
      <p>${scenario.description}</p>
      <div class="scenario-meta">Ages ${scenario.ageBand} · ~${scenario.estimatedMinutes} min</div>
    `;
    const gridId = getScene(scenario.startSceneId)?.gridMapId;
    const gridLevel = gridId ? getGridLevel(gridId) : null;
    if (gridLevel) {
      card.prepend(createGridThumbnail(gridLevel));
    } else {
      const zone = zoneForChapter(scenario.id);
      const thumb = document.createElement("img");
      thumb.className = "zone-thumb";
      thumb.src = zone.image;
      thumb.alt = zone.name;
      card.prepend(thumb);
    }
    card.onclick = () => onSelect(scenario);
    kidGrid.appendChild(card);
  }
  surface.appendChild(kidGrid);

  const parentTitle = document.createElement("h2");
  parentTitle.className = "hub-section-title";
  parentTitle.textContent = "For parents";
  surface.appendChild(parentTitle);

  const parentGrid = document.createElement("div");
  parentGrid.className = "scenario-grid";
  for (const scenario of SCENARIOS.filter((s) => s.audience === "parent")) {
    const card = document.createElement("button");
    card.className = "scenario-card parent";
    card.innerHTML = `
      <div class="scenario-eyebrow">${scenario.subtitle}</div>
      <h3>${scenario.title}</h3>
      <p>${scenario.description}</p>
      <div class="scenario-meta">PIN-protected · Coach insights</div>
    `;
    card.onclick = onParentCoach;
    parentGrid.appendChild(card);
  }
  surface.appendChild(parentGrid);

  const back = document.createElement("button");
  back.className = "btn-secondary";
  back.style.maxWidth = "220px";
  back.style.margin = "24px auto 0";
  back.style.display = "block";
  back.textContent = "Back to home";
  back.onclick = onBack;
  surface.appendChild(back);

  container.appendChild(surface);
}
