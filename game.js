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

function addListener(el, event, fn, options) {
  el.addEventListener(event, fn, options);
  currentListeners.push({ el, event, fn, options });
}

function clearListeners() {
  currentListeners.forEach(({ el, event, fn, options }) =>
    el.removeEventListener(event, fn, options)
  );
  currentListeners = [];
}

function showScene(index) {
  const oldScene = scenes[gameState.sceneIndex];
  if (oldScene && typeof oldScene.cleanup === 'function') oldScene.cleanup();
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
  for (let i = 1; i <= 5; i++) {
    const dot = document.createElement('div');
    dot.className = 'dot';
    if (gameState.completed[i - 1]) dot.classList.add('done');
    if (gameState.sceneIndex === i) dot.classList.add('current');
    ui.appendChild(dot);
  }
}

// ── Helper ──────────────────────────────────────
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
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

// ── Scene 1 — Sailboat Navigation (Canvas) ──────
const s1 = {
  id: 's1',
  _canvas: null,
  _ctx: null,
  _raf: null,
  _t: 0,
  _dragging: false,
  _sailDeg: 180,
  _animating: false,

  render(app) {
    const leg = gameState.sceneData.s1.leg;
    if (leg === 0) {
      gameState.sceneData.s1.windDeg = Math.floor(Math.random() * 360);
    }
    this._sailDeg = 180;
    this._animating = false;
    this._t = 0;

    const narratives = [
      'You depart Montréal — an old hand-drawn map in your pocket. The wind doesn\'t care about your itinerary.',
      'The Atlantic opens wide. Nothing but water and sky. Trim your sail and trust the wind.',
      'A green smudge on the horizon — Brazil. One perfect trim and you\'re there.'
    ];

    app.innerHTML = `
      <canvas id="s1-canvas" style="width:100%;border-radius:12px;display:block;touch-action:none;cursor:grab"></canvas>
      <p class="narrative" style="margin-top:0.5rem;font-size:0.88rem">${narratives[Math.min(leg, 2)]}</p>
      <div style="display:flex;align-items:center;justify-content:space-between;width:100%;padding:0 0.25rem;margin-top:0.25rem">
        <div class="progress-text">Leg ${leg + 1} / 3</div>
        <button class="primary" id="btn-trim">Trim Sail ⛵</button>
      </div>
      <div class="feedback" id="feedback">Drag the sail tip to catch the wind</div>
    `;

    const canvas = app.querySelector('#s1-canvas');
    canvas.width = 400;
    canvas.height = 300;
    this._canvas = canvas;
    this._ctx = canvas.getContext('2d');
    this._startLoop();
  },

  bind(app) {
    const canvas = this._canvas;
    if (!canvas) return;
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = Math.round(H * 0.6);

    const getAngle = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = W / rect.width;
      const scaleY = H / rect.height;
      const dx = (clientX - rect.left) * scaleX - cx;
      const dy = (clientY - rect.top) * scaleY - cy;
      return (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;
    };

    addListener(canvas, 'mousedown', () => {
      this._dragging = true;
      canvas.style.cursor = 'grabbing';
    });
    addListener(window, 'mousemove', e => {
      if (this._dragging) this._sailDeg = getAngle(e.clientX, e.clientY);
    });
    addListener(window, 'mouseup', () => {
      this._dragging = false;
      canvas.style.cursor = 'grab';
    });
    addListener(canvas, 'touchstart', e => {
      e.preventDefault();
      this._dragging = true;
      this._sailDeg = getAngle(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: false });
    addListener(canvas, 'touchmove', e => {
      e.preventDefault();
      if (this._dragging) this._sailDeg = getAngle(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: false });
    addListener(canvas, 'touchend', () => { this._dragging = false; });

    const feedback = app.querySelector('#feedback');
    addListener(app.querySelector('#btn-trim'), 'click', () => {
      if (this._animating) return;
      const windDeg = gameState.sceneData.s1.windDeg;
      const optimal = (windDeg + 90) % 360;
      const diff = Math.abs(this._sailDeg - optimal);
      const circularDiff = Math.min(diff, 360 - diff);

      if (circularDiff <= 20) {
        this._animating = true;
        feedback.className = 'feedback';
        const leg = gameState.sceneData.s1.leg;
        feedback.textContent = leg === 2 ? '⚓ Perfect! Brazil in sight!' : '✓ The sail fills — onward!';
        setTimeout(() => {
          gameState.sceneData.s1.leg++;
          if (gameState.sceneData.s1.leg >= 3) {
            gameState.completed[0] = true;
            saveState();
            showScene(2);
          } else {
            gameState.sceneData.s1.windDeg = Math.floor(Math.random() * 360);
            showScene(1);
          }
        }, 1400);
      } else {
        feedback.className = 'feedback error';
        feedback.textContent = circularDiff <= 45
          ? 'Getting closer… adjust a little more.'
          : 'The sail luffs — try a different angle.';
      }
    });
  },

  _startLoop() {
    const loop = () => {
      if (!this._canvas) return;
      this._t++;
      this._draw(this._ctx, this._canvas.width, this._canvas.height);
      this._raf = requestAnimationFrame(loop);
    };
    this._raf = requestAnimationFrame(loop);
  },

  _draw(ctx, W, H) {
    const leg = gameState.sceneData.s1.leg;
    const windDeg = gameState.sceneData.s1.windDeg;
    const t = this._t;
    const cx = W / 2, cy = Math.round(H * 0.6);

    if (leg === 0) {
      this._drawCanadianFlag(ctx, W, H);
    } else {
      this._drawOcean(ctx, W, H, t, leg);
    }

    this._drawWindLines(ctx, W, H, windDeg, t);
    this._drawBoat(ctx, cx, cy, this._sailDeg, leg, t);

    // HUD
    ctx.fillStyle = 'rgba(0,0,0,0.38)';
    roundRect(ctx, 6, 6, 198, 26, 5);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Wind ${windDeg}°  |  Sail ${Math.round(this._sailDeg)}°`, 12, 23);
  },

  _drawCanadianFlag(ctx, W, H) {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(0, 0, W * 0.25, H);
    ctx.fillRect(W * 0.75, 0, W * 0.25, H);
    this._drawMapleLeaf(ctx, W / 2, H / 2, 52);
  },

  _drawMapleLeaf(ctx, x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(s * 0.18, -s * 0.5);
    ctx.lineTo(s * 0.52, -s * 0.6);
    ctx.lineTo(s * 0.3, -s * 0.22);
    ctx.lineTo(s * 0.82, s * 0.08);
    ctx.lineTo(s * 0.42, s * 0.08);
    ctx.lineTo(s * 0.25, s * 0.5);
    ctx.lineTo(s * 0.1, s * 0.3);
    ctx.lineTo(0, s * 0.65);
    ctx.lineTo(-s * 0.1, s * 0.3);
    ctx.lineTo(-s * 0.25, s * 0.5);
    ctx.lineTo(-s * 0.42, s * 0.08);
    ctx.lineTo(-s * 0.82, s * 0.08);
    ctx.lineTo(-s * 0.3, -s * 0.22);
    ctx.lineTo(-s * 0.52, -s * 0.6);
    ctx.lineTo(-s * 0.18, -s * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(-s * 0.07, s * 0.65, s * 0.14, s * 0.38);
    ctx.restore();
  },

  _drawOcean(ctx, W, H, t, leg) {
    const sky = ctx.createLinearGradient(0, 0, 0, H * 0.45);
    if (leg >= 2) {
      sky.addColorStop(0, '#2a6db5');
      sky.addColorStop(1, '#7ac8e8');
    } else {
      sky.addColorStop(0, '#4a7fc0');
      sky.addColorStop(1, '#8ac0e0');
    }
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H * 0.45);

    const water = ctx.createLinearGradient(0, H * 0.45, 0, H);
    water.addColorStop(0, '#1a7ab5');
    water.addColorStop(1, '#0a4070');
    ctx.fillStyle = water;
    ctx.fillRect(0, H * 0.45, W, H * 0.55);

    // Horizon
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, H * 0.45);
    ctx.lineTo(W, H * 0.45);
    ctx.stroke();

    // Waves
    for (let row = 0; row < 5; row++) {
      const wy = H * 0.5 + row * 24;
      ctx.strokeStyle = `rgba(255,255,255,${0.12 + row * 0.06})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let x = 0; x <= W; x += 2) {
        const waveY = wy + Math.sin(x / 32 + t / 28 + row * 1.2) * 3;
        x === 0 ? ctx.moveTo(x, waveY) : ctx.lineTo(x, waveY);
      }
      ctx.stroke();
    }

    // Leg 3: approaching coast — green haze + Brazilian flag
    if (leg === 2) {
      // Tropical green haze on right horizon
      const coastGrad = ctx.createLinearGradient(W * 0.6, 0, W, 0);
      coastGrad.addColorStop(0, 'rgba(30,100,40,0)');
      coastGrad.addColorStop(1, 'rgba(40,120,55,0.35)');
      ctx.fillStyle = coastGrad;
      ctx.fillRect(W * 0.6, H * 0.3, W * 0.4, H * 0.2);
      this._drawBrazilianFlag(ctx, W - 70, 8, 62, 41);
    }
  },

  _drawBrazilianFlag(ctx, x, y, w, h) {
    ctx.save();
    ctx.fillStyle = '#009C3B';
    roundRect(ctx, x, y, w, h, 3);
    ctx.fill();
    ctx.fillStyle = '#FFDF00';
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y + 3);
    ctx.lineTo(x + w - 4, y + h / 2);
    ctx.lineTo(x + w / 2, y + h - 3);
    ctx.lineTo(x + 4, y + h / 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#002776';
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2, h * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2 + 2, h * 0.17, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
    ctx.restore();
  },

  _drawWindLines(ctx, W, H, windDeg, t) {
    ctx.save();
    ctx.translate(W / 2, H / 2);
    // Wind FROM windDeg → flows toward windDeg+180
    ctx.rotate((windDeg + 180) * Math.PI / 180);

    const D = 230;
    const yOffsets = [-65, -22, 22, 65];
    const speed = 1.5;
    const markerPeriod = 88;

    yOffsets.forEach((yOff, i) => {
      const wavePhase = t * 0.05 + i * 1.1;
      const alpha = 0.5 + 0.18 * Math.sin(t * 0.022 + i * 0.7);
      ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';

      // Wavy line
      ctx.beginPath();
      let first = true;
      for (let x = -D; x <= D; x += 3) {
        const y = yOff + Math.sin(x * 0.07 + wavePhase) * 6;
        first ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        first = false;
      }
      ctx.stroke();

      // Moving arrow chevrons
      const baseOffset = (t * speed + i * 22) % markerPeriod;
      for (let base = -D + 10; base < D - 10; base += markerPeriod) {
        const px = base + baseOffset;
        if (px < -D + 8 || px > D - 8) continue;
        const py = yOff + Math.sin(px * 0.07 + wavePhase) * 6;
        ctx.save();
        ctx.translate(px, py);
        ctx.strokeStyle = `rgba(255,255,255,${Math.min(1, alpha * 1.4).toFixed(2)})`;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(-7, -5); ctx.lineTo(0, 0); ctx.lineTo(-7, 5);
        ctx.stroke();
        ctx.restore();
      }
    });

    ctx.restore();
  },

  _drawBoat(ctx, cx, cy, sailDeg, leg, t) {
    ctx.save();
    ctx.translate(cx, cy);

    // Wake (only on water)
    if (leg > 0) {
      for (let i = 0; i < 3; i++) {
        ctx.strokeStyle = `rgba(255,255,255,${0.25 - i * 0.06})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        const wy = 34 + i * 18;
        ctx.moveTo(-10 + i * 3, wy);
        ctx.quadraticCurveTo(0, wy + 10, 10 - i * 3, wy);
        ctx.stroke();
      }
    }

    // Hull shadow
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath();
    ctx.ellipse(3, 4, 18, 38, 0, 0, Math.PI * 2);
    ctx.fill();

    // Hull
    const hullGrad = ctx.createLinearGradient(-18, 0, 18, 0);
    hullGrad.addColorStop(0, '#231508');
    hullGrad.addColorStop(0.4, '#4a2e10');
    hullGrad.addColorStop(1, '#321b06');
    ctx.fillStyle = hullGrad;
    ctx.strokeStyle = '#180e04';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, 38, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Hull sheen
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.beginPath();
    ctx.ellipse(-5, -8, 6, 18, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Mast pole
    ctx.strokeStyle = '#9a6030';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, -42); ctx.lineTo(0, 8);
    ctx.stroke();

    // Mast cap
    ctx.fillStyle = '#b07040';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    // Sail
    const sailRad = (sailDeg - 90) * Math.PI / 180;
    const boomLen = 50;
    const boomX = Math.cos(sailRad) * boomLen;
    const boomY = Math.sin(sailRad) * boomLen;
    const mastTop = -38;

    const sailGrad = ctx.createLinearGradient(0, mastTop, boomX, boomY);
    sailGrad.addColorStop(0, 'rgba(255,250,230,0.96)');
    sailGrad.addColorStop(1, 'rgba(215,195,155,0.88)');
    ctx.fillStyle = sailGrad;
    ctx.strokeStyle = 'rgba(130,90,40,0.65)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, mastTop);
    ctx.lineTo(boomX, boomY);
    ctx.lineTo(0, 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Boom
    ctx.strokeStyle = '#7a5020';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(boomX, boomY);
    ctx.stroke();

    // Drag handle at boom tip
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.strokeStyle = 'rgba(200,160,80,0.8)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(boomX, boomY, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  },

  cleanup() {
    if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null; }
    this._canvas = null;
    this._ctx = null;
    this._dragging = false;
  }
};

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
        ${fretboardSVG(currentChord ? CHORDS[currentChord] : CHORDS['A'])}
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
  const W = 150, H = 180;
  const stringCount = 6;
  const fretCount = 5;
  const padLeft = 20, padTop = 30;
  const stringSpacing = (W - padLeft - 16) / (stringCount - 1);
  const fretSpacing = (H - padTop - 20) / fretCount;

  let lines = '';
  for (let f = 0; f <= fretCount; f++) {
    const y = padTop + f * fretSpacing;
    const sw = f === 0 ? 3 : 1.5;
    lines += `<line x1="${padLeft}" y1="${y}" x2="${W - 16}" y2="${y}" stroke="#7a6050" stroke-width="${sw}"/>`;
  }
  for (let s = 0; s < stringCount; s++) {
    const x = padLeft + s * stringSpacing;
    lines += `<line x1="${x}" y1="${padTop}" x2="${x}" y2="${padTop + fretCount * fretSpacing}" stroke="#7a6050" stroke-width="1"/>`;
  }

  let markers = '';
  for (let s = 0; s < stringCount; s++) {
    const x = padLeft + s * stringSpacing;
    const fret = shape[s];
    if (fret === -1) {
      markers += `<text x="${x}" y="${padTop - 14}" text-anchor="middle" font-size="12" fill="#a03020">✕</text>`;
    } else if (fret === 0) {
      markers += `<circle cx="${x}" cy="${padTop - 16}" r="5" fill="none" stroke="#7a6050" stroke-width="1.5"/>`;
    } else {
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
  1,0,0,1,1,
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
        if (gameState.sceneData.s3.grid.every((v, i) => v === TARGET_40[i])) {
          gameState.completed[2] = true;
          saveState();
          feedback.textContent = '40 — the shape appears in light.';
          setTimeout(() => showScene(4), 1200);
        }
      });
    });
  }
};

// ── Scene 4 — Forró Memory Game ─────────────────
const MOVES = ['Left', 'Right', 'Turn', 'Close'];
const MOVE_ICONS = { Left: '←', Right: '→', Turn: '↻', Close: '♡' };
let s4Timer = null;

const s4 = {
  id: 's4',
  render(app) {
    const { sequence, phase } = gameState.sceneData.s4;

    const cardsHTML = MOVES.map(m => `
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
        </div>`;
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
      app.querySelectorAll('.input-btn').forEach(btn => {
        addListener(btn, 'click', () => handleS4Input(btn.dataset.move, app, feedback));
      });
      const keyHandler = e => {
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
    MOVES.forEach(m => {
      const card = app.querySelector(`#card-${m}`);
      if (card) card.classList.remove('active');
    });
    if (step >= seq.length) {
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

function handleS4Input(move, app, feedback) {
  const { sequence, input } = gameState.sceneData.s4;
  const expected = sequence[input.length];

  if (move === expected) {
    gameState.sceneData.s4.input.push(move);
    const card = app.querySelector(`#card-${move}`);
    if (card) {
      card.classList.add('active');
      setTimeout(() => card.classList.remove('active'), 300);
    }
    if (gameState.sceneData.s4.input.length >= sequence.length) {
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
  // Always start fresh from the title screen on every page load
  gameState = JSON.parse(JSON.stringify(DEFAULT_STATE));
  showScene(0);
})();
