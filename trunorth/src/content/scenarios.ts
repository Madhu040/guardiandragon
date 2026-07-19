import type { ScenarioMeta } from "../types/index.js";

/** Level 1 — The Little Dragon Who Wouldn't Stop Guarding, split into 3 playable phases. */
export const SCENARIOS: ScenarioMeta[] = [
  {
    id: "ch2",
    audience: "child",
    title: "Forest of Questions",
    subtitle: "Phase 1 · Curiosity",
    description:
      "Explorer Nova sets out for Star Crystals. When Flicker alarms about getting lost, ask curious questions — then inspect worry-flowers in the Meadow of Curiosity.",
    startSceneId: "w1",
    ageBand: "5-7",
    skills: ["worry_brave", "calm", "courage"],
    estimatedMinutes: 5,
  },
  {
    id: "ch3",
    audience: "child",
    title: "Valley of Welcome",
    subtitle: "Phase 2 · Kindness",
    description:
      "Invite Flicker beside you in the Valley of Welcome, then thank your guardian in the Cave of Purpose — anxiety has a job, not a fight.",
    startSceneId: "w4",
    ageBand: "5-7",
    skills: ["empathy", "calm", "self_worth", "worry_brave"],
    estimatedMinutes: 5,
  },
  {
    id: "ch4",
    audience: "child",
    title: "Mountain of Helpers",
    subtitle: "Phase 3 · Courage",
    description:
      "Comfort Flicker on the mountain, then take the Sky Festival stage one step at a time. Courage means going together — not feeling zero fear.",
    startSceneId: "w6",
    ageBand: "5-7",
    skills: ["courage", "worry_brave", "self_worth"],
    estimatedMinutes: 4,
  },
  {
    id: "ch1",
    audience: "child",
    title: "Everbright Meadow",
    subtitle: "Bonus · Empathy & Friendship",
    description: "In the meadow, a friend feels left out. Practice welcoming others and offering belonging.",
    startSceneId: "e1",
    ageBand: "5-7",
    skills: ["empathy", "friendship_repair", "courage"],
    estimatedMinutes: 4,
  },
  {
    id: "parent_coach",
    audience: "parent",
    title: "Parent Coach Corner",
    subtitle: "Reflect & Guide",
    description: "Review your child's journey with counselor-style insights and home practice tips.",
    startSceneId: "parent_hub",
    ageBand: "8-10",
    skills: ["empathy", "calm", "courage"],
    estimatedMinutes: 6,
  },
];
