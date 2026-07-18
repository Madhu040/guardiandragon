/**
 * Exploration world runtime: move avatar (+ follower companion), collide with
 * environment solids, pick up collectibles, and interact with nearby triggers/NPCs.
 */

import type { Scene, SceneCharacter, StageObject } from "../types/index.js";
import { appConfig } from "../config/app.js";
import { InputController, type Facing } from "../input/InputController.js";
import { moveWithGridCollision } from "./GridMap.js";
import { resolveGridLevel, type GridLevel } from "../content/gridLevels.js";
import { objectWorldPos, sceneObjects } from "../content/stageObjects.js";
import {
  WORLD_H,
  WORLD_W,
  aabbOverlap,
  characterFeetBox,
  defaultWalkBounds,
  distance,
  expandAabb,
  moveWithCollision,
  type Aabb,
  type Vec2,
} from "./Collision.js";

export interface WorldCallbacks {
  onInteract: (decisionTarget: string) => void;
  onCollect: (collectibleId: string) => void;
  onObjectInteract?: (objectId: string) => void;
}

/** What the avatar is currently in range of (trigger zone or stage object). */
export type NearInteractable =
  | { type: "trigger"; target: string }
  | { type: "object"; objectId: string; hint?: string };

interface SolidBody {
  id: string;
  box: Aabb;
}

const SOLID_SKIP = new Set(["avatar", "companion", "worry_cloud"]);

/**
 * Character sprites anchor at the feet (translate(-50%, -100%), ~110px tall), so
 * the visual center sits this far above the position point. Grid collision tests
 * the avatar's center, per the level design convention.
 */
const AVATAR_CENTER_OFFSET_Y = 55;

export class WorldRuntime {
  private input = new InputController();
  private raf = 0;
  private lastTs = 0;
  private attached = false;
  private sceneId: string | null = null;
  private viewport: HTMLElement | null = null;
  private scene: Scene | null = null;
  private callbacks: WorldCallbacks | null = null;
  private frozen = true;

  private avatar: Vec2 = { x: 640, y: 800 };
  private companion: Vec2 = { x: 520, y: 760 };
  private facing: Facing = "down";
  private collected = new Set<string>();
  private nearTarget: NearInteractable | null = null;
  private solids: SolidBody[] = [];
  private walkBounds = defaultWalkBounds();
  private grid: GridLevel | null = null;

  attach(
    viewport: HTMLElement,
    scene: Scene,
    exploring: boolean,
    callbacks: WorldCallbacks,
  ): void {
    if (!appConfig.features.worldMovement) {
      this.detach();
      return;
    }

    const sceneChanged = this.sceneId !== scene.id;
    this.viewport = viewport;
    this.scene = scene;
    this.callbacks = callbacks;
    this.frozen = !exploring;

    if (sceneChanged || !this.attached) {
      this.sceneId = scene.id;
      this.collected.clear();
      this.grid = resolveGridLevel(scene);
      this.seedFromScene(scene);
      this.rebuildSolids(scene);
      if (this.grid) {
        const spawn = this.grid.map.cellCenterWorld(...this.grid.spawnCell);
        this.avatar = { x: spawn.x, y: spawn.y + AVATAR_CENTER_OFFSET_Y };
        this.companion = { x: this.avatar.x - 100, y: this.avatar.y };
      }
    }

    this.applyDomPositions();
    this.syncCollectibleDom();
    this.renderHint();

    if (!this.attached) {
      this.input.attach();
      this.attached = true;
      this.lastTs = performance.now();
      this.raf = requestAnimationFrame((t) => this.tick(t));
    }

    this.input.setEnabled(exploring);
  }

  private syncCollectibleDom(): void {
    if (!this.viewport) return;
    for (const id of this.collected) {
      this.viewport.querySelector(`[data-collectible-id="${id}"]`)?.classList.add("collected");
    }
  }

  detach(): void {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.input.detach();
    this.attached = false;
    this.viewport = null;
    this.scene = null;
    this.callbacks = null;
    this.sceneId = null;
    this.clearHint();
  }

  freeze(frozen: boolean): void {
    this.frozen = frozen;
    this.input.setEnabled(!frozen && appConfig.features.worldMovement);
  }

  private seedFromScene(scene: Scene): void {
    const avatar = scene.characters.find((c) => c.id === "avatar");
    const companion = scene.characters.find((c) => c.id === "companion");
    if (avatar) this.avatar = { x: avatar.position[0], y: avatar.position[1] };
    if (companion) this.companion = { x: companion.position[0], y: companion.position[1] };
    else this.companion = { x: this.avatar.x - 100, y: this.avatar.y };
  }

