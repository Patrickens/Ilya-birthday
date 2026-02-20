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

  render(app) {
    const leg = gameState.sceneData.s1.leg;
    if (leg === 0) {
      gameState.sceneData.s1.windDeg = Math.floor(Math.random() * 360);
    }
    this._sailDeg = 180;
    this._animating = false;
    this._t = 0;

    const narratives = [
      'You depart Montréal — an old hand-drawn map in your pocket. The wind doesn\'t care about your itinerary.',
      'The Atlantic opens wide. Nothing but water and sky. Trim your sail and trust the wind.',
      'A green smudge on the horizon — Brazil. One perfect trim and you\'re there.'
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
    const cx = W / 2, cy = Math.round(H * 0.6);

    const getAngle = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = W / rect.width;
      const scaleY = H / rect.height;
      const dx = (clientX - rect.left) * scaleX - cx;
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
      const optimal = (windDeg + 90) % 360;
      const diff = Math.abs(this._sailDeg - optimal);
      const circularDiff = Math.min(diff, 360 - diff);

      if (circularDiff <= 20) {
        this._animating = true;
        const leg = gameState.sceneData.s1.leg;
        feedback.className = 'feedback';
        feedback.textContent = leg === 2 ? '⚓ Perfect! Brazil in sight!' : '✓ The sail fills — onward!';
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
      this._draw(this._ctx, this._canvas.width, this._canvas.height);
      this._raf = requestAnimationFrame(loop);
    };
    this._raf = requestAnimationFrame(loop);
  },

  _draw(ctx, W, H) {
    const leg = gameState.sceneData.s1.leg;
    const windDeg = gameState.sceneData.s1.windDeg;
    const t = this._t;
    const cx = W / 2, cy = Math.round(H * 0.6);

    if (leg === 0) {
      this._drawCanadianFlag(ctx, W, H);
    } else {
      this._drawOcean(ctx, W, H, t, leg);
    }

    this._drawWindLines(ctx, W, H, windDeg, t);
    this._drawBoat(ctx, cx, cy, this._sailDeg, leg);

    // HUD
    ctx.fillStyle = 'rgba(0,0,0,0.38)';
    roundRect(ctx, 6, 6, 198, 26, 5);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Wind ${windDeg}°  |  Sail ${Math.round(this._sailDeg)}°`, 12, 23);
  },

  _drawCanadianFlag(ctx, W, H) {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(0, 0, W * 0.25, H);
    ctx.fillRect(W * 0.75, 0, W * 0.25, H);
    this._drawMapleLeaf(ctx, W / 2, H / 2, 52);
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

  _drawOcean(ctx, W, H, t, leg) {
    const sky = ctx.createLinearGradient(0, 0, 0, H * 0.45);
    if (leg >= 2) {
      sky.addColorStop(0, '#2a6db5');
      sky.addColorStop(1, '#7ac8e8');
    } else {
      sky.addColorStop(0, '#4a7fc0');
      sky.addColorStop(1, '#8ac0e0');
    }
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H * 0.45);

    const water = ctx.createLinearGradient(0, H * 0.45, 0, H);
    water.addColorStop(0, '#1a7ab5');
    water.addColorStop(1, '#0a4070');
    ctx.fillStyle = water;
    ctx.fillRect(0, H * 0.45, W, H * 0.55);

    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, H * 0.45);
    ctx.lineTo(W, H * 0.45);
    ctx.stroke();

    for (let row = 0; row < 5; row++) {
      const wy = H * 0.5 + row * 24;
      ctx.strokeStyle = `rgba(255,255,255,${0.12 + row * 0.06})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let x = 0; x <= W; x += 2) {
        const waveY = wy + Math.sin(x / 32 + t / 28 + row * 1.2) * 3;
        x === 0 ? ctx.moveTo(x, waveY) : ctx.lineTo(x, waveY);
      }
      ctx.stroke();
    }

    if (leg === 2) {
      const coastGrad = ctx.createLinearGradient(W * 0.6, 0, W, 0);
      coastGrad.addColorStop(0, 'rgba(30,100,40,0)');
      coastGrad.addColorStop(1, 'rgba(40,120,55,0.35)');
      ctx.fillStyle = coastGrad;
      ctx.fillRect(W * 0.6, H * 0.3, W * 0.4, H * 0.2);
      this._drawBrazilianFlag(ctx, W - 70, 8, 62, 41);
    }
  },

  _drawBrazilianFlag(ctx, x, y, w, h) {
    ctx.save();
    ctx.fillStyle = '#009C3B';
    roundRect(ctx, x, y, w, h, 3);
    ctx.fill();
    ctx.fillStyle = '#FFDF00';
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y + 3);
    ctx.lineTo(x + w - 4, y + h / 2);
    ctx.lineTo(x + w / 2, y + h - 3);
    ctx.lineTo(x + 4, y + h / 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#002776';
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2, h * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2 + 2, h * 0.17, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
    ctx.restore();
  },

  _drawWindLines(ctx, W, H, windDeg, t) {
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.rotate((windDeg + 180) * Math.PI / 180);

    const D = 230;
    const yOffsets = [-65, -22, 22, 65];
    const speed = 1.5;
    const markerPeriod = 88;

    yOffsets.forEach((yOff, i) => {
      const wavePhase = t * 0.05 + i * 1.1;
      const alpha = 0.5 + 0.18 * Math.sin(t * 0.022 + i * 0.7);
      ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
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
        ctx.strokeStyle = `rgba(255,255,255,${Math.min(1, alpha * 1.4).toFixed(2)})`;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(-7, -5); ctx.lineTo(0, 0); ctx.lineTo(-7, 5);
        ctx.stroke();
        ctx.restore();
      }
    });

    ctx.restore();
  },

  _drawBoat(ctx, cx, cy, sailDeg, leg) {
    ctx.save();
    ctx.translate(cx, cy);

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

    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath();
    ctx.ellipse(3, 4, 18, 38, 0, 0, Math.PI * 2);
    ctx.fill();

    const hullGrad = ctx.createLinearGradient(-18, 0, 18, 0);
    hullGrad.addColorStop(0, '#231508');
    hullGrad.addColorStop(0.4, '#4a2e10');
    hullGrad.addColorStop(1, '#321b06');
    ctx.fillStyle = hullGrad;
    ctx.strokeStyle = '#180e04';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, 38, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.beginPath();
    ctx.ellipse(-5, -8, 6, 18, -0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#9a6030';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, -42); ctx.lineTo(0, 8);
    ctx.stroke();

    ctx.fillStyle = '#b07040';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    const sailRad = (sailDeg - 90) * Math.PI / 180;
    const boomLen = 50;
    const boomX = Math.cos(sailRad) * boomLen;
    const boomY = Math.sin(sailRad) * boomLen;
    const mastTop = -38;

    const sailGrad = ctx.createLinearGradient(0, mastTop, boomX, boomY);
    sailGrad.addColorStop(0, 'rgba(255,250,230,0.96)');
    sailGrad.addColorStop(1, 'rgba(215,195,155,0.88)');
    ctx.fillStyle = sailGrad;
    ctx.strokeStyle = 'rgba(130,90,40,0.65)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, mastTop);
    ctx.lineTo(boomX, boomY);
    ctx.lineTo(0, 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#7a5020';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(boomX, boomY);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.strokeStyle = 'rgba(200,160,80,0.8)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(boomX, boomY, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  },

  cleanup() {
    if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null; }
    this._canvas = null;
    this._ctx = null;
    this._dragging = false;
  }
};
