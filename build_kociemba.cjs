const fs = require('fs');

let cubeCode = fs.readFileSync('node_modules/cubejs/lib/cube.js', 'utf8');
let solveCode = fs.readFileSync('node_modules/cubejs/lib/solve.js', 'utf8');

// In cubeCode:
// Remove outer IIFE
cubeCode = cubeCode.trim();
if (cubeCode.startsWith('(function() {')) {
  cubeCode = cubeCode.substring('(function() {'.length);
}
if (cubeCode.endsWith('}).call(this);')) {
  cubeCode = cubeCode.substring(0, cubeCode.length - '}).call(this);'.length);
}

// Remove `var ..., Cube, ...` declaration so it binds to the outer Cube
cubeCode = cubeCode.replace('var B, BL, BR, Cube, D,', 'var B, BL, BR, D,');

// Remove CommonJS export at bottom
cubeCode = cubeCode.replace(/if \(typeof module !== "undefined"[\s\S]*?this\.Cube = Cube;\s*\}/, '// Export handled by ES module');

// In solveCode:
solveCode = solveCode.trim();
if (solveCode.startsWith('(function() {')) {
  solveCode = solveCode.substring('(function() {'.length);
}
if (solveCode.endsWith('}).call(this);')) {
  solveCode = solveCode.substring(0, solveCode.length - '}).call(this);'.length);
}

// Remove `Cube,` from `var ...` in solveCode
solveCode = solveCode.replace('Cnk, Cube, D,', 'Cnk, D,');
solveCode = solveCode.replace("Cube = this.Cube || require('./cube');", "// Cube is already bound");

const result = `/**
 * Native ES Module Kociemba Two-Phase Rubik's Cube Solver
 * Fully self-contained, 100% client-side compatible with modern browsers & Vite
 */

let Cube;

(function() {
${cubeCode}
})();

(function() {
${solveCode}
})();

export default Cube;
`;

fs.writeFileSync('src/solver/kociemba.js', result, 'utf8');
console.log('Successfully generated src/solver/kociemba.js, size:', result.length);

