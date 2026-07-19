/** Full-body 8-bit pixel-art characters (SVG) — TruNorth retro sprite style */

export type CharacterId =
  | "avatar"
  | "companion_dragon"
  | "companion_fox"
  | "companion_sprite"
  | "robin"
  | "leftout"
  | "hothead"
  | "grownup"
  | "worry_cloud"
  | "helper_bear"
  | "helper_fox"
  | "helper_rabbit"
  | "helper_deer"
  | "wize";

export type ExpressionKey = "neutral" | "worried" | "happy" | "glow" | "sad" | "calm";

const SKIN: Record<string, string> = {
  tone_1: "#f5d0b0",
  tone_2: "#e0ac69",
  tone_3: "#8d5524",
  tone_4: "#6b3f1f",
  tone_5: "#4a2c14",
};

const PURPLE = "#7b2cbf";
const PURPLE_DARK = "#5a189a";
const GOLD = "#ffd60a";
const FLICKER_RED = "#c1121f";
const FLICKER_DARK = "#780000";
const FLICKER_BELLY = "#ffba08";
const WIZE_BROWN = "#6b4226";
const WIZE_CREAM = "#f5e6d3";
const WIZE_GOLD = "#d4a373";
const INK = "#2d2d2d";

function expressionOffset(expr?: string): string {
  if (expr?.includes("worried") || expr?.includes("sad")) return "worried";
  if (expr?.includes("glow") || expr?.includes("excited") || expr?.includes("relieved") || expr?.includes("happy")) return "happy";
  if (expr?.includes("calm")) return "calm";
  return "neutral";
}

export function renderFullBodyCharacter(opts: {
  id: string;
  assetRef?: string;
  expression?: string;
  skinTone?: string;
  companionArchetype?: string;
  size?: number;
}): string {
  const expr = expressionOffset(opts.expression);
  const size = opts.size ?? 140;
  const key = resolveCharacterKey(opts.id, opts.assetRef, opts.companionArchetype);

  switch (key) {
    case "companion_dragon":
      return dragonSvg(expr, size);
    case "wize":
      return wizeSvg(expr, size);
    case "companion_fox":
      return foxSvg(expr, size);
    case "companion_sprite":
      return spriteSvg(expr, size);
    case "helper_bear":
      return bearSvg(expr, size);
    case "helper_fox":
      return helperFoxSvg(expr, size);
    case "helper_rabbit":
      return rabbitSvg(expr, size);
    case "helper_deer":
      return deerSvg(expr, size);
    case "robin":
      return robinSvg(expr, size);
    case "leftout":
      return rabbitSvg(expr, size);
    case "hothead":
      return bearSvg(expr, size);
    case "grownup":
      return grownupSvg(expr, size);
    case "worry_cloud":
      return cloudSvg(expr, size);
    case "avatar":
    default:
      return avatarSvg(expr, size, SKIN[opts.skinTone ?? "tone_3"] ?? SKIN.tone_3);
  }
}

function resolveCharacterKey(id: string, assetRef?: string, archetype?: string): CharacterId {
  if (id === "worry_cloud" || assetRef?.includes("worry")) return "worry_cloud";
  if (id === "wize" || assetRef?.includes("wize")) return "wize";
  if (id === "flicker" || assetRef?.includes("flicker")) return "companion_dragon";
  if (id === "companion" || assetRef?.includes("companion")) {
    if (archetype === "companion_dragon") return "companion_dragon";
    return archetype === "companion_sprite" ? "companion_sprite" : "companion_fox";
  }
  if (id === "helper_bear" || assetRef?.includes("bear")) return "helper_bear";
  if (id === "helper_fox" || assetRef?.includes("helper_fox")) return "helper_fox";
  if (id === "helper_rabbit" || assetRef?.includes("rabbit")) return "helper_rabbit";
  if (id === "helper_deer" || assetRef?.includes("deer")) return "helper_deer";
  if (id === "robin" || assetRef?.includes("robin")) return "robin";
  if (id === "leftout" || assetRef?.includes("leftout")) return "helper_rabbit";
  if (id === "hothead" || assetRef?.includes("hothead")) return "helper_bear";
  if (id === "grownup" || assetRef?.includes("grownup")) return "grownup";
  if (id === "avatar" || assetRef?.includes("avatar")) return "avatar";
  return "avatar";
}

