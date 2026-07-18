# Algo Study

Vietnamese-first algorithm learning platform focused on reasoning, visual traces, retrieval practice, and evidence-based progress.

## Status

Preview release on `main`: production foundation, validated content pipeline, learner surface at `/learn/`, and one **published** arrays/two-pointers vertical slice (lesson + guided/independent problems + retrieval). Pattern `two-pointers` is covered; full mandatory curriculum is still partial/planned. Site deploys to GitHub Pages from `main`.

## Stack

- Astro static output + strict TypeScript
- MDX content integration
- React islands only for interactive controls
- Pagefind post-build search
- Vitest + Playwright + axe

## Quick start

Prerequisites: Node.js 24+ and npm 11+.

```bash
npm install
npx playwright install chromium
npm run dev
```

Learner routes:

- `/learn/` — published tracks, lessons, problems
- `/learn/lessons/<id>/` — published lesson reader
- `/learn/problems/<id>/` — published practice
- `/content-preview/` — internal reviewer routes (`noindex`)

Production verification:

```bash
npm run check
npm run test:e2e
```

### Deploy

GitHub Actions workflow `deploy` builds with `GITHUB_PAGES=true` (base path `/algo-study/`) and publishes `dist/` to GitHub Pages.

1. Repo **Settings → Pages → Build and deployment → Source: GitHub Actions**
2. Merge to `main` (or run workflow manually)
3. Site: `https://anhxuanpham.github.io/algo-study/`

## Commands

| Command                          | Purpose                                         |
| -------------------------------- | ----------------------------------------------- |
| `npm run dev`                    | Start Astro development server                  |
| `npm run build`                  | Build static site then generate Pagefind index  |
| `npm run preview`                | Preview the production build                    |
| `npm run format`                 | Format source files                             |
| `npm run lint`                   | Run ESLint                                      |
| `npm run typecheck`              | Run Astro/TypeScript checks                     |
| `npm run validate:content`       | Validate schemas/graph/preview content contract |
| `npm run validate:content:v1`    | Enforce strict mandatory v1.0 coverage          |
| `npm run coverage:content`       | Generate the formatted Markdown coverage report |
| `npm run coverage:content:check` | Fail when the committed report is stale         |
| `npm run test:unit`              | Run unit tests                                  |
| `npm run test:e2e`               | Build and run browser tests                     |
| `npm run check`                  | Run the non-browser quality gate                |

## Architecture boundaries

1. Astro components and pages are static by default.
2. Client JavaScript belongs under `src/components/interactive/` and must use an explicit `client:*` directive.
3. Lessons must remain readable without JavaScript. Interactive widgets enhance rather than own essential content.
4. Design components consume semantic tokens from `src/styles/tokens.css`; feature code does not invent raw palette values.
5. Do not add a component framework, global state library, animation library, or backend until a measured requirement justifies it.

## Design direction

Technical editorial + coding workspace. Be Vietnam Pro carries Vietnamese headings, body, and UI so diacritics stay clear; JetBrains Mono is reserved for code/data. Cobalt/indigo primary, amber action, clear semantic states, restrained motion, and no structural emoji icons or decorative gradients.

## Accessibility baseline

- WCAG 2.2 AA target
- Skip link, semantic landmarks, visible focus
- Keyboard-operable controls with preferred 44px targets
- 320 CSS px reflow and 200% zoom support
- Reduced-motion support
- Text/table alternatives for future visualizers

## Project structure

```text
src/
  components/
    content/      # allowlisted static MDX learning blocks
    interactive/  # explicitly hydrated React islands
    navigation/   # static navigation components
    ui/           # static Astro primitives
  content/        # tracks, topics, lessons, problems, assessments, glossary
  data/           # curriculum manifest and content identity rules
  lib/content/    # shared schemas, loaders, queries, validation
  lib/curriculum/ # prerequisite graph and coverage calculator
  config/
  layouts/
  pages/
  styles/
scripts/content/  # deterministic validation/report CLIs
tests/
  unit/
  e2e/
```

## Content authoring

Read `docs/content-authoring-guide.md` before adding an entry and use `docs/content-review-checklist.md` before promoting it to `published`. Draft/review entries are available only through noindex reviewer routes under `/content-preview/`; production lesson routes remain reserved for future `published` content. Preview deploys may show `partial/planned`; strict v1.0 coverage is a separate gate.

## Privacy and data

No account, backend, analytics, or learner progress exists in Phase 1. Later local progress must remain non-sensitive, origin-specific, exportable, and resilient when browser storage is unavailable.
