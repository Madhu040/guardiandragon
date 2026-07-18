/** Discussion prompts for parent–child Together Mode at each decision point */

const DISCUSS_PROMPTS: Record<string, string> = {
  dp_leftout_bench:
    "In the Meadow of Curiosity, a friend sits alone. What feeling might they have? Tell each other before you pick.",
  dp_ask_grownup:
    "When is it okay to ask a grown-up for help? Share a time you asked for help together.",
  dp_quest_start:
    "Flicker wants an adventure to the Shimmer Crystal. What are you looking forward to in today's journey?",
  dp_investigate:
    "The bridge squeaks and Flicker panics. What is one thing you could look at or listen for before deciding it's dangerous?",
  dp_fact_sort:
    "Which thoughts are facts, which are maybes, and which are scary stories? Sort one family worry the same way.",
  dp_breathe:
    "Flicker's body is still scared even after thinking. What helps your body calm down when worry buzzes?",
  dp_choose_path:
    "Feeling nervous isn't a stop sign. When have you felt scared and still taken a careful next step?",
  dp_crossing:
    "You crossed while still nervous. What does a Courage Feather mean — being fearless, or walking with courage?",
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