// --- pixel-grid helpers -----------------------------------------------------

const EMPTY_ROW = "....................";

function pad(n: number): string[] {
  return Array.from({ length: n }, () => EMPTY_ROW);
}

/** Convert an ASCII pixel map into merged-run <rect> pixels. */
function gridRects(rows: string[], palette: Record<string, string>): string {
  let out = "";
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const c = row[x];
      let run = 1;
      while (x + run < row.length && row[x + run] === c) run += 1;
      const fill = palette[c];
      if (c !== "." && fill) {
        out += `<rect x="${x}" y="${y}" width="${run}" height="1" fill="${fill}"/>`;
      }
      x += run;
    }
  });
  return out;
}

function sprite(rows: string[], palette: Record<string, string>, size: number, extra = "", before = ""): string {
  const h = rows.length;
  const w = rows[0].length;
  const height = (size * h) / w;
  return `<svg viewBox="0 0 ${w} ${h}" width="${size}" height="${height}" shape-rendering="crispEdges" aria-hidden="true">${before}${gridRects(rows, palette)}${extra}</svg>`;
}

function rect(x: number, y: number, w: number, fill: string, opacity?: number): string {
  return `<rect x="${x}" y="${y}" width="${w}" height="1" fill="${fill}"${opacity !== undefined ? ` opacity="${opacity}"` : ""}/>`;
}

/** 2×2 pixel eyes with a sparkle, brows when worried, and a per-mood pixel mouth. */
function pixelFace(expr: string, cx: number, eyeY: number, mouthY: number, opts: { brows?: boolean } = {}): string {
  let out =
    rect(cx - 4, eyeY, 2, INK) +
    rect(cx - 4, eyeY + 1, 2, INK) +
    rect(cx + 2, eyeY, 2, INK) +
    rect(cx + 2, eyeY + 1, 2, INK) +
    rect(cx - 3, eyeY, 1, "#ffffff", 0.85) +
    rect(cx + 3, eyeY, 1, "#ffffff", 0.85);
  if (expr === "worried" && opts.brows !== false) {
    out += rect(cx - 5, eyeY - 3, 1, INK) + rect(cx - 4, eyeY - 2, 2, INK);
    out += rect(cx + 4, eyeY - 3, 1, INK) + rect(cx + 2, eyeY - 2, 2, INK);
  }
  if (expr === "happy") {
    out += rect(cx - 3, mouthY, 1, INK) + rect(cx - 2, mouthY + 1, 4, INK) + rect(cx + 2, mouthY, 1, INK);
  } else if (expr === "worried") {
    out += rect(cx - 3, mouthY + 1, 1, INK) + rect(cx - 2, mouthY, 4, INK) + rect(cx + 2, mouthY + 1, 1, INK);
  } else if (expr === "calm") {
    out += rect(cx - 2, mouthY, 1, INK) + rect(cx - 1, mouthY + 1, 2, INK) + rect(cx + 1, mouthY, 1, INK);
  } else {
    out += rect(cx - 2, mouthY, 4, INK);
  }
  return out;
}

/** Classic plus-shaped sparkle stars for happy moments. */
function pixelSparkles(points: Array<[number, number]>, fill = GOLD): string {
  let out = "";
  for (const [x, y] of points) {
    out += rect(x, y, 1, fill) + rect(x - 1, y, 1, fill, 0.7) + rect(x + 1, y, 1, fill, 0.7);
    out += `<rect x="${x}" y="${y - 1}" width="1" height="1" fill="${fill}" opacity="0.7"/>`;
    out += `<rect x="${x}" y="${y + 1}" width="1" height="1" fill="${fill}" opacity="0.7"/>`;
  }
  return out;
}

// --- cast -------------------------------------------------------------------

