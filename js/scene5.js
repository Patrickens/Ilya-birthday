// ── Scene 5 — Final ─────────────────────────────
const s5 = {
  id: 's5',

  render(app) {
    app.innerHTML = `
      <div class="final-scene">
        <h1>Meli,</h1>

        <!-- Photo strip -->
        <div style="display:flex;gap:8px;width:100%">
          <img src="pics/ILYA2.jpeg"
               style="height:130px;flex:1;min-width:0;object-fit:cover;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,0.22)">
          <img src="pics/ILYA_FRIEND.jpeg"
               style="height:130px;flex:1;min-width:0;object-fit:cover;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,0.22)">
          <img src="pics/ILYA_MELI.jpeg"
               style="height:130px;flex:1;min-width:0;object-fit:cover;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,0.22)">
        </div>

        <p>Forty is not an ending — it's the moment the cartographer looks up and realises how much more there is to explore.</p>
        <p>The next chapter holds what matters most: friends, family, and every wind, chord, route and dance move that brought you here — lived more fully.</p>

        <!-- Birthday GIF -->
        <img src="BDAY_GIF.gif"
             style="width:100%;max-width:300px;border-radius:12px;box-shadow:0 2px 10px rgba(0,0,0,0.2)">

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
