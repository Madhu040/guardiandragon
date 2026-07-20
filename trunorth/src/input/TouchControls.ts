/**
 * Touch input for coarse-pointer devices (phones/tablets) — a floating virtual joystick
 * + an interact button, feeding the same `InputController` the keyboard already drives.
 * `supportsTouch()` gates whether any of this ever mounts, so a mouse/trackpad device
 * never creates the DOM or attaches a single listener for it.
 *
 * "Floating" rather than fixed in a corner: the joystick has no resting position at all
 * until touched — put a finger down anywhere on the stage (except directly on the
 * interact button) and the joystick appears right there, drag from that point. This
 * reads as "just use your finger" rather than "find the on-screen gamepad."
 */

import type { InputController } from "./InputController.js";

/** True on touch-primary devices (phones/tablets); false for mouse/trackpad-primary. */
export function supportsTouch(): boolean {
  return typeof matchMedia !== "undefined" && matchMedia("(pointer: coarse)").matches;
}

export function mountTouchControls(viewport: HTMLElement, input: InputController): void {
  const wrap = document.createElement("div");
  wrap.className = "touch-controls";

  // Covers the whole stage and catches every pointerdown that isn't on the interact
  // button — DOM order (below) puts the button on top for hit-testing at its own
  // footprint, so no explicit exclusion rectangle is needed.
  const moveZone = document.createElement("div");
  moveZone.className = "touch-move-zone";
  moveZone.setAttribute("aria-hidden", "true"); // a drag surface, not a discrete AT control

  const joystick = document.createElement("div");
  joystick.className = "touch-joystick";
  joystick.setAttribute("aria-hidden", "true");

  const thumb = document.createElement("div");
  thumb.className = "touch-joystick-thumb";
  joystick.appendChild(thumb);

  const interactBtn = document.createElement("button");
  interactBtn.type = "button";
  interactBtn.className = "touch-interact-btn";
  interactBtn.setAttribute("aria-label", "Interact");
  interactBtn.textContent = "✋";

  // Order matters: interactBtn painted last (on top) so a tap on its own footprint
  // always wins over the full-stage moveZone underneath it.
  wrap.appendChild(moveZone);
  wrap.appendChild(joystick);
  wrap.appendChild(interactBtn);
  viewport.appendChild(wrap);

  let activePointerId: number | null = null;
  let originX = 0;
  let originY = 0;

  function hide(): void {
    joystick.classList.remove("active");
    thumb.style.transform = "translate(-50%, -50%)";
    input.setTouchVector(0, 0);
  }
  hide();

  function updateFromPointer(clientX: number, clientY: number): void {
    const maxR = joystick.getBoundingClientRect().width / 2;
    if (maxR <= 0) return;
    let dx = clientX - originX;
    let dy = clientY - originY;
    const dist = Math.hypot(dx, dy);
    if (dist > maxR) {
      dx = (dx / dist) * maxR;
      dy = (dy / dist) * maxR;
    }
    thumb.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    input.setTouchVector(dx / maxR, dy / maxR);
  }

  moveZone.addEventListener("pointerdown", (e) => {
    activePointerId = e.pointerId;
    moveZone.setPointerCapture(e.pointerId);
    originX = e.clientX;
    originY = e.clientY;
    joystick.style.left = `${originX}px`;
    joystick.style.top = `${originY}px`;
    joystick.classList.add("active");
    updateFromPointer(e.clientX, e.clientY);
    e.preventDefault();
  });
  moveZone.addEventListener("pointermove", (e) => {
    if (e.pointerId !== activePointerId) return;
    updateFromPointer(e.clientX, e.clientY);
  });
  const endDrag = (e: PointerEvent): void => {
    if (e.pointerId !== activePointerId) return;
    activePointerId = null;
    hide();
  };
  moveZone.addEventListener("pointerup", endDrag);
  moveZone.addEventListener("pointercancel", endDrag);

  interactBtn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    input.queueTouchInteract();
  });
}