/** Protagonist — purple hoodie, star backpack, curly puff hair */
function avatarSvg(expr: string, size: number, skin: string): string {
  const P: Record<string, string> = { H: INK, P: PURPLE, D: PURPLE_DARK, S: skin, G: GOLD, B: "#3d5a80" };
  const rows = [
    "......HHHHHHHH......",
    ".....HHHHHHHHHH.....",
    "....HHHHHHHHHHHH....",
    "...HHHHHHHHHHHHHH...",
    "...HHHHHHHHHHHHHH...",
    "...HPPPPPPPPPPPPH...",
    "...HSSSSSSSSSSSSH...",
    "....SSSSSSSSSSSS....",
    "....SSSSSSSSSSSS....",
    "....SSSSSSSSSSSS....",
    "....SSSSSSSSSSSS....",
    "....SSSSSSSSSSSS....",
    ".....SSSSSSSSSS.....",
    ".......SSSSSS.......",
    ".....PPPPPPPPPP.....",
    "....PPPPPPPPPPPPDD..",
    "..SSPPPPPPPPPPPPDDD.",
    "..SSPPPPPPPPPPPPDDD.",
    "..SSPPDDDDDDDDPPDGD.",
    "..SSPPDDDDDDDDPPDGD.",
    "..SSPPPPPPPPPPPPDDD.",
    "..SSPPPPPPPPPPPPDDD.",
    "....PPPPPPPPPPPPDD..",
    ".....PPPPPPPPPP.....",
    ".....BBB....BBB.....",
    ".....BBB....BBB.....",
    ".....BBB....BBB.....",
    ".....BBB....BBB.....",
    ".....BBB....BBB.....",
    ".....BBB....BBB.....",
    "....DDDD....DDDD....",
    "....DDDD....DDDD....",
  ];
  const sparkles = expr === "happy" ? pixelSparkles([[1, 3], [18, 5], [2, 11]]) : "";
  return sprite(rows, P, size, pixelFace(expr, 10, 9, 12) + sparkles);
}

/** Flicker — little red Guardian Dragon with gold belly and sparks */
function dragonSvg(expr: string, size: number): string {
  const P: Record<string, string> = { R: FLICKER_RED, K: FLICKER_DARK, Y: FLICKER_BELLY };
  const rows = [
    ...pad(8),
    "...KK..........KK...",
    "....KKK......KKK....",
    ".....KKK....KKK.....",
    ".....RRRRRRRRRR.....",
    "....RRRRRRRRRRRR....",
    "....RRRRRRRRRRRR....",
    "....RRRRRRRRRRRR....",
    "....RRRRRRRRRRRR....",
    "....RRRYYYYYYRRR....",
    "....RRRYYYYYYRRR....",
    ".....RRRRRRRRRR.....",
    "......RRRRRRRR......",
    ".....RRRRRRRRRR.....",
    ".....RRYYYYYYRR.....",
    ".....RRYYYYYYRR.....",
    ".....RRYYYYYYRR.....",
    ".....RRYYYYYYRR.....",
    ".....RRYYYYYYRR.....",
    ".....RRYYYYYYRR.....",
    ".....RRRYYYYRRR.....",
    ".....RRRRRRRRRR.....",
    "......RRRRRRRR......",
    "......KKK..KKK......",
    "......KKK..KKK......",
  ];
  const sparks =
    expr === "worried"
      ? rect(2, 14, 1, GOLD) + rect(17, 12, 1, GOLD) + rect(1, 20, 1, GOLD) + rect(18, 18, 1, GOLD)
      : "";
  const sparkles = expr === "happy" ? pixelSparkles([[2, 5], [17, 3], [1, 13], [18, 11]]) : "";
  return sprite(rows, P, size, pixelFace(expr, 10, 13, 17, { brows: false }) + sparks + sparkles);
}

/** Wize — gentle mentor owl who glides down from the oak */
function wizeSvg(expr: string, size: number): string {
  const P: Record<string, string> = { W: WIZE_BROWN, C: WIZE_CREAM, G: WIZE_GOLD, K: INK, O: "#e09f3e" };
  const rows = [
    ...pad(11),
    "....WW........WW....",
    "....WWW......WWW....",
    "....WWWWWWWWWWWW....",
    "...WWWWWWWWWWWWWW...",
    "...WGGGGGWWGGGGGW...",
    "...WCCCCCWWCCCCCW...",
    "...WCCKCCWWCCKCCW...",
    "...WCCKCCWWCCKCCW...",
    "...WCCCCCWWCCCCCW...",
    "...WWWWWWOOWWWWWW...",
    "....WWWWWWWWWWWW....",
    "...WWWWWWWWWWWWWW...",
    "..GWWWCCCCCCCCWWWG..",
    "..GGWWCCCCCCCCWWGG..",
    "..GGWWCCCCCCCCWWGG..",
    "..GGWWCCCCCCCCWWGG..",
    "..GWWWCCCCCCCCWWWG..",
    "...WWWWCCCCCCWWWW...",
    "....WWWWWWWWWWWW....",
    "......OO....OO......",
    "......OO....OO......",
  ];
  const smile =
    expr === "happy" || expr === "calm"
      ? rect(7, 21, 1, INK) + rect(8, 22, 4, INK) + rect(12, 21, 1, INK)
      : "";
  return sprite(rows, P, size, smile);
}

