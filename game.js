// ─────────────────────────────────────────────
//  The Cartographer of Winds — game.js
// ─────────────────────────────────────────────

// ── State ──────────────────────────────────────
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

let gameState = loadState();

function loadState() {
  try {
    const saved = localStorage.getItem('cartographer_state');
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return JSON.parse(JSON.stringify(DEFAULT_STATE));
}

function saveState() {
  try {
    localStorage.setItem('cartographer_state', JSON.stringify(gameState));
  } catch (e) {}
}

// ── Scene system ────────────────────────────────
let currentListeners = [];

function addListener(el, event, fn) {
  el.addEventListener(event, fn);
  currentListeners.push({ el, event, fn });
}

function clearListeners() {
  currentListeners.forEach(({ el, event, fn }) => el.removeEventListener(event, fn));
  currentListeners = [];
}

function showScene(index) {
  clearListeners();
  gameState.sceneIndex = index;
  const app = document.getElementById('app');
  app.innerHTML = '';
  scenes[index].render(app);
  scenes[index].bind(app);
  updateIndicator();
}

function updateIndicator() {
  const ui = document.getElementById('ui');
  ui.innerHTML = '';
  // dots for scenes 1–5 (skip scene 0 start screen)
  for (let i = 1; i <= 5; i++) {
    const dot = document.createElement('div');
    dot.className = 'dot';
    if (gameState.completed[i - 1]) dot.classList.add('done');
    if (gameState.sceneIndex === i) dot.classList.add('current');
    ui.appendChild(dot);
  }
}

// ── Scene 0 — Start Screen ──────────────────────
const s0 = {
  id: 's0',
  render(app) {
    app.innerHTML = `
      <div class="start-screen">
        <div class="decoration">🧭</div>
        <h1>The Cartographer of Winds</h1>
        <p class="subtitle">A 40th Birthday Micro-Quest</p>
        <p>Five chapters await.<br>Each one a fragment of a life well-sailed.</p>
        <button class="primary" id="btn-begin">Begin</button>
      </div>
    `;
  },
  bind(app) {
    addListener(app.querySelector('#btn-begin'), 'click', () => {
      gameState.started = true;
      showScene(1);
    });
  }
};

// ── Scene 1 — Sailboat Navigation ──────────────
const s1 = {
  id: 's1',
  render(app) {
    const { leg, windDeg } = gameState.sceneData.s1;
    // If starting fresh or all legs done already, reset leg counter
    if (leg === 0) {
      gameState.sceneData.s1.windDeg = Math.floor(Math.random() * 360);
    }
    const wd = gameState.sceneData.s1.windDeg;
    const optimal = (wd + 90) % 360;

    app.innerHTML = `
      <h2>The Open Sea</h2>
      <p class="narrative">You depart Zürich with a hand-drawn map and an early GPS prototype. Destination: Brazil. The wind does not ask permission.</p>

      <div class="compass-wrap">
        ${compassSVG(wd)}
      </div>

      <div class="sail-controls">
        <label>Wind: <strong id="wind-label">${wd}°</strong> &nbsp;|&nbsp; Your sail: <strong id="sail-label">180°</strong></label>
        <input type="range" id="sail-slider" min="0" max="359" value="180">
        <button class="primary" id="btn-trim">Trim Sail</button>
      </div>

      <div class="progress-text">Leg ${leg + 1} / 3</div>
      <div class="feedback" id="feedback"></div>
    `;
  },
  bind(app) {
    const slider = app.querySelector('#sail-slider');
    const sailLabel = app.querySelector('#sail-label');
    const feedback = app.querySelector('#feedback');

    addListener(slider, 'input', () => {
      sailLabel.textContent = slider.value + '°';
    });

    addListener(app.querySelector('#btn-trim'), 'click', () => {
      const sliderVal = parseInt(slider.value, 10);
      const wd = gameState.sceneData.s1.windDeg;
      const optimal = (wd + 90) % 360;
      const diff = Math.abs(sliderVal - optimal);
      const circularDiff = Math.min(diff, 360 - diff);

      if (circularDiff <= 20) {
        gameState.sceneData.s1.leg++;
        if (gameState.sceneData.s1.leg >= 3) {
          gameState.completed[0] = true;
          saveState();
          feedback.textContent = 'Perfect trim! Brazil in sight…';
          setTimeout(() => showScene(2), 1200);
        } else {
          feedback.textContent = 'Good trim! The sails fill with wind.';
          gameState.sceneData.s1.windDeg = Math.floor(Math.random() * 360);
          setTimeout(() => showScene(1), 900);
        }
      } else {
        feedback.className = 'feedback error';
        feedback.textContent = 'Adjust further… the sail luffs.';
      }
    });
  }
};

function compassSVG(deg) {
  // Arrow points in the wind direction
  const cx = 70, cy = 70, r = 55;
  const rad = (deg - 90) * Math.PI / 180;
  const ax = cx + r * Math.cos(rad);
  const ay = cy + r * Math.sin(rad);
  return `
  <svg viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="#e8d8c4" stroke="#c0703a" stroke-width="2"/>
    <text x="${cx}" y="18" text-anchor="middle" font-size="11" fill="#7a6050">N</text>
    <text x="${cx}" y="128" text-anchor="middle" font-size="11" fill="#7a6050">S</text>
    <text x="12" y="74" text-anchor="middle" font-size="11" fill="#7a6050">W</text>
    <text x="128" y="74" text-anchor="middle" font-size="11" fill="#7a6050">E</text>
    <!-- Wind direction arrow -->
    <line x1="${cx}" y1="${cy}" x2="${ax}" y2="${ay}" stroke="#c0703a" stroke-width="3" stroke-linecap="round"/>
    <circle cx="${ax}" cy="${ay}" r="5" fill="#c0703a"/>
    <circle cx="${cx}" cy="${cy}" r="4" fill="#2b1d0e"/>
  </svg>`;
}

// ── Scene 2 — Guitar (Spell AGED) ──────────────
const CHORDS = {
  A: [-1, 0, 2, 2, 2, 0],
  G: [3, 2, 0, 0, 0, 3],
  E: [0, 2, 2, 1, 0, 0],
  D: [-1, -1, 0, 2, 3, 2]
};
const SEQUENCE = ['A', 'G', 'E', 'D'];

const s2 = {
  id: 's2',
  render(app) {
    const { index, solved } = gameState.sceneData.s2;
    const currentChord = index < 4 ? SEQUENCE[index] : null;

    const solvedDisplay = SEQUENCE.map((_, i) =>
      solved[i] ? `<span style="color:var(--accent-dark)">${SEQUENCE[i]}</span>` : '_'
    ).join(' ');

    app.innerHTML = `
      <h2>Song of the Shore</h2>
      <p class="narrative">Washed up on a Brazilian beach, you find a guitar. Its inscription reads: "Play the chords that spell your age."</p>

      <div class="chord-label">${currentChord ? `Play chord: <strong>${currentChord}</strong>` : '✓ All chords played!'}</div>

      <div class="fretboard-wrap">
        ${currentChord ? fretboardSVG(CHORDS[currentChord]) : fretboardSVG(CHORDS['A'])}
      </div>

      <div class="solved-display">${solvedDisplay}</div>

      <div class="chord-buttons">
        ${['A','B','C','D','E','F','G'].map(l =>
          `<button class="chord-btn" data-letter="${l}">${l}</button>`
        ).join('')}
      </div>
      <div class="feedback" id="feedback"></div>
    `;
  },
  bind(app) {
    const feedback = app.querySelector('#feedback');

    app.querySelectorAll('.chord-btn').forEach(btn => {
      addListener(btn, 'click', () => {
        const letter = btn.dataset.letter;
        const { index } = gameState.sceneData.s2;
        if (index >= 4) return;

        if (letter === SEQUENCE[index]) {
          gameState.sceneData.s2.solved.push(letter);
          gameState.sceneData.s2.index++;
          feedback.className = 'feedback';
          feedback.textContent = '';
          if (gameState.sceneData.s2.index >= 4) {
            gameState.completed[1] = true;
            saveState();
            feedback.textContent = 'AGED — the music echoes across the sand.';
            setTimeout(() => showScene(3), 1400);
          } else {
            showScene(2);
          }
        } else {
          btn.classList.add('shake');
          feedback.className = 'feedback error';
          feedback.textContent = 'Wrong chord — listen closer.';
          setTimeout(() => btn.classList.remove('shake'), 350);
        }
      });
    });
  }
};

function fretboardSVG(shape) {
  // shape: array of 6 fret positions, low string first
  // -1 = muted, 0 = open, 1-5 = fret number
  const W = 150, H = 180;
  const stringCount = 6;
  const fretCount = 5;
  const padLeft = 20, padTop = 30;
  const stringSpacing = (W - padLeft - 16) / (stringCount - 1); // ~22.8
  const fretSpacing = (H - padTop - 20) / fretCount; // ~26

  let lines = '';
  // Frets
  for (let f = 0; f <= fretCount; f++) {
    const y = padTop + f * fretSpacing;
    const sw = f === 0 ? 3 : 1.5;
    lines += `<line x1="${padLeft}" y1="${y}" x2="${W - 16}" y2="${y}" stroke="#7a6050" stroke-width="${sw}"/>`;
  }
  // Strings
  for (let s = 0; s < stringCount; s++) {
    const x = padLeft + s * stringSpacing;
    lines += `<line x1="${x}" y1="${padTop}" x2="${x}" y2="${padTop + fretCount * fretSpacing}" stroke="#7a6050" stroke-width="1"/>`;
  }

  let markers = '';
  for (let s = 0; s < stringCount; s++) {
    const x = padLeft + s * stringSpacing;
    const fret = shape[s];
    if (fret === -1) {
      // X above nut
      const y = padTop - 14;
      markers += `<text x="${x}" y="${y}" text-anchor="middle" font-size="12" fill="#a03020">✕</text>`;
    } else if (fret === 0) {
      // O above nut
      const y = padTop - 14;
      markers += `<circle cx="${x}" cy="${y - 2}" r="5" fill="none" stroke="#7a6050" stroke-width="1.5"/>`;
    } else {
      // Filled circle on fret
      const y = padTop + (fret - 0.5) * fretSpacing;
      markers += `<circle cx="${x}" cy="${y}" r="7" fill="#c0703a"/>`;
    }
  }

  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="background:#fdf6ec;border-radius:8px">
    ${lines}${markers}
  </svg>`;
}

// ── Scene 3 — Geometry of 40 ────────────────────
const TARGET_40 = [
  1,0,0,1,1,
  1,0,0,1,0,
  1,1,0,1,0,
  0,1,0,1,1,
  0,1,0,1,1
].map(Boolean);

const s3 = {
  id: 's3',
  render(app) {
    const { grid } = gameState.sceneData.s3;
    app.innerHTML = `
      <h2>Geometry of 40</h2>
      <p class="narrative">Numbers are shapes. 40 is a pattern. Find it.</p>

      <div class="grid-40" id="grid">
        ${grid.map((on, i) =>
          `<button class="tile ${on ? 'active' : ''}" data-index="${i}"></button>`
        ).join('')}
      </div>

      <div class="feedback" id="feedback"></div>
    `;
  },
  bind(app) {
    const feedback = app.querySelector('#feedback');

    app.querySelectorAll('.tile').forEach(tile => {
      addListener(tile, 'click', () => {
        const i = parseInt(tile.dataset.index, 10);
        gameState.sceneData.s3.grid[i] = !gameState.sceneData.s3.grid[i];
        tile.classList.toggle('active', gameState.sceneData.s3.grid[i]);

        if (checkGrid()) {
          gameState.completed[2] = true;
          saveState();
          feedback.textContent = '40 — the shape appears in light.';
          setTimeout(() => showScene(4), 1200);
        }
      });
    });
  }
};

function checkGrid() {
  return gameState.sceneData.s3.grid.every((v, i) => v === TARGET_40[i]);
}

// ── Scene 4 — Forró Memory Game ─────────────────
const MOVES = ['Left', 'Right', 'Turn', 'Close'];
const MOVE_ICONS = { Left: '←', Right: '→', Turn: '↻', Close: '♡' };
let s4Timer = null;

const s4 = {
  id: 's4',
  render(app) {
    const { sequence, input, phase } = gameState.sceneData.s4;

    const cardsHTML = MOVES.map((m, i) => `
      <div class="move-card" data-move="${m}" id="card-${m}">
        <span class="icon">${MOVE_ICONS[m]}</span>
        <span>${m}</span>
      </div>
    `).join('');

    let controlsHTML = '';
    if (phase === 'idle') {
      controlsHTML = `<button class="primary" id="btn-watch">Watch the sequence</button>`;
    } else if (phase === 'input') {
      controlsHTML = `
        <div class="input-buttons">
          ${MOVES.map(m => `<button class="input-btn" data-move="${m}">${MOVE_ICONS[m]} ${m}</button>`).join('')}
        </div>
      `;
    } else {
      controlsHTML = `<p class="narrative">Watch carefully…</p>`;
    }

    app.innerHTML = `
      <h2>Dance of the Forró</h2>
      <p class="narrative">On the dance floor in Rio, the steps come alive. Watch the sequence, then mirror it.</p>

      <div class="move-cards">${cardsHTML}</div>
      <div id="s4-controls">${controlsHTML}</div>
      <div class="feedback" id="feedback"></div>
    `;
  },
  bind(app) {
    const { phase } = gameState.sceneData.s4;
    const feedback = app.querySelector('#feedback');

    if (phase === 'idle') {
      addListener(app.querySelector('#btn-watch'), 'click', () => {
        // Generate new sequence
        gameState.sceneData.s4.sequence = Array.from({ length: 4 }, () =>
          MOVES[Math.floor(Math.random() * MOVES.length)]
        );
        gameState.sceneData.s4.input = [];
        gameState.sceneData.s4.phase = 'showing';
        showScene(4);
      });
    } else if (phase === 'showing') {
      s4PlaySequence(app);
    } else if (phase === 'input') {
      bindInputButtons(app, feedback);
      // Keyboard support
      const keyHandler = (e) => {
        const keyMap = { ArrowLeft: 'Left', ArrowRight: 'Right', ArrowUp: 'Turn', ArrowDown: 'Close' };
        const move = keyMap[e.key];
        if (move) handleS4Input(move, app, feedback);
      };
      addListener(document, 'keydown', keyHandler);
    }
  },
  cleanup() {
    if (s4Timer) { clearTimeout(s4Timer); s4Timer = null; }
  }
};

function s4PlaySequence(app) {
  const seq = gameState.sceneData.s4.sequence;
  let step = 0;

  function showStep() {
    // Clear all
    MOVES.forEach(m => {
      const card = app.querySelector(`#card-${m}`);
      if (card) card.classList.remove('active');
    });

    if (step >= seq.length) {
      // Done showing — switch to input
      s4Timer = setTimeout(() => {
        gameState.sceneData.s4.phase = 'input';
        gameState.sceneData.s4.input = [];
        showScene(4);
      }, 400);
      return;
    }

    s4Timer = setTimeout(() => {
      const card = app.querySelector(`#card-${seq[step]}`);
      if (card) card.classList.add('active');
      step++;
      s4Timer = setTimeout(() => {
        if (card) card.classList.remove('active');
        showStep();
      }, 700);
    }, 200);
  }

  showStep();
}

