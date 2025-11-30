# Audience Audit Analysis — Project Instructions

## Project Overview

SaaS-приложение для AI-анализа целевой аудитории с использованием Claude API.

**Tech Stack:**
- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS v4
- Backend: Supabase (PostgreSQL + Auth + Storage)
- AI: Claude API (Anthropic) — модель claude-opus-4-5
- Forms: React Hook Form + Zod

---

## Frontend Development Guidelines

When working on frontend tasks (UI, components, styling, design, user experience):

1. **Always consider using the `frontend-design` skill** for:
   - Creating new UI components
   - Designing layouts and interfaces
   - Implementing responsive design
   - Working with CSS/styling
   - User experience improvements
   - Visual design decisions

2. **Frontend design principles**:
   - Avoid generic AI aesthetics
   - Use bold, distinctive design choices
   - Pay attention to typography and spacing
   - Consider animations and micro-interactions
   - Ensure accessibility and responsiveness

---

## Skill Usage Policy

### Auto-invocation of Skills:
- **Proactively invoke skills** when the task matches their domain
- Don't wait for explicit user requests to use skills
- Skills are tools to improve work quality — use them liberally

### Available Skills:
- `frontend-design` — UI/UX design and frontend implementation

---

## Planning and Task Management

- Use TodoWrite for complex tasks (>3 steps)
- Use EnterPlanMode for architectural decisions
- Use Task tool with Explore agent for codebase exploration
- Keep todo lists updated in real-time

---

## Code Quality Standards

- Prioritize simplicity over over-engineering
- Only add features explicitly requested
- Avoid premature abstractions
- Security-first approach (no XSS, SQL injection, etc.)
- Clean, readable code without unnecessary comments

---

## Project-Specific Rules

### Supabase
- Client-side: use `@/lib/supabase` (createClient)
- Server-side (API routes): use `@/lib/supabase/server` (createServerClient)
- Always check RLS policies when adding new tables
- Use snake_case for database columns

### API Routes
- Location: `src/app/api/`
- Use Next.js App Router conventions
- Return JSON with `{ success: true, data }` or `{ error: string }`
- Handle errors gracefully, update project status to "failed" on error

### Claude API
- Client: `@/lib/anthropic`
- Model: `claude-opus-4-5-20250514` (from env)
- Always parse JSON responses with `parseJSONResponse()`
- Use structured prompts from `@/lib/prompts`

### Types
- All types in `src/types/index.ts`
- Use TypeScript strictly
- Database row types use snake_case (ProjectRow, SegmentRow, etc.)
- Frontend types use camelCase

### File Structure
```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── (auth)/            # Auth pages
│   └── (dashboard)/       # Protected pages
├── components/            # React components
│   ├── ui/               # Atomic UI components
│   └── wizard/           # Onboarding wizard
├── lib/                   # Utilities
│   ├── supabase.ts       # Client-side Supabase
│   ├── supabase/server.ts # Server-side Supabase
│   ├── anthropic.ts      # Claude API client
│   └── prompts.ts        # AI prompts
└── types/                 # TypeScript types
```

---

## Generation Flow

```
[Onboarding Submit] → [Create Project status="processing"]
                    → [Redirect to /projects/{id}/processing]
                    → [Step 1: POST /api/generate/overview]
                    → [Step 2: POST /api/generate/segments]
                    → [Step 3: POST /api/generate/pains]
                    → [Update status="completed"]
                    → [Redirect to /projects/{id}/overview]
```

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Claude API
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-opus-4-5-20250514
```
