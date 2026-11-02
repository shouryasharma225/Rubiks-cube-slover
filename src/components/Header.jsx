import React, { useState } from 'react';
import {
  Sun,
  Moon,
  Volume2,
  VolumeX,
  HelpCircle,
  Share2,
  Check,
  Sparkles,
  Gamepad2,
  Camera,
  Layers,
  GraduationCap,
  Home,
  ArrowRight
} from 'lucide-react';

export function Header({
  theme,
  setTheme,
  audioEnabled,
  toggleAudio,
  onOpenGuide,
  activeMode,
  setActiveMode,
  isSwitchingMode
}) {
  const [copiedLink, setCopiedLink] = useState(false);

  const handleShare = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      }
    } catch (e) {
      console.warn('Clipboard write failed:', e);
    }
  };

  return (
    <header className="app-header">
      {isSwitchingMode && <div className="header-progress-line" />}
      <div
        className="header-left clickable-logo"
        onClick={() => setActiveMode('home')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setActiveMode('home'); }}
        title="Go to Rubik's Cube Hub Front Page"
      >
        <div className="logo-cube-icon" aria-hidden="true">
          <div className="mini-cube">
            <span className="mc-face mc-red"></span>
            <span className="mc-face mc-blue"></span>
            <span className="mc-face mc-white"></span>
            <span className="mc-face mc-yellow"></span>
          </div>
        </div>
        <div className="header-title-wrap">
          <h1 className="app-title">Rubik's Cube Hub</h1>
          <span className="app-badge">
            <Sparkles size={12} className="sparkle-icon" />
            Two-Phase AI & Speedcube Arena
          </span>
        </div>
      </div>

      {/* Main Mode Navigation: Only shown AFTER clicking Get Started! */}
      {activeMode !== 'home' && (
        <div className="header-center-modes" role="tablist" aria-label="Main Navigation">
          <button
            type="button"
            className="header-mode-tab"
            onClick={() => setActiveMode('home')}
            role="tab"
            aria-selected={false}
            title="Return to Front Page Poster"
          >
            <Home size={16} />
            <span>Home</span>
          </button>

          <button
            type="button"
            className={`header-mode-tab ${activeMode === 'cube-solver' ? 'active' : ''}`}
            onClick={() => setActiveMode('cube-solver')}
            role="tab"
            aria-selected={activeMode === 'cube-solver'}
            title="Solve your real-world physical cube with photos of all sides"
          >
            <Camera size={16} />
            <span>Cube Solver</span>
            <span className="mode-highlight-badge mode-badge-photo">PHOTO</span>
          </button>

          <button
            type="button"
            className={`header-mode-tab ${activeMode === 'game' ? 'active' : ''}`}
            onClick={() => setActiveMode('game')}
            role="tab"
            aria-selected={activeMode === 'game'}
            title="Play interactive speedcube games against the timer"
          >
            <Gamepad2 size={16} />
            <span>Play & Solve Game</span>
            <span className="mode-highlight-badge">PLAY</span>
          </button>

          <button
            type="button"
            className={`header-mode-tab ${activeMode === 'learn' ? 'active' : ''}`}
            onClick={() => setActiveMode('learn')}
            role="tab"
            aria-selected={activeMode === 'learn'}
            title="Learn how to solve the Rubik's cube step-by-step with 3D notes"
          >
            <GraduationCap size={16} />
            <span>Learn Cube</span>
            <span className="mode-highlight-badge mode-badge-learn">GUIDE</span>
          </button>

          <button
            type="button"
            className={`header-mode-tab ${activeMode === 'solver' ? 'active' : ''}`}
            onClick={() => setActiveMode('solver')}
            role="tab"
            aria-selected={activeMode === 'solver'}
            title="Virtual 3D cube simulator and pattern explorer"
          >
            <Layers size={16} />
            <span>Virtual Lab</span>
          </button>
        </div>
      )}

      <div className="header-right">
        {/* Prominent Segmented Theme Switcher */}
        <div className="theme-toggle-segmented" role="radiogroup" aria-label="Theme Mode Selection">
          <button
            type="button"
            className={`theme-seg-btn ${theme === 'light' ? 'active' : ''}`}
            onClick={() => setTheme('light')}
            role="radio"
            aria-checked={theme === 'light'}
            title="Switch to Clean White Light Mode"
          >
            <Sun size={14} className="sun-icon" />
            <span>Light</span>
          </button>
          <button
            type="button"
            className={`theme-seg-btn ${theme === 'dark' ? 'active' : ''}`}
            onClick={() => setTheme('dark')}
            role="radio"
            aria-checked={theme === 'dark'}
            title="Switch to Obsidian Dark Mode"
          >
            <Moon size={14} className="moon-icon" />
            <span>Dark</span>
          </button>
        </div>

        <button
          className="header-btn icon-only-mobile"
          onClick={handleShare}
          title="Share application"
          aria-label="Share App Link"
        >
          {copiedLink ? (
            <>
              <Check size={16} className="text-success" />
              <span className="btn-label">Copied!</span>
            </>
          ) : (
            <>
              <Share2 size={16} />
              <span className="btn-label">Share</span>
            </>
          )}
        </button>

        <button
          className="header-btn"
          onClick={toggleAudio}
          title={audioEnabled ? 'Mute Sound Effects' : 'Enable Sound Effects'}
          aria-label="Toggle Sound Effects"
        >
          {audioEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>

        <button
          className="header-btn"
          onClick={onOpenGuide}
          title="Rubik's Cube Notation & Guide"
          aria-label="Open Notation Guide"
        >
          <HelpCircle size={16} />
          <span className="btn-label">Guide</span>
        </button>
      </div>
    </header>
  );
}
