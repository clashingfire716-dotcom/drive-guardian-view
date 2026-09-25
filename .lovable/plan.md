# Storage Explorer Analysis Enhancements

## Goal
Add richer folder analysis and cleanup guidance across the inspector, sidebar, and toolbar while keeping the experience entirely simulated in the browser.

## Build
- Expand the inspector with a compact action bar for Quick Look, Reveal in Finder, and Collector staging.
- Add a ranked, scrollable list of immediate folder contents, grouping low-impact children into a single “smaller objects” row.
- Connect inspector-list hover and selection to both visualizations; hovering emphasizes the matching treemap tile or SunMap arc, and clicking selects it while folder activation drills down.
- Show contextual purge-impact guidance for caches, logs, build artifacts, snapshots, installers, and protected content.
- Add APFS Local Snapshots and Duplicate Files smart lenses using realistic mock entries and simulated cleanup behavior.
- Add Recent Scans shortcuts for Downloads, Developer, and Library/Caches, plus a simulated eject control for Samsung T7.
- Add Category versus Age / Last Accessed color modes, with a restrained cool-to-warm age scale and matching legend.
- Add a simulated privilege toggle that reveals restricted folders and hidden APFS space without accessing the real filesystem.

## Interaction and safety
- Keep every action frontend-only and explicitly simulated where macOS permissions, Finder, snapshots, or disk operations are involved.
- Preserve protected-item safeguards, keyboard shortcuts, existing drill-down behavior, and Collector confirmation.
- Use Lucide technical/system icons only; no emoji or decorative sparkle symbols.

## Technical details
- Extend the typed mock data only where lenses need dedicated sample nodes.
- Lift shared hover, color-mode, and elevated-access state into the main explorer and pass it to both maps and the inspector.
- Use semantic CSS tokens for the age scale, cross-highlight states, inspector rows, and toolbar controls.
- Validate compilation and exercise treemap, SunMap, lens, inspector, staging, and compact-width interactions in Chromium.
