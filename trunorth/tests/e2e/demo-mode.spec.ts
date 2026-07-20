import { test, expect, type Page, type Request } from "@playwright/test";

/**
 * Definition of Done §27 — items 1 and 3.
 *
 *  item 3: "No network request occurs in demo mode; the Playwright offline test passes."
 *  item 1: "Golden path completes in under 3 minutes in demo mode."
 *
 * ⚠️ HONEST SCOPE NOTE on the timing test. A scripted walk-through measures **engine
 * time** — how long the app itself takes (auto-advance timers, demo companion delay,
 * transitions) — with zero reading, thinking, or hesitation. It is a *lower bound* and a
 * regression guard against pathological delays. It does NOT validate the DoD's real
 * criterion, which is that *a child* finishes in under 3 minutes. That still requires the
 * human playtest in spec §22A.2. Do not treat a green run here as item 1 being met.
 */

const ORIGIN = "http://localhost:4173";

/**
 * Click the first visible button whose ACCESSIBLE NAME matches. Uses getByRole rather
 * than hasText because several controls (the trigger hotspot, stage objects) expose their
 * name via `aria-label` with no text content — hasText silently misses those.
 */
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

/** Landing → trust → onboarding → hub. Tolerates already-seen states. */
async function bootToHub(page: Page): Promise<void> {
  await page.goto("/?demo=1&zoom=1");
  await clickText(page, /Play Now/i);
  await clickIfPresent(page, /I understand/i);
  // Onboarding (skipped automatically if a save already exists)
  if (await clickIfPresent(page, /Dragon \(Flicker\)/i)) {
    await clickText(page, /^Next$/i);
    await clickText(page, /Start Adventure/i);
  }
  await expect(page.getByText(/Your Journey/i)).toBeVisible({ timeout: 10_000 });
}

/** Hub → chapter, skipping the optional pre-level check-in. */
async function startEverbrightMeadow(page: Page): Promise<void> {
  await clickText(page, /Everbright Meadow/i);
  // Check-in is skippable; the Skip control may only appear after the first question.
  if (!(await clickIfPresent(page, /Skip and start playing/i))) {
    await clickText(page, /Sunny and bright|A few clouds|I try it anyway|ask someone/i);
    await clickIfPresent(page, /Skip and start playing/i, 5_000);
  }
  await expect(page.getByText(/Move: WASD/i)).toBeVisible({ timeout: 15_000 });
}

/** Open the scene's decision via the click-fallback hotspot, then pick the strong option. */
async function resolveDecision(page: Page, strongOption: RegExp): Promise<void> {
  await clickIfPresent(page, /Close message|Close insight/i, 1_500);
  await clickText(page, /Interact with hot spot/i, 15_000);
  await clickText(page, strongOption, 15_000);
}

test.describe("Demo mode — stage readiness (DoD §27)", () => {
  test("makes no external network requests while playing (DoD item 3)", async ({ page }) => {
    const external: string[] = [];
    const apiCalls: string[] = [];

    page.on("request", (req: Request) => {
      const url = req.url();
      if (url.startsWith("data:") || url.startsWith("blob:")) return;
      if (!url.startsWith(ORIGIN)) external.push(url);
      else if (new URL(url).pathname.startsWith("/api/")) apiCalls.push(url);
    });

    await bootToHub(page);
    await startEverbrightMeadow(page);

    // Play a scored decision — the one beat that would hit the companion proxy in live mode.
    await resolveDecision(page, /want to play with us/i);
    await expect(page.locator(".counselor-panel")).toBeVisible({ timeout: 15_000 });

    expect(external, `demo mode reached external origins:\n${external.join("\n")}`).toEqual([]);
    expect(apiCalls, `demo mode called the API:\n${apiCalls.join("\n")}`).toEqual([]);
  });

  test("plays with the network hard-blocked (spec §13A.3 — 'no internet at all')", async ({
    page,
    context,
  }) => {
    // Stronger than observing requests: actively abort anything off-origin, which is what
    // conference WiFi failure looks like. Catches a *conditional* external fetch that the
    // observational test above would miss. This is how the Google Fonts <link> would have
    // been caught even if it only loaded on a slower path.
    await context.route("**/*", (route) => {
      const url = route.request().url();
      if (url.startsWith(ORIGIN) || url.startsWith("data:") || url.startsWith("blob:")) {
        return route.continue();
      }
      return route.abort();
    });

    await bootToHub(page);
    await startEverbrightMeadow(page);
    await resolveDecision(page, /want to play with us/i);

    await expect(page.locator(".counselor-panel")).toBeVisible({ timeout: 15_000 });
  });

  test("completes the Everbright Meadow golden path (DoD item 1 — engine time only)", async ({
    page,
  }) => {
    await bootToHub(page);

    const started = Date.now();
    await startEverbrightMeadow(page);

    // e1 → e2 → e2a → e2b → e2c → e3 → celebration. All five ch1 decision points.
    await resolveDecision(page, /want to play with us/i);          // dp_leftout_bench
    await clickIfPresent(page, /Close message|Close insight/i, 2_000);
    await clickText(page, /North Gate/i, 15_000);                   // walk-to-gate stage object
    await resolveDecision(page, /okay to feel shy/i);               // dp_reassure_shy
    await resolveDecision(page, /take turns/i);                     // dp_share_flower
    await resolveDecision(page, /sorry I knocked it over/i);        // dp_repair_oops
    await resolveDecision(page, /can you check in too/i);           // dp_ask_grownup → finale

    await expect(page.getByText(/Adventure Complete/i)).toBeVisible({ timeout: 20_000 });
    const elapsedSec = (Date.now() - started) / 1000;

    // Engine-time budget. Generous on purpose: this guards against a pathological
    // regression (a stuck auto-advance timer), NOT against a child being slow.
    console.log(`golden path engine time: ${elapsedSec.toFixed(1)}s (DoD budget for a CHILD: 180s)`);
    expect(elapsedSec, "engine-time regression guard").toBeLessThan(90);
  });
});
