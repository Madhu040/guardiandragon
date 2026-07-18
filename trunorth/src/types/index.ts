export type AgeBand = "5-7" | "8-10" | "11-15";
export type ScoreBand = "strong" | "partial" | "poor";
export type MovementTier = "A" | "B";
export type ExpressionState = "neutral" | "worried_sad" | "excited_glow";
export type ResidueLevel = "trusting" | "neutral" | "shaken";
export type RepairAction = "walk-back" | "offer-hand" | "sit-with" | "tap-kind-action";
export type SafetyFlag = "none" | "pii" | "distress" | "off_topic" | "profanity" | "jailbreak";
export type ScenePhase =
  | "loading"
  | "exploring"
  | "encounter"
  | "decision"
  | "awaitingCompanion"
  | "consequence"
  | "transitioning"
  | "paused"
  | "parentGate";

export type SkillId =
  | "empathy"
  | "calm"
  | "courage"
  | "self_worth"
  | "adapting_to_change"
  | "friendship_repair"
  | "worry_brave";

export type InputMode = "choice" | "typed" | "both";
export type ThemeSensitivity = "standard" | "sensitive";
export type PlayMode = "solo" | "together";

export interface AvatarConfig {
  skinTone: "tone_1" | "tone_2" | "tone_3" | "tone_4" | "tone_5";
  hair: "hair_curly" | "hair_straight" | "hair_braids" | "hair_short" | "hair_puffs";
}

export interface ChoiceOption {
  id: string;
  label: string;
  icon?: string;
  selScore: ScoreBand;
  consequenceRef?: string;
}

export interface Consequence {
  band: ScoreBand;
  sceneId: string;
  fx?: string[];
  meterDeltas?: Partial<Record<SkillId, number>>;
  repairAction?: RepairAction | null;
}

export interface EmotionalArc {
  childStateEntering: string;
  childStateExiting: Record<ScoreBand, string>;
  companionStance: Record<ScoreBand, string>;
  recoveryCadence: string;
}

export interface CompanionPromptContext {
  situation: string;
  npcEmotion?: string;
  ageBand: AgeBand;
}

export interface DecisionPoint {
  id: string;
  prompt: string;
  inputMode: InputMode;
  themeSensitivity: ThemeSensitivity;
  selSkills: SkillId[];
  pivotLockMs?: number;
  options?: ChoiceOption[];
  typedRubricRef?: string;
  companionContext: CompanionPromptContext;
  consequences: Consequence[];
  emotionalArc: EmotionalArc;
}

export interface SceneCharacter {
  assetRef: string;
  id: string;
  position: [number, number];
  expression?: string;
  /** Collision footprint [w, h] px override — e.g. an NPC wide enough to block the bridge. */
  solidSize?: [number, number];
}

export interface SceneTrigger {
  id: string;
  bounds: [number, number, number, number];
  action: "startDecision";
  target: string;
}

export interface SceneCollectible {
  id: string;
  assetRef: string;
  position: [number, number];
  kind: string;
  gate?: string;
}

/**
 * What happens when the player interacts with a stage object.
 * Extensible discriminated union — add new kinds here, then handle them in the
 * exhaustive switch in `main.ts` (`onStageObject`).
 */
export type StageObjectInteraction =
  | { kind: "openDialog"; dialogId: string }
  | { kind: "finish"; mode: "advance" | "complete"; targetSceneId?: string };

/** An interactable entity placed on a stage at a grid cell. */
export interface StageObject {
  id: string;
  /** Grid cell [col, row] in the 100×100 level grid; world pos = cell center. */
  cell: [number, number];
  /** Sprite key into `OBJECT_SPRITES` (`src/content/stageObjects.ts`). */
  assetRef: string;
  label?: string;
  /** Proximity hint text; defaults to "Press E to interact". */
  hint?: string;
  interaction: StageObjectInteraction;
}

export interface DialogPage {
  text: string;
  /** Overrides the dialog-level speaker for this page. */
  speaker?: string;
}

/** Authored dialog shown by `openDialog` objects (`content/chapters/<ch>/dlg_*.json`). */
export interface DialogRecord {
  id: string;
  chapterId: string;
  speaker?: string;
  /** Optional portrait rendered via `renderFullBodyCharacter`. */
  speakerAssetRef?: string;
  pages: DialogPage[];
}

