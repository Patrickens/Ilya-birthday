// ── Scene 3 — Route Optimization ────────────────
const GRAPH_S3 = {
  RIO: [{to:'DKR',weight:10},{to:'LIS',weight:18},{to:'BCN',weight:15}],
  DKR: [{to:'RIO',weight:10},{to:'LIS',weight:8}],
  LIS: [{to:'DKR',weight:8},{to:'RIO',weight:18},{to:'MOS',weight:13},{to:'BCN',weight:6}],
  BCN: [{to:'RIO',weight:15},{to:'LIS',weight:6},{to:'MOS',weight:11},{to:'ZRH',weight:17}],
  MOS: [{to:'LIS',weight:13},{to:'BCN',weight:11},{to:'ZRH',weight:9}],
  ZRH: [{to:'MOS',weight:9},{to:'BCN',weight:17}]
};

// Hardcoded node positions in SVG viewBox 368×262
const S3_NODES = {
  RIO: {x:40,  y:228},
  DKR: {x:74,  y:152},
  LIS: {x:162, y:133},
  BCN: {x:232, y:186},
  MOS: {x:298, y:58},
  ZRH: {x:326, y:150}
};

const S3_EDGES = [
  {a:'RIO', b:'DKR', w:10},
  {a:'DKR', b:'LIS', w:8},
  {a:'LIS', b:'MOS', w:13},
  {a:'MOS', b:'ZRH', w:9},
  {a:'RIO', b:'LIS', w:18},
  {a:'LIS', b:'BCN', w:6},
  {a:'BCN', b:'ZRH', w:17},
  {a:'RIO', b:'BCN', w:15},
  {a:'MOS', b:'BCN', w:11}
];

// Module-level route state (reset on render())
let s3Route = ['RIO'];
let s3Total = 0;

