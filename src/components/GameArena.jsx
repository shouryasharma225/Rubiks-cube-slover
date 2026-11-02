import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Play,
  RotateCcw,
  Shuffle,
  Lightbulb,
  Undo2,
  HelpCircle,
  Timer,
  Zap,
  CheckCircle2,
  Flame,
  Award,
  ChevronRight,
  ArrowRight,
  Keyboard,
  Clock,
  Sparkles,
  MoveVertical,
  MoveHorizontal,
  RefreshCw,
  Compass
} from 'lucide-react';
import { generateScramble } from '../solver/scrambler.js';
import { solveCube, solveOptimalOrInverse } from '../solver/solver.js';
import { isStateSolved, applyMove, applyMoves, COLOR_METADATA, FACE_DETAILS } from '../solver/cubeEngine.js';
import {
  getSavedLeaderboard,
  saveLeaderboard,
  getPlayerAlias
} from './GameLeaderboard.jsx';

// Format milliseconds as mm:ss.ms
function formatTimer(ms) {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const hundredths = Math.floor((ms % 1000) / 10);
  const pad = (n, len = 2) => String(n).padStart(len, '0');
  return `${pad(minutes)}:${pad(seconds)}.${pad(hundredths)}`;
}

export function GameArena({
  cubeState,
  viewOrientation = { front: 'F', right: 'R', up: 'U', left: 'L', down: 'D', back: 'B' },
  onApplyGameMove,
  onResetGameCube,
  onScrambleGameCube,
  playTurnSound,
  playSolvedChime,
  onShowSolver,
  onSolveRecorded,
  externalScramble
}) {
  // Game Configuration
  const [difficulty, setDifficulty] = useState('medium'); // 'easy' (6), 'medium' (12), 'wca' (22)
  const [scrambleString, setScrambleString] = useState('');
  const [currentScrambleMoves, setCurrentScrambleMoves] = useState([]);

  // Game Engine State
  const [gameState, setGameState] = useState('ready'); // 'ready' | 'running' | 'solved'
  const [elapsedMs, setElapsedMs] = useState(0);
  const [moveCount, setMoveCount] = useState(0);
  const [movesHistory, setMovesHistory] = useState([]);
  const [hint, setHint] = useState(null);
  const [activeHintPlan, setActiveHintPlan] = useState([]);
  const [isHintLoading, setIsHintLoading] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  const [isNewPb, setIsNewPb] = useState(false);
  const [leaderboardRank, setLeaderboardRank] = useState(null);
  const [recentSolveId, setRecentSolveId] = useState(null);

  // Timer Ref
  const timerStartRef = useRef(null);
  const animFrameRef = useRef(null);

  // Personal Bests from LocalStorage
  const [personalBests, setPersonalBests] = useState(() => {
    try {
      const saved = localStorage.getItem('rcs_game_pbs');
      return saved ? JSON.parse(saved) : { easy: null, medium: null, wca: null };
    } catch {
      return { easy: null, medium: null, wca: null };
    }
  });

  // Generate new game scramble based on difficulty
  const startNewGame = useCallback((diffLevel = difficulty) => {
    let moveCountTarget = 12;
    if (diffLevel === 'easy') moveCountTarget = 6;
    else if (diffLevel === 'wca') moveCountTarget = 22;

    const generated = generateScramble(moveCountTarget);
    setScrambleString(generated.scrambleString);
    setCurrentScrambleMoves(generated.moves);
    setGameState('ready');
    setElapsedMs(0);
    setMoveCount(0);
    setMovesHistory([]);
    setHint(null);
    setActiveHintPlan([]);
    setShowVictoryModal(false);
    setIsNewPb(false);
    setLeaderboardRank(null);

    // Apply scramble to cube
    onScrambleGameCube(generated.moves);
  }, [difficulty, onScrambleGameCube]);

  // Handle external scramble requested from leaderboard race
  useEffect(() => {
    if (externalScramble && externalScramble.scramble) {
      const moves = externalScramble.scramble.trim().split(/\s+/);
      if (moves.length > 0) {
        setDifficulty(externalScramble.difficulty || 'medium');
        setScrambleString(externalScramble.scramble);
        setCurrentScrambleMoves(moves);
        setGameState('ready');
        setElapsedMs(0);
        setMoveCount(0);
        setMovesHistory([]);
        setHint(null);
        setActiveHintPlan([]);
        setShowVictoryModal(false);
        setIsNewPb(false);
        setLeaderboardRank(null);
        onScrambleGameCube(moves);
      }
    }
  }, [externalScramble, onScrambleGameCube]);

  // Restart identical scramble
  const restartSameScramble = useCallback(() => {
    if (!currentScrambleMoves.length) return;
    setGameState('ready');
    setElapsedMs(0);
    setMoveCount(0);
    setMovesHistory([]);
    setHint(null);
    setActiveHintPlan([]);
    setShowVictoryModal(false);
    setLeaderboardRank(null);
    onScrambleGameCube(currentScrambleMoves);
  }, [currentScrambleMoves, onScrambleGameCube]);

  // Initial game setup on mount
  useEffect(() => {
    startNewGame(difficulty);
  }, []);

  // Timer Loop using requestAnimationFrame for millisecond precision
  useEffect(() => {
    if (gameState === 'running') {
      timerStartRef.current = performance.now() - elapsedMs;

      const updateTimer = () => {
        setElapsedMs(performance.now() - timerStartRef.current);
        animFrameRef.current = requestAnimationFrame(updateTimer);
      };

      animFrameRef.current = requestAnimationFrame(updateTimer);
    } else {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    }

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [gameState]);

  // Check solved condition & record to Leaderboard
  useEffect(() => {
    if (gameState === 'running' && moveCount > 0 && isStateSolved(cubeState)) {
      setGameState('solved');
      playSolvedChime();
      confetti({
        particleCount: 120,
        spread: 85,
        origin: { y: 0.55 }
      });

      // Check if new personal best
      const currentPb = personalBests[difficulty];
      const isRecord = !currentPb || elapsedMs < currentPb;
      if (isRecord) {
        setIsNewPb(true);
        const updatedPbs = { ...personalBests, [difficulty]: Math.round(elapsedMs) };
        setPersonalBests(updatedPbs);
        try {
          localStorage.setItem('rcs_game_pbs', JSON.stringify(updatedPbs));
        } catch (e) {
          console.warn(e);
        }
      }

      // Auto-record solve into Leaderboard
      const playerName = getPlayerAlias();
      const currentTps = Number((moveCount / Math.max(elapsedMs / 1000, 0.01)).toFixed(2));
      const solveEntry = {
        id: `solve_${Date.now()}`,
        playerName: playerName || 'SpeedCuber',
        isUser: true,
        difficulty,
        timeMs: Math.round(elapsedMs),
        moves: moveCount,
        tps: currentTps,
        date: new Date().toISOString(),
        scramble: scrambleString
      };

      const existingLb = getSavedLeaderboard();
      const updatedLb = [solveEntry, ...existingLb];
      saveLeaderboard(updatedLb);

      // Compute rank in category
      const categoryEntries = updatedLb
        .filter(r => r.difficulty === difficulty)
        .sort((a, b) => a.timeMs - b.timeMs);
      const computedRank = categoryEntries.findIndex(r => r.id === solveEntry.id) + 1;
      setLeaderboardRank(computedRank);
      setRecentSolveId(solveEntry.id);

      if (typeof onSolveRecorded === 'function') {
        onSolveRecorded(solveEntry);
      }

      setShowVictoryModal(true);
    }
  }, [cubeState, gameState, moveCount, elapsedMs, difficulty, personalBests, playSolvedChime, scrambleString, onSolveRecorded]);

  // Helper to construct rich perspective-aware hint metadata from a solution plan
  const buildHintFromPlan = useCallback((plan, stateForValidation = cubeState) => {
    if (!plan || plan.length === 0 || isStateSolved(stateForValidation)) {
      return {
        move: 'Solved',
        targetFace: null,
        isPrime: false,
        is2: false,
        isSlice: false,
        colorName: 'Cube',
        colorHex: '#16A34A',
        screenRole: 'Solved',
        remaining: 0,
        sequence: '',
        desc: 'Cube is solved! Congratulations!'
      };
    }

    const nextMove = plan[0];
    const baseFace = nextMove[0].toUpperCase();
    const isPrime = nextMove.includes("'");
    const is2 = nextMove.includes('2');
    const isSlice = ['M', 'E', 'S'].includes(baseFace);

    let colorName = baseFace;
    let colorHex = '#6366F1';
    let screenRole = '';

    if (!isSlice) {
      const colorKey = FACE_DETAILS[baseFace]?.defaultColor || 'white';
      colorName = COLOR_METADATA[colorKey]?.name || baseFace;
      colorHex = COLOR_METADATA[colorKey]?.hex || '#fff';

      if (viewOrientation.front === baseFace) screenRole = 'Front Face';
      else if (viewOrientation.right === baseFace) screenRole = 'Right Face';
      else if (viewOrientation.up === baseFace) screenRole = 'Top Face';
      else if (viewOrientation.left === baseFace) screenRole = 'Left Face';
      else if (viewOrientation.down === baseFace) screenRole = 'Bottom Face';
      else if (viewOrientation.back === baseFace) screenRole = 'Back Face';
    } else {
      if (baseFace === 'M') { screenRole = 'Middle Slice'; colorName = 'Middle Vertical Slice (M)'; }
      else if (baseFace === 'E') { screenRole = 'Equator Slice'; colorName = 'Equator Horizontal Slice (E)'; }
      else if (baseFace === 'S') { screenRole = 'Standing Slice'; colorName = 'Standing Center Slice (S)'; }
    }

    const directionDesc = is2
      ? '180° (Turn Twice)'
      : isPrime
      ? 'Counter-Clockwise'
      : 'Clockwise';

    const fullDesc = isSlice
      ? `Turn ${colorName} ${directionDesc} (Move: ${nextMove})`
      : `Turn ${colorName} (${screenRole}) ${directionDesc} (Move: ${nextMove})`;

    return {
      move: nextMove,
      targetFace: baseFace,
      isPrime,
      is2,
      isSlice,
      colorName,
      colorHex,
      screenRole,
      remaining: plan.length,
      sequence: plan.slice(0, 5).join(' → '),
      desc: fullDesc
    };
  }, [cubeState, viewOrientation]);

  // Make a turn
  const handleGameTurn = (move) => {
    if (gameState === 'solved') return;

    // Start timer on first move
    if (gameState === 'ready') {
      setGameState('running');
    }

    onApplyGameMove(move);
    setMoveCount(c => c + 1);
    const updatedHistory = [...movesHistory, move];
    setMovesHistory(updatedHistory);

    // If hint is active, smoothly step the hint forward and decrement remaining count
    if (hint) {
      if (activeHintPlan && activeHintPlan.length > 0 && activeHintPlan[0] === move) {
        const remainingPlan = activeHintPlan.slice(1);
        setActiveHintPlan(remainingPlan);
        const nextState = applyMove(cubeState, move);

        if (remainingPlan.length === 0 || isStateSolved(nextState)) {
          setHint({ move: 'Solved', remaining: 0, desc: '🎉 Solved in planned moves!' });
        } else {
          setHint(buildHintFromPlan(remainingPlan, nextState));
        }
      } else {
        // User turned a different move - recompute optimal solution from new state
        const nextState = applyMove(cubeState, move);
        if (isStateSolved(nextState)) {
          setHint({ move: 'Solved', remaining: 0, desc: '🎉 Solved!' });
          setActiveHintPlan([]);
        } else {
          solveOptimalOrInverse(nextState, currentScrambleMoves, updatedHistory).then((sol) => {
            if (sol.success && sol.moves.length > 0) {
              setActiveHintPlan(sol.moves);
              setHint(buildHintFromPlan(sol.moves, nextState));
            } else {
              setHint(null);
            }
          }).catch(() => setHint(null));
        }
      }
    }
  };

  // Get face metadata for dynamic display
  const getFaceMeta = (role) => {
    const faceKey = viewOrientation[role] || 'F';
    const colorKey = FACE_DETAILS[faceKey]?.defaultColor || 'green';
    const meta = COLOR_METADATA[colorKey] || { name: 'Green', hex: '#16A34A' };
    return {
      faceKey,
      colorKey,
      name: meta.name,
      hex: meta.hex
    };
  };

  const frontMeta = getFaceMeta('front');
  const rightMeta = getFaceMeta('right');
  const upMeta = getFaceMeta('up');
  const leftMeta = getFaceMeta('left');
  const downMeta = getFaceMeta('down');
  const backMeta = getFaceMeta('back');

  // Turn relative to user's current 3D view perspective
  const handleRelativeTurn = (role, isPrime = false) => {
    const physicalFace = viewOrientation[role] || 'F';
    const move = isPrime ? `${physicalFace}'` : physicalFace;
    handleGameTurn(move);
  };

  // Undo previous move
  const handleUndo = () => {
    if (!movesHistory.length || gameState === 'solved') return;
    const lastMove = movesHistory[movesHistory.length - 1];
    let reverseMove = lastMove;
    if (lastMove.includes('2')) {
      reverseMove = lastMove;
    } else if (lastMove.includes("'")) {
      reverseMove = lastMove[0];
    } else {
      reverseMove = `${lastMove}'`;
    }

    onApplyGameMove(reverseMove);
    const updatedHistory = movesHistory.slice(0, -1);
    setMovesHistory(updatedHistory);
    setMoveCount(c => Math.max(0, c - 1));

    if (hint) {
      const prevState = applyMove(cubeState, reverseMove);
      solveOptimalOrInverse(prevState, currentScrambleMoves, updatedHistory).then((sol) => {
        if (sol.success && sol.moves.length > 0) {
          setActiveHintPlan(sol.moves);
          setHint(buildHintFromPlan(sol.moves, prevState));
        } else {
          setHint(null);
        }
      }).catch(() => setHint(null));
    }
  };

  // Calculate smart, deterministic optimal AI Hint
  const handleGetHint = async () => {
    if (gameState === 'solved' || isHintLoading) return;
    if (isStateSolved(cubeState)) {
      setHint({ move: 'Solved', remaining: 0, desc: 'Cube is already solved! Congratulations!' });
      setActiveHintPlan([]);
      return;
    }

    setIsHintLoading(true);
    try {
      // Check if existing plan is still valid for this state
      if (activeHintPlan && activeHintPlan.length > 0) {
        if (isStateSolved(applyMoves(cubeState, activeHintPlan))) {
          const newHint = buildHintFromPlan(activeHintPlan, cubeState);
          setHint(newHint);
          setIsHintLoading(false);
          return;
        }
      }

      const sol = await solveOptimalOrInverse(cubeState, currentScrambleMoves, movesHistory);
      if (sol.success && sol.moves.length > 0) {
        setActiveHintPlan(sol.moves);
        const newHint = buildHintFromPlan(sol.moves, cubeState);
        setHint(newHint);
      } else {
        setHint({
          error: true,
          desc: sol.error || 'Could not compute a solution for this cube position.'
        });
      }
    } catch (err) {
      console.warn('Hint solver error:', err);
      setHint({
        error: true,
        desc: 'Could not compute hint. Try another move first!'
      });
    } finally {
      setIsHintLoading(false);
    }
  };

  // Keyboard speedcubing controls with view-relative mapping and center slice keys
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      const key = e.key.toUpperCase();
      const isShift = e.shiftKey;

      // View-relative face turns (Front = whichever face is currently in front)
      if (key === 'F') {
        e.preventDefault();
        handleRelativeTurn('front', isShift);
        return;
      }
      if (key === 'R') {
        e.preventDefault();
        handleRelativeTurn('right', isShift);
        return;
      }
      if (key === 'U') {
        e.preventDefault();
        handleRelativeTurn('up', isShift);
        return;
      }
      if (key === 'L') {
        e.preventDefault();
        handleRelativeTurn('left', isShift);
        return;
      }
      if (key === 'D') {
        e.preventDefault();
        handleRelativeTurn('down', isShift);
        return;
      }
      if (key === 'B') {
        e.preventDefault();
        handleRelativeTurn('back', isShift);
        return;
      }

      // Center layer slice moves: M, E, S
      if (key === 'M') {
        e.preventDefault();
        handleGameTurn(isShift ? "M'" : 'M');
        return;
      }
      if (key === 'E') {
        e.preventDefault();
        handleGameTurn(isShift ? "E'" : 'E');
        return;
      }
      if (key === 'S') {
        e.preventDefault();
        handleGameTurn(isShift ? "S'" : 'S');
        return;
      }

      // Space to start / restart
      if (e.code === 'Space' && gameState === 'ready') {
        e.preventDefault();
        setGameState('running');
      }

      // Z to Undo
      if (key === 'Z' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleUndo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, movesHistory, viewOrientation]);

  const currentPb = personalBests[difficulty];
  const tps = elapsedMs > 1000 ? (moveCount / (elapsedMs / 1000)).toFixed(1) : '0.0';

  return (
    <div className="game-arena-wrapper">
      {/* Top Game Navigation & Difficulty Header */}
      <div className="game-top-bar">
        <div className="difficulty-selector-group">
          <span className="diff-label">Difficulty:</span>
          <button
            type="button"
            className={`diff-pill-btn diff-easy ${difficulty === 'easy' ? 'active' : ''}`}
            onClick={() => {
              setDifficulty('easy');
              startNewGame('easy');
            }}
          >
            🟢 Easy (6 Moves)
          </button>
          <button
            type="button"
            className={`diff-pill-btn diff-medium ${difficulty === 'medium' ? 'active' : ''}`}
            onClick={() => {
              setDifficulty('medium');
              startNewGame('medium');
            }}
          >
            🟡 Medium (12 Moves)
          </button>
          <button
            type="button"
            className={`diff-pill-btn diff-wca ${difficulty === 'wca' ? 'active' : ''}`}
            onClick={() => {
              setDifficulty('wca');
              startNewGame('wca');
            }}
          >
            🔴 WCA Standard (22 Moves)
          </button>
        </div>

        <div className="game-actions-right">
          <button
            type="button"
            className="game-action-btn btn-view-leaderboard"
            onClick={() => {
              const el = document.getElementById('game-leaderboard');
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            title="Jump to Speedcubing Leaderboard"
          >
            <Trophy size={15} className="trophy-gold" />
            <span>Leaderboard</span>
          </button>

          <button
            type="button"
            className="game-action-btn"
            onClick={restartSameScramble}
            title="Reset this scramble"
          >
            <RotateCcw size={15} />
            <span>Restart</span>
          </button>

          <button
            type="button"
            className="game-action-btn btn-new-game"
            onClick={() => startNewGame()}
            title="Generate a fresh scrambled cube"
          >
            <Shuffle size={15} />
            <span>New Scramble</span>
          </button>
        </div>
      </div>

      {/* Scramble Ribbon */}
      <div className="scramble-card">
        <span className="scramble-badge">Scramble</span>
        <span className="scramble-text">{scrambleString || 'Generating scramble...'}</span>
      </div>

      {/* Speedcube Game HUD (Timer, Moves, TPS, PB) */}
      <div className="game-hud-grid">
        {/* Main Timer Display */}
        <div className={`hud-card timer-card ${gameState}`}>
          <div className="hud-label">
            <Timer size={15} />
            <span>Game Timer</span>
          </div>
          <div className="hud-timer-value">
            {formatTimer(elapsedMs)}
          </div>
          <div className="hud-timer-status">
            {gameState === 'ready' && 'Press any turn button or move a face to start!'}
            {gameState === 'running' && 'Timer Running • Solve all 6 faces!'}
            {gameState === 'solved' && '🎉 SOLVED! Great solve!'}
          </div>
        </div>

        {/* Moves Counter */}
        <div className="hud-card moves-card">
          <div className="hud-label">
            <Flame size={15} />
            <span>Moves Count</span>
          </div>
          <div className="hud-stat-value">{moveCount}</div>
          <div className="hud-sub-stat">{tps} turns / sec (TPS)</div>
        </div>

        {/* Personal Best Card */}
        <div className="hud-card pb-card">
          <div className="hud-label">
            <Trophy size={15} className="trophy-icon" />
            <span>Personal Best ({difficulty})</span>
          </div>
          <div className="hud-stat-value">
            {currentPb ? formatTimer(currentPb) : '--:--.--'}
          </div>
          <div
            className="hud-sub-stat lb-link-clickable"
            onClick={() => {
              const el = document.getElementById('game-leaderboard');
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            title="Click to view full Leaderboard"
          >
            {currentPb ? 'Best recorded solve • View Leaderboard ↓' : 'No solves yet • View Leaderboard ↓'}
          </div>
        </div>
      </div>

      {/* Game Turn Controls & Virtual Pad */}
      <div className="game-controls-section">
        <div className="game-controls-header">
          <div className="controls-title">
            <span>Interactive Move Pad</span>
            <span className="controls-sub">Click to turn faces or use your keyboard</span>
          </div>

          <div className="assists-group">
            <button
              type="button"
              className="assist-btn btn-hint"
              onClick={handleGetHint}
              disabled={gameState === 'solved' || isHintLoading}
              title="Get next optimal move hint"
            >
              <Lightbulb size={16} />
              <span>{isHintLoading ? 'Thinking...' : 'Need a Hint?'}</span>
            </button>

            <button
              type="button"
              className="assist-btn btn-undo"
              onClick={handleUndo}
              disabled={!movesHistory.length || gameState === 'solved'}
              title="Undo last move (Ctrl+Z)"
            >
              <Undo2 size={16} />
              <span>Undo</span>
            </button>

            <button
              type="button"
              className="assist-btn"
              onClick={() => setShowKeyboardHelp(prev => !prev)}
              title="Toggle Keyboard Shortcuts"
            >
              <Keyboard size={16} />
              <span>Keys</span>
            </button>
          </div>
        </div>

        {/* Active 3D Face Orientation Status Banner */}
        <div className="game-view-orientation-bar">
          <div className="orient-status-left">
            <span className="orient-badge-tag">Current 3D Facing:</span>
            <div className="orient-face-pill" style={{ borderColor: frontMeta.hex }}>
              <span className="orient-dot" style={{ backgroundColor: frontMeta.hex }} />
              <strong>Front: {frontMeta.name} ({frontMeta.faceKey})</strong>
            </div>
            <div className="orient-face-pill-mini" style={{ borderColor: rightMeta.hex }}>
              <span className="orient-dot-sm" style={{ backgroundColor: rightMeta.hex }} />
              <span>Right: {rightMeta.name} ({rightMeta.faceKey})</span>
            </div>
            <div className="orient-face-pill-mini" style={{ borderColor: upMeta.hex }}>
              <span className="orient-dot-sm" style={{ backgroundColor: upMeta.hex }} />
              <span>Top: {upMeta.name} ({upMeta.faceKey})</span>
            </div>
          </div>
          <div className="orient-status-right">
            <span>Drag 3D cube to rotate angle • Turns match whatever faces you!</span>
          </div>
        </div>

        {/* Live Hint Alert Banner */}
        {hint && (
          <div className={`game-hint-banner ${hint.error ? 'hint-banner-error' : ''}`}>
            {hint.error ? (
              <div className="hint-error-wrap">
                <AlertTriangle size={18} className="text-warning" />
                <span>{hint.desc}</span>
                <button type="button" className="btn-retry-hint" onClick={handleGetHint}>
                  Retry Hint
                </button>
              </div>
            ) : (
              <>
                <div className="hint-header-line">
                  <Sparkles size={18} className="hint-sparkle text-accent" />
                  {hint.move && (
                    <span
                      className="hint-move-chip"
                      style={{
                        backgroundColor: hint.colorHex,
                        color: hint.colorName === 'White' || hint.colorName === 'Yellow' ? '#000' : '#fff'
                      }}
                    >
                      {hint.move}
                    </span>
                  )}
                  <div className="hint-content">
                    <div className="hint-main-instruction">
                      <strong>{hint.desc}</strong>
                    </div>
                    <div className="hint-meta-row">
                      {hint.sequence && (
                        <span className="hint-sequence-preview">Sequence: <code>{hint.sequence}</code></span>
                      )}
                      <span className="hint-remaining">• {hint.remaining} {hint.remaining === 1 ? 'move' : 'moves'} left to solve</span>
                    </div>
                  </div>
                </div>
                {hint.move !== 'Solved' && (
                  <button
                    type="button"
                    className="btn-apply-hint"
                    onClick={() => handleGameTurn(hint.move)}
                    title={`Apply ${hint.move}`}
                  >
                    <span>Apply {hint.move}</span>
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* Primary View-Relative Move Buttons Grid */}
        <div className="turn-buttons-grid">
          {/* Front Layer (Dynamically matches facing face) */}
          <div className="turn-btn-pair" style={{ '--accent-c': frontMeta.hex }}>
            <button
              type="button"
              className={`turn-btn face-f ${hint && hint.targetFace === frontMeta.faceKey && (!hint.isPrime || hint.is2) ? 'hint-target-pulsing' : ''}`}
              onClick={() => handleRelativeTurn('front', false)}
              title={`Turn Front Clockwise (${frontMeta.name} Face)`}
            >
              <span className="key-badge" style={{ backgroundColor: frontMeta.hex, color: frontMeta.colorKey === 'white' || frontMeta.colorKey === 'yellow' ? '#000' : '#fff' }}>
                {frontMeta.faceKey}
              </span>
              <span>Front Clockwise ({frontMeta.name}) {hint && hint.targetFace === frontMeta.faceKey && hint.is2 ? '(Turn 2×)' : ''}</span>
            </button>
            <button
              type="button"
              className={`turn-btn face-f turn-prime ${hint && hint.targetFace === frontMeta.faceKey && (hint.isPrime || hint.is2) ? 'hint-target-pulsing' : ''}`}
              onClick={() => handleRelativeTurn('front', true)}
              title={`Turn Front Counter (${frontMeta.name} Face)`}
            >
              <span className="key-badge" style={{ backgroundColor: frontMeta.hex, color: frontMeta.colorKey === 'white' || frontMeta.colorKey === 'yellow' ? '#000' : '#fff' }}>
                {frontMeta.faceKey}'
              </span>
              <span>Front Counter ({frontMeta.name})</span>
            </button>
          </div>

          {/* Right Layer */}
          <div className="turn-btn-pair" style={{ '--accent-c': rightMeta.hex }}>
            <button
              type="button"
              className={`turn-btn face-r ${hint && hint.targetFace === rightMeta.faceKey && (!hint.isPrime || hint.is2) ? 'hint-target-pulsing' : ''}`}
              onClick={() => handleRelativeTurn('right', false)}
              title={`Turn Right Clockwise (${rightMeta.name} Face)`}
            >
              <span className="key-badge" style={{ backgroundColor: rightMeta.hex, color: rightMeta.colorKey === 'white' || rightMeta.colorKey === 'yellow' ? '#000' : '#fff' }}>
                {rightMeta.faceKey}
              </span>
              <span>Right Clockwise ({rightMeta.name}) {hint && hint.targetFace === rightMeta.faceKey && hint.is2 ? '(Turn 2×)' : ''}</span>
            </button>
            <button
              type="button"
              className={`turn-btn face-r turn-prime ${hint && hint.targetFace === rightMeta.faceKey && (hint.isPrime || hint.is2) ? 'hint-target-pulsing' : ''}`}
              onClick={() => handleRelativeTurn('right', true)}
              title={`Turn Right Counter (${rightMeta.name} Face)`}
            >
              <span className="key-badge" style={{ backgroundColor: rightMeta.hex, color: rightMeta.colorKey === 'white' || rightMeta.colorKey === 'yellow' ? '#000' : '#fff' }}>
                {rightMeta.faceKey}'
              </span>
              <span>Right Counter ({rightMeta.name})</span>
            </button>
          </div>

          {/* Top (Up) Layer */}
          <div className="turn-btn-pair" style={{ '--accent-c': upMeta.hex }}>
            <button
              type="button"
              className={`turn-btn face-u ${hint && hint.targetFace === upMeta.faceKey && (!hint.isPrime || hint.is2) ? 'hint-target-pulsing' : ''}`}
              onClick={() => handleRelativeTurn('up', false)}
              title={`Turn Top Clockwise (${upMeta.name} Face)`}
            >
              <span className="key-badge" style={{ backgroundColor: upMeta.hex, color: upMeta.colorKey === 'white' || upMeta.colorKey === 'yellow' ? '#000' : '#fff' }}>
                {upMeta.faceKey}
              </span>
              <span>Top Clockwise ({upMeta.name}) {hint && hint.targetFace === upMeta.faceKey && hint.is2 ? '(Turn 2×)' : ''}</span>
            </button>
            <button
              type="button"
              className={`turn-btn face-u turn-prime ${hint && hint.targetFace === upMeta.faceKey && (hint.isPrime || hint.is2) ? 'hint-target-pulsing' : ''}`}
              onClick={() => handleRelativeTurn('up', true)}
              title={`Turn Top Counter (${upMeta.name} Face)`}
            >
              <span className="key-badge" style={{ backgroundColor: upMeta.hex, color: upMeta.colorKey === 'white' || upMeta.colorKey === 'yellow' ? '#000' : '#fff' }}>
                {upMeta.faceKey}'
              </span>
              <span>Top Counter ({upMeta.name})</span>
            </button>
          </div>

          {/* Left Layer */}
          <div className="turn-btn-pair" style={{ '--accent-c': leftMeta.hex }}>
            <button
              type="button"
              className={`turn-btn face-l ${hint && hint.targetFace === leftMeta.faceKey && (!hint.isPrime || hint.is2) ? 'hint-target-pulsing' : ''}`}
              onClick={() => handleRelativeTurn('left', false)}
              title={`Turn Left Clockwise (${leftMeta.name} Face)`}
            >
              <span className="key-badge" style={{ backgroundColor: leftMeta.hex, color: leftMeta.colorKey === 'white' || leftMeta.colorKey === 'yellow' ? '#000' : '#fff' }}>
                {leftMeta.faceKey}
              </span>
              <span>Left Clockwise ({leftMeta.name}) {hint && hint.targetFace === leftMeta.faceKey && hint.is2 ? '(Turn 2×)' : ''}</span>
            </button>
            <button
              type="button"
              className={`turn-btn face-l turn-prime ${hint && hint.targetFace === leftMeta.faceKey && (hint.isPrime || hint.is2) ? 'hint-target-pulsing' : ''}`}
              onClick={() => handleRelativeTurn('left', true)}
              title={`Turn Left Counter (${leftMeta.name} Face)`}
            >
              <span className="key-badge" style={{ backgroundColor: leftMeta.hex, color: leftMeta.colorKey === 'white' || leftMeta.colorKey === 'yellow' ? '#000' : '#fff' }}>
                {leftMeta.faceKey}'
              </span>
              <span>Left Counter ({leftMeta.name})</span>
            </button>
          </div>

          {/* Bottom (Down) Layer */}
          <div className="turn-btn-pair" style={{ '--accent-c': downMeta.hex }}>
            <button
              type="button"
              className={`turn-btn face-d ${hint && hint.targetFace === downMeta.faceKey && (!hint.isPrime || hint.is2) ? 'hint-target-pulsing' : ''}`}
              onClick={() => handleRelativeTurn('down', false)}
              title={`Turn Bottom Clockwise (${downMeta.name} Face)`}
            >
              <span className="key-badge" style={{ backgroundColor: downMeta.hex, color: downMeta.colorKey === 'white' || downMeta.colorKey === 'yellow' ? '#000' : '#fff' }}>
                {downMeta.faceKey}
              </span>
              <span>Bottom Clockwise ({downMeta.name}) {hint && hint.targetFace === downMeta.faceKey && hint.is2 ? '(Turn 2×)' : ''}</span>
            </button>
            <button
              type="button"
              className={`turn-btn face-d turn-prime ${hint && hint.targetFace === downMeta.faceKey && (hint.isPrime || hint.is2) ? 'hint-target-pulsing' : ''}`}
              onClick={() => handleRelativeTurn('down', true)}
              title={`Turn Bottom Counter (${downMeta.name} Face)`}
            >
              <span className="key-badge" style={{ backgroundColor: downMeta.hex, color: downMeta.colorKey === 'white' || downMeta.colorKey === 'yellow' ? '#000' : '#fff' }}>
                {downMeta.faceKey}'
              </span>
              <span>Bottom Counter ({downMeta.name})</span>
            </button>
          </div>

          {/* Back Layer */}
          <div className="turn-btn-pair" style={{ '--accent-c': backMeta.hex }}>
            <button
              type="button"
              className={`turn-btn face-b ${hint && hint.targetFace === backMeta.faceKey && (!hint.isPrime || hint.is2) ? 'hint-target-pulsing' : ''}`}
              onClick={() => handleRelativeTurn('back', false)}
              title={`Turn Back Clockwise (${backMeta.name} Face)`}
            >
              <span className="key-badge" style={{ backgroundColor: backMeta.hex, color: backMeta.colorKey === 'white' || backMeta.colorKey === 'yellow' ? '#000' : '#fff' }}>
                {backMeta.faceKey}
              </span>
              <span>Back Clockwise ({backMeta.name}) {hint && hint.targetFace === backMeta.faceKey && hint.is2 ? '(Turn 2×)' : ''}</span>
            </button>
            <button
              type="button"
              className={`turn-btn face-b turn-prime ${hint && hint.targetFace === backMeta.faceKey && (hint.isPrime || hint.is2) ? 'hint-target-pulsing' : ''}`}
              onClick={() => handleRelativeTurn('back', true)}
              title={`Turn Back Counter (${backMeta.name} Face)`}
            >
              <span className="key-badge" style={{ backgroundColor: backMeta.hex, color: backMeta.colorKey === 'white' || backMeta.colorKey === 'yellow' ? '#000' : '#fff' }}>
                {backMeta.faceKey}'
              </span>
              <span>Back Counter ({backMeta.name})</span>
            </button>
          </div>
        </div>

        {/* Center Layer Slices Section */}
        <div className="center-slices-container">
          <div className="center-slices-heading">
            <MoveVertical size={16} className="text-accent" />
            <span className="center-title">Center Layer Slices</span>
            <span className="center-sub">Middle (M), Equator (E) & Standing (S)</span>
          </div>

          <div className="turn-buttons-grid center-slices-grid">
            {/* Middle Slice (M): Vertical center slice */}
            <div className="turn-btn-pair slice-pair">
              <button
                type="button"
                className={`turn-btn slice-btn ${hint && hint.targetFace === 'M' && (!hint.isPrime || hint.is2) ? 'hint-target-pulsing' : ''}`}
                onClick={() => handleGameTurn('M')}
                title="Turn Middle Slice Down (M)"
              >
                <span className="key-badge slice-badge">M</span>
                <span>Middle Slice Down</span>
              </button>
              <button
                type="button"
                className={`turn-btn slice-btn turn-prime ${hint && hint.targetFace === 'M' && (hint.isPrime || hint.is2) ? 'hint-target-pulsing' : ''}`}
                onClick={() => handleGameTurn("M'")}
                title="Turn Middle Slice Up (M')"
              >
                <span className="key-badge slice-badge">M'</span>
                <span>Middle Slice Up</span>
              </button>
            </div>

            {/* Equator Slice (E): Horizontal center slice */}
            <div className="turn-btn-pair slice-pair">
              <button
                type="button"
                className={`turn-btn slice-btn ${hint && hint.targetFace === 'E' && (!hint.isPrime || hint.is2) ? 'hint-target-pulsing' : ''}`}
                onClick={() => handleGameTurn('E')}
                title="Turn Equator Slice Right (E)"
              >
                <span className="key-badge slice-badge">E</span>
                <span>Equator Slice Right</span>
              </button>
              <button
                type="button"
                className={`turn-btn slice-btn turn-prime ${hint && hint.targetFace === 'E' && (hint.isPrime || hint.is2) ? 'hint-target-pulsing' : ''}`}
                onClick={() => handleGameTurn("E'")}
                title="Turn Equator Slice Left (E')"
              >
                <span className="key-badge slice-badge">E'</span>
                <span>Equator Slice Left</span>
              </button>
            </div>

            {/* Standing Slice (S): Front-parallel center slice */}
            <div className="turn-btn-pair slice-pair">
              <button
                type="button"
                className={`turn-btn slice-btn ${hint && hint.targetFace === 'S' && (!hint.isPrime || hint.is2) ? 'hint-target-pulsing' : ''}`}
                onClick={() => handleGameTurn('S')}
                title="Turn Standing Slice Clockwise (S)"
              >
                <span className="key-badge slice-badge">S</span>
                <span>Standing Slice CW</span>
              </button>
              <button
                type="button"
                className={`turn-btn slice-btn turn-prime ${hint && hint.targetFace === 'S' && (hint.isPrime || hint.is2) ? 'hint-target-pulsing' : ''}`}
                onClick={() => handleGameTurn("S'")}
                title="Turn Standing Slice Counter (S')"
              >
                <span className="key-badge slice-badge">S'</span>
                <span>Standing Slice CCW</span>
              </button>
            </div>
          </div>
        </div>

        {/* Keyboard Helper Collapsible Box */}
        {showKeyboardHelp && (
          <div className="keyboard-shortcuts-drawer">
            <div className="drawer-header">Speedcubing Keyboard Shortcuts (View-Relative)</div>
            <div className="keys-reference-grid">
              <div className="key-ref-item"><kbd>F</kbd> Front Clockwise</div>
              <div className="key-ref-item"><kbd>Shift + F</kbd> Front Counter</div>
              <div className="key-ref-item"><kbd>R</kbd> Right Clockwise</div>
              <div className="key-ref-item"><kbd>Shift + R</kbd> Right Counter</div>
              <div className="key-ref-item"><kbd>U</kbd> Top Clockwise</div>
              <div className="key-ref-item"><kbd>Shift + U</kbd> Top Counter</div>
              <div className="key-ref-item"><kbd>L</kbd> Left Clockwise</div>
              <div className="key-ref-item"><kbd>Shift + L</kbd> Left Counter</div>
              <div className="key-ref-item"><kbd>D</kbd> Down Clockwise</div>
              <div className="key-ref-item"><kbd>Shift + D</kbd> Down Counter</div>
              <div className="key-ref-item"><kbd>B</kbd> Back Clockwise</div>
              <div className="key-ref-item"><kbd>Shift + B</kbd> Back Counter</div>
              <div className="key-ref-item"><kbd>M</kbd> Middle Slice Down</div>
              <div className="key-ref-item"><kbd>Shift + M</kbd> Middle Slice Up</div>
              <div className="key-ref-item"><kbd>E</kbd> Equator Slice Right</div>
              <div className="key-ref-item"><kbd>Shift + E</kbd> Equator Slice Left</div>
              <div className="key-ref-item"><kbd>S</kbd> Standing Slice CW</div>
              <div className="key-ref-item"><kbd>Shift + S</kbd> Standing Slice CCW</div>
              <div className="key-ref-item"><kbd>Ctrl + Z</kbd> Undo Turn</div>
              <div className="key-ref-item"><kbd>Space</kbd> Start Timer</div>
            </div>
          </div>
        )}
      </div>

      {/* Victory Celebration Modal */}
      {showVictoryModal && (
        <div className="game-modal-backdrop" onClick={() => setShowVictoryModal(false)}>
          <div className="victory-modal-card" onClick={e => e.stopPropagation()}>
            <div className="victory-icon-wrap">
              <Trophy size={48} className="trophy-gold bounce-anim" />
            </div>

            <h2 className="victory-title">CUBE SOLVED!</h2>
            <p className="victory-desc">Outstanding work! You solved the Rubik's cube!</p>

            {isNewPb && (
              <div className="new-pb-banner">
                <Award size={18} />
                <span>NEW PERSONAL BEST ON {difficulty.toUpperCase()}!</span>
              </div>
            )}

            {leaderboardRank && (
              <div className="new-rank-banner">
                <Trophy size={18} className="trophy-gold" />
                <span>
                  LEADERBOARD RANK: <strong>#{leaderboardRank}</strong> ON {difficulty.toUpperCase()}!
                </span>
              </div>
            )}

            <div className="victory-stats-grid">
              <div className="v-stat-box">
                <div className="v-stat-label">Solve Time</div>
                <div className="v-stat-val text-accent">{formatTimer(elapsedMs)}</div>
              </div>

              <div className="v-stat-box">
                <div className="v-stat-label">Total Moves</div>
                <div className="v-stat-val">{moveCount}</div>
              </div>

              <div className="v-stat-box">
                <div className="v-stat-label">Speed (TPS)</div>
                <div className="v-stat-val">{tps}</div>
              </div>

              <div className="v-stat-box">
                <div className="v-stat-label">Level</div>
                <div className="v-stat-val">{difficulty.toUpperCase()}</div>
              </div>
            </div>

            <div className="victory-modal-actions">
              <button
                type="button"
                className="modal-action-btn btn-primary"
                onClick={() => {
                  setShowVictoryModal(false);
                  startNewGame();
                }}
              >
                <Shuffle size={18} />
                <span>Play Again (New Scramble)</span>
              </button>

              <button
                type="button"
                className="modal-action-btn btn-view-lb"
                onClick={() => {
                  setShowVictoryModal(false);
                  setTimeout(() => {
                    const el = document.getElementById('game-leaderboard');
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }, 120);
                }}
              >
                <Trophy size={16} className="trophy-gold" />
                <span>View on Leaderboard</span>
              </button>

              <button
                type="button"
                className="modal-action-btn btn-secondary"
                onClick={() => setShowVictoryModal(false)}
              >
                <span>Inspect Cube</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