function bearSvg(expr: string, size: number): string {
  const P: Record<string, string> = { M: "#8b5e3c", L: "#c49a6c", K: "#5c4033", N: "#6b4423", D: "#5c4033" };
  const rows = [
    ...pad(10),
    "...MMM........MMM...",
    "...MMM........MMM...",
    "....MMMMMMMMMMMM....",
    "...MMMMMMMMMMMMMM...",
    "...MMMMMMMMMMMMMM...",
    "...MMMMMMMMMMMMMM...",
    "...MMMMLLLLLLMMMM...",
    "...MMMMLLKKLLMMMM...",
    "...MMMMLLLLLLMMMM...",
    "....MMMMMMMMMMMM....",
    "...MMMMMMMMMMMMMM...",
    "..MMMMLLLLLLLLMMMM..",
    "..MMMMLLLLLLLLMMMM..",
    "..MMMMLLLLLLLLMMMM..",
    "..MMMMLLLLLLLLMMMM..",
    "..MMMMLLLLLLLLMMMM..",
    "..MMMMLLLLLLLLMMMM..",
    "..MMMMLLLLLLLLMMMM..",
    "...MMMMMMMMMMMMMM...",
    "....NNNN....NNNN....",
    "....NNNN....NNNN....",
    "...DDDDD....DDDDD...",
  ];
  return sprite(rows, P, size, pixelFace(expr, 10, 14, 18));
}

function helperFoxSvg(expr: string, size: number): string {
  const P: Record<string, string> = { F: "#e76f51", C: "#faf8f5", G: "#2d6a4f", D: "#c45c26" };
  const rows = [
    ...pad(11),
    "....F..........F....",
    "....FF........FF....",
    "....FFF......FFF....",
    "....FFFF....FFFF....",
    "....FFFFFFFFFFFF....",
    "...FFFFFFFFFFFFFF...",
    "...FFFFFFFFFFFFFF...",
    "...FFFFFFFFFFFFFF...",
    "...FFFFCCCCCCFFFF...",
    "...FFFFCCCCCCFFFF...",
    "....FFFFFFFFFFFF....",
    ".....GGGGGGGGGG.....",
    "....GGGGGGGGGGGG.FF.",
    "...FFGGGGGGGGGGFFFF.",
    "...FFGGGGGGGGGGFFFF.",
    "...FFGGGGGGGGGGFFCC.",
    "....GGGGGGGGGGGG....",
    ".....GGGGGGGGGG.....",
    ".....DDD....DDD.....",
    ".....DDD....DDD.....",
    "....DDDD....DDDD....",
  ];
  return sprite(rows, P, size, pixelFace(expr, 10, 16, 19));
}

function rabbitSvg(expr: string, size: number): string {
  const P: Record<string, string> = { E: "#dee2e6", P: "#f4a6c8", D: "#6c757d" };
  const rows = [
    ...pad(11),
    "......EE....EE......",
    "......EE....EE......",
    "......EP....PE......",
    "......EP....PE......",
    "......EP....PE......",
    "......EE....EE......",
    ".....EEEEEEEEEE.....",
    "....EEEEEEEEEEEE....",
    "....EEEEEEEEEEEE....",
    "....EEEEEEEEEEEE....",
    "....EEEEEEEEEEEE....",
    ".....EEEEEEEEEE.....",
    ".....PPPPPPPPPP.....",
    "....PPPPPPPPPPPP....",
    "...EEPPPPPPPPPPEE...",
    "...EEPPPPPPPPPPEE...",
    "....PPPPPPPPPPPP....",
    ".....PPPPPPPPPP.....",
    ".....DDD....DDD.....",
    ".....DDD....DDD.....",
    "....EEEE....EEEE....",
  ];
  return sprite(rows, P, size, pixelFace(expr, 10, 19, 22));
}

