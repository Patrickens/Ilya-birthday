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
