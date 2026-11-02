/**
 * Official-style Rubik's Cube Scramble Generator
 * Produces valid WCA-like scrambles (20-25 moves) without redundant
 * consecutive face turns or parallel axis cancels.
 */

const FACES = ['U', 'D', 'L', 'R', 'F', 'B'];
const MODIFIERS = ['', "'", '2'];

// Group opposing faces on the same axis
const AXIS_MAP = {
  U: 0, D: 0,
  L: 1, R: 1,
  F: 2, B: 2
};

/**
 * Generates a random scramble of specified length (default: 22 moves)
 */
export function generateScramble(length = 22) {
  const moves = [];
  let lastFace = null;
  let secondLastFace = null;

  for (let i = 0; i < length; i++) {
    // Filter available faces to prevent:
    // 1. Same face as previous move (e.g. R followed by R')
    // 2. Same axis sandwiching an opposing face (e.g. R L R)
    const availableFaces = FACES.filter(face => {
      if (face === lastFace) return false;
      if (
        secondLastFace &&
        AXIS_MAP[face] === AXIS_MAP[lastFace] &&
        AXIS_MAP[face] === AXIS_MAP[secondLastFace]
      ) {
        return false;
      }
      return true;
    });

    const chosenFace = availableFaces[Math.floor(Math.random() * availableFaces.length)];
    const chosenMod = MODIFIERS[Math.floor(Math.random() * MODIFIERS.length)];

    moves.push(`${chosenFace}${chosenMod}`);
    secondLastFace = lastFace;
    lastFace = chosenFace;
  }

  return {
    moves,
    scrambleString: moves.join(' ')
  };
}
