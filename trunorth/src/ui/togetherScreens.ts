import {
  COLOR_TUNES,
  PLAYER_CHARACTERS,
  bothPlayersReady,
  inviteUrl,
  parseInviteFromUrl,
  watchRoom,
  type ColorTuneId,
  type PlayerCharacterId,
  type TogetherPlayer,
  type TogetherRole,
  type TogetherRoom,
} from "../together/inviteStore.js";
import { getToken } from "./auth.js";
import { renderFullBodyCharacter } from "../render/characters.js";

export interface PlayerSetupResult {
  role: TogetherRole;
  displayName: string;
  colorTune: ColorTuneId;
  characterId: PlayerCharacterId;
  skinTone: TogetherPlayer["skinTone"];
}

function previewFigure(
  characterId: PlayerCharacterId,
  skinTone: string,
  color: ColorTuneId,
): HTMLElement {
  const wrap = document.createElement("div");
  wrap.className = "together-preview";
  wrap.style.setProperty("--player-accent", COLOR_TUNES[color].accent);
  wrap.style.setProperty("--player-soft", COLOR_TUNES[color].soft);
  const isCompanion = characterId.startsWith("companion_");
  wrap.innerHTML = renderFullBodyCharacter({
    id: isCompanion ? "companion" : characterId,
    companionArchetype: isCompanion ? characterId : "companion_dragon",
    skinTone,
    size: 100,
  });
  return wrap;
}

function nextButton(label: string, onClick: () => void | Promise<void>): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn-primary";
  btn.textContent = label;
  btn.onclick = () => {
    void Promise.resolve(onClick()).catch((err) => {
      console.error(err);
      btn.disabled = false;
      btn.textContent = label;
      alert(err instanceof Error ? err.message : "Something went wrong.");
    });
  };
  return btn;
}

/** Lobby: invite someone or join with a code. */
export function renderTogetherLobby(
  container: HTMLElement,
  onHost: (role: TogetherRole) => void,
  onJoin: (code: string) => void,
  onBack: () => void,
): void {
  container.innerHTML = "";
  const surface = document.createElement("div");
  surface.className = "onboarding together-flow";
  const card = document.createElement("div");
  card.className = "onboarding-card together-card";
  const authed = !!getToken();
  card.innerHTML = `
    <h1>Play Together</h1>
    <p class="together-sub">${
      authed
        ? "You are signed in — invite your parent or child with a shared code and link."
        : "Send an invite code so the other person can join from any device. Then each of you picks a name, color, and character."
    }</p>
  `;

  const roleLabel = document.createElement("p");
  roleLabel.className = "together-label";
  roleLabel.textContent = "Who is sending the invite?";
  card.appendChild(roleLabel);

  const roleRow = document.createElement("div");
  roleRow.className = "together-role-row";
  for (const role of [
    { id: "parent" as const, title: "Parent / Grown-up", hint: "Invite your child" },
    { id: "child" as const, title: "Child", hint: "Invite your grown-up" },
  ]) {
    const btn = document.createElement("button");
    btn.className = "together-role-btn";
    btn.type = "button";
    btn.innerHTML = `<strong>${role.title}</strong><span>${role.hint}</span>`;
    btn.onclick = () => onHost(role.id);
    roleRow.appendChild(btn);
  }
  card.appendChild(roleRow);

  const divider = document.createElement("div");
  divider.className = "together-divider";
  divider.textContent = "or join an invite";
  card.appendChild(divider);

  const joinRow = document.createElement("div");
  joinRow.className = "together-join-row";
  const input = document.createElement("input");
  input.className = "typed-input together-code-input";
  input.placeholder = "CODE";
  input.maxLength = 6;
  input.value = parseInviteFromUrl() ?? "";
  input.setAttribute("aria-label", "Invite code");
  const err = document.createElement("div");
  err.className = "error-msg";
  const joinBtn = document.createElement("button");
  joinBtn.className = "btn-primary";
  joinBtn.textContent = "Join";
  joinBtn.onclick = () => {
    const code = input.value.trim().toUpperCase();
    if (code.length < 4) {
      err.textContent = "Enter the 4-character invite code.";
      return;
    }
    onJoin(code);
  };
  joinRow.appendChild(input);
  joinRow.appendChild(joinBtn);
  card.appendChild(joinRow);
  card.appendChild(err);

  const back = document.createElement("button");
  back.className = "btn-secondary";
  back.textContent = "Back";
  back.onclick = onBack;
  card.appendChild(back);

  surface.appendChild(card);
  container.appendChild(surface);
}

