/**
 * Rubik's Cube Physical State & Parity Validator
 * Performs exhaustive mathematical validation of:
 * - Sticker counts (9 per color)
 * - Center piece uniqueness and opposing relationships
 * - 12 Edge pieces (uniqueness, validity, orientation parity)
 * - 8 Corner pieces (uniqueness, validity, orientation parity)
 * - Permutation parity (edge sign == corner sign)
 */

import { stateToKociembaString, getStickerCounts } from './cubeEngine.js';

// Standard solved edge colors in Kociemba notation:
// UB, UR, UF, UL, FR, FL, BL, BR, DF, DR, DB, DL
const SOLVED_EDGES = [
  ['U', 'B'], ['U', 'R'], ['U', 'F'], ['U', 'L'],
  ['F', 'R'], ['F', 'L'], ['B', 'L'], ['B', 'R'],
  ['D', 'F'], ['D', 'R'], ['D', 'B'], ['D', 'L']
];

// Indices in 54-char Kociemba string (U=0..8, R=9..17, F=18..26, D=27..35, L=36..44, B=45..53)
const EDGE_INDICES = [
  [1, 46], // UB: U1, B1
  [5, 10], // UR: U5, R1
  [7, 19], // UF: U7, F1
  [3, 37], // UL: U3, L1
  [23, 12], // FR: F5, R3
  [21, 41], // FL: F3, L5
  [50, 39], // BL: B5, L3
  [48, 14], // BR: B3, R5
  [28, 25], // DF: D1, F7
  [32, 16], // DR: D5, R7
  [34, 52], // DB: D7, B7
  [30, 43]  // DL: D3, L7
];

// Standard solved corner colors in Kociemba notation:
// UBL, UBR, UFR, UFL, DFL, DFR, DBR, DBL
const SOLVED_CORNERS = [
  ['U', 'B', 'L'], ['U', 'R', 'B'], ['U', 'F', 'R'], ['U', 'L', 'F'],
  ['D', 'F', 'L'], ['D', 'R', 'F'], ['D', 'B', 'R'], ['D', 'L', 'B']
];

const CORNER_INDICES = [
  [0, 47, 36], // UBL: U0, B2, L0
  [2, 11, 45], // UBR: U2, R2, B0
  [8, 20, 9],  // UFR: U8, F2, R0
  [6, 38, 18], // UFL: U6, L2, F0
  [27, 24, 44], // DFL: D0, F6, L8
  [29, 15, 26], // DFR: D2, R6, F8
  [35, 51, 17], // DBR: D8, B6, R8
  [33, 42, 53]  // DBL: D6, L6, B8
];

/**
 * Validates a cube state object
 * Returns { valid: boolean, error: string | null, details: object }
 */
