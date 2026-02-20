// ── Scene 3 — Forró Dance (animated figures) ─────
const FORRO_MOVES  = ['Left', 'Right', 'Turn', 'Close'];
const FORRO_LABELS = { Left: '← Step Left', Right: 'Step Right →', Turn: '↻ Turn', Close: '♡ Close' };
let s3Timer = null;
let s3Audio = null;

// ── SVG stick-figure builders ────────────────────
// Single figure (Left / Right / Turn)
function _figureLines(cx, stroke) {
  return `
    <circle cx="${cx}" cy="11" r="9"  class="${stroke}" fill="none" stroke-width="2.3"/>
    <line x1="${cx}" y1="20" x2="${cx}"    y2="50"  class="${stroke}" stroke-width="2.3"/>
    <line x1="${cx}" y1="33" x2="${cx-18}" y2="46"  class="${stroke}" stroke-width="2.3"/>
    <line x1="${cx}" y1="33" x2="${cx+18}" y2="46"  class="${stroke}" stroke-width="2.3"/>
    <line x1="${cx}" y1="50" x2="${cx-14}" y2="72"  class="${stroke}" stroke-width="2.3"/>
    <line x1="${cx}" y1="50" x2="${cx+14}" y2="72"  class="${stroke}" stroke-width="2.3"/>`;
}

function forroSVG(move, large) {
  if (move === 'Close') return forroSVGClose(large);

  const W = large ? 90  : 56;
  const H = large ? 115 : 74;
  const sc = large ? 'fl-stroke-lg' : 'fl-stroke';

  // Turn gets a perspective wrapper for the rotateY spin
  if (move === 'Turn') {
    return `
      <div style="perspective:260px;display:flex;justify-content:center">
        <svg viewBox="0 0 60 82" width="${W}" height="${H}"
             style="display:block;overflow:visible">
          <g style="animation:fl-turn 1.5s linear infinite;
                    transform-box:fill-box;transform-origin:center center">
            ${_figureLines(30, sc)}
          </g>
        </svg>
      </div>`;
  }

  const anim = move === 'Left'
    ? 'fl-left  1.0s ease-in-out infinite'
    : 'fl-right 1.0s ease-in-out infinite';

  return `
    <svg viewBox="0 0 60 82" width="${W}" height="${H}"
         style="display:block;margin:0 auto;overflow:visible">
      <g class="fl-figure" style="animation:${anim};transform-origin:30px 40px">
        ${_figureLines(30, sc)}
      </g>
    </svg>`;
}

// Close: two figures walking toward each other
function forroSVGClose(large) {
  const W = large ? 150 : 100;
  const H = large ? 115 : 74;
  const sc = large ? 'fl-stroke-lg' : 'fl-stroke';
  return `
    <svg viewBox="0 0 100 82" width="${W}" height="${H}"
         style="display:block;margin:0 auto;overflow:visible">
      <g style="animation:fl-close-a 1.1s ease-in-out infinite;transform-origin:22px 40px">
        ${_figureLines(22, sc)}
      </g>
      <g style="animation:fl-close-b 1.1s ease-in-out infinite;transform-origin:78px 40px">
        ${_figureLines(78, sc)}
      </g>
    </svg>`;
}

