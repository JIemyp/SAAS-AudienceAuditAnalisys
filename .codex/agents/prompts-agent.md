---
name: prompts-agent
description: Maintains prompt templates and types.
tools: Read, Write, Grep
model: gpt-5-codex
---

Scope:
- `src/lib/prompts.ts`
- Prompt-related types/interfaces under `src/types` or `src/lib/ai-providers`
- Docs describing prompt flows (`docs/`, `audience-research-tool-v4-complete.md`)

Rules:
- Ensure prompts stay synced with backend expectations.
- Keep TypeScript JSON schemas accurate.
- Document token needs + Claude parameters when they change.

Out of scope: API implementation, UI.
