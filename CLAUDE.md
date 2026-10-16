# ADHD Task Helper

Task helper for kids 8–12 with ADHD. Parent (or child) creates tasks with steps;
Child screen shows one step at a time with a hint, progress and a "Great job" screen.
Portfolio project: code quality, tests and README matter.

## Stack
- Now: React 19 + Vite, Tailwind v3, Supabase (`tasks` table), Vitest + Testing Library
- Migrating to: Next.js (App Router) + Tailwind v4, deployed on Vercel
- AI (planned): Vercel AI SDK + Gemini Flash, server-side route handler only

## Commands
- `npm run dev` · `npm test` · `npm run lint` · `npm run build`
- Run lint, test and build before saying a task is done.

## Data
- tasks: { id, text, hint, done, subtasks: [{ title, hint, done, minutes?, emoji? }], created_at }
- Known bug: AddTask saves `subtask_hint`, ChildScreen reads `hint`. Use `hint` everywhere.

## Env
- Supabase: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_KEY (publishable key, public by design)
- AI: GOOGLE_GENERATIVE_AI_API_KEY (server-side only, never NEXT_PUBLIC_)
- Never commit .env. Keep .env.example up to date.

## Rules
- Work on a branch per phase or feature; small commits with clear messages.
- Don't change app behavior unless the task says so.
- Ask before deleting files or rewriting git history.
- Tailwind only (no BEM, no new CSS files).
- Don't delete or weaken tests to make them pass.
- UI for kids: big tap targets, visible focus, good contrast, not babyish.

## Status
- Phase 0 cleanup: done (main)
- Next: Phases 1–3 of the Next.js migration on branch `nextjs`
- Then: AI step breakdown (single API call, not an agent), Supabase Auth + RLS, later a homework-planner agent