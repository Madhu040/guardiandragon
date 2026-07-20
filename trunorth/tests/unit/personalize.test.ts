import { describe, it, expect } from "vitest";
import { personalize } from "../../src/content/personalize.js";
import { SCENES, DECISION_POINTS, DIALOGS } from "../../src/content/index.js";
import type { Scene, DecisionPoint } from "../../src/types/index.js";

/**
 * Owner playtest: *"make conversation real, make it as human interaction as possible."*
 *
 * Two concrete defects behind that: the companion never used the child's name, and the
 * authored copy hard-coded "Flicker"/"Nova" — so a child who named their dragon Sparky was
 * told "Flicker's name is on it", and a child called Aisha read prompts about Nova.
 */
describe("personalize — the copy uses the names the child chose", () => {
  it("fills both tokens", () => {
    expect(personalize("Hey {name}, {companion} is scared.", { childName: "Aisha", companionName: "Sparky" })).toBe(
      "Hey Aisha, Sparky is scared.",
    );
  });

  it("replaces every occurrence, not just the first", () => {
    expect(personalize("{companion} helped. Thank {companion}.", { companionName: "Sparky" })).toBe(
      "Sparky helped. Thank Sparky.",
    );
  });

  it("never shows a five-year-old 'undefined' when a name is missing or blank", () => {
    const out = personalize("Hey {name}, meet {companion}!", { childName: "  ", companionName: undefined });
    expect(out).not.toMatch(/undefined|\{name\}|\{companion\}/);
    expect(out).toBe("Hey explorer, meet your companion!");
  });

  it("leaves untokenised copy untouched", () => {
    const plain = "The trail goes north from here.";
    expect(personalize(plain, { childName: "Aisha" })).toBe(plain);
  });
});

describe("authored copy no longer hard-codes the default names", () => {
  const scenes = Object.values(SCENES) as Scene[];
  const dps = Object.values(DECISION_POINTS) as DecisionPoint[];

  it("no scene goal names Flicker or Nova literally", () => {
    for (const s of scenes) {
      if (!s.goal) continue;
      expect(s.goal, `${s.id} goal hard-codes a name`).not.toMatch(/Flicker|Nova/);
    }
  });

  it("no decision prompt or choice names them literally", () => {
    for (const dp of dps) {
      expect(dp.prompt, `${dp.id} prompt hard-codes a name`).not.toMatch(/Flicker|Nova/);
      for (const opt of dp.options ?? []) {
        expect(opt.label, `${dp.id}/${opt.id} hard-codes a name`).not.toMatch(/Flicker|Nova/);
      }
    }
  });

  it("no dialog line or speaker label names them literally", () => {
    for (const dlg of Object.values(DIALOGS)) {
      expect(dlg.speaker ?? "").not.toMatch(/Flicker/);
      for (const page of dlg.pages) {
        expect(page.speaker ?? "").not.toMatch(/Flicker/);
        expect(page.text, `${dlg.id} hard-codes the companion name`).not.toMatch(/Flicker/);
      }
    }
  });

  it("every token in authored copy is one personalize actually understands", () => {
    const known = /^\{(name|companion)\}$/;
    const check = (text: string, where: string) => {
      for (const token of text.match(/\{[^}]*\}/g) ?? []) {
        expect(token, `${where} uses unknown token ${token}`).toMatch(known);
      }
    };
    for (const s of scenes) if (s.goal) check(s.goal, `${s.id} goal`);
    for (const dp of dps) {
      check(dp.prompt, `${dp.id} prompt`);
      for (const opt of dp.options ?? []) check(opt.label, `${dp.id}/${opt.id}`);
    }
    for (const dlg of Object.values(DIALOGS)) {
      for (const page of dlg.pages) check(page.text, dlg.id);
    }
  });
});
