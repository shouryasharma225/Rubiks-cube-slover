import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { COLOR_METADATA, FACE_DETAILS, applyMove } from '../solver/cubeEngine.js';
import {
  RotateCw,
  RotateCcw,
  Compass,
  Play,
  Pause,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  MoveVertical,
  MoveHorizontal
} from 'lucide-react';

const CUBIE_SIZE = 0.94;
const GAP = 0.06;
const STEP = CUBIE_SIZE + GAP; // 1.0

// Maps each 3D sticker face to the corresponding [faceKey, stickerIndex]
function getStickerMapping(x, y, z, faceNormal) {
  // U Face: y = 1, normal = (0, 1, 0)
  if (y === 1 && faceNormal.y > 0.5) {
    const row = z + 1; // z is -1, 0, 1 -> row 0, 1, 2
    const col = x + 1; // x is -1, 0, 1 -> col 0, 1, 2
    return ['U', row * 3 + col];
  }
  // D Face: y = -1, normal = (0, -1, 0)
  if (y === -1 && faceNormal.y < -0.5) {
    const row = 1 - z; // z is 1, 0, -1 -> row 0, 1, 2
    const col = x + 1; // x is -1, 0, 1 -> col 0, 1, 2
    return ['D', row * 3 + col];
  }
  // F Face: z = 1, normal = (0, 0, 1)
  if (z === 1 && faceNormal.z > 0.5) {
    const row = 1 - y; // y is 1, 0, -1 -> row 0, 1, 2
    const col = x + 1; // x is -1, 0, 1 -> col 0, 1, 2
    return ['F', row * 3 + col];
  }
  // B Face: z = -1, normal = (0, 0, -1)
  if (z === -1 && faceNormal.z < -0.5) {
    const row = 1 - y; // y is 1, 0, -1 -> row 0, 1, 2
    const col = 1 - x; // x is 1, 0, -1 -> col 0, 1, 2
    return ['B', row * 3 + col];
  }
  // R Face: x = 1, normal = (1, 0, 0)
  if (x === 1 && faceNormal.x > 0.5) {
    const row = 1 - y; // y is 1, 0, -1 -> row 0, 1, 2
    const col = 1 - z; // z is 1, 0, -1 -> col 0, 1, 2
    return ['R', row * 3 + col];
  }
  // L Face: x = -1, normal = (-1, 0, 0)
  if (x === -1 && faceNormal.x < -0.5) {
    const row = 1 - y; // y is 1, 0, -1 -> row 0, 1, 2
    const col = z + 1; // z is -1, 0, 1 -> col 0, 1, 2
    return ['L', row * 3 + col];
  }
  return null;
}

// Generates high-fidelity realistic matte plastic sticker texture
const textureCache = new Map();
function getMatteStickerTexture(colorKey, hexColor) {
  const cacheKey = `${colorKey}_${hexColor}`;
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey);
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Base: Deep dark matte charcoal cubie body
  ctx.fillStyle = '#161618';
  ctx.fillRect(0, 0, 512, 512);

  // Inset rounded sticker plate
  const margin = 26;
  const size = 512 - margin * 2;
  const radius = 38;

  function drawRoundedRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  // Realistic directional lighting gradient across the sticker face
  const grad = ctx.createLinearGradient(margin, margin, 512 - margin, 512 - margin);
  grad.addColorStop(0, hexColor);
  grad.addColorStop(1, adjustBrightness(hexColor, -10));

  drawRoundedRect(margin, margin, size, size, radius);
  ctx.fillStyle = grad;
  ctx.fill();

  // Subtle frosted plastic matte stippling/micro-noise
  ctx.save();
  ctx.clip();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.035)';
  for (let i = 0; i < 450; i++) {
    const rx = margin + Math.random() * size;
    const ry = margin + Math.random() * size;
    const rrad = 0.5 + Math.random() * 1.5;
    ctx.beginPath();
    ctx.arc(rx, ry, rrad, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
  for (let i = 0; i < 450; i++) {
    const rx = margin + Math.random() * size;
    const ry = margin + Math.random() * size;
    const rrad = 0.5 + Math.random() * 1.5;
    ctx.beginPath();
    ctx.arc(rx, ry, rrad, 0, Math.PI * 2);
    ctx.fill();
  }

  // Tactile 3D Bevel: top-left highlight, bottom-right shadow
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.beginPath();
  ctx.moveTo(margin + radius, margin + 2);
  ctx.lineTo(margin + size - radius, margin + 2);
  ctx.moveTo(margin + 2, margin + radius);
  ctx.lineTo(margin + 2, margin + size - radius);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(0, 0, 0, 0.32)';
  ctx.beginPath();
  ctx.moveTo(margin + radius, margin + size - 2);
  ctx.lineTo(margin + size - radius, margin + size - 2);
  ctx.moveTo(margin + size - 2, margin + radius);
  ctx.lineTo(margin + size - 2, margin + size - radius);
  ctx.stroke();

  ctx.restore();

  // Outer recessed border groove around sticker
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.55)';
  drawRoundedRect(margin, margin, size, size, radius);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  texture.generateMipmaps = true;
  textureCache.set(cacheKey, texture);
  return texture;
}