  private rebuildSolids(scene: Scene): void {
    this.solids = scene.characters
      .filter((c) => !SOLID_SKIP.has(c.id))
      .map((c) => ({
        id: c.id,
        box: characterFeetBox(
          c.position[0],
          c.position[1],
          c.solidSize?.[0] ?? 70,
          c.solidSize?.[1] ?? 42,
        ),
      }));

    // Soft river/ledge band for bridge scenes — keep feet on the walkable bank.
    if (scene.background.includes("bridge") || scene.id.startsWith("w")) {
      this.walkBounds = {
        x: 60,
        y: Math.floor(WORLD_H * 0.48),
        w: WORLD_W - 120,
        h: Math.floor(WORLD_H * 0.42),
      };
    } else {
      this.walkBounds = defaultWalkBounds();
    }
  }

  private tick(ts: number): void {
    this.raf = requestAnimationFrame((t) => this.tick(t));
    if (!this.attached || !this.scene || !this.viewport) return;

    const dt = Math.min(0.05, (ts - this.lastTs) / 1000);
    this.lastTs = ts;

    if (!this.frozen) {
      this.stepMovement(dt);
      this.followCompanion(dt);
      this.checkCollectibles();
      this.updateProximity();
      if (this.input.consumeInteract() && this.nearTarget) {
        if (this.nearTarget.type === "trigger") {
          this.callbacks?.onInteract(this.nearTarget.target);
        } else {
          this.callbacks?.onObjectInteract?.(this.nearTarget.objectId);
        }
      }
    }

    this.applyDomPositions();
    this.renderHint();
  }

  private stepMovement(dt: number): void {
    const move = this.input.getMoveVector();
    if (move.x === 0 && move.y === 0) return;

    this.facing = this.input.getFacing(this.facing);
    const speed = appConfig.world.moveSpeedPx;
    const delta = { x: move.x * speed * dt, y: move.y * speed * dt };
    const footprint = { w: 56, h: 36 };
    const solidBoxes = this.solids.map((s) => s.box);

    if (this.grid) {
      const center = { x: this.avatar.x, y: this.avatar.y - AVATAR_CENTER_OFFSET_Y };
      const moved = moveWithGridCollision(center, delta, this.grid.map, solidBoxes);
      this.avatar = { x: moved.x, y: moved.y + AVATAR_CENTER_OFFSET_Y };
      return;
    }

    this.avatar = moveWithCollision(
      this.avatar,
      delta,
      footprint,
      solidBoxes,
      this.walkBounds,
    );
  }

  private followCompanion(dt: number): void {
    const lag = appConfig.world.companionFollowLag;
    const target = {
      x: this.avatar.x - (this.facing === "right" ? 90 : this.facing === "left" ? -90 : 70),
      y: this.avatar.y - 10,
    };
    const t = 1 - Math.pow(lag, dt * 60);
    this.companion.x += (target.x - this.companion.x) * t;
    this.companion.y += (target.y - this.companion.y) * t;
  }

  private checkCollectibles(): void {
    if (!this.scene) return;
    const feet = characterFeetBox(this.avatar.x, this.avatar.y);
    for (const c of this.scene.collectibles) {
      if (this.collected.has(c.id)) continue;
      const box = characterFeetBox(c.position[0], c.position[1], 48, 48);
      if (aabbOverlap(feet, expandAabb(box, 12))) {
        this.collected.add(c.id);
        this.callbacks?.onCollect(c.id);
        const el = this.viewport?.querySelector(`[data-collectible-id="${c.id}"]`);
        if (el) el.classList.add("collected");
      }
    }
  }

