/**
 * Rubik's Cube Engine
 * Handles internal state representation, color mappings, face rotations,
 * whole-cube reorientations, and conversions to/from Kociemba notation.
 */

export const COLOR_KEYS = {
  WHITE: 'white',
  YELLOW: 'yellow',
  RED: 'red',
  ORANGE: 'orange',
  BLUE: 'blue',
  GREEN: 'green'
};

export const COLOR_METADATA = {
  white: { name: 'White', hex: '#FFFFFF', darkText: true, defaultFace: 'U' },
  yellow: { name: 'Yellow', hex: '#FFD000', darkText: true, defaultFace: 'D' },
  red: { name: 'Red', hex: '#DC2626', darkText: false, defaultFace: 'R' },
  orange: { name: 'Orange', hex: '#FF6B00', darkText: false, defaultFace: 'L' },
  blue: { name: 'Blue', hex: '#2563EB', darkText: false, defaultFace: 'B' },
  green: { name: 'Green', hex: '#16A34A', darkText: false, defaultFace: 'F' }
};

export const FACE_NAMES = ['U', 'L', 'F', 'R', 'B', 'D'];

export const FACE_DETAILS = {
  U: { name: 'Up', title: 'Top Face', defaultColor: 'white', letter: 'U' },
  L: { name: 'Left', title: 'Left Face', defaultColor: 'orange', letter: 'L' },
  F: { name: 'Front', title: 'Front Face', defaultColor: 'green', letter: 'F' },
  R: { name: 'Right', title: 'Right Face', defaultColor: 'red', letter: 'R' },
  B: { name: 'Back', title: 'Back Face', defaultColor: 'blue', letter: 'B' },
  D: { name: 'Down', title: 'Bottom Face', defaultColor: 'yellow', letter: 'D' }
};

/**
 * Creates a brand new solved 54-sticker cube state
 * Each face has 9 stickers of its default color
 */
export function getSolvedState() {
  return {
    U: Array(9).fill(COLOR_KEYS.WHITE),
    L: Array(9).fill(COLOR_KEYS.ORANGE),
    F: Array(9).fill(COLOR_KEYS.GREEN),
    R: Array(9).fill(COLOR_KEYS.RED),
    B: Array(9).fill(COLOR_KEYS.BLUE),
    D: Array(9).fill(COLOR_KEYS.YELLOW)
  };
}

/**
 * Deep clones a cube state object
 */
export function cloneState(state) {
  return {
    U: [...state.U],
    L: [...state.L],
    F: [...state.F],
    R: [...state.R],
    B: [...state.B],
    D: [...state.D]
  };
}

/**
 * Rotates a 9-element 3x3 face array 90 degrees clockwise
 * [0, 1, 2]       [6, 3, 0]
 * [3, 4, 5]  -->  [7, 4, 1]
 * [6, 7, 8]       [8, 5, 2]
 */
function rotateFaceCW(face) {
  return [
    face[6], face[3], face[0],
    face[7], face[4], face[1],
    face[8], face[5], face[2]
  ];
}

/**
 * Rotates a 9-element 3x3 face array 90 degrees counter-clockwise
 */
function rotateFaceCCW(face) {
  return [
    face[2], face[5], face[8],
    face[1], face[4], face[7],
    face[0], face[3], face[6]
  ];
}

/**
 * Applies a standard Rubik's cube notation move to the state
 * (e.g. "R", "R'", "R2", "U", "F2", "X", etc.)
 */