export interface Scene {
  id: string;
  chapterId: string;
  order: number;
  movementTier: MovementTier;
  background: string;
  narration?: string;
  characters: SceneCharacter[];
  triggers: SceneTrigger[];
  collectibles: SceneCollectible[];
  decisionPoints: string[];
  nextSceneId?: string;
  /** Grid level id (`src/content/gridLevels.ts`) — replaces the image background. */
  gridMapId?: string;
  /** Interactable stage objects placed on the level grid. */
  objects?: StageObject[];
}

export type CheckinPlacement = "bright" | "steady" | "gentle";

/** Result of the pre-level check-in (`src/counselor/checkin.ts`). Answer text is never stored. */
export interface CheckinRecord {
  chapterId: string;
  at: string;
  answers: { questionId: string; points: number }[];
  totalPoints: number;
  maxPoints: number;
  /** 0–10 placement point shown on the compass scale. */
  startingPoint: number;
  placement: CheckinPlacement;
  safetyFlag: SafetyFlag;
}

export interface GameEvent {
  id: string;
  timestamp: string;
  sceneId: string;
  decisionPointId: string;
  scoreBand: ScoreBand;
  skill?: SkillId;
  safetyFlag: SafetyFlag;
}

export interface GameState {
  version: 1;
  profile: {
    childDisplayName?: string;
    ageBand: AgeBand;
    chapterId: string;
    avatar: AvatarConfig;
    companionName: string;
    companionArchetype: string;
    baselineStrength: string;
  };
  progress: {
    currentSceneId: string;
    chaptersUnlocked: string[];
    chaptersCompleted: string[];
    browniePoints: number;
    kindnessSparksFound: Record<string, string[]>;
    /** Latest pre-level check-in per chapter id. */
    checkins?: Record<string, CheckinRecord>;
  };
  meters: Record<SkillId, { fill: number; level: number }>;
  companion: { level: 1 | 2 | 3; appearanceRef: string };
  emotionalResidue: Record<string, Record<string, ResidueLevel>>;
  parentGate: { lastPassedChapter: string | null; pinHash?: string };
  flags: {
    demoMode: boolean;
    lastSafetyFlag: SafetyFlag | null;
    onboardingComplete: boolean;
    playMode: PlayMode;
  };
  eventLog: GameEvent[];
}

export interface CompanionRequest {
  decisionPointId: string;
  sceneId: string;
  chapterId: string;
  ageBand: AgeBand;
  inputMode: InputMode;
  childInput: string;
  companionContext: CompanionPromptContext;
  strengthsSnapshot?: string[];
  companion: { name: string; archetype: string };
  playMode?: PlayMode;
  parentReflection?: string;
}

export interface CompanionResponse {
  scoreBand: ScoreBand;
  skill: SkillId;
  matchedCriterion?: string;
  confidence: number;
  companionLine: string;
  counselorInsight?: string;
  parentTip?: string;
  redirect: boolean;
  safetyFlag: SafetyFlag;
}

export interface ScenarioMeta {
  id: string;
  audience: "child" | "parent";
  title: string;
  subtitle: string;
  description: string;
  startSceneId: string;
  ageBand: AgeBand;
  skills: SkillId[];
  estimatedMinutes: number;
}

export interface ProgressStore {
  load(): Promise<GameState | null>;
  save(state: GameState): Promise<void>;
  clear(): Promise<void>;
  appendEvent(event: GameEvent): Promise<void>;
}

export type UserRole = "parent" | "superadmin";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface ChildProfile {
  id: string;
  parentId: string;
  displayName: string;
  ageBand: AgeBand;
  avatarJson: string;
  createdAt: string;
}

export function createDefaultMeters(): GameState["meters"] {
  const skills: SkillId[] = [
    "empathy", "calm", "courage", "self_worth",
    "adapting_to_change", "friendship_repair", "worry_brave",
  ];
  return Object.fromEntries(skills.map((s) => [s, { fill: 0, level: 1 }])) as GameState["meters"];
}