// ── Injected CSS ─────────────────────────────────
const FORRO_CSS = `
  <style id="forro-style">
    /* Move animations */
    @keyframes fl-left {
      0%,100% { transform: translate(0,0) rotate(0deg); }
      35%     { transform: translate(-13px,4px) rotate(-13deg); }
      70%     { transform: translate(-6px,2px)  rotate(-6deg);  }
    }
    @keyframes fl-right {
      0%,100% { transform: translate(0,0) rotate(0deg); }
      35%     { transform: translate(13px,4px)  rotate(13deg);  }
      70%     { transform: translate(6px,2px)   rotate(6deg);   }
    }
    /* Spin around head-to-toe axis (rotateY = vertical axis) */
    @keyframes fl-turn {
      from { transform: rotateY(0deg);   }
      to   { transform: rotateY(360deg); }
    }
    /* Two figures approaching each other */
    @keyframes fl-close-a {
      0%,100% { transform: translateX(0);    }
      50%     { transform: translateX(18px); }
    }
    @keyframes fl-close-b {
      0%,100% { transform: translateX(0);     }
      50%     { transform: translateX(-18px); }
    }

    /* Colour tokens */
    .fl-stroke    { stroke: #a09080; }
    .fl-stroke-lg { stroke: #c0703a; }

    /* Stage large-figure container */
    #s3-stage {
      width: 100%;
      min-height: 140px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: rgba(255,248,240,0.7);
      border-radius: 14px;
      padding: 1rem 0.5rem 0.75rem;
      border: 1.5px solid #e8d0b8;
    }
    #s3-stage .stage-label {
      font-size: 1.05rem;
      font-weight: bold;
      color: #c0703a;
      margin-top: 8px;
    }
    #s3-stage .stage-counter {
      font-size: 0.78rem;
      color: #9a8070;
      margin-bottom: 4px;
    }

    /* Small cards — text only, compact */
    .move-card { height: 58px; min-width: 0; padding: 0 0.4rem; font-size: 0.78rem; }
    .move-card.active .fl-stroke  { stroke: #c0703a; }
    .move-card.active .fl-stroke-lg { stroke: #c0703a; }
    .move-card.active {
      background: #fff3e8;
      border-color: #c0703a;
      transform: scale(1.14);
      box-shadow: 0 4px 18px rgba(192,112,58,0.35);
    }
    .move-card.fl-clickable { cursor: pointer; }
    .move-card.fl-clickable:hover:not(.active) {
      border-color: #c0703a;
      background: #fff8f0;
    }
  </style>`;

// ── Scene object ─────────────────────────────────
const s3 = {
  id: 's3',

  render(app) {
    const { phase } = gameState.sceneData.s3;

    // Small cards — text label only (player must match text to the animation they watched)
    const cardsHTML = FORRO_MOVES.map(m => `
      <div class="move-card" id="card-${m}">
        <span style="font-size:0.8rem;font-weight:bold;color:var(--muted);text-align:center;line-height:1.2">${FORRO_LABELS[m]}</span>
      </div>`).join('');

    // Stage content — idle filled by preview cycle in bind(); showing filled by s3PlaySequence
    let stageHTML = '';
    if (phase === 'input') {
      stageHTML = `
        <p style="color:#c0703a;font-weight:bold;font-size:1rem;margin:0">
          Your turn — tap the moves in order!
        </p>`;
    }

    let controlsHTML = phase === 'idle'
      ? `<button class="primary" id="btn-watch">Watch the sequence</button>`
      : '';

    app.innerHTML = `
      ${FORRO_CSS}
      <h2>Dance of the Forró</h2>
      <p class="narrative">On the dance floor in Rio, the steps come alive.</p>
      <div id="s3-stage">${stageHTML}</div>
      <div class="move-cards" id="move-cards">${cardsHTML}</div>
      <div id="s3-controls">${controlsHTML}</div>
      <div class="feedback" id="feedback"></div>
    `;
  },

  bind(app) {
    const { phase } = gameState.sceneData.s3;
    const feedback  = app.querySelector('#feedback');

    // Start music (loop for whole scene)
    if (!s3Audio) {
      s3Audio = new Audio('FORRO_MUSIC.mp3');
      s3Audio.loop = true;
      try { s3Audio.play(); } catch(e) {}
    }

    if (phase === 'idle') {
      s3IdlePreview(app);   // start cycling through moves immediately
      addListener(app.querySelector('#btn-watch'), 'click', () => {
        if (s3Timer) { clearTimeout(s3Timer); s3Timer = null; }
        gameState.sceneData.s3.sequence = Array.from({ length: 4 }, () =>
          FORRO_MOVES[Math.floor(Math.random() * FORRO_MOVES.length)]
        );
        gameState.sceneData.s3.input = [];
        gameState.sceneData.s3.phase = 'showing';
        showScene(3);
      });

    } else if (phase === 'showing') {
      s3PlaySequence(app);

    } else if (phase === 'input') {
      app.querySelectorAll('.move-card').forEach(card => {
        card.classList.add('fl-clickable');
        const move = card.id.replace('card-', '');
        addListener(card, 'click', () => handleS3Input(move, app, feedback));
      });
    }
  },

  cleanup() {
    if (s3Timer) { clearTimeout(s3Timer); s3Timer = null; }
    // s3Audio is stopped explicitly when leaving for scene 4, not here,
    // so music keeps playing across phase transitions within this scene.
  }
};