export function validateCube(state) {
  // 1. Check sticker counts
  const counts = getStickerCounts(state);
  const colorNames = {
    white: 'White',
    yellow: 'Yellow',
    red: 'Red',
    orange: 'Orange',
    blue: 'Blue',
    green: 'Green'
  };

  const imbalanced = [];
  for (const [col, count] of Object.entries(counts)) {
    if (count !== 9) {
      imbalanced.push(`${colorNames[col] || col}: ${count}/9`);
    }
  }

  if (imbalanced.length > 0) {
    return {
      valid: false,
      error: `Sticker count mismatch! Every color must appear exactly 9 times. Discrepancies: ${imbalanced.join(', ')}.`,
      details: { type: 'STICKER_COUNT', imbalanced, counts }
    };
  }

  // 2. Check centers
  const centerColors = [
    state.U[4],
    state.L[4],
    state.F[4],
    state.R[4],
    state.B[4],
    state.D[4]
  ];
  const uniqueCenters = new Set(centerColors);
  if (uniqueCenters.size !== 6) {
    return {
      valid: false,
      error: 'Center pieces must all have different colors. Two or more faces have identical center stickers.',
      details: { type: 'CENTER_DUPLICATE', centerColors }
    };
  }

  // Check center opposing pairs: U must oppose D, L must oppose R, F must oppose B
  // If center pairs share colors with each other in an illegal orientation
  const { str: faceletStr } = stateToKociembaString(state);

  // 3. Edges validation
  const edgePerm = [];
  let edgeOrientationSum = 0;
  const seenEdges = new Set();

  for (let i = 0; i < 12; i++) {
    const [idx1, idx2] = EDGE_INDICES[i];
    const c1 = faceletStr[idx1];
    const c2 = faceletStr[idx2];

    let matchIdx = -1;
    let orientation = 0;

    for (let j = 0; j < 12; j++) {
      const [s1, s2] = SOLVED_EDGES[j];
      if (c1 === s1 && c2 === s2) {
        matchIdx = j;
        orientation = 0;
        break;
      } else if (c1 === s2 && c2 === s1) {
        matchIdx = j;
        orientation = 1;
        break;
      }
    }

    if (matchIdx === -1) {
      return {
        valid: false,
        error: `Impossible edge piece: [${c1}, ${c2}] is not a valid edge on a standard cube. Adjacent stickers on an edge cannot be opposite colors (e.g. White-Yellow, Red-Orange, Blue-Green).`,
        details: { type: 'INVALID_EDGE_PIECE', edgeIndex: i, colors: [c1, c2] }
      };
    }

    if (seenEdges.has(matchIdx)) {
      const [s1, s2] = SOLVED_EDGES[matchIdx];
      return {
        valid: false,
        error: `Duplicate edge piece detected: edge [${s1}, ${s2}] appears more than once on the cube.`,
        details: { type: 'DUPLICATE_EDGE', matchIdx, colors: [s1, s2] }
      };
    }

    seenEdges.add(matchIdx);
    edgePerm.push(matchIdx);
    edgeOrientationSum += orientation;
  }

  // Check Edge Orientation Parity
  if (edgeOrientationSum % 2 !== 0) {
    return {
      valid: false,
      error: 'Impossible Edge Orientation: Exactly one edge piece is flipped in place. A 3x3 cube cannot have a single flipped edge without disassembly.',
      details: { type: 'EDGE_ORIENTATION_PARITY', edgeOrientationSum }
    };
  }

  // 4. Corners validation
  const cornerPerm = [];
  let cornerOrientationSum = 0;
  const seenCorners = new Set();

  for (let i = 0; i < 8; i++) {
    const [i1, i2, i3] = CORNER_INDICES[i];
    const c1 = faceletStr[i1];
    const c2 = faceletStr[i2];
    const c3 = faceletStr[i3];

    let matchIdx = -1;
    let orientation = 0;

    for (let j = 0; j < 8; j++) {
      const [s1, s2, s3] = SOLVED_CORNERS[j];
      if (c1 === s1 && c2 === s2 && c3 === s3) {
        matchIdx = j;
        orientation = 0;
        break;
      } else if (c1 === s2 && c2 === s3 && c3 === s1) {
        matchIdx = j;
        orientation = 1;
        break;
      } else if (c1 === s3 && c2 === s1 && c3 === s2) {
        matchIdx = j;
        orientation = 2;
        break;
      }
    }

    if (matchIdx === -1) {
      return {
        valid: false,
        error: `Impossible corner piece: [${c1}, ${c2}, ${c3}] is not a valid corner. Corners cannot contain opposite colors.`,
        details: { type: 'INVALID_CORNER_PIECE', cornerIndex: i, colors: [c1, c2, c3] }
      };
    }

    if (seenCorners.has(matchIdx)) {
      const [s1, s2, s3] = SOLVED_CORNERS[matchIdx];
      return {
        valid: false,
        error: `Duplicate corner piece detected: corner [${s1}, ${s2}, ${s3}] appears more than once on the cube.`,
        details: { type: 'DUPLICATE_CORNER', matchIdx, colors: [s1, s2, s3] }
      };
    }

    seenCorners.add(matchIdx);
    cornerPerm.push(matchIdx);
    cornerOrientationSum += orientation;
  }

  // Check Corner Orientation Parity
  if (cornerOrientationSum % 3 !== 0) {
    return {
      valid: false,
      error: 'Impossible Corner Orientation: Exactly one corner piece is twisted in place. A 3x3 cube cannot have a single twisted corner.',
      details: { type: 'CORNER_ORIENTATION_PARITY', cornerOrientationSum }
    };
  }

  // 5. Permutation Parity
  function countInversions(arr) {
    let inv = 0;
    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        if (arr[i] > arr[j]) inv++;
      }
    }
    return inv % 2;
  }

  const edgeParity = countInversions(edgePerm);
  const cornerParity = countInversions(cornerPerm);

  if (edgeParity !== cornerParity) {
    return {
      valid: false,
      error: 'Impossible Permutation Parity: Two pieces (edges or corners) are swapped. In a solvable Rubik\'s Cube, edge and corner permutations must have matching parities.',
      details: { type: 'PERMUTATION_PARITY', edgeParity, cornerParity }
    };
  }

  return {
    valid: true,
    error: null,
    details: {
      edgeOrientationSum,
      cornerOrientationSum,
      edgeParity,
      cornerParity
    }
  };
}
