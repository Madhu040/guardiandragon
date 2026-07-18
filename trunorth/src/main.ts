import "./styles/global.css";
import { SceneEngine } from "./engine/SceneEngine.js";
import { worldRuntime } from "./engine/WorldRuntime.js";
import { LocalProgressStore, DemoProgressStore } from "./store/ProgressStore.js";
import { LiveCompanionClient, DemoCompanionClient } from "./companion/CompanionClient.js";
import { createInitialGameState } from "./config/gameState.js";
import { appConfig, isDemoMode } from "./config/app.js";
import type { GameState, ScenePhase, ScenarioMeta, Scene } from "./types/index.js";
import {
  renderGameView,
  renderCelebration,
  renderParentGate,
  renderTrustScreen,
  renderJourneyReflection,
  type CounselorPanelData,
  type CoPlayStep,
  type DialogViewState,
} from "./ui/GameView.js";
import { getDialog } from "./content/index.js";
import {
  renderLanding,
  renderAuthForm,
  renderOnboarding,
  renderScenarioHub,
  renderCheckin,
} from "./ui/screens.js";
import { getToken } from "./ui/auth.js";
import { speakLine, stopSpeaking } from "./audio/speech.js";
import { buildJourneyReflection } from "./counselor/insights.js";
import { SCENARIOS } from "./content/scenarios.js";

type AppScreen =
  | "landing"
  | "trust"
  | "onboarding"
  | "hub"
  | "checkin"
  | "game"
  | "parentGate"
  | "celebration"
  | "reflection"
  | "login"
  | "register";

const demoMode = isDemoMode();
const API_URL = appConfig.apiUrl;

let currentScreen: AppScreen = "landing";
let gameState: GameState = createInitialGameState(demoMode);
let engine: SceneEngine | null = null;
let activeDecisionId: string | null = null;
let companionLine: string | null = null;
let counselorPanel: CounselorPanelData | null = null;
let currentPhase: ScenePhase = "loading";
let activeScenarioTitle = "Adventure complete";
let parentGateNext: AppScreen = "reflection";
let coPlayStep: CoPlayStep = "discuss";
let pendingScenario: ScenarioMeta | null = null;
let pendingPlayMode: "solo" | "together" = "solo";
let activeDialog: DialogViewState | null = null;

const app = document.getElementById("app")!;

function navigate(screen: AppScreen): void {
  if (screen !== "game") {
    worldRuntime.detach();
    stopSpeaking();
    activeDialog = null;
  }
  currentScreen = screen;
  render();
}

function beginEncounter(target: string): void {
  activeDecisionId = target;
  engine?.triggerEncounter(target);
  currentPhase = "decision";
  worldRuntime.freeze(true);
  if (gameState.flags.playMode === "together") {
    coPlayStep = "discuss";
  }
  renderGame();
}

function onWorldCollect(collectibleId: string): void {
  gameState.progress.browniePoints += 1;
  const sceneId = gameState.progress.currentSceneId;
  const found = gameState.progress.kindnessSparksFound[sceneId] ?? [];
  if (!found.includes(collectibleId)) {
    gameState.progress.kindnessSparksFound[sceneId] = [...found, collectibleId];
  }
  void new LocalProgressStore().save(gameState);
  const counter = document.querySelector(".brownie-counter");
  if (counter) {
    counter.textContent = `💎 ${gameState.progress.browniePoints}`;
    counter.setAttribute("aria-label", `Crystals collected: ${gameState.progress.browniePoints}`);
  }
}

function bindWorld(viewport: HTMLElement, scene: Scene, exploring: boolean): void {
  worldRuntime.attach(viewport, scene, exploring && activeDialog === null, {
    onInteract: (target) => beginEncounter(target),
    onCollect: onWorldCollect,
    onObjectInteract: onStageObject,
  });
}

