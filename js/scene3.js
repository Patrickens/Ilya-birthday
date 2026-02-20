// ── Scene 3 — Forró Dance (animated figures) ─────
const FORRO_MOVES = ['Left', 'Right', 'Turn', 'Close'];
const FORRO_LABELS = { Left: '← Step', Right: 'Step →', Turn: '↻ Turn', Close: '♡ Close' };
let s3Timer = null;

// Build an animated SVG stick figure for each move type.
// Colour is driven by the parent .move-card via the fl-stroke CSS class.
function forroSVG(move) {
  const anim = {
    Left:  'fl-left  1.0s ease-in-out infinite',
    Right: 'fl-right 1.0s ease-in-out infinite',
    Turn:  'fl-turn  1.2s linear infinite',
    Close: 'fl-close 1.0s ease-in-out infinite'
  }[move];
  return `
    <svg viewBox="0 0 60 82" width="54" height="72" style="display:block;margin:0 auto 2px">
      <g class="fl-figure" style="animation:${anim};transform-origin:30px 40px">
        <circle cx="30" cy="11" r="9"  class="fl-stroke" fill="none" stroke-width="2.3"/>
        <line x1="30" y1="20" x2="30" y2="50"  class="fl-stroke" stroke-width="2.3"/>
        <line x1="30" y1="33" x2="10" y2="46"  class="fl-stroke" stroke-width="2.3"/>
        <line x1="30" y1="33" x2="50" y2="46"  class="fl-stroke" stroke-width="2.3"/>
        <line x1="30" y1="50" x2="14" y2="72"  class="fl-stroke" stroke-width="2.3"/>
        <line x1="30" y1="50" x2="46" y2="72"  class="fl-stroke" stroke-width="2.3"/>
      </g>
    </svg>`;
}

const FORRO_CSS = `
  <style id="forro-style">
    @keyframes fl-left  {
      0%,100% { transform: translate(0,0) rotate(0deg); }
      35%     { transform: translate(-13px,4px) rotate(-13deg); }
      70%     { transform: translate(-6px,2px) rotate(-6deg); }
    }
    @keyframes fl-right {
      0%,100% { transform: translate(0,0) rotate(0deg); }
      35%     { transform: translate(13px,4px) rotate(13deg); }
      70%     { transform: translate(6px,2px) rotate(6deg); }
    }
    @keyframes fl-turn {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }
    @keyframes fl-close {
      0%,100% { transform: translateY(0) scale(1); }
      50%     { transform: translateY(8px) scale(1.12); }
    }
    .fl-stroke { stroke: #a09080; }
    .move-card.active .fl-stroke { stroke: #c0703a; }
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

const s3 = {
  id: 's3',

  render(app) {
    const { phase } = gameState.sceneData.s3;

    const cardsHTML = FORRO_MOVES.map(m => `
      <div class="move-card" id="card-${m}">
        ${forroSVG(m)}
        <span>${FORRO_LABELS[m]}</span>
      </div>`).join('');

    let controlsHTML = '';
    if (phase === 'idle') {
      controlsHTML = `<button class="primary" id="btn-watch">Watch the sequence</button>`;
    } else if (phase === 'input') {
      controlsHTML = `<p class="narrative" style="font-size:0.88rem">Your turn — click the moves in order!</p>`;
    } else {
      controlsHTML = `<p class="narrative">Watch carefully…</p>`;
    }

    app.innerHTML = `
      ${FORRO_CSS}
      <h2>Dance of the Forró</h2>
      <p class="narrative">On the dance floor in Rio, the steps come alive. Watch the sequence, then mirror it.</p>
      <div class="move-cards" id="move-cards">${cardsHTML}</div>
      <div id="s3-controls">${controlsHTML}</div>
      <div class="feedback" id="feedback"></div>
    `;
  },

  bind(app) {
    const { phase } = gameState.sceneData.s3;
    const feedback  = app.querySelector('#feedback');

    if (phase === 'idle') {
      addListener(app.querySelector('#btn-watch'), 'click', () => {
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
  }
};

function s3PlaySequence(app) {
  const seq = gameState.sceneData.s3.sequence;
  let step = 0;

  function showStep() {
    FORRO_MOVES.forEach(m => {
      const c = app.querySelector(`#card-${m}`);
      if (c) c.classList.remove('active');
    });

    if (step >= seq.length) {
      s3Timer = setTimeout(() => {
        gameState.sceneData.s3.phase = 'input';
        gameState.sceneData.s3.input = [];
        showScene(3);
      }, 400);
      return;
    }

    s3Timer = setTimeout(() => {
      const card = app.querySelector(`#card-${seq[step]}`);
      if (card) card.classList.add('active');
      step++;
      s3Timer = setTimeout(() => {
        if (card) card.classList.remove('active');
        showStep();
      }, 850);
    }, 280);
  }

  showStep();
}

function handleS3Input(move, app, feedback) {
  const { sequence, input } = gameState.sceneData.s3;
  const expected = sequence[input.length];

  if (move === expected) {
    gameState.sceneData.s3.input.push(move);
    const card = app.querySelector(`#card-${move}`);
    if (card) {
      card.classList.add('active');
      setTimeout(() => card.classList.remove('active'), 380);
    }

    if (gameState.sceneData.s3.input.length >= sequence.length) {
      gameState.completed[2] = true;
      saveState();
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
