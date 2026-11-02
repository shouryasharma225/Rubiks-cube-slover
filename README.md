# Rubik's Cube Solver 🎲

A full-featured, modern, and interactive 3x3 Rubik's Cube Solver web application built with **React**, **Three.js**, and **Vanilla CSS**.
Powered by **Kociemba's Two-Phase Algorithm** for calculating near-optimal solutions (typically 18-22 moves) directly in the browser with zero backend dependencies or paid APIs.

---

## 🚀 Live Access & Sharing

The development server runs locally and broadcasts across your local Wi-Fi / LAN network:
- **Local Browser**: [http://localhost:5173/](http://localhost:5173/)
- **Network / Share Link (Same Wi-Fi/LAN)**: [http://10.12.5.228:5173/](http://10.12.5.228:5173/)

---

## ✨ Features

1. **Dual Visualization**:
   - **Interactive 3D Rubik's Cube**: Rendered in Three.js with orbit drag controls, turntable auto-spin, camera angle reset, and real-time reflection materials.
   - **Interactive 2D Unfolded Net**: Classic cross layout displaying all 6 faces and all 54 clickable stickers at a glance for rapid painting and inspection.
   - **Switchable View Modes**: Toggle between *Dual View* (side-by-side), *3D View*, or *2D Net View*.

2. **Standard Six Colors & Paint Tools**:
   - Standard competition color scheme: White (Up), Yellow (Down), Red (Right), Orange (Left), Blue (Back), Green (Front).
   - Live sticker count indicators (e.g. `9/9` with balanced status badges).
   - Keyboard shortcuts (`1` to `6`) for lightning-fast brush selection.
   - Drag-to-paint across multiple stickers.
   - Paint directly on either the 2D Net or the 3D Cube.

3. **Mathematical State & Parity Validation**:
   - Validates physical legality before solving:
     - 9 stickers of each color (54 total).
     - Unique center pieces and valid chirality.
     - 12 valid edge pieces with duplicate detection.
     - Edge orientation parity check ($\sum EO \equiv 0 \pmod 2$).
     - 8 valid corner pieces with duplicate detection.
     - Corner orientation parity check ($\sum CO \equiv 0 \pmod 3$).
     - Permutation parity check ($\text{sign}(EP) = \text{sign}(CP)$).
   - Clear, diagnostic modal explaining why an impossible configuration cannot be solved.

4. **Kociemba Two-Phase Optimal Solver**:
   - Real, authentic solving algorithm (no fake or hardcoded steps).
   - Solves any valid scramble in ~10 milliseconds.
   - Outputs standard WCA Singmaster notation (`R`, `R'`, `R2`, `U`, `D2`, etc.).

5. **Step-by-Step Solution Player**:
   - **Controls**: Play / Pause, Next Move, Previous Move, Jump to Start, Jump to End.
   - **Playback Speeds**: 0.5x, 1x, 2x, 4x.
   - **Move Counter**: Real-time step counter (e.g. `Step 8 of 22 (36%)`) with an animated progress bar.
   - **Spotlight Move Card**: Large bold notation card with plain-English instructions (e.g. *Turn Right face 180°*).
   - **Interactive Move Ribbon**: Click any move in the timeline sequence to jump directly to that step.
   - **Victory Confetti & Chime**: Celebratory particle burst and Web Audio chime when solved!

6. **WCA Scramble Generator & Presets**:
   - Official-style random-state scrambles (20-25 moves without redundant cancels).
   - "Apply to Cube" and "Copy Scramble" buttons.
   - Preset patterns: *Checkerboard*, *Superflip*, *Cube in a Cube*, *Crosses*, *Anaconda*, *Wire*.

7. **Tools & Extras**:
   - **Manual Notation Pad**: 18 one-click turn buttons plus whole-cube rotations (X, Y, Z).
   - **Copy Solution**: One-click clipboard copy.
   - **Audio Effects**: Procedural Web Audio mechanical turn snaps and chimes (toggleable).
   - **Dark / Light Mode**: Sleek modern themes with CSS variables and glassmorphic styling.
   - **Notation Guide Modal**: Full illustrated guide to Rubik's cube notation.
   - **Fully Responsive**: Mobile, tablet, and desktop layouts.

---

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18+)

### Installation
```bash
npm install
```

### Running Locally
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Building for Production
```bash
npm run build
```
The static bundle will be built in the `dist/` directory.

---

## 📂 Project Structure

```
├── index.html                   # HTML entrypoint with SEO metadata and Google Fonts
├── package.json                 # Project dependencies & scripts
├── vite.config.js               # Vite config with network host enabled
├── test_app_logic.js            # Automated verification test suite (32 test cases)
├── src/
│   ├── main.jsx                 # React root mounting
│   ├── App.jsx                  # Main application orchestrator
│   ├── index.css                # Modern CSS design system (dark/light themes, animations)
│   ├── components/
│   │   ├── Header.jsx           # App title, theme toggle, audio toggle, guide button
│   │   ├── Cube3DView.jsx       # Three.js 3D interactive cube with orbit controls
│   │   ├── CubeNetView.jsx      # 2D unfolded cross layout (54 clickable stickers)
│   │   ├── ColorPalette.jsx     # 6-color palette with counts and keyboard shortcuts
│   │   ├── SolverControls.jsx   # Reset, Scramble, Solve Cube, and Presets buttons
│   │   ├── SolutionPlayer.jsx   # Step-by-step player with progress bar and timeline ribbon
│   │   ├── ManualControls.jsx   # 18 notation move buttons + X/Y/Z rotations
│   │   ├── ScrambleGenerator.jsx# WCA scramble generator with copy & apply
│   │   ├── ValidationAlert.jsx  # Parity and physical state error modal
│   │   └── NotationGuideModal.jsx # Visual notation reference
│   ├── solver/
│   │   ├── cubeEngine.js        # 54-sticker state engine, color maps, move permutations
│   │   ├── validator.js         # Mathematical parity, edge, corner, and center validation
│   │   ├── solver.js            # Kociemba Two-Phase solver wrapper & step explainer
│   │   ├── scrambler.js         # WCA-compliant scramble generator
│   │   └── presets.js           # Famous pattern algorithms
│   └── hooks/
│       └── useCubeAudio.js      # Procedural Web Audio sound effects
```
