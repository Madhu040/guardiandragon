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
  /** Fed by the touch joystick (TouchControls.ts) — a second input source, not a replacement. */
  private touchVector = { x: 0, y: 0 };
  private touchInteractQueued = false;

  attach(): void {
    window.addEventListener("keydown", this.boundKeyDown);
    window.addEventListener("keyup", this.boundKeyUp);
  }

  detach(): void {
    window.removeEventListener("keydown", this.boundKeyDown);
    window.removeEventListener("keyup", this.boundKeyUp);
    this.pressed.clear();
    this.interactQueued = false;
    this.touchVector = { x: 0, y: 0 };
    this.touchInteractQueued = false;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.pressed.clear();
      this.interactQueued = false;
      this.touchVector = { x: 0, y: 0 };
      this.touchInteractQueued = false;
    }
  }

  /** Live joystick vector, already normalized to the unit circle by the touch layer. */
  setTouchVector(x: number, y: number): void {
    this.touchVector = { x, y };
  }

  /** One-shot tap on the touch interact button — merges into the same queue as E/Space/Enter. */
  queueTouchInteract(): void {
    this.touchInteractQueued = true;
  }

  /**
   * Normalized move vector in world space (x right, y down). Keyboard and touch are two
   * input sources feeding the same vector — summed then clamped to the unit circle, rather
   * than one replacing the other, so nothing needs to know which device is in use.
   */
  getMoveVector(): { x: number; y: number } {
    if (!this.enabled) return { x: 0, y: 0 };
    let x = 0;
    let y = 0;
    if (this.pressed.has("ArrowLeft") || this.pressed.has("a") || this.pressed.has("A")) x -= 1;
    if (this.pressed.has("ArrowRight") || this.pressed.has("d") || this.pressed.has("D")) x += 1;
    if (this.pressed.has("ArrowUp") || this.pressed.has("w") || this.pressed.has("W")) y -= 1;
    if (this.pressed.has("ArrowDown") || this.pressed.has("s") || this.pressed.has("S")) y += 1;
    x += this.touchVector.x;
    y += this.touchVector.y;
    const mag = Math.hypot(x, y);
    if (mag > 1) {
      x /= mag;
      y /= mag;
    }
    return { x, y };
  }

  getFacing(fallback: Facing = "down"): Facing {
    const { x, y } = this.getMoveVector();
    if (x === 0 && y === 0) return fallback;
    if (Math.abs(x) > Math.abs(y)) return x > 0 ? "right" : "left";
    return y > 0 ? "down" : "up";
  }

  /** Consume a one-shot interact press (E / Space / Enter, or a tap of the touch button). */
  consumeInteract(): boolean {
    if (!this.interactQueued && !this.touchInteractQueued) return false;
    this.interactQueued = false;
    this.touchInteractQueued = false;
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
