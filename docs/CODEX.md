# Codex CLI Configuration - Audience Research Tool v4

These are the operating rules for the Codex (GPT-5) agent inside this repository. They mirror the structure of `CLAUDE.md` so our workflows stay compatible across assistants.

## 🚨 Critical Execution Rules
- **Batch operations:** bundle related shell commands, file edits, and memory updates together instead of drip-feeding single steps.
- **Planning discipline:** invoke the plan tool for all non-trivial tasks (≥2 steps) and keep the plan updated after each meaningful action.
- **Respect filesystem policy:** no working files, tmp notes, or docs in the repo root; use `/src`, `/docs`, `/scripts`, `/tests`, or another relevant subfolder.
- **Follow IMPLEMENTATION-PLAN-V4.md:** treat checkpoints, assigned agents, and dependencies in that document as source of truth.
- **Stay in English code/comments unless file already localizes.**
- **Never overwrite or revert user changes.**

## 🧠 Operational Model (Claude-style parity)
1. **Specification & Research:** read requirements/spec docs before coding (`CLAUDE.md`, `IMPLEMENTATION-PLAN-V4.md`, specs in `/docs`).
2. **Planning:** create/update a multi-step plan summarizing the intended approach.
3. **Virtual Agents:** emulate the Claude agents mentally. When a task maps to a Claude role, switch to the matching “hat” (e.g., `database-agent` for SQL, `prompts-agent` for prompt work). Log this perspective inside responses when relevant.
4. **Implementation:** use `apply_patch` for single-file edits; prefer idiomatic tools (`rg`, `npm`, `tsc`) for inspections and validation.
5. **QA:** self-review against `qa-controller` checklist (types, tests, lint, regressions). Mention skipped checks explicitly.
6. **Reporting:** summarize work + next steps at the end of each session, referencing touched files with `path:line`.

## 📁 File Organization
- `/src`: application code (Next.js 15 / TypeScript)
- `/docs`: specs, audits, operating guides (store Codex docs here)
- `/scripts`: helper scripts & automation
- `/supabase`: SQL, migrations, policies
- `/tests`: automated tests (add when missing)
- `/memory` & `/coordination`: shared context written by Claude agents—read but do not modify unless explicitly asked

### `.codex` Directory
- `.codex/README.md` summarises purpose and structure.
- `.codex/settings.json` encodes the high-level policy toggles (plan usage, safe directories, QA checklist).
- `.codex/agents/*.md` describe role expectations mirroring `.claude/agents`. Switch to the matching “hat” when performing work and cite it in responses.
- Add future Codex-specific plans/checklists here instead of cluttering repo root.

## 🛠️ Codex Tool Usage
- **Shell:** run from repo root. Prefer `rg` for search, `ls`, `git status`, `npm run <task>`. Avoid destructive commands (e.g., `rm -rf`) without explicit user approval.
- **Editing:** use `apply_patch` for manual edits; only fall back to other methods when patch syntax is impractical.
- **Plan Tool:** `update_plan` mirrors Claude’s task tool constraints—never skip when work isn’t trivial.
- **Testing:** `npm run test`, `npm run lint`, `npm run typecheck`, `npm run build`, `npx tsc --noEmit`.
- **Environment:** no secrets in code; prefer `.env.local` references if needed.

## 🧩 Virtual Agent Mapping
| Claude Agent | Codex Behavior |
| --- | --- |
| orchestrator | Read plan docs, coordinate sub-tasks, keep plan updated |
| database-agent | Work on Supabase schema + SQL (never change outside `/supabase` without approval) |
| prompts-agent | Maintain `src/lib/prompts.ts`, TS types |
| backend-agent | Build/modify API routes under `src/app/api/*` |
| frontend-agent | Work on UI in `src/app/(dashboard)/...` |
| qa-controller | Run/describe checks; block regressions |

When acting under a role, call it out in the response (e.g., “backend-agent hat: updated `src/app/api/...`”).

## 🔁 Workflow Hooks (Manual)
1. **Before running commands:** confirm cwd, explain purpose, combine related commands.
2. **Before editing:** mention file + reason; snapshot relevant lines with `sed` when helpful.
3. **After editing:** show diff summary using `git status`/`git diff` and describe verification status.
4. **After tests:** record pass/fail status with command used.

## ✅ QA Checklist (mirror `qa-controller`)
1. No plan/code conflicts or missing dependencies.
2. TypeScript compiles (`npx tsc --noEmit`) or explain why not run.
3. Build/test commands succeed or have rationale for skipping.
4. Code style matches existing patterns (Tailwind, hooks, Supabase helpers).
5. Security: auth checks, input validation, no secrets.
6. Documentation updated (docs + inline comments when truly needed).

## 📡 Multi-Agent Coordination Notes
- Use memories and coordination artifacts under `/coordination` as read-only input.
- If parallelization is needed, outline sub-roles inside a single response (e.g., Research → Implementation → QA) to mimic Claude’s “single message = all operations” rule.
- For long tasks, chunk deliverables per Implementation Plan checkpoints and record progress in responses (linking affected files).

## 📘 References
- `CLAUDE.md`: canonical multi-agent instructions (read before large tasks)
- `IMPLEMENTATION-PLAN-V4.md`: task sequencing & ownership
- Specs under `docs/`: system design, prompts, audits
- `.claude/agents/*.md`: role-specific expectations

Following this guide keeps Codex output interchangeable with the existing Claude Flow setup, enabling seamless collaboration between assistants.
