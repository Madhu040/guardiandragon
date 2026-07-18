# CLAUDE.md — DallasAITeam15 / TruNorth

Instructions for Claude Code and all AI agents working in this repository.
Human developers: the same workflow applies to you.

## Rule 1 — Read `product.md` before doing ANY task

**`product.md` (repo root) is the living implementation ledger** — the single
always-current picture of what actually exists in `trunorth/`. Before writing code,
answering questions about the codebase, planning, or reviewing:

1. **Read `product.md` first.** Do not rely on assumptions, file names, or the spec to
   know what is built — the ledger is the source of truth for "what exists."
2. **Follow its links.** If your task touches a subsystem with a deep-dive in
   `docs/context/` (Section 4 of the ledger), read that context file too before editing
   the sources it documents.
3. **Check the team board (top of `product.md`).** Areas tagged `🔧 <name>` are actively
   being worked on by that teammate — do not restructure those areas without flagging the
   conflict to the user first.

## Rule 2 — Update `product.md` in the same change set

Any change that adds, removes, or alters a file, export, endpoint, or behavior in
`trunorth/` **must update the matching `product.md` entry (and any affected
`docs/context/` file) in the same commit/PR.** An out-of-date ledger is a broken build.

- New subsystem or an entry growing past ~15 lines → create/extend
  `docs/context/<area>-<subject>.md`, keep a one-liner + link in `product.md`,
  and add a row to its Section 4 index.
- Status markers must stay truthful: `⬜ Not implemented` / `🟨 Partial` / `✅ Implemented`.
  Never mark something ✅ that isn't in the repo and working. Never delete an empty (⬜)
  section.
- Update the folder tree (Section 2), the snapshot "Last updated" date, and the
  changelog (Section 6) when relevant.

## Rule 3 — Ledger vs. spec precedence

- **What is built** → `product.md` wins.
- **What is intended** → `docs/README.md` and `docs/specs/` win.
- If you find the ledger disagreeing with the code, **the code wins** — fix the ledger
  and say so in your summary. Never "fix" code to match a stale ledger claim without
  verifying against the actual source.

## Project quick facts

- App root: `trunorth/` (Vite + TypeScript client, Hono + SQLite server). The repo root
  is a docs/coordination wrapper.
- Run locally: `cd trunorth && npm install && npm run dev` (client 5173 + API 3001).
  Offline demo: `npm run demo` → http://localhost:4173/?demo=1
- Before committing: `npm run test:unit` and `npm run validate:content` must pass.
  `npm run typecheck` is currently failing (9 known errors — see `product.md` §3.14);
  don't add new type errors, and update the ledger if you fix them.
- Known-broken tooling (see ledger §3.14): `npm run lint` (phantom `api/` dir),
  `test:e2e` (no tests/e2e), `/sw.js` registration (file absent). Also: `npm run build`
  emits stray `src/**/*.js` that silently shadow the `.ts` sources in vitest/vite —
  delete them if edits seem ignored, never commit them, and don't fix the build path
  (it gets replaced when the proper hosted API/backend lands).

## Summary checklist for every task

- [ ] Read `product.md` (+ linked `docs/context/` files for touched subsystems)
- [ ] Checked 🔧 ownership tags before editing owned areas
- [ ] Code change and ledger/context update land in the same change set
- [ ] Status markers, folder tree, Section 4 index, and changelog still truthful
