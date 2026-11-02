import React, { useState } from 'react';
import { RotateCcw, Shuffle, Sparkles, Loader2, Bookmark, ChevronDown } from 'lucide-react';
import { PRESET_PATTERNS } from '../solver/presets.js';

export function SolverControls({
  onReset,
  onScramble,
  onSolve,
  onApplyPreset,
  isSolving,
  isSolved,
  disabled
}) {
  const [showPresets, setShowPresets] = useState(false);

  return (
    <div className="solver-controls-card">
      <div className="main-actions-group">
        {/* Reset Cube Button */}
        <button
          type="button"
          className="action-btn btn-secondary"
          onClick={onReset}
          disabled={disabled || isSolving}
          title="Reset cube to solved state"
          aria-label="Reset Cube"
        >
          <RotateCcw size={18} />
          <span>Reset Cube</span>
        </button>

        {/* Random Scramble Button */}
        <button
          type="button"
          className="action-btn btn-secondary"
          onClick={onScramble}
          disabled={disabled || isSolving}
          title="Apply a random 22-move WCA scramble"
          aria-label="Random Scramble"
        >
          <Shuffle size={18} />
          <span>Random Scramble</span>
        </button>

        {/* Presets Menu */}
        <div className="presets-dropdown-wrapper">
          <button
            type="button"
            className="action-btn btn-secondary btn-presets"
            onClick={() => setShowPresets(!showPresets)}
            disabled={disabled || isSolving}
            title="Load preset patterns like Checkerboard, Superflip, etc."
            aria-expanded={showPresets}
            aria-label="Preset Patterns Menu"
          >
            <Bookmark size={18} />
            <span>Presets</span>
            <ChevronDown size={15} className={`chevron ${showPresets ? 'open' : ''}`} />
          </button>

          {showPresets && (
            <div className="presets-menu" role="menu">
              <div className="presets-menu-header">Preset Patterns</div>
              {PRESET_PATTERNS.map((pattern) => (
                <button
                  key={pattern.id}
                  type="button"
                  className="preset-item-btn"
                  onClick={() => {
                    setShowPresets(false);
                    onApplyPreset(pattern);
                  }}
                  role="menuitem"
                >
                  <div className="preset-name">{pattern.name}</div>
                  <div className="preset-desc">{pattern.description}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Primary Solve Cube Button */}
        <button
          type="button"
          className={`action-btn btn-primary ${isSolving ? 'loading' : ''} ${isSolved ? 'is-solved' : ''}`}
          onClick={onSolve}
          disabled={disabled || isSolving}
          title="Calculate optimal solution using Kociemba's algorithm"
          aria-label="Solve Cube"
        >
          {isSolving ? (
            <>
              <Loader2 size={19} className="spin-icon" />
              <span>Solving Cube...</span>
            </>
          ) : (
            <>
              <Sparkles size={19} />
              <span>{isSolved ? 'Already Solved' : 'Solve Cube'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
