/**
 * Bundle-size budget audit — Consolidated tech spec §19 (Performance budgets).
 *
 *   | Showcase bundle | < 15 MB target (documented exceptions allowed) | CI build-artifact audit |
 *
 * Run after `npm run build`. Exits non-zero when a budget is breached so CI fails.
 *
 * WHY TWO TIERS OF BUDGET. The spec's 15 MB figure is an outer stage-readiness gate: past
 * it, the §13A.5 "scene transition feels instant" claim stops being credible on venue
 * hardware. But `dist/` is currently ~1.5 MB, so a 15 MB ceiling alone would sit green
 * through a 10× regression and tell us nothing. The per-asset-class budgets below are set
 * with deliberate headroom over today's measurements — enough that ordinary feature work
 * does not trip them, tight enough that an accidental heavyweight dependency does.
 *
 * Raising a budget is a legitimate decision; doing it silently is not. Move the number
 * here, in the same change as the growth, with a note saying what grew and why.
 */
import { readdirSync, readFileSync, statSync } from "fs";
import { gzipSync } from "zlib";
import { join, relative } from "path";

const DIST = join(import.meta.dirname, "../dist");

interface Budget {
  label: string;
  /** Spec reference the budget derives from. */
  spec: string;
  limitBytes: number;
  measure: (files: FileInfo[]) => number;
  note?: string;
}

interface FileInfo {
  path: string;
  bytes: number;
  gzipBytes: number;
}

const KB = 1024;
const MB = 1024 * KB;

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function sumBy(files: FileInfo[], pred: (f: FileInfo) => boolean, gzip = false): number {
  return files
    .filter(pred)
    .reduce((total, f) => total + (gzip ? f.gzipBytes : f.bytes), 0);
}

const ext = (f: FileInfo, e: string) => f.path.endsWith(e);

const BUDGETS: Budget[] = [
  {
    label: "Total dist/ (showcase bundle)",
    spec: "§19 'Showcase bundle < 15 MB'",
    limitBytes: 15 * MB,
    measure: (files) => sumBy(files, () => true),
    note: "the spec's own outer gate",
  },
  {
    label: "JavaScript (raw)",
    spec: "§19 build-artifact audit",
    limitBytes: 250 * KB,
    measure: (files) => sumBy(files, (f) => ext(f, ".js")),
  },
  {
    label: "JavaScript (gzip, ~wire cost)",
    spec: "§19 + §13A.5 load-time budget",
    limitBytes: 80 * KB,
    measure: (files) => sumBy(files, (f) => ext(f, ".js"), true),
    note: "what actually governs first paint on venue WiFi",
  },
  {
    label: "CSS (raw)",
    spec: "§19 build-artifact audit",
    limitBytes: 60 * KB,
    measure: (files) => sumBy(files, (f) => ext(f, ".css")),
  },
  {
    label: "Fonts (self-hosted, §13A.1 no CDN)",
    spec: "§13A.1 'all assets preloaded/bundled'",
    limitBytes: 200 * KB,
    measure: (files) => sumBy(files, (f) => ext(f, ".woff2") || ext(f, ".woff") || ext(f, ".ttf")),
  },
];

function fmt(bytes: number): string {
  if (bytes >= MB) return `${(bytes / MB).toFixed(2)} MB`;
  if (bytes >= KB) return `${(bytes / KB).toFixed(1)} kB`;
  return `${bytes} B`;
}

let dist: string[];
try {
  dist = walk(DIST);
} catch {
  console.error("✗ dist/ not found — run `npm run build` before the bundle audit.");
  process.exit(1);
}

const files: FileInfo[] = dist.map((path) => {
  const buf = readFileSync(path);
  return { path: relative(DIST, path), bytes: buf.length, gzipBytes: gzipSync(buf).length };
});

console.log(`Bundle audit — ${files.length} files in dist/ (spec §19)\n`);

let failed = 0;
for (const budget of BUDGETS) {
  const actual = budget.measure(files);
  const pct = Math.round((actual / budget.limitBytes) * 100);
  const ok = actual <= budget.limitBytes;
  if (!ok) failed++;
  console.log(
    `${ok ? "✓" : "✗"} ${budget.label.padEnd(38)} ${fmt(actual).padStart(9)} / ${fmt(
      budget.limitBytes,
    ).padStart(9)}  (${String(pct).padStart(3)}% of budget)  ${budget.spec}`,
  );
  if (!ok) {
    const worst = files
      .filter((f) => budget.measure([f]) > 0)
      .sort((a, b) => b.bytes - a.bytes)
      .slice(0, 5);
    console.log("    largest contributors:");
    for (const f of worst) console.log(`      ${fmt(f.bytes).padStart(9)}  ${f.path}`);
  }
}

const largest = [...files].sort((a, b) => b.bytes - a.bytes).slice(0, 5);
console.log("\nLargest assets:");
for (const f of largest) console.log(`  ${fmt(f.bytes).padStart(9)}  ${f.path}`);

if (failed > 0) {
  console.error(
    `\n✗ ${failed} performance budget(s) breached (spec §19). Either shrink the artifact or ` +
      `raise the budget in scripts/audit-bundle-size.ts with a note explaining what grew.`,
  );
  process.exit(1);
}

console.log("\n✓ All §19 bundle budgets within limits.");
