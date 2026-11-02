import React from 'react';
import { AlertTriangle, X, RotateCcw, HelpCircle } from 'lucide-react';

export function ValidationAlert({ error, details, onDismiss, onReset }) {
  if (!error) return null;

  return (
    <div className="validation-alert-modal" role="alertdialog" aria-labelledby="val-title">
      <div className="validation-alert-content">
        <div className="val-icon-header">
          <div className="val-icon-bubble">
            <AlertTriangle size={28} className="val-warning-icon" />
          </div>
          <button
            type="button"
            className="val-close-btn"
            onClick={onDismiss}
            aria-label="Dismiss Alert"
          >
            <X size={20} />
          </button>
        </div>

        <h3 id="val-title" className="val-title">
          Invalid Cube Configuration
        </h3>

        <p className="val-message">
          {error}
        </p>

        <div className="val-tips-card">
          <div className="tips-header">
            <HelpCircle size={15} />
            <span>Why did this happen?</span>
          </div>
          <ul className="tips-list">
            <li>Each of the 6 colors must appear on exactly 9 stickers.</li>
            <li>Center pieces define face positions and cannot have duplicates.</li>
            <li>A single flipped edge or single twisted corner is physically impossible on a standard 3x3 cube without physical tampering.</li>
            <li>Swapping only two pieces violates mathematical permutation parity.</li>
          </ul>
        </div>

        <div className="val-actions">
          <button
            type="button"
            className="val-btn-reset"
            onClick={() => {
              onReset();
              onDismiss();
            }}
          >
            <RotateCcw size={16} />
            <span>Reset to Solved Cube</span>
          </button>
          <button
            type="button"
            className="val-btn-dismiss"
            onClick={onDismiss}
          >
            I'll Fix It
          </button>
        </div>
      </div>
    </div>
  );
}
