import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  BookOpen,
  GraduationCap,
  Play,
  Pause,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Clock,
  Sparkles,
  Info,
  Check,
  FastForward,
  Rewind,
  Eye,
  HelpCircle,
  Award
} from 'lucide-react';
import { TUTORIAL_STEPS } from '../data/cubeTutorialData.js';
import {
  getSolvedState,
  applyMove,
  applyMoves,
  cloneState,
  isStateSolved
} from '../solver/cubeEngine.js';
import { Cube3DView } from './Cube3DView.jsx';

// Move explanations for human readability
const MOVE_DESCRIPTIONS = {
  R: 'Right face Clockwise 90°',
  "R'": 'Right face Counter-Clockwise 90°',
  R2: 'Right face 180°',
  L: 'Left face Clockwise 90°',
  "L'": 'Left face Counter-Clockwise 90°',
  L2: 'Left face 180°',
  U: 'Up (Top) face Clockwise 90°',
  "U'": 'Up (Top) face Counter-Clockwise 90°',
  U2: 'Up (Top) face 180°',
  D: 'Down (Bottom) face Clockwise 90°',
  "D'": 'Down (Bottom) face Counter-Clockwise 90°',
  D2: 'Down (Bottom) face 180°',
  F: 'Front face Clockwise 90°',
  "F'": 'Front face Counter-Clockwise 90°',
  F2: 'Front face 180°',
  B: 'Back face Clockwise 90°',
  "B'": 'Back face Counter-Clockwise 90°',
  B2: 'Back face 180°'
};