/** Interactive identity picker: name, color tune, character, look. */
export function renderTogetherPlayerSetup(
  container: HTMLElement,
  role: TogetherRole,
  mode: "host" | "join",
  onDone: (result: PlayerSetupResult) => void | Promise<void>,
  onBack: () => void,
): void {
  container.innerHTML = "";
  let step = 0;
  const data: PlayerSetupResult = {
    role,
    displayName: role === "parent" ? "Grown-up" : "Explorer",
    colorTune: role === "parent" ? "teal" : "coral",
    characterId: role === "parent" ? "wize" : "companion_dragon",
    skinTone: "tone_3",
  };

  const surface = document.createElement("div");
  surface.className = "onboarding together-flow";
  const card = document.createElement("div");
  card.className = "onboarding-card together-card";

  function paint(): void {
    card.innerHTML = "";
    card.style.setProperty("--player-accent", COLOR_TUNES[data.colorTune].accent);
    card.style.setProperty("--player-soft", COLOR_TUNES[data.colorTune].soft);

    const progress = document.createElement("div");
    progress.className = "together-progress";
    progress.textContent = `Step ${step + 1} of 4 · ${role === "parent" ? "Parent" : "Child"} (${mode})`;
    card.appendChild(progress);
    card.appendChild(previewFigure(data.characterId, data.skinTone, data.colorTune));

    if (step === 0) {
      const h = document.createElement("h1");
      h.textContent = "Your name";
      card.appendChild(h);
      const p = document.createElement("p");
      p.className = "together-sub";
      p.textContent = "Shown on your badge so everyone knows who is who.";
      card.appendChild(p);
      const input = document.createElement("input");
      input.className = "typed-input";
      input.value = data.displayName;
      input.maxLength = 18;
      card.appendChild(input);
      card.appendChild(
        nextButton("Next", () => {
          data.displayName = input.value.trim() || data.displayName;
          step++;
          paint();
        }),
      );
    } else if (step === 1) {
      const h = document.createElement("h1");
      h.textContent = "Your color tune";
      card.appendChild(h);
      const p = document.createElement("p");
      p.className = "together-sub";
      p.textContent = "A glow that feels like you — it tints your badge.";
      card.appendChild(p);
      const grid = document.createElement("div");
      grid.className = "together-color-grid";
      (Object.keys(COLOR_TUNES) as ColorTuneId[]).forEach((id) => {
        const opt = document.createElement("button");
        opt.className = `together-color-swatch${data.colorTune === id ? " selected" : ""}`;
        opt.style.setProperty("--swatch", COLOR_TUNES[id].accent);
        opt.innerHTML = `<span class="swatch-dot"></span><span>${COLOR_TUNES[id].label}</span>`;
        opt.onclick = () => {
          data.colorTune = id;
          paint();
        };
        grid.appendChild(opt);
      });
      card.appendChild(grid);
      card.appendChild(
        nextButton("Next", () => {
          step++;
          paint();
        }),
      );
    } else if (step === 2) {
      const h = document.createElement("h1");
      h.textContent = "Your character";
      card.appendChild(h);
      const p = document.createElement("p");
      p.className = "together-sub";
      p.textContent = "Who represents you in Everbright?";
      card.appendChild(p);
      const grid = document.createElement("div");
      grid.className = "together-char-grid";
      for (const ch of PLAYER_CHARACTERS) {
        const opt = document.createElement("button");
        opt.className = `together-char-opt${data.characterId === ch.id ? " selected" : ""}`;
        opt.innerHTML = `<span class="char-emoji">${ch.emoji}</span><span>${ch.label}</span>`;
        opt.onclick = () => {
          data.characterId = ch.id;
          paint();
        };
        grid.appendChild(opt);
      }
      card.appendChild(grid);
      card.appendChild(
        nextButton("Next", () => {
          step++;
          paint();
        }),
      );
    } else {
      const h = document.createElement("h1");
      h.textContent = "Your look";
      card.appendChild(h);
      const p = document.createElement("p");
      p.className = "together-sub";
      p.textContent = "Pick a tone for your Adventurer.";
      card.appendChild(p);
      const grid = document.createElement("div");
      grid.className = "avatar-grid";
      const tones: TogetherPlayer["skinTone"][] = ["tone_1", "tone_2", "tone_3", "tone_4", "tone_5"];
      const labels = ["A", "B", "C", "D", "E"];
      tones.forEach((t, i) => {
        const opt = document.createElement("button");
        opt.className = `avatar-option${data.skinTone === t ? " selected" : ""}`;
        opt.textContent = labels[i] ?? t;
        opt.setAttribute("aria-label", `Skin tone ${i + 1}`);
        opt.onclick = () => {
          data.skinTone = t;
          paint();
        };
        grid.appendChild(opt);
      });
      card.appendChild(grid);
      const actionLabel = mode === "host" ? "Create invite" : "Join room";
      const actionBtn = nextButton(actionLabel, async () => {
        actionBtn.disabled = true;
        actionBtn.textContent = mode === "host" ? "Creating…" : "Joining…";
        await onDone(data);
      });
      card.appendChild(actionBtn);
    }

    const back = document.createElement("button");
    back.type = "button";
    back.className = "btn-secondary";
    back.style.marginTop = "8px";
    back.textContent = step === 0 ? "Back" : "Previous";
    back.onclick = () => {
      if (step === 0) onBack();
      else {
        step--;
        paint();
      }
    };
    card.appendChild(back);
  }

  paint();
  surface.appendChild(card);
  container.appendChild(surface);
}