/** Dispatch a stage-object interaction — the extension point for new kinds. */
function onStageObject(objectId: string): void {
  const obj = engine?.getCurrentScene()?.objects?.find((o) => o.id === objectId);
  if (!obj) return;
  const interaction = obj.interaction;
  switch (interaction.kind) {
    case "openDialog":
      if (!getDialog(interaction.dialogId)) return;
      activeDialog = { id: interaction.dialogId, page: 0 };
      worldRuntime.freeze(true);
      renderGame();
      break;
    case "finish":
      if (interaction.mode === "complete") {
        void engine?.completeChapter();
      } else {
        void engine?.advanceScene(interaction.targetSceneId);
      }
      break;
    default: {
      const _exhaustive: never = interaction;
      void _exhaustive;
    }
  }
}

function closeDialog(): void {
  activeDialog = null;
  worldRuntime.freeze(false);
  // Defer so the closing click finishes on the old DOM — otherwise the browser
  // retargets it to whatever (e.g. a trigger zone) appears under the cursor.
  setTimeout(renderGame, 0);
}

async function startScenario(scenario: ScenarioMeta, playMode: "solo" | "together" = "solo"): Promise<void> {
  activeScenarioTitle = scenario.title;
  gameState.profile.chapterId = scenario.id;
  gameState.profile.ageBand = scenario.ageBand;
  gameState.progress.currentSceneId = scenario.startSceneId;
  gameState.flags.demoMode = demoMode;
  gameState.flags.playMode = playMode;
  coPlayStep = "discuss";

  const store = demoMode
    ? new DemoProgressStore(gameState)
    : new LocalProgressStore();

  await store.save(gameState);

  const companion = demoMode
    ? new DemoCompanionClient()
    : new LiveCompanionClient(API_URL, getToken() ?? undefined);

  engine = new SceneEngine(gameState, store, companion, {
    onPhaseChange: (phase) => {
      currentPhase = phase;
      if (phase === "decision" || phase === "encounter") {
        const scene = engine?.getCurrentScene();
        if (scene?.decisionPoints[0]) {
          activeDecisionId = scene.decisionPoints[0];
        }
        if (gameState.flags.playMode === "together") {
          coPlayStep = "discuss";
        }
      } else if (phase !== "consequence") {
        activeDecisionId = null;
      }
      renderGame();
    },
    onSceneChange: () => {
      gameState = engine?.getState() ?? gameState;
      renderGame();
    },
    onCompanionLine: (line) => {
      companionLine = line;
      speakLine(line);
      renderGame();
    },
    onCounselorInsight: (insight) => {
      counselorPanel = insight;
      renderGame();
    },
    onMeterJuice: () => renderGame(),
    onCelebration: () => {
      gameState = engine?.getState() ?? gameState;
      navigate("celebration");
    },
    onError: (msg) => console.error(msg),
  });

  gameState = engine.getState();
  counselorPanel = null;
  companionLine = null;
  activeDialog = null;
  await engine.loadScene(scenario.startSceneId);
  navigate("game");
}

function renderGame(): void {
  if (currentScreen !== "game") return;
  const scene = engine?.getCurrentScene() ?? null;
  renderGameView(
    app,
    gameState,
    scene,
    currentPhase,
    companionLine,
    activeDecisionId,
    counselorPanel,
    (dpId, optId, parentReflection) => {
      coPlayStep = "discuss";
      void engine?.submitChoice(dpId, optId, parentReflection);
    },
    (dpId, text, parentReflection) => {
      coPlayStep = "discuss";
      void engine?.submitTyped(dpId, text, parentReflection);
    },
    (target) => beginEncounter(target),
    gameState.flags.playMode === "together",
    coPlayStep,
    () => {
      coPlayStep = "choose";
      renderGame();
    },
    (viewport, sceneEl, exploring) => bindWorld(viewport, sceneEl, exploring),
    onStageObject,
    activeDialog,
    () => {
      if (activeDialog) {
        activeDialog = { ...activeDialog, page: activeDialog.page + 1 };
        renderGame();
      }
    },
    closeDialog,
  );
}

