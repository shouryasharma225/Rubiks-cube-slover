/**
 * Preset Rubik's Cube Patterns and Algorithms
 */

export const PRESET_PATTERNS = [
  {
    id: 'checkerboard',
    name: 'Checkerboard',
    description: 'Alternating colors across all 6 faces',
    algorithm: 'U2 D2 R2 L2 F2 B2'
  },
  {
    id: 'cube_in_cube',
    name: 'Cube in a Cube',
    description: 'A miniature 2x2 cube nested inside a 3x3 cube',
    algorithm: "F L F U' R U F2 L2 U' L' B D' B' L2 U"
  },
  {
    id: 'superflip',
    name: 'Superflip',
    description: 'All 12 edges flipped in place; hardest distance-20 configuration',
    algorithm: "U R2 F B R B2 R U2 L B2 R U' D' R2 F R' L B2 U2 F2"
  },
  {
    id: 'cross',
    name: 'Crosses',
    description: 'Distinct cross pattern on all 6 faces',
    algorithm: 'U2 R2 L2 U2 D2 R2 L2 D2'
  },
  {
    id: 'anaconda',
    name: 'Anaconda',
    description: 'A winding ribbon wrapped across opposite faces',
    algorithm: "L U B' U' R L' B R' F B' D R D' F'"
  },
  {
    id: 'wire',
    name: 'Wire / Twisted Rings',
    description: 'Symmetric interlocking loops',
    algorithm: "R L F B R L F B R L F B"
  }
];