// Adjusts hex color lightness
function adjustBrightness(hex, percent) {
  const cleanHex = hex.replace('#', '');
  const num = parseInt(cleanHex, 16);
  let r = (num >> 16) + Math.round(255 * (percent / 100));
  let g = ((num >> 8) & 0x00ff) + Math.round(255 * (percent / 100));
  let b = (num & 0x0000ff) + Math.round(255 * (percent / 100));
  r = Math.min(255, Math.max(0, r));
  g = Math.min(255, Math.max(0, g));
  b = Math.min(255, Math.max(0, b));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

// Synchronously update cubie sticker textures to match any given cube state
function syncCubiesStickers(cubies, state) {
  if (!cubies || !cubies.length || !state) return;

  cubies.forEach((mesh) => {
    const { x, y, z } = mesh.userData;
    const mats = mesh.material;

    // Index 0: +X (R Face)
    if (x === 1) {
      const mapping = getStickerMapping(x, y, z, { x: 1, y: 0, z: 0 });
      if (mapping) {
        const color = state[mapping[0]][mapping[1]];
        const hex = COLOR_METADATA[color]?.hex || '#DC2626';
        const tex = getMatteStickerTexture(color, hex);
        if (mats[0].map !== tex) {
          mats[0].map = tex;
          mats[0].color.set(0xffffff);
          mats[0].roughness = 0.52;
          mats[0].metalness = 0.03;
          mats[0].needsUpdate = true;
        }
      }
    }
    // Index 1: -X (L Face)
    if (x === -1) {
      const mapping = getStickerMapping(x, y, z, { x: -1, y: 0, z: 0 });
      if (mapping) {
        const color = state[mapping[0]][mapping[1]];
        const hex = COLOR_METADATA[color]?.hex || '#FF6B00';
        const tex = getMatteStickerTexture(color, hex);
        if (mats[1].map !== tex) {
          mats[1].map = tex;
          mats[1].color.set(0xffffff);
          mats[1].roughness = 0.52;
          mats[1].metalness = 0.03;
          mats[1].needsUpdate = true;
        }
      }
    }
    // Index 2: +Y (U Face)
    if (y === 1) {
      const mapping = getStickerMapping(x, y, z, { x: 0, y: 1, z: 0 });
      if (mapping) {
        const color = state[mapping[0]][mapping[1]];
        const hex = COLOR_METADATA[color]?.hex || '#FFFFFF';
        const tex = getMatteStickerTexture(color, hex);
        if (mats[2].map !== tex) {
          mats[2].map = tex;
          mats[2].color.set(0xffffff);
          mats[2].roughness = 0.52;
          mats[2].metalness = 0.03;
          mats[2].needsUpdate = true;
        }
      }
    }
    // Index 3: -Y (D Face)
    if (y === -1) {
      const mapping = getStickerMapping(x, y, z, { x: 0, y: -1, z: 0 });
      if (mapping) {
        const color = state[mapping[0]][mapping[1]];
        const hex = COLOR_METADATA[color]?.hex || '#FFD000';
        const tex = getMatteStickerTexture(color, hex);
        if (mats[3].map !== tex) {
          mats[3].map = tex;
          mats[3].color.set(0xffffff);
          mats[3].roughness = 0.52;
          mats[3].metalness = 0.03;
          mats[3].needsUpdate = true;
        }
      }
    }
    // Index 4: +Z (F Face)
    if (z === 1) {
      const mapping = getStickerMapping(x, y, z, { x: 0, y: 0, z: 1 });
      if (mapping) {
        const color = state[mapping[0]][mapping[1]];
        const hex = COLOR_METADATA[color]?.hex || '#16A34A';
        const tex = getMatteStickerTexture(color, hex);
        if (mats[4].map !== tex) {
          mats[4].map = tex;
          mats[4].color.set(0xffffff);
          mats[4].roughness = 0.52;
          mats[4].metalness = 0.03;
          mats[4].needsUpdate = true;
        }
      }
    }
    // Index 5: -Z (B Face)
    if (z === -1) {
      const mapping = getStickerMapping(x, y, z, { x: 0, y: 0, z: -1 });
      if (mapping) {
        const color = state[mapping[0]][mapping[1]];
        const hex = COLOR_METADATA[color]?.hex || '#2563EB';
        const tex = getMatteStickerTexture(color, hex);
        if (mats[5].map !== tex) {
          mats[5].map = tex;
          mats[5].color.set(0xffffff);
          mats[5].roughness = 0.52;
          mats[5].metalness = 0.03;
          mats[5].needsUpdate = true;
        }
      }
    }
  });
}

// Layer rotation definitions for Rubik's cube notation, including CENTER SLICES
const LAYER_MAP = {
  U: { axis: 'y', baseAngle: -Math.PI / 2, inLayer: p => p.y === 1 },
  D: { axis: 'y', baseAngle: Math.PI / 2, inLayer: p => p.y === -1 },
  R: { axis: 'x', baseAngle: -Math.PI / 2, inLayer: p => p.x === 1 },
  L: { axis: 'x', baseAngle: Math.PI / 2, inLayer: p => p.x === -1 },
  F: { axis: 'z', baseAngle: -Math.PI / 2, inLayer: p => p.z === 1 },
  B: { axis: 'z', baseAngle: Math.PI / 2, inLayer: p => p.z === -1 },
  // Center / Middle Layer Slices:
  M: { axis: 'x', baseAngle: Math.PI / 2, inLayer: p => p.x === 0 }, // Middle slice (follows L direction)
  E: { axis: 'y', baseAngle: Math.PI / 2, inLayer: p => p.y === 0 }, // Equator slice (follows D direction)
  S: { axis: 'z', baseAngle: -Math.PI / 2, inLayer: p => p.z === 0 }  // Standing slice (follows F direction)
};

const OPPOSITES = { U: 'D', D: 'U', R: 'L', L: 'R', F: 'B', B: 'F' };
const FACE_VECTORS = {
  R: new THREE.Vector3(1, 0, 0),
  L: new THREE.Vector3(-1, 0, 0),
  U: new THREE.Vector3(0, 1, 0),
  D: new THREE.Vector3(0, -1, 0),
  F: new THREE.Vector3(0, 0, 1),
  B: new THREE.Vector3(0, 0, -1)
};

export function Cube3DView({
  cubeState,
  onPaintSticker,
  animatingMove,
  onAnimationComplete,
  onOrientationChange,
  onQuickMove,
  isSolving
}) {
  const containerRef = useRef(null);
  const [autoRotate, setAutoRotate] = useState(false);
  const [facingOrientation, setFacingOrientation] = useState({
    front: 'F',
    right: 'R',
    up: 'U'
  });
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const cubiesRef = useRef([]);
  const pivotRef = useRef(null);
  const rotationGroupRef = useRef(null);
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const activeTurnAnimationRef = useRef(null);

  // Dynamically detect which face is currently pointing front, right, top, etc. relative to the camera
  const updateOrientation = useCallback(() => {
    if (!rotationGroupRef.current || !cameraRef.current) return;

    const camDir = cameraRef.current.position.clone().normalize();
    const invMatrix = rotationGroupRef.current.matrixWorld.clone().invert();
    const localCamDir = camDir.clone().transformDirection(invMatrix).normalize();

    const camRight = new THREE.Vector3(1, 0, 0).applyQuaternion(cameraRef.current.quaternion).normalize();
    const localCamRight = camRight.clone().transformDirection(invMatrix).normalize();

    const camUp = new THREE.Vector3(0, 1, 0).applyQuaternion(cameraRef.current.quaternion).normalize();
    const localCamUp = camUp.clone().transformDirection(invMatrix).normalize();

    // 1. Best Front face (maximum dot product with camera direction)
    let bestFront = 'F', maxF = -Infinity;
    Object.keys(FACE_VECTORS).forEach((k) => {
      const dot = FACE_VECTORS[k].dot(localCamDir);
      if (dot > maxF) {
        maxF = dot;
        bestFront = k;
      }
    });
    const bestBack = OPPOSITES[bestFront];

    // 2. Best Right face from remaining 4 orthogonal faces
    let bestRight = 'R', maxR = -Infinity;
    Object.keys(FACE_VECTORS).forEach((k) => {
      if (k !== bestFront && k !== bestBack) {
        const dot = FACE_VECTORS[k].dot(localCamRight);
        if (dot > maxR) {
          maxR = dot;
          bestRight = k;
        }
      }
    });
    const bestLeft = OPPOSITES[bestRight];

    // 3. Best Up face from remaining 2 orthogonal faces
    let bestUp = 'U', maxU = -Infinity;
    Object.keys(FACE_VECTORS).forEach((k) => {
      if (k !== bestFront && k !== bestBack && k !== bestRight && k !== bestLeft) {
        const dot = FACE_VECTORS[k].dot(localCamUp);
        if (dot > maxU) {
          maxU = dot;
          bestUp = k;
        }
      }
    });
    const bestDown = OPPOSITES[bestUp];

    setFacingOrientation({ front: bestFront, right: bestRight, up: bestUp });

    if (onOrientationChange) {
      onOrientationChange({
        front: bestFront,
        right: bestRight,
        up: bestUp,
        left: bestLeft,
        down: bestDown,
        back: bestBack
      });
    }
  }, [onOrientationChange]);

  // Initialize Three.js scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 440;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera aligned with front face (Z-axis) at eye level with slight elevation
    const camera = new THREE.PerspectiveCamera(37, width / height, 0.1, 100);
    camera.position.set(0, 2.6, 7.8);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer with WebGL antialiasing
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch (err) {
      console.warn('WebGL initialization error:', err);
      return;
    }
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Studio Lighting for Matte Surface Realism
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    scene.add(ambientLight);

    // Warm key light
    const keyLight = new THREE.DirectionalLight(0xfffbf0, 1.4);
    keyLight.position.set(5.5, 7.5, 6.5);
    scene.add(keyLight);

    // Cool soft fill light
    const fillLight = new THREE.DirectionalLight(0xeef4ff, 0.75);
    fillLight.position.set(-5.5, -2.5, -4.5);
    scene.add(fillLight);

    // Top edge defining rim light
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.45);
    rimLight.position.set(0, 6.5, -5.5);
    scene.add(rimLight);

    // Soft Studio Contact Shadow directly beneath cube
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const sctx = shadowCanvas.getContext('2d');
    const sGrad = sctx.createRadialGradient(128, 128, 12, 128, 128, 120);
    sGrad.addColorStop(0, 'rgba(15, 23, 42, 0.28)');
    sGrad.addColorStop(0.45, 'rgba(15, 23, 42, 0.10)');
    sGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');
    sctx.fillStyle = sGrad;
    sctx.fillRect(0, 0, 256, 256);

    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowGeo = new THREE.PlaneGeometry(4.2, 4.2);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.85,
      depthWrite: false
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.position.y = -1.82;
    scene.add(shadowMesh);

    // Cube rotation group (for user drag orbiting with full 360° freedom)
    // Initial isometric angle: Front (+Z Green) is facing front, Right (+X Red) on right, Up (+Y White) on top
    const rotationGroup = new THREE.Group();
    const initialEuler = new THREE.Euler(0.35, -0.45, 0, 'YXZ');
    rotationGroup.quaternion.setFromEuler(initialEuler);
    scene.add(rotationGroup);
    rotationGroupRef.current = rotationGroup;

    // Pivot group for animating layer rotations
    const pivot = new THREE.Group();
    rotationGroup.add(pivot);
    pivotRef.current = pivot;

    // Cubie geometry
    const geometry = new THREE.BoxGeometry(CUBIE_SIZE, CUBIE_SIZE, CUBIE_SIZE);

    // Deep matte charcoal plastic material for cubie body
    const darkMatteMaterial = new THREE.MeshStandardMaterial({
      color: 0x161618,
      roughness: 0.62,
      metalness: 0.04
    });

    // Create 27 cubies
    const cubies = [];
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          // 6 materials per cubie: +X (R), -X (L), +Y (U), -Y (D), +Z (F), -Z (B)
          const materials = [
            darkMatteMaterial.clone(),
            darkMatteMaterial.clone(),
            darkMatteMaterial.clone(),
            darkMatteMaterial.clone(),
            darkMatteMaterial.clone(),
            darkMatteMaterial.clone()
          ];

          const mesh = new THREE.Mesh(geometry, materials);
          mesh.position.set(x * STEP, y * STEP, z * STEP);
          mesh.userData = { initialX: x, initialY: y, initialZ: z, x, y, z };

          rotationGroup.add(mesh);
          cubies.push(mesh);
        }
      }
    }
    cubiesRef.current = cubies;

    // Initial sticker texture application
    if (cubeState) {
      syncCubiesStickers(cubies, cubeState);
    }

    // Trigger initial orientation notification
    updateOrientation();

    // Animation Loop
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Handle active layer turning animation with Butter-Smooth Zero-Jitter Physics
      if (activeTurnAnimationRef.current && pivotRef.current && rotationGroupRef.current) {
        const anim = activeTurnAnimationRef.current;
        const now = performance.now();
        const elapsed = now - anim.startTime;
        const progress = Math.min(1.0, elapsed / anim.duration);

        // Sinusoidal easing: zero initial and terminal acceleration for ultra-smooth mechanical glide
        const eased = 0.5 * (1 - Math.cos(progress * Math.PI));

        pivotRef.current.rotation[anim.axis] = anim.targetAngle * eased;

        if (progress >= 1.0) {
          // 1. Synchronously pre-apply resulting state stickers BEFORE rendering this frame
          if (anim.nextState) {
            syncCubiesStickers(cubiesRef.current, anim.nextState);
          }

          // 2. Detach all cubies back to rotationGroup at their exact grid positions
          anim.cubies.forEach(({ mesh, origX, origY, origZ }) => {
            rotationGroupRef.current.add(mesh);
            mesh.position.set(origX * STEP, origY * STEP, origZ * STEP);
            mesh.rotation.set(0, 0, 0);
            mesh.updateMatrix();
          });

          // 3. Reset pivot rotation to zero
          pivotRef.current.rotation.set(0, 0, 0);

          const onDone = anim.onComplete;
          const targetStep = anim.targetStep;
          const callback = anim.onCompleteCallback;
          activeTurnAnimationRef.current = null;

          if (onDone) {
            onDone(targetStep, callback);
          }
        }
      }

      // Auto-spin turntable mode
      if (autoRotate && rotationGroupRef.current && !isDraggingRef.current && !activeTurnAnimationRef.current) {
        const qSpin = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0.008);
        rotationGroupRef.current.quaternion.premultiply(qSpin);
        rotationGroupRef.current.updateMatrixWorld(true);
        updateOrientation();
      }

      renderer.render(scene, camera);
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth || 400;
      const newHeight = container.clientHeight || 440;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      if (renderer) renderer.setSize(newWidth, newHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Update sticker materials with matte textures whenever external cubeState changes
  useEffect(() => {
    // Only update if not currently in mid-animation to prevent conflicts
    if (!activeTurnAnimationRef.current && cubiesRef.current.length && cubeState) {
      syncCubiesStickers(cubiesRef.current, cubeState);
    }
  }, [cubeState]);

  // Initiate 3D layer turn rotation when animatingMove triggers
  useEffect(() => {
    if (!animatingMove || !pivotRef.current || !rotationGroupRef.current) return;

    const { move, reverse, duration, targetStep, onCompleteCallback } = animatingMove;
    if (!move) return;

    const base = move[0].toUpperCase();
    const cfg = LAYER_MAP[base];
    if (!cfg) return;

    let targetAngle = cfg.baseAngle;
    if (move.includes("'")) {
      targetAngle = -targetAngle;
    } else if (move.includes('2')) {
      targetAngle = targetAngle * 2;
    }
    if (reverse) {
      targetAngle = -targetAngle;
    }

    // Determine effective move to compute next state
    let effectiveMove = move;
    if (reverse) {
      if (move.includes('2')) {
        effectiveMove = move;
      } else if (move.includes("'")) {
        effectiveMove = base;
      } else {
        effectiveMove = `${base}'`;
      }
    }
    const nextState = cubeState ? applyMove(cubeState, effectiveMove) : null;

    // Reset pivot
    pivotRef.current.rotation.set(0, 0, 0);

    // Identify the 9 cubies in the target face layer (or center slice)
    const activeCubies = [];
    cubiesRef.current.forEach((mesh) => {
      const { x, y, z } = mesh.userData;
      if (cfg.inLayer({ x, y, z })) {
        pivotRef.current.attach(mesh);
        activeCubies.push({ mesh, origX: x, origY: y, origZ: z });
      }
    });

    activeTurnAnimationRef.current = {
      axis: cfg.axis,
      targetAngle,
      startTime: performance.now(),
      duration: Math.max(70, duration || 240),
      cubies: activeCubies,
      nextState,
      targetStep,
      onCompleteCallback,
      onComplete: onAnimationComplete
    };
  }, [animatingMove, cubeState, onAnimationComplete]);

  // Mouse & Touch Orbit Controls
  const handleMouseDown = (e) => {
    isDraggingRef.current = true;
    previousMousePositionRef.current = {
      x: e.clientX || (e.touches && e.touches[0].clientX),
      y: e.clientY || (e.touches && e.touches[0].clientY)
    };
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current || !rotationGroupRef.current) return;
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);

    const deltaX = clientX - previousMousePositionRef.current.x;
    const deltaY = clientY - previousMousePositionRef.current.y;

    if (deltaX !== 0 || deltaY !== 0) {
      const rotSpeed = 0.007;
      // World-space / camera-aligned rotation with full 360° freedom in all directions:
      // deltaX (horizontal drag) rotates around world Y axis (spin left/right)
      // deltaY (vertical drag) rotates around world X axis (tilt ground side up to front or top side down)
      const qY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), deltaX * rotSpeed);
      const qX = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), deltaY * rotSpeed);

      rotationGroupRef.current.quaternion.premultiply(qX).premultiply(qY);
      rotationGroupRef.current.updateMatrixWorld(true);

      previousMousePositionRef.current = { x: clientX, y: clientY };
      updateOrientation();
    }
  };

  const handleMouseUp = (e) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    updateOrientation();

    // Quick click to paint sticker
    if (e.type === 'mouseup' && onPaintSticker && !activeTurnAnimationRef.current) {
      handleClickSticker(e);
    }
  };

  // Rotate whole cube view by 90 degrees around Y (left/right) or X (up/down / ground to front)
  const rotateWholeCubeView = (axis, angle) => {
    if (!rotationGroupRef.current) return;
    const axisVec = axis === 'x' ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
    const q = new THREE.Quaternion().setFromAxisAngle(axisVec, angle);
    rotationGroupRef.current.quaternion.premultiply(q);
    rotationGroupRef.current.updateMatrixWorld(true);
    updateOrientation();
  };

  // Raycaster for clicking stickers directly on the 3D model
  const handleClickSticker = (e) => {
    if (!containerRef.current || !cameraRef.current || !rotationGroupRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

    const intersects = raycaster.intersectObjects(cubiesRef.current);
    if (intersects.length > 0) {
      const hit = intersects[0];
      const mesh = hit.object;
      const normalMatrix = new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld);
      const worldNormal = hit.face.normal.clone().applyMatrix3(normalMatrix).normalize();

      // Convert world normal back to cube local coordinates
      const invGroup = rotationGroupRef.current.matrixWorld.clone().invert();
      const localNormal = worldNormal.clone().transformDirection(invGroup).round();

      const mapping = getStickerMapping(
        mesh.userData.x,
        mesh.userData.y,
        mesh.userData.z,
        localNormal
      );

      if (mapping) {
        onPaintSticker(mapping[0], mapping[1]);
      }
    }
  };

  const resetCamera = () => {
    if (rotationGroupRef.current) {
      const initialEuler = new THREE.Euler(0.35, -0.45, 0, 'YXZ');
      rotationGroupRef.current.quaternion.setFromEuler(initialEuler);
      rotationGroupRef.current.updateMatrixWorld(true);
      updateOrientation();
    }
  };

  const frontColor = FACE_DETAILS[facingOrientation.front]?.defaultColor || 'green';
  const frontHex = COLOR_METADATA[frontColor]?.hex || '#16A34A';
  const topColor = FACE_DETAILS[facingOrientation.up]?.defaultColor || 'white';
  const topHex = COLOR_METADATA[topColor]?.hex || '#FFFFFF';
  const rightColor = FACE_DETAILS[facingOrientation.right]?.defaultColor || 'red';
  const rightHex = COLOR_METADATA[rightColor]?.hex || '#DC2626';

  return (
    <div className="cube-3d-wrapper">
      {/* Dynamic 3D Orientation HUD Pill */}
      <div className="cube-3d-orientation-pill" title="Current dynamic face orientation based on 3D angle">
        <span className="orient-item">
          <span className="orient-label">Front:</span>
          <span className="orient-color-dot" style={{ backgroundColor: frontHex }} />
          <strong>{FACE_DETAILS[facingOrientation.front]?.name} ({facingOrientation.front})</strong>
        </span>
        <span className="orient-separator">•</span>
        <span className="orient-item">
          <span className="orient-label">Right:</span>
          <span className="orient-color-dot" style={{ backgroundColor: rightHex }} />
          <span>{FACE_DETAILS[facingOrientation.right]?.name} ({facingOrientation.right})</span>
        </span>
        <span className="orient-separator">•</span>
        <span className="orient-item">
          <span className="orient-label">Top:</span>
          <span className="orient-color-dot" style={{ backgroundColor: topHex }} />
          <span>{FACE_DETAILS[facingOrientation.up]?.name} ({facingOrientation.up})</span>
        </span>
      </div>

      <div
        ref={containerRef}
        className="cube-3d-canvas-container"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
        title="Click and drag to rotate the 3D cube view. Whichever face is in front becomes the Front face!"
      />

      <div className="cube-3d-toolbar">
        {/* Whole Cube View Turn Buttons */}
        <button
          className="cube-3d-tool-btn"
          onClick={() => rotateWholeCubeView('x', -Math.PI / 2)}
          title="Tilt Ground (Bottom) Face Up to Front"
          aria-label="Tilt Ground to Front"
        >
          <ArrowUp size={14} />
          <span>Ground ↑</span>
        </button>

        <button
          className="cube-3d-tool-btn"
          onClick={() => rotateWholeCubeView('x', Math.PI / 2)}
          title="Tilt Top (Up) Face Down to Front"
          aria-label="Tilt Top to Front"
        >
          <ArrowDown size={14} />
          <span>Top ↓</span>
        </button>

        <button
          className="cube-3d-tool-btn"
          onClick={() => rotateWholeCubeView('y', Math.PI / 2)}
          title="Turn Cube View Left 90°"
          aria-label="Turn Cube Left"
        >
          <ArrowLeft size={14} />
          <span>Left ←</span>
        </button>

        <button
          className="cube-3d-tool-btn"
          onClick={() => rotateWholeCubeView('y', -Math.PI / 2)}
          title="Turn Cube View Right 90°"
          aria-label="Turn Cube Right"
        >
          <ArrowRight size={14} />
          <span>Right →</span>
        </button>

        {/* Center Layer Slice Buttons if onQuickMove provided */}
        {onQuickMove && (
          <>
            <button
              className="cube-3d-tool-btn btn-slice-quick"
              onClick={() => onQuickMove('M')}
              title="Turn Center Vertical Layer (Middle Slice M)"
              aria-label="Turn Middle Slice M"
            >
              <MoveVertical size={14} className="text-accent" />
              <span>Turn M</span>
            </button>

            <button
              className="cube-3d-tool-btn btn-slice-quick"
              onClick={() => onQuickMove('E')}
              title="Turn Center Horizontal Layer (Equator Slice E)"
              aria-label="Turn Equator Slice E"
            >
              <MoveHorizontal size={14} className="text-accent" />
              <span>Turn E</span>
            </button>
          </>
        )}

        <button
          className="cube-3d-tool-btn"
          onClick={resetCamera}
          title="Reset 3D View Angle"
          aria-label="Reset 3D View"
        >
          <Compass size={14} />
          <span>Reset View</span>
        </button>

        <button
          className={`cube-3d-tool-btn ${autoRotate ? 'active' : ''}`}
          onClick={() => setAutoRotate(!autoRotate)}
          title="Auto-Rotate Turntable"
          aria-label="Toggle Auto Rotate"
        >
          {autoRotate ? <Pause size={14} /> : <Play size={14} />}
          <span>Spin</span>
        </button>
      </div>

      <div className="cube-3d-hint">
        <span>Rotate in 3D to set Front Face • Turn Middle & Center slices</span>
      </div>
    </div>
  );
}
