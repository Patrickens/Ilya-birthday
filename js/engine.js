// ── Listener registry ───────────────────────────
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

// ── Canvas helper ────────────────────────────────
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

// ── Scene indicator ──────────────────────────────
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

// ── Scene router ─────────────────────────────────
// `scenes` array is defined in main.js — referenced lazily at call time
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