export function applyMove(state, move) {
  if (!move || typeof move !== 'string') return state;
  const cleanMove = move.trim().replace('’', "'");
  const s = cloneState(state);

  // Helper to cycle 4 groups of 3 stickers: A -> B -> C -> D -> A
  function cycle4(faceA, idxA, faceB, idxB, faceC, idxC, faceD, idxD) {
    const temp = [s[faceA][idxA[0]], s[faceA][idxA[1]], s[faceA][idxA[2]]];
    for (let i = 0; i < 3; i++) {
      s[faceA][idxA[i]] = s[faceD][idxD[i]];
      s[faceD][idxD[i]] = s[faceC][idxC[i]];
      s[faceC][idxC[i]] = s[faceB][idxB[i]];
      s[faceB][idxB[i]] = temp[i];
    }
  }

  // Handle whole-cube rotations (X, Y, Z)
  if (cleanMove.startsWith('x') || cleanMove.startsWith('X')) {
    // X is equivalent to turning R face and slice layers, rotating whole cube along R
    const isPrime = cleanMove.includes("'");
    const is2 = cleanMove.includes('2');
    const turns = is2 ? 2 : isPrime ? 3 : 1;
    let curr = s;
    for (let t = 0; t < turns; t++) {
      const next = cloneState(curr);
      next.R = rotateFaceCW(curr.R);
      next.L = rotateFaceCCW(curr.L);
      next.U = [...curr.F];
      next.B = rotateFace180(curr.U);
      next.D = rotateFace180(curr.B);
      next.F = [...curr.D];
      curr = next;
    }
    return curr;
  }

  if (cleanMove.startsWith('y') || cleanMove.startsWith('Y')) {
    // Y is rotating whole cube around U axis
    const isPrime = cleanMove.includes("'");
    const is2 = cleanMove.includes('2');
    const turns = is2 ? 2 : isPrime ? 3 : 1;
    let curr = s;
    for (let t = 0; t < turns; t++) {
      const next = cloneState(curr);
      next.U = rotateFaceCW(curr.U);
      next.D = rotateFaceCCW(curr.D);
      next.F = [...curr.R];
      next.L = [...curr.F];
      next.B = [...curr.L];
      next.R = [...curr.B];
      curr = next;
    }
    return curr;
  }

  function rotateFace180(face) {
    return rotateFaceCW(rotateFaceCW(face));
  }

  const baseMove = cleanMove[0].toUpperCase();
  const isPrime = cleanMove.includes("'");
  const is2 = cleanMove.includes('2');

  function doCW() {
    switch (baseMove) {
      case 'U':
        s.U = rotateFaceCW(s.U);
        cycle4('B', [0, 1, 2], 'R', [0, 1, 2], 'F', [0, 1, 2], 'L', [0, 1, 2]);
        break;
      case 'D':
        s.D = rotateFaceCW(s.D);
        cycle4('F', [6, 7, 8], 'R', [6, 7, 8], 'B', [6, 7, 8], 'L', [6, 7, 8]);
        break;
      case 'L':
        s.L = rotateFaceCW(s.L);
        cycle4('U', [0, 3, 6], 'F', [0, 3, 6], 'D', [0, 3, 6], 'B', [8, 5, 2]);
        break;
      case 'R':
        s.R = rotateFaceCW(s.R);
        cycle4('U', [2, 5, 8], 'B', [6, 3, 0], 'D', [2, 5, 8], 'F', [2, 5, 8]);
        break;
      case 'F':
        s.F = rotateFaceCW(s.F);
        cycle4('U', [6, 7, 8], 'R', [0, 3, 6], 'D', [2, 1, 0], 'L', [8, 5, 2]);
        break;
      case 'B':
        s.B = rotateFaceCW(s.B);
        cycle4('U', [2, 1, 0], 'L', [0, 3, 6], 'D', [6, 7, 8], 'R', [8, 5, 2]);
        break;
      case 'M':
        // Middle slice between L and R, follows L direction (U -> F -> D -> B -> U)
        cycle4('U', [1, 4, 7], 'F', [1, 4, 7], 'D', [1, 4, 7], 'B', [7, 4, 1]);
        break;
      case 'E':
        // Equator slice between U and D, follows D direction (F -> R -> B -> L -> F)
        cycle4('F', [3, 4, 5], 'R', [3, 4, 5], 'B', [3, 4, 5], 'L', [3, 4, 5]);
        break;
      case 'S':
        // Standing slice between F and B, follows F direction (U -> R -> D -> L -> U)
        cycle4('U', [3, 4, 5], 'R', [1, 4, 7], 'D', [5, 4, 3], 'L', [7, 4, 1]);
        break;
      default:
        break;
    }
  }

  if (is2) {
    doCW();
    doCW();
  } else if (isPrime) {
    doCW();
    doCW();
    doCW();
  } else {
    doCW();
  }

  return s;
}

/**
 * Applies an array or space-separated string of moves sequentially
 */
export function applyMoves(state, moves) {
  const moveList = Array.isArray(moves) ? moves : moves.trim().split(/\s+/);
  let curr = state;
  for (const m of moveList) {
    if (m) curr = applyMove(curr, m);
  }
  return curr;
}

/**
 * Converts state to Kociemba 54-character representation:
 * Faces order: U (0-8), R (9-17), F (18-26), D (27-35), L (36-44), B (45-53)
 * Center stickers define the mapping from color to face letter.
 */
export function stateToKociembaString(state) {
  // Center stickers are index 4 of each face
  const colorMap = {
    [state.U[4]]: 'U',
    [state.R[4]]: 'R',
    [state.F[4]]: 'F',
    [state.D[4]]: 'D',
    [state.L[4]]: 'L',
    [state.B[4]]: 'B'
  };

  const order = ['U', 'R', 'F', 'D', 'L', 'B'];
  let str = '';
  for (const face of order) {
    for (let i = 0; i < 9; i++) {
      const col = state[face][i];
      str += colorMap[col] || '?';
    }
  }
  return { str, colorMap };
}

/**
 * Converts a 54-character Kociemba string back into a state object,
 * using a mapping from face letter to color.
 */
export function kociembaStringToState(kociembaStr, letterToColorMap) {
  const defaultLetterToColor = {
    U: COLOR_KEYS.WHITE,
    R: COLOR_KEYS.RED,
    F: COLOR_KEYS.GREEN,
    D: COLOR_KEYS.YELLOW,
    L: COLOR_KEYS.ORANGE,
    B: COLOR_KEYS.BLUE
  };
  const map = letterToColorMap || defaultLetterToColor;

  return {
    U: kociembaStr.slice(0, 9).split('').map(ch => map[ch]),
    R: kociembaStr.slice(9, 18).split('').map(ch => map[ch]),
    F: kociembaStr.slice(18, 27).split('').map(ch => map[ch]),
    D: kociembaStr.slice(27, 36).split('').map(ch => map[ch]),
    L: kociembaStr.slice(36, 45).split('').map(ch => map[ch]),
    B: kociembaStr.slice(45, 54).split('').map(ch => map[ch])
  };
}

/**
 * Checks if all stickers on each face are uniform (identical to face center)
 */
export function isStateSolved(state) {
  const faces = ['U', 'L', 'F', 'R', 'B', 'D'];
  return faces.every(f => {
    const center = state[f][4];
    return state[f].every(s => s === center);
  });
}

/**
 * Counts remaining / used stickers for each of the 6 colors
 */
export function getStickerCounts(state) {
  const counts = {
    white: 0,
    yellow: 0,
    red: 0,
    orange: 0,
    blue: 0,
    green: 0
  };
  const faces = ['U', 'L', 'F', 'R', 'B', 'D'];
  for (const f of faces) {
    for (let i = 0; i < 9; i++) {
      const color = state[f][i];
      if (counts[color] !== undefined) {
        counts[color]++;
      }
    }
  }
  return counts;
}
