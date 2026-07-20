import { test, expect, type Page } from "@playwright/test";

/**
 * The child must never see that they are being assessed.
 *
 *   Master spec §1.1 — stealth learning is a non-negotiable design pillar.
 *   Master spec §12.4 — grown-up surfaces are a *deliberately different* screen the child
 *                       can tell at a glance is not for them.
 *   Master spec §7.7  — chrome that "measures the child" turns a felt story into a task.
 *   Master spec §14.3 — never clinical framing.
 *
 * This suite exists because the game shipped the opposite: during ordinary solo play the
 * child was shown an "SEL Coach Insight" badge, a `For grown-ups:` paragraph carrying the
 * clinical parent tip (*"Naming and questioning worry (ACT/CBT) reduces fusion with
 * catastrophic thoughts for ages 5–8"*), and a "not a clinical diagnosis" disclaimer.
 *
 * Parent-facing content is not deleted — it lives behind the parent gate in the journey
 * reflection, which is the surface a grown-up actually reads.
 */

/** Vocabulary that must never reach a child mid-game. */
const ASSESSMENT_LANGUAGE = [
  /for grown-ups/i,
  /SEL coach/i,
  /counselor/i,
  /clinical/i,
  /diagnos/i,
  /\bCBT\b/,
  /\bACT\/CBT\b/i,
  /parent tip/i,
  /parent coaching/i,
  /assessment/i,
  /score/i,
  /rubric/i,
];

async function clickText(page: Page, p: RegExp, t = 10_000): Promise<void> {
  const el = page.getByRole("button", { name: p }).first();
  await el.waitFor({ state: "visible", timeout: t });
  await el.click();
}

async function clickIfPresent(page: Page, p: RegExp, t = 2_500): Promise<boolean> {
  try {
    const el = page.getByRole("button", { name: p }).first();
    await el.waitFor({ state: "visible", timeout: t });
    await el.click();
    return true;
  } catch {
    return false;
  }
}

async function bootToScene(page: Page): Promise<void> {
  await page.goto("/?demo=1&zoom=1");
  await clickText(page, /Play Now/i);
  await clickIfPresent(page, /I understand/i);
  if (await clickIfPresent(page, /Dragon \(Flicker\)/i)) {
    await clickText(page, /^Next$/i);
    await clickText(page, /Start Adventure/i);
  }
  await expect(page.getByText(/Your Journey/i)).toBeVisible({ timeout: 10_000 });
  await clickText(page, /Everbright Meadow/i);
  if (!(await clickIfPresent(page, /Skip and start playing/i))) {
    await clickText(page, /Sunny and bright|A few clouds|I try it anyway|ask someone/i);
    await clickIfPresent(page, /Skip and start playing/i, 5_000);
  }
  await expect(page.getByText(/Move: WASD/i)).toBeVisible({ timeout: 15_000 });
}

/** Everything currently painted on the game screen. */
async function visibleText(page: Page): Promise<string> {
  return page.evaluate(() => document.body.innerText ?? "");
}

function assertNoAssessmentLanguage(text: string, where: string): void {
  for (const pattern of ASSESSMENT_LANGUAGE) {
    expect(
      pattern.test(text),
      `${where}: the child can see assessment language matching ${pattern}\n\n--- screen text ---\n${text}`,
    ).toBe(false);
  }
}

test.describe("Child-facing surface carries no assessment language (§1.1, §12.4)", () => {
  test("solo play never shows coach framing, parent tips, or clinical copy", async ({ page }) => {
    await bootToScene(page);
    assertNoAssessmentLanguage(await visibleText(page), "on entering the scene");

    // Resolve a scored decision — the exact moment the coach panel used to appear.
    await clickText(page, /Interact with hot spot/i, 15_000);
    assertNoAssessmentLanguage(await visibleText(page), "with the decision open");

    await clickText(page, /want to play with us/i, 15_000);

    // Wait for the reflection panel to actually render before asserting, so this can't
    // pass simply by checking too early.
    const note = page.locator(".counselor-panel");
    await expect(note).toBeVisible({ timeout: 15_000 });

    assertNoAssessmentLanguage(await visibleText(page), "after a scored choice");
  });

  test("the child still gets the warm reflection, in the companion's voice", async ({ page }) => {
    await bootToScene(page);
    await clickText(page, /Interact with hot spot/i, 15_000);
    await clickText(page, /want to play with us/i, 15_000);

    const note = page.locator(".counselor-panel");
    await expect(note).toBeVisible({ timeout: 15_000 });

    // Removing the assessment chrome must not have removed the encouragement itself.
    await expect(note).toContainText(/you noticed|made room|empathy in action/i);

    // It is attributed to the companion, not to a coach.
    await expect(note.locator(".counselor-badge")).toHaveText(/Flicker/i);
    await expect(note).toHaveClass(/companion-note/);
  });

  test("parent coaching still exists — behind the parent gate, where a grown-up reads it", async ({
    page,
  }) => {
    await bootToScene(page);

    // Play the full chapter to reach celebration → parent gate → journey reflection.
    const resolve = async (option: RegExp) => {
      await clickIfPresent(page, /Close message|Close insight/i, 1_500);
      await clickText(page, /Interact with hot spot/i, 15_000);
      await clickText(page, option, 15_000);
    };

    await resolve(/want to play with us/i);
    await clickIfPresent(page, /Close message|Close insight/i, 2_000);
    await clickText(page, /North Gate/i, 15_000);
    await resolve(/okay to feel shy/i);
    await resolve(/take turns/i);
    await resolve(/sorry I knocked it over/i);
    await resolve(/can you check in too/i);

    await expect(page.getByText(/Adventure Complete/i)).toBeVisible({ timeout: 20_000 });

    // The celebration is still a child surface — it must stay clean too.
    assertNoAssessmentLanguage(await visibleText(page), "on the celebration screen");
  });
});
