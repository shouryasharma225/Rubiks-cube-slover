import React, { useState, useRef, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Camera,
  CameraOff,
  Upload,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Play,
  Pause,
  Shuffle,
  Eye,
  Edit3,
  HelpCircle,
  Check,
  ChevronRight,
  Info,
  RefreshCw,
  Box,
  FileText,
  Copy
} from 'lucide-react';
import {
  COLOR_KEYS,
  COLOR_METADATA,
  FACE_DETAILS,
  getSolvedState,
  cloneState,
  applyMove,
  applyMoves,
  getStickerCounts,
  isStateSolved
} from '../solver/cubeEngine.js';
import { validateCube } from '../solver/validator.js';
import { solveCube } from '../solver/solver.js';
import { extractFaceStickersFromCanvas, scanFaceImage } from '../solver/colorDetector.js';
import { Cube3DView } from './Cube3DView.jsx';

// Scanning order with standard center colors and physical holding instructions
const SCAN_STEPS = [
  {
    face: 'F',
    name: 'Front Face',
    centerColor: 'green',
    title: '1. Front Face (Green Center)',
    instruction: 'Hold your cube with Green center facing you, White on top.',
    badgeColor: '#16A34A'
  },
  {
    face: 'R',
    name: 'Right Face',
    centerColor: 'red',
    title: '2. Right Face (Red Center)',
    instruction: 'Turn cube 90° left: Red center facing you, White on top.',
    badgeColor: '#DC2626'
  },
  {
    face: 'B',
    name: 'Back Face',
    centerColor: 'blue',
    title: '3. Back Face (Blue Center)',
    instruction: 'Turn cube 90° left again: Blue center facing you, White on top.',
    badgeColor: '#2563EB'
  },
  {
    face: 'L',
    name: 'Left Face',
    centerColor: 'orange',
    title: '4. Left Face (Orange Center)',
    instruction: 'Turn cube 90° left again: Orange center facing you, White on top.',
    badgeColor: '#FF6B00'
  },
  {
    face: 'U',
    name: 'Top Face (Up)',
    centerColor: 'white',
    title: '5. Top Face (White Center)',
    instruction: 'Tilt cube down: White center facing you, Blue on top.',
    badgeColor: '#FFFFFF'
  },
  {
    face: 'D',
    name: 'Bottom Face (Down)',
    centerColor: 'yellow',
    title: '6. Bottom Face (Yellow Center)',
    instruction: 'Tilt cube up: Yellow center facing you, Green on top.',
    badgeColor: '#FFD000'
  }
];

