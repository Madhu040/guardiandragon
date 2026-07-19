/** Discussion prompts for parent–child Together Mode at each decision point */

const DISCUSS_PROMPTS: Record<string, string> = {
  dp_leftout_bench:
    "In the Meadow of Curiosity, a friend sits alone. What feeling might they have? Tell each other before you pick.",
  dp_ask_grownup:
    "When is it okay to ask a grown-up for help? Share a time you asked for help together.",
  dp_quest_start:
    "Nova wants Star Crystals for the Sky Festival. Flicker is worried. What helps when someone you love frets and you still want to try?",
  dp_investigate:
    "Flicker says \"What if we get lost?\" Practice one curious question you could ask a worry at home.",
  dp_fact_sort:
    "A worry looked huge until Nova inspected it. When have you looked closer at a scary thought and found it smaller?",
  dp_breathe:
    "Flicker felt left out. What is one kind way you welcome a worried feeling instead of pushing it away?",
  dp_choose_path:
    "Flicker isn't broken — Flicker has a purpose. Share one time worry actually kept someone safer.",
  dp_crossing:
    "They felt scared and still stepped on stage. What does courage mean — zero fear, or going together anyway?",
  dp_hothead_calm:
    "In the Forest of Questions, murky feelings cloud the water. What helps your body calm down when you feel that way?",
  dp_friendship_repair:
    "A friendship got hurt. What does a good repair sound like? Practice one kind sentence together.",
};

export function discussPrompt(decisionPointId: string): string {
  return (
    DISCUSS_PROMPTS[decisionPointId] ??
    "What might the character be feeling? Talk it through together before you choose."
  );
}
