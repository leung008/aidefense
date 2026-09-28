// ============================================================
// CYBER DICE DEFENSE - Tower Defense + Random Dice Merge
// ============================================================

(() => {
  'use strict';

  // -------------------- CONFIG --------------------
  const CONFIG = {
    SUMMON_COST: 50,
    START_GOLD: 300,
    START_LIVES: 20,
    TOWER_RANGE_BASE: 90,
    TOWER_DAMAGE_BASE: 12,
    TOWER_FIRE_RATE_BASE: 1.0, // shots per second
    ENEMY_SPEED_BASE: 55,
    ENEMY_HP_BASE: 40,
    MERGE_MAX_LEVEL: 6,
    PATH_WIDTH: 36,
    GRID_SIZE: 40,
  };

  // Tower types - cyberpunk themed
  const TOWER_TYPES = {
    plasma: {
      name: 'Plasma',
      color: '#00f0ff',
      colorDim: '#0088aa',
      damageMult: 1.0,
      rangeMult: 1.0,
      rateMult: 1.2,
      projectileSpeed: 320,
      aoe: false,
    },
    missile: {
      name: 'Missile',
      color: '#ff00aa',
      colorDim: '#aa0066',
      damageMult: 1.6,
      rangeMult: 1.15,
      rateMult: 0.6,
      projectileSpeed: 220,
      aoe: true,
      aoeRadius: 45,
    },
    laser: {
      name: 'Laser',
      color: '#f0ff00',
      colorDim: '#aaaa00',
      damageMult: 0.7,
      rangeMult: 1.3,
      rateMult: 2.0,
      projectileSpeed: 500,
      aoe: false,
    },
  };
  const TYPE_KEYS = Object.keys(TOWER_TYPES);

  // Evolution options at Level 5 (base type -> 2 powerful forms)
  const EVOLUTIONS = {
    plasma: [
      {
        key: 'dual',
        name: 'DUAL PLASMA',
        detail: 'Fires 2 parallel shots',
        color: '#00f0ff',
        damageMult: 1.15,
        rateMult: 1.1,
        rangeMult: 1.05,
        multiShot: 2,
        spread: 0.12,
      },
      {
        key: 'pierce',
        name: 'PIERCE PLASMA',
        detail: 'Shots pierce through viruses',
        color: '#66ffff',
        damageMult: 1.35,
        rateMult: 0.95,
        rangeMult: 1.2,
        pierce: true,
      },
    ],
    missile: [
      {
        key: 'cluster',
        name: 'CLUSTER MISSILE',
        detail: 'Bigger AOE blast radius',
        color: '#ff44cc',
        damageMult: 1.4,
        rateMult: 0.9,
        rangeMult: 1.1,
        aoeBoost: 1.6,
      },
      {
        key: 'swarm',
        name: 'SWARM MISSILE',
        detail: 'Launches 3 mini-missiles',
        color: '#ff88aa',
        damageMult: 0.85,
        rateMult: 0.85,
        rangeMult: 1.15,
        multiShot: 3,
        spread: 0.22,
        aoeBoost: 0.7,
      },
    ],
    laser: [
      {
        key: 'beam',
        name: 'HEAVY BEAM',
        detail: 'Thicker high-damage laser',
        color: '#ffff66',
        damageMult: 2.2,
        rateMult: 0.7,
        rangeMult: 1.25,
        heavy: true,
      },
      {
        key: 'spread',
        name: 'SPREAD LASER',
        detail: 'Fires 3 angled beams',
        color: '#ffee44',
        damageMult: 0.9,
        rateMult: 1.15,
        rangeMult: 1.1,
        multiShot: 3,
        spread: 0.28,
      },
    ],
  };

  // -------------------- STATE --------------------
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  let W, H;

  const state = {
    gold: CONFIG.START_GOLD,
    lives: CONFIG.START_LIVES,
    score: 0,
    wave: 0,
    running: false,
    gameOver: false,
    selectedTower: null,
    evoTarget: null, // tower waiting for evolution choice
    // Drag-to-merge state
    draggingTower: null,
    dragOffsetX: 0,
    dragOffsetY: 0,
    dragX: 0,
    dragY: 0,
    path: [],
    placementSpots: [],
    towers: [],
    enemies: [],
    projectiles: [],
    particles: [],
    floatingTexts: [],
    waveEnemiesLeft: 0,
    waveActive: false,
    lastTime: 0,
    spawnTimer: 0,
    spawnInterval: 1.2,
    currentWaveData: null,
  };

  // -------------------- PATH GENERATION --------------------
  function generatePath() {
    // Generate a winding cyber path through the map
    const margin = 60;
    const pts = [];
    const segments = 8;
    let x = margin;
    let y = H * 0.5;

    pts.push({ x, y });

    // Start from left, snake to right
    const dx = (W - margin * 2) / segments;
    for (let i = 1; i <= segments; i++) {
      x = margin + dx * i;
      // Alternate up/down with some variation
      const amp = H * 0.28;
      const phase = i % 2 === 0 ? 1 : -1;
      y = H * 0.5 + phase * amp * (0.6 + Math.sin(i * 1.3) * 0.4);
      y = Math.max(margin + 20, Math.min(H - margin - 20, y));
      pts.push({ x, y });
    }

    // Smooth the path a bit by adding mid points
    const smooth = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      smooth.push(a);
      // intermediate
      smooth.push({
        x: (a.x + b.x) / 2,
        y: (a.y + b.y) / 2 + (Math.random() - 0.5) * 15,
      });
    }
    smooth.push(pts[pts.length - 1]);
    state.path = smooth;
  }

  function generatePlacementSpots() {
    // Sample points along path and offset perpendicular to create valid tower slots
    const spots = [];
    const step = 28;
    const offsets = [55, 75, -55, -75];

    for (let i = 0; i < state.path.length - 1; i++) {
      const a = state.path[i];
      const b = state.path[i + 1];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len; // perpendicular
      const ny = dx / len;
      const dist = len;
      const count = Math.max(1, Math.floor(dist / step));

      for (let s = 0; s < count; s++) {
        const t = (s + 0.5) / count;
        const px = a.x + dx * t;
        const py = a.y + dy * t;

        for (const off of offsets) {
          const sx = px + nx * off;
          const sy = py + ny * off;
          // keep inside canvas with margin
          if (sx > 40 && sx < W - 40 && sy > 50 && sy < H - 40) {
            // avoid duplicates
            const tooClose = spots.some(sp => Math.hypot(sp.x - sx, sp.y - sy) < 32);
            if (!tooClose) {
              spots.push({ x: sx, y: sy, occupied: false });
            }
          }
        }
      }
    }
    // shuffle for randomness feeling
    for (let i = spots.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [spots[i], spots[j]] = [spots[j], spots[i]];
    }
    state.placementSpots = spots;
  }

  // -------------------- UTILS --------------------
  function dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function randomType() {
    return TYPE_KEYS[Math.floor(Math.random() * TYPE_KEYS.length)];
  }

  function getTowerStats(type, level) {
    const t = TOWER_TYPES[type];
    const lvl = level;
    return {
      damage: CONFIG.TOWER_DAMAGE_BASE * t.damageMult * (1 + (lvl - 1) * 0.75),
      range: CONFIG.TOWER_RANGE_BASE * t.rangeMult * (1 + (lvl - 1) * 0.12),
      fireRate: CONFIG.TOWER_FIRE_RATE_BASE * t.rateMult * (1 + (lvl - 1) * 0.15),
      color: t.color,
      colorDim: t.colorDim,
      aoe: t.aoe,
      aoeRadius: t.aoe ? t.aoeRadius * (1 + (lvl - 1) * 0.1) : 0,
      projectileSpeed: t.projectileSpeed,
      name: t.name,
    };
  }

  // -------------------- ENTITIES --------------------
  class Tower {
    constructor(x, y, type, level = 1) {
      this.x = x;
      this.y = y;
      this.type = type;
      this.level = level;
      this.cooldown = 0;
      this.angle = 0;
      this.target = null;
      this.pulse = Math.random() * Math.PI * 2;
      this.id = Math.random().toString(36).slice(2);
      this.selected = false;
      this.mergeHighlight = false;
      this.evolved = false;   // true after choosing evolution
      this.evoData = null;    // the chosen EVOLUTIONS entry
    }

    get stats() {
      const base = getTowerStats(this.type, this.level);
      if (!this.evolved || !this.evoData) return base;
      const e = this.evoData;
      return {
        damage: base.damage * (e.damageMult || 1),
        range: base.range * (e.rangeMult || 1),
        fireRate: base.fireRate * (e.rateMult || 1),
        color: e.color || base.color,
        colorDim: base.colorDim,
        aoe: base.aoe || !!e.aoeBoost,
        aoeRadius: (base.aoeRadius || 40) * (e.aoeBoost || 1),
        projectileSpeed: base.projectileSpeed,
        name: e.name || base.name,
        multiShot: e.multiShot || 1,
        spread: e.spread || 0,
        pierce: !!e.pierce,
        heavy: !!e.heavy,
      };
    }

    update(dt) {
      this.pulse += dt * 3;
      this.cooldown = Math.max(0, this.cooldown - dt);

      // Find target
      this.target = null;
      let best = Infinity;
      for (const e of state.enemies) {
        if (e.hp <= 0) continue;
        const d = dist(this, e);
        if (d <= this.stats.range && d < best) {
          best = d;
          this.target = e;
        }
      }

      if (this.target) {
        this.angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
        if (this.cooldown <= 0) {
          this.fire();
          this.cooldown = 1 / this.stats.fireRate;
        }
      }
    }

    fire() {
      const s = this.stats;
      const count = s.multiShot || 1;
      const spread = s.spread || 0;
      for (let i = 0; i < count; i++) {
        const offset = count === 1 ? 0 : (i - (count - 1) / 2) * spread;
        state.projectiles.push(new Projectile(
          this.x, this.y,
          this.target,
          s.damage,
          s.projectileSpeed,
          this.type,
          s.aoe,
          s.aoeRadius,
          s.color,
          offset,
          s.pierce,
          s.heavy
        ));
      }
    }

    draw(ctx, overrideX, overrideY) {
      const s = this.stats;
      const lvl = this.level;
      const size = 12 + lvl * 3.5;
      const glow = 0.45 + Math.sin(this.pulse) * 0.35;
      const dx = overrideX !== undefined ? overrideX : this.x;
      const dy = overrideY !== undefined ? overrideY : this.y;
      const isDrag = overrideX !== undefined;
      const isHL = this.selected || this.mergeHighlight;

      // Shadow (2.5D)
      ctx.save();
      ctx.fillStyle = isDrag ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.45)';
      ctx.beginPath();
      ctx.ellipse(dx + 4, dy + 6, size * 0.95, size * 0.42, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.translate(dx, dy);

      // Outer glow — stronger at higher levels
      const glowR = size * (1.8 + lvl * 0.25);
      const g = ctx.createRadialGradient(0, 0, size * 0.2, 0, 0, glowR);
      g.addColorStop(0, s.color + (isDrag ? '88' : '55'));
      g.addColorStop(0.45, s.color + '22');
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, glowR, 0, Math.PI * 2);
      ctx.fill();

      ctx.rotate(this.angle);
      const bodyColor = isHL || isDrag ? '#ffffff' : s.color;

      ctx.fillStyle = 'rgba(8,12,28,0.92)';
      ctx.strokeStyle = bodyColor;
      ctx.lineWidth = 1.8 + lvl * 0.35;
      ctx.shadowColor = bodyColor;
      ctx.shadowBlur = (10 + lvl * 2) * glow;

      // === LEVEL-BASED CHASSIS SHAPES ===
      if (lvl === 1) {
        // Simple hex
        this._drawPoly(ctx, 6, size, 0.7);
      } else if (lvl === 2) {
        // Hex + inner diamond
        this._drawPoly(ctx, 6, size, 0.7);
        ctx.lineWidth = 1.5;
        this._drawPoly(ctx, 4, size * 0.55, 0.85);
      } else if (lvl === 3) {
        // Octagon with side fins
        this._drawPoly(ctx, 8, size, 0.72);
        ctx.beginPath();
        ctx.moveTo(size * 0.7, -size * 0.25);
        ctx.lineTo(size * 1.05, 0);
        ctx.lineTo(size * 0.7, size * 0.25);
        ctx.closePath();
        ctx.stroke();
      } else if (lvl === 4) {
        // Star-like with outer ring
        this._drawPoly(ctx, 6, size, 0.7);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.85, 0, Math.PI * 2);
        ctx.stroke();
        // Spikes
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * size * 0.9, Math.sin(a) * size * 0.65);
          ctx.lineTo(Math.cos(a) * size * 1.25, Math.sin(a) * size * 0.9);
          ctx.stroke();
        }
      } else if (lvl === 5) {
        // Dual ring + cross
        this._drawPoly(ctx, 6, size, 0.68);
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.75, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, size * 1.05, 0, Math.PI * 2);
        ctx.stroke();
        // Cross bars
        ctx.beginPath();
        ctx.moveTo(-size * 1.1, 0); ctx.lineTo(size * 1.1, 0);
        ctx.moveTo(0, -size * 0.85); ctx.lineTo(0, size * 0.85);
        ctx.stroke();
      } else {
        // Level 6+ : complex fortress look
        this._drawPoly(ctx, 8, size, 0.7);
        ctx.lineWidth = 1.5;
        this._drawPoly(ctx, 4, size * 0.6, 0.9);
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.95, 0, Math.PI * 2);
        ctx.stroke();
        // Corner nodes
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
          ctx.beginPath();
          ctx.arc(Math.cos(a) * size * 1.15, Math.sin(a) * size * 0.85, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
      }

      // Core energy — grows with level
      ctx.shadowBlur = 10 + lvl * 2;
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.arc(0, 0, 3.5 + lvl * 1.1, 0, Math.PI * 2);
      ctx.fill();
      // Inner white core for high levels
      if (lvl >= 3) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 1.5 + lvl * 0.3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Barrel / emitter — longer & thicker at higher levels
      const barrelLen = size * (0.55 + lvl * 0.08);
      const barrelW = 2.5 + lvl * 0.6;
      ctx.fillStyle = bodyColor;
      ctx.shadowBlur = 6;
      ctx.fillRect(size * 0.35, -barrelW / 2, barrelLen, barrelW);
      if (lvl >= 3) {
        // Extra side emitters
        ctx.fillRect(size * 0.3, -barrelW * 1.8, barrelLen * 0.6, barrelW * 0.6);
        ctx.fillRect(size * 0.3, barrelW * 1.2, barrelLen * 0.6, barrelW * 0.6);
      }

      // Level / EVO indicator
      ctx.shadowBlur = 0;
      ctx.fillStyle = this.evolved ? '#f0ff00' : '#fff';
      ctx.font = `bold ${9 + lvl}px Orbitron, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.evolved ? 'EVO' : String(lvl), 0, size * 0.72);

      ctx.restore();

      // Range ring when highlighted or dragging
      if (isHL || isDrag) {
        ctx.save();
        ctx.strokeStyle = s.color + (isDrag ? '66' : '44');
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 7]);
        ctx.beginPath();
        ctx.arc(dx, dy, s.range, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }
    }

    _drawPoly(ctx, sides, radius, yScale) {
      ctx.beginPath();
      for (let i = 0; i < sides; i++) {
        const a = (i / sides) * Math.PI * 2 - Math.PI / 2;
        const px = Math.cos(a) * radius;
        const py = Math.sin(a) * radius * yScale;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }

  class Enemy {
    constructor(wave, type = 'drone') {
      this.pathIndex = 0;
      this.progress = 0; // 0..1 along current segment
      this.x = state.path[0].x;
      this.y = state.path[0].y;
      this.type = type;
      this.wave = wave;

      const scale = 1 + (wave - 1) * 0.18;
      this.maxHp = CONFIG.ENEMY_HP_BASE * scale * (type === 'tank' ? 2.5 : type === 'fast' ? 0.7 : 1);
      this.hp = this.maxHp;
      this.speed = CONFIG.ENEMY_SPEED_BASE * (type === 'fast' ? 1.6 : type === 'tank' ? 0.55 : 1) * (1 + (wave - 1) * 0.04);
      this.radius = type === 'tank' ? 16 : type === 'fast' ? 9 : 12;
      this.color = type === 'tank' ? '#ff4444' : type === 'fast' ? '#44ffaa' : '#ff88ff';
      this.reward = Math.floor(8 + wave * 2.5 + (type === 'tank' ? 12 : 0));
      this.alive = true;
      this.hitFlash = 0;
      this.angle = 0;
    }

    update(dt) {
      if (!this.alive || this.hp <= 0) return;

      this.hitFlash = Math.max(0, this.hitFlash - dt * 4);

      // Move along path
      if (this.pathIndex >= state.path.length - 1) {
        // Reached end
        this.alive = false;
        state.lives--;
        spawnFloatingText(this.x, this.y, 'VIRUS BREACH', '#ff00aa');
        updateHUD();
        if (state.lives <= 0) endGame(false);
        return;
      }

      const a = state.path[this.pathIndex];
      const b = state.path[this.pathIndex + 1];
      const segLen = dist(a, b) || 1;
      this.progress += (this.speed * dt) / segLen;

      if (this.progress >= 1) {
        this.progress = 0;
        this.pathIndex++;
        if (this.pathIndex >= state.path.length - 1) {
          this.x = state.path[state.path.length - 1].x;
          this.y = state.path[state.path.length - 1].y;
          return;
        }
      }

      const na = state.path[this.pathIndex];
      const nb = state.path[this.pathIndex + 1];
      this.x = lerp(na.x, nb.x, this.progress);
      this.y = lerp(na.y, nb.y, this.progress);
      this.angle = Math.atan2(nb.y - na.y, nb.x - na.x);
    }

    takeDamage(amount) {
      this.hp -= amount;
      this.hitFlash = 1;
      if (this.hp <= 0) {
        this.alive = false;
        state.gold += this.reward;
        state.score += this.reward * 10;
        spawnParticles(this.x, this.y, this.color, 12);
        spawnFloatingText(this.x, this.y, `+${this.reward}¢`, '#00ff88');
        updateHUD();
      }
    }

    draw(ctx) {
      if (!this.alive) return;

      // Shadow
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath();
      ctx.ellipse(this.x + 3, this.y + 5, this.radius * 0.9, this.radius * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);

      const flash = this.hitFlash > 0;
      const col = flash ? '#ffffff' : this.color;

      // Glow
      const g = ctx.createRadialGradient(0, 0, 2, 0, 0, this.radius * 2);
      g.addColorStop(0, col + '88');
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius * 2, 0, Math.PI * 2);
      ctx.fill();

      // Body - angular cyber drone
      ctx.fillStyle = 'rgba(20,10,30,0.9)';
      ctx.strokeStyle = col;
      ctx.lineWidth = 2;
      ctx.shadowColor = col;
      ctx.shadowBlur = 10;

      ctx.beginPath();
      // diamond / arrow shape
      ctx.moveTo(this.radius, 0);
      ctx.lineTo(0, this.radius * 0.7);
      ctx.lineTo(-this.radius * 0.6, this.radius * 0.4);
      ctx.lineTo(-this.radius * 0.4, 0);
      ctx.lineTo(-this.radius * 0.6, -this.radius * 0.4);
      ctx.lineTo(0, -this.radius * 0.7);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Core eye
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(this.radius * 0.2, 0, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // HP bar
      if (this.hp < this.maxHp) {
        const barW = this.radius * 2.2;
        const ratio = Math.max(0, this.hp / this.maxHp);
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(this.x - barW / 2, this.y - this.radius - 10, barW, 4);
        ctx.fillStyle = ratio > 0.4 ? '#00ff88' : '#ff3366';
        ctx.fillRect(this.x - barW / 2, this.y - this.radius - 10, barW * ratio, 4);
      }
    }
  }

  class Projectile {
    constructor(x, y, target, damage, speed, type, aoe, aoeR, color, angleOffset = 0, pierce = false, heavy = false) {
      this.x = x;
      this.y = y;
      this.target = target;
      this.damage = damage;
      this.speed = speed;
      this.type = type;
      this.aoe = aoe;
      this.aoeRadius = aoeR;
      this.color = color;
      this.alive = true;
      this.trail = [];
      this.angleOffset = angleOffset;
      this.pierce = pierce;
      this.heavy = heavy;
      this.hitList = [];
      this.life = pierce ? 1.4 : 2.5;
      if (target) {
        const base = Math.atan2(target.y - y, target.x - x);
        this.dir = base + angleOffset;
      } else {
        this.dir = angleOffset;
      }
    }

    update(dt) {
      if (!this.alive) return;
      this.life -= dt;
      if (this.life <= 0) {
        this.alive = false;
        return;
      }

      if (!this.pierce && this.target && this.target.alive && this.target.hp > 0) {
        const desired = Math.atan2(this.target.y - this.y, this.target.x - this.x) + this.angleOffset;
        let diff = desired - this.dir;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        this.dir += diff * Math.min(1, dt * 8);
      }

      const vx = Math.cos(this.dir) * this.speed;
      const vy = Math.sin(this.dir) * this.speed;

      this.trail.push({ x: this.x, y: this.y });
      if (this.trail.length > 8) this.trail.shift();

      this.x += vx * dt;
      this.y += vy * dt;

      for (const e of state.enemies) {
        if (!e.alive || e.hp <= 0) continue;
        if (this.hitList.indexOf(e) >= 0) continue;
        if (dist(this, e) < 14 + (this.heavy ? 6 : 0)) {
          this.applyHit(e);
          if (!this.pierce) {
            this.alive = false;
            return;
          }
          this.hitList.push(e);
        }
      }
    }

    applyHit(e) {
      if (this.aoe) {
        for (const en of state.enemies) {
          if (en.alive && en.hp > 0 && dist(this, en) <= this.aoeRadius) {
            en.takeDamage(this.damage * (en === e ? 1 : 0.55));
          }
        }
        spawnParticles(this.x, this.y, this.color, this.heavy ? 22 : 14, this.aoeRadius * 0.55);
      } else {
        e.takeDamage(this.damage);
        spawnParticles(this.x, this.y, this.color, this.heavy ? 12 : 6);
      }
    }

    draw(ctx) {
      if (!this.alive) return;

      ctx.save();
      for (let i = 0; i < this.trail.length; i++) {
        const t = this.trail[i];
        const alpha = (i / this.trail.length) * 0.5;
        ctx.fillStyle = this.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
        ctx.beginPath();
        ctx.arc(t.x, t.y, (this.heavy ? 3 : 2) + i * 0.3, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.shadowColor = this.color;
      ctx.shadowBlur = this.heavy ? 18 : 12;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.heavy ? 6 : 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // -------------------- PARTICLES & FX --------------------
  function spawnParticles(x, y, color, count, spread = 30) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 80;
      state.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.4 + Math.random() * 0.5,
        maxLife: 0.6,
        color,
        size: 2 + Math.random() * 3,
      });
    }
  }

  function spawnFloatingText(x, y, text, color) {
    state.floatingTexts.push({
      x, y,
      text,
      color,
      life: 1.2,
      vy: -30,
    });
  }

  function updateParticles(dt) {
    for (let i = state.particles.length - 1; i >= 0; i--) {
      const p = state.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.life -= dt;
      if (p.life <= 0) state.particles.splice(i, 1);
    }
    for (let i = state.floatingTexts.length - 1; i >= 0; i--) {
      const f = state.floatingTexts[i];
      f.y += f.vy * dt;
      f.life -= dt;
      if (f.life <= 0) state.floatingTexts.splice(i, 1);
    }
  }

  function drawParticles(ctx) {
    for (const p of state.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color + Math.floor(alpha * 200).toString(16).padStart(2, '0');
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const f of state.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, f.life * 2);
      ctx.fillStyle = f.color;
      ctx.font = 'bold 14px Orbitron, sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = f.color;
      ctx.shadowBlur = 6;
      ctx.fillText(f.text, f.x, f.y);
      ctx.restore();
    }
  }

  // -------------------- WAVE SYSTEM --------------------
  function getWaveConfig(wave) {
    const count = 6 + wave * 3;
    const types = [];
    for (let i = 0; i < count; i++) {
      let t = 'drone';
      if (wave >= 3 && Math.random() < 0.15 + wave * 0.02) t = 'fast';
      if (wave >= 5 && Math.random() < 0.1 + wave * 0.015) t = 'tank';
      types.push(t);
    }
    return {
      enemies: types,
      spawnInterval: Math.max(0.45, 1.3 - wave * 0.06),
    };
  }

  function startWave() {
    if (state.waveActive || state.gameOver) return;
    state.wave++;
    state.currentWaveData = getWaveConfig(state.wave);
    state.waveEnemiesLeft = state.currentWaveData.enemies.length;
    state.waveActive = true;
    state.spawnTimer = 0.5;
    state.spawnInterval = state.currentWaveData.spawnInterval;
    updateHUD();
    document.getElementById('start-wave-btn').disabled = true;
  }

  function spawnEnemy() {
    if (!state.currentWaveData || state.currentWaveData.enemies.length === 0) return;
    const type = state.currentWaveData.enemies.shift();
    state.enemies.push(new Enemy(state.wave, type));
    state.waveEnemiesLeft = state.currentWaveData.enemies.length + state.enemies.filter(e => e.alive).length;
  }

  function checkWaveComplete() {
    if (!state.waveActive) return;
    const alive = state.enemies.some(e => e.alive);
    if (!alive && state.currentWaveData.enemies.length === 0) {
      state.waveActive = false;
      const bonus = 25 + state.wave * 5;
      state.gold += bonus;
      spawnFloatingText(W / 2, H / 2, `SWARM ${state.wave} PURGED +${bonus}¢`, '#00f0ff');
      updateHUD();
      document.getElementById('start-wave-btn').disabled = false;

      if (state.wave >= 20) {
        endGame(true);
        return;
      }

      // Auto-start next wave if checkbox is on
      const autoCheck = document.getElementById('auto-wave-check');
      if (autoCheck && autoCheck.checked) {
        setTimeout(() => {
          if (!state.gameOver && !state.waveActive) startWave();
        }, 1400);
      }
    }
  }

  // -------------------- SUMMON & MERGE --------------------
  function summonTower() {
    if (state.gold < CONFIG.SUMMON_COST || state.gameOver) return;

    const free = state.placementSpots.filter(s => !s.occupied);
    if (free.length === 0) {
      spawnFloatingText(W / 2, 80, 'NO SPACE', '#ff6600');
      return;
    }

    // Random free spot
    const spot = free[Math.floor(Math.random() * free.length)];
    const type = randomType();
    const tower = new Tower(spot.x, spot.y, type, 1);
    tower.spot = spot;
    spot.occupied = true;
    state.towers.push(tower);
    state.gold = Math.max(0, state.gold - CONFIG.SUMMON_COST);
    spawnParticles(spot.x, spot.y, TOWER_TYPES[type].color, 10);
    spawnFloatingText(spot.x, spot.y - 20, 'DEPLOYED', TOWER_TYPES[type].color);
    updateHUD();
  }

  function tryMerge(target, dragged) {
    // target stays, dragged is consumed
    if (!target || !dragged || target === dragged) return false;
    if (target.evolved || dragged.evolved) return false;
    if (target.type !== dragged.type || target.level !== dragged.level) return false;
    if (target.level >= CONFIG.MERGE_MAX_LEVEL) return false;

    const newLevel = target.level + 1;
    target.level = newLevel;
    target.pulse = 0;

    // Free dragged spot
    if (dragged.spot) dragged.spot.occupied = false;
    const idx = state.towers.indexOf(dragged);
    if (idx >= 0) state.towers.splice(idx, 1);

    spawnParticles(target.x, target.y, target.stats.color, 22);
    spawnFloatingText(target.x, target.y - 28, `LV.${newLevel}!`, target.stats.color);
    return true;
  }

  function clearHighlights() {
    for (const t of state.towers) {
      t.mergeHighlight = false;
      t.selected = false;
    }
  }

  function findTowerAt(pos, exclude) {
    // Prefer higher level / closer
    let best = null;
    let bestD = Infinity;
    for (const t of state.towers) {
      if (t === exclude) continue;
      const d = dist(pos, t);
      const hitR = 20 + t.level * 2.5;
      if (d < hitR && d < bestD) {
        bestD = d;
        best = t;
      }
    }
    return best;
  }

  // -------------------- INPUT (Drag-to-Merge) --------------------
  function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  function onPointerDown(e) {
    if (state.gameOver || !state.running) return;
    e.preventDefault();
    const pos = getMousePos(e);
    const tower = findTowerAt(pos);
    if (!tower) {
      clearHighlights();
      state.selectedTower = null;
      hideTooltip();
      return;
    }

    // Start drag (also used to detect click vs drag)
    state.draggingTower = tower;
    state.dragOffsetX = pos.x - tower.x;
    state.dragOffsetY = pos.y - tower.y;
    state.dragX = tower.x;
    state.dragY = tower.y;
    state.dragStartX = pos.x;
    state.dragStartY = pos.y;
    tower.selected = true;
    state.selectedTower = tower;

    // Highlight valid merge partners (same type+level, not evolved)
    for (const t of state.towers) {
      if (t !== tower && !t.evolved && !tower.evolved &&
          t.type === tower.type && t.level === tower.level && t.level < CONFIG.MERGE_MAX_LEVEL) {
        t.mergeHighlight = true;
      }
    }
    canvas.style.cursor = 'grabbing';
    hideTooltip();
  }

  function onPointerMove(e) {
    if (!state.draggingTower) {
      // Hover tooltip
      if (state.gameOver) return;
      const pos = getMousePos(e);
      const t = findTowerAt(pos);
      if (t) {
        showTooltip(t, e);
        t.selected = true;
        state.selectedTower = t;
      } else {
        if (state.selectedTower && !state.draggingTower) {
          state.selectedTower.selected = false;
          state.selectedTower = null;
        }
        hideTooltip();
      }
      return;
    }

    e.preventDefault();
    const pos = getMousePos(e);
    state.dragX = pos.x - state.dragOffsetX;
    state.dragY = pos.y - state.dragOffsetY;
  }

  function onPointerUp(e) {
    if (!state.draggingTower) return;
    e.preventDefault();

    const pos = { x: state.dragX, y: state.dragY };
    const moved = Math.hypot(
      (state.dragStartX || 0) - (getMousePos(e).x || pos.x),
      (state.dragStartY || 0) - (getMousePos(e).y || pos.y)
    );
    const wasClick = moved < 12;

    // Click on Lv5 non-evolved → open evolution panel
    if (wasClick && state.draggingTower.level >= 5 && !state.draggingTower.evolved) {
      openEvolutionPanel(state.draggingTower);
      clearHighlights();
      state.draggingTower = null;
      state.selectedTower = null;
      canvas.style.cursor = 'crosshair';
      hideTooltip();
      return;
    }

    const target = findTowerAt(pos, state.draggingTower);
    if (target && tryMerge(target, state.draggingTower)) {
      // success
    }

    clearHighlights();
    state.draggingTower = null;
    state.selectedTower = null;
    canvas.style.cursor = 'crosshair';
    hideTooltip();
  }

  function openEvolutionPanel(tower) {
    const opts = EVOLUTIONS[tower.type];
    if (!opts) return;
    state.evoTarget = tower;
    document.getElementById('evo-name-a').textContent = opts[0].name;
    document.getElementById('evo-detail-a').textContent = opts[0].detail;
    document.getElementById('evo-name-b').textContent = opts[1].name;
    document.getElementById('evo-detail-b').textContent = opts[1].detail;
    document.getElementById('evo-desc').textContent =
      `Select an advanced form for this Level ${tower.level} ${TOWER_TYPES[tower.type].name} program.`;
    document.getElementById('evo-overlay').classList.remove('hidden');
  }

  function applyEvolution(index) {
    const tower = state.evoTarget;
    if (!tower) return;
    const opts = EVOLUTIONS[tower.type];
    if (!opts || !opts[index]) return;
    tower.evolved = true;
    tower.evoData = opts[index];
    tower.pulse = 0;
    spawnParticles(tower.x, tower.y, opts[index].color, 28);
    spawnFloatingText(tower.x, tower.y - 30, opts[index].name, opts[index].color);
    closeEvolutionPanel();
  }

  function closeEvolutionPanel() {
    state.evoTarget = null;
    document.getElementById('evo-overlay').classList.add('hidden');
  }

  function showTooltip(tower, e) {
    const tip = document.getElementById('tooltip');
    const s = tower.stats;
    let extra = '';
    if (tower.evolved) {
      extra = `<br><span style="color:#f0ff00">EVOLVED FORM</span>`;
    } else if (tower.level >= 5) {
      extra = `<br><span style="color:#f0ff00">Click to choose EVOLUTION</span>`;
    } else {
      extra = `<br><span style="opacity:0.7;font-size:10px">Drag onto same type &amp; level to merge</span>`;
    }
    tip.innerHTML = `
      <strong style="color:${s.color}">${s.name}${tower.evolved ? '' : ' Lv.' + tower.level}</strong><br>
      DMG: ${s.damage.toFixed(0)} | RNG: ${s.range.toFixed(0)}<br>
      RATE: ${s.fireRate.toFixed(1)}/s
      ${s.aoe ? '<br>AOE BLAST' : ''}
      ${s.multiShot > 1 ? '<br>MULTI-SHOT x' + s.multiShot : ''}
      ${s.pierce ? '<br>PIERCE' : ''}
      ${s.heavy ? '<br>HEAVY BEAM' : ''}
      ${extra}
    `;
    tip.classList.remove('hidden');
    const rect = canvas.getBoundingClientRect();
    tip.style.left = (e.clientX - rect.left + 15) + 'px';
    tip.style.top = (e.clientY - rect.top - 10) + 'px';
  }

  function hideTooltip() {
    document.getElementById('tooltip').classList.add('hidden');
  }

  // -------------------- RENDER --------------------
  function drawBackground(ctx) {
    // Dark base
    ctx.fillStyle = '#060610';
    ctx.fillRect(0, 0, W, H);

    // Subtle grid
    ctx.strokeStyle = 'rgba(0, 80, 120, 0.12)';
    ctx.lineWidth = 1;
    const gs = 40;
    for (let x = 0; x < W; x += gs) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y < H; y += gs) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // Ambient light blobs
    const t = performance.now() * 0.0003;
    const g1 = ctx.createRadialGradient(
      W * 0.3 + Math.sin(t) * 50, H * 0.3, 0,
      W * 0.3, H * 0.3, 250
    );
    g1.addColorStop(0, 'rgba(0, 60, 100, 0.12)');
    g1.addColorStop(1, 'transparent');
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, W, H);

    const g2 = ctx.createRadialGradient(
      W * 0.7 + Math.cos(t * 1.3) * 40, H * 0.6, 0,
      W * 0.7, H * 0.6, 220
    );
    g2.addColorStop(0, 'rgba(80, 0, 60, 0.1)');
    g2.addColorStop(1, 'transparent');
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, W, H);
  }

  function drawPath(ctx) {
    if (state.path.length < 2) return;

    // Glow under path
    ctx.save();
    ctx.lineWidth = CONFIG.PATH_WIDTH + 16;
    ctx.strokeStyle = 'rgba(0, 200, 255, 0.08)';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(state.path[0].x, state.path[0].y);
    for (let i = 1; i < state.path.length; i++) {
      ctx.lineTo(state.path[i].x, state.path[i].y);
    }
    ctx.stroke();

    // Main path
    ctx.lineWidth = CONFIG.PATH_WIDTH;
    ctx.strokeStyle = 'rgba(0, 40, 70, 0.85)';
    ctx.stroke();

    // Neon edges
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.5)';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 12;
    ctx.stroke();

    // Center line dashed
    ctx.shadowBlur = 0;
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
    ctx.setLineDash([8, 10]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Start / End markers
    const start = state.path[0];
    const end = state.path[state.path.length - 1];

    // Start portal
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 20;
    ctx.fillStyle = 'rgba(0, 255, 136, 0.3)';
    ctx.beginPath();
    ctx.arc(start.x, start.y, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;
    ctx.stroke();

    // End core
    ctx.shadowColor = '#ff00aa';
    ctx.shadowBlur = 25;
    ctx.fillStyle = 'rgba(255, 0, 170, 0.25)';
    ctx.beginPath();
    ctx.arc(end.x, end.y, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ff00aa';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Core inner
    ctx.fillStyle = '#ff00aa';
    ctx.beginPath();
    ctx.arc(end.x, end.y, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawPlacementHints(ctx) {
    // Subtle dots for free spots when not too many towers
    if (state.towers.length > 12) return;
    ctx.save();
    for (const s of state.placementSpots) {
      if (s.occupied) continue;
      ctx.fillStyle = 'rgba(0, 240, 255, 0.08)';
      ctx.beginPath();
      ctx.arc(s.x, s.y, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // -------------------- GAME LOOP --------------------
  function update(dt) {
    if (state.gameOver) return;

    // Spawn
    if (state.waveActive && state.currentWaveData && state.currentWaveData.enemies.length > 0) {
      state.spawnTimer -= dt;
      if (state.spawnTimer <= 0) {
        spawnEnemy();
        state.spawnTimer = state.spawnInterval;
      }
    }

    // Entities
    for (const t of state.towers) t.update(dt);
    for (const e of state.enemies) e.update(dt);
    for (const p of state.projectiles) p.update(dt);

    // Cleanup
    state.enemies = state.enemies.filter(e => e.alive);
    state.projectiles = state.projectiles.filter(p => p.alive);

    updateParticles(dt);
    checkWaveComplete();
  }

  function draw() {
    drawBackground(ctx);
    drawPath(ctx);
    drawPlacementHints(ctx);

    // Draw towers (skip the one being dragged so it can be drawn on top later)
    for (const t of state.towers) {
      if (t === state.draggingTower) {
        // Draw a faint ghost at original position
        ctx.save();
        ctx.globalAlpha = 0.3;
        t.draw(ctx);
        ctx.restore();
      } else {
        t.draw(ctx);
      }
    }

    for (const e of state.enemies) e.draw(ctx);
    for (const p of state.projectiles) p.draw(ctx);
    drawParticles(ctx);

    // Draw dragged tower on top at cursor position
    if (state.draggingTower) {
      state.draggingTower.draw(ctx, state.dragX, state.dragY);
    }

    // Hint while dragging
    if (state.draggingTower) {
      ctx.save();
      ctx.fillStyle = 'rgba(0, 240, 255, 0.7)';
      ctx.font = '13px Orbitron';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 8;
      ctx.fillText('Drop on matching program to EVOLVE', W / 2, 26);
      ctx.restore();
    }
  }

  function loop(ts) {
    const dt = Math.min(0.05, (ts - state.lastTime) / 1000) || 0.016;
    state.lastTime = ts;

    if (state.running) {
      update(dt);
    }
    draw();
    requestAnimationFrame(loop);
  }

  // -------------------- UI & LIFECYCLE --------------------
  function updateHUD() {
    document.getElementById('gold').textContent = state.gold;
    document.getElementById('lives').textContent = state.lives;
    document.getElementById('wave').textContent = state.wave;
    document.getElementById('score').textContent = state.score;

    const summonBtn = document.getElementById('summon-btn');
    summonBtn.disabled = state.gold < CONFIG.SUMMON_COST || state.gameOver;
  }

  function endGame(won) {
    state.gameOver = true;
    state.running = false;
    const overlay = document.getElementById('game-over-overlay');
    document.getElementById('go-title').textContent = won ? 'CORE SECURED' : 'CORE CORRUPTED';
    document.getElementById('go-title').style.color = won ? '#00ff88' : '#ff00aa';
    document.getElementById('go-text').textContent = won
      ? `The AI virus was purged. Humanity’s last Data Core stands.\nScore: ${state.score}  |  Waves: ${state.wave}`
      : `The viral swarm overran the Core. The last human node has fallen.\nScore: ${state.score}  |  Waves: ${state.wave}`;
    overlay.classList.remove('hidden');
  }

  function restart() {
    state.gold = CONFIG.START_GOLD;
    state.lives = CONFIG.START_LIVES;
    state.score = 0;
    state.wave = 0;
    state.running = true;
    state.gameOver = false;
    state.selectedTower = null;
    state.draggingTower = null;
    state.towers = [];
    state.enemies = [];
    state.projectiles = [];
    state.particles = [];
    state.floatingTexts = [];
    state.waveActive = false;
    state.waveEnemiesLeft = 0;
    state.currentWaveData = null;

    for (const s of state.placementSpots) s.occupied = false;

    document.getElementById('game-over-overlay').classList.add('hidden');
    document.getElementById('start-wave-btn').disabled = false;
    updateHUD();
  }

  function resize() {
    const container = document.getElementById('game-container');
    const hud = document.getElementById('hud');
    const rect = container.getBoundingClientRect();
    W = Math.floor(rect.width);
    H = Math.floor(rect.height - hud.offsetHeight);
    canvas.width = W;
    canvas.height = H;
    if (state.path.length === 0) {
      generatePath();
      generatePlacementSpots();
    }
  }

  function init() {
    resize();
    window.addEventListener('resize', () => {
      const oldW = W, oldH = H;
      resize();
      if (oldW && oldH && (W !== oldW || H !== oldH)) {
        const sx = W / oldW, sy = H / oldH;
        for (const p of state.path) { p.x *= sx; p.y *= sy; }
        for (const s of state.placementSpots) { s.x *= sx; s.y *= sy; }
        for (const t of state.towers) { t.x *= sx; t.y *= sy; }
      }
    });

    document.getElementById('summon-btn').addEventListener('click', summonTower);
    document.getElementById('start-wave-btn').addEventListener('click', startWave);
    document.getElementById('message-ok').addEventListener('click', () => {
      document.getElementById('message-overlay').classList.add('hidden');
      state.running = true;
    });
    document.getElementById('restart-btn').addEventListener('click', restart);

    document.getElementById('evo-choice-a').addEventListener('click', () => applyEvolution(0));
    document.getElementById('evo-choice-b').addEventListener('click', () => applyEvolution(1));
    document.getElementById('evo-cancel').addEventListener('click', closeEvolutionPanel);

    // Drag-to-merge input
    canvas.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);
    // Touch support
    canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        e.preventDefault();
        onPointerDown(e.touches[0]);
      }
    }, { passive: false });
    window.addEventListener('touchmove', (e) => {
      if (state.draggingTower && e.touches.length === 1) {
        e.preventDefault();
        onPointerMove(e.touches[0]);
      }
    }, { passive: false });
    window.addEventListener('touchend', (e) => {
      if (state.draggingTower) onPointerUp(e.changedTouches[0] || e);
    });

    updateHUD();
    document.getElementById('message-overlay').classList.remove('hidden');
    requestAnimationFrame(loop);
  }

  // Boot
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
