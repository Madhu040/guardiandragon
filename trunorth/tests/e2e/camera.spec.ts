import { test, expect, type Page } from "@playwright/test";

/**
 * The following camera (spec §5 core loop — "journeying through a world").
 *
 * The world used to be exactly one screen: the 100×100 grid mapped 1:1 onto 1920×1080, so
 * the entire level was always visible and moving revealed nothing. The camera zooms in and
 * follows the avatar, so the level extends off-screen and walking becomes exploring.
 *
 * The other e2e suites boot with `?zoom=1` (camera off) so their framing stays stable; this
 * suite is the one that exercises the real zoom.
 */

async function clickText(page: Page, p: RegExp, t = 12_000): Promise<void> {
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

async function bootToMeadow(page: Page, query: string): Promise<void> {
  await page.goto(`/?demo=1&${query}`);
  await clickText(page, /Play Now/i);
  await clickIfPresent(page, /I understand/i);
  if (await clickIfPresent(page, /Dragon \(Flicker\)/i)) {
    await clickText(page, /^Next$/i);
    await clickText(page, /Start Adventure/i);
  }
  await clickText(page, /Everbright Meadow/i);
  if (!(await clickIfPresent(page, /Skip and start playing/i))) {
    await clickText(page, /Sunny and bright|A few clouds|I try it anyway|ask someone/i);
    await clickIfPresent(page, /Skip and start playing/i, 5_000);
  }
  await expect(page.getByText(/Move: WASD/i)).toBeVisible({ timeout: 15_000 });
}

async function walk(page: Page, key: string, ms: number): Promise<void> {
  await page.keyboard.down(key);
  await page.waitForTimeout(ms);
  await page.keyboard.up(key);
}

async function layerTransform(page: Page): Promise<string> {
  return page.locator(".world-layer").evaluate((el) => getComputedStyle(el).transform);
}

test.describe("Following camera (spec §5)", () => {
  test("zooms in and follows the avatar as it moves", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await bootToMeadow(page, "zoom=2");

    const atSpawn = await layerTransform(page);
    // A scale of 2 means the transform matrix's first value is 2 — the world is zoomed in.
    expect(atSpawn, `world layer is not zoomed: ${atSpawn}`).toMatch(/matrix\(2[,.]/);

    await walk(page, "d", 1400);
    await walk(page, "w", 900);
    await page.waitForTimeout(400);

    const afterMoving = await layerTransform(page);
    expect(afterMoving, "camera did not follow the avatar").not.toBe(atSpawn);
  });

  test("does not scroll the page or overflow the viewport when zoomed", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await bootToMeadow(page, "zoom=2");
    await walk(page, "d", 1200);

    // The camera is a transform inside an overflow-hidden viewport — it must never turn into
    // real page scroll, which on a projector would simply lose content off the edge.
    const overflow = await page.evaluate(() => ({
      w: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      h: document.documentElement.scrollHeight - document.documentElement.clientHeight,
    }));
    expect(overflow.w, "zoomed camera caused horizontal page overflow").toBeLessThanOrEqual(1);
    expect(overflow.h, "zoomed camera caused vertical page overflow").toBeLessThanOrEqual(1);
  });

  test("zoom=1 disables the camera (the old full-level view is still available)", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await bootToMeadow(page, "zoom=1");
    const t = await layerTransform(page);
    // No transform (or the identity matrix) — the whole level fits on screen.
    expect(t === "none" || /matrix\(1,\s*0,\s*0,\s*1,/.test(t), `expected no zoom, got ${t}`).toBe(
      true,
    );
  });

  test("a scored decision is still reachable with the camera on", async ({ page }) => {
    // The decision trigger must stay usable when zoomed. Proximity + E works in world
    // coordinates regardless of camera, so this walks Nova to Jamie's trigger and interacts —
    // the real play path, not the click-fallback hotspot (which may be outside the zoomed frame).
    await page.setViewportSize({ width: 1280, height: 720 });
    await bootToMeadow(page, "zoom=2");

    // Since Scene.spawnCell landed, the child starts *across the meadow* from Jamie rather
    // than beside him (§7.1: the decision has to be a journey, ~1000px, so the crystals and
    // discoveries on the way aren't skippable). From the spawn Jamie is right and **down**,
    // and it takes a good many steps — walking is the point of the test, so give it the
    // distance rather than moving the decision back. Press E each lap, polling because the
    // exact frame proximity lands on varies.
    // Spawn is ~(182,340) and Jamie ~(1100,730): about 918px right for 390px down, so the
    // steps are weighted ~2:1 rather than even — walking equal amounts sails past him
    // vertically. Each lap advances less than the interact radius, so E can't skip over him.
    const decision = page.getByRole("button", { name: /want to play with us/i });
    for (let i = 0; i < 18 && !(await decision.isVisible().catch(() => false)); i++) {
      await walk(page, "d", 200);
      await walk(page, "s", 90);
      await page.keyboard.press("e");
      await page.waitForTimeout(120);
    }

    await expect(decision, "the decision was never reachable by walking with the camera on")
      .toBeVisible({ timeout: 5_000 });
    await decision.click();
    await expect(page.locator(".counselor-panel")).toBeVisible({ timeout: 15_000 });
  });
});
