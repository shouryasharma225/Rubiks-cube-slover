import { TUTORIAL_STEPS } from './src/data/cubeTutorialData.js';
import { getSolvedState, applyMove, applyMoves, isStateSolved } from './src/solver/cubeEngine.js';

console.log('=== TESTING CUBE TUTORIAL DATA & ALGORITHM LOGIC ===\n');

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) {
    console.log(`[PASS] ${msg}`);
    passed++;
  } else {
    console.error(`[FAIL] ${msg}`);
    failed++;
  }
}

// 1. Verify 7 steps exist
assert(TUTORIAL_STEPS.length === 7, `Total 7 steps defined (got ${TUTORIAL_STEPS.length})`);

// 2. Iterate through each step and case
TUTORIAL_STEPS.forEach((step, sIdx) => {
  assert(step.id === sIdx + 1, `Step ${step.id} has correct sequential ID`);
  assert(step.cases && step.cases.length > 0, `Step ${step.id} (${step.name}) has at least one case`);

  step.cases.forEach((c) => {
    // Check initial scramble validity
    let state = getSolvedState();
    if (c.initialScramble) {
      try {
        state = applyMoves(state, c.initialScramble);
        assert(state && typeof state === 'object', `Step ${step.id} Case "${c.name}" initial scramble executes cleanly`);
      } catch (err) {
        assert(false, `Step ${step.id} Case "${c.name}" initial scramble error: ${err.message}`);
      }
    }

    // Check algorithm validity
    assert(Array.isArray(c.algorithm) && c.algorithm.length > 0, `Step ${step.id} Case "${c.name}" has valid move array`);
    try {
      let runState = state;
      c.algorithm.forEach((mv) => {
        runState = applyMove(runState, mv);
      });
      assert(runState && typeof runState === 'object', `Step ${step.id} Case "${c.name}" algorithm [${c.algorithm.join(' ')}] applies without error`);
    } catch (err) {
      assert(false, `Step ${step.id} Case "${c.name}" algorithm error: ${err.message}`);
    }

    // Check notes structure
    assert(c.notes && c.notes.objective && c.notes.howItWorks, `Step ${step.id} Case "${c.name}" has complete notes & objectives`);
  });
});

console.log(`\n=== TUTORIAL TEST SUITE: ${passed} PASSED, ${failed} FAILED ===`);
if (failed > 0) process.exit(1);
