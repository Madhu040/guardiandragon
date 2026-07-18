import type { GameEvent, GameState, ScoreBand, SkillId } from "../types/index.js";
import { checkinPlacementLabel } from "./checkin.js";

export interface CounselorInsight {
  title: string;
  forChild: string;
  forParent: string;
  skillFocus: SkillId | "general";
  practiceTip: string;
  strengthNoted: string;
}

export interface JourneyReflection {
  summary: string;
  strengths: string[];
  growthEdges: string[];
  stepInsights: CounselorInsight[];
  parentCoaching: string[];
  closingNote: string;
}

const STEP_INSIGHTS: Record<string, Record<ScoreBand, CounselorInsight>> = {
  dp_leftout_bench: {
    strong: {
      title: "Inclusion as courage",
      forChild: "You noticed someone feeling alone and made room for them. That is empathy in action — your heart saw what your eyes noticed.",
      forParent: "Your child practiced perspective-taking and social invitation. Reinforce by naming the skill: “You saw Jamie’s feeling and offered belonging.”",
      skillFocus: "empathy",
      practiceTip: "At home, ask: “Who might feel left out today, and what’s one small welcome we could offer?”",
      strengthNoted: "Social awareness + kind initiative",
    },
    partial: {
      title: "Quiet presence still counts",
      forChild: "Sitting nearby can be a gentle start. Next time, a short invitation can help the feeling of belonging grow even more.",
      forParent: "Your child showed soft support. Coach the next step: a simple script like “Want to join us?” builds confidence.",
      skillFocus: "empathy",
      practiceTip: "Role-play a 5-second invitation together.",
      strengthNoted: "Respectful presence",
    },
    poor: {
      title: "Feelings we miss can be repaired",
      forChild: "Everyone misses cues sometimes. What matters is turning back and trying a kinder choice — that is how friendship muscles grow.",
      forParent: "Avoid shame. Reflect: “What might Jamie have felt?” Then practice a repair invitation together.",
      skillFocus: "friendship_repair",
      practiceTip: "Use a do-over: “Let’s try that scene again with a welcome.”",
      strengthNoted: "Willingness to retry",
    },
  },
  dp_ask_grownup: {
    strong: {
      title: "Asking for help is strength",
      forChild: "You shared what happened with a trusted grown-up. That keeps everyone safer and shows real courage.",
      forParent: "Celebrate help-seeking. Children who can loop in adults build resilience and reduce secrecy around hard moments.",
      skillFocus: "courage",
      practiceTip: "Name 2–3 trusted adults your child can go to at school and home.",
      strengthNoted: "Help-seeking + advocacy",
    },
    partial: {
      title: "It’s okay to start small",
      forChild: "Saying you’re fine is common. When something felt big for a friend, telling a grown-up can be another brave option.",
      forParent: "Normalize that kids often minimize. Invite check-ins: “Was there anything today that needed a grown-up’s help?”",
      skillFocus: "courage",
      practiceTip: "Practice a short share script at dinner.",
      strengthNoted: "Self-regulation",
    },
    poor: {
      title: "Secrets that hurt need light",
      forChild: "Some feelings are private, but if someone is hurting or left out, a trusted grown-up should know. You’re not tattling — you’re caring.",
      forParent: "Gently correct secrecy norms. Distinguish privacy from safety: “We don’t keep hurts as secrets.”",
      skillFocus: "courage",
      practiceTip: "Create a family phrase: “Hard things get help.”",
      strengthNoted: "Openness to guidance",
    },
  },
  dp_quest_start: {
    strong: {
      title: "Values pull us forward",
      forChild: "You said yes to the adventure. Wanting the Shimmer Crystal gives your courage somewhere to go.",
      forParent: "Motivation rooted in values (curiosity, adventure) fuels approach behavior better than pressure.",
      skillFocus: "courage",
      practiceTip: "Ask: “What are you looking forward to trying this week?”",
      strengthNoted: "Motivated engagement",
    },
    partial: {
      title: "Soft hellos to adventure",
      forChild: "Starting slowly is okay. The crystal will wait while you find your footing.",
      forParent: "Warm invitation beats urgency when kids hesitate at new activities.",
      skillFocus: "courage",
      practiceTip: "Offer a tiny first step toward something fun.",
      strengthNoted: "Gentle readiness",
    },
    poor: {
      title: "The door stays open",
      forChild: "Adventures wait patiently. When you’re ready, Flicker will be right there.",
      forParent: "Keep invitation warm without force — autonomy supports courage later.",
      skillFocus: "courage",
      practiceTip: "Revisit the quest when energy is higher.",
      strengthNoted: "Respect for pacing",
    },
  },
  dp_investigate: {
    strong: {
      title: "Fear is information",
      forChild: "You looked carefully instead of running. Flicker’s alarm helped you notice — then your curiosity did the next work.",
      forParent: "This models reality testing after amygdala alarm: validate the signal, then gather data.",
      skillFocus: "worry_brave",
      practiceTip: "When worry spikes, ask: “What can we check with our eyes and ears?”",
      strengthNoted: "Reality testing + curiosity",
    },
    partial: {
      title: "Looking is brave too",
      forChild: "Checking one clue still counts. Little looks add up to clearer facts.",
      forParent: "Partial investigation is approach behavior — reinforce it.",
      skillFocus: "worry_brave",
      practiceTip: "Practice one ‘look and listen’ when something feels spooky.",
      strengthNoted: "Incremental curiosity",
    },
    poor: {
      title: "We can look together",
      forChild: "It’s okay if checking feels hard. Wize and Flicker can look with you.",
      forParent: "Co-inspect fears side-by-side to build safety.",
      skillFocus: "worry_brave",
      practiceTip: "Do a two-minute ‘detective walk’ on a small worry.",
      strengthNoted: "Willingness to be accompanied",
    },
  },
  dp_fact_sort: {
    strong: {
      title: "Stories aren’t facts",
      forChild: "You spotted the story — “WILL break” is a prediction, not something you proved. That flexible thinking helps worry loosen.",
      forParent: "Cognitive flexibility: distinguishing fact / possibility / catastrophe is core CBT skill for anxious kids.",
      skillFocus: "worry_brave",
      practiceTip: "Sort family worries into Fact / Maybe / Story at dinner.",
      strengthNoted: "Cognitive flexibility",
    },
    partial: {
      title: "Thoughts can be sorted",
      forChild: "Some thoughts are facts, some are maybes, some are stories. Let’s try sorting again — you’ve got this.",
      forParent: "Near-misses are learning. Prompt: “Is that something we know, might happen, or a scary story?”",
      skillFocus: "adapting_to_change",
      practiceTip: "Label one worry as Fact, Maybe, or Story together.",
      strengthNoted: "Openness to reframe",
    },
    poor: {
      title: "Minds tell stories",
      forChild: "Flicker tells lots of stories too. Stories aren’t bad — we just check them.",
      forParent: "Normalize storytelling minds; avoid correcting harshly.",
      skillFocus: "worry_brave",
      practiceTip: "Say: “That’s a loud story. What’s one fact we know?”",
      strengthNoted: "Capacity to retry",
    },
  },
  dp_breathe: {
    strong: {
      title: "Bodies need help too",
      forChild: "You helped Flicker’s body slow down. Thinking helps, and breath helps — both matter when worry shows up.",
      forParent: "Physiological regulation after cognitive work matches good clinical sequence: body first when activated.",
      skillFocus: "calm",
      practiceTip: "Practice 5 slow breaths before hard homework or new places.",
      strengthNoted: "Co-regulation leadership",
    },
    partial: {
      title: "One breath at a time",
      forChild: "Each breath softens the sparks a little more. Keep going — Flicker’s with you.",
      forParent: "Chunk calming so it doesn’t feel like a performance.",
      skillFocus: "calm",
      practiceTip: "Count three matching breaths together tonight.",
      strengthNoted: "Incremental calm",
    },
    poor: {
      title: "Calm takes practice",
      forChild: "Breathing can feel weird at first. We’ll try again slowly together.",
      forParent: "Keep tone playful; never force breathwork if it spikes distress.",
      skillFocus: "calm",
      practiceTip: "Offer optional hand-on-heart instead of counted breaths.",
      strengthNoted: "Willingness to continue",
    },
  },
  dp_choose_path: {
    strong: {
      title: "Nervous is not a stop sign",
      forChild: "You chose to keep going while still feeling nervous. That is real courage — not waiting until fear disappears.",
      forParent: "Committed action with anxiety present is the inhibitory-learning goal of exposure.",
      skillFocus: "courage",
      practiceTip: "Name: “Brave means taking the next step with the worry riding along.”",
      strengthNoted: "Agency + approach",
    },
    partial: {
      title: "Agency is protected",
      forChild: "Going back is allowed. Wize says you can always try one careful step when you’re ready.",
      forParent: "Preserving agency while inviting approach prevents coercion that worsens anxiety.",
      skillFocus: "worry_brave",
      practiceTip: "Offer: “Want one careful step together, or rest first?”",
      strengthNoted: "Autonomous choice",
    },
    poor: {
      title: "Choice stays yours",
      forChild: "You get to choose. When you’re ready, Flicker will walk with you.",
      forParent: "Avoid ultimatums around feared situations.",
      skillFocus: "courage",
      practiceTip: "Rehearse a one-step invitation without pressure.",
      strengthNoted: "Safety in choice",
    },
  },
  dp_crossing: {
    strong: {
      title: "Courage walks with fear",
      forChild: "You crossed while still feeling scared — and earned a Courage Feather for walking with courage, not for being fearless.",
      forParent: "Celebrate process over outcome: approached while activated, completed exposure with support.",
      skillFocus: "courage",
      practiceTip: "Family ritual: name one ‘walked with worry’ moment each evening.",
      strengthNoted: "Exposure with inhibitory learning",
    },
    partial: {
      title: "One plank at a time",
      forChild: "Each plank is a brave step. The bridge is holding — keep going with Flicker.",
      forParent: "Chunking exposure reduces overwhelm; praise incremental approach.",
      skillFocus: "worry_brave",
      practiceTip: "Break a feared task into four visible steps.",
      strengthNoted: "Incremental approach",
    },
    poor: {
      title: "Every try counts",
      forChild: "Trying again is brave too. Let’s take the next careful step together.",
      forParent: "Keep warmth high; never shame unfinished approach.",
      skillFocus: "courage",
      practiceTip: "Cheer the attempt, not only the finish.",
      strengthNoted: "Persistence",
    },
  },
  dp_hothead_calm: {
    strong: {
      title: "Calm is a skill, not a switch",
      forChild: "You helped Alex breathe before talking. That gives big feelings a soft landing.",
      forParent: "Your child practiced co-regulation — a core emotion-regulation skill linked to healthier conflict outcomes.",
      skillFocus: "calm",
      practiceTip: "Family calm kit: breathe, sip water, name the feeling, then talk.",
      strengthNoted: "Co-regulation leadership",
    },
    partial: {
      title: "Space can be kindness",
      forChild: "Giving space shows respect. Checking back later completes the care.",
      forParent: "Space helps, but reconnect afterward so the peer doesn’t feel abandoned.",
      skillFocus: "calm",
      practiceTip: "Agree on a “check-back” time after cool-downs.",
      strengthNoted: "Respect for emotional pacing",
    },
    poor: {
      title: "Shame heats anger up",
      forChild: "Calling feelings dramatic can hurt. Calm words help the fire cool.",
      forParent: "Minimize dismissive language. Model: “Your mad is real. Let’s cool first.”",
      skillFocus: "calm",
      practiceTip: "Replace judgment with feeling labels.",
      strengthNoted: "Ability to course-correct",
    },
  },
  dp_friendship_repair: {
    strong: {
      title: "Repair restores belonging",
      forChild: "You invited a kinder rematch. Friendships get stronger after honest repair.",
      forParent: "Repair language builds secure peer relationships and reduces lingering resentment.",
      skillFocus: "friendship_repair",
      practiceTip: "Practice: “I’m sorry for ___. Next time I’ll ___.”",
      strengthNoted: "Restorative communication",
    },
    partial: {
      title: "Timing matters in repair",
      forChild: "Waiting until tomorrow can be wise. Keeping the door open is still friendship.",
      forParent: "Honor pacing while ensuring the relationship isn’t left in limbo.",
      skillFocus: "friendship_repair",
      practiceTip: "Schedule a gentle reconnect.",
      strengthNoted: "Emotional timing",
    },
    poor: {
      title: "Exclusion isn’t repair",
      forChild: "Pushing someone away after a hard moment can make both hearts heavier. Let’s try a kinder door.",
      forParent: "Guide away from punitive exclusion. Focus on accountability + re-inclusion.",
      skillFocus: "friendship_repair",
      practiceTip: "Rewrite the ending with a repair invitation.",
      strengthNoted: "Capacity for guided repair",
    },
  },
};

