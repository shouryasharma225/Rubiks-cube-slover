import * as THREE from 'three';
import {
  getSolvedState,
  applyMove,
  applyMoves,
  isStateSolved
} from './src/solver/cubeEngine.js';
import { solveCube, initializeSolver } from './src/solver/solver.js';

async function runTests() {
  console.log('=== TESTING CENTER SLICES & VIEW ORIENTATION LOGIC ===\n');
  await initializeSolver();

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

  // TEST 1: Center Slice Moves cycle back to solved state
  let s = getSolvedState();
  s = applyMove(s, 'M');
  assert(!isStateSolved(s), 'State after M move is unsolved');
  s = applyMove(s, "M'");
  assert(isStateSolved(s), 'State after M then M\' is solved');

  s = applyMoves(s, 'M M M M');
  assert(isStateSolved(s), 'State after 4x M is solved');

  s = applyMoves(s, 'E E E E');
  assert(isStateSolved(s), 'State after 4x E is solved');

  s = applyMoves(s, 'S S S S');
  assert(isStateSolved(s), 'State after 4x S is solved');

  s = applyMoves(s, 'M2 M2');
  assert(isStateSolved(s), 'State after M2 M2 is solved');

  s = applyMoves(s, 'E2 E2');
  assert(isStateSolved(s), 'State after E2 E2 is solved');

  s = applyMoves(s, 'S2 S2');
  assert(isStateSolved(s), 'State after S2 S2 is solved');

  // TEST 2: Solving state with center slice offset
  s = getSolvedState();
  s = applyMoves(s, 'M E S');
  assert(!isStateSolved(s), 'State after M E S is mixed');
  const solveRes = await solveCube(s);
  assert(solveRes.success === true, 'Kociemba solver successfully finds solution for M E S state');
  const solved = applyMoves(s, solveRes.moves);
  assert(isStateSolved(solved), 'Applying solution physically returns cube to solved state');

  // TEST 3: Orthogonal Basis Orientation Algorithm
  const camera = new THREE.PerspectiveCamera(37, 1, 0.1, 100);
  camera.position.set(0, 2.6, 7.8);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld();

  const OPPOSITES = { U: 'D', D: 'U', R: 'L', L: 'R', F: 'B', B: 'F' };
  const FACE_VECTORS = {
    R: new THREE.Vector3(1, 0, 0),
    L: new THREE.Vector3(-1, 0, 0),
    U: new THREE.Vector3(0, 1, 0),
    D: new THREE.Vector3(0, -1, 0),
    F: new THREE.Vector3(0, 0, 1),
    B: new THREE.Vector3(0, 0, -1)
  };

  function getOrientation(rotX, rotY, customQuat = null) {
    const rotationGroup = new THREE.Group();
    if (customQuat) {
      rotationGroup.quaternion.copy(customQuat);
    } else {
      rotationGroup.rotation.x = rotX;
      rotationGroup.rotation.y = rotY;
    }
    rotationGroup.updateMatrixWorld();

    const camDir = camera.position.clone().normalize();
    const invMatrix = rotationGroup.matrixWorld.clone().invert();
    const localCamDir = camDir.clone().transformDirection(invMatrix).normalize();
    const camRight = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion).normalize();
    const localCamRight = camRight.clone().transformDirection(invMatrix).normalize();
    const camUp = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion).normalize();
    const localCamUp = camUp.clone().transformDirection(invMatrix).normalize();

    let bestFront = 'F', maxF = -Infinity;
    Object.keys(FACE_VECTORS).forEach(k => {
      const dot = FACE_VECTORS[k].dot(localCamDir);
      if (dot > maxF) { maxF = dot; bestFront = k; }
    });
    const bestBack = OPPOSITES[bestFront];

    let bestRight = 'R', maxR = -Infinity;
    Object.keys(FACE_VECTORS).forEach(k => {
      if (k !== bestFront && k !== bestBack) {
        const dot = FACE_VECTORS[k].dot(localCamRight);
        if (dot > maxR) { maxR = dot; bestRight = k; }
      }
    });
    const bestLeft = OPPOSITES[bestRight];

    let bestUp = 'U', maxU = -Infinity;
    Object.keys(FACE_VECTORS).forEach(k => {
      if (k !== bestFront && k !== bestBack && k !== bestRight && k !== bestLeft) {
        const dot = FACE_VECTORS[k].dot(localCamUp);
        if (dot > maxU) { maxU = dot; bestUp = k; }
      }
    });
    const bestDown = OPPOSITES[bestUp];

    return { front: bestFront, right: bestRight, up: bestUp, left: bestLeft, down: bestDown, back: bestBack };
  }

  // Initial angle
  const initOrient = getOrientation(0.35, -0.45);
  assert(initOrient.front === 'F', `Initial Front face is F (got ${initOrient.front})`);
  assert(initOrient.right === 'R', `Initial Right face is R (got ${initOrient.right})`);
  assert(initOrient.up === 'U', `Initial Top face is U (got ${initOrient.up})`);

  // Turn 90 degrees right: Right face (R) becomes Front
  const turn90 = getOrientation(0.35, -0.45 - Math.PI / 2);
  assert(turn90.front === 'R', `Turn 90°: Front face is R (got ${turn90.front})`);
  assert(turn90.right === 'B', `Turn 90°: Right face is B (got ${turn90.right})`);
  assert(turn90.up === 'U', `Turn 90°: Top face is U (got ${turn90.up})`);

  // Turn 180 degrees: Back face (B) becomes Front
  const turn180 = getOrientation(0.35, -0.45 - Math.PI);
  assert(turn180.front === 'B', `Turn 180°: Front face is B (got ${turn180.front})`);
  assert(turn180.right === 'L', `Turn 180°: Right face is L (got ${turn180.right})`);

  // Turn 270 degrees: Left face (L) becomes Front
  const turn270 = getOrientation(0.35, -0.45 - 3 * Math.PI / 2);
  assert(turn270.front === 'L', `Turn 270°: Front face is L (got ${turn270.front})`);
  assert(turn270.right === 'F', `Turn 270°: Right face is F (got ${turn270.right})`);

  // TEST 4: Tilt Ground (Bottom) Face Up to Front (Ground ↑)
  const baseQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.35, -0.45, 0, 'YXZ'));
  const groundUpQuat = baseQuat.clone().premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2));
  const groundTilt = getOrientation(0, 0, groundUpQuat);
  assert(groundTilt.front === 'D', `Tilt Ground Up: Ground/Bottom face (D) becomes Front face (got ${groundTilt.front})`);

  // TEST 5: Tilt Top Face Down to Front (Top ↓)
  const topDownQuat = baseQuat.clone().premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2));
  const topTilt = getOrientation(0, 0, topDownQuat);
  assert(topTilt.front === 'U', `Tilt Top Down: Top face (U) becomes Front face (got ${topTilt.front})`);

  console.log(`\n=== TEST SUITE COMPLETE: ${passed} PASSED, ${failed} FAILED ===`);
  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error(err);
  process.exit(1);
});
