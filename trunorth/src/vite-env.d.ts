/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_DEMO_MODE?: string;
  readonly VITE_FEATURE_PARENT_AUTH?: string;
  readonly VITE_FEATURE_TOGETHER_MODE?: string;
  readonly VITE_FEATURE_SCENARIO_HUB?: string;
  readonly VITE_FEATURE_WORLD_MOVEMENT?: string;
  readonly VITE_MOVE_SPEED?: string;
  readonly VITE_INTERACT_RADIUS?: string;
  readonly VITE_COMPANION_FOLLOW_LAG?: string;
  readonly VITE_DEFAULT_COMPANION_NAME?: string;
  readonly VITE_DEFAULT_COMPANION_ARCHETYPE?: string;
  readonly VITE_DEFAULT_CHAPTER_ID?: string;
  readonly VITE_DEFAULT_START_SCENE?: string;
  readonly VITE_DEFAULT_AGE_BAND?: string;
  readonly VITE_DEFAULT_BASELINE_STRENGTH?: string;
  readonly VITE_NARRATION_AUTO_ADVANCE_MS?: string;
  readonly VITE_DEMO_COMPANION_DELAY_MS?: string;
  readonly VITE_PRODUCT_NAME?: string;
  readonly VITE_DEV_PORT?: string;
  readonly VITE_API_PROXY_TARGET?: string;
  readonly VITE_PREVIEW_PORT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
