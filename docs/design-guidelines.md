# Algo Study Design Guidelines

## Overview

Technical editorial learning workspace. Hierarchy comes from typography, rule lines, whitespace, and state clarity—not gradients, glass, or decorative motion.

## Visual system

- Fraunces Variable (`--font-display`): soft editorial serif for brand and headings (SOFT/WONK/opsz axes, Vietnamese subset).
- Be Vietnam Pro (`--font-body` / `--font-ui`): long-form reading and controls — clear Vietnamese marks.
- JetBrains Mono Variable (`--font-mono`): code, indices, metadata, labels, and eyebrows only.
- Contrast comes from serif display vs sans reading; keep heading line-height ≥ ~1.08 so diacritics do not collide.
- Semantic tokens only: `canvas`, `surface`, `ink`, `muted`, `border`, `primary`, `action`, and status colors.
- Light, dark, and system themes are designed together.
- 8–12px radii; overlays alone receive substantial shadow.
- Lucide/SVG icons. Never use emoji as controls or navigation symbols.

## Layout

- Maximum page width: 90rem.
- Reader measure: 60–75 characters.
- Desktop learning shell: curriculum / reader / outline.
- Tablet: reader / outline.
- Mobile: single column; secondary navigation must remain keyboard accessible.
- Code may scroll inside a labeled local region; the page must not scroll horizontally at 320px.

## Interaction

- Preferred target: at least 44×44px.
- Visible focus ring: 3px with offset.
- Use native controls before custom widgets.
- Motion: 150–250ms transform/opacity only and never required for meaning.
- Respect `prefers-reduced-motion`.
- Dynamic status uses semantic announcements without moving focus.

## Content components

- `ButtonLink`: primary, secondary, quiet actions.
- `StatusBadge`: always uses a marker plus text, not color alone.
- `Callout`: label + left rule for invariant/note/warning.
- `CodeFrame`: figcaption and labeled local overflow region.
- `ProgressMeter`: semantic `<progress>` plus textual percentage.
- `EmptyState`, `ErrorState`, `SkeletonBlock`: explicit system feedback and recovery.

## Anti-patterns

- Decorative gradients, glassmorphism, or sci-fi HUD decoration.
- Emoji icons.
- Hover-only actions.
- Body text below 16px.
- Removing focus outlines.
- Hydrating a static page without a concrete interaction.
- Using green/red as the only indicator.