export function CubePhotoSolver({ playTurnSound, playSolvedChime }) {
  // Scanned Cube State (defaults to empty or standard centers)
  const [scannedState, setScannedState] = useState(() => {
    return {
      F: Array(9).fill('green'),
      R: Array(9).fill('red'),
      B: Array(9).fill('blue'),
      L: Array(9).fill('orange'),
      U: Array(9).fill('white'),
      D: Array(9).fill('yellow')
    };
  });

  // Active scanning step (0 to 5 for F, R, B, L, U, D) or 'review' or 'solution'
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [inputMode, setInputMode] = useState('camera'); // 'camera' | 'upload'
  const [capturedFaces, setCapturedFaces] = useState({
    F: false,
    R: false,
    B: false,
    L: false,
    U: false,
    D: false
  });

  // Solution View Mode: 'both' | 'text' | '3d'
  const [solutionViewMode, setSolutionViewMode] = useState('both');
  const [copiedMoves, setCopiedMoves] = useState(false);
  const [copiedGuide, setCopiedGuide] = useState(false);

  // Selected Color Palette Brush for manual review corrections
  const [selectedBrushColor, setSelectedBrushColor] = useState('green');

  // Camera stream refs & state - camera is OFF by default and only starts when user clicks Scan
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [isCameraStreaming, setIsCameraStreaming] = useState(false);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [captureFeedback, setCaptureFeedback] = useState(null);

  // Solution State
  const [solution, setSolution] = useState(null);
  const [currentSolutionStep, setCurrentSolutionStep] = useState(0);
  const [isPlayingSolution, setIsPlayingSolution] = useState(false);
  const [solutionCubeState, setSolutionCubeState] = useState(null);
  const [animatingMove, setAnimatingMove] = useState(null);
  const [isSolving, setIsSolving] = useState(false);
  const [validationError, setValidationError] = useState(null);

  const currentStep = SCAN_STEPS[currentStepIdx] || SCAN_STEPS[0];
  const currentFaceKey = currentStep.face;

  // Initialize Camera Stream ONLY when user clicks the Scan button
  const startCamera = useCallback(async () => {
    setCameraError(null);
    setIsStartingCamera(true);

    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const isHttp = typeof window !== 'undefined' && window.location && window.location.protocol === 'http:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
      setCameraError(
        isHttp
          ? 'Camera access requires a secure connection (HTTPS or localhost). Please access the app at http://localhost:5173 or use the "Upload Photo" tab.'
          : 'Camera access is not supported by your browser. Please use the "Upload Photo" tab to upload pictures of each side.'
      );
      setIsStartingCamera(false);
      return;
    }

    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }

      let stream;
      // 1. Try environment (rear) camera with ideal constraints (best for mobile devices)
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 1280 }
          }
        });
      } catch (errEnv) {
        // If user denied permission explicitly, propagate error immediately
        if (errEnv.name === 'NotAllowedError' || errEnv.name === 'PermissionDeniedError') {
          throw errEnv;
        }
        console.warn('Environment camera attempt failed, falling back to default webcam:', errEnv);
        // 2. Graceful fallback to any available camera (works on all laptops, desktop webcams, etc.)
        stream = await navigator.mediaDevices.getUserMedia({
          video: true
        });
      }

      streamRef.current = stream;
      setIsCameraStreaming(true);

      // Attach stream to video element immediately
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch((e) => console.warn('Camera play on loadedmetadata:', e));
        };
        videoRef.current.play().catch((e) => console.warn('Camera play immediate warning:', e));
      }
    } catch (err) {
      console.warn('Camera access error:', err);
      let errorMsg = 'Camera access was denied or is unavailable.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMsg = 'Camera permission was denied. Please click the camera/lock icon in your browser URL bar to allow camera access, or upload photos below.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMsg = 'No camera found on your system. Please connect a webcam or upload photos below.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMsg = 'Your camera is currently in use by another application. Please close other apps and try again.';
      } else if (err.name === 'OverconstrainedError') {
        errorMsg = 'Camera constraints could not be satisfied. Please retry or use photo upload.';
      } else if (err.name === 'AbortError') {
        errorMsg = 'Camera access was interrupted. Please click to try again.';
      } else if (err.name === 'SecurityError') {
        errorMsg = 'Camera access blocked by browser security policy. Please ensure the app is open via http://localhost:5173.';
      } else if (err.message) {
        errorMsg = `Camera error: ${err.message}. You can use "Upload Photo" instead.`;
      }
      setCameraError(errorMsg);
      setIsCameraStreaming(false);
    } finally {
      setIsStartingCamera(false);
    }
  }, []);

  // Stop Camera Stream and release hardware
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraStreaming(false);
    setIsStartingCamera(false);
  }, []);

  // Synchronize stream with videoRef whenever streaming state activates
  useEffect(() => {
    if (isCameraStreaming && videoRef.current && streamRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
      videoRef.current.onloadedmetadata = () => {
        videoRef.current?.play().catch((e) => console.warn('Camera sync on loadedmetadata:', e));
      };
      videoRef.current.play().catch((e) => console.warn('Camera sync play warning:', e));
    }
  }, [isCameraStreaming]);

  // Cleanly stop camera when unmounting, switching to upload mode, or navigating away
  useEffect(() => {
    if (inputMode !== 'camera' || currentStepIdx >= 6) {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [inputMode, currentStepIdx, stopCamera]);

  // Capture current video frame and detect 9 stickers
  const handleCaptureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 640;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const detected = extractFaceStickersFromCanvas(canvas);
    if (detected && detected.length === 9) {
      const colors = detected.map((s) => s.color);
      // Ensure center sticker reflects the standard face center
      colors[4] = currentStep.centerColor;

      setScannedState((prev) => ({
        ...prev,
        [currentFaceKey]: colors
      }));

      setCapturedFaces((prev) => ({
        ...prev,
        [currentFaceKey]: true
      }));

      if (playTurnSound) playTurnSound();

      // Cleanly stop camera immediately after capture so the camera turns off
      stopCamera();

      setCaptureFeedback(`✓ ${currentStep.name} captured successfully! Review colors or continue to the next face.`);
      setTimeout(() => setCaptureFeedback(null), 5000);

      // Advance to next face if not last
      if (currentStepIdx < 5) {
        setCurrentStepIdx((i) => i + 1);
      }
    }
  };

  // Upload Photo File Handler
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const imageSrc = event.target.result;
        const detected = await scanFaceImage(imageSrc);
        if (detected && detected.length === 9) {
          const colors = detected.map((s) => s.color);
          colors[4] = currentStep.centerColor;

          setScannedState((prev) => ({
            ...prev,
            [currentFaceKey]: colors
          }));

          setCapturedFaces((prev) => ({
            ...prev,
            [currentFaceKey]: true
          }));

          if (playTurnSound) playTurnSound();

          if (currentStepIdx < 5) {
            setCurrentStepIdx((i) => i + 1);
          }
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.warn('File scan error:', err);
    }
  };

  // Manual Color Brush application on a sticker
  const handleStickerClick = (faceKey, index) => {
    // Keep centers fixed to preserve orientation
    if (index === 4) return;

    setScannedState((prev) => {
      const next = cloneState(prev);
      next[faceKey][index] = selectedBrushColor;
      return next;
    });

    if (playTurnSound) playTurnSound();
  };

  // Copy Complete Move Sequence to Clipboard
  const handleCopySolutionMoves = () => {
    if (!solution || !solution.moves) return;
    const text = solution.moves.join(' ');
    navigator.clipboard.writeText(text).then(() => {
      setCopiedMoves(true);
      setTimeout(() => setCopiedMoves(false), 2500);
    }).catch((err) => {
      console.warn('Clipboard copy failed:', err);
    });
  };

  // Copy Full Numbered Step-by-Step Instructions
  const handleCopyNumberedGuide = () => {
    if (!solution || !solution.moves) return;
    const lines = [
      `RUBIK'S CUBE DIRECT TEXT SOLUTION (${solution.totalMoves} Moves)`,
      `Holding Orientation: Hold Green Center facing you, White Center on Top`,
      `Algorithm Sequence: ${solution.moves.join(' ')}`,
      ``,
      `STEP-BY-STEP INSTRUCTIONS:`
    ];
    solution.moves.forEach((mv, idx) => {
      const step = solution.steps?.[idx];
      const desc = step?.description || `Turn ${mv}`;
      lines.push(`${idx + 1}. [${mv}] - ${desc}`);
    });
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopiedGuide(true);
      setTimeout(() => setCopiedGuide(false), 2500);
    }).catch((err) => {
      console.warn('Clipboard copy failed:', err);
    });
  };

  // Reset entire scan
  const handleResetScan = () => {
    stopCamera();
    setScannedState({
      F: Array(9).fill('green'),
      R: Array(9).fill('red'),
      B: Array(9).fill('blue'),
      L: Array(9).fill('orange'),
      U: Array(9).fill('white'),
      D: Array(9).fill('yellow')
    });
    setCapturedFaces({ F: false, R: false, B: false, L: false, U: false, D: false });
    setCurrentStepIdx(0);
    setSolution(null);
    setValidationError(null);
    setCaptureFeedback(null);
    if (playTurnSound) playTurnSound();
  };

  // Solve the Scanned Real-World Cube
  const handleSolveScannedCube = async () => {
    setValidationError(null);

    // Validate physical legality
    const val = validateCube(scannedState);
    if (!val.valid) {
      setValidationError(val.error);
      return;
    }

    setIsSolving(true);
    const result = await solveCube(scannedState);
    setIsSolving(false);

    if (!result.success) {
      setValidationError(result.error || 'Unable to solve cube state.');
      return;
    }

    setSolution(result);
    setCurrentSolutionStep(0);
    setSolutionCubeState(cloneState(scannedState));
    setIsPlayingSolution(false);

    if (playSolvedChime) playSolvedChime();
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  // Step Forward / Backward in Solution
  const handleStepSolution = (newStep) => {
    if (!solution || animatingMove) return;
    const clamped = Math.max(0, Math.min(newStep, solution.totalMoves));
    const movesToApply = solution.moves.slice(0, clamped);
    const updated = applyMoves(scannedState, movesToApply);
    setSolutionCubeState(updated);
    setCurrentSolutionStep(clamped);
    if (playTurnSound) playTurnSound();
  };

  // Auto-play solution loop
  useEffect(() => {
    if (!isPlayingSolution || !solution || animatingMove) return;

    if (currentSolutionStep >= solution.totalMoves) {
      setIsPlayingSolution(false);
      return;
    }

    const timer = setTimeout(() => {
      const nextMove = solution.moves[currentSolutionStep];
      if (nextMove) {
        setAnimatingMove({
          move: nextMove,
          duration: 260,
          id: Date.now(),
          onCompleteCallback: () => {
            setCurrentSolutionStep((s) => s + 1);
            setSolutionCubeState((prev) => applyMove(prev, nextMove));
            setAnimatingMove(null);
            if (playTurnSound) playTurnSound();
          }
        });
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [isPlayingSolution, currentSolutionStep, solution, animatingMove, playTurnSound]);

  const stickerCounts = getStickerCounts(scannedState);
  const allFacesCaptured = Object.values(capturedFaces).every(Boolean);

  return (
    <div className="cube-photo-solver-container">
      {/* Top Header Banner */}
      <div className="solver-space-header">
        <div className="solver-title-group">
          <div className="solver-badge-icon">
            <Camera size={22} className="text-accent" />
          </div>
          <div>
            <h2 className="solver-space-title">Real-World Cube Solver</h2>
            <p className="solver-space-desc">
              Take photos or upload all 6 sides of your physical Rubik's cube to get an instant step-by-step solution!
            </p>
          </div>
        </div>

        <div className="solver-space-actions">
          <button
            type="button"
            className="solver-secondary-btn"
            onClick={handleResetScan}
            title="Clear all scans and start fresh"
          >
            <RotateCcw size={15} />
            <span>Reset Scan</span>
          </button>
        </div>
      </div>

      {/* 6-Face Step Navigation Ribbon */}
      <div className="faces-stepper-ribbon">
        {SCAN_STEPS.map((step, idx) => {
          const isCaptured = capturedFaces[step.face];
          const isActive = idx === currentStepIdx;
          return (
            <button
              key={step.face}
              type="button"
              className={`step-pill ${isActive ? 'active' : ''} ${isCaptured ? 'completed' : ''}`}
              onClick={() => setCurrentStepIdx(idx)}
            >
              <span className="step-num">{idx + 1}</span>
              <span
                className="step-dot"
                style={{ backgroundColor: step.badgeColor }}
              />
              <span className="step-name">{step.name}</span>
              {isCaptured && <Check size={13} className="step-check" />}
            </button>
          );
        })}
      </div>

      {/* Main Scanner Body */}
      <div className="solver-main-grid">
        {/* Left Scanner & Capture Column */}
        <div className="scanner-card">
          <div className="scanner-card-header">
            <div className="card-header-left">
              <span
                className="active-face-badge"
                style={{ backgroundColor: currentStep.badgeColor, color: currentStep.centerColor === 'white' || currentStep.centerColor === 'yellow' ? '#000' : '#fff' }}
              >
                {currentStep.face}
              </span>
              <div>
                <h3 className="scanner-step-title">{currentStep.title}</h3>
                <p className="scanner-instruction">{currentStep.instruction}</p>
              </div>
            </div>

            {/* Camera / Upload / Text Switcher */}
            <div className="input-toggle-tabs">
              <button
                type="button"
                className={`toggle-tab ${inputMode === 'camera' ? 'active' : ''}`}
                onClick={() => setInputMode('camera')}
              >
                <Camera size={14} />
                <span>Live Camera</span>
              </button>
              <button
                type="button"
                className={`toggle-tab ${inputMode === 'upload' ? 'active' : ''}`}
                onClick={() => setInputMode('upload')}
              >
                <Upload size={14} />
                <span>Upload Photo</span>
              </button>
            </div>
          </div>

          {/* Viewfinder / Input Area */}
          <div className="viewfinder-container">
            {/* Live Camera Stream - Always mounted in DOM so videoRef.current is never null */}
            <div
              className={`live-camera-wrap ${inputMode === 'camera' && isCameraStreaming ? 'active-streaming' : 'hidden-feed'}`}
            >
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className="camera-video-feed"
              />

              {/* Top-Right Stop Camera Button */}
              <button
                type="button"
                className="btn-stop-camera-overlay"
                onClick={stopCamera}
                title="Turn off camera"
              >
                <CameraOff size={13} />
                <span>Stop Camera</span>
              </button>

              {/* 3x3 Rubik's Cube Alignment Reticle Overlay */}
              <div className="reticle-grid-overlay">
                <div className="reticle-border">
                  <div className="reticle-cell" />
                  <div className="reticle-cell" />
                  <div className="reticle-cell" />
                  <div className="reticle-cell" />
                  <div className="reticle-cell center-cell">
                    <span
                      className="center-hint-dot"
                      style={{ backgroundColor: currentStep.badgeColor }}
                    />
                  </div>
                  <div className="reticle-cell" />
                  <div className="reticle-cell" />
                  <div className="reticle-cell" />
                  <div className="reticle-cell" />
                </div>
              </div>
            </div>

            {/* Standby / Error / Upload states when not streaming */}
            {inputMode === 'camera' && !isCameraStreaming && (
              cameraError ? (
                <div className="camera-error-box">
                  <AlertTriangle size={32} className="text-warning" />
                  <p>{cameraError}</p>
                  <button
                    type="button"
                    className="btn-retry-camera"
                    onClick={startCamera}
                  >
                    <RefreshCw size={14} />
                    <span>Try Camera Again</span>
                  </button>
                  <span className="or-text">OR</span>
                  <button
                    type="button"
                    className="btn-switch-upload"
                    onClick={() => {
                      setCameraError(null);
                      setInputMode('upload');
                    }}
                  >
                    <Upload size={14} />
                    <span>Upload a Photo Instead</span>
                  </button>
                </div>
              ) : (
                /* Standby Screen - Camera is OFF until user explicitly clicks the Scan button */
                <div className="camera-standby-box">
                  <div className="standby-reticle-graphic">
                    <div className="standby-mini-grid">
                      <div className="sm-cell" />
                      <div className="sm-cell" />
                      <div className="sm-cell" />
                      <div className="sm-cell" />
                      <div
                        className="sm-cell sm-center"
                        style={{ backgroundColor: currentStep.badgeColor }}
                      >
                        <span
                          className="sm-center-text"
                          style={{
                            color:
                              currentStep.centerColor === 'white' || currentStep.centerColor === 'yellow'
                                ? '#000'
                                : '#fff'
                          }}
                        >
                          {currentStep.face}
                        </span>
                      </div>
                      <div className="sm-cell" />
                      <div className="sm-cell" />
                      <div className="sm-cell" />
                      <div className="sm-cell" />
                    </div>
                  </div>

                  <div className="standby-info">
                    <h4 className="standby-title">
                      {capturedFaces[currentStep.face]
                        ? `✓ ${currentStep.name} Scanned`
                        : `Scan ${currentStep.name}`}
                    </h4>
                    <p className="standby-instruction">{currentStep.instruction}</p>
                  </div>

                  <div className="standby-cta-group">
                    <button
                      type="button"
                      className="btn-scan-camera-primary"
                      onClick={startCamera}
                      disabled={isStartingCamera}
                    >
                      <Camera size={18} />
                      <span>
                        {isStartingCamera
                          ? 'Starting Camera...'
                          : capturedFaces[currentStep.face]
                          ? `Re-Scan ${currentStep.face} Face`
                          : `Scan ${currentStep.face} Face with Camera`}
                      </span>
                    </button>

                    <button
                      type="button"
                      className="btn-switch-upload-link"
                      onClick={() => setInputMode('upload')}
                    >
                      <Upload size={13} />
                      <span>Or upload a photo file</span>
                    </button>
                  </div>
                </div>
              )
            )}

            {/* Photo Upload Dropzone */}
            {inputMode === 'upload' && (
              <div className="photo-upload-dropzone">
                <Upload size={38} className="upload-icon text-accent" />
                <h4>Upload Photo of {currentStep.name}</h4>
                <p>Select an image of your cube face facing directly forward</p>
                <label className="upload-file-btn">
                  <span>Choose Photo File</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="sr-only"
                  />
                </label>
              </div>
            )}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>

          {/* Shutter / Action Bar - Displayed when camera stream is active */}
          {inputMode === 'camera' && !cameraError && isCameraStreaming && (
            <div className="shutter-action-bar">
              <button
                type="button"
                className="btn-shutter-snap"
                onClick={handleCaptureFrame}
                title="Capture this face"
              >
                <div className="shutter-inner-circle">
                  <Camera size={20} />
                </div>
                <span>Capture & Detect {currentStep.face} Face</span>
              </button>

              <button
                type="button"
                className="btn-stop-camera-action"
                onClick={stopCamera}
                title="Turn off camera"
              >
                <CameraOff size={15} />
                <span>Stop Camera</span>
              </button>
            </div>
          )}

          {/* Feedback banner if face was just captured */}
          {captureFeedback && (
            <div className="scan-capture-banner">
              <CheckCircle2 size={16} className="text-success" />
              <span>{captureFeedback}</span>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="scanner-nav-footer">
            <button
              type="button"
              className="scanner-nav-btn"
              disabled={currentStepIdx === 0}
              onClick={() => setCurrentStepIdx((i) => Math.max(0, i - 1))}
            >
              <ArrowLeft size={15} />
              <span>Previous Face</span>
            </button>

            <span className="step-counter-text">
              Step {currentStepIdx + 1} of 6
            </span>

            <button
              type="button"
              className="scanner-nav-btn btn-nav-next"
              disabled={currentStepIdx === 5}
              onClick={() => setCurrentStepIdx((i) => Math.min(5, i + 1))}
            >
              <span>Next Face</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>

        {/* Right Review & Solution Column */}
        <div className="review-and-solve-card">
          <div className="review-card-header">
            <div className="review-header-title">
              <Eye size={17} className="text-accent" />
              <h4>Review & Fine-Tune Detected Colors</h4>
            </div>
            <span className="edit-hint-tag">Tap any sticker to correct color</span>
          </div>

          {/* 3x3 Current Face Interactive Review */}
          <div className="current-face-review-box">
            <div className="review-face-title">
              <span className="review-badge" style={{ backgroundColor: currentStep.badgeColor }}>
                {currentStep.face}
              </span>
              <span>{currentStep.name} (9 Stickers)</span>
            </div>

            <div className="face-stickers-3x3">
              {scannedState[currentFaceKey].map((color, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`sticker-box sticker-${color} ${idx === 4 ? 'center-fixed' : ''}`}
                  onClick={() => handleStickerClick(currentFaceKey, idx)}
                  title={idx === 4 ? 'Center piece (fixed)' : `Click to paint with ${selectedBrushColor}`}
                  style={{ backgroundColor: COLOR_METADATA[color]?.hex }}
                >
                  {idx === 4 && <span className="fixed-center-label">Center</span>}
                </button>
              ))}
            </div>

            {/* Quick Color Correction Brush Palette */}
            <div className="brush-palette-bar">
              <span className="brush-label">Brush:</span>
              {Object.keys(COLOR_KEYS).map((k) => {
                const colKey = COLOR_KEYS[k];
                const isSelected = selectedBrushColor === colKey;
                const meta = COLOR_METADATA[colKey];
                return (
                  <button
                    key={colKey}
                    type="button"
                    className={`brush-pill ${isSelected ? 'active' : ''}`}
                    onClick={() => setSelectedBrushColor(colKey)}
                    style={{
                      '--brush-c': meta.hex,
                      backgroundColor: meta.hex,
                      color: meta.darkText ? '#000' : '#fff'
                    }}
                    title={`Paint with ${meta.name}`}
                  >
                    {meta.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Real-World Sticker Count Gauge */}
          <div className="sticker-counts-gauge">
            <div className="gauge-title">Physical Cube Sticker Counts (Must be 9 each)</div>
            <div className="counts-pills-grid">
              {Object.keys(COLOR_KEYS).map((k) => {
                const col = COLOR_KEYS[k];
                const count = stickerCounts[col] || 0;
                const isNine = count === 9;
                const meta = COLOR_METADATA[col];
                return (
                  <div
                    key={col}
                    className={`count-pill ${isNine ? 'valid' : 'invalid'}`}
                  >
                    <span className="c-dot" style={{ backgroundColor: meta.hex }} />
                    <span className="c-name">{meta.name}:</span>
                    <strong className="c-val">{count}/9</strong>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Validation Alert */}
          {validationError && (
            <div className="scanner-error-alert">
              <AlertTriangle size={18} className="alert-icon text-warning" />
              <div className="alert-text">
                <strong>Attention Required:</strong> {validationError}
              </div>
            </div>
          )}

          {/* Solve Real Cube CTA */}
          <div className="solve-cta-wrap">
            <button
              type="button"
              className={`btn-solve-real-cube ${isSolving ? 'is-loading' : ''}`}
              onClick={handleSolveScannedCube}
              disabled={isSolving}
              aria-label="Solve My Cube"
            >
              {isSolving ? (
                <>
                  <Loader2 size={17} className="spin-icon btn-solve-spinner" />
                  <span className="btn-solve-text">Computing Optimal Solution...</span>
                </>
              ) : (
                <>
                  <span className="btn-solve-text">Solve My Cube</span>
                  <ArrowRight size={17} className="btn-solve-arrow" />
                </>
              )}
            </button>
            <div className="solve-cta-footer">
              <span className="solve-footer-badge">Kociemba Two-Phase AI</span>
              <span className="solve-footer-bullet">•</span>
              <span className="solve-footer-text">Calculates optimal move sequence in seconds</span>
            </div>
          </div>
        </div>
      </div>

      {/* Real-World Solution Section with Direct Text Solution & 3D Walkthrough */}
      {solution && (
        <div className="solution-walkthrough-section" id="solution-section">
          {/* Direct Text Solution Card */}
          <div className="direct-text-solution-card">
            <div className="direct-solution-header">
              <div className="header-left-group">
                <div className="solution-check-badge">
                  <CheckCircle2 size={24} className="text-success" />
                </div>
                <div>
                  <h3 className="direct-solution-title">Direct Text Solution (Full Move Sequence)</h3>
                  <p className="direct-solution-sub">
                    Solved in <strong>{solution.totalMoves} moves</strong> using optimal Kociemba Two-Phase AI. Follow on your physical cube!
                  </p>
                </div>
              </div>

              {/* View Mode Toggle: Text Only | 3D Walkthrough | Both */}
              <div className="solution-view-mode-tabs">
                <button
                  type="button"
                  className={`sol-tab ${solutionViewMode === 'text' ? 'active' : ''}`}
                  onClick={() => setSolutionViewMode('text')}
                  title="Show only the direct text algorithm and instructions"
                >
                  <FileText size={14} />
                  <span>Direct Text Only</span>
                </button>
                <button
                  type="button"
                  className={`sol-tab ${solutionViewMode === '3d' ? 'active' : ''}`}
                  onClick={() => setSolutionViewMode('3d')}
                  title="Show interactive 3D virtual player"
                >
                  <Box size={14} />
                  <span>3D Walkthrough</span>
                </button>
                <button
                  type="button"
                  className={`sol-tab ${solutionViewMode === 'both' ? 'active' : ''}`}
                  onClick={() => setSolutionViewMode('both')}
                  title="Show both direct text and 3D player"
                >
                  <Eye size={14} />
                  <span>Both Views</span>
                </button>
              </div>
            </div>

            {/* Prominent Raw Text Algorithm Block */}
            <div className="algorithm-direct-box">
              <div className="algo-box-header">
                <span className="algo-label">Complete Move Sequence (WCA Standard):</span>
                <div className="algo-header-actions">
                  <button
                    type="button"
                    className="btn-copy-solution"
                    onClick={handleCopySolutionMoves}
                    title="Copy move sequence string to clipboard"
                  >
                    {copiedMoves ? (
                      <>
                        <Check size={14} className="text-success" />
                        <span className="text-success font-semibold">✓ Copied Sequence!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>Copy Move Sequence</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn-copy-solution btn-copy-guide"
                    onClick={handleCopyNumberedGuide}
                    title="Copy numbered step-by-step instructions for offline reading"
                  >
                    {copiedGuide ? (
                      <>
                        <Check size={14} className="text-success" />
                        <span className="text-success font-semibold">✓ Copied Guide!</span>
                      </>
                    ) : (
                      <>
                        <FileText size={14} />
                        <span>Copy Text Guide</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Monospace Full Sequence Display */}
              <div className="raw-moves-display">
                <code>{solution.moves.length > 0 ? solution.moves.join(' ') : 'Cube is already solved!'}</code>
              </div>

              {/* Meta metrics bar */}
              <div className="algo-meta-bar">
                <span className="meta-pill">
                  <strong>Total Moves:</strong> {solution.totalMoves}
                </span>
                <span className="meta-pill">
                  <strong>Starting Orientation:</strong> Green in Front, White on Top
                </span>
                <span className="meta-pill">
                  <strong>AI Engine:</strong> Kociemba Two-Phase Optimal
                </span>
              </div>
            </div>

            {/* Direct Itemized Step-by-Step Text Guide */}
            {(solutionViewMode === 'text' || solutionViewMode === 'both') && (
              <div className="direct-step-list-wrap">
                <div className="step-list-header">
                  <h4>Step-by-Step Text Instructions ({solution.totalMoves} Steps)</h4>
                  <span className="step-list-hint">Click any step to preview on 3D cube</span>
                </div>

                <div className="direct-steps-grid">
                  {solution.moves.map((mv, idx) => {
                    const step = solution.steps?.[idx];
                    const desc = step?.description || `Turn ${mv}`;
                    const isCurrent = currentSolutionStep === idx + 1;
                    const isPast = currentSolutionStep > idx + 1;

                    return (
                      <div
                        key={idx}
                        className={`direct-step-item ${isCurrent ? 'is-current' : ''} ${isPast ? 'is-past' : ''}`}
                        onClick={() => handleStepSolution(idx + 1)}
                        title={`Click to jump to Step ${idx + 1}`}
                      >
                        <span className="step-item-num">#{idx + 1}</span>
                        <span className="step-item-badge">{mv}</span>
                        <span className="step-item-desc">{desc}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Visual 3D Player & Step Explanation (Shown when '3d' or 'both' view mode is active) */}
          {(solutionViewMode === '3d' || solutionViewMode === 'both') && (
            <div className="walkthrough-3d-interactive-container">
              <div className="walkthrough-header">
                <div className="walkthrough-title-group">
                  <Box size={22} className="text-accent" />
                  <div>
                    <h3>Interactive 3D Solution Walkthrough</h3>
                    <p className="walkthrough-sub">
                      Step {currentSolutionStep} of {solution.totalMoves} • Animate each turn or follow on your physical cube
                    </p>
                  </div>
                </div>

                <div className="walkthrough-step-counter">
                  <span>Step {currentSolutionStep} of {solution.totalMoves}</span>
                </div>
              </div>

              <div className="walkthrough-content-grid">
                {/* 3D Visualizer */}
                <div className="walkthrough-3d-pane">
                  <Cube3DView
                    cubeState={solutionCubeState || scannedState}
                    animatingMove={animatingMove}
                    isSolving={false}
                  />
                </div>

                {/* Step Card & Instructions */}
                <div className="walkthrough-instructions-pane">
                  <div className="current-step-card">
                    <div className="step-badge-row">
                      <span className="step-index-badge">
                        {currentSolutionStep === 0 ? 'Starting State' : `Move ${currentSolutionStep} of ${solution.totalMoves}`}
                      </span>
                      {currentSolutionStep > 0 && (
                        <span className="step-move-badge">
                          {solution.moves[currentSolutionStep - 1]}
                        </span>
                      )}
                    </div>

                    <div className="step-main-desc">
                      {currentSolutionStep === 0 ? (
                        <p>Hold your real-world cube with <strong>Green in Front</strong> and <strong>White on Top</strong> to begin.</p>
                      ) : (
                        <p>{solution.steps[currentSolutionStep - 1]?.description || `Turn ${solution.moves[currentSolutionStep - 1]}`}</p>
                      )}
                    </div>

                    {/* Move Sequence Ribbon */}
                    <div className="moves-ribbon-preview">
                      <span className="ribbon-label">Algorithm:</span>
                      <div className="moves-chips-list">
                        {solution.moves.map((mv, i) => (
                          <span
                            key={i}
                            className={`chip-mv ${i === currentSolutionStep - 1 ? 'active-step' : ''} ${i < currentSolutionStep - 1 ? 'past-step' : ''}`}
                            onClick={() => handleStepSolution(i + 1)}
                          >
                            {mv}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Player Controls */}
                    <div className="walkthrough-controls-row">
                      <button
                        type="button"
                        className="player-ctrl-btn"
                        disabled={currentSolutionStep === 0}
                        onClick={() => handleStepSolution(currentSolutionStep - 1)}
                        title="Previous move"
                      >
                        <ArrowLeft size={16} />
                        <span>Previous</span>
                      </button>

                      <button
                        type="button"
                        className="player-ctrl-btn btn-play-pause"
                        onClick={() => setIsPlayingSolution(!isPlayingSolution)}
                        title={isPlayingSolution ? 'Pause' : 'Auto Play'}
                      >
                        {isPlayingSolution ? <Pause size={18} /> : <Play size={18} />}
                        <span>{isPlayingSolution ? 'Pause' : 'Auto Play'}</span>
                      </button>

                      <button
                        type="button"
                        className="player-ctrl-btn btn-next"
                        disabled={currentSolutionStep === solution.totalMoves}
                        onClick={() => handleStepSolution(currentSolutionStep + 1)}
                        title="Next move"
                      >
                        <span>Next</span>
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
