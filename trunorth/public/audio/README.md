# Audio assets (spec §17B.4)

Drop your CC0 clips here using these exact filenames. The game reads them through
`src/audio/sfx.ts`; until a file exists, that cue is simply silent — no crash, no console
noise — so the offline demo never breaks if a file is missing. Same fallback contract as
the art asset manifest (`src/content/assetManifest.ts`).

**Rules**
- MP3, mono or stereo, short (footsteps/chimes should be well under 1s; the decision
  stings and celebration fanfare can run a couple seconds).
- Keep the whole audio/ folder small — it counts against the CI bundle budget
  (`npm run audit:bundle`, spec §19).
- §17A.4 calm-first budget: the ambient bed must read as *low-stimulation* — no melody
  hooks, no rising tension, nothing a child would call "exciting." Event cues can be
  brighter; the bed never competes with them.
- Never delete a placeholder path from the code; a missing file just stays silent.

## Suggested sources (all CC0, no attribution required)
- **[Kenney.nl](https://kenney.nl/assets)** — "Interface Sounds", "UI Audio", "RPG Audio"
  packs cover footstep/click/chime/fanfare well. Everything Kenney publishes is CC0.
- **[Freesound.org](https://freesound.org)**, filtered to the CC0 license — best source
  for a genuinely calm ambient loop (search "calm ambient loop" or "meadow ambience").

## sfx/  (one-shot event cues)
| File | Spec §17B.4 event | Fired from |
|---|---|---|
| `footstep.wav` | avatar takes a step while exploring | `WorldRuntime` (throttled, ~3/sec) |
| `discovery.mp3` | first time examining a discoverable object | `main.ts` `recordDiscovery` |
| `spark-pickup.mp3` | a gentle chime on brownie-point pickup | `main.ts` `onWorldCollect` |
| `decision-strong.mp3` | "a magical harp swirl" — a strong choice | `SceneEngine` → `onDecisionBand` |
| `decision-thud.mp3` | "a soft comical thud" — a poor choice / repair nudge | `SceneEngine` → `onDecisionBand` |
| `celebration.mp3` | chapter complete | `main.ts` `onCelebration` |

## ambience/  (looped, low-energy exploration bed)
| File | Notes |
|---|---|
| `exploring-bed.wav` | loops while `phase === "exploring"`; pauses for decisions/dialog/celebration so it never fights their own cues. Mixed well below the event cues (`VITE_SFX_AMBIENCE_VOLUME`, default 0.15 vs 0.7). |

## 2026-07-20 — first generated set, two files re-processed

All 7 files landed (6 sfx + 1 ambience), correctly named, valid MP3/WAV, no clipping. Two
had defects that would have shipped silently, so they were corrected — both are now `.wav`
because **no MP3 encoder is available on this machine** (no `lame`, no Python mp3 lib,
`afconvert` only *decodes* MP3). Browsers play `.wav` from `<audio>` identically to `.mp3`,
so this is functionally invisible in-game; it's a build-provenance note, not a UX change.

- **`footstep` — was a real bug, not just quality.** `playSfx` restarts the *same* cached
  `<audio>` element on every call (`el.currentTime = 0`), and footsteps retrigger every
  `FOOTSTEP_INTERVAL_S` = 0.32s (`WorldRuntime.ts`). The delivered clip's actual transient
  sat at **0.424s** — *after* the next restart — so during continuous walking the cue was
  perpetually cut off right before its own audible content and would never actually be
  heard. Trimmed to a 260ms clip (15ms pre-roll + the transient + a 12ms fade-out so the
  hard cut doesn't click), comfortably inside the retrigger window.
- **`exploring-bed` — didn't loop cleanly.** `startAmbience()` sets `.loop = true` on the
  raw file; the delivered clip's start (−8.0dB) and end (−12.6dB) were both near full
  volume rather than near-silent, so the loop seam would click audibly every ~2s. Applied a
  150ms linear fade-in/fade-out to remove the click.
- **Not fixed, and can't be by editing:** the ambience clip is genuinely only ~2 seconds of
  material. The fade stops it *clicking*, but a 2s loop will still read as repetitive under
  the §17A.4 calm-first goal ("low-stimulation", not "obviously on a loop"). If this bothers
  you in playtest, regenerate `exploring-bed` as a longer take (20–60s, ideally composed to
  loop — same start/end phrase) rather than editing the current one further; drop it in
  under the same filename (`.mp3` is fine for a fresh regeneration) and it replaces the
  `.wav` automatically (update the path back to `.mp3` in `sfx.ts` if you do).
- **`celebration.mp3` peaks at −0.5dBFS** — essentially no headroom. Left as delivered
  (didn't want to silently gain-reduce a fanfare that may be intentionally loud), but if it
  sounds harsh or distorted through any device, that's why.
- Original delivered files (before trimming) kept outside the repo, not lost.
