// ── Global state ────────────────────────────────
const DEFAULT_STATE = {
  started: false,
  sceneIndex: 0,
  completed: [false, false, false, false, false],
  sceneData: {
    s1: { leg: 0, windDeg: 0 },
    s2: { index: 0, solved: [] },
    s3: { grid: Array(25).fill(false) },
    s4: { sequence: [], input: [], phase: 'idle' }
  }
};

// gameState is always reset on load — localStorage only used mid-session
let gameState = JSON.parse(JSON.stringify(DEFAULT_STATE));

function saveState() {
  try {
    localStorage.setItem('cartographer_state', JSON.stringify(gameState));
  } catch (e) {}
}
