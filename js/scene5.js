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
