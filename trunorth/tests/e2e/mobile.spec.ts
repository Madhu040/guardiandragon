import { test, expect, type Page } from "@playwright/test";

/**
 * Mobile / touch support (scoped 2026-07-20, spec: mobile readiness).
 *
 * Runs only under the "mobile" Playwright project (`devices["Pixel 5"]`,
 * `playwright.config.ts`) — a touch-emulated, coarse-pointer, portrait-by-default
 * device. Chromium/Android rather than an iPhone preset so this reuses the browser
 * already installed (see the comment in playwright.config.ts) — real iOS Safari
 * verification is a manual device task. The desktop "chromium" project explicitly
 * ignores this file, so none of this can regress the existing 19-test desktop suite,
 * and a companion test here confirms the reverse: desktop gets none of this UI even
 * when this same app code runs there.
 *
 * What this proves, not just floors-out: that a phone can actually play the game —
 * portrait shows the rotate prompt (the stage is a fixed 16:9 layout), landscape shows
 * touch controls sized well above the §17A.4 64px floor, and — the real regression
 * guard — dragging the (floating) virtual joystick and tapping the interact button
 * drives a real decision trigger end to end, the same geometry `camera.spec.ts` already
 * proved reachable by keyboard.
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

async function bootToMeadow(page: Page): Promise<void> {
  await page.goto("/?demo=1");
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
  await expect(page.getByText(/Drag to move/i)).toBeVisible({ timeout: 15_000 });
}

/**
 * Touch down on the move zone at a fixed origin (35%/60% of the viewport — clear of the
 * top HUD and the interact button's bottom-right corner), drag toward (dx, dy) relative
 * to that origin, and hold it. The joystick floats (no resting position — see
 * TouchControls.ts), so unlike a fixed-corner joystick there's no rect to read before the
 * first touch; the origin has to be chosen by the caller instead of read from the DOM.
 *
 * Dispatches real `PointerEvent`s directly rather than `page.mouse` — under a
 * touch-emulated (`hasTouch: true`) context, `page.mouse.move`/`down` didn't reliably
 * produce the `pointerdown`/`pointermove` events `TouchControls.ts` listens for (verified
 * by hand: the same drag via `page.mouse` left the avatar's DOM position unchanged, while
 * an in-page `dispatchEvent` of the same gesture moved it). Direct dispatch is the more
 * reliable choice for a custom drag gesture Playwright's high-level touch API doesn't
 * cover (`page.touchscreen` only exposes a single `tap`, no hold-and-move).
 */
async function dragJoystick(page: Page, dx: number, dy: number, holdMs: number): Promise<void> {
  const size = page.viewportSize();
  if (!size) throw new Error("no viewport size set");
  const originX = size.width * 0.35;
  const originY = size.height * 0.6;

  await page.evaluate(
    ({ originX, originY, dx, dy }) => {
      const zone = document.querySelector(".touch-move-zone") as HTMLElement;
      zone.dispatchEvent(
        new PointerEvent("pointerdown", {
          clientX: originX,
          clientY: originY,
          pointerId: 1,
          bubbles: true,
        }),
      );
      zone.dispatchEvent(
        new PointerEvent("pointermove", {
          clientX: originX + dx,
          clientY: originY + dy,
          pointerId: 1,
          bubbles: true,
        }),
      );
    },
    { originX, originY, dx, dy },
  );
  await page.waitForTimeout(holdMs);
  await page.evaluate(() => {
    const zone = document.querySelector(".touch-move-zone") as HTMLElement;
    zone.dispatchEvent(
      new PointerEvent("pointerup", { clientX: 0, clientY: 0, pointerId: 1, bubbles: true }),
    );
  });
}

async function tapInteract(page: Page): Promise<void> {
  await page.evaluate(() => {
    const btn = document.querySelector(".touch-interact-btn") as HTMLElement;
    const rect = btn.getBoundingClientRect();
    btn.dispatchEvent(
      new PointerEvent("pointerdown", {
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2,
        pointerId: 2,
        bubbles: true,
      }),
    );
  });
}

/**
 * Same geometry `camera.spec.ts` already proved reachable by keyboard: spawn ~(182,340),
 * Jamie's trigger ~(1100,730) — about 918px right for 390px down, so drags are weighted
 * ~2:1 rather than even. Each lap drags right-and-down, taps interact (mirrors pressing E
 * every lap — `consumeInteract()` only fires `onInteract` when in range, same as the
 * keyboard path), and polls for the decision to appear.
 */
async function walkToDecisionViaTouch(page: Page) {
  const decision = page.getByRole("button", { name: /want to play with us/i });
  // 24 laps × ~40px/lap gives ~960px of headroom over the ~918px needed — the original
  // 18-lap budget was measured to work but flaked once under full-suite load (timing-tight,
  // not a real movement bug: it passed reliably in isolation). Padding the budget rather
  // than the per-lap distance keeps the walk itself realistic.
  for (let i = 0; i < 24 && !(await decision.isVisible().catch(() => false)); i++) {
    await dragJoystick(page, 40, 18, 220);
    await tapInteract(page);
    await page.waitForTimeout(120);
  }
  await expect(
    decision,
    "the decision was never reached by dragging the joystick + tapping interact",
  ).toBeVisible({ timeout: 5_000 });
  return decision;
}

