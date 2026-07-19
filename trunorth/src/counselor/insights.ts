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
      forChild: "You invited Flicker along on the Star Crystal quest. Wanting the Sky Festival gives your courage somewhere to go.",
      forParent: "Motivation rooted in values (belonging, celebration) fuels approach better than pressure — especially when a worry-part tags along.",
      skillFocus: "courage",
      practiceTip: "Ask: What are you looking forward to trying this week — even if Flicker frets?",
      strengthNoted: "Motivated engagement",
    },
    partial: {
      title: "Soft hellos to adventure",
      forChild: "Starting slowly is okay. The crystals will wait while you find your footing.",
      forParent: "Warm invitation beats urgency when kids hesitate at new activities.",
      skillFocus: "courage",
      practiceTip: "Offer a tiny first step toward something fun.",
      strengthNoted: "Gentle readiness",
    },
    poor: {
      title: "The door stays open",
      forChild: "Adventures wait patiently. When you're ready, Flicker will be right there.",
      forParent: "Keep invitation warm without force — autonomy supports courage later.",
      skillFocus: "courage",
      practiceTip: "Revisit the quest when energy is higher.",
      strengthNoted: "Respect for pacing",
    },
  },
  dp_investigate: {
    strong: {
      title: "Curiosity quiets alarms",
      forChild: "You asked Flicker a curious question. Worry often softens when it feels heard — not when we yell at it to stop.",
      forParent: "Naming and questioning worry (ACT/CBT) reduces fusion with catastrophic thoughts for ages 5–8.",
      skillFocus: "worry_brave",
      practiceTip: "When worry spikes, try: What makes you think that? before problem-solving.",
      strengthNoted: "Curious listening",
    },
    partial: {
      title: "Questions are brave",
      forChild: "One curious question still counts. Little questions add up to clearer facts.",
      forParent: "Partial curiosity is approach behavior — reinforce it.",
      skillFocus: "worry_brave",
      practiceTip: "Practice one gentle question with a family worry tonight.",
      strengthNoted: "Incremental curiosity",
    },
    poor: {
      title: "We can ask together",
      forChild: "It's okay if asking feels hard. The owl and Flicker can ask with you.",
      forParent: "Co-ask fears side-by-side to build safety.",
      skillFocus: "worry_brave",
      practiceTip: "Do a two-minute question walk on a small worry.",
      strengthNoted: "Willingness to be accompanied",
    },
  },
  dp_fact_sort: {
    strong: {
      title: "Inspect, don't fight",
      forChild: "You looked closer and the huge worry-flower got smaller. Worries can be clues — not enemies to yank out.",
      forParent: "Curiosity over experiential avoidance: investigating reduces threat amplification.",
      skillFocus: "worry_brave",
      practiceTip: "Draw a big worry then shrink it after listing what you know for sure.",
      strengthNoted: "Curiosity over avoidance",
    },
    partial: {
      title: "Looking changes size",
      forChild: "Inspecting is practice. Keep looking — flowers often look smaller up close.",
      forParent: "Near-misses are learning. Prompt: What do we notice when we look carefully?",
      skillFocus: "adapting_to_change",
      practiceTip: "Use a real magnifying glass metaphor for one worry.",
      strengthNoted: "Openness to reframe",
    },
    poor: {
      title: "Fighting grows more",
      forChild: "Pulling the flower made more grow. Next time, try looking with curiosity instead of fighting.",
      forParent: "Suppression and struggle often amplify anxiety — validate and redirect to inspection.",
      skillFocus: "worry_brave",
      practiceTip: "Say: Fighting the worry made it louder. Want to look at it together?",
      strengthNoted: "Capacity to retry",
    },
  },
  dp_breathe: {
    strong: {
      title: "Welcome beside you",
      forChild: "You invited Flicker to walk beside you. Kindness helps protectors feel safer than being pushed away.",
      forParent: "Acceptance over rejection of the anxiety part builds psychological flexibility.",
      skillFocus: "empathy",
      practiceTip: "Practice: Worry can sit beside us while we keep going.",
      strengthNoted: "Acceptance + warmth",
    },
    partial: {
      title: "Color returns",
      forChild: "Each kind act brings Flicker's color back. Keep welcoming — you're doing it.",
      forParent: "Chunk welcoming behaviors so kids can try multiple strategies.",
      skillFocus: "calm",
      practiceTip: "Offer hug / listen / sit-together choices when worry shows up.",
      strengthNoted: "Incremental kindness",
    },
    poor: {
      title: "Pushing away feels lonely",
      forChild: "Ignoring Flicker made things feel emptier. A hug, listen, or sit-together can help.",
      forParent: "Avoid teaching kids to exile anxious feelings; model companionship instead.",
      skillFocus: "empathy",
      practiceTip: "Role-play inviting a worried stuffed animal to sit nearby.",
      strengthNoted: "Willingness to continue",
    },
  },
  dp_choose_path: {
    strong: {
      title: "Anxiety has a purpose",
      forChild: "You thanked Flicker. Guardians aren't broken — they care. The skill is telling danger from possibility.",
      forParent: "Reframing anxiety as protective (not pathological) reduces shame in young children.",
      skillFocus: "empathy",
      practiceTip: "Share one time worry actually kept someone safer.",
      strengthNoted: "Appreciation of the protector",
    },
    partial: {
      title: "Remembering helps",
      forChild: "Remembering how Flicker helped softens the sparks. Saying thanks makes the cave brighter.",
      forParent: "Gratitude toward the anxiety system supports self-compassion.",
      skillFocus: "worry_brave",
      practiceTip: "List two ways worry has been useful this month.",
      strengthNoted: "Softening toward self",
    },
    poor: {
      title: "Not the enemy",
      forChild: "Flicker isn't broken. Try thanking the part that tries to keep you safe.",
      forParent: "Avoid stop-worrying messages that shame the protector role.",
      skillFocus: "self_worth",
      practiceTip: "Rephrase: Thanks for trying to protect me — let's check the facts.",
      strengthNoted: "Openness to reframe",
    },
  },
  dp_crossing: {
    strong: {
      title: "Courage walks with fear",
      forChild: "You stepped on stage while still nervous — and earned a Star Crystal for walking with courage, not for feeling zero fear.",
      forParent: "Celebrate process: approached while activated, completed exposure with support. Never display Fear=0.",
      skillFocus: "courage",
      practiceTip: "Family ritual: name one walked-with-worry moment each evening.",
      strengthNoted: "Exposure with inhibitory learning",
    },
    partial: {
      title: "One step at a time",
      forChild: "Each festival step is brave. Flicker is still with you — keep going.",
      forParent: "Chunking exposure reduces overwhelm; praise incremental approach.",
      skillFocus: "worry_brave",
      practiceTip: "Break a feared task into four visible steps.",
      strengthNoted: "Incremental approach",
    },
    poor: {
      title: "Every try counts",
      forChild: "Trying again is brave too. Let's take the next careful step together.",
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