  private updateProximity(): void {
    this.nearTarget = null;
    if (!this.scene) return;

    const radius = appConfig.world.interactRadiusPx;
    const avatarFeet = { x: this.avatar.x, y: this.avatar.y };

    for (const trigger of this.scene.triggers) {
      const [x, y, w, h] = trigger.bounds;
      const zone: Aabb = { x, y, w, h };
      const center = { x: x + w / 2, y: y + h / 2 };
      const feet = characterFeetBox(this.avatar.x, this.avatar.y);
      if (aabbOverlap(feet, expandAabb(zone, 24)) || distance(avatarFeet, center) <= radius) {
        this.nearTarget = { type: "trigger", target: trigger.target };
        return;
      }
    }

    // Stage objects: nearest one within the interact radius.
    let nearestObj: StageObject | null = null;
    let nearestDist = Infinity;
    for (const obj of sceneObjects(this.scene)) {
      const d = distance(avatarFeet, objectWorldPos(obj));
      if (d <= radius && d < nearestDist) {
        nearestObj = obj;
        nearestDist = d;
      }
    }
    if (nearestObj) {
      this.nearTarget = { type: "object", objectId: nearestObj.id, hint: nearestObj.hint };
      return;
    }

    // Fallback: stand near interactive NPCs (non-avatar/companion).
    for (const ch of this.scene.characters) {
      if (SOLID_SKIP.has(ch.id)) continue;
      const d = distance(avatarFeet, { x: ch.position[0], y: ch.position[1] });
      if (d <= radius) {
        const trigger = this.scene.triggers[0];
        if (trigger) this.nearTarget = { type: "trigger", target: trigger.target };
        return;
      }
    }
  }

  private applyDomPositions(): void {
    if (!this.viewport) return;
    this.placeEl(this.viewport.querySelector<HTMLElement>('[data-char-id="avatar"]'), this.avatar, true);
    this.placeEl(this.viewport.querySelector<HTMLElement>('[data-char-id="companion"]'), this.companion, false);

    for (const ch of this.scene?.characters ?? []) {
      if (ch.id === "avatar" || ch.id === "companion") continue;
      // Depth sort: higher feet-y draws later
    }
    this.sortDepth();
  }

  private placeEl(el: HTMLElement | null, pos: Vec2, isAvatar: boolean): void {
    if (!el) return;
    el.style.left = `${(pos.x / WORLD_W) * 100}%`;
    el.style.top = `${(pos.y / WORLD_H) * 100}%`;
    el.classList.toggle("is-moving", isAvatar && !this.frozen);
    el.dataset.facing = this.facing;
    el.style.zIndex = String(10 + Math.floor(pos.y / 20));
  }

  private sortDepth(): void {
    if (!this.viewport) return;
    const chars = [...this.viewport.querySelectorAll<HTMLElement>(".character.full-body")];
    chars.sort((a, b) => {
      const ay = parseFloat(a.style.top) || 0;
      const by = parseFloat(b.style.top) || 0;
      return ay - by;
    });
    for (const el of chars) this.viewport.appendChild(el);
  }

  private renderHint(): void {
    if (!this.viewport) return;
    let hint = this.viewport.querySelector<HTMLElement>(".interact-hint");
    if (!hint) {
      hint = document.createElement("div");
      hint.className = "interact-hint";
      this.viewport.appendChild(hint);
    }

    const moveHint = this.viewport.querySelector<HTMLElement>(".move-hint");
    if (!moveHint && !this.frozen) {
      const mh = document.createElement("div");
      mh.className = "move-hint";
      mh.textContent = "Move: WASD / arrows · Interact: E or Space";
      this.viewport.appendChild(mh);
    } else if (moveHint) {
      moveHint.style.display = this.frozen ? "none" : "block";
    }

    if (this.nearTarget && !this.frozen) {
      hint.hidden = false;
      hint.textContent =
        (this.nearTarget.type === "object" && this.nearTarget.hint) || "Press E to interact";
      hint.style.left = `${(this.avatar.x / WORLD_W) * 100}%`;
      hint.style.top = `${((this.avatar.y - 160) / WORLD_H) * 100}%`;
    } else {
      hint.hidden = true;
    }

    // Highlight the in-range trigger zone / stage object
    const near = this.frozen ? null : this.nearTarget;
    for (const zone of this.viewport.querySelectorAll<HTMLElement>(".trigger-zone")) {
      zone.classList.toggle(
        "in-range",
        near?.type === "trigger" && zone.dataset.target === near.target,
      );
    }
    for (const el of this.viewport.querySelectorAll<HTMLElement>(".stage-object")) {
      el.classList.toggle(
        "in-range",
        near?.type === "object" && el.dataset.objectId === near.objectId,
      );
    }
  }

  private clearHint(): void {
    this.viewport?.querySelector(".interact-hint")?.remove();
    this.viewport?.querySelector(".move-hint")?.remove();
  }
}

export const worldRuntime = new WorldRuntime();

/** Expose scene character seeds for tests / tooling. */
export function avatarStartFromScene(scene: Scene): Vec2 {
  const avatar = scene.characters.find((c: SceneCharacter) => c.id === "avatar");
  return avatar
    ? { x: avatar.position[0], y: avatar.position[1] }
    : { x: WORLD_W / 2, y: WORLD_H * 0.75 };
}
