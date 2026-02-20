// ── Scene 4 — Forró Memory Game ─────────────────
const MOVES = ['Left', 'Right', 'Turn', 'Close'];
const MOVE_ICONS = { Left: '←', Right: '→', Turn: '↻', Close: '♡' };
let s4Timer = null;

const s4 = {
  id: 's4',

  render(app) {
    const { phase } = gameState.sceneData.s4;

    const cardsHTML = MOVES.map(m => `
      <div class="move-card" id="card-${m}">
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
