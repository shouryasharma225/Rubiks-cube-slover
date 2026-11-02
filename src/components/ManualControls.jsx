import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Hand } from 'lucide-react';

const MOVE_GROUPS = [
  {
    face: 'Up (U)',
    color: '#FFFFFF',
    moves: ['U', "U'", 'U2']
  },
  {
    face: 'Down (D)',
    color: '#FFD000',
    moves: ['D', "D'", 'D2']
  },
  {
    face: 'Left (L)',
    color: '#FF6B00',
    moves: ['L', "L'", 'L2']
  },
  {
    face: 'Right (R)',
    color: '#DC2626',
    moves: ['R', "R'", 'R2']
  },
  {
    face: 'Front (F)',
    color: '#16A34A',
    moves: ['F', "F'", 'F2']
  },
  {
    face: 'Back (B)',
    color: '#2563EB',
    moves: ['B', "B'", 'B2']
  }
];

const SLICE_GROUPS = [
  {
    face: 'Middle (M)',
    color: '#38bdf8',
    moves: ['M', "M'", 'M2']
  },
  {
    face: 'Equator (E)',
    color: '#a855f7',
    moves: ['E', "E'", 'E2']
  },
  {
    face: 'Standing (S)',
    color: '#f43f5e',
    moves: ['S', "S'", 'S2']
  }
];

const CUBE_ROTATIONS = ['x', "x'", 'y', "y'"];

export function ManualControls({ onApplyMove, manualMoveCount, disabled }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="manual-controls-card">
      <button
        type="button"
        className="manual-controls-header"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <div className="header-left-info">
          <Hand size={16} className="text-accent" />
          <span className="header-title">Manual Face & Center Slices</span>
          {manualMoveCount > 0 && (
            <span className="move-count-badge">{manualMoveCount} moves</span>
          )}
        </div>
        <div className="header-right-toggle">
          <span className="toggle-text">{isOpen ? 'Hide' : 'Show Moves'}</span>
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {isOpen && (
        <div className="manual-controls-body">
          <div className="moves-section-title">Outer Face Turns</div>
          <div className="moves-grid-row">
            {MOVE_GROUPS.map((group) => (
              <div key={group.face} className="move-group-box">
                <div className="group-label" style={{ borderLeftColor: group.color }}>
                  {group.face}
                </div>
                <div className="group-buttons">
                  {group.moves.map((mv) => (
                    <button
                      key={mv}
                      type="button"
                      className="notation-btn"
                      onClick={() => onApplyMove(mv)}
                      disabled={disabled}
                      title={`Turn ${mv}`}
                    >
                      {mv}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="moves-section-title" style={{ marginTop: '14px' }}>Center Layer Slices (M, E, S)</div>
          <div className="moves-grid-row slices-grid-row">
            {SLICE_GROUPS.map((group) => (
              <div key={group.face} className="move-group-box">
                <div className="group-label" style={{ borderLeftColor: group.color }}>
                  {group.face}
                </div>
                <div className="group-buttons">
                  {group.moves.map((mv) => (
                    <button
                      key={mv}
                      type="button"
                      className="notation-btn slice-notation-btn"
                      onClick={() => onApplyMove(mv)}
                      disabled={disabled}
                      title={`Turn Slice ${mv}`}
                    >
                      {mv}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="rotations-row">
            <span className="rotations-label">Cube Rotations:</span>
            <div className="rotations-buttons">
              {CUBE_ROTATIONS.map((rot) => (
                <button
                  key={rot}
                  type="button"
                  className="notation-btn rot-btn"
                  onClick={() => onApplyMove(rot)}
                  disabled={disabled}
                  title={`Rotate whole cube ${rot}`}
                >
                  {rot}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