function goToHub(): void {
  navigate("hub");
}

function render(): void {
  switch (currentScreen) {
    case "landing":
      renderLanding(
        app,
        () => {
          gameState.flags.playMode = "solo";
          if (!localStorage.getItem("trunorth_trust_seen")) {
            navigate("trust");
          } else if (!gameState.flags.onboardingComplete) {
            navigate("onboarding");
          } else {
            navigate("hub");
          }
        },
        () => {
          gameState.flags.playMode = "together";
          if (!localStorage.getItem("trunorth_trust_seen")) {
            navigate("trust");
          } else if (!gameState.flags.onboardingComplete) {
            navigate("onboarding");
          } else {
            navigate("hub");
          }
        },
        (s) => navigate(s),
      );
      break;

    case "trust":
      renderTrustScreen(app, () => {
        localStorage.setItem("trunorth_trust_seen", "1");
        navigate(gameState.flags.onboardingComplete ? "hub" : "onboarding");
      });
      break;

    case "onboarding":
      renderOnboarding(app, (data) => {
        gameState.profile.companionName = data.companionName;
        gameState.profile.companionArchetype = data.companionArchetype;
        gameState.profile.avatar = data.avatar as GameState["profile"]["avatar"];
        gameState.profile.ageBand = data.ageBand as GameState["profile"]["ageBand"];
        gameState.profile.baselineStrength = data.baselineStrength;
        gameState.flags.onboardingComplete = true;
        void new LocalProgressStore().save(gameState);
        navigate("hub");
      });
      break;

    case "hub":
      renderScenarioHub(
        app,
        gameState.progress.chaptersCompleted,
        gameState.flags.playMode,
        (scenario) => {
          pendingScenario = scenario;
          pendingPlayMode = "solo";
          navigate("checkin");
        },
        (scenario) => {
          pendingScenario = scenario;
          pendingPlayMode = "together";
          navigate("checkin");
        },
        () => {
          parentGateNext = "reflection";
          navigate("parentGate");
        },
        () => navigate("landing"),
      );
      break;

    case "checkin": {
      const scenario = pendingScenario;
      if (!scenario) {
        navigate("hub");
        break;
      }
      renderCheckin(
        app,
        scenario,
        gameState.profile.companionName,
        (result) => {
          if (result) {
            gameState.progress.checkins = {
              ...(gameState.progress.checkins ?? {}),
              [scenario.id]: result,
            };
            if (result.safetyFlag !== "none") {
              gameState.flags.lastSafetyFlag = result.safetyFlag;
            }
          }
          void startScenario(scenario, pendingPlayMode);
        },
        goToHub,
      );
      break;
    }

    case "game":
      renderGame();
      break;

    case "celebration":
      renderCelebration(
        app,
        activeScenarioTitle,
        () => {
          parentGateNext = "reflection";
          navigate("parentGate");
        },
        goToHub,
      );
      break;

    case "reflection": {
      const reflection = buildJourneyReflection(gameState);
      renderJourneyReflection(app, reflection, goToHub);
      break;
    }

    case "parentGate":
      renderParentGate(
        app,
        () => navigate(parentGateNext),
        () => {},
      );
      break;

    case "login":
      renderAuthForm(app, "login", () => navigate("hub"), () => navigate("landing"));
      break;

    case "register":
      renderAuthForm(app, "register", () => navigate("hub"), () => navigate("landing"));
      break;
  }
}

// Restore saved profile if present
void (async () => {
  const saved = await new LocalProgressStore().load();
  if (saved) {
    gameState = saved;
    gameState.flags.demoMode = demoMode;
    if (!gameState.flags.playMode) {
      gameState.flags.playMode = "solo";
    }
  }
  render();
})();

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register("/sw.js").catch(() => {});
}

// Keep SCENARIOS referenced for tree-shaking clarity in hub
void SCENARIOS;
