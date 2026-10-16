# Plan: migrate ADHD task app from Vite + React to Next.js (App Router) + Tailwind

Context: React 19 + Vite app with Tailwind v3, Supabase (tasks table), Vitest + Testing Library tests.
Two modes: ParentScreen (manage tasks/subtasks) and ChildScreen (focus on one active task).
Goal: a clean portfolio project. Work on branch `nextjs`. Commit after each phase.
After each phase, run `npm run lint`, `npm test`, `npm run build`. Stop and show me the results before the next phase.

## Phase 0 — Cleanup (on main, before migrating)
- Add `.env` and `.env*.local` to .gitignore and run `git rm --cached .env`. Add `.env.example` with empty keys.
- Delete duplicate configs (`tailwind.config.cjs`, `postcss.config.cjs`) and the unused `db.json`, json-server, cors, and the `server` script.
- Remove `console.log(activeTask)` from App.jsx.
- Replace the hardcoded child name "Daniil" and date with a demo name and today's date.

## Phase 1 — Scaffold Next.js
- `git checkout -b nextjs`
- Convert in place: install next, remove vite / @vitejs/plugin-react from runtime deps (keep plugin-react for Vitest), and add scripts dev/build/start/lint/test.
- Create `src/app/layout.jsx` (html/body, metadata title + description) and `src/app/globals.css`.
- Upgrade Tailwind to v4 (`@tailwindcss/postcss`, `@import "tailwindcss"`) and move theme.css tokens into `@theme`.
- Remove index.html, main.jsx, and vite.config.js.

## Phase 2 — Move the app
- Copy components/, screens/, context/, and lib/ as-is. Add `"use client"` to files that use hooks, context, or events.
- `src/app/page.jsx` renders the current App (client component) so the app works exactly as before.
- Env: `import.meta.env.VITE_SUPABASE_*` becomes `process.env.NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_KEY`. Update .env.example.
- Replace <img>/<a> with next/image / next/link where it makes sense.
- Check: same behavior as the Vite version (add/edit/delete task, subtasks, mark done, child/parent switch via keyboard).

## Phase 3 — Fix tests
- Add `vitest.config.mjs` (jsdom, setup file `src/test/setup.js`, @vitejs/plugin-react, `@` alias).
- Make all existing tests pass. Do not delete tests to make them pass.

## Phase 4 — Use real Next.js features
- Routes: `/parent` and `/child` instead of the `mode` state. Keep the keyboard shortcut, but make it navigate with router.push.
- Move task data into a TasksProvider (client context) so both routes share it. Remove prop drilling from App.jsx.
- Add loading.jsx and error.jsx for each route. Replace `if (loading) return null` with a real loading state.
- Show errors to the user (not only console.error) for update and markDone too.

## Phase 5 — Tailwind cleanup
- Remove BEM classes (task-form__*) and App.css/index.css leftovers. Use Tailwind only.
- Fix the typo `text-gray-00`.
- Mobile-first layout, visible focus states, good color contrast, and big tap targets (the users are kids).

## Phase 6 — Portfolio polish
- Rewrite README.md: what the app is (task helper for kids with ADHD, parent + child modes), screenshots, live link placeholder, tech stack, how to run locally, how to run tests, Supabase table schema.
- Add a GitHub Actions workflow: lint + test + build on push.
- Optional: convert to TypeScript (`.tsx`) as a separate final commit.

Rules: small commits with clear messages, and don't change app behavior unless the phase says so. Ask me before deleting anything not listed above.