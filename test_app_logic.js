import { getSolvedState, applyMove, applyMoves, isStateSolved, stateToKociembaString } from './src/solver/cubeEngine.js';
import { validateCube } from './src/solver/validator.js';
import { solveCube, initializeSolver } from './src/solver/solver.js';
import { generateScramble } from './src/solver/scrambler.js';
import { PRESET_PATTERNS } from './src/solver/presets.js';

async function runAllTests() {
  console.log('=== STARTING RUBIKS CUBE SOLVER TEST SUITE ===\n');
  await initializeSolver();

  let passed = 0;
  let failed = 0;

  function assert(condition, name, errorMsg = '') {
    if (condition) {
      console.log(`[PASS] ${name}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name}: ${errorMsg}`);
      failed++;
    }
  }

  // TEST 1: Solved Cube
  const solvedState = getSolvedState();
  assert(isStateSolved(solvedState), 'Solved state is recognized as solved');
  const valSolved = validateCube(solvedState);
  assert(valSolved.valid === true, 'Solved state passes validation');

  const solvedResult = await solveCube(solvedState);
  assert(solvedResult.success === true && solvedResult.alreadySolved === true, 'solveCube on solved state returns alreadySolved');

  // TEST 2: Scrambled Cube
  const scramble = generateScramble(22);
  assert(scramble.moves.length === 22, 'Scrambler generates 22 moves');
  const scrambledState = applyMoves(solvedState, scramble.moves);
  assert(!isStateSolved(scrambledState), 'Scrambled cube is not solved');

  const valScramble = validateCube(scrambledState);
  assert(valScramble.valid === true, 'Scrambled cube passes validation');

  console.log(`Solving scrambled cube with scramble: ${scramble.scrambleString}`);
  const solveResult = await solveCube(scrambledState);
  assert(solveResult.success === true, 'solveCube succeeded on scrambled cube');
  assert(solveResult.moves.length > 0, `Generated ${solveResult.moves.length} moves in solution`);

  // Verify solution physically solves the cube
  const afterSolve = applyMoves(scrambledState, solveResult.moves);
  assert(isStateSolved(afterSolve), 'Applying solution physically solves the scrambled cube!');

  // TEST 3: Validation of impossible configurations
  // Case A: Imbalanced stickers (10 white, 8 yellow)
  const imbalancedState = getSolvedState();
  imbalancedState.U[0] = 'white'; // was white
  imbalancedState.D[0] = 'white'; // changed yellow to white
  const valImbalanced = validateCube(imbalancedState);
  assert(valImbalanced.valid === false && valImbalanced.error.includes('Sticker count mismatch'), 'Rejects imbalanced sticker count');

  // Case B: Flipped Edge (one edge piece turned around in place)
  // UF edge: U[7] (white) and F[1] (green) -> swap them
  const flippedEdgeState = getSolvedState();
  flippedEdgeState.U[7] = 'green';
  flippedEdgeState.F[1] = 'white';
  const valFlipped = validateCube(flippedEdgeState);
  assert(valFlipped.valid === false && valFlipped.error.includes('Edge Orientation'), 'Rejects single flipped edge (Edge Orientation Parity)');

  // Case C: Twisted Corner (one corner twisted in place)
  // UFR corner: U[8] (white), F[2] (green), R[0] (red) -> rotate CW
  const twistedCornerState = getSolvedState();
  twistedCornerState.U[8] = 'red';
  twistedCornerState.F[2] = 'white';
  twistedCornerState.R[0] = 'green';
  const valTwisted = validateCube(twistedCornerState);
  assert(valTwisted.valid === false && valTwisted.error.includes('Corner Orientation'), 'Rejects single twisted corner (Corner Orientation Parity)');

  // Case D: Parity swap (swap only 2 edges)
  // Swap UB (U1, B1) with UR (U5, R1)
  const swappedEdgesState = getSolvedState();
  const tempU1 = swappedEdgesState.U[1], tempB1 = swappedEdgesState.B[1];
  swappedEdgesState.U[1] = swappedEdgesState.U[5];
  swappedEdgesState.B[1] = swappedEdgesState.R[1];
  swappedEdgesState.U[5] = tempU1;
  swappedEdgesState.R[1] = tempB1;
  const valParity = validateCube(swappedEdgesState);
  assert(valParity.valid === false && valParity.error.includes('Permutation Parity'), 'Rejects swapped edges without corner swap (Permutation Parity)');

  // Case E: Duplicate Center
  const dupCenterState = getSolvedState();
  dupCenterState.U[4] = 'yellow'; // Duplicate yellow center
  const valCenter = validateCube(dupCenterState);
  assert(valCenter.valid === false, 'Rejects duplicate center pieces');

  // TEST 4: Preset Patterns Solve Verification
  console.log('\nTesting Preset Patterns...');
  for (const preset of PRESET_PATTERNS) {
    const patternedState = applyMoves(getSolvedState(), preset.algorithm);
    const patVal = validateCube(patternedState);
    assert(patVal.valid === true, `Pattern '${preset.name}' passes validation`);

    const patSolve = await solveCube(patternedState);
    assert(patSolve.success === true, `Pattern '${preset.name}' solves successfully in ${patSolve.totalMoves} moves`);
    const patAfterSolve = applyMoves(patternedState, patSolve.moves);
    assert(isStateSolved(patAfterSolve), `Pattern '${preset.name}' solution physically reaches solved state`);
  }

  console.log(`\n=== TEST RESULTS: ${passed} PASSED, ${failed} FAILED ===`);
  if (failed > 0) process.exit(1);
}

runAllTests().catch(err => {
  console.error('Test suite uncaught error:', err);
  process.exit(1);
});
