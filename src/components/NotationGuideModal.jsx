import React, { useEffect } from 'react';
import { X, BookOpen, RotateCw, RotateCcw, Compass } from 'lucide-react';

export function NotationGuideModal({ isOpen, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const FACES_GUIDE = [
    { letter: 'U', name: 'Up (Top)', color: '#FFFFFF', desc: 'Top face of the cube' },
    { letter: 'D', name: 'Down (Bottom)', color: '#FFD000', desc: 'Bottom face of the cube' },
    { letter: 'F', name: 'Front', color: '#16A34A', desc: 'Face facing directly towards you' },
    { letter: 'B', name: 'Back', color: '#2563EB', desc: 'Face facing directly away from you' },
    { letter: 'L', name: 'Left', color: '#FF6B00', desc: 'Left face of the cube' },
    { letter: 'R', name: 'Right', color: '#DC2626', desc: 'Right face of the cube' }
  ];

  const MODIFIERS_GUIDE = [
    {
      symbol: 'Letter (e.g. R)',
      name: 'Clockwise (90°)',
      desc: 'Rotate the face 90 degrees clockwise looking directly at that face.',
      icon: <RotateCw size={18} className="text-accent" />
    },
    {
      symbol: "Letter + ' (e.g. R')",
      name: "Prime / Counter-Clockwise (90°)",
      desc: 'Rotate the face 90 degrees counter-clockwise looking directly at that face.',
      icon: <RotateCcw size={18} className="text-accent" />
    },
    {
      symbol: 'Letter + 2 (e.g. R2)',
      name: 'Double Turn (180°)',
      desc: 'Rotate the face 180 degrees (half turn). Clockwise or counter-clockwise yields the same result.',
      icon: <Compass size={18} className="text-accent" />
    }
  ];

  return (
    <div className="guide-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="guide-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="guide-modal-header">
          <div className="guide-title-wrap">
            <BookOpen size={22} className="text-accent" />
            <h2>Rubik's Cube Notation Guide</h2>
          </div>
          <button type="button" className="guide-close-btn" onClick={onClose} aria-label="Close Guide">
            <X size={20} />
          </button>
        </div>

        <div className="guide-modal-body">
          <p className="guide-intro">
            Rubik's cube solutions use standard <strong>Singmaster Notation</strong>.
            Each letter represents a 90° clockwise rotation of that face when viewed straight-on.
          </p>

          <section className="guide-section">
            <h3 className="section-title">The Six Faces</h3>
            <div className="faces-grid">
              {FACES_GUIDE.map((face) => (
                <div key={face.letter} className="face-guide-item">
                  <span className="face-letter-chip" style={{ backgroundColor: face.color }}>
                    {face.letter}
                  </span>
                  <div className="face-guide-info">
                    <span className="face-guide-name">{face.name}</span>
                    <span className="face-guide-desc">{face.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="guide-section">
            <h3 className="section-title">Move Modifiers</h3>
            <div className="modifiers-list">
              {MODIFIERS_GUIDE.map((item, idx) => (
                <div key={idx} className="modifier-item">
                  <div className="mod-icon-wrap">{item.icon}</div>
                  <div className="mod-info">
                    <div className="mod-sym-name">
                      <code className="mod-code">{item.symbol}</code>
                      <span className="mod-name">— {item.name}</span>
                    </div>
                    <div className="mod-desc">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="guide-section">
            <h3 className="section-title">Center Layer Slices</h3>
            <div className="cube-rotations-guide">
              <div className="rot-guide-item">
                <code>M</code>: Middle slice between L and R (follows L direction: U → F → D → B)
              </div>
              <div className="rot-guide-item">
                <code>E</code>: Equator slice between U and D (follows D direction: F → R → B → L)
              </div>
              <div className="rot-guide-item">
                <code>S</code>: Standing slice between F and B (follows F direction: U → R → D → L)
              </div>
            </div>
          </section>

          <section className="guide-section">
            <h3 className="section-title">Whole Cube Rotations</h3>
            <div className="cube-rotations-guide">
              <div className="rot-guide-item">
                <code>X</code>: Rotate whole cube around R axis (pitch up)
              </div>
              <div className="rot-guide-item">
                <code>Y</code>: Rotate whole cube around U axis (yaw left)
              </div>
              <div className="rot-guide-item">
                <code>Z</code>: Rotate whole cube around F axis (roll clockwise)
              </div>
            </div>
          </section>
        </div>

        <div className="guide-modal-footer">
          <button type="button" className="btn-got-it" onClick={onClose}>
            Got it, let's solve!
          </button>
        </div>
      </div>
    </div>
  );
}
