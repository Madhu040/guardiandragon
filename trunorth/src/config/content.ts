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
      id: "bridge",
      name: "The Singing Bridge",
      tagline: "Feel nervous — and still take the next step.",
      image: "/assets/zones/forest.png",
      chapterIds: ["ch2"],
    },
    {
      id: "meadow",
      name: "Meadow of Curiosity",
      tagline: "Explore, wonder, and welcome others.",
      image: "/assets/zones/meadow.png",
      chapterIds: ["ch1"],
    },
    {
      id: "forest",
      name: "Forest of Questions",
      tagline: "Answer with care — clear the murky water.",
      image: "/assets/zones/forest.png",
      chapterIds: ["ch3"],
    },
    {
      id: "mountain",
      name: "Mountain of Helpers",
      tagline: "You are stronger together. Keep following your True North.",
      image: "/assets/zones/mountain.png",
      chapterIds: [],
    },
  ] as ZoneConfig[],
  achievementChecklist: [
    "Thanked Flicker for noticing",
    "Checked the facts",
    "Sorted stories from truths",
    "Helped Flicker's body calm",
    "Chose to keep going",
    "Earned Courage Feather #1",
  ] as const,
  celebration: {
    backgroundImage: "/assets/zones/forest.png",
    trophyLabel: "🪶 Courage Feather #1",
    title: "Level Complete",
    flickerLesson: "I don’t have to stop my child every time I feel scared.",
    playerLesson: "I can feel nervous and still take the next step.",
    quote: "You can feel afraid… and still keep walking.",
  },
} as const;
