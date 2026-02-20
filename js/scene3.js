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
          `<button class="tile${on ? ' active' : ''}" data-index="${i}"></button>`
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
