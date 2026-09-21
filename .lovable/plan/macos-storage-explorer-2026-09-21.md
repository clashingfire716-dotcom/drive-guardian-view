# macOS Storage Explorer

## Goal
Build a polished, frontend-only macOS disk visualization and cleanup simulator with realistic APFS sample data, dark mode by default, and a fully interactive desktop-style workflow.

## Experience
- Recreate native macOS window chrome, unified toolbar, translucent sidebars, large SF-style typography, and light/dark appearances.
- Add source navigation, smart storage lenses, volume selection, live scan status, keyboard shortcuts, search and filters.
- Build two switchable visualizations: a cushion-style squarified treemap and an interactive radial SunMap, both driven by the same realistic filesystem tree.
- Support selection, folder drill-down, breadcrumbs, history navigation, hover details, contextual actions, and simulated file opening.
- Add Quick Look, a detailed Info inspector, and a technical Disk Advisor with deterministic client-side diagnostics and chat suggestions.
- Add a Collector staging drawer, removal controls, reclaimable-size totals, confirmation sheet, purge mode selection, snapshot option, authorization simulation, deletion animation, and live storage gauge updates.

## Interaction and safety
- Keep all behavior local to browser memory; no backend, account, or real filesystem access.
- Clearly simulate destructive and system actions without performing real deletion.
- Protect critical sample system files from staging or purging.
- Support Command-1, Command-2, Command-K, Space, Option-Command-I, and Command-Delete.
- Respect reduced-motion preferences and keep controls keyboard-accessible.

## Technical details
- Use React state and typed mock APFS nodes as the single source of truth.
- Implement treemap layout and SVG sunburst rendering locally, with responsive desktop and compact-window behavior.
- Use semantic design tokens in the global stylesheet and Lucide system icons only; no emoji or sparkle iconography.
- Add route-specific metadata and preserve the existing TanStack application shell.
- Verify compilation, preview diagnostics, primary interactions, and visual layout in Chromium at desktop and compact widths.
