import type { ScenarioMeta } from "../types/index.js";

export const SCENARIOS: ScenarioMeta[] = [
  {
    id: "ch2",
    audience: "child",
    title: "The Singing Bridge",
    subtitle: "Worry & Courage",
    description:
      "In Everbright, Flicker the Guardian Dragon panics at a creaky bridge. Investigate, sort facts from stories, breathe, and choose to keep walking.",
    startSceneId: "w1",
    ageBand: "8-10",
    skills: ["worry_brave", "calm", "courage"],
    estimatedMinutes: 12,
  },
  {
    id: "ch1",
    audience: "child",
    title: "Everbright Meadow",
    subtitle: "Empathy & Friendship",
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
    description: "Review your child’s journey with counselor-style insights and home practice tips.",
    startSceneId: "parent_hub",
    ageBand: "8-10",
    skills: ["empathy", "calm", "courage"],
    estimatedMinutes: 6,
  },
];
