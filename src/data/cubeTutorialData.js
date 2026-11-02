// ==========================================================================
// RUBIK'S CUBE 7-STEP MASTERCLASS TUTORIAL DATA & ALGORITHMS
// Complete Beginner Layer-by-Layer (CFOP Foundation) Guide
// ==========================================================================

export const TUTORIAL_STEPS = [
  {
    id: 1,
    stepNum: '01',
    name: 'White Cross',
    title: 'Step 1: The White Daisy & White Cross',
    subtitle: 'Build the foundational cross on the bottom with matching center colors.',
    time: '5–8 mins',
    difficulty: 'Easy',
    badgeColor: '#FFFFFF',
    summary: 'The cross is the foundation of the entire solve. We first place 4 white edges around the yellow center (The Daisy), then rotate each edge into place so its side color matches its center piece.',
    cases: [
      {
        id: 'daisy-concept',
        name: 'Phase A: The White Daisy',
        tag: 'Preparation',
        description: 'Hold the cube with Yellow center on top. Find the 4 white edge pieces and move them to the top layer around the yellow center. Do not worry about side colors yet.',
        algorithmStr: "F R U R' U'",
        algorithm: ['F', 'R', 'U', "R'", "U'"],
        initialScramble: "D' R2 L2 F2 B2 U L2 D",
        notes: {
          objective: 'Form a daisy flower: Yellow center surrounded by 4 white petal edges.',
          howItWorks: 'The Daisy lets beginners assemble the 4 white edges easily on the top layer without worrying about matching side colors yet.',
          proTip: 'If a white edge is in the bottom layer with white facing down, just turn that face 180° (e.g. F2) to bring it up to the yellow center!',
          pitfalls: [
            'Avoid knocking out an existing petal when bringing a new white edge up—turn the top layer (U) to make room first.',
            'Do not worry about corner pieces at all in this step.'
          ]
        }
      },
      {
        id: 'daisy-to-cross',
        name: 'Phase B: Daisy to White Cross',
        tag: 'Core Technique',
        description: 'Look at one white petal on the top layer. Note its second color (e.g. Green). Turn the top layer until that color matches its side center, then turn that face 180° (F2) to send it to the bottom.',
        algorithmStr: 'U F2',
        algorithm: ['U', 'F2'],
        initialScramble: "D' L2 R2 B2 F2",
        notes: {
          objective: 'Transfer all 4 white edges from the yellow top to the white bottom, locking in matching side colors.',
          howItWorks: 'Rotating the matching face 180° connects the white sticker with the white center on bottom, while perfectly preserving the side color match with the adjacent center.',
          proTip: 'Repeat this 4 times for each side: match top edge side-color with its center, then turn that face twice (F2).',
          pitfalls: [
            'Turning before matching the side center will result in a white cross with mismatched centers.',
            'Always inspect that the side colors form small vertical bars (e.g. White-Green edge matches Green center).'
          ]
        }
      }
    ]
  },
  {
    id: 2,
    stepNum: '02',
    name: 'First Layer',
    title: 'Step 2: Solve First Layer Corners',
    subtitle: 'Insert all 4 white corners to complete the entire bottom layer.',
    time: '8–12 mins',
    difficulty: 'Easy',
    badgeColor: '#16A34A',
    summary: 'With the white cross facing down on the bottom, we search for white corners in the top layer. By placing each corner directly above where it belongs and executing the Right Hand Trigger (The Sexy Move), we pop it cleanly into its slot.',
    cases: [
      {
        id: 'corner-righty',
        name: 'The "Sexy Move" (Right Hand Trigger)',
        tag: 'Fundamental Algorithm',
        description: 'The most important 4-move sequence in speedcubing: R U R\' U\'. Position a corner containing White, Red, and Green directly above the Red-Green slot on front-right. Repeat R U R\' U\' until the corner locks into place with white pointing down.',
        algorithmStr: "R U R' U'",
        algorithm: ['R', 'U', "R'", "U'"],
        initialScramble: "R U R' U'",
        notes: {
          objective: 'Insert a white corner into the bottom layer with correct orientation and matching side colors.',
          howItWorks: 'R lifts the corner slot up; U slides the corner piece in; R\' drops the slot back down; U\' resets the top layer.',
          proTip: 'Memorize the rhythm: "Right Up, Top Left, Right Down, Top Right". You can do this trigger in under 0.5 seconds with practice!',
          pitfalls: [
            'Do not stop after 3 moves—the final U\' turn is crucial to keep the rest of the cube intact.',
            'If the corner is already in the bottom layer but twisted backwards, do R U R\' U\' once to pop it out to the top layer first.'
          ]
        }
      },
      {
        id: 'corner-lefty',
        name: 'The Left Hand Trigger',
        tag: 'Mirror Algorithm',
        description: 'When the corner is on the top-left side and white faces left, execute the mirror sequence: L\' U\' L U to insert it in a single quick fluid motion.',
        algorithmStr: "L' U' L U",
        algorithm: ["L'", "U'", 'L', 'U'],
        initialScramble: "L' U' L U",
        notes: {
          objective: 'Left-hand mirror of the trigger for corners positioned on the left side.',
          howItWorks: 'Lifts the left slot with L\', pushes the corner in with U\', and returns the slot to bottom with L.',
          proTip: 'Learning both right and left triggers gives you complete flexibility and speeds up your solves by 40%.',
          pitfalls: [
            'Ensure your thumb stays on the front face and fingers on top for clean rotational grip.'
          ]
        }
      }
    ]
  },
  {
    id: 3,
    stepNum: '03',
    name: 'Second Layer',
    title: 'Step 3: Second Layer Edges (F2L)',
    subtitle: 'Solve the middle layer edges to complete the bottom two layers.',
    time: '10–15 mins',
    difficulty: 'Medium',
    badgeColor: '#DC2626',
    summary: 'Search the top layer for edge pieces that DO NOT have any yellow on them. Match the front color with its center to form an upside-down "T". Then insert it to the Left or Right using our trigger algorithms.',
    cases: [
      {
        id: 'insert-right',
        name: 'Insert Edge to the Right',
        tag: 'Rightward Insert',
        description: 'When the top edge piece needs to go down to the Front-Right middle slot: Push it AWAY from target (U), do the Right Hand Trigger (R U R\' U\'), re-grip by turning whole cube left (y), and do Left Hand Trigger (L\' U\' L U).',
        algorithmStr: "U R U' R' U' F' U F",
        algorithm: ['U', 'R', "U'", "R'", "U'", "F'", 'U', 'F'],
        initialScramble: "F' U' F U R U R' U'",
        notes: {
          objective: 'Slot an edge piece from top layer into the middle layer on the right side.',
          howItWorks: 'U moves the edge out of the blast radius; the Righty trigger pairs the corner and edge together; the second trigger inserts the pair safely into the slot.',
          proTip: 'Mnemonic: "Turn AWAY from where it needs to go, do the trigger on that side, rotate toward target, do opposite trigger".',
          pitfalls: [
            'Ensure the edge DOES NOT have yellow on it—edges with yellow belong to the top layer!',
            'If an edge is stuck in the middle layer flipped backwards, insert any random yellow edge into that slot to pop it out.'
          ]
        }
      },
      {
        id: 'insert-left',
        name: 'Insert Edge to the Left',
        tag: 'Leftward Insert',
        description: 'When the top edge piece needs to go down to the Front-Left middle slot: Push it AWAY to the right (U\'), do the Left Hand Trigger (L\' U\' L U), turn whole cube right (y\'), and do Right Hand Trigger (R U R\' U\').',
        algorithmStr: "U' L' U L U F U' F'",
        algorithm: ["U'", "L'", "U'", 'L', 'U', 'F', "U'", "F'"],
        initialScramble: "F U F' U' L' U' L U",
        notes: {
          objective: 'Slot an edge piece from top layer into the middle layer on the left side.',
          howItWorks: 'Mirror of the right insertion: pairs the corner and edge on the left, then inserts into the left slot.',
          proTip: 'Check that the front color makes an upside-down "T" before starting the sequence.',
          pitfalls: [
            'Make sure you push the edge AWAY from the target slot on the first move (U\').'
          ]
        }
      }
    ]
  },
  {
    id: 4,
    stepNum: '04',
    name: 'Yellow Cross',
    title: 'Step 4: The Top Yellow Cross',
    subtitle: 'Orient the 4 top edges so yellow faces upward without breaking the bottom layers.',
    time: '6–10 mins',
    difficulty: 'Medium',
    badgeColor: '#FACC15',
    summary: 'Look only at the yellow edges on the top face (ignore the corners for now). You will see one of three patterns: a Dot, an "L" shape (hook), or a Horizontal Line. We use the famous "FUR-URF" algorithm to transform any state into the Yellow Cross.',
    cases: [
      {
        id: 'yellow-line',
        name: 'Case 1: The Horizontal Line',
        tag: 'Common Pattern',
        description: 'Hold the yellow line horizontally (left-to-right, like a minus sign -). Turn the front face clockwise (F), execute the Sexy Move (R U R\' U\'), then undo the front face (F\'). You now have the Yellow Cross!',
        algorithmStr: "F R U R' U' F'",
        algorithm: ['F', 'R', 'U', "R'", "U'", "F'"],
        initialScramble: "F R U R' U' F'",
        notes: {
          objective: 'Transform a horizontal yellow bar into the complete yellow cross.',
          howItWorks: 'F opens up the top layer safely; R U R\' U\' cycles edge orientations; F\' seals the first two layers back up.',
          proTip: 'Easy memory trick: "F + (Sexy Move) + F-prime".',
          pitfalls: [
            'Never hold the line vertically (pointing at you)—it MUST be horizontal before applying the algorithm.',
            'Ignore yellow corner pieces completely at this stage.'
          ]
        }
      },
      {
        id: 'yellow-l-shape',
        name: 'Case 2: The "L" Shape (Small Angle)',
        tag: 'Hook Pattern',
        description: 'Hold the yellow L-shape in the back-left corner (pointing at 12 o\'clock and 9 o\'clock). Either do F R U R\' U\' F\' twice, or use the fast double-layer variant: f (R U R\' U\') f\'.',
        algorithmStr: "F R U R' U' F' U2 F R U R' U' F'",
        algorithm: ['F', 'R', 'U', "R'", "U'", "F'", 'U2', 'F', 'R', 'U', "R'", "U'", "F'"],
        initialScramble: "F U R U' R' F'",
        notes: {
          objective: 'Convert an L-shape into a Line, then into the Yellow Cross.',
          howItWorks: 'Applying F (Sexy Move) F\' once turns the L into a horizontal line; applying it once more creates the cross.',
          proTip: 'Make sure the L-edges point to the Back and Left before starting.',
          pitfalls: [
            'Holding the L-shape in the wrong corner will scramble your progress.'
          ]
        }
      },
      {
        id: 'yellow-dot',
        name: 'Case 3: The Yellow Dot Only',
        tag: 'Starting Pattern',
        description: 'Only the yellow center is facing up. Execute F (R U R\' U\') F\' from any angle. This creates the L-shape. Then position it at 12 and 9 o\'clock and repeat!',
        algorithmStr: "F R U R' U' F'",
        algorithm: ['F', 'R', 'U', "R'", "U'", "F'"],
        initialScramble: "F R U R' U' F' U2 F U R U' R' F'",
        notes: {
          objective: 'Progress from Dot to L-shape, then to Line, and finally to Cross.',
          howItWorks: 'Dot -> (Algorithm) -> L-Shape -> (Algorithm) -> Line -> (Algorithm) -> Cross.',
          proTip: 'Patience is key: this is a progressive state machine. Each cycle moves you up one tier.',
          pitfalls: [
            'Keep white on the bottom throughout all turns.'
          ]
        }
      }
    ]
  },
  {
    id: 5,
    stepNum: '05',
    name: 'Align Edges',
    title: 'Step 5: Align Yellow Cross Edge Colors',
    subtitle: 'Swap top yellow edges so their side colors match the side center pieces.',
    time: '6–10 mins',
    difficulty: 'Medium',
    badgeColor: '#3B82F6',
    summary: 'You have a yellow cross, but the side colors of the edges might not match the center pieces. Turn the top layer until at least two edges match their centers. Then use the famous Sune algorithm to cycle and align all 4 edges.',
    cases: [
      {
        id: 'sune-edge-swap',
        name: 'The Sune Algorithm (Edge Swap)',
        tag: 'Core Speedcube Algorithm',
        description: 'Rotate the top layer until 2 matching edges are found. Hold one solved edge at the Back and one on the Right. Then execute: R U R\' U R U2 R\' U. All 4 edge colors will lock into alignment!',
        algorithmStr: "R U R' U R U2 R' U",
        algorithm: ['R', 'U', "R'", 'U', 'R', 'U2', "R'", 'U'],
        initialScramble: "U' R U2 R' U' R U' R'",
        notes: {
          objective: 'Cycle the remaining two misaligned edges so all 4 yellow edges match their side centers.',
          howItWorks: 'This sequence is called "Sune". It swaps the front and left edges while preserving the bottom two layers and yellow cross orientation.',
          proTip: 'Rhythm: "Right up, Top left, Right down, Top left, Right up, Top twice, Right down, Align".',
          pitfalls: [
            'If the two matching edges are opposite each other (front & back), execute Sune once from any angle to turn them into adjacent matching edges.'
          ]
        }
      }
    ]
  },
  {
    id: 6,
    stepNum: '06',
    name: 'Position Corners',
    title: 'Step 6: Position the Yellow Corners',
    subtitle: 'Put all 4 corners into their correct physical locations (orientation does not matter yet).',
    time: '8–12 mins',
    difficulty: 'Medium',
    badgeColor: '#EA580C',
    summary: 'A corner is in the "correct position" if its three colors match the three surrounding centers, even if the yellow sticker is not yet facing up. Use the Niklas corner cycle algorithm to rotate corners until all 4 sit in their true slots.',
    cases: [
      {
        id: 'niklas-corner-cycle',
        name: 'The Niklas Corner Cycle',
        tag: 'Corner Permutation',
        description: 'Find ONE corner that is in the correct place. Hold the cube so this correct corner is at the Front-Right-Top. Execute: U R U\' L\' U R\' U\' L. Repeat once or twice until all 4 corners are in their proper slots.',
        algorithmStr: "U R U' L' U R' U' L",
        algorithm: ['U', 'R', "U'", "L'", 'U', "R'", "U'", 'L'],
        initialScramble: "L' U R U' L U R' U'",
        notes: {
          objective: 'Cycle the other 3 corners clockwise while locking the front-right corner in place.',
          howItWorks: 'Niklas is a commutator that swaps three corners without rotating any edges or disturbing the bottom layers.',
          proTip: 'Mnemonic: "Up with Right, Up with Left, Down with Right, Down with Left" with top layer pushes in between.',
          pitfalls: [
            'If NO corners are in the correct place, do the algorithm once from any angle to create one correct corner, then position it at front-right.'
          ]
        }
      }
    ]
  },
  {
    id: 7,
    stepNum: '07',
    name: 'Orient Corners',
    title: 'Step 7: Orient Corners (Solve the Cube!)',
    subtitle: 'Twist the final corners so yellow faces up, completing the entire Rubik\'s Cube!',
    time: '5–8 mins',
    difficulty: 'Hard (Requires Precision)',
    badgeColor: '#10B981',
    summary: 'The final and most exciting step! Hold an unsolved corner at the Front-Right-Top. Repeat R\' D\' R D until yellow points up. Then turn ONLY the top layer (U) to bring the next unsolved corner into front-right and repeat. Do not panic when the cube looks scrambled—it will automatically resolve on the last corner!',
    cases: [
      {
        id: 'final-corner-twist',
        name: 'The Inverted Trigger (R\' D\' R D)',
        tag: 'Grand Finale',
        description: 'Hold an unsolved corner at Front-Right-Top. Repeat (R\' D\' R D) 2 or 4 times until the yellow sticker faces UP. Crucial: NEVER rotate the whole cube! Turn ONLY the top layer (U) to load the next twisted corner into Front-Right-Top, and repeat!',
        algorithmStr: "R' D' R D R' D' R D",
        algorithm: ["R'", "D'", 'R', 'D', "R'", "D'", 'R', 'D'],
        initialScramble: "D' R' D R D' R' D R",
        notes: {
          objective: 'Rotate top yellow corners in place without disturbing the solved bottom layers.',
          howItWorks: 'Each 4-move cycle (R\' D\' R D) twists a corner clockwise. Because orientation parity is conserved across 360°, solving all corners naturally restores the entire cube!',
          proTip: 'Always finish the full 4-move sequence including the final D turn, even if the yellow sticker is already facing up!',
          pitfalls: [
            'CRITICAL WARNING: NEVER rotate the whole cube between corners! Only turn the TOP layer (U or U\') to bring the next unsolved corner to you.',
            'Never forget the final D move of R\' D\' R D. Forgetting D will completely scramble the bottom layers.'
          ]
        }
      }
    ]
  }
];
