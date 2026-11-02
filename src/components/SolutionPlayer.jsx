import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Zap,
  CheckCircle2
} from 'lucide-react';

export function SolutionPlayer({
  solution,
  currentStep,
  onStepChange,
  onPlayMove,
  isPlaying,
  setIsPlaying,
  playbackSpeed,
  setPlaybackSpeed
}) {
  const [copied, setCopied] = useState(false);
  const ribbonRef = useRef(null);
  const activePillRef = useRef(null);

  const moves = solution?.moves || [];
  const totalMoves = moves.length;
  const currentMove = currentStep > 0 && currentStep <= totalMoves ? moves[currentStep - 1] : null;
  const currentStepData = solution?.steps && currentStep > 0 ? solution.steps[currentStep - 1] : null;
  const nextMove = currentStep < totalMoves ? moves[currentStep] : null;

  // Auto-scroll ribbon to keep active pill visible
  useEffect(() => {
    if (activePillRef.current && ribbonRef.current) {
      activePillRef.current.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest'
      });
    }
  }, [currentStep]);

  // Handle Copy Solution to Clipboard
  const handleCopySolution = async () => {
    if (!solution?.solutionString) return;
    try {
      await navigator.clipboard.writeText(solution.solutionString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.warn('Copy failed:', err);
    }
  };

  // Keyboard controls for step navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevious();
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        setIsPlaying(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep, totalMoves]);

  const handleNext = () => {
    if (currentStep < totalMoves) {
      onStepChange(currentStep + 1);
    } else {
      setIsPlaying(false);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      onStepChange(currentStep - 1);
    }
  };

  const handleJumpStart = () => {
    setIsPlaying(false);
    onStepChange(0);
  };

  const handleJumpEnd = () => {
    setIsPlaying(false);
    onStepChange(totalMoves);
  };

  const progressPercent = totalMoves > 0 ? Math.round((currentStep / totalMoves) * 100) : 0;
  const isFinished = currentStep === totalMoves && totalMoves > 0;

  if (!solution || totalMoves === 0) {
    return null;
  }

  return (
    <div className="solution-player-card">
      {/* Top Bar: Progress and Copy */}
      <div className="player-top-bar">
        <div className="player-meta-left">
          <span className="player-badge">
            <Zap size={14} className="text-accent" />
            Solution Found ({totalMoves} moves)
          </span>
          <span className="player-counter">
            Step <strong>{currentStep}</strong> of <strong>{totalMoves}</strong> ({progressPercent}%)
          </span>
        </div>

        <button
          type="button"
          className="btn-copy-solution"
          onClick={handleCopySolution}
          title="Copy full solution notation string to clipboard"
          aria-label="Copy Solution"
        >
          {copied ? (
            <>
              <Check size={16} className="text-success" />
              <span>Solution Copied!</span>
            </>
          ) : (
            <>
              <Copy size={16} />
              <span>Copy Solution</span>
            </>
          )}
        </button>
      </div>

      {/* Progress Bar */}
      <div className="player-progress-track">
        <div
          className="player-progress-fill"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Current Step Spotlight Card */}
      <div className="player-spotlight-card">
        {isFinished ? (
          <div className="spotlight-finished">
            <CheckCircle2 size={38} className="text-success bounce-anim" />
            <div className="finished-title">Cube Successfully Solved!</div>
            <div className="finished-subtitle">All {totalMoves} moves executed. Every face is complete.</div>
          </div>
        ) : currentStep === 0 ? (
          <div className="spotlight-initial">
            <div className="spotlight-notation">Start</div>
            <div className="spotlight-desc">Initial scrambled state. Click 'Next' or 'Play' to begin.</div>
            {moves[0] && (
              <div className="spotlight-upcoming">
                First move: <span className="upcoming-move-tag">{moves[0]}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="spotlight-active">
            <div className="spotlight-notation-wrap">
              <span className="spotlight-notation-badge">{currentMove}</span>
              <div className="spotlight-details">
                <div className="spotlight-step-num">Move #{currentStep}</div>
                <div className="spotlight-desc">
                  {currentStepData?.description || `Turn ${currentMove}`}
                </div>
              </div>
            </div>

            {nextMove && (
              <div className="spotlight-upcoming">
                Next move: <span className="upcoming-move-tag">{nextMove}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Playback Controls */}
      <div className="player-controls-row">
        {/* Jump to Start */}
        <button
          type="button"
          className="control-icon-btn"
          onClick={handleJumpStart}
          disabled={currentStep === 0}
          title="Jump to Start (Move 0)"
          aria-label="Jump to Start"
        >
          <SkipBack size={18} />
        </button>

        {/* Previous Move */}
        <button
          type="button"
          className="control-icon-btn"
          onClick={handlePrevious}
          disabled={currentStep === 0}
          title="Previous Move (Left Arrow)"
          aria-label="Previous Move"
        >
          <ChevronLeft size={22} />
          <span className="control-btn-text">Prev</span>
        </button>

        {/* Play / Pause */}
        <button
          type="button"
          className={`control-play-btn ${isPlaying ? 'is-playing' : ''}`}
          onClick={() => setIsPlaying(!isPlaying)}
          title={isPlaying ? 'Pause (Space)' : 'Auto-Play Solution (Space)'}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause size={22} /> : <Play size={22} />}
          <span className="control-btn-text">{isPlaying ? 'Pause' : 'Play'}</span>
        </button>

        {/* Next Move */}
        <button
          type="button"
          className="control-icon-btn"
          onClick={handleNext}
          disabled={currentStep >= totalMoves}
          title="Next Move (Right Arrow)"
          aria-label="Next Move"
        >
          <span className="control-btn-text">Next</span>
          <ChevronRight size={22} />
        </button>

        {/* Jump to End */}
        <button
          type="button"
          className="control-icon-btn"
          onClick={handleJumpEnd}
          disabled={currentStep >= totalMoves}
          title="Jump to End (Solved State)"
          aria-label="Jump to End"
        >
          <SkipForward size={18} />
        </button>

        {/* Speed Selector */}
        <div className="player-speed-selector">
          <span className="speed-label">Speed:</span>
          {[0.5, 1, 2, 4].map((spd) => (
            <button
              key={spd}
              type="button"
              className={`speed-pill-btn ${playbackSpeed === spd ? 'active' : ''}`}
              onClick={() => setPlaybackSpeed(spd)}
              title={`${spd}x playback speed`}
            >
              {spd}x
            </button>
          ))}
        </div>
      </div>

      {/* Solution Timeline Ribbon */}
      <div className="player-ribbon-container">
        <div className="ribbon-label">Move Timeline (Click any move to jump):</div>
        <div className="player-ribbon-scroll" ref={ribbonRef}>
          <button
            type="button"
            className={`ribbon-pill-btn start-pill ${currentStep === 0 ? 'active' : ''}`}
            onClick={() => {
              setIsPlaying(false);
              onStepChange(0);
            }}
          >
            Start
          </button>

          {moves.map((mv, idx) => {
            const stepNum = idx + 1;
            const isActive = currentStep === stepNum;
            const isDone = currentStep > stepNum;

            return (
              <button
                key={idx}
                ref={isActive ? activePillRef : null}
                type="button"
                className={`ribbon-pill-btn ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}
                onClick={() => {
                  setIsPlaying(false);
                  onStepChange(stepNum);
                }}
                title={`Step ${stepNum}: ${mv}`}
              >
                <span className="pill-index">{stepNum}</span>
                <span className="pill-move">{mv}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
