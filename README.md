# TetriPulse

Minimal, responsive Tetris-inspired game with stages, themes, and modern quality-of-life features. Built as a single-page HTML/CSS/JS app.

## Play online
[Play TetriPulse](https://david-ikenna-ezekiel.github.io/tetripulse/)

## Support note
Desktop only for now. Touch-only devices are not supported yet.

## Features
- Ghost piece, hold queue, and next preview
- Stage-based speed system with progress tracking
- Stage transitions reset the board between stages
- Theme selector (Minimal, Noir, Ocean, Ember, Neon, Canyon, Zoo, Wireframe)
- Theme can follow stages automatically or be set manually
- High-score list stored locally
- Optional sound effects toggle
- Win state after 40 lines in Endless

## Scoring labels
- **Score**: Total points earned from clearing lines.
- **Lines**: Total number of full rows cleared.
- **Speed**: Current speed tier within the stage (1–3).
- **Stage**: The current chapter of the run (e.g., Drift, Flow).
- **Stage progress**: Visual bar showing progress through the current stage.

## Stage flow (current behavior)
- Each stage has a line goal and 3 speed tiers.
- When a stage completes, the board resets and waits for Space to continue.
- Score and total lines carry across stages.
- Endless stage triggers a win after 40 lines.
- A short transition cue plays on stage completion when sound is enabled.

## Controls
- ← / →: Move
- ↑: Rotate
- ↓: Soft drop
- Space: Hard drop
- C: Hold swap
- P: Pause
- M: Toggle sound
- R: Reset

## Run locally
Open `index.html` in a browser.

## Notes
Scores and theme preferences are saved in `localStorage`.
