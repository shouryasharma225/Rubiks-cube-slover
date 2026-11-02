import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  getSolvedState,
  applyMove,
  applyMoves,
  getStickerCounts,
  isStateSolved,
  cloneState,
  COLOR_KEYS
} from './solver/cubeEngine.js';
import { solveCube } from './solver/solver.js';
import { generateScramble } from './solver/scrambler.js';
import { validateCube } from './solver/validator.js';
import { useCubeAudio } from './hooks/useCubeAudio.js';

import { Header } from './components/Header.jsx';
import { Cube3DView } from './components/Cube3DView.jsx';
import { CubeNetView } from './components/CubeNetView.jsx';
import { ColorPalette } from './components/ColorPalette.jsx';
import { SolverControls } from './components/SolverControls.jsx';
import { SolutionPlayer } from './components/SolutionPlayer.jsx';
import { ManualControls } from './components/ManualControls.jsx';
import { ScrambleGenerator } from './components/ScrambleGenerator.jsx';
import { ValidationAlert } from './components/ValidationAlert.jsx';
import { NotationGuideModal } from './components/NotationGuideModal.jsx';
import { GameArena } from './components/GameArena.jsx';
import { GameLeaderboard } from './components/GameLeaderboard.jsx';
import { CubePhotoSolver } from './components/CubePhotoSolver.jsx';
import { LearnCube } from './components/LearnCube.jsx';
import { FrontPagePoster } from './components/FrontPagePoster.jsx';

import { Box, Grid3X3, Layers, Gamepad2, Camera } from 'lucide-react';

