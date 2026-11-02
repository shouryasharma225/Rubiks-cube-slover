import React, { useState } from 'react';
import { Shuffle, Copy, Check, Play, RefreshCw } from 'lucide-react';
import { generateScramble } from '../solver/scrambler.js';

export function ScrambleGenerator({ onApplyScramble, disabled }) {
  const [scramble, setScramble] = useState(() => generateScramble(22));
  const [copied, setCopied] = useState(false);

  const handleNewScramble = () => {
    setScramble(generateScramble(22));
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(scramble.scrambleString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.warn('Copy failed:', e);
    }
  };

  const handleApply = () => {
    onApplyScramble(scramble.moves);
  };

  return (
    <div className="scramble-generator-card">
      <div className="scramble-card-top">
        <div className="scramble-badge-group">
          <Shuffle size={15} className="text-accent" />
          <span className="scramble-card-title">WCA Scramble Generator</span>
          <span className="scramble-length-tag">{scramble.moves.length} moves</span>
        </div>

        <div className="scramble-card-actions">
          <button
            type="button"
            className="btn-scramble-action"
            onClick={handleNewScramble}
            disabled={disabled}
            title="Generate a new random scramble"
            aria-label="New Scramble"
          >
            <RefreshCw size={14} />
            <span>Generate New</span>
          </button>

          <button
            type="button"
            className="btn-scramble-action"
            onClick={handleCopy}
            title="Copy scramble notation"
            aria-label="Copy Scramble"
          >
            {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      <div className="scramble-notation-display" title="Generated scramble moves">
        {scramble.moves.map((mv, idx) => (
          <span key={idx} className="scramble-move-chip">
            {mv}
          </span>
        ))}
      </div>

      <div className="scramble-card-bottom">
        <button
          type="button"
          className="btn-apply-scramble"
          onClick={handleApply}
          disabled={disabled}
          title="Apply this exact scramble sequence to the cube"
        >
          <Play size={15} />
          <span>Apply This Scramble To Cube</span>
        </button>
      </div>
    </div>
  );
}