// ── Idle preview: cycle through all 4 moves with labels so player can study them ──
function s3IdlePreview(app) {
  let idx = 0;
  const stage = app.querySelector('#s3-stage');
  function next() {
    const move = FORRO_MOVES[idx % FORRO_MOVES.length];
    if (stage) {
      stage.innerHTML = `
        ${forroSVG(move, true)}
        <div class="stage-label">${FORRO_LABELS[move]}</div>
        <div class="stage-counter" style="margin-top:6px">Study the moves, then click Watch</div>`;
    }
    idx++;
    s3Timer = setTimeout(next, 1800);
  }
  next();
}

// ── Sequence playback ─────────────────────────────
// Shows each move as a large figure in #s3-stage, then transitions to input
function s3PlaySequence(app) {
  const seq   = gameState.sceneData.s3.sequence;
  const stage = app.querySelector('#s3-stage');
  let step = 0;

  function showStep() {
    // Clear small-card highlights
    FORRO_MOVES.forEach(m => {
      const c = app.querySelector(`#card-${m}`);
      if (c) c.classList.remove('active');
    });

    if (step >= seq.length) {
      if (stage) stage.innerHTML = `
        <p style="color:#c0703a;font-weight:bold;font-size:1rem;margin:0">
          Your turn — tap the moves in order!
        </p>`;
      s3Timer = setTimeout(() => {
        gameState.sceneData.s3.phase = 'input';
        gameState.sceneData.s3.input = [];
        showScene(3);
      }, 500);
      return;
    }

    const move = seq[step];

    // Show large figure in stage — NO label, player must recognise the move
    if (stage) {
      stage.innerHTML = `
        <div class="stage-counter">Move ${step + 1} of ${seq.length}</div>
        ${forroSVG(move, true)}`;
    }

    // Also highlight the corresponding small card
    const card = app.querySelector(`#card-${move}`);
    if (card) card.classList.add('active');

    step++;
    s3Timer = setTimeout(() => {
      if (card) card.classList.remove('active');
      s3Timer = setTimeout(showStep, 200);
    }, 1000);
  }

  showStep();
}

// ── Input handling ────────────────────────────────
function handleS3Input(move, app, feedback) {
  const { sequence, input } = gameState.sceneData.s3;
  const expected = sequence[input.length];

  if (move === expected) {
    gameState.sceneData.s3.input.push(move);

    // Flash the move large in the stage as confirmation
    const stage = app.querySelector('#s3-stage');
    if (stage) stage.innerHTML = forroSVG(move, true);

    const card = app.querySelector(`#card-${move}`);
    if (card) {
      card.classList.add('active');
      setTimeout(() => card.classList.remove('active'), 380);
    }

    if (gameState.sceneData.s3.input.length >= sequence.length) {
      gameState.completed[2] = true;
      saveState();
      if (s3Audio) { s3Audio.pause(); s3Audio = null; }
      feedback.textContent = 'Perfect rhythm! You feel the beat.';
      setTimeout(() => showScene(4), 1200);
    }
  } else {
    feedback.className = 'feedback error';
    feedback.textContent = 'Not quite — watch again!';
    gameState.sceneData.s3.input = [];
    gameState.sceneData.s3.phase = 'showing';
    setTimeout(() => showScene(3), 900);
  }
}
