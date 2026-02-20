// ── Scene 1 — Sailboat Navigation (Canvas) ──────
const s1 = {
  id: 's1',
  _canvas: null,
  _ctx: null,
  _raf: null,
  _t: 0,
  _dragging: false,
  _sailDeg: 180,
  _animating: false,
  _ilya2Img: null,
  _boatX: 0,

  render(app) {
    const leg = gameState.sceneData.s1.leg;
    if (leg === 0) {
      gameState.sceneData.s1.windDeg = Math.floor(Math.random() * 360);
    }
    this._sailDeg = 180;
    this._animating = false;
    this._t = 0;
    this._boatX = -120;

    const narratives = [
      'You depart the St. Lawrence — a pine-scented coast at your back, a hand-drawn map in your pocket.',
      'The Atlantic opens wide. Nothing but water and sky. Trim your sail and trust the wind.',
      'The beaches of Brazil shimmer ahead. One perfect trim and you\'re there.'
    ];

    app.innerHTML = `
      <canvas id="s1-canvas" style="width:100%;border-radius:12px;display:block;touch-action:none;cursor:grab"></canvas>
      <p class="narrative" style="margin-top:0.5rem;font-size:0.88rem">${narratives[Math.min(leg, 2)]}</p>
      <div style="display:flex;align-items:center;justify-content:space-between;width:100%;padding:0 0.25rem;margin-top:0.25rem">
        <div class="progress-text">Leg ${leg + 1} / 3</div>
        <button class="primary" id="btn-trim">Trim Sail ⛵</button>
      </div>
      <div class="feedback" id="feedback">Drag the sail tip to catch the wind</div>
    `;

    if (!this._ilya2Img) {
      const img = new Image();
      img.src = 'pics/ILYA2_NOBG.png';
      this._ilya2Img = img;
    }

    const canvas = app.querySelector('#s1-canvas');
    canvas.width = 400;
    canvas.height = 300;
    this._canvas = canvas;
    this._ctx = canvas.getContext('2d');
    this._startLoop();
  },

  bind(app) {
    const canvas = this._canvas;
    if (!canvas) return;
    const W = canvas.width, H = canvas.height;

    const getAngle = (clientX, clientY) => {
      const bx = W / 2 + this._boatX;
      const cy = Math.round(H * (gameState.sceneData.s1.leg === 2 ? 0.5 : 0.62));
      const rect = canvas.getBoundingClientRect();
      const scaleX = W / rect.width;
      const scaleY = H / rect.height;
      const dx = (clientX - rect.left) * scaleX - bx;
      const dy = (clientY - rect.top) * scaleY - cy;
      return (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;
    };

    addListener(canvas, 'mousedown', () => {
      this._dragging = true;
      canvas.style.cursor = 'grabbing';
    });
    addListener(window, 'mousemove', e => {
      if (this._dragging) this._sailDeg = getAngle(e.clientX, e.clientY);
    });
    addListener(window, 'mouseup', () => {
      this._dragging = false;
      canvas.style.cursor = 'grab';
    });
    addListener(canvas, 'touchstart', e => {
      e.preventDefault();
      this._dragging = true;
      this._sailDeg = getAngle(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: false });
    addListener(canvas, 'touchmove', e => {
      e.preventDefault();
      if (this._dragging) this._sailDeg = getAngle(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: false });
    addListener(canvas, 'touchend', () => { this._dragging = false; });

    const feedback = app.querySelector('#feedback');
    addListener(app.querySelector('#btn-trim'), 'click', () => {
      if (this._animating) return;
      const windDeg = gameState.sceneData.s1.windDeg;
      // Accept either ±90° from the wind (port or starboard tack both valid)
      const cdiff = (a, b) => { const d = Math.abs(a - b); return Math.min(d, 360 - d); };
      const circularDiff = Math.min(
        cdiff(this._sailDeg, (windDeg + 90) % 360),
        cdiff(this._sailDeg, (windDeg + 270) % 360)
      );

      if (circularDiff <= 20) {
        this._animating = true;
        const leg = gameState.sceneData.s1.leg;
        feedback.className = 'feedback';
        feedback.textContent = leg === 2 ? '⚓ Perfect! Welcome to Brazil!' : '✓ The sail fills — onward!';
        setTimeout(() => {
          gameState.sceneData.s1.leg++;
          if (gameState.sceneData.s1.leg >= 3) {
            gameState.completed[0] = true;
            saveState();
            showScene(2);
          } else {
            gameState.sceneData.s1.windDeg = Math.floor(Math.random() * 360);
            showScene(1);
          }
        }, 1400);
      } else {
        feedback.className = 'feedback error';
        feedback.textContent = circularDiff <= 45
          ? 'Getting closer… adjust a little more.'
          : 'The sail luffs — try a different angle.';
      }
    });
  },

  _startLoop() {
    const loop = () => {
      if (!this._canvas) return;
      this._t++;
      this._boatX += 0.7;
      if (this._boatX > 130) this._boatX = -130;
      this._draw(this._ctx, this._canvas.width, this._canvas.height);
      this._raf = requestAnimationFrame(loop);
    };
    this._raf = requestAnimationFrame(loop);
  },

  _draw(ctx, W, H) {
    const leg = gameState.sceneData.s1.leg;
    const windDeg = gameState.sceneData.s1.windDeg;
    const t = this._t;

    // Background per leg
    if (leg === 0) {
      this._drawCanadianScene(ctx, W, H, t);
    } else if (leg === 1) {
      this._drawOcean(ctx, W, H, t);
    } else {
      this._drawBrazilianBeach(ctx, W, H, t);
    }

    // Wind lines — gray-tinted on white Canadian background, white on water
    this._drawWindLines(ctx, W, H, windDeg, t, leg);

    // Boat
    const cy = Math.round(H * (leg === 2 ? 0.5 : 0.62));
    this._drawBoat(ctx, W / 2 + this._boatX, cy, this._sailDeg, leg);

    // HUD
    ctx.fillStyle = 'rgba(0,0,0,0.38)';
    roundRect(ctx, 6, 6, 198, 26, 5);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Wind ${windDeg}°  |  Sail ${Math.round(this._sailDeg)}°`, 12, 23);
  },

  // ── Leg 0: Canadian forest + coast ─────────────
  _drawCanadianScene(ctx, W, H, t) {
    // Sky
    const sky = ctx.createLinearGradient(0, 0, 0, H * 0.32);
    sky.addColorStop(0, '#5a9ad8');
    sky.addColorStop(1, '#a0cce8');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H * 0.32);

    // Water (St. Lawrence — lower 40%)
    const water = ctx.createLinearGradient(0, H * 0.6, 0, H);
    water.addColorStop(0, '#2a6898');
    water.addColorStop(1, '#1a4870');
    ctx.fillStyle = water;
    ctx.fillRect(0, H * 0.6, W, H * 0.4);

    // Horizon shimmer
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, H * 0.6); ctx.lineTo(W, H * 0.6); ctx.stroke();

    // Gentle water ripples
    for (let row = 0; row < 3; row++) {
      const wy = H * 0.65 + row * 20;
      ctx.strokeStyle = `rgba(255,255,255,${0.1 + row * 0.06})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let x = 0; x <= W; x += 2) {
        const wY = wy + Math.sin(x / 30 + t / 35 + row) * 2;
        x === 0 ? ctx.moveTo(x, wY) : ctx.lineTo(x, wY);
      }
      ctx.stroke();
    }

    // Sandy shore strip
    const shore = ctx.createLinearGradient(0, H * 0.56, 0, H * 0.63);
    shore.addColorStop(0, '#c8a850');
    shore.addColorStop(1, '#b89040');
    ctx.fillStyle = shore;
    ctx.fillRect(0, H * 0.56, W, H * 0.07);

    // Forest floor / undergrowth
    ctx.fillStyle = '#2a4a1a';
    ctx.fillRect(0, H * 0.32, W, H * 0.27);

    // Back-row trees (lighter, smaller — depth)
    this._drawTreeRow(ctx, W, H * 0.32, H * 0.18, 22, '#3a6828', '#2a4e1e', 18);
    // Front-row trees (darker, taller)
    this._drawTreeRow(ctx, W, H * 0.32, H * 0.26, 16, '#2d5822', '#1e3e14', 26);

    // Canadian flag — top right
    this._drawMiniFlag(ctx, W - 78, 8, 70, 46, 'canada');
  },

  _drawTreeRow(ctx, W, baseY, height, count, lightCol, darkCol, spread) {
    const step = W / count;
    for (let i = 0; i < count; i++) {
      const x = i * step + (step * 0.3);
      const h = height * (0.75 + Math.sin(i * 1.7) * 0.25);
      const w = spread;

      // Main triangle
      ctx.fillStyle = lightCol;
      ctx.beginPath();
      ctx.moveTo(x, baseY + height);
      ctx.lineTo(x + w / 2, baseY + height - h);
      ctx.lineTo(x + w, baseY + height);
      ctx.closePath();
      ctx.fill();

      // Darker inner shadow
      ctx.fillStyle = darkCol;
      ctx.beginPath();
      ctx.moveTo(x + w * 0.25, baseY + height - h * 0.5);
      ctx.lineTo(x + w / 2, baseY + height - h);
      ctx.lineTo(x + w * 0.75, baseY + height - h * 0.5);
      ctx.closePath();
      ctx.fill();

      // Trunk
      ctx.fillStyle = '#4a2e10';
      ctx.fillRect(x + w / 2 - 2, baseY + height, 4, 10);
    }
  },

  // ── Leg 1: Open ocean ───────────────────────────
  _drawOcean(ctx, W, H, t) {
    const sky = ctx.createLinearGradient(0, 0, 0, H * 0.45);
    sky.addColorStop(0, '#4a7fc0');
    sky.addColorStop(1, '#8ac0e0');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H * 0.45);

    const water = ctx.createLinearGradient(0, H * 0.45, 0, H);
    water.addColorStop(0, '#1a7ab5');
    water.addColorStop(1, '#0a4070');
    ctx.fillStyle = water;
    ctx.fillRect(0, H * 0.45, W, H * 0.55);

    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, H * 0.45); ctx.lineTo(W, H * 0.45); ctx.stroke();

    for (let row = 0; row < 5; row++) {
      const wy = H * 0.5 + row * 24;
      ctx.strokeStyle = `rgba(255,255,255,${0.1 + row * 0.05})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let x = 0; x <= W; x += 2) {
        const wY = wy + Math.sin(x / 32 + t / 28 + row * 1.2) * 3;
        x === 0 ? ctx.moveTo(x, wY) : ctx.lineTo(x, wY);
      }
      ctx.stroke();
    }
  },

  // ── Leg 2: Brazilian beach ──────────────────────
  _drawBrazilianBeach(ctx, W, H, t) {
    // Tropical sky
    const sky = ctx.createLinearGradient(0, 0, 0, H * 0.35);
    sky.addColorStop(0, '#1a6fcc');
    sky.addColorStop(1, '#60b8e8');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H * 0.35);

    // Turquoise ocean
    const water = ctx.createLinearGradient(0, H * 0.35, 0, H * 0.62);
    water.addColorStop(0, '#08b8d8');
    water.addColorStop(1, '#0888b0');
    ctx.fillStyle = water;
    ctx.fillRect(0, H * 0.35, W, H * 0.27);

    // Water shimmer
    for (let row = 0; row < 4; row++) {
      const wy = H * 0.38 + row * 16;
      ctx.strokeStyle = `rgba(255,255,255,${0.12 + row * 0.05})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let x = 0; x <= W; x += 2) {
        const wY = wy + Math.sin(x / 28 + t / 22 + row * 1.5) * 3;
        x === 0 ? ctx.moveTo(x, wY) : ctx.lineTo(x, wY);
      }
      ctx.stroke();
    }

    // Beach sand
    const sand = ctx.createLinearGradient(0, H * 0.62, 0, H);
    sand.addColorStop(0, '#e8d888');
    sand.addColorStop(1, '#c8b060');
    ctx.fillStyle = sand;
    ctx.fillRect(0, H * 0.62, W, H * 0.38);

    // Wave foam at waterline
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    for (let x = 0; x <= W; x += 2) {
      const fy = H * 0.62 + Math.sin(x / 18 + t / 14) * 5;
      x === 0 ? ctx.moveTo(x, fy) : ctx.lineTo(x, fy);
    }
    ctx.lineTo(W, H * 0.62); ctx.lineTo(0, H * 0.62); ctx.closePath(); ctx.fill();

    // Palm tree (right side)
    this._drawPalmTree(ctx, W * 0.82, H * 0.62, H * 0.26, t);

    // Brazilian flag on beach (left side)
    this._drawMiniFlag(ctx, W * 0.06, H * 0.67, 68, 45, 'brazil');
  },

  _drawPalmTree(ctx, x, baseY, height, t) {
    // Trunk
    ctx.strokeStyle = '#8b6030';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, baseY);
    ctx.quadraticCurveTo(x - 8, baseY - height * 0.5, x - 18, baseY - height);
    ctx.stroke();

    // Fronds
    const topX = x - 18, topY = baseY - height;
    const frondAngles = [-1.1, -0.5, 0.1, 0.7, 1.3, 1.9, 2.5];
    frondAngles.forEach((angle, i) => {
      const sway = Math.sin(t / 40 + i) * 0.08;
      const len = height * (0.32 + (i % 2) * 0.06);
      ctx.strokeStyle = i % 2 === 0 ? '#2d7a20' : '#3a9228';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(topX, topY);
      ctx.quadraticCurveTo(
        topX + Math.cos(angle + sway) * len * 0.5,
        topY + Math.sin(angle + sway) * len * 0.4 - 8,
        topX + Math.cos(angle + sway) * len,
        topY + Math.sin(angle + sway) * len
      );
      ctx.stroke();
    });

    // Coconuts
    ctx.fillStyle = '#8b6020';
    ctx.beginPath(); ctx.arc(topX + 4, topY + 6, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(topX - 3, topY + 9, 3.5, 0, Math.PI * 2); ctx.fill();
  },

  // ── Flag helper (canada | brazil) ──────────────
  _drawMiniFlag(ctx, x, y, w, h, type) {
    ctx.save();
    // Border/shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    roundRect(ctx, x + 2, y + 2, w, h, 3);
    ctx.fill();

    if (type === 'canada') {
      ctx.fillStyle = '#FFFFFF';
      roundRect(ctx, x, y, w, h, 3); ctx.fill();
      ctx.fillStyle = '#FF0000';
      ctx.fillRect(x, y, w * 0.25, h);
      ctx.fillRect(x + w * 0.75, y, w * 0.25, h);
      // Maple leaf
      this._drawMapleLeaf(ctx, x + w / 2, y + h / 2, h * 0.34);
    } else {
      // Brazil
      ctx.fillStyle = '#009C3B';
      roundRect(ctx, x, y, w, h, 3); ctx.fill();
      ctx.fillStyle = '#FFDF00';
      ctx.beginPath();
      ctx.moveTo(x + w / 2, y + 3);
      ctx.lineTo(x + w - 4, y + h / 2);
      ctx.lineTo(x + w / 2, y + h - 3);
      ctx.lineTo(x + 4, y + h / 2);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#002776';
      ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, h * 0.22, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x + w / 2, y + h / 2 + 2, h * 0.17, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
    }

    // Flag pole
    ctx.strokeStyle = '#8b6030';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x - 1, y - 2); ctx.lineTo(x - 1, y + h + 10); ctx.stroke();

    ctx.restore();
  },

  _drawMapleLeaf(ctx, x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(s * 0.18, -s * 0.5);
    ctx.lineTo(s * 0.52, -s * 0.6);
    ctx.lineTo(s * 0.3, -s * 0.22);
    ctx.lineTo(s * 0.82, s * 0.08);
    ctx.lineTo(s * 0.42, s * 0.08);
    ctx.lineTo(s * 0.25, s * 0.5);
    ctx.lineTo(s * 0.1, s * 0.3);
    ctx.lineTo(0, s * 0.65);
    ctx.lineTo(-s * 0.1, s * 0.3);
    ctx.lineTo(-s * 0.25, s * 0.5);
    ctx.lineTo(-s * 0.42, s * 0.08);
    ctx.lineTo(-s * 0.82, s * 0.08);
    ctx.lineTo(-s * 0.3, -s * 0.22);
    ctx.lineTo(-s * 0.52, -s * 0.6);
    ctx.lineTo(-s * 0.18, -s * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(-s * 0.07, s * 0.65, s * 0.14, s * 0.38);
    ctx.restore();
  },

  // ── Wind lines ──────────────────────────────────
  // leg 0: blue-gray (contrast against white/green)
  // leg 1+: white (contrast against blue water)
  _drawWindLines(ctx, W, H, windDeg, t, leg) {
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.rotate((windDeg + 90) * Math.PI / 180);

    const D = 230;
    const yOffsets = [-65, -22, 22, 65];
    const speed = 1.5;
    const markerPeriod = 88;
    // On Canadian scene (leg 0) use blue-gray so they stand out against white/green
    const rgb = leg === 0 ? '100,130,200' : '255,255,255';

    yOffsets.forEach((yOff, i) => {
      const wavePhase = t * 0.05 + i * 1.1;
      const alpha = 0.55 + 0.2 * Math.sin(t * 0.022 + i * 0.7);
      ctx.strokeStyle = `rgba(${rgb},${alpha.toFixed(2)})`;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';

      ctx.beginPath();
      let first = true;
      for (let x = -D; x <= D; x += 3) {
        const y = yOff + Math.sin(x * 0.07 + wavePhase) * 6;
        first ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        first = false;
      }
      ctx.stroke();

      const baseOffset = (t * speed + i * 22) % markerPeriod;
      for (let base = -D + 10; base < D - 10; base += markerPeriod) {
        const px = base + baseOffset;
        if (px < -D + 8 || px > D - 8) continue;
        const py = yOff + Math.sin(px * 0.07 + wavePhase) * 6;
        ctx.save();
        ctx.translate(px, py);
        ctx.strokeStyle = `rgba(${rgb},${Math.min(1, alpha * 1.4).toFixed(2)})`;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(-7, -5); ctx.lineTo(0, 0); ctx.lineTo(-7, 5);
        ctx.stroke();
        ctx.restore();
      }
    });

    ctx.restore();
  },

  // ── Boat ────────────────────────────────────────
  _drawBoat(ctx, cx, cy, sailDeg, leg) {
    ctx.save();
    ctx.translate(cx, cy);

    // Wake (only on water)
    if (leg > 0) {
      for (let i = 0; i < 3; i++) {
        ctx.strokeStyle = `rgba(255,255,255,${0.25 - i * 0.06})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        const wy = 34 + i * 18;
        ctx.moveTo(-10 + i * 3, wy);
        ctx.quadraticCurveTo(0, wy + 10, 10 - i * 3, wy);
        ctx.stroke();
      }
    }

    // Hull shadow
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath(); ctx.ellipse(3, 4, 18, 38, 0, 0, Math.PI * 2); ctx.fill();

    // Hull
    const hullGrad = ctx.createLinearGradient(-18, 0, 18, 0);
    hullGrad.addColorStop(0, '#231508');
    hullGrad.addColorStop(0.4, '#4a2e10');
    hullGrad.addColorStop(1, '#321b06');
    ctx.fillStyle = hullGrad;
    ctx.strokeStyle = '#180e04';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(0, 0, 18, 38, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    // Hull sheen
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.beginPath(); ctx.ellipse(-5, -8, 6, 18, -0.3, 0, Math.PI * 2); ctx.fill();

    // Ilya on the boat
    const img = this._ilya2Img;
    if (img && img.complete && img.naturalHeight > 0) {
      const iH = 38;
      const iW = img.naturalWidth * (iH / img.naturalHeight);
      ctx.drawImage(img, -iW / 2, -iH / 2, iW, iH);
    }

    // Mast dot
    ctx.fillStyle = '#b07040';
    ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();

    // Work in a rotated frame so x-axis = boom direction
    const sailRad = (sailDeg - 90) * Math.PI / 180;
    const boomLen = 52;

    ctx.save();
    ctx.rotate(sailRad);

    // Sail: rectangle on one side of boom.
    // Flip side so it always billows away from the hull centre.
    const sFlip = (sailDeg % 360 > 180) ? 1 : -1;
    const sStart = 6, sEnd = boomLen - 4, sH = 14 * sFlip;
    const sailGrad = ctx.createLinearGradient(sStart, 0, sEnd, 0);
    sailGrad.addColorStop(0,   'rgba(255,252,235,0.25)');
    sailGrad.addColorStop(0.2, 'rgba(255,248,220,0.92)');
    sailGrad.addColorStop(0.8, 'rgba(255,248,220,0.92)');
    sailGrad.addColorStop(1,   'rgba(215,195,145,0.25)');
    ctx.fillStyle = sailGrad;
    ctx.strokeStyle = 'rgba(140,100,50,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sStart, 0);
    ctx.lineTo(sEnd, 0);
    ctx.lineTo(sEnd, sH);
    // Slightly curved outer edge
    ctx.quadraticCurveTo((sStart + sEnd) / 2, sH + 5 * sFlip, sStart, sH);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Boom drawn over sail
    ctx.strokeStyle = '#5a3810'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(boomLen, 0); ctx.stroke();

    ctx.restore();

    // Drag handle at boom tip (back in original space)
    const boomX = Math.cos(sailRad) * boomLen;
    const boomY = Math.sin(sailRad) * boomLen;
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.strokeStyle = 'rgba(200,160,80,0.8)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(boomX, boomY, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    ctx.restore();
  },

  cleanup() {
    if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null; }
    this._canvas = null;
    this._ctx = null;
    this._dragging = false;
  }
};
