// ── Scene 3 — Route Optimization ────────────────
const GRAPH_S3 = {
  RIO: [{to:'DKR',weight:10},{to:'LIS',weight:18},{to:'BCN',weight:15}],
  DKR: [{to:'RIO',weight:10},{to:'LIS',weight:8}],
  LIS: [{to:'DKR',weight:8},{to:'RIO',weight:18},{to:'MOS',weight:13},{to:'BCN',weight:6}],
  BCN: [{to:'RIO',weight:15},{to:'LIS',weight:6},{to:'MOS',weight:11},{to:'ZRH',weight:17}],
  MOS: [{to:'LIS',weight:13},{to:'BCN',weight:11},{to:'ZRH',weight:9}],
  ZRH: [{to:'MOS',weight:9},{to:'BCN',weight:17}]
};

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

const S3_VW = 368, S3_VH = 262;

// Google Maps colour palette
const GM = {
  blue:   '#4285F4',
  green:  '#0F9D58',
  red:    '#DB4437',
  yellow: '#F4B400',
  gray:   '#9E9E9E',
  routeLine: '#4285F4',
  bg:     '#f2efe9'
};

let s3Route = ['RIO'];
let s3Total = 0;

// SVG map-pin path centred on (cx, cy); pin head r=11, tail tip at cy+14
function s3Pin(cx, cy, fill, stroke, r) {
  r = r || 11;
  const tail = cy + r + 14;
  return `
    <path d="M${cx},${tail}
             C${cx - r * 0.6},${cy + r * 0.7} ${cx - r},${cy + r * 0.2} ${cx - r},${cy}
             A${r},${r} 0 1 1 ${cx + r},${cy}
             C${cx + r},${cy + r * 0.2} ${cx + r * 0.6},${cy + r * 0.7} ${cx},${tail} Z"
          fill="${fill}" stroke="${stroke}" stroke-width="1.5" stroke-linejoin="round"/>
    <circle cx="${cx}" cy="${cy}" r="${Math.round(r * 0.38)}"
            fill="rgba(255,255,255,0.7)"/>`;
}

