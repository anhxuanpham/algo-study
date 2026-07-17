# Content Authoring Guide

## Overview

Algo Study content is trusted repository source. Authors write typed YAML/MDX; the build rejects invalid schemas, references, graph cycles, identity collisions, and dishonest release coverage.

## Content model

| Collection  | Path                             | Role                                              |
| ----------- | -------------------------------- | ------------------------------------------------- |
| Tracks      | `src/content/tracks/*.yaml`      | Audience-specific ordered topic paths             |
| Topics      | `src/content/topics/*.yaml`      | Domain grouping, prerequisites, outcomes          |
| Lessons     | `src/content/lessons/**/*.mdx`   | Canonical learning loop                           |
| Problems    | `src/content/problems/**/*.mdx`  | Guided and independent transfer practice          |
| Assessments | `src/content/assessments/*.yaml` | Deterministic retrieval and feedback              |
| Glossary    | `src/content/glossary/*.yaml`    | Vietnamese/English terminology and search aliases |

`src/data/curriculum-manifest.yaml` defines mandatory domains/patterns. `src/data/content-identity.yaml` defines direct redirects and tombstones for retired IDs.

## Canonical IDs

- Frontmatter/data `id` is the source of truth.
- Filename must equal ID plus extension.
- Format: lowercase ASCII kebab-case.
- IDs are globally unique across every collection.
- Published IDs are immutable because routes and progress reference them.
- Search aliases belong in topic/glossary `aliases`; they do not create routes.
- Redirects point directly to a live canonical ID. No chains or cycles.
- A tombstone preserves a retired ID when no redirect is appropriate.

Examples:

```text
track:      foundations
topic:      arrays-basics
lesson:     arrays-basics-01-two-pointers
problem:    pair-sum-sorted-independent
assessment: arrays-basics-01-retrieval-01
pattern:    two-pointers
```

## Status workflow

```text
planned → draft → review → published
```

- `planned`: shape/sequence intent only.
- `draft`: content in active writing; not learner-ready.
- `review`: complete enough for editorial, technical, and accessibility review.
- `published`: requires reviewer names, date, valid sources, and complete evidence.

Do not mark content `published` to improve a metric. Preview coverage may remain partial. v1.0 fails until every mandatory item is covered.

## Canonical lesson order

1. Why the concept matters and measurable objectives.
2. Prerequisite recall.
3. Concept and invariant.
4. Complexity analysis.
5. Worked example.
6. Trace/table or equivalent accessible representation.
7. Retrieval checkpoint with misconception feedback.
8. Guided problem with staged hints.
9. Independent transfer problem.
10. Summary, sources, and review metadata.

Use allowlisted components from `src/components/content/`. Components accept serializable props. Do not add arbitrary scripts to MDX.

## Bilingual terminology

- Explain in Vietnamese.
- Use the standard English technical term on first occurrence.
- Preserve code identifiers in English.
- Add common Vietnamese and English search aliases to topic/glossary data.
- Do not invent literal translations when the industry uses the English term.

## TypeScript examples

TypeScript is the canonical v1 language. A correctness claim must include constraints, complexity, edge cases, and runnable/extractable code metadata when code is added. Python/C++ variants remain later scope.

## Problems and licensing

- Write original prompts or record a license that permits reuse.
- Otherwise store metadata and link to the external problem.
- `source.url` must use HTTPS.
- Guided and independent problems must differ in surface form; do not clone the worked example.
- `solutionRef` must match an explicit body anchor.

## Validation commands

```bash
npm run validate:content        # preview gate; labeled gaps allowed
npm run validate:content:v1     # strict v1.0; mandatory gaps fail
npm run coverage:content        # regenerate docs/content-coverage.md
npm run test:unit
npm run build
```

Validation errors include code, source path, entry ID, failure, and recovery hint. Never weaken validation to publish broken content.
