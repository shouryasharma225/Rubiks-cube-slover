/**
 * Rubik's Cube Solver Wrapper
 * Interfaces with Kociemba's Two-Phase Algorithm (`cubejs`).
 * Provides asynchronous initialization, validation, step generation,
 * human-readable move explanations, and post-solve verification.
 */

import Cube from './kociemba.js';
import {
  stateToKociembaString,
  isStateSolved,
  applyMoves,
  applyMove
} from './cubeEngine.js';
import { validateCube } from './validator.js';

let solverInitialized = false;
let initializingPromise = null;

/**
 * Initializes Kociemba lookup tables in the background.
 * Safe to call multiple times (caches promise).
 */
export function initializeSolver() {
  if (solverInitialized) return Promise.resolve();
  if (initializingPromise) return initializingPromise;

  initializingPromise = new Promise((resolve) => {
    // Run during idle time or immediate async tick
    setTimeout(() => {
      try {
        Cube.initSolver();
        solverInitialized = true;
        resolve();
      } catch (err) {
        console.error('Failed to initialize Cube solver:', err);
        resolve();
      }
    }, 50);
  });

  return initializingPromise;
}

// Immediately trigger background initialization on load
if (typeof window !== 'undefined') {
  initializeSolver();
}

/**
 * Human-readable explanations for all standard moves
 */
export const MOVE_DESCRIPTIONS = {
  R: 'Turn Right face 90° clockwise',
  "R'": 'Turn Right face 90° counter-clockwise',
  R2: 'Turn Right face 180°',
  L: 'Turn Left face 90° clockwise',
  "L'": 'Turn Left face 90° counter-clockwise',
  L2: 'Turn Left face 180°',
  U: 'Turn Up (Top) face 90° clockwise',
  "U'": 'Turn Up (Top) face 90° counter-clockwise',
  U2: 'Turn Up (Top) face 180°',
  D: 'Turn Down (Bottom) face 90° clockwise',
  "D'": 'Turn Down (Bottom) face 90° counter-clockwise',
  D2: 'Turn Down (Bottom) face 180°',
  F: 'Turn Front face 90° clockwise',
  "F'": 'Turn Front face 90° counter-clockwise',
  F2: 'Turn Front face 180°',
  B: 'Turn Back face 90° clockwise',
  "B'": 'Turn Back face 90° counter-clockwise',
  B2: 'Turn Back face 180°',
  x: 'Rotate entire cube along Right face (pitch up)',
  "x'": 'Rotate entire cube along Right face (pitch down)',
  x2: 'Rotate entire cube 180° along Right face',
  y: 'Rotate entire cube along Up face (yaw left)',
  "y'": 'Rotate entire cube along Up face (yaw right)',
  y2: 'Rotate entire cube 180° along Up face'
};

/**
 * Solves a given cube state.
 * Returns {
 *   success: boolean,
 *   moves: string[],
 *   solutionString: string,
 *   totalMoves: number,
 *   steps: Array<{ move: string, description: string, stepIndex: number, stateAfter: object }>,
 *   error: string | null
 * }
 */
export async function solveCube(state) {
  // 1. Check if already solved
  if (isStateSolved(state)) {
    return {
      success: true,
      alreadySolved: true,
      moves: [],
      solutionString: '',
      totalMoves: 0,
      steps: [],
      error: null
    };
  }

  // 2. Validate physical legality and parities
  const validation = validateCube(state);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error,
      details: validation.details,
      moves: []
    };
  }

  // 3. Ensure solver tables are initialized
  await initializeSolver();

  try {
    const { str: faceletStr } = stateToKociembaString(state);
    const cube = Cube.fromString(faceletStr);
    const rawSolution = cube.solve();

    if (!rawSolution || typeof rawSolution !== 'string') {
      return {
        success: false,
        error: 'Solver was unable to compute a valid solution for this state.',
        moves: []
      };
    }

    const moves = rawSolution.trim().split(/\s+/).filter(Boolean);

    // 4. Verify that this solution actually solves our state
    let testState = state;
    const steps = [];

    for (let i = 0; i < moves.length; i++) {
      const move = moves[i];
      testState = applyMove(testState, move);
      steps.push({
        move,
        stepIndex: i + 1,
        totalSteps: moves.length,
        description: MOVE_DESCRIPTIONS[move] || `Turn ${move}`,
        stateAfter: testState
      });
    }

    if (!isStateSolved(testState)) {
      return {
        success: false,
        error: 'Verification failed: calculated solution did not reach a solved state.',
        moves: []
      };
    }

    return {
      success: true,
      moves,
      solutionString: moves.join(' '),
      totalMoves: moves.length,
      steps,
      error: null
    };
  } catch (err) {
    console.error('Solve execution error:', err);
    return {
      success: false,
      error: err.message || 'An unexpected error occurred while calculating the solution.',
      moves: []
    };
  }
}

/**
 * Inverts a single move (e.g. R -> R', R' -> R, R2 -> R2, M -> M', etc.)
 */
