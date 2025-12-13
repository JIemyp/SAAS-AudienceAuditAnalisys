# Codex Orchestration Guide

This directory mirrors `.claude` for the Codex (GPT-5) workflow.

## Structure
- `settings.json` – runtime policy (env flags, allowed commands, QA hooks)
- `agents/` – role definitions that align with Claude agents
- `plans/` – optional Codex-specific planning artifacts (create as needed)
- `checklists/` – QA + deployment checklists (future expansion)

## Usage
1. Read `docs/CODEX.md` for global rules.
2. Pick the relevant agent file to understand expectations before editing.
3. Log any Codex-specific notes in `plans/` or `checklists/`.

Keep contents ASCII. Changes here should be coordinated with `CLAUDE.md` so Codex and Claude share a single mental model of the repo.***
