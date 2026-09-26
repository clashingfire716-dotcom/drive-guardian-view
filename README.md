# Disk Whisperer

Build an authentic, production-grade native macOS storage visualization, exploration, and safe-cleanup application (inspired by DaisyDisk, GrandPerspective, CleanMyMac, and OmniDiskSweeper) strictly compliant with Apple Human Interface Guidelines (HIG).

IMPORTANT CONSTRAINTS & STYLING RULES:
1. Pure frontend only: DO NOT connect any backend, database, or Supabase. Everything runs on client-side state with rich, realistic macOS APFS mock filesystem trees.
2. NO emojis anywhere in the interface (replace any shopping cart or status emojis with crisp Apple/macOS-style vector icons).
3. ABSOLUTELY NO sparkle/stars AI icons. Use professional technical/system icons (such as terminal, brain, cpu, search, shield, gauge, or file-check icons) for AI features and diagnostics.
4. Keep font sizes generous, legible, and large. Ensure clean, uncluttered spacing with authentic macOS window styling (traffic lights, vibrant translucent materials, SF Pro styling, SF Mono tabular numbers for file sizes and paths).
5. Support both dark mode (deep macOS dark graphite/acrylic) and light mode (macOS frosted glass), with dark mode enabled by default.

CORE FEATURES & ARCHITECTURE:

1. macOS Window Chrome & Unified Toolbar:
- Authentic macOS window titlebar with traffic light buttons (close, minimize, zoom) and unified toolbar.
- Sidebar toggle button (`sidebar.leading` icon).
- Drive & Volume dropdown: Macintosh HD (APFS Container, e.g. 994 GB total, 642 GB used, 352 GB free), external SSDs (e.g. Samsung T7 2TB), and "Scan Custom Folder...".
- Live scan status & velocity indicator (e.g. "85,420 files/sec • 3.2s elapsed") with pause/rescan controls.
- View Switcher segmented control: TreeMap (⌘1) vs SunMap (⌘2).
- Pro Search bar (⌘K) with instant search, extension filtering, NL semantic query matching (e.g. "developer caches over 1GB", "large 4K video clips", "uninstalled app leftovers"), and filter popover (size threshold, kind, dormancy >180d, safe to delete).
- Collector Stash button displaying staged items count and total reclaimable size (e.g. "3 items • 14.8 GB") which toggles the bottom staging drawer.
- Pro status pill and Inspector toggle (`sidebar.trailing` ⌥⌘I).

2. Left Navigation Sidebar:
- Storage sources: Macintosh HD with visual storage gauge, External Drives, iCloud Drive.
- Smart Lenses: Large Files (>1 GB), Dormant Files (>180 days), Developer Artifacts (Xcode DerivedData, node_modules, Docker layers, CocoaPods), Installers & Archives (.dmg, .pkg, .zip), Application Leftovers (orphaned ~/Library files).
- Quick "+ Scan Folder..." button.

3. Center Visualization Canvas:
- Interactive Breadcrumb Path Bar (Macintosh HD › Users › alex › Library › Developer › Xcode) with jumpable segments, Back, Forward, and Up-One-Level controls.
- Interactive Squarified Treemap View:
  - Implements cushion/shaded rectangular squarified treemap with color-coded categories (Developer, System, Media, Apps, Documents).
  - Hover tooltip with file name, exact size, and type.
  - Single click to select and inspect in right panel; double click to drill down into folder; double click on file to simulate opening.
- Interactive SunMap (Radial Sunburst) View:
  - Concentric radial rings representing folder hierarchy and byte proportions.
  - Center hub showing current folder name and total size (clicking navigates up).
  - Smooth hover arc highlighting with HUD showing path, size, and parent percentage.
- Right-click context menu: Reveal in Finder, Quick Look (Spacebar), Copy Path, Open in Terminal, Add to Collector Drawer, Ask AI diagnostic, Scan Folder Only, Move to Trash.
- Quick Look preview modal triggered on Spacebar with metadata, preview render, and actions.

4. Right Collapsible Inspector Panel:
- Tab 1 (Info): Identity header, physical allocated vs logical size (APFS sparse clone detection), APFS purgeable space, file & folder counts, timestamps (Created, Modified, Last Accessed with dormancy badge), POSIX permissions (e.g. drwxr-xr-x) and SIP status, child category breakdown bar.
- Tab 2 (AI Disk Advisor - NO SPARKLES):
  - Safety classification badge (Safe to Purge, Review Recommended, System Critical / SIP Protected).
  - Root-cause space diagnostic explaining why space expanded.
  - Interactive disk advisor chat with conversational questions and quick prompt chips ("What is safe to delete here?", "Find duplicates", "Explain purpose").
  - Action button to instantly stage recommended safe caches to the collector drawer.

5. Bottom Collector Drawer (Staging Cart):
- Collapsible bottom drawer showing queued items from any folder across the drive.
- Live reclaimable byte counter and items list with individual remove buttons.
- "Review & Purge" trigger opening an Apple HIG Confirmation Sheet:
  - Option to Move to Trash or Direct Purge.
  - "Create APFS Snapshot rollback checkpoint" toggle (enabled by default).
  - Simulated Touch ID / Admin authorization.
  - High-fidelity deletion animation with instant disk gauge space reclamation update.

Ensure polished animations, keyboard shortcuts (⌘1, ⌘2, ⌘K, Spacebar, ⌥⌘I, ⌘⌫), and crisp vector icons throughout.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://drive-guardian-view.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/41e91382-a0b0-441b-849c-1a9a2152d307).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
