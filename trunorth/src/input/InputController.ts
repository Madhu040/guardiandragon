/** Keyboard state for world movement — holds polling for smooth motion. */

const MOVE_KEYS = new Set([
  "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
  "w", "a", "s", "d", "W", "A", "S", "D",
]);

const INTERACT_KEYS = new Set(["e", "E", " ", "Enter"]);

export type Facing = "up" | "down" | "left" | "right";

export class InputController {
  private pressed = new Set<string>();
  private interactQueued = false;
  private enabled = true;
  private boundKeyDown = (e: KeyboardEvent) => this.onKeyDown(e);
  private boundKeyUp = (e: KeyboardEvent) => this.onKeyUp(e);

  attach(): void {
    window.addEventListener("keydown", this.boundKeyDown);
    window.addEventListener("keyup", this.boundKeyUp);
  }

  detach(): void {
    window.removeEventListener("keydown", this.boundKeyDown);
    window.removeEventListener("keyup", this.boundKeyUp);
    this.pressed.clear();
    this.interactQueued = false;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.pressed.clear();
      this.interactQueued = false;
    }
  }

  /** Normalized move vector in world space (x right, y down). */
  getMoveVector(): { x: number; y: number } {
    if (!this.enabled) return { x: 0, y: 0 };
    let x = 0;
    let y = 0;
    if (this.pressed.has("ArrowLeft") || this.pressed.has("a") || this.pressed.has("A")) x -= 1;
    if (this.pressed.has("ArrowRight") || this.pressed.has("d") || this.pressed.has("D")) x += 1;
    if (this.pressed.has("ArrowUp") || this.pressed.has("w") || this.pressed.has("W")) y -= 1;
    if (this.pressed.has("ArrowDown") || this.pressed.has("s") || this.pressed.has("S")) y += 1;
    if (x !== 0 && y !== 0) {
      const inv = 1 / Math.SQRT2;
      x *= inv;
      y *= inv;
    }
    return { x, y };
  }

  getFacing(fallback: Facing = "down"): Facing {
    const { x, y } = this.getMoveVector();
    if (x === 0 && y === 0) return fallback;
    if (Math.abs(x) > Math.abs(y)) return x > 0 ? "right" : "left";
    return y > 0 ? "down" : "up";
  }

  /** Consume a one-shot interact press (E / Space / Enter). */
  consumeInteract(): boolean {
    if (!this.interactQueued) return false;
    this.interactQueued = false;
    return true;
  }

  private onKeyDown(e: KeyboardEvent): void {
    if (!this.enabled) return;
    const target = e.target as HTMLElement | null;
    if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
      return;
    }
    if (MOVE_KEYS.has(e.key)) {
      this.pressed.add(e.key);
      e.preventDefault();
    }
    if (INTERACT_KEYS.has(e.key)) {
      this.interactQueued = true;
      e.preventDefault();
    }
  }

  private onKeyUp(e: KeyboardEvent): void {
    this.pressed.delete(e.key);
  }
}