test.describe("Mobile touch support", () => {
  test("portrait shows the rotate prompt instead of the game", async ({ page }) => {
    // devices["Pixel 5"] defaults to portrait.
    await page.goto("/?demo=1");
    await expect(page.locator(".rotate-prompt")).toBeVisible();
    await expect(page.locator("#app")).toBeHidden();
  });

  test("landscape shows touch controls sized well above the 64px hit-target floor", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 844, height: 390 });
    await expect(page.locator(".rotate-prompt")).toBeHidden();
    await bootToMeadow(page);

    const joystick = await page.locator(".touch-joystick").boundingBox();
    const interact = await page.locator(".touch-interact-btn").boundingBox();
    expect(joystick, "joystick has no layout box").not.toBeNull();
    expect(interact, "interact button has no layout box").not.toBeNull();

    // CSS floors are 96px (joystick) / 76px (button) — asserting comfortably inside
    // those so the test isn't flaky on sub-pixel rounding, while still catching a
    // regression back to something too small for a child's thumb.
    expect(joystick!.width, `joystick is ${joystick!.width}px wide`).toBeGreaterThanOrEqual(90);
    expect(interact!.width, `interact button is ${interact!.width}px wide`).toBeGreaterThanOrEqual(
      70,
    );
  });

  test("dragging the joystick and tapping interact reaches a real decision trigger", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 844, height: 390 });
    await bootToMeadow(page);

    const avatarBefore = await page
      .locator('[data-char-id="avatar"]')
      .evaluate((el) => (el as HTMLElement).style.left);

    const decision = await walkToDecisionViaTouch(page);

    const avatarAfter = await page
      .locator('[data-char-id="avatar"]')
      .evaluate((el) => (el as HTMLElement).style.left);
    expect(avatarAfter, "avatar's DOM position never changed — touch drag didn't move it").not.toBe(
      avatarBefore,
    );

    await decision.click();
    await expect(page.locator(".counselor-panel")).toBeVisible({ timeout: 15_000 });
  });

  test("existing HUD/decision-overlay scaling holds at a real phone width, not just assumed", async ({
    page,
  }) => {
    // Confirms the --px/--overlay-px scaling proven at 1024-1920px (projector.spec.ts)
    // actually holds this far down too, rather than assuming the same formula behaves
    // the same near its other end — a real phone width, not a shrunk desktop window.
    await page.setViewportSize({ width: 844, height: 390 });
    await bootToMeadow(page);

    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      scrollHeight: document.documentElement.scrollHeight,
      clientHeight: document.documentElement.clientHeight,
    }));
    expect(
      overflow.scrollWidth,
      `horizontal overflow at 844x390: content ${overflow.scrollWidth}px in ${overflow.clientWidth}px viewport`,
    ).toBeLessThanOrEqual(overflow.clientWidth + 1);
    expect(
      overflow.scrollHeight,
      `vertical overflow at 844x390: content ${overflow.scrollHeight}px in ${overflow.clientHeight}px viewport`,
    ).toBeLessThanOrEqual(overflow.clientHeight + 1);

    const stage = page.locator(".game-viewport").first();
    const box = await stage.boundingBox();
    expect(box, "stage has no layout box at 844x390").not.toBeNull();
    const aspect = box!.width / box!.height;
    expect(
      Math.abs(aspect - 16 / 9),
      `stage aspect ${aspect.toFixed(3)} at 844x390 — expected 16:9`,
    ).toBeLessThan(0.02);

    const hud = page.locator('[aria-label="Skill meters"]').first();
    await expect(hud).toBeVisible();
    const hudBox = await hud.boundingBox();
    expect(hudBox!.x + hudBox!.width).toBeLessThanOrEqual(844 + 1);
    expect(hudBox!.y + hudBox!.height).toBeLessThanOrEqual(390 + 1);

    const decision = await walkToDecisionViaTouch(page);
    const decisionBox = await decision.boundingBox();
    expect(decisionBox!.x).toBeGreaterThanOrEqual(-1);
    expect(decisionBox!.y + decisionBox!.height, "choice button runs past the bottom at 844x390").toBeLessThanOrEqual(
      390 + 1,
    );
    const fontPx = await decision.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(fontPx, `choice text is ${fontPx}px at 844x390 — below the legibility floor`).toBeGreaterThanOrEqual(12);
    await expect
      .poll(async () => (await decision.boundingBox())?.height ?? 0, {
        message: "choice hit target below the 64px floor at 844x390",
        timeout: 5_000,
      })
      .toBeGreaterThanOrEqual(64);
  });
});

test.describe("Desktop stays untouched (spec: mobile support must not disturb desktop)", () => {
  // Override just the context options that matter (not a full device preset — spreading
  // e.g. devices["Desktop Chrome"] pulls in browser-level options that Playwright refuses
  // to change inside a describe block, only at project/config level).
  test.use({ hasTouch: false, isMobile: false, viewport: { width: 1280, height: 720 } });

  test("no touch controls or rotate prompt exist on a mouse/trackpad device", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await bootToMeadow(page).catch(() => {
      // bootToMeadow's move-hint assertion expects the touch copy; on desktop the
      // hint reads "Move: WASD" instead, which is exactly what this test verifies.
    });
    await expect(page.getByText(/Move: WASD/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.locator(".touch-controls")).toHaveCount(0);
    await expect(page.locator(".rotate-prompt")).toBeHidden();
  });
});
