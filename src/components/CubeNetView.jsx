import React, { useState } from 'react';
import { COLOR_METADATA, FACE_DETAILS } from '../solver/cubeEngine.js';

export function CubeNetView({
  cubeState,
  selectedColor,
  onPaintSticker,
  disabled
}) {
  const [isMouseDown, setIsMouseDown] = useState(false);

  const handleMouseDown = (face, index) => {
    if (disabled) return;
    setIsMouseDown(true);
    onPaintSticker(face, index);
  };

  const handleMouseEnter = (face, index) => {
    if (disabled || !isMouseDown) return;
    onPaintSticker(face, index);
  };

  const handleMouseUp = () => {
    setIsMouseDown(false);
  };

  const renderFace = (faceKey) => {
    const faceInfo = FACE_DETAILS[faceKey];
    const stickers = cubeState[faceKey] || Array(9).fill('white');

    return (
      <div className={`cube-face-card face-${faceKey.toLowerCase()}`} key={faceKey}>
        <div className="face-header">
          <span className="face-letter-badge">{faceInfo.letter}</span>
          <span className="face-name">{faceInfo.name}</span>
        </div>

        <div className="stickers-grid" role="grid" aria-label={`${faceInfo.name} face stickers`}>
          {stickers.map((colorKey, idx) => {
            const isCenter = idx === 4;
            const meta = COLOR_METADATA[colorKey] || { hex: '#cccccc', name: 'Unknown' };

            return (
              <button
                key={idx}
                type="button"
                className={`cube-sticker ${isCenter ? 'is-center' : ''}`}
                style={{ backgroundColor: meta.hex }}
                onMouseDown={() => handleMouseDown(faceKey, idx)}
                onMouseEnter={() => handleMouseEnter(faceKey, idx)}
                disabled={disabled}
                title={`${faceInfo.name} face, sticker #${idx + 1} (${meta.name})${isCenter ? ' - Center piece' : ''}`}
                aria-label={`${faceInfo.name} sticker ${idx + 1}, color ${meta.name}`}
              >
                {isCenter && <span className="center-dot" title="Center piece" />}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div
      className="cube-net-container"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="cube-net-layout">
        {/* Row 1: U Face (Column 2) */}
        <div className="net-row row-top">
          <div className="net-spacer"></div>
          {renderFace('U')}
          <div className="net-spacer"></div>
          <div className="net-spacer"></div>
        </div>

        {/* Row 2: L, F, R, B Faces (Columns 1..4) */}
        <div className="net-row row-middle">
          {renderFace('L')}
          {renderFace('F')}
          {renderFace('R')}
          {renderFace('B')}
        </div>

        {/* Row 3: D Face (Column 2) */}
        <div className="net-row row-bottom">
          <div className="net-spacer"></div>
          {renderFace('D')}
          <div className="net-spacer"></div>
          <div className="net-spacer"></div>
        </div>
      </div>
    </div>
  );
}
