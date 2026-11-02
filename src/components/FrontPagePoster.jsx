import React from 'react';
import {
  Camera,
  Gamepad2,
  GraduationCap,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
  Cpu,
  CheckCircle2,
  Flame,
  BookOpen
} from 'lucide-react';

export function FrontPagePoster({ onGetStarted }) {
  return (
    <div className="frontpage-poster-wrapper">
      {/* ==========================================================
          HERO POSTER BANNER (CLEAN & CENTERED, NO BUTTONS)
          ========================================================== */}
      <section className="poster-hero-section poster-hero-centered">
        <div className="poster-ambient-glow glow-cyan" />
        <div className="poster-ambient-glow glow-amber" />

        <div className="poster-hero-content-centered">

          <h1 className="poster-headline">
            Master The Cube.<br />
            From Real-World Photos to Sub-Second AI Solutions.
          </h1>

          <p className="poster-subline">
            The all-in-one web platform powered by <strong>Kociemba's Two-Phase AI</strong>.
            Snap photos of your physical cube with your camera for an instant 20-move solution,
            race against the clock in the Speedcube Arena, learn full CFOP algorithms with interactive 3D playback,
            or test geometric patterns in our 3D Virtual Lab.
          </p>

          {/* Key Value Tags */}
          <div className="poster-value-tags tags-centered">
            <div className="value-tag-item">
              <ShieldCheck size={16} className="text-success" />
              <span>100% Client-Side & Private</span>
            </div>
            <div className="value-tag-item">
              <Zap size={16} className="text-warning" />
              <span>Sub-Second Compute Speed</span>
            </div>
            <div className="value-tag-item">
              <Cpu size={16} className="text-accent" />
              <span>Zero Installs or Accounts</span>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================================
          STATS & METRICS INFOGRAPHIC STRIP
          ========================================================== */}
      <section className="poster-stats-strip">
        <div className="stat-card">
          <div className="stat-number">≤ 20</div>
          <div className="stat-title">God's Number AI</div>
          <div className="stat-sub">Optimal Two-Phase solution path length</div>
        </div>

        <div className="stat-divider" />

        <div className="stat-card">
          <div className="stat-number">&lt; 25ms</div>
          <div className="stat-title">Compute Speed</div>
          <div className="stat-sub">Client-side Kociemba mathematical solver</div>
        </div>

        <div className="stat-divider" />

        <div className="stat-card">
          <div className="stat-number">54</div>
          <div className="stat-title">Parity Checks</div>
          <div className="stat-sub">Chirality, corner & edge parity validation</div>
        </div>

        <div className="stat-divider" />

        <div className="stat-card">
          <div className="stat-number">4</div>
          <div className="stat-title">Full Modules</div>
          <div className="stat-sub">Scanner, Arena, Academy & 3D Lab</div>
        </div>
      </section>

      {/* ==========================================================
          CORE PLATFORM MODULES (WHAT THIS WEBSITE IS ALL ABOUT)
          ========================================================== */}
      <section className="poster-features-section">
        <div className="section-header-centered">
          <div className="section-badge">
            <Flame size={14} className="text-warning" />
            <span>Complete Cube Ecosystem</span>
          </div>
          <h2 className="section-title">Everything You Need To Solve & Master The Cube</h2>
          <p className="section-desc">
            Explore 4 purpose-built tools designed for beginners, speedcubers, and mathematicians alike.
          </p>
        </div>

        <div className="poster-features-grid">
          {/* FEATURE 1: REAL WORLD CAMERA SOLVER */}
          <div className="feature-card card-scanner">
            <div className="card-top">
              <div className="card-icon-box icon-purple">
                <Camera size={26} />
              </div>
              <span className="card-tag tag-purple">AI VISION</span>
            </div>
            <h3 className="card-heading">Real-World Camera & Photo Solver</h3>
            <p className="card-body">
              Hold your physical Rubik's cube in front of your webcam or snap photos on your phone.
              Our computer vision system scans all 6 faces, validates mathematical parity,
              and renders an interactive step-by-step 3D solution guide to solve your actual cube in 20 moves or less.
            </p>
            <ul className="card-points">
              <li><CheckCircle2 size={15} className="text-success" /> Live camera capture & photo file upload</li>
              <li><CheckCircle2 size={15} className="text-success" /> Interactive 2D color adjuster & fine-tuner</li>
              <li><CheckCircle2 size={15} className="text-success" /> Parity check prevents impossible scrambles</li>
              <li><CheckCircle2 size={15} className="text-success" /> Plain-English 3D turn animations</li>
            </ul>
          </div>

          {/* FEATURE 2: PLAY & SOLVE GAME ARENA */}
          <div className="feature-card card-arena">
            <div className="card-top">
              <div className="card-icon-box icon-blue">
                <Gamepad2 size={26} />
              </div>
              <span className="card-tag tag-blue">SPEEDCUBE ARENA</span>
            </div>
            <h3 className="card-heading">Interactive Play & Speedcube Arena</h3>
            <p className="card-body">
              Practice speedcubing right in your browser with real-time physics,
              WCA inspection countdown, precision millisecond timer, and custom keyboard bindings.
              Race against personal bests or test scrambles with full move counter statistics.
            </p>
            <ul className="card-points">
              <li><CheckCircle2 size={15} className="text-success" /> Spacebar hold-to-start WCA timer</li>
              <li><CheckCircle2 size={15} className="text-success" /> Responsive keyboard shortcuts (U, D, R, L, F, B, M)</li>
              <li><CheckCircle2 size={15} className="text-success" /> Official WCA random-state scrambler</li>
              <li><CheckCircle2 size={15} className="text-success" /> Instant "Solve Helper" when you get stuck</li>
            </ul>
          </div>

          {/* FEATURE 3: SPEEDCUBE ACADEMY */}
          <div className="feature-card card-academy">
            <div className="card-top">
              <div className="card-icon-box icon-amber">
                <GraduationCap size={26} />
              </div>
              <span className="card-tag tag-amber">INTERACTIVE MASTERCLASS</span>
            </div>
            <h3 className="card-heading">Speedcubing Academy & CFOP Guide</h3>
            <p className="card-body">
              Learn how to solve the Rubik's Cube step-by-step from scratch!
              Explore the complete Beginner Layer-by-Layer method and master advanced CFOP
              (Cross, F2L pairs, OLL algorithms, and PLL permutations) with interactive 3D demonstrations for every case.
            </p>
            <ul className="card-points">
              <li><CheckCircle2 size={15} className="text-success" /> Step-by-step illustrated algorithm notes</li>
              <li><CheckCircle2 size={15} className="text-success" /> Interactive 3D cube for every single algorithm</li>
              <li><CheckCircle2 size={15} className="text-success" /> White Cross, F2L, 2-Look OLL, and PLL</li>
              <li><CheckCircle2 size={15} className="text-success" /> Visual Singmaster notation explanations</li>
            </ul>
          </div>

          {/* FEATURE 4: 3D VIRTUAL LAB */}
          <div className="feature-card card-lab">
            <div className="card-top">
              <div className="card-icon-box icon-emerald">
                <Layers size={26} />
              </div>
              <span className="card-tag tag-emerald">VIRTUAL LAB</span>
            </div>
            <h3 className="card-heading">3D Virtual Lab & Pattern Explorer</h3>
            <p className="card-body">
              The ultimate 3D sandbox: paint custom sticker patterns on an unfolded 2D net,
              orbit the 3D model, apply famous geometric patterns (Checkerboard, Superflip, Cube in a Cube),
              and step forward/backward through solution sequences with realistic mechanical audio.
            </p>
            <ul className="card-points">
              <li><CheckCircle2 size={15} className="text-success" /> Dual View: 3D Orbit Cube + 2D Unfolded Net</li>
              <li><CheckCircle2 size={15} className="text-success" /> Famous preset patterns (Superflip, Anaconda, Wire)</li>
              <li><CheckCircle2 size={15} className="text-success" /> Interactive solution playback ribbon & speeds</li>
              <li><CheckCircle2 size={15} className="text-success" /> Manual 18-move notation pad with slice turns</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ==========================================================
          HOW IT WORKS (3-STEP VISUAL POSTER PIPELINE)
          ========================================================== */}
      <section className="poster-how-section">
        <div className="section-header-centered">
          <div className="section-badge">
            <Sparkles size={14} className="text-accent" />
            <span>Effortless Workflow</span>
          </div>
          <h2 className="section-title">How It Works in 3 Simple Steps</h2>
          <p className="section-desc">
            Go from any scrambled cube in the world to fully solved in less than a minute.
          </p>
        </div>

        <div className="poster-steps-grid">
          <div className="step-card">
            <div className="step-number-bubble">01</div>
            <h4 className="step-title">Capture or Scramble</h4>
            <p className="step-text">
              Hold your physical cube and take photos of all 6 faces using your webcam or phone,
              paint colors on the 2D net, or generate a random WCA scramble.
            </p>
          </div>

          <div className="step-arrow-divider">
            <ArrowRight size={24} />
          </div>

          <div className="step-card">
            <div className="step-number-bubble">02</div>
            <h4 className="step-title">Instant AI Parity Verification</h4>
            <p className="step-text">
              Our client-side engine calculates mathematical parity (edge orientation, corner twist, chirality)
              and generates an optimal 20-move Kociemba solution path in ~10 milliseconds.
            </p>
          </div>

          <div className="step-arrow-divider">
            <ArrowRight size={24} />
          </div>

          <div className="step-card">
            <div className="step-number-bubble">03</div>
            <h4 className="step-title">Follow 3D Step-by-Step Turns</h4>
            <p className="step-text">
              Watch realistic 3D face turn animations with plain-English instructions (e.g. "Turn Right face 90° Clockwise"),
              adjustable playback speeds, and celebratory confetti upon completion!
            </p>
          </div>
        </div>
      </section>

      {/* ==========================================================
          QUICK NOTATION CHEAT SHEET PREVIEW
          ========================================================== */}
      <section className="poster-notation-preview">
        <div className="notation-preview-header">
          <div>
            <h3 className="notation-preview-title">Standard Singmaster WCA Notation</h3>
            <p className="notation-preview-sub">Recognized globally by speedcubers and official competitions.</p>
          </div>
          <div className="notation-preview-badge">
            <BookOpen size={16} />
            <span>Notation Reference</span>
          </div>
        </div>

        <div className="notation-chips-grid">
          <div className="notation-chip">
            <span className="chip-code">U / U'</span>
            <span className="chip-label">Up (Top Face)</span>
          </div>
          <div className="notation-chip">
            <span className="chip-code">D / D'</span>
            <span className="chip-label">Down (Bottom Face)</span>
          </div>
          <div className="notation-chip">
            <span className="chip-code">R / R'</span>
            <span className="chip-label">Right Face</span>
          </div>
          <div className="notation-chip">
            <span className="chip-code">L / L'</span>
            <span className="chip-label">Left Face</span>
          </div>
          <div className="notation-chip">
            <span className="chip-code">F / F'</span>
            <span className="chip-label">Front Face</span>
          </div>
          <div className="notation-chip">
            <span className="chip-code">B / B'</span>
            <span className="chip-label">Back Face</span>
          </div>
        </div>
      </section>

      {/* ==========================================================
          ONLY GET STARTED OPTION AT THE BOTTOM OF THE WEBSITE
          ========================================================== */}
      <section className="poster-bottom-cta">
        <div className="poster-bottom-glow" />
        <div className="poster-bottom-content">
          <div className="section-badge">
            <Sparkles size={14} className="sparkle-gold" />
            <span>Launch Workspace</span>
          </div>
          <h2 className="bottom-cta-heading">Ready To Solve Or Master Your Cube?</h2>
          <p className="bottom-cta-sub">
            Instant access to the AI camera solver, 3D interactive controls, speedcube arena, and full CFOP academy.
          </p>
          <div className="bottom-cta-buttons">
            <button
              type="button"
              className="poster-btn-primary btn-large btn-get-started-single"
              onClick={onGetStarted}
              title="Click to Get Started and enter Rubik's Cube Hub"
            >
              <span>Get Started</span>
              <ArrowRight size={22} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
