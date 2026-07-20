# Art assets

Drop your generated PNGs here using these exact filenames. The game reads them through
the asset manifest (`src/content/assetManifest.ts`); until a file exists, the code-drawn
sprite / emoji placeholder is used, so the offline demo never breaks if a file is missing.

**Rules**
- PNG, transparent background for characters and objects; backgrounds can be opaque.
- Keep each file small (< ~300 kB) — the CI bundle budget (`npm run audit:bundle`) enforces it.
- Never delete a placeholder path from the code; the manifest falls back to it.

## characters/  (transparent PNG, front-facing full body)
flicker.png            flicker-worried.png     flicker-happy.png
nova-light-fair.png … nova-deep-brown.png   ← the Explorer, one per skin tone (see below)
wize.png   jamie.png   deer.png   grownup.png   worry-cloud.png
companion-fox.png      companion-sprite.png

### The Explorer (avatar) — 5 skin tones
The child picks 1 of 5 skin tones at onboarding, so the avatar needs one PNG per tone
(a single fixed PNG would erase that choice). `AVATAR_FILES` in `assetManifest.ts` maps
each tone to its file — keep these names in sync with that map:

    tone_1  #f5d0b0 (light / fair)          nova-light-fair.png
    tone_2  #e0ac69 (light tan)             nova-light-tan.png
    tone_3  #8d5524 (medium brown)          nova-warm-medium.png        ← onboarding default
    tone_4  #6b3f1f (medium-dark brown)     nova-warm-medium-brown.png
    tone_5  #4a2c14 (deep brown)            nova-deep-brown.png

#### Canonical design — the five must be the *same child*

**Locked:** plain **purple** headband · **no backpack, no props, no badges** · purple
long-sleeve shirt · blue trousers · brown shoes. Nothing varies between the five except
skin tone (and hair shade following it naturally).

Purple + no-backpack is canon because it's what most of the set already is, and because at
the in-world sprite size (~110px tall) fine props like a compass badge don't read anyway —
they just make the child look like a different person each time the tone changes.

**Current set vs. canon** (`npm run test:unit` guards tone order/spread, not accessories):

| file | tone | status |
|---|---|---|
| `nova-light-fair.png` | tone_1 | purple headband, no props — but its own hairstyle |
| `nova-light-tan.png` | tone_2 | ❌ green headband **+ backpack & compass** |
| `nova-warm-medium.png` | tone_3 | purple headband, no props — **use as the base** |
| `nova-warm-medium-brown.png` | tone_4 | ❌ blue headband |
| `nova-deep-brown.png` | tone_5 | ❌ backpack & compass |

#### Produce the set by **recolouring one base**, not by generating five times

Generating the prompt five times is what caused the drift in the first place — independent
generations vary hairstyle, headband and props even at a fixed seed. All five must be the
*same drawing*, so derive four of them from one approved base by **editing only the skin
tone**. That means every file gets replaced, including the two that are otherwise on canon
(they still have hairstyles of their own).

Base: **`nova-warm-medium.png`** (tone_3) — already on canon, the onboarding default, and
mid-range, so each recolour is the smallest possible shift in either direction.

⚠️ **Also push the deep end darker.** Measured face tones run luminance 202 → 181 → 152 →
130 → **100**. The palette these represent goes down to `#4a2c14` (≈45), so the set is
compressed toward light and the darkest tones are under-served — which matters, because
representation is the entire reason there are five. Aim tone_4 near `#6b3f1f` and tone_5
near `#4a2c14` rather than the current medium browns.

**Nano Banana — recolour prompt.** Attach `nova-warm-medium.png` and run this once per
target tone, changing only the bracketed phrase:

> Change **only** the skin tone of this character to **[TONE]**. Keep absolutely everything
> else pixel-for-pixel identical: the same pose, the same face shape and facial features,
> the same expression, the same hairstyle, hair length and curl pattern, the same plain
> purple headband, the same purple long-sleeve shirt, the same blue trousers, the same brown
> shoes, the same line work, the same cel-shading and lighting, the same proportions, and the
> same framing, scale and position in the frame. Do not add or remove any object, accessory
> or prop. Do not restyle or redraw anything. Keep the background fully transparent. Output
> the complete figure head-to-toe.

Bracketed `[TONE]` per file:

    nova-light-fair.png         very light fair skin, around #f5d0b0
    nova-light-tan.png          light tan skin, around #e0ac69
    nova-warm-medium.png        (the base — no edit needed)
    nova-warm-medium-brown.png  medium-dark brown skin, around #6b3f1f
    nova-deep-brown.png         deep brown skin, around #4a2c14

Add this sentence only if the hair reads oddly against the new tone — it is the one thing
allowed to shift, and only slightly: *"You may darken or lighten the hair shade slightly so
it looks natural with the new skin tone, but keep the exact same hairstyle and shape."*

**Midjourney fallback** (less reliable for this — it re-draws rather than edits): use the
base as a character reference, `--cref <url> --cw 100`, with the same `--seed`. Expect to
retry until the headband and props match; verify by flicking between the five at 100%.

Export each transparent, tight-cropped like the other characters — if an edit comes back on
a solid background, cut it out again, since `avatarTones.test.ts` fails a file with almost no
alpha. After dropping files in, run `npm run test:unit` — `tests/unit/avatarTones.test.ts`
fails if the tones stop darkening in order, sit too close together, drift lighter at the deep
end, or lose their alpha. To add or re-point a tone, edit `AVATAR_FILES` in
`src/content/assetManifest.ts`; an unmapped tone (or a file that fails to load) falls back to
the tone-aware SVG.

## backgrounds/  (16:9, opaque)
everbright-meadow.png  forest-of-questions.png  meadow-of-curiosity.png
cave-of-purpose.png    mountain-festival.png

## objects/  (transparent PNG, one per file — cut out from the Midjourney sheets)
flower-crown.png  ball.png  trail-stones.png  signpost.png  bench.png  bell.png
bush.png  dropped-hat.png  flower-patch.png  basket.png  broken-crown.png
petals.png  note.png  gate.png  arch.png  finish-flag.png  scroll.png
