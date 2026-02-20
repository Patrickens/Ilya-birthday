// ── Scene 5 — Final ─────────────────────────────
const s5 = {
  id: 's5',

  render(app) {
    app.innerHTML = `
      <div class="final-scene">

        <!-- Photo strip -->
        <div style="display:flex;gap:8px;width:100%">
          <img src="pics/ILYA2.jpeg"
               style="height:130px;flex:1;min-width:0;object-fit:cover;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,0.22)">
          <img src="pics/ILYA_FRIEND.jpeg"
               style="height:130px;flex:1;min-width:0;object-fit:cover;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,0.22)">
          <img src="pics/ILYA_MELI.jpeg"
               style="height:130px;flex:1;min-width:0;object-fit:cover;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,0.22)">
        </div>

        <p>Baby, you turning fawty shawty.</p>
        <p>Winds mastered. Forró fo sho. Keepin it giddy on the guitar.</p>
        <p>Meli by your side, horizon wide.</p>
        <p>Little co-captain coming soon.</p>
        <p>Now that’s a future worth mapping.</p>

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