export function invertMove(m) {
  if (!m) return '';
  if (m.endsWith('2')) return m;
  if (m.endsWith("'")) return m.slice(0, -1);
  return m + "'";
}

/**
 * Inverts an entire sequence of moves in reverse order
 */
export function invertMoves(moves) {
  if (!Array.isArray(moves)) return [];
  return moves.slice().reverse().map(invertMove);
}

/**
 * Simplifies a sequence of moves by canceling adjacent inverse moves and combining same-face turns
 */
export function simplifyMoves(moves) {
  if (!Array.isArray(moves)) return [];
  const result = [];
  const faceValues = { '': 1, "'": 3, '2': 2 };
  const valToSuffix = { 1: '', 2: '2', 3: "'" };

  for (const move of moves) {
    if (!move) continue;
    const face = move[0];
    const suffix = move.slice(1);
    const val = faceValues[suffix] || 1;

    if (result.length > 0 && result[result.length - 1][0] === face) {
      const prevMove = result.pop();
      const prevSuffix = prevMove.slice(1);
      const prevVal = faceValues[prevSuffix] || 1;
      const combinedVal = (prevVal + val) % 4;
      if (combinedVal !== 0) {
        result.push(face + valToSuffix[combinedVal]);
      }
    } else {
      result.push(move);
    }
  }
  return result;
}

const ALL_STANDARD_MOVES = [
  'U', "U'", 'U2',
  'D', "D'", 'D2',
  'F', "F'", 'F2',
  'B', "B'", 'B2',
  'L', "L'", 'L2',
  'R', "R'", 'R2'
];

/**
 * Ultra-fast optimal IDDFS search for depths 1 to 3.
 * Takes < 2 milliseconds and guarantees shortest path for near-solved states.
 */
export function findShortOptimalSolution(state, maxDepth = 3) {
  if (isStateSolved(state)) return [];

  function dfs(currState, depth, maxD, lastFace, path) {
    if (depth === maxD) {
      if (isStateSolved(currState)) return path;
      return null;
    }

    for (const move of ALL_STANDARD_MOVES) {
      const face = move[0];
      if (face === lastFace) continue;

      // Commutative pair pruning
      if (
        (lastFace === 'D' && face === 'U') ||
        (lastFace === 'B' && face === 'F') ||
        (lastFace === 'L' && face === 'R')
      ) continue;

      const nextState = applyMove(currState, move);
      path.push(move);
      const res = dfs(nextState, depth + 1, maxD, face, path);
      if (res) return res;
      path.pop();
    }
    return null;
  }

  for (let d = 1; d <= maxDepth; d++) {
    const res = dfs(state, 0, d, null, []);
    if (res) return res;
  }
  return null;
}

/**
 * Computes the best, shortest, and deterministic solution for a game state.
 * Combines short-path search, history inverse, and Kociemba two-phase solver.
 */
export async function solveOptimalOrInverse(cubeState, scrambleMoves = [], movesHistory = []) {
  if (isStateSolved(cubeState)) {
    return {
      success: true,
      alreadySolved: true,
      moves: [],
      totalMoves: 0
    };
  }

  // 1. Instant optimal short search (1..3 moves)
  const shortSol = findShortOptimalSolution(cubeState, 3);
  if (shortSol && shortSol.length > 0) {
    return {
      success: true,
      moves: shortSol,
      totalMoves: shortSol.length,
      solutionString: shortSol.join(' ')
    };
  }

  const candidates = [];

  // 2. Candidate from game history path inverse
  if ((scrambleMoves && scrambleMoves.length > 0) || (movesHistory && movesHistory.length > 0)) {
    const fullPath = simplifyMoves([...scrambleMoves, ...movesHistory]);
    const invMoves = invertMoves(fullPath);
    if (invMoves.length > 0) {
      try {
        const testState = applyMoves(cubeState, invMoves);
        if (isStateSolved(testState)) {
          candidates.push(invMoves);
        }
      } catch (e) {
        // center slice or other non-standard move handling
      }
    }
  }

  // 3. Candidate from Kociemba two-phase solver
  try {
    const ksol = await solveCube(cubeState);
    if (ksol.success && ksol.moves.length > 0) {
      const simplifiedK = simplifyMoves(ksol.moves);
      if (isStateSolved(applyMoves(cubeState, simplifiedK))) {
        candidates.push(simplifiedK);
      } else if (isStateSolved(applyMoves(cubeState, ksol.moves))) {
        candidates.push(ksol.moves);
      }
    }
  } catch (e) {
    console.warn('Kociemba solve error in solveOptimalOrInverse:', e);
  }

  if (candidates.length > 0) {
    // Pick the shortest valid solution
    candidates.sort((a, b) => a.length - b.length);
    const bestMoves = candidates[0];
    return {
      success: true,
      moves: bestMoves,
      totalMoves: bestMoves.length,
      solutionString: bestMoves.join(' ')
    };
  }

  return {
    success: false,
    error: 'Could not find a valid solution.',
    moves: [],
    totalMoves: 0
  };
}
