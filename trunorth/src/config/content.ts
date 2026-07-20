/**
 * Shared content/layout configuration (zones, golden path labels).
 * Image paths and copy live here so art swaps don’t require hunting through UI code.
 */

export interface ZoneConfig {
  id: string;
  name: string;
  tagline: string;
  image: string;
  chapterIds: string[];
}

export const contentConfig = {
  zones: [
    {
      id: "forest",
      name: "Forest of Questions",
      tagline: "Anxiety gets quieter when it feels heard.",
      image: "/assets/zones/forest.png",
      chapterIds: ["ch2"],
    },
    {
      id: "bridge",
      name: "Valley of Welcome",
      tagline: "Invite your protector to walk beside you.",
      image: "/assets/zones/meadow.png",
      chapterIds: ["ch3"],
    },
    {
      id: "mountain",
      name: "Mountain of Helpers",
      tagline: "We can do hard things together.",
      image: "/assets/zones/mountain.png",
      chapterIds: ["ch4"],
    },
    {
      id: "meadow",
      name: "Everbright Meadow",
      tagline: "Practice welcoming others.",
      image: "/assets/zones/meadow.png",
      chapterIds: ["ch1"],
    },
    {
      id: "cave",
      name: "Cave of Purpose",
      tagline: "Your guardian has a job — listen with care.",
      image: "/assets/zones/cave.png",
      chapterIds: [],
    },
  ] as ZoneConfig[],
  achievementChecklist: [
    "Asked Flicker curious questions",
    "Inspected a worry-flower",
    "Welcomed Flicker beside you",
    "Thanked Flicker for helping",
    "Took festival steps while nervous",
    "Earned a Star Crystal",
  ] as const,
  /**
   * Per-chapter celebration copy.
   *
   * This used to be a single hardcoded block describing **Chapter 2** — so a child who
   * finished Chapter 1 (meeting Jamie, sharing a flower, apologising, asking a grown-up)
   * was congratulated for asking Flicker curious questions and inspecting a worry-flower.
   * None of which happened, about a character who wasn't in the chapter. For a five-year-old
   * that turns the payoff moment into a confusing non-sequitur.
   *
   * ⚠️ **Ch.1 copy below is an SME DRAFT — not signed off.** Child-facing; spec §8.6 gates
   * it behind SME review, like the distress re-entry copy and the three new Ch.1 decision
   * points. `companionLesson` is spoken in the companion's voice, so it must stay warm and
   * situational, never identity-claiming (§9.8).
   */
  celebrations: {
    ch1: {
      backgroundImage: "/assets/zones/meadow.png",
      trophyLabel: "🌟 Friendship Star",
      title: "Adventure Complete",
      companionName: "Flicker",
      companionLesson: "I watched you make room for someone who felt left out. That took a kind heart.",
      playerLesson: "I can notice when someone feels alone — and do something about it.",
      achievements: [
        "Invited Jamie to play",
        "Helped a shy friend feel braver",
        "Took turns instead of keeping it all",
        "Said sorry and helped fix it",
        "Asked a grown-up for help",
        "Earned a Friendship Star",
      ],
      quote: "Being kind isn't something you are. It's something you do, one moment at a time.",
    },
    ch2: {
      backgroundImage: "/assets/zones/mountain.png",
      trophyLabel: "⭐ Star Crystal",
      title: "Adventure Complete",
      companionName: "Flicker",
      companionLesson: "I don't have to stop my child every time I feel scared — I can walk beside them.",
      playerLesson: "I can feel nervous and still take the next step with Flicker.",
      achievements: [
        "Asked Flicker curious questions",
        "Inspected a worry-flower",
        "Welcomed Flicker beside you",
        "Thanked Flicker for helping",
        "Took festival steps while nervous",
        "Earned a Star Crystal",
      ],
      quote: "The secret isn't getting rid of your Guardian. It's learning how to listen to them.",
    },
  },
} as const;

export type CelebrationConfig =
  (typeof contentConfig.celebrations)[keyof typeof contentConfig.celebrations];

/** Falls back to ch2 (the showcase chapter) for any chapter without authored copy. */
export function celebrationFor(chapterId: string): CelebrationConfig {
  const table = contentConfig.celebrations as Record<string, CelebrationConfig | undefined>;
  return table[chapterId] ?? contentConfig.celebrations.ch2;
}
