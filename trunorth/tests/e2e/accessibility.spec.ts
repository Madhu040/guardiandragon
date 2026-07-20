import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Accessibility pass on the showcase scene.
 *
 *   Consolidated tech spec §20  — WCAG 2.2 AA target, keyboard operability, focus
 *                                 indicator, ARIA on choices/meters/bubbles, 4.5:1 contrast.
 *   Master spec §17A.4          — the visual & interaction review rubric.
 *   Master spec §22A.5          — "accessibility proof, not just intent".
 *   DoD §27 item 8              — accessibility suite passes thresholds.
 *
 * ⚠️ SCOPE. This covers the parts a machine can check: an automated axe scan (which
 * includes colour contrast) and a keyboard-only run of a scored decision. §22A.5 asks for
 * something this suite cannot produce — a **manual screen-reader pass by the team's
 * visually-impaired member**, whose lived judgement is the actual deliverable and whose
 * account becomes a told part of the demo. That remains an open human task; a green run
 * here is a floor, not the proof §22A.5 is asking for.
 *
 * axe-core is injected from the local node_modules bundle, so this suite stays consistent
 * with the §13A.3 offline constraint the sibling demo-mode suite enforces.
 */

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

function scan(page: Page) {
  return new AxeBuilder({ page }).withTags(WCAG_TAGS);
}

/** Renders axe violations as something readable in CI output. */
function format(violations: Awaited<ReturnType<AxeBuilder["analyze"]>>["violations"]): string {
  return violations
    .map(
      (v) =>
        `\n[${v.impact}] ${v.id} — ${v.help}\n  ${v.nodes
          .slice(0, 4)
          .map((n) => n.target.join(" "))
          .join("\n  ")}`,
    )
    .join("\n");
}

async function clickText(page: Page, pattern: RegExp, timeout = 10_000): Promise<void> {
  const target = page.getByRole("button", { name: pattern }).first();
  await target.waitFor({ state: "visible", timeout });
  await target.click();
}

async function clickIfPresent(page: Page, pattern: RegExp, timeout = 2_500): Promise<boolean> {
  const target = page.getByRole("button", { name: pattern }).first();
  try {
    await target.waitFor({ state: "visible", timeout });
    await target.click();
    return true;
  } catch {
    return false;
  }
}

async function bootToHub(page: Page): Promise<void> {
  await page.goto("/?demo=1&zoom=1");
  await clickText(page, /Play Now/i);
  await clickIfPresent(page, /I understand/i);
  if (await clickIfPresent(page, /Dragon \(Flicker\)/i)) {
    await clickText(page, /^Next$/i);
    await clickText(page, /Start Adventure/i);
  }
  await expect(page.getByText(/Your Journey/i)).toBeVisible({ timeout: 10_000 });
}

async function startShowcaseScene(page: Page): Promise<void> {
  await clickText(page, /Everbright Meadow/i);
  if (!(await clickIfPresent(page, /Skip and start playing/i))) {
    await clickText(page, /Sunny and bright|A few clouds|I try it anyway|ask someone/i);
    await clickIfPresent(page, /Skip and start playing/i, 5_000);
  }
  await expect(page.getByText(/Move: WASD/i)).toBeVisible({ timeout: 15_000 });
}

test.describe("Accessibility — showcase scene (spec §20, §17A.4, §22A.5)", () => {
  test("landing and hub screens have no WCAG 2.2 AA violations", async ({ page }) => {
    await page.goto("/?demo=1&zoom=1");
    const landing = await scan(page).analyze();
    expect(landing.violations, `landing screen:${format(landing.violations)}`).toEqual([]);

    await bootToHub(page);
    const hub = await scan(page).analyze();
    expect(hub.violations, `scenario hub:${format(hub.violations)}`).toEqual([]);
  });

  test("the gameplay stage and decision overlay have no WCAG 2.2 AA violations", async ({
    page,
  }) => {
    await bootToHub(page);
    await startShowcaseScene(page);

    const stage = await scan(page).analyze();
    expect(stage.violations, `gameplay stage:${format(stage.violations)}`).toEqual([]);

    // The decision overlay is the highest-stakes surface: it is where the child acts.
    await clickText(page, /Interact with hot spot/i, 15_000);
    await expect(page.getByRole("button", { name: /want to play with us/i })).toBeVisible({
      timeout: 15_000,
    });

    const overlay = await scan(page).analyze();
    expect(overlay.violations, `decision overlay:${format(overlay.violations)}`).toEqual([]);
  });

  test("a scored decision is completable with the keyboard alone (§20 keyboard operability)", async ({
    page,
  }) => {
    await bootToHub(page);
    await startShowcaseScene(page);
    await clickText(page, /Interact with hot spot/i, 15_000);

    const strong = page.getByRole("button", { name: /want to play with us/i });
    await expect(strong).toBeVisible({ timeout: 15_000 });

    // Tab until the choice takes focus — no mouse, no coordinates.
    let focused = false;
    for (let i = 0; i < 40 && !focused; i++) {
      await page.keyboard.press("Tab");
      focused = await strong.evaluate((el) => el === document.activeElement);
    }
    expect(focused, "the strong choice was never reachable by Tab").toBe(true);

    // §20 "Focus indicator: visible :focus-visible ring" — assert something actually
    // renders, rather than trusting the stylesheet contains the selector.
    const ring = await strong.evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        outlineWidth: s.outlineWidth,
        outlineStyle: s.outlineStyle,
        boxShadow: s.boxShadow,
      };
    });
    const hasRing =
      (ring.outlineStyle !== "none" && parseFloat(ring.outlineWidth) > 0) ||
      (ring.boxShadow !== "none" && ring.boxShadow !== "");
    expect(hasRing, `no visible focus indicator: ${JSON.stringify(ring)}`).toBe(true);

    await page.keyboard.press("Enter");
    await expect(page.locator(".counselor-panel")).toBeVisible({ timeout: 15_000 });
  });

  test("respects prefers-reduced-motion (§20 reduced motion)", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await bootToHub(page);
    await startShowcaseScene(page);

    // No element may run a long/infinite animation once reduced motion is requested.
    const offenders = await page.evaluate(() => {
      const bad: string[] = [];
      for (const el of Array.from(document.querySelectorAll("*"))) {
        const s = getComputedStyle(el);
        const durations = s.animationDuration
          .split(",")
          .map((d) => parseFloat(d) * (d.includes("ms") ? 0.001 : 1));
        const iter = s.animationIterationCount;
        if (s.animationName !== "none" && (iter === "infinite" || durations.some((d) => d > 0.2))) {
          bad.push(`${el.tagName.toLowerCase()}.${el.className} ${s.animationName} ${iter}`);
        }
      }
      return bad;
    });
    expect(offenders, `animations still running under reduced motion:\n${offenders.join("\n")}`)
      .toEqual([]);
  });
});
