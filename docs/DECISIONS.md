# Decisions

## Current decisions
- **Single-page static app**: HTML/CSS/JS only; no build step. Open `index.html` to run.
- **Canvas rendering**: Game grid is drawn on a `<canvas>` with per-block styling.
- **Stages as pacing**: Each stage has a line goal and 3 speed tiers.
- **Stage transitions**: Completing a stage clears the board, resets hold/queue, and waits for Space to continue (with a short cue if sound is enabled). Score/total lines carry over.
- **Win condition**: Endless stage declares a win after 40 lines and shows a trophy overlay.
- **Themes**: CSS variables drive theme palettes. Themes can **follow stages** (default) or be **manually selected**.
- **Persistence**: High scores and theme preferences stored in `localStorage`.
- **Input model**: Keyboard controls only; no touch controls yet.

## Assumptions
- GitHub Pages serves the site from the repo root (not from `/docs`).
- Desktop-first experience is acceptable for now; mobile/touch is out of scope.

## Open questions
- Should the win condition (40 lines in Endless) or stage line goals be tuned?
- Do we want a lightweight test or lint setup, or keep it fully static?