function deerSvg(expr: string, size: number): string {
  const P: Record<string, string> = { T: "#c9a66b", A: "#8b6914", C: "#f5e6d3", D: "#a68a64" };
  const rows = [
    ...pad(9),
    "....A..A....A..A....",
    "....A..A....A..A....",
    ".....AAA....AAA.....",
    "......A......A......",
    "......A......A......",
    ".....TTTTTTTTTT.....",
    "....TTTTTTTTTTTT....",
    "....TTTTTTTTTTTT....",
    "....TTTTTTTTTTTT....",
    "....TTTCCCCCCTTT....",
    "....TTTCCCCCCTTT....",
    ".....TTTTTTTTTT.....",
    ".....TTTTTTTTTT.....",
    "....TTTTTTTTTTTT....",
    "....TTCCCCCCCCTT....",
    "....TTCCCCCCCCTT....",
    "....TTCCCCCCCCTT....",
    "....TTCCCCCCCCTT....",
    "....TTTTTTTTTTTT....",
    ".....DD......DD.....",
    ".....DD......DD.....",
    ".....DD......DD.....",
    "....DDD......DDD....",
  ];
  return sprite(rows, P, size, pixelFace(expr, 10, 16, 19));
}

function foxSvg(expr: string, size: number): string {
  return helperFoxSvg(expr, size);
}

function spriteSvg(expr: string, size: number): string {
  return dragonSvg(expr, size);
}

function robinSvg(expr: string, size: number): string {
  return helperFoxSvg(expr, size);
}

function grownupSvg(expr: string, size: number): string {
  const P: Record<string, string> = { H: "#5c3317", S: "#c68642", T: "#2a9d8f", N: "#264653", K: "#1a1a2e" };
  const rows = [
    ...pad(6),
    ".....HHHHHHHHHH.....",
    "....HHHHHHHHHHHH....",
    "...HHHHHHHHHHHHHH...",
    "...HHSSSSSSSSSSHH...",
    "...HSSSSSSSSSSSSH...",
    "...HSSSSSSSSSSSSH...",
    "....SSSSSSSSSSSS....",
    "....SSSSSSSSSSSS....",
    "....SSSSSSSSSSSS....",
    ".....SSSSSSSSSS.....",
    ".......SSSSSS.......",
    ".....TTTTTTTTTT.....",
    "...TTTTTTTTTTTTTT...",
    "..SSTTTTTTTTTTTTSS..",
    "..SSTTTTTTTTTTTTSS..",
    "..SSTTTTTTTTTTTTSS..",
    "..SSTTTTTTTTTTTTSS..",
    "...TTTTTTTTTTTTTT...",
    "...TTTTTTTTTTTTTT...",
    "....TTTTTTTTTTTT....",
    ".....NNN....NNN.....",
    ".....NNN....NNN.....",
    ".....NNN....NNN.....",
    ".....NNN....NNN.....",
    ".....NNN....NNN.....",
    ".....NNN....NNN.....",
    "....KKKK....KKKK....",
    "....KKKK....KKKK....",
  ];
  return sprite(rows, P, size, pixelFace(expr, 10, 11, 14));
}

function cloudSvg(expr: string, size: number): string {
  const P: Record<string, string> = { A: "#9d4edd", B: "#c77dff" };
  const rows = [
    "........................",
    "........................",
    "..........BBBB..........",
    "......BBBBBBBBBB........",
    "....AABBBBBBBBBBBB......",
    "..AAAABBBBBBBBBBBBBB....",
    "..AAAABBBBBBBBBBBBBBAA..",
    "AAAAAABBBBBBBBBBBBAAAAAA",
    "AAAAAAAABBBBBBBBAAAAAAAA",
    "AAAAAAAAAAAAAAAAAAAAAAAA",
    ".AAAAAAAAAAAAAAAAAAAAAA.",
    "..AAAAAAAAAAAAAAAAAAAA..",
    "...AAAAAA....AAAAAA.....",
  ];
  const opacity = expr === "happy" ? 0.35 : 0.85;
  const h = rows.length;
  const w = rows[0].length;
  return `<svg viewBox="0 0 ${w} ${h}" width="${size}" height="${(size * h) / w}" shape-rendering="crispEdges" aria-hidden="true"><g opacity="${opacity}">${gridRects(rows, P)}</g></svg>`;
}
