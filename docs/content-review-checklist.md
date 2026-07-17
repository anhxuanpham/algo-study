# Content Review Checklist

## Overview

Every entry promoted from `review` to `published` needs editorial and technical review. Lessons/problems also require accessibility and source/licensing checks.

## Editorial review

- [ ] Objectives are measurable and match the lesson body.
- [ ] Vietnamese is natural; English terminology matches glossary usage.
- [ ] Prerequisites are stated and actually available earlier in the graph.
- [ ] Worked example moves from reasoning to code, not the reverse.
- [ ] Retrieval prompt can be answered without ambiguous wording.
- [ ] Wrong-answer feedback explains misconception and recovery.
- [ ] Guided hints reveal strategy progressively.
- [ ] Independent problem tests transfer, not memorization.
- [ ] Summary restates invariant, trade-off, and next action.

## Technical review

- [ ] Invariant is correct before and after every state transition.
- [ ] Complexity includes relevant time and extra-space bounds.
- [ ] Constraints support the recommended algorithm and JavaScript number model.
- [ ] Example outputs and trace rows are correct.
- [ ] Edge cases include empty/minimum, boundaries, duplicates, overflow/range where relevant.
- [ ] Canonical TypeScript code compiles when extractable.
- [ ] Problem solution and hints agree.
- [ ] Sources are authoritative enough for the claim and use HTTPS.

## Accessibility and structure

- [ ] Heading hierarchy is sequential.
- [ ] Visual reasoning has a complete text/table alternative.
- [ ] Tables have captions and column/row headers.
- [ ] Interactive/hidden answer controls have static content fallbacks.
- [ ] Instructions do not rely only on color, shape, or position.
- [ ] Component IDs are unique within the page.
- [ ] Code overflow is local and keyboard reachable.

## Identity and graph

- [ ] Filename equals canonical frontmatter/data ID.
- [ ] ID is globally unique and immutable after publish.
- [ ] Every referenced ID exists in the expected collection.
- [ ] Topic prerequisites are acyclic and pedagogically earlier.
- [ ] Track/topic ordering contains no duplicate ID.
- [ ] Retired IDs use a direct redirect or tombstone.

## Licensing and maintenance

- [ ] Prompt/explanation is original or license is recorded.
- [ ] External links are attribution, not hidden copied content.
- [ ] `author`, `editorialReviewer`, `technicalReviewer`, `lastReviewedAt`, and `reviewVersion` are set.
- [ ] Meaningful content/assessment changes increment `reviewVersion`.

## Release gate

```bash
npm run validate:content
npm run test:unit
npm run build
```

Before labeling v1.0, also run:

```bash
npm run validate:content:v1
```