export function LearnCube({ playTurnSound, playSolvedChime }) {
  // Active Step (0 to 6 for Steps 1 to 7)
  const [activeStepIdx, setActiveStepIdx] = useState(0);
  // Active Case within the current step
  const [activeCaseIdx, setActiveCaseIdx] = useState(0);

  const activeStep = TUTORIAL_STEPS[activeStepIdx] || TUTORIAL_STEPS[0];
  const activeCase = activeStep.cases[activeCaseIdx] || activeStep.cases[0];

  // Helper to generate the starting cube state for the active case
  const getInitialCaseState = useCallback((caseObj) => {
    const base = getSolvedState();
    if (!caseObj || !caseObj.initialScramble) return base;
    try {
      return applyMoves(base, caseObj.initialScramble);
    } catch {
      return base;
    }
  }, []);

  // 3D Visualizer State
  const [currentCubeState, setCurrentCubeState] = useState(() => getInitialCaseState(activeCase));
  const [animatingMove, setAnimatingMove] = useState(null);

  // Playback State
  const [currentMoveIdx, setCurrentMoveIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // 0.5, 1, 1.5, 2
  const [practiceCompleted, setPracticeCompleted] = useState(false);

  // When step or case changes, reset state to the new case's setup
  useEffect(() => {
    setIsPlaying(false);
    setAnimatingMove(null);
    setCurrentMoveIdx(0);
    setPracticeCompleted(false);
    const newInitial = getInitialCaseState(activeCase);
    setCurrentCubeState(newInitial);
  }, [activeStepIdx, activeCaseIdx, activeCase, getInitialCaseState]);

  // When active step changes, ensure case index is reset to 0
  const handleSelectStep = (idx) => {
    if (idx === activeStepIdx) return;
    setActiveStepIdx(idx);
    setActiveCaseIdx(0);
  };

  // Reset current case back to initial setup
  const handleResetCase = () => {
    setIsPlaying(false);
    setAnimatingMove(null);
    setCurrentMoveIdx(0);
    setPracticeCompleted(false);
    setCurrentCubeState(getInitialCaseState(activeCase));
    if (playTurnSound) playTurnSound();
  };

  // Execute a single move on the 3D cube with smooth animation
  const executeMove = useCallback((move, onDone) => {
    if (!move) return;
    const duration = Math.round(260 / playbackSpeed);
    setAnimatingMove({
      move,
      duration,
      id: Date.now(),
      onCompleteCallback: () => {
        setCurrentCubeState((prev) => applyMove(prev, move));
        setAnimatingMove(null);
        if (playTurnSound) playTurnSound();
        if (onDone) onDone();
      }
    });
  }, [playbackSpeed, playTurnSound]);

  // Step Forward in Algorithm
  const handleStepForward = () => {
    if (animatingMove || !activeCase.algorithm) return;
    if (currentMoveIdx >= activeCase.algorithm.length) {
      // Loop back to start if at end
      handleResetCase();
      return;
    }

    const move = activeCase.algorithm[currentMoveIdx];
    executeMove(move, () => {
      const nextIdx = currentMoveIdx + 1;
      setCurrentMoveIdx(nextIdx);
      if (nextIdx >= activeCase.algorithm.length) {
        setPracticeCompleted(true);
        if (playSolvedChime) playSolvedChime();
      }
    });
  };

  // Step Backward in Algorithm
  const handleStepBackward = () => {
    if (animatingMove || currentMoveIdx <= 0) return;
    const targetIdx = currentMoveIdx - 1;
    // Recompute state from initial up to targetIdx
    const initial = getInitialCaseState(activeCase);
    const movesSlice = activeCase.algorithm.slice(0, targetIdx);
    const computed = applyMoves(initial, movesSlice);
    setCurrentCubeState(computed);
    setCurrentMoveIdx(targetIdx);
    setPracticeCompleted(false);
    if (playTurnSound) playTurnSound();
  };

  // Auto-play loop
  useEffect(() => {
    if (!isPlaying || animatingMove || !activeCase.algorithm) return;

    if (currentMoveIdx >= activeCase.algorithm.length) {
      setIsPlaying(false);
      setPracticeCompleted(true);
      if (playSolvedChime) playSolvedChime();
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 }
      });
      return;
    }

    const timer = setTimeout(() => {
      const move = activeCase.algorithm[currentMoveIdx];
      executeMove(move, () => {
        setCurrentMoveIdx((prev) => prev + 1);
      });
    }, Math.round(450 / playbackSpeed));

    return () => clearTimeout(timer);
  }, [isPlaying, currentMoveIdx, activeCase.algorithm, animatingMove, playbackSpeed, executeMove, playSolvedChime]);

  const togglePlay = () => {
    if (currentMoveIdx >= activeCase.algorithm.length) {
      handleResetCase();
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  // Practice pad move execution
  const handlePracticeMove = (move) => {
    if (animatingMove) return;
    executeMove(move);
  };

  const currentMoveNotation = activeCase.algorithm?.[currentMoveIdx] || null;
  const currentMoveDesc = currentMoveNotation ? (MOVE_DESCRIPTIONS[currentMoveNotation] || currentMoveNotation) : 'Algorithm Idle';

  return (
    <div className="learn-cube-container">
      {/* Learn Header Banner */}
      <div className="learn-header-banner">
        <div className="learn-title-wrap">
          <div className="learn-badge-icon">
            <GraduationCap size={26} className="text-accent" />
          </div>
          <div>
            <div className="learn-kicker">
              <Sparkles size={14} className="text-warning" />
              <span>Interactive CFOP Foundation Masterclass</span>
            </div>
            <h2 className="learn-title">Learn How to Solve the Rubik's Cube</h2>
            <p className="learn-subtitle">
              Step-by-step masterclass with clear plain-English notes, finger-trick algorithms, and real-time interactive 3D simulations.
            </p>
          </div>
        </div>

        {/* Global Progress Indicator */}
        <div className="learn-progress-pill">
          <span className="prog-label">Step {activeStep.id} of 7</span>
          <div className="prog-track">
            <div
              className="prog-fill"
              style={{ width: `${(activeStep.id / 7) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* 7-Step Navigation Ribbon */}
      <div className="learn-steps-ribbon" role="tablist" aria-label="Tutorial Steps">
        {TUTORIAL_STEPS.map((step, idx) => {
          const isActive = idx === activeStepIdx;
          const isDone = idx < activeStepIdx;
          return (
            <button
              key={step.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`learn-step-pill ${isActive ? 'active' : ''} ${isDone ? 'completed' : ''}`}
              onClick={() => handleSelectStep(idx)}
            >
              <span className="step-badge-num" style={{ borderColor: step.badgeColor }}>
                {isDone ? <Check size={12} className="text-success" /> : step.stepNum}
              </span>
              <div className="step-pill-content">
                <span className="step-pill-name">{step.name}</span>
                <span className="step-pill-sub">{step.time}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Workspace Layout: Notes on Left, Sticky 3D Virtual Representation on Right */}
      <div className="learn-workspace-grid">
        {/* Left Column: Notes, Algorithms, and Explanations */}
        <div className="learn-notes-column">
          {/* Step Header Card */}
          <div className="learn-step-header-card">
            <div className="step-meta-row">
              <span className="step-number-tag">STEP {activeStep.stepNum}</span>
              <span className="step-diff-tag">{activeStep.difficulty}</span>
              <span className="step-time-tag">
                <Clock size={13} />
                <span>{activeStep.time}</span>
              </span>
            </div>

            <h3 className="step-main-title">{activeStep.title}</h3>
            <p className="step-lead-summary">{activeStep.summary}</p>

            {/* Case Selector Tabs if step has multiple situations */}
            {activeStep.cases.length > 1 && (
              <div className="case-selector-wrap">
                <div className="case-selector-label">Choose Situation / Pattern:</div>
                <div className="case-tabs-row" role="tablist">
                  {activeStep.cases.map((c, cIdx) => (
                    <button
                      key={c.id}
                      type="button"
                      role="tab"
                      aria-selected={cIdx === activeCaseIdx}
                      className={`case-tab-btn ${cIdx === activeCaseIdx ? 'active' : ''}`}
                      onClick={() => setActiveCaseIdx(cIdx)}
                    >
                      <span className="case-tab-name">{c.name}</span>
                      <span className="case-tab-tag">{c.tag}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Active Case Algorithm Showcase Card */}
          <div className="learn-algorithm-card">
            <div className="alg-card-header">
              <div>
                <span className="alg-case-tag">{activeCase.tag}</span>
                <h4 className="alg-case-title">{activeCase.name}</h4>
              </div>
              <button
                type="button"
                className="btn-replay-alg"
                onClick={handleResetCase}
                title="Reset 3D model to case start"
              >
                <RotateCcw size={14} />
                <span>Reset Case</span>
              </button>
            </div>

            <p className="alg-case-desc">{activeCase.description}</p>

            {/* Interactive Algorithm Sequence Visualizer */}
            <div className="alg-chips-display">
              <div className="alg-chips-label">Algorithm Sequence:</div>
              <div className="alg-chips-row">
                {activeCase.algorithm.map((mv, mIdx) => {
                  const isCurrent = mIdx === currentMoveIdx && isPlaying;
                  const isPassed = mIdx < currentMoveIdx;
                  return (
                    <span
                      key={`${mv}-${mIdx}`}
                      className={`alg-move-chip ${isCurrent ? 'current' : ''} ${isPassed ? 'passed' : ''}`}
                      title={`${mv}: ${MOVE_DESCRIPTIONS[mv] || mv}`}
                    >
                      {mv}
                    </span>
                  );
                })}
              </div>
              <div className="alg-active-hint">
                <Info size={14} className="text-accent" />
                <span>
                  <strong>Current Move ({currentMoveIdx + 1}/{activeCase.algorithm.length}):</strong>{' '}
                  {currentMoveDesc}
                </span>
              </div>
            </div>

            {/* Success Toast when algorithm is finished */}
            {practiceCompleted && (
              <div className="practice-success-toast">
                <CheckCircle2 size={18} className="text-success" />
                <div>
                  <strong>Great Job!</strong> You completed this step's algorithm sequence. Check the 3D model to see the result!
                </div>
              </div>
            )}
          </div>

          {/* Comprehensive Step Notes & Theory */}
          <div className="learn-theory-card">
            <h4 className="theory-card-title">
              <Lightbulb size={18} className="text-warning" />
              <span>Step Notes & Concept Guide</span>
            </h4>

            <div className="theory-sections-list">
              {/* Objective */}
              <div className="theory-item">
                <div className="theory-item-header">
                  <Award size={16} className="text-accent" />
                  <h5>The Objective</h5>
                </div>
                <p>{activeCase.notes.objective}</p>
              </div>

              {/* How it Works */}
              <div className="theory-item">
                <div className="theory-item-header">
                  <BookOpen size={16} className="text-success" />
                  <h5>How It Works (Mechanical Logic)</h5>
                </div>
                <p>{activeCase.notes.howItWorks}</p>
              </div>

              {/* Pro Tips */}
              <div className="theory-item pro-tip-item">
                <div className="theory-item-header">
                  <Sparkles size={16} className="text-warning" />
                  <h5>Pro Tip & Finger Trick</h5>
                </div>
                <p>{activeCase.notes.proTip}</p>
              </div>

              {/* Common Pitfalls */}
              {activeCase.notes.pitfalls && activeCase.notes.pitfalls.length > 0 && (
                <div className="theory-item pitfalls-item">
                  <div className="theory-item-header">
                    <AlertTriangle size={16} className="text-danger" />
                    <h5>Common Mistakes to Avoid</h5>
                  </div>
                  <ul className="pitfalls-list">
                    {activeCase.notes.pitfalls.map((pitfall, pIdx) => (
                      <li key={pIdx}>{pitfall}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Step Navigation Bottom Bar */}
          <div className="learn-step-nav-footer">
            <button
              type="button"
              className="btn-step-prev"
              onClick={() => handleSelectStep(Math.max(0, activeStepIdx - 1))}
              disabled={activeStepIdx === 0}
            >
              <ChevronLeft size={16} />
              <span>Previous Step</span>
            </button>

            <div className="step-footer-indicator">
              Step {activeStepIdx + 1} of {TUTORIAL_STEPS.length}
            </div>

            <button
              type="button"
              className="btn-step-next"
              onClick={() => handleSelectStep(Math.min(TUTORIAL_STEPS.length - 1, activeStepIdx + 1))}
              disabled={activeStepIdx === TUTORIAL_STEPS.length - 1}
            >
              <span>Next Step</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Right Column: Sticky Live 3D Virtual Representation */}
        <div className="learn-3d-column">
          <div className="learn-3d-sticky-card">
            <div className="viewer-header">
              <div className="viewer-title-group">
                <Eye size={16} className="text-accent" />
                <h4>Interactive 3D Virtual Model</h4>
              </div>
              <span className="viewer-status-badge">
                {isPlaying ? 'Animating Moves...' : practiceCompleted ? 'Case Solved' : 'Interactive'}
              </span>
            </div>

            {/* 3D Interactive Three.js Cube View */}
            <div className="learn-3d-viewport-wrap">
              <Cube3DView
                cubeState={currentCubeState}
                animatingMove={animatingMove}
                isSolving={isPlaying}
              />
            </div>

            {/* 3D Algorithm Playback Bar */}
            <div className="learn-playback-panel">
              <div className="playback-controls-row">
                <button
                  type="button"
                  className="btn-pb-action"
                  onClick={handleResetCase}
                  title="Reset to starting state"
                  aria-label="Reset State"
                >
                  <RotateCcw size={16} />
                </button>

                <button
                  type="button"
                  className="btn-pb-action"
                  onClick={handleStepBackward}
                  disabled={isPlaying || currentMoveIdx <= 0}
                  title="Step back 1 move"
                  aria-label="Step Back"
                >
                  <Rewind size={16} />
                </button>

                <button
                  type="button"
                  className={`btn-pb-play ${isPlaying ? 'is-active' : ''}`}
                  onClick={togglePlay}
                  title={isPlaying ? 'Pause Animation' : 'Play Step Animation'}
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                  <span>{isPlaying ? 'Pause' : 'Play Animation'}</span>
                </button>

                <button
                  type="button"
                  className="btn-pb-action"
                  onClick={handleStepForward}
                  disabled={isPlaying}
                  title="Step forward 1 move"
                  aria-label="Step Forward"
                >
                  <FastForward size={16} />
                </button>
              </div>

              {/* Speed Control & Move Progress */}
              <div className="playback-sub-bar">
                <div className="move-prog-indicator">
                  Move <strong>{currentMoveIdx}</strong> of{' '}
                  <strong>{activeCase.algorithm.length}</strong>
                </div>

                <div className="speed-pills-group" role="radiogroup" aria-label="Playback Speed">
                  <span className="speed-label">Speed:</span>
                  {[0.5, 1, 1.5, 2].map((spd) => (
                    <button
                      key={spd}
                      type="button"
                      className={`speed-pill ${playbackSpeed === spd ? 'active' : ''}`}
                      onClick={() => setPlaybackSpeed(spd)}
                    >
                      {spd}×
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Manual Practice Move Pad */}
            <div className="learn-practice-pad">
              <div className="practice-pad-header">
                <HelpCircle size={14} className="text-muted" />
                <span>Try It Yourself (Click to turn layers manually):</span>
              </div>
              <div className="practice-buttons-row">
                {['R', "R'", 'U', "U'", 'F', "F'", 'L', "L'"].map((mv) => (
                  <button
                    key={mv}
                    type="button"
                    className="practice-turn-btn"
                    onClick={() => handlePracticeMove(mv)}
                    disabled={isPlaying || !!animatingMove}
                    title={MOVE_DESCRIPTIONS[mv]}
                  >
                    {mv}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
