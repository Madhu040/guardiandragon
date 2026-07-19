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
  celebration: {
    backgroundImage: "/assets/zones/mountain.png",
    trophyLabel: "⭐ Star Crystal",
    title: "Adventure Complete",
    flickerLesson: "I don't have to stop my child every time I feel scared — I can walk beside them.",
    playerLesson: "I can feel nervous and still take the next step with Flicker.",
    quote: "The secret isn't getting rid of your Guardian. It's learning how to listen to them.",
  },
} as const;
