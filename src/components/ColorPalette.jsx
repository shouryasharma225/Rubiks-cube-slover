import React, { useEffect } from 'react';
import { COLOR_METADATA } from '../solver/cubeEngine.js';
import { Paintbrush, Check, AlertCircle } from 'lucide-react';

export function ColorPalette({
  selectedColor,
  onSelectColor,
  stickerCounts
}) {
  const colors = [
    { key: 'white', shortcut: '1' },
    { key: 'yellow', shortcut: '2' },
    { key: 'green', shortcut: '3' },
    { key: 'blue', shortcut: '4' },
    { key: 'red', shortcut: '5' },
    { key: 'orange', shortcut: '6' }
  ];

  // Keyboard shortcut listener (1-6)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if input or textarea is active
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      const match = colors.find(c => c.shortcut === e.key);
      if (match) {
        onSelectColor(match.key);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSelectColor]);

  return (
    <div className="color-palette-card">
      <div className="palette-header">
        <div className="palette-title-group">
          <Paintbrush size={16} className="palette-icon" />
          <span className="palette-title">Color Palette</span>
        </div>
        <span className="palette-hint">Select a color, then click stickers to paint</span>
      </div>

      <div className="palette-colors-row" role="radiogroup" aria-label="Cube Colors">
        {colors.map(({ key, shortcut }) => {
          const meta = COLOR_METADATA[key];
          const count = stickerCounts ? stickerCounts[key] || 0 : 9;
          const isSelected = selectedColor === key;
          const isExact = count === 9;
          const isExcess = count > 9;

          return (
            <button
              key={key}
              type="button"
              className={`color-swatch-btn ${isSelected ? 'active' : ''} ${isExcess ? 'excess' : ''}`}
              onClick={() => onSelectColor(key)}
              title={`${meta.name} (Press '${shortcut}') - ${count}/9 stickers`}
              aria-label={`${meta.name} color palette, ${count} of 9 stickers used`}
              style={{ '--swatch-color': meta.hex }}
            >
              <span className="swatch-circle">
                {isSelected && <span className="swatch-check" />}
              </span>

              <div className="swatch-info">
                <span className="swatch-name">{meta.name}</span>
                <span className={`swatch-count ${isExact ? 'count-good' : isExcess ? 'count-bad' : 'count-warn'}`}>
                  {count}/9
                  {isExact && <Check size={10} className="count-icon" />}
                  {isExcess && <AlertCircle size={10} className="count-icon" />}
                </span>
              </div>

              <span className="swatch-key-hint">{shortcut}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