/** Waiting room: share code/link until both seats are filled. Returns unwatch. */
export function renderTogetherWaiting(
  container: HTMLElement,
  room: TogetherRoom,
  onStart: (room: TogetherRoom) => void,
  onCancel: () => void,
): () => void {
  container.innerHTML = "";
  const surface = document.createElement("div");
  surface.className = "onboarding together-flow";
  const card = document.createElement("div");
  card.className = "onboarding-card together-card waiting-card";
  surface.appendChild(card);
  container.appendChild(surface);

  let current = room;

  function paint(): void {
    card.innerHTML = "";
    const ready = bothPlayersReady(current);

    const h = document.createElement("h1");
    h.textContent = ready ? "You are both ready!" : "Share this invite";
    card.appendChild(h);

    const codeBox = document.createElement("div");
    codeBox.className = "together-code-display";
    codeBox.textContent = current.code;
    card.appendChild(codeBox);

    const linkRow = document.createElement("div");
    linkRow.className = "together-link-row";
    const link = document.createElement("input");
    link.className = "typed-input";
    link.readOnly = true;
    link.value = inviteUrl(current.code);
    const copyBtn = document.createElement("button");
    copyBtn.className = "btn-secondary";
    copyBtn.textContent = "Copy link";
    copyBtn.onclick = async () => {
      try {
        await navigator.clipboard.writeText(link.value);
        copyBtn.textContent = "Copied!";
        setTimeout(() => {
          copyBtn.textContent = "Copy link";
        }, 1500);
      } catch {
        link.select();
      }
    };
    linkRow.appendChild(link);
    linkRow.appendChild(copyBtn);
    card.appendChild(linkRow);

    const seats = document.createElement("div");
    seats.className = "together-seats";
    for (const role of ["parent", "child"] as const) {
      const player = current.players.find((p) => p.role === role);
      const seat = document.createElement("div");
      seat.className = `together-seat${player ? " filled" : " empty"}`;
      if (player) {
        seat.style.setProperty("--player-accent", COLOR_TUNES[player.colorTune].accent);
        seat.innerHTML = `<strong>${player.displayName}</strong><span>${role === "parent" ? "Parent" : "Child"} · ready</span>`;
      } else {
        seat.innerHTML = `<strong>Waiting…</strong><span>${role === "parent" ? "Parent" : "Child"} seat</span>`;
      }
      seats.appendChild(seat);
    }
    card.appendChild(seats);

    const status = document.createElement("p");
    status.className = "together-wait-pulse";
    status.textContent = ready
      ? "Both players joined. Start when you are ready to pick a zone."
      : "Open the link on another phone or laptop (any browser), or share the 4-letter code.";
    card.appendChild(status);

    if (ready) {
      card.appendChild(
        nextButton("Let's play", () => {
          stop();
          onStart(current);
        }),
      );
    }

    const cancel = document.createElement("button");
    cancel.className = "btn-secondary";
    cancel.textContent = "Cancel invite";
    cancel.onclick = () => {
      stop();
      onCancel();
    };
    card.appendChild(cancel);
  }

  paint();
  let active = true;
  const unwatch = watchRoom(room.code, (next) => {
    current = next;
    paint();
  });

  function stop(): void {
    if (!active) return;
    active = false;
    unwatch();
  }

  return stop;
}