export function insightForStep(decisionPointId: string, band: ScoreBand): CounselorInsight {
  const byBand = STEP_INSIGHTS[decisionPointId];
  if (byBand?.[band]) return byBand[band];
  return {
    title: "A meaningful step",
    forChild: "You practiced an important feeling skill. Every choice teaches your heart something new.",
    forParent: "Reflect together on what your child noticed, felt, and chose. Curiosity beats criticism.",
    skillFocus: "general",
    practiceTip: "Ask: “What felt hard? What felt kind?”",
    strengthNoted: "Engagement with growth",
  };
}

export function buildJourneyReflection(state: GameState): JourneyReflection {
  const events = state.eventLog;
  const stepInsights = events.map((e) => insightForStep(e.decisionPointId, e.scoreBand));

  const strongCount = events.filter((e) => e.scoreBand === "strong").length;
  const poorCount = events.filter((e) => e.scoreBand === "poor").length;

  const strengths = [...new Set(stepInsights.map((s) => s.strengthNoted))];
  const growthEdges = stepInsights
    .filter((_, i) => events[i]?.scoreBand !== "strong")
    .map((s) => s.title);

  const parentCoaching = [
    "Lead with curiosity: “What was that character feeling?” before “What should you have done?”",
    "Celebrate process skills (naming feelings, asking for help, repairing) more than perfect outcomes.",
    "If big feelings show up after play, co-regulate first — then reflect for 2–3 minutes max for younger kids.",
    "TruNorth is SEL practice, not therapy. If worries persist or intensify, consult a trusted pediatric or mental-health professional.",
  ];

  if (poorCount > 0) {
    parentCoaching.unshift(
      "Your child practiced repair after a harder choice — that resilience is more valuable than a flawless path.",
    );
  }

  const checkin = state.progress.checkins?.[state.profile.chapterId];
  if (checkin?.placement === "gentle") {
    parentCoaching.unshift(
      "The pre-level check-in showed your child arrived carrying heavier feelings today. Extra warmth and slower pacing will go further than pushing for wins.",
    );
  }

  let summary =
    strongCount >= Math.max(1, events.length - 1)
      ? `${state.profile.companionName} noticed lots of kind, brave choices. Your child’s emotional muscles got a strong workout today.`
      : `This journey had learning turns — and that’s healthy. Growth often shows up in the retries, not only the wins.`;
  if (checkin) {
    summary += ` Before playing, the check-in placed them at a ${checkinPlacementLabel(checkin.placement).toLowerCase()} (${checkin.startingPoint}/10 starting point).`;
  }

  return {
    summary,
    strengths: strengths.slice(0, 5),
    growthEdges: growthEdges.length ? [...new Set(growthEdges)].slice(0, 4) : ["Keep practicing calm check-ins"],
    stepInsights,
    parentCoaching,
    closingNote:
      "You are not alone in this. Small daily conversations about feelings build lifelong emotional health — one kind step at a time.",
  };
}

export function childFacingLine(insight: CounselorInsight, companionName: string): string {
  return `${companionName}: ${insight.forChild}`;
}
