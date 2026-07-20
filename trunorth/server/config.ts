/**
 * Server-side runtime config.
 * All values come from environment variables (see `.env.example`).
 * Do not put secrets in source — only defaults for local development.
 */

import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

/** Load `.env` into process.env when keys are not already set (no extra dependency). */
function loadEnvFile(fileName = ".env"): void {
  const path = resolve(process.cwd(), fileName);
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnvFile();

function envString(key: string, fallback: string): string {
  const value = process.env[key];
  return value === undefined || value === "" ? fallback : value;
}

function envNumber(key: string, fallback: number): number {
  const raw = process.env[key];
  if (raw === undefined || raw === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function envList(key: string, fallback: string[]): string[] {
  const raw = process.env[key];
  if (!raw?.trim()) return fallback;
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

export const serverConfig = {
  port: envNumber("PORT", 3001),
  host: envString("HOST", "0.0.0.0"),
  jwtSecret: envString("JWT_SECRET", "change-me-to-a-long-random-string-in-production"),
  databasePath: envString("DATABASE_PATH", "./data/trunorth.db"),
  corsOrigins: envList("CORS_ORIGINS", [
    "http://localhost:5173",
    "http://localhost:4173",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:4173",
  ]),
  companion: {
    apiKey: envString("ANTHROPIC_API_KEY", ""),
    // Pinned dated model ID (Consolidated tech spec v3.0 / Appendix F): a floating
    // `-latest` alias can change under us, which would invalidate the red-team
    // safety baseline. Re-pin deliberately when upgrading; see ADR-004.
    model: envString("COMPANION_MODEL", "claude-haiku-4-5-20251001"),
    confidenceFloor: envNumber("CONFIDENCE_FLOOR", 0.55),
    timeoutMs: envNumber("COMPANION_TIMEOUT_MS", 8000),
  },
} as const;

export type ServerConfig = typeof serverConfig;