function bindInputButtons(app, feedback) {
  app.querySelectorAll('.input-btn').forEach(btn => {
    addListener(btn, 'click', () => {
      handleS4Input(btn.dataset.move, app, feedback);
    });
  });
}

function handleS4Input(move, app, feedback) {
  const { sequence, input } = gameState.sceneData.s4;
  const expected = sequence[input.length];

  if (move === expected) {
    gameState.sceneData.s4.input.push(move);
    // Flash card
    const card = app.querySelector(`#card-${move}`);
    if (card) {
      card.classList.add('active');
      setTimeout(() => card.classList.remove('active'), 300);
    }

    if (gameState.sceneData.s4.input.length >= sequence.length) {
      // Complete!
      gameState.completed[3] = true;
      saveState();
      feedback.textContent = 'Perfect rhythm! You feel the beat.';
      setTimeout(() => showScene(5), 1200);
    }
  } else {
    feedback.className = 'feedback error';
    feedback.textContent = 'Not quite — watch again!';
    gameState.sceneData.s4.input = [];
    gameState.sceneData.s4.phase = 'showing';
    setTimeout(() => showScene(4), 900);
  }
}

// ── Scene 5 — Final ─────────────────────────────
const s5 = {
  id: 's5',
  render(app) {
    app.innerHTML = `
      <div class="final-scene">
        <h1>Meli,</h1>

        <p>Somewhere between Zürich and the open Atlantic, between a hand-drawn map and a smartphone screen, between a spreadsheet and a guitar chord — a life took shape.</p>

        <p>You sailed toward Brazil before the maps were ready. You played music before anyone asked you to. You found the geometry hidden inside ordinary numbers, and you danced in a language your feet learned by heart.</p>

        <p>From the vast plains of Russia to the precise streets of Zürich, you carried something rare: the ability to be at home everywhere, and to make everywhere feel like home.</p>

        <p>Forty is not an arrival. It is the moment the cartographer finally looks up from the map — and realises the territory is even more beautiful than anything they could have drawn.</p>

        <p>Here's to the next forty years of winds, chords, coordinates, and close dances.</p>

        <div class="birthday">Happy 40th Birthday,<br>Ilya. 🧭</div>

        <button class="primary" id="btn-restart">Start Over</button>
      </div>
    `;
  },
  bind(app) {
    addListener(app.querySelector('#btn-restart'), 'click', () => {
      localStorage.removeItem('cartographer_state');
      location.reload();
    });
  }
};

// ── Scenes array ────────────────────────────────
const scenes = [s0, s1, s2, s3, s4, s5];

// ── Boot ────────────────────────────────────────
(function init() {
  // If we have saved progress, skip to furthest completed scene
  const startScene = gameState.started ? Math.min(gameState.sceneIndex || 1, 5) : 0;
  showScene(startScene);
})();