export function App() {
  // Theme state: default to 'dark' (pure obsidian black theme)
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('rcs_theme');
      if (saved) return saved;
      return 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('rcs_theme', theme);
  }, [theme]);

  // Audio Hook
  const {
    audioEnabled,
    toggleAudio,
    playTurnSound,
    playPaintSound,
    playSolvedChime
  } = useCubeAudio();

  // Visual View Mode: 'dual' (both 3D & 2D), '3d' (only 3D), '2d' (only 2D Net)
  const [viewMode, setViewMode] = useState('dual');

  // Cube State
  const [cubeState, setCubeState] = useState(getSolvedState);
  const [initialScrambleState, setInitialScrambleState] = useState(null);

  // Selected Color Palette Brush (default White)
  const [selectedColor, setSelectedColor] = useState('white');

  // Solver & Solution State
  const [isSolving, setIsSolving] = useState(false);
  const [solution, setSolution] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [animatingMove, setAnimatingMove] = useState(null);

  // Validation State
  const [validationError, setValidationError] = useState(null);
  const [validationDetails, setValidationDetails] = useState(null);

  // Modals & Stats
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [manualMoveCount, setManualMoveCount] = useState(0);

  // Active Mode: 'home' (poster & front page showcase) | 'cube-solver' (real world camera/photo solver) | 'game' (arena) | 'learn' (academy) | 'solver' (virtual lab)
  const [activeMode, setActiveMode] = useState('home');
  const [displayedMode, setDisplayedMode] = useState('home');
  const [isSwitchingMode, setIsSwitchingMode] = useState(false);
  const switchTimerRef = useRef(null);

  // Humanized 0.5s (500ms) Latency Transition when switching between options
  const handleSwitchMode = useCallback((targetMode) => {
    if (targetMode === activeMode && !isSwitchingMode) return;

    if (switchTimerRef.current) {
      clearTimeout(switchTimerRef.current);
    }

    // Immediately update active tab highlight and play click feedback
    setActiveMode(targetMode);
    setIsSwitchingMode(true);
    playTurnSound();

    // 0.5s humanized transition delay before rendering the new view
    switchTimerRef.current = setTimeout(() => {
      setDisplayedMode(targetMode);
      setIsSwitchingMode(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 500);
  }, [activeMode, isSwitchingMode, playTurnSound]);

  useEffect(() => {
    return () => {
      if (switchTimerRef.current) {
        clearTimeout(switchTimerRef.current);
      }
    };
  }, []);

  const [gameCubeState, setGameCubeState] = useState(getSolvedState);
  const [externalScrambleToGame, setExternalScrambleToGame] = useState(null);
  const [lastSolveRecord, setLastSolveRecord] = useState(null);

  // Dynamic 3D face orientation: which face is facing Front, Right, Up, Left, Down, Back
  const [viewOrientation, setViewOrientation] = useState({
    front: 'F',
    right: 'R',
    up: 'U',
    left: 'L',
    down: 'D',
    back: 'B'
  });

  // Trigger celebration confetti
  const triggerCelebration = useCallback(() => {
    playSolvedChime();
    confetti({
      particleCount: 90,
      spread: 75,
      origin: { y: 0.55 }
    });
  }, [playSolvedChime]);

  // Game Mode Handlers
  const handleApplyGameMove = (move) => {
    if (animatingMove) return;
    setAnimatingMove({
      move,
      duration: 170, // Snappy 170ms for fast game response
      id: Date.now(),
      onCompleteCallback: () => {
        setGameCubeState((prev) => applyMove(prev, move));
        setAnimatingMove(null);
        playTurnSound();
      }
    });
  };

  const handleScrambleGameCube = (moves) => {
    setAnimatingMove(null);
    const base = getSolvedState();
    const scrambled = applyMoves(base, moves);
    setGameCubeState(scrambled);
    playTurnSound();
  };

  const handleResetGameCube = () => {
    setAnimatingMove(null);
    setGameCubeState(getSolvedState());
    playTurnSound();
  };

  // Paint sticker handler
  const handlePaintSticker = (face, index) => {
    // If painting during active solution, clear the solution
    if (solution) {
      setSolution(null);
      setIsPlaying(false);
      setAnimatingMove(null);
      setInitialScrambleState(null);
    }
    setValidationError(null);

    setCubeState((prev) => {
      const next = cloneState(prev);
      next[face][index] = selectedColor;
      return next;
    });

    playPaintSound();
  };

  // Reset cube
  const handleReset = () => {
    setCubeState(getSolvedState());
    setSolution(null);
    setIsPlaying(false);
    setAnimatingMove(null);
    setCurrentStep(0);
    setInitialScrambleState(null);
    setValidationError(null);
    setManualMoveCount(0);
    playTurnSound();
  };

  // Scramble cube with WCA scramble
  const handleScramble = (customMoves) => {
    const movesToApply = customMoves || generateScramble(22).moves;
    const base = getSolvedState();
    const scrambled = applyMoves(base, movesToApply);

    setCubeState(scrambled);
    setSolution(null);
    setIsPlaying(false);
    setAnimatingMove(null);
    setCurrentStep(0);
    setInitialScrambleState(null);
    setValidationError(null);
    playTurnSound();
  };

  // Apply Preset Pattern
  const handleApplyPreset = (pattern) => {
    const base = getSolvedState();
    const patterned = applyMoves(base, pattern.algorithm);

    setCubeState(patterned);
    setSolution(null);
    setIsPlaying(false);
    setAnimatingMove(null);
    setCurrentStep(0);
    setInitialScrambleState(null);
    setValidationError(null);
    playTurnSound();
  };

  // Manual Move Application with 3D animation
  const handleApplyMove = (move) => {
    if (animatingMove) return;

    if (solution) {
      setSolution(null);
      setIsPlaying(false);
      setInitialScrambleState(null);
    }
    setValidationError(null);

    // Trigger smooth 3D slice rotation
    setAnimatingMove({
      move,
      duration: 240,
      id: Date.now(),
      onCompleteCallback: () => {
        setCubeState((prev) => applyMove(prev, move));
        setManualMoveCount((c) => c + 1);
        setAnimatingMove(null);
        playTurnSound();
      }
    });
  };

  // Solve Cube
  const handleSolve = async () => {
    setValidationError(null);

    // If already solved, celebrate!
    if (isStateSolved(cubeState)) {
      triggerCelebration();
      return;
    }

    // Mathematical validation check
    const val = validateCube(cubeState);
    if (!val.valid) {
      setValidationError(val.error);
      setValidationDetails(val.details);
      return;
    }

    setIsSolving(true);
    const result = await solveCube(cubeState);
    setIsSolving(false);

    if (!result.success) {
      setValidationError(result.error);
      setValidationDetails(result.details);
      return;
    }

    // Save starting state and set solution
    setInitialScrambleState(cloneState(cubeState));
    setSolution(result);
    setCurrentStep(0);
    setIsPlaying(false);
    setAnimatingMove(null);
  };

  // Turn animation complete handler
  const handleAnimationComplete = useCallback((completedTargetStep, callback) => {
    if (typeof callback === 'function') {
      callback();
      return;
    }

    if (typeof completedTargetStep === 'number' && solution && initialScrambleState) {
      const clamped = Math.max(0, Math.min(completedTargetStep, solution.totalMoves));
      const movesToApply = solution.moves.slice(0, clamped);
      const updatedState = applyMoves(initialScrambleState, movesToApply);
      setCubeState(updatedState);
      setCurrentStep(clamped);
      setAnimatingMove(null);
      playTurnSound();

      if (clamped === solution.totalMoves && solution.totalMoves > 0) {
        setIsPlaying(false);
        triggerCelebration();
      }
    } else {
      setAnimatingMove(null);
    }
  }, [solution, initialScrambleState, playTurnSound, triggerCelebration]);

  // Step change during solution playback
  const handleStepChange = (targetStep) => {
    if (!solution || !initialScrambleState || animatingMove) return;

    const clamped = Math.max(0, Math.min(targetStep, solution.totalMoves));
    const stepDiff = clamped - currentStep;

    const duration = Math.max(80, Math.round(300 / playbackSpeed));

    // If stepping forward by 1 move: animate face turn
    if (stepDiff === 1 && currentStep < solution.totalMoves) {
      const move = solution.moves[currentStep];
      setAnimatingMove({
        move,
        targetStep: clamped,
        duration,
        id: Date.now()
      });
      return;
    }

    // If stepping backward by 1 move: animate face turn in reverse
    if (stepDiff === -1 && currentStep > 0) {
      const move = solution.moves[currentStep - 1];
      setAnimatingMove({
        move,
        reverse: true,
        targetStep: clamped,
        duration,
        id: Date.now()
      });
      return;
    }

    // If jumping multiple steps (e.g. clicking far along the timeline ribbon)
    setCurrentStep(clamped);
    const movesToApply = solution.moves.slice(0, clamped);
    const updatedState = applyMoves(initialScrambleState, movesToApply);
    setCubeState(updatedState);
    playTurnSound();

    if (clamped === solution.totalMoves && solution.totalMoves > 0) {
      setIsPlaying(false);
      triggerCelebration();
    }
  };

  // Auto-play timer loop with 3D rotation animation
  useEffect(() => {
    if (!isPlaying || !solution || animatingMove) return;

    if (currentStep >= solution.totalMoves) {
      setIsPlaying(false);
      return;
    }

    const pauseMs = Math.max(40, Math.round(100 / playbackSpeed));
    const timer = setTimeout(() => {
      const nextMove = solution.moves[currentStep];
      if (nextMove) {
        const duration = Math.max(80, Math.round(300 / playbackSpeed));
        setAnimatingMove({
          move: nextMove,
          targetStep: currentStep + 1,
          duration,
          id: Date.now()
        });
      }
    }, pauseMs);

    return () => clearTimeout(timer);
  }, [isPlaying, currentStep, solution, animatingMove, playbackSpeed]);

  const stickerCounts = getStickerCounts(cubeState);
  const isSolved = isStateSolved(cubeState);

  return (
    <div className="app-layout">
      {/* App Header with prominent theme toggle & mode switcher */}
      <Header
        theme={theme}
        setTheme={setTheme}
        audioEnabled={audioEnabled}
        toggleAudio={toggleAudio}
        onOpenGuide={() => setIsGuideOpen(true)}
        activeMode={activeMode}
        setActiveMode={handleSwitchMode}
        isSwitchingMode={isSwitchingMode}
      />

      <main className={`app-main-content ${isSwitchingMode ? 'is-switching' : ''}`}>
        {isSwitchingMode && (
          <div className="mode-transition-overlay" role="status" aria-label="Switching workspace">
            <div className="humanized-pulse-spinner" />
            <span className="mode-transition-text">
              {activeMode === 'cube-solver'
                ? 'Opening Cube Solver...'
                : activeMode === 'game'
                ? 'Entering Speedcube Arena...'
                : activeMode === 'learn'
                ? 'Loading Academy Guide...'
                : activeMode === 'solver'
                ? 'Preparing 3D Virtual Lab...'
                : 'Returning to Home...'}
            </span>
          </div>
        )}

        {displayedMode === 'home' ? (
          /* ==========================================================
             HOME POSTER & FRONT PAGE SHOWCASE
             ========================================================== */
          <FrontPagePoster
            onGetStarted={() => handleSwitchMode('cube-solver')}
            onSelectMode={(mode) => handleSwitchMode(mode)}
            playTurnSound={playTurnSound}
            playSolvedChime={playSolvedChime}
          />
        ) : displayedMode === 'cube-solver' ? (
          /* ==========================================================
             CUBE SOLVER: Real-World Physical Cube Photo & Camera Scanner
             ========================================================== */
          <section className="cube-solver-space-section">
            <CubePhotoSolver
              playTurnSound={playTurnSound}
              playSolvedChime={playSolvedChime}
            />
          </section>
        ) : displayedMode === 'game' ? (
          /* ==========================================================
             GAME ARENA MODE: Interactive Play & Solve Game
             ========================================================== */
          <section className="game-mode-section">
            <div className="game-arena-layout">
              {/* Game HUD and interactive controls on top and left */}
              <div className="game-main-pane">
                <GameArena
                  cubeState={gameCubeState}
                  viewOrientation={viewOrientation}
                  onApplyGameMove={handleApplyGameMove}
                  onResetGameCube={handleResetGameCube}
                  onScrambleGameCube={handleScrambleGameCube}
                  playTurnSound={playTurnSound}
                  playSolvedChime={playSolvedChime}
                  externalScramble={externalScrambleToGame}
                  onSolveRecorded={(solveRecord) => setLastSolveRecord(solveRecord)}
                  onShowSolver={() => {
                    setCubeState(cloneState(gameCubeState));
                    handleSwitchMode('solver');
                  }}
                />
              </div>

              {/* 3D Interactive Game Cube */}
              <div className="game-cube-visualizer-pane">
                <div className="pane-header">
                  <Box size={16} className="text-accent" />
                  <h3>3D Game Cube (Drag to rotate angle • Use buttons or keyboard to turn)</h3>
                </div>
                <Cube3DView
                  cubeState={gameCubeState}
                  animatingMove={animatingMove}
                  onAnimationComplete={handleAnimationComplete}
                  onOrientationChange={setViewOrientation}
                  onQuickMove={handleApplyGameMove}
                  isSolving={false}
                />
              </div>
            </div>

            {/* Interactive Speedcubing Leaderboard Section */}
            <div id="game-leaderboard" className="game-leaderboard-section">
              <GameLeaderboard
                onRaceScramble={(entry) => {
                  setExternalScrambleToGame({
                    scramble: entry.scramble,
                    difficulty: entry.difficulty,
                    id: Date.now()
                  });
                }}
                highlightRecordId={lastSolveRecord?.id}
              />
            </div>
          </section>
        ) : displayedMode === 'learn' ? (
          /* ==========================================================
             LEARN CUBE MODE: Step-by-Step 3D Notes & Interactive Masterclass
             ========================================================== */
          <section className="learn-mode-section">
            <LearnCube
              playTurnSound={playTurnSound}
              playSolvedChime={playSolvedChime}
            />
          </section>
        ) : (
          /* ==========================================================
             SOLVER MODE: Optimal Two-Phase AI Solver & Visualizer
             ========================================================== */
          <>
            {/* Solution Step-by-Step Player: Prominently displayed at the very top when solution is available */}
            {solution && (
              <section className="solution-section top-solution-section">
                <SolutionPlayer
                  solution={solution}
                  currentStep={currentStep}
                  onStepChange={handleStepChange}
                  isPlaying={isPlaying}
                  setIsPlaying={setIsPlaying}
                  playbackSpeed={playbackSpeed}
                  setPlaybackSpeed={setPlaybackSpeed}
                />
              </section>
            )}

            {/* Top Controls Row */}
            <section className="top-action-bar">
              <SolverControls
                onReset={handleReset}
                onScramble={() => handleScramble()}
                onSolve={handleSolve}
                onApplyPreset={handleApplyPreset}
                isSolving={isSolving}
                isSolved={isSolved}
                disabled={isPlaying || !!animatingMove}
              />

              {/* View Mode Switcher */}
              <div className="view-mode-tabs" role="tablist" aria-label="Cube View Modes">
                <button
                  type="button"
                  className={`view-tab-btn ${viewMode === 'dual' ? 'active' : ''}`}
                  onClick={() => setViewMode('dual')}
                  title="Show 3D Cube and 2D Net Side-by-Side"
                >
                  <Layers size={15} />
                  <span>Dual View</span>
                </button>
                <button
                  type="button"
                  className={`view-tab-btn ${viewMode === '3d' ? 'active' : ''}`}
                  onClick={() => setViewMode('3d')}
                  title="Interactive 3D Three.js Cube"
                >
                  <Box size={15} />
                  <span>3D View</span>
                </button>
                <button
                  type="button"
                  className={`view-tab-btn ${viewMode === '2d' ? 'active' : ''}`}
                  onClick={() => setViewMode('2d')}
                  title="Unfolded 2D Net Sticker Painter"
                >
                  <Grid3X3 size={15} />
                  <span>2D Net View</span>
                </button>
              </div>
            </section>

            {/* Color Palette Brush Bar */}
            <section className="palette-section">
              <ColorPalette
                selectedColor={selectedColor}
                onSelectColor={setSelectedColor}
                stickerCounts={stickerCounts}
              />
            </section>

            {/* Visualizers Container */}
            <section className={`visualizers-grid view-${viewMode}`}>
              {(viewMode === 'dual' || viewMode === '3d') && (
                <div className="viewer-pane pane-3d">
                  <div className="pane-header">
                    <Box size={16} className="text-accent" />
                    <h3>3D Interactive Cube</h3>
                  </div>
                  <Cube3DView
                    cubeState={cubeState}
                    onPaintSticker={handlePaintSticker}
                    isSolving={isSolving}
                    animatingMove={animatingMove}
                    onAnimationComplete={handleAnimationComplete}
                    onOrientationChange={setViewOrientation}
                    onQuickMove={handleApplyMove}
                  />
                </div>
              )}

              {(viewMode === 'dual' || viewMode === '2d') && (
                <div className="viewer-pane pane-2d">
                  <div className="pane-header">
                    <Grid3X3 size={16} className="text-accent" />
                    <h3>2D Unfolded Net (All 6 Faces)</h3>
                  </div>
                  <CubeNetView
                    cubeState={cubeState}
                    selectedColor={selectedColor}
                    onPaintSticker={handlePaintSticker}
                    disabled={isPlaying || !!animatingMove}
                  />
                </div>
              )}
            </section>

            {/* Lower Utility Panels: Manual Move Controls & Scramble Generator */}
            <section className="utilities-grid">
              <ManualControls
                onApplyMove={handleApplyMove}
                manualMoveCount={manualMoveCount}
                disabled={isPlaying}
              />
              <ScrambleGenerator
                onApplyScramble={handleScramble}
                disabled={isPlaying}
              />
            </section>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <p>
            Rubik's Cube Solver • Powered by Kociemba's Two-Phase Algorithm
          </p>
          <p className="footer-sub">
            Complete client-side implementation. No backend or external APIs required.
          </p>
        </div>
      </footer>

      {/* Validation Error Alert Dialog */}
      <ValidationAlert
        error={validationError}
        details={validationDetails}
        onDismiss={() => setValidationError(null)}
        onReset={handleReset}
      />

      {/* Notation Guide Modal */}
      <NotationGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
}
