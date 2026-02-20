// ── Scene 2 — Guitar (Spell AGED) ──────────────
const CHORDS = {
  A: [-1, 0, 2, 2, 2, 0],
  G: [3, 2, 0, 0, 0, 3],
  E: [0, 2, 2, 1, 0, 0],
  D: [-1, -1, 0, 2, 3, 2]
};
const SEQUENCE = ['A', 'G', 'E', 'D'];

let s2Audio = null;

const s2 = {
  id: 's2',

  cleanup() {
    if (s2Audio) { s2Audio.pause(); s2Audio = null; }
  },

  render(app) {
    const { index, solved } = gameState.sceneData.s2;
    const currentChord = index < 4 ? SEQUENCE[index] : null;

    const solvedDisplay = SEQUENCE.map((ch, i) =>
      solved[i] ? `<span style="color:var(--accent-dark);font-weight:bold">${ch}</span>` : '_'
    ).join(' ');

    app.innerHTML = `
      <h2>Song of the Shore</h2>
      <p class="narrative">Washed up on a Brazilian beach, you find a guitar. Its inscription reads: "Play the chords to spell what you are..."</p>
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
        const idx = gameState.sceneData.s2.index;
        if (idx >= 4) return;

        if (letter === SEQUENCE[idx]) {
          gameState.sceneData.s2.solved.push(letter);
          gameState.sceneData.s2.index++;

          if (gameState.sceneData.s2.index >= 4) {
            gameState.completed[1] = true;
            saveState();
            app.querySelector('.chord-label').textContent = '✓ A G E D — beautifully played.';
            app.querySelector('.solved-display').innerHTML = SEQUENCE.map(ch =>
              `<span style="color:var(--accent-dark);font-weight:bold">${ch}</span>`
            ).join(' ');
            feedback.className = 'feedback';
            feedback.textContent = 'The music echoes across the sand…';
            s2Audio = new Audio('BOSSA_GUITAR.mp3');
            try { s2Audio.play(); } catch(e) {}
            setTimeout(() => showScene(3), 8000);
          } else {
            // Re-render to show next chord
            showScene(2);
          }
        } else {
          btn.classList.add('shake');
          feedback.className = 'feedback error';
          feedback.textContent = `Wrong — next chord is ${SEQUENCE[idx]}`;
          setTimeout(() => btn.classList.remove('shake'), 350);
        }
      });
    });
  }
};

function fretboardSVG(shape) {
  const W = 150, H = 180;
  const padLeft = 20, padTop = 30;
  const stringCount = 6, fretCount = 5;
  const stringSpacing = (W - padLeft - 16) / (stringCount - 1);
  const fretSpacing = (H - padTop - 20) / fretCount;

  let lines = '';
  for (let f = 0; f <= fretCount; f++) {
    const y = padTop + f * fretSpacing;
    lines += `<line x1="${padLeft}" y1="${y}" x2="${W - 16}" y2="${y}" stroke="#7a6050" stroke-width="${f === 0 ? 3 : 1.5}"/>`;
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

  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="background:#fdf6ec;border-radius:8px">${lines}${markers}</svg>`;
}