const s3 = {
  id: 's3',

  render(app) {
    s3Route = ['RIO'];
    s3Total = 0;
    this._draw(app);
  },

  _draw(app) {
    const current = s3Route[s3Route.length - 1];
    const adj = (GRAPH_S3[current] || []).map(e => e.to);
    const done = current === 'ZRH';
    const success = done && s3Total === 40;

    // ── SVG edges ──────────────────────────────────
    const edgeSVG = S3_EDGES.map(e => {
      const a = S3_NODES[e.a], b = S3_NODES[e.b];
      const inRoute = s3Route.some((n, i) => i > 0 &&
        ((s3Route[i-1] === e.a && n === e.b) || (s3Route[i-1] === e.b && n === e.a)));
      const col = inRoute ? '#c0703a' : '#b0c4d8';
      const lw  = inRoute ? 3 : 1.5;
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      return `
        <line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"
              stroke="${col}" stroke-width="${lw}" stroke-linecap="round"/>
        <rect x="${mx-10}" y="${my-8}" width="20" height="14" rx="3"
              fill="rgba(255,255,255,0.92)" stroke="${col}" stroke-width="0.5"/>
        <text x="${mx}" y="${my+4}" text-anchor="middle"
              font-size="9.5" fill="#444" font-family="monospace" font-weight="bold">${e.w}</text>`;
    }).join('');

    // ── SVG nodes ──────────────────────────────────
    const nodeSVG = Object.entries(S3_NODES).map(([name, pos]) => {
      const isCurr  = name === current;
      const inRoute = s3Route.includes(name) && !isCurr;
      const isAdj   = adj.includes(name) && !done;
      const fill   = isCurr ? '#c0703a' : inRoute ? '#f0c090' : isAdj ? '#ddeeff' : '#fff';
      const stroke = isCurr ? '#8a4010' : isAdj ? '#4a90d0' : '#aab8cc';
      const sw     = (isCurr || isAdj) ? 2.5 : 1.5;
      const textFill = isCurr ? '#fff' : '#333';
      return `
        <g class="s3n" data-node="${name}" data-adj="${isAdj}"
           style="cursor:${isAdj ? 'pointer' : 'default'}">
          <circle cx="${pos.x}" cy="${pos.y}" r="19"
                  fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>
          <text x="${pos.x}" y="${pos.y+4}" text-anchor="middle"
                font-size="10" font-weight="bold" fill="${textFill}" font-family="monospace">${name}</text>
        </g>`;
    }).join('');

    // ── Status (success / recalculating) ──────────
    let statusHTML = '';
    if (success) {
      statusHTML = `
        <div class="feedback" style="color:#2a7a30;font-weight:bold">
          Route found: 40. Optimal enough to sail by.
        </div>
        <button class="primary" id="s3-next">Continue →</button>`;
    } else if (done) {
      statusHTML = `<div class="feedback error">Recalculating… Total was ${s3Total}. Need exactly 40.</div>`;
    }

    app.innerHTML = `
      <h2>Route Optimization</h2>
      <p class="narrative">A familiar interface appears. From Rio to Zurich — find the route whose total cost is exactly <strong>40</strong>.</p>
      <div style="position:relative;width:100%">
        <svg id="s3-map" viewBox="0 0 368 262"
             style="width:100%;border-radius:10px;background:linear-gradient(150deg,#e6f2ff,#f0f8ea);display:block;overflow:visible">
          <defs>
            <pattern id="s3g" width="22" height="22" patternUnits="userSpaceOnUse">
              <path d="M22 0L0 0 0 22" fill="none" stroke="rgba(160,190,220,0.3)" stroke-width="0.6"/>
            </pattern>
          </defs>
          <rect width="368" height="262" fill="url(#s3g)"/>
          ${edgeSVG}
          ${nodeSVG}
        </svg>
        <img src="pics/ILYA_NOBG.png"
             style="position:absolute;right:6px;bottom:6px;height:68px;opacity:0.88;pointer-events:none" alt="">
      </div>
      <div style="background:#fff;border:1px solid #ddd;border-radius:8px;padding:0.55rem 0.9rem;width:100%;font-size:0.85rem">
        <div style="color:#999;font-size:0.72rem;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:2px">Route</div>
        <div style="font-family:monospace;font-weight:bold;color:#333">${s3Route.join(' → ')}</div>
        <div style="color:#c0703a;margin-top:4px">Total: <strong>${s3Total}</strong> / 40</div>
      </div>
      <div style="display:flex;gap:0.5rem;width:100%">
        <button id="s3-undo" style="flex:1">← Undo</button>
        <button id="s3-reset" style="flex:1">Reset</button>
      </div>
      <div id="s3-status" style="min-height:2.5rem;display:flex;flex-direction:column;align-items:center;gap:0.5rem">
        ${statusHTML}
      </div>
    `;
  },

  bind(app) {
    const self = this;

    // Single delegated listener on the SVG
    addListener(app.querySelector('#s3-map'), 'click', e => {
      const g = e.target.closest('.s3n');
      if (!g) return;
      const node    = g.dataset.node;
      const current = s3Route[s3Route.length - 1];
      if (current === 'ZRH') return;

      if (g.dataset.adj === 'true') {
        const edge = GRAPH_S3[current].find(x => x.to === node);
        s3Route.push(node);
        s3Total += edge.weight;
      } else if (node !== current) {
        const fb = app.querySelector('#s3-status');
        if (fb) fb.innerHTML = '<span style="color:#a03020;font-size:0.85rem">No direct route from here.</span>';
        return;
      }

      clearListeners();
      self._draw(app);
      self.bind(app);
    });

    addListener(app.querySelector('#s3-undo'), 'click', () => {
      if (s3Route.length <= 1) return;
      const removed = s3Route.pop();
      const prev    = s3Route[s3Route.length - 1];
      const edge    = GRAPH_S3[prev].find(x => x.to === removed);
      if (edge) s3Total -= edge.weight;
      clearListeners();
      self._draw(app);
      self.bind(app);
    });

    addListener(app.querySelector('#s3-reset'), 'click', () => {
      s3Route = ['RIO'];
      s3Total = 0;
      clearListeners();
      self._draw(app);
      self.bind(app);
    });

    const nextBtn = app.querySelector('#s3-next');
    if (nextBtn) {
      addListener(nextBtn, 'click', () => {
        gameState.completed[2] = true;
        saveState();
        showScene(4);
      });
    }
  }
};
