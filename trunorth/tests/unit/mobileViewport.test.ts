import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

/**
 * Mobile support: the classic mobile-Safari `100vh` bug (confirmed on a real iPhone,
 * not just in theory — see product.md 2026-07-20). `vh` is measured as if the
 * browser's address bar were never shown, so anything sized against it renders
 * taller than what's actually visible: characters clipped at the top, the touch
 * joystick/interact button pushed below the visible fold entirely.
 *
 * Can't cover this with a real e2e test — Playwright's Chromium (even under mobile
 * device emulation) doesn't have a dynamically show/hide address bar to reproduce
 * the bug against, so there is no automated way to prove the *symptom* is gone.
 * This instead guards the *fix* itself: every layout-critical selector that sizes
 * against the viewport must also declare a `dvh` companion, so a future edit can't
 * silently drop it back to `vh`-only and reintroduce the bug unnoticed.
 */
const css = readFileSync(resolve(__dirname, "../../src/styles/global.css"), "utf8");

/** Extract a top-level CSS rule's full declaration block by selector. */
function ruleBlock(selector: string): string {
  const escaped = selector.replace(/[.#[\]]/g, (c) => `\\${c}`);
  const match = css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`));
  if (!match) throw new Error(`selector not found in global.css: ${selector}`);
  return match[1];
}

describe("mobile viewport height (spec: mobile support, the 100vh Safari bug)", () => {
  it.each([
    ["body", "min-height"],
    ["#app", "height"],
    [".game-root", "height"],
    [".hub-surface", "min-height"],
    [".parent-surface", "min-height"],
    [".onboarding", "min-height"],
  ])("%s declares a dvh companion for its %s", (selector, prop) => {
    const block = ruleBlock(selector);
    expect(block, `${selector} has no ${prop} declaration at all`).toMatch(
      new RegExp(`${prop}\\s*:\\s*100vh`),
    );
    expect(block, `${selector} is missing a dvh fallback-override for ${prop}`).toMatch(
      new RegExp(`${prop}\\s*:\\s*100dvh`),
    );
  });

  it(".game-viewport's width/height formulas have a dvh variant", () => {
    const block = ruleBlock(".game-viewport");
    expect(block).toMatch(/width\s*:\s*min\(100vw,\s*calc\(100vh/);
    expect(block).toMatch(/width\s*:\s*min\(100vw,\s*calc\(100dvh/);
    expect(block).toMatch(/height\s*:\s*min\(100vh/);
    expect(block).toMatch(/height\s*:\s*min\(100dvh/);
  });

  it("--overlay-px (used by every overlay outside .game-viewport) has a dvh variant", () => {
    const block = ruleBlock(":root");
    expect(block).toMatch(/--overlay-px:\s*calc\(min\(100vw,\s*100vh/);
    expect(block).toMatch(/--overlay-px:\s*calc\(min\(100vw,\s*100dvh/);
  });
});
