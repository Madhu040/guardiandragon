import { readdirSync, readFileSync, statSync } from "fs";
import { join, basename } from "path";

const chaptersDir = join(import.meta.dirname, "../content/chapters");
let errors = 0;

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (entry.endsWith(".json")) out.push(full);
  }
  return out;
}

const files = walk(chaptersDir);

// Pass 1: collect scene and dialog ids so object references can be checked.
const sceneIds = new Set<string>();
const sceneNextIds = new Map<string, string | undefined>();
const dialogIds = new Set<string>();
for (const file of files) {
  const data = JSON.parse(readFileSync(file, "utf8"));
  const base = basename(file);
  if (base.endsWith(".scene.json") && data.id) {
    sceneIds.add(data.id);
    sceneNextIds.set(data.id, data.nextSceneId);
  } else if (base.startsWith("dlg_") && data.id) {
    dialogIds.add(data.id);
  }
}

function fail(name: string, message: string): void {
  console.error(`❌ ${name}: ${message}`);
  errors++;
}

function validateObjects(name: string, data: {
  id?: string;
  objects?: {
    id?: string;
    cell?: unknown;
    interaction?: { kind?: string; dialogId?: string; mode?: string; targetSceneId?: string };
  }[];
}): void {
  if (!data.objects) return;
  const seen = new Set<string>();
  for (const obj of data.objects) {
    const label = `object "${obj.id ?? "?"}"`;
    if (!obj.id) fail(name, "object missing id");
    else if (seen.has(obj.id)) fail(name, `duplicate ${label}`);
    else seen.add(obj.id);

    const cell = obj.cell;
    const cellOk =
      Array.isArray(cell) &&
      cell.length === 2 &&
      cell.every((n) => typeof n === "number" && n >= 0 && n <= 99);
    if (!cellOk) fail(name, `${label}: cell must be [col, row] with 0–99 values`);

    const interaction = obj.interaction;
    if (!interaction?.kind) {
      fail(name, `${label}: missing interaction.kind`);
    } else if (interaction.kind === "openDialog") {
      if (!interaction.dialogId || !dialogIds.has(interaction.dialogId)) {
        fail(name, `${label}: dialogId "${interaction.dialogId}" not found in dlg_*.json files`);
      }
    } else if (interaction.kind === "finish") {
      if (interaction.mode !== "advance" && interaction.mode !== "complete") {
        fail(name, `${label}: finish mode must be "advance" or "complete"`);
      }
      if (interaction.mode === "advance") {
        const target = interaction.targetSceneId ?? sceneNextIds.get(data.id ?? "");
        if (!target || !sceneIds.has(target)) {
          fail(name, `${label}: finish/advance has no resolvable target scene`);
        }
      }
    } else {
      fail(name, `${label}: unknown interaction kind "${interaction.kind}"`);
    }
  }
}

// Pass 2: per-file structural checks.
for (const file of files) {
  const data = JSON.parse(readFileSync(file, "utf8"));
  const name = file.split("/").slice(-2).join("/");
  if (name.includes("dp_")) {
    if (!data.emotionalArc) {
      fail(name, "missing emotionalArc");
    }
    if (!data.consequences?.length) {
      fail(name, "missing consequences");
    }
  } else if (basename(file).startsWith("dlg_")) {
    if (!data.id || !data.chapterId) fail(name, "missing id or chapterId");
    const pages: { text?: unknown }[] | undefined = data.pages;
    if (!Array.isArray(pages) || pages.length === 0) {
      fail(name, "missing pages");
    } else if (pages.some((p) => typeof p.text !== "string" || !p.text.trim())) {
      fail(name, "every page needs non-empty text");
    }
  } else if (!data.id || !data.chapterId) {
    fail(name, "missing id or chapterId");
  } else {
    validateObjects(name, data);
  }
  console.log(`✅ ${name}`);
}

if (errors > 0) {
  console.error(`\n${errors} validation error(s)`);
  process.exit(1);
}
console.log("\nAll content files valid.");