const s3 = {
  id: 's3',

  render(app) {
    s3Route = ['RIO'];
    s3Total = 0;

    app.innerHTML = `
      <h2>Route Optimization</h2>
      <p class="narrative">A familiar interface appears. From Rio to Zurich — find the route whose total cost is exactly <strong>40</strong>.</p>

      <!-- Fake Google Maps search bar -->
      <div style="width:100%;background:#fff;border-radius:8px;box-shadow:0 1px 6px rgba(0,0,0,0.2);
                  padding:0.45rem 0.75rem;display:flex;align-items:center;gap:0.5rem;font-size:0.85rem">
        <span style="color:#4285F4;font-size:1.1rem">⬤</span>
        <span style="color:#555;font-family:sans-serif">Rio de Janeiro → Zurich · find cost = 40</span>
        <span style="margin-left:auto;color:#4285F4;font-family:sans-serif;font-size:0.8rem;font-weight:bold">Maps</span>
      </div>

      <div id="s3-wrap" style="position:relative;width:100%">
        <div id="s3-map-inner"></div>
        <!-- Ilya travels as a map marker -->
        <img id="s3-ilya" src="pics/ILYA_NOBG.png"
             style="position:absolute;height:76px;pointer-events:none;
                    transition:left 0.55s cubic-bezier(0.4,0,0.2,1),top 0.55s cubic-bezier(0.4,0,0.2,1);
                    left:0;top:0;z-index:10;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.35))" alt="">
      </div>

      <!-- Route summary panel (Google Maps sidebar style) -->
      <div id="s3-route-info"
           style="background:#fff;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,0.15);
                  padding:0.6rem 0.9rem;width:100%;font-size:0.85rem;font-family:sans-serif"></div>

      <div style="display:flex;gap:0.5rem;width:100%">
        <button id="s3-undo" style="flex:1">← Undo</button>
        <button id="s3-reset" style="flex:1">Reset</button>
      </div>
      <div id="s3-status"
           style="min-height:2.5rem;display:flex;flex-direction:column;align-items:center;gap:0.5rem"></div>
    `;

    this._updateMap(app);

    // Place Ilya instantly at RIO (no transition on first render)
    const ilyaEl = app.querySelector('#s3-ilya');
    if (ilyaEl) {
      ilyaEl.style.transition = 'none';
      this._placeIlya(ilyaEl);
      setTimeout(() => {
        if (ilyaEl) ilyaEl.style.transition =
          'left 0.55s cubic-bezier(0.4,0,0.2,1),top 0.55s cubic-bezier(0.4,0,0.2,1)';
      }, 60);
    }
  },

  _updateMap(app) {
    const current = s3Route[s3Route.length - 1];
    const adj     = (GRAPH_S3[current] || []).map(e => e.to);
    const done    = current === 'ZRH';
    const success = done && s3Total === 40;

    // ── Edges ──────────────────────────────────────
    const edgeSVG = S3_EDGES.map(e => {
      const a = S3_NODES[e.a], b = S3_NODES[e.b];
      const inRoute = s3Route.some((n, i) => i > 0 &&
        ((s3Route[i-1] === e.a && n === e.b) || (s3Route[i-1] === e.b && n === e.a)));
      const col = inRoute ? GM.routeLine : '#c8cdd4';
      const lw  = inRoute ? 4 : 2;
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      const dash = inRoute ? '' : 'stroke-dasharray="5,4"';
      return `
        <line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"
              stroke="${col}" stroke-width="${lw}" stroke-linecap="round" ${dash}/>
        <rect x="${mx - 11}" y="${my - 8}" width="22" height="15" rx="3"
              fill="white" stroke="${col}" stroke-width="0.8"
              style="filter:drop-shadow(0 1px 2px rgba(0,0,0,0.12))"/>
        <text x="${mx}" y="${my + 5}" text-anchor="middle"
              font-size="9.5" fill="#333" font-family="sans-serif" font-weight="bold">${e.w}</text>`;
    }).join('');

    // ── Pin markers ────────────────────────────────
    const pinSVG = Object.entries(S3_NODES).map(([name, pos]) => {
      const isCurr  = name === current;
      const inRoute = s3Route.includes(name) && !isCurr;
      const isAdj   = adj.includes(name) && !done;
      const isStart = name === 'RIO';
      const isEnd   = name === 'ZRH';

      let fill, stroke;
      if (isStart)       { fill = GM.green;  stroke = '#0b7a44'; }
      else if (isEnd)    { fill = GM.red;    stroke = '#a33028'; }
      else if (isCurr)   { fill = GM.blue;   stroke = '#2a5dbf'; }
      else if (inRoute)  { fill = GM.blue;   stroke = '#2a5dbf'; }
      else if (isAdj)    { fill = GM.yellow; stroke = '#c48a00'; }
      else               { fill = GM.gray;   stroke = '#666';    }

      const r = isStart || isEnd ? 13 : 11;
      const pinY = pos.y - r - 14; // top of pin head (for click area)
      const cursor = isAdj ? 'pointer' : 'default';
      const hoverTitle = isAdj ? `title="${name} (+${GRAPH_S3[current].find(x=>x.to===name)?.weight})"` : '';
      return `
        <g class="s3n" data-node="${name}" data-adj="${isAdj}" style="cursor:${cursor}" ${hoverTitle}>
          ${s3Pin(pos.x, pos.y - r - 2, fill, stroke, r)}
          <text x="${pos.x}" y="${pos.y + r + 20}" text-anchor="middle"
                font-size="9" fill="#333" font-family="sans-serif" font-weight="600"
                style="text-shadow:0 0 3px #f2efe9">${name}</text>
        </g>`;
    }).join('');

    app.querySelector('#s3-map-inner').innerHTML = `
      <svg id="s3-map" viewBox="0 0 ${S3_VW} ${S3_VH}"
           style="width:100%;border-radius:10px;display:block;
                  box-shadow:0 1px 6px rgba(0,0,0,0.18)">
        <defs>
          <pattern id="s3roads" width="40" height="40" patternUnits="userSpaceOnUse">
            <rect width="40" height="40" fill="${GM.bg}"/>
            <line x1="0" y1="20" x2="40" y2="20" stroke="#e0dbd0" stroke-width="1.5"/>
            <line x1="20" y1="0" x2="20" y2="40" stroke="#e0dbd0" stroke-width="1.5"/>
          </pattern>
          <!-- water patch top-left (Atlantic) -->
        </defs>
        <rect width="${S3_VW}" height="${S3_VH}" fill="url(#s3roads)"/>
        <!-- Subtle ocean areas -->
        <ellipse cx="20" cy="230" rx="50" ry="40" fill="rgba(166,208,232,0.35)"/>
        <ellipse cx="340" cy="240" rx="40" ry="30" fill="rgba(166,208,232,0.2)"/>
        <!-- "Google Maps" watermark -->
        <text x="${S3_VW - 6}" y="${S3_VH - 4}" text-anchor="end"
              font-size="8" fill="rgba(0,0,0,0.28)" font-family="sans-serif">©&nbsp;Google&nbsp;Maps&nbsp;(parody)</text>
        ${edgeSVG}
        ${pinSVG}
      </svg>`;

    // ── Route info panel ───────────────────────────
    const steps = s3Route.map((n, i) => {
      if (i === 0) return `<span style="color:${GM.green};font-weight:bold">● ${n}</span>`;
      const edge = GRAPH_S3[s3Route[i-1]].find(x => x.to === n);
      const w = edge ? edge.weight : '?';
      return `<span style="color:#555"> → ${n}</span><span style="color:#4285F4;font-size:0.78rem"> (${w})</span>`;
    }).join('');

    app.querySelector('#s3-route-info').innerHTML = `
      <div style="color:#888;font-size:0.72rem;letter-spacing:0.05em;margin-bottom:4px">ROUTE</div>
      <div style="line-height:1.8">${steps}</div>
      <div style="margin-top:6px;display:flex;align-items:center;gap:0.5rem">
        <span style="background:${GM.blue};color:#fff;border-radius:4px;padding:2px 8px;font-size:0.8rem;font-family:sans-serif">
          ${s3Total} km
        </span>
        <span style="color:#888;font-size:0.8rem">/ target: 40 km</span>
      </div>`;

    // ── Status ─────────────────────────────────────
    let statusHTML = '';
    if (success) {
      statusHTML = `
        <div class="feedback" style="color:#0F9D58;font-weight:bold">
          🗺 Route found: 40 km. Optimal enough to sail by.
        </div>
        <button class="primary" id="s3-next">Continue →</button>`;
    } else if (done) {
      statusHTML = `<div class="feedback error">Recalculating… ${s3Total} km — need exactly 40.</div>`;
    }
    app.querySelector('#s3-status').innerHTML = statusHTML;
  },

  _placeIlya(ilyaEl) {
    const pos = S3_NODES[s3Route[s3Route.length - 1]];
    const r = 11;
    // Ilya's feet land at the pin tip
    const svgX = pos.x;
    const svgY = pos.y - r - 2 + r + 14; // == pos.y + 12 (pin tip)
    const leftPct = (svgX / S3_VW * 100).toFixed(1);
    const topPct  = (svgY / S3_VH * 100).toFixed(1);
    ilyaEl.style.left = `calc(${leftPct}% - 28px)`;
    ilyaEl.style.top  = `calc(${topPct}% - 76px)`;
  },

  bind(app) {
    const self = this;

    addListener(app.querySelector('#s3-map-inner'), 'click', e => {
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
        if (fb) fb.innerHTML =
          '<span style="color:#a03020;font-size:0.85rem">No direct route from here.</span>';
        return;
      }

      clearListeners();
      self._updateMap(app);
      const ilyaEl = app.querySelector('#s3-ilya');
      if (ilyaEl) setTimeout(() => self._placeIlya(ilyaEl), 30);
      self.bind(app);
    });

    addListener(app.querySelector('#s3-undo'), 'click', () => {
      if (s3Route.length <= 1) return;
      const removed = s3Route.pop();
      const prev    = s3Route[s3Route.length - 1];
      const edge    = GRAPH_S3[prev].find(x => x.to === removed);
      if (edge) s3Total -= edge.weight;
      clearListeners();
      self._updateMap(app);
      const ilyaEl = app.querySelector('#s3-ilya');
      if (ilyaEl) setTimeout(() => self._placeIlya(ilyaEl), 30);
      self.bind(app);
    });

    addListener(app.querySelector('#s3-reset'), 'click', () => {
      s3Route = ['RIO'];
      s3Total = 0;
      clearListeners();
      self._updateMap(app);
      const ilyaEl = app.querySelector('#s3-ilya');
      if (ilyaEl) setTimeout(() => self._placeIlya(ilyaEl), 30);
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
