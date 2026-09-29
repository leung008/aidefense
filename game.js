// ============================================================
// CYBER DICE DEFENSE - Streamlined Core Engine
// ============================================================
(() => {
  'use strict';

  // -------------------- CONFIG & CONSTANTS --------------------
  const CONFIG = {
    SUMMON_COST_BASE: 50,
    SUMMON_COST_STEP: 10,
    SUMMON_COST: 50,
    START_GOLD: 300,
    START_LIVES: 20,
    TOWER_RANGE_BASE: 90,
    TOWER_DAMAGE_BASE: 12,
    TOWER_FIRE_RATE_BASE: 1.0,
    ENEMY_SPEED_BASE: 55,
    ENEMY_HP_BASE: 40,
    MERGE_MAX_LEVEL: 6,
    PATH_WIDTH: 36,
    MAX_WAVE: 20,
    BOSS_WAVES: {
      5:  { name: 'MALWARE BEHEMOTH',  sub: 'BRUTE FORCE ENCRYPTION UNIT', hpMult: 8.5,  speedMult: 0.42, color: '#ff2244', reward: 120 },
      10: { name: 'NEXUS OVERLORD',     sub: 'DISTRIBUTED DENIAL MATRIX',    hpMult: 13.0, speedMult: 0.45, color: '#ff00aa', reward: 180 },
      15: { name: 'QUANTUM WORM',       sub: 'POLYMORPHIC SUB-ROUTINE',      hpMult: 18.0, speedMult: 0.52, color: '#f0ff00', reward: 260 },
      20: { name: 'APOCALYPSE ZERO-DAY',sub: 'CORE TERMINATION SENTINEL',   hpMult: 25.0, speedMult: 0.48, color: '#ff0055', reward: 400 },
    }
  };

    const TOWER_TYPES = {
    plasma:    { name: 'Plasma',       role: 'Direct DPS',      color: '#00f0ff', colorDim: '#0088aa', damageMult: 1.0,  rangeMult: 1.0,  rateMult: 1.2, projectileSpeed: 320, aoe: false, desc: 'Balanced single-target energy bolts.' },
    missile:   { name: 'Missile',      role: 'Area Blast',      color: '#ff00aa', colorDim: '#aa0066', damageMult: 1.6,  rangeMult: 1.15, rateMult: 0.6, projectileSpeed: 220, aoe: true, aoeRadius: 45, desc: 'Explosive rockets with splash damage.' },
    laser:     { name: 'Laser',        role: 'Beam Sniper',     color: '#f0ff00', colorDim: '#aaaa00', damageMult: 0.7,  rangeMult: 1.3,  rateMult: 2.0, projectileSpeed: 500, aoe: false, desc: 'Ultra-rapid piercing laser beams.' },
    buffer:    { name: 'Overclock',    role: 'Power-Up Aura',   color: '#c084fc', colorDim: '#7e22ce', damageMult: 0.0,  rangeMult: 1.25, rateMult: 1.0, isBuffer: true, buffDmg: 0.35, buffRate: 0.25, desc: 'Aura buffs damage & attack rate of nearby towers.' },
    miner:     { name: 'Crypto Miner', role: 'Economy Engine',  color: '#10b981', colorDim: '#047857', damageMult: 0.0,  rangeMult: 0.8,  rateMult: 1.0, isMiner: true, mineInterval: 6.0, mineBase: 6, desc: 'Harvests credits (+6¢ + 2¢/lvl) every 6s while mobs active.' },
    tesla:     { name: 'Arc Welder',   role: 'Close Melee DPS', color: '#38bdf8', colorDim: '#0284c7', damageMult: 3.4,  rangeMult: 0.65, rateMult: 2.4, isTesla: true, desc: 'Devastating short-range continuous electric arc.' },
    frost:     { name: 'Cryo Coolant', role: 'Crowd Control',   color: '#67e8f9', colorDim: '#0891b2', damageMult: 0.8,  rangeMult: 1.05, rateMult: 1.1, projectileSpeed: 280, isFrost: true, slowMult: 0.55, desc: 'Chills targets, slowing speed by 45%.' },
    railgun:   { name: 'Railgun',      role: 'Kinetic Piercer', color: '#f97316', colorDim: '#c2410c', damageMult: 3.6,  rangeMult: 1.7,  rateMult: 0.4, projectileSpeed: 750, isPierce: true, desc: 'Extreme-range hyper-velocity slug pierces lines.' },
    firewall:  { name: 'Firewall',     role: 'Burn Over Time',  color: '#ef4444', colorDim: '#b91c1c', damageMult: 0.9,  rangeMult: 0.95, rateMult: 1.1, projectileSpeed: 300, isBurn: true, burnDmg: 9, desc: 'Ignites viruses, burning over 3 seconds.' },
    corruptor: { name: 'Virus Hacker', role: 'Vulnerability',   color: '#84cc16', colorDim: '#4d7c0f', damageMult: 0.65, rangeMult: 1.1,  rateMult: 1.3, projectileSpeed: 340, isCorrupt: true, vulnMult: 1.35, desc: 'Hacks enemy defenses so they take +35% damage.' },
  };
  const ALL_TYPE_KEYS = Object.keys(TOWER_TYPES);

    const EVOLUTIONS = {
    plasma: [
      { key: 'dual',   name: 'DUAL PLASMA',   detail: 'Fires 2 parallel shots',      color: '#00f0ff', damageMult: 1.15, rateMult: 1.1,  rangeMult: 1.05, multiShot: 2, spread: 0.12 },
      { key: 'pierce', name: 'PIERCE PLASMA', detail: 'Shots pierce through viruses',color: '#66ffff', damageMult: 1.35, rateMult: 0.95, rangeMult: 1.2,  pierce: true }
    ],
    missile: [
      { key: 'cluster',name: 'CLUSTER MISSILE',detail: 'Bigger AOE blast radius',   color: '#ff44cc', damageMult: 1.4,  rateMult: 0.9,  rangeMult: 1.1,  aoeBoost: 1.6 },
      { key: 'swarm',  name: 'SWARM MISSILE',  detail: 'Launches 3 mini-missiles',  color: '#ff88aa', damageMult: 0.85, rateMult: 0.85, rangeMult: 1.15, multiShot: 3, spread: 0.22, aoeBoost: 0.7 }
    ],
    laser: [
      { key: 'beam',   name: 'HEAVY BEAM',    detail: 'Thicker high-damage laser',  color: '#ffff66', damageMult: 2.2,  rateMult: 0.7,  rangeMult: 1.25, heavy: true },
      { key: 'spread', name: 'SPREAD LASER',  detail: 'Fires 3 angled beams',       color: '#ffee44', damageMult: 0.9,  rateMult: 1.15, rangeMult: 1.1,  multiShot: 3, spread: 0.28 }
    ],
    buffer: [
      { key: 'hyper',  name: 'HYPER OVERCLOCK', detail: 'Massive +60% dmg aura & +40% range', color: '#e879f9', buffDmgBoost: 1.7, rangeMult: 1.4 },
      { key: 'global', name: 'GLOBAL CLOCK',    detail: 'Aura covers entire datacenter node', color: '#c084fc', rangeMult: 3.5, buffDmgBoost: 0.9 }
    ],
    miner: [
      { key: 'quantum',name: 'QUANTUM HASH',   detail: 'Yields +18¢ every 4.5 seconds', color: '#34d399', mineInterval: 4.5, mineBonus: 12 },
      { key: 'surge',  name: 'SURGE MINER',    detail: 'Grants +60¢ bonus on every wave clear', color: '#10b981', waveBonus: 60 }
    ],
    tesla: [
      { key: 'chain',  name: 'CHAIN VOLT',     detail: 'Electric arcs jump to 3 additional targets', color: '#38bdf8', damageMult: 1.4, chainTargets: 3 },
      { key: 'storm',  name: 'TESLA VORTEX',   detail: 'Continuous 360-degree point-blank discharge', color: '#7dd3fc', damageMult: 2.2, rangeMult: 1.3 }
    ],
    frost: [
      { key: 'deep',   name: 'DEEP FREEZE',    detail: 'Slows viruses by 70% and chills in AOE', color: '#a5f3fc', slowMult: 0.3, aoe: true, aoeRadius: 50 },
      { key: 'shatter',name: 'CRYO SHATTER',   detail: 'Chilled enemies take +50% critical damage', color: '#67e8f9', damageMult: 1.8 }
    ],
    railgun: [
      { key: 'tachyon',name: 'TACHYON SLUG',   detail: 'Doubled fire rate and infinite pierce', color: '#fb923c', rateMult: 2.0, pierce: true },
      { key: 'emp',    name: 'EMP DISRUPTOR',  detail: 'Stuns hit targets for 1.2 seconds', color: '#f97316', damageMult: 1.4, stun: 1.2 }
    ],
    firewall: [
      { key: 'napalm', name: 'NAPALM INFERNO', detail: 'Doubled burn DPS that leaves track hazards', color: '#f87171', burnDmgMult: 2.5 },
      { key: 'plasmafire', name: 'BLUE FLAME', detail: 'High initial impact + lingering burn', color: '#ef4444', damageMult: 1.8, rateMult: 1.2 }
    ],
    corruptor: [
      { key: 'exploit',name: 'ROOT EXPLOIT',   detail: 'Corrupted enemies take +60% damage', color: '#a3e635', debuffBoost: 2.0 },
      { key: 'contagion', name: 'MALWARE CONTAGION', detail: 'Debuff infects adjacent enemies on death', color: '#84cc16', contagion: true }
    ]
  };

  // -------------------- MODULAR AUDIO SYNTHESIZER --------------------
  class SoundFX {
    constructor() { this.ctx = null; this.enabled = true; }
    init() {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) this.ctx = new AC();
      }
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    }
    tone(type, f0, f1, duration, vol = 0.2, delay = 0) {
      if (!this.enabled || !this.ctx) return;
      const t = this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator(), g = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(f0, t);
      if (f1 !== f0) osc.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + duration);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + duration);
      osc.connect(g); g.connect(this.ctx.destination);
      osc.start(t); osc.stop(t + duration);
    }
    playDeploy() { this.tone('sine', 320, 640, 0.14, 0.2); }
    playMerge() { [440, 554, 659, 880].forEach((f, i) => this.tone('triangle', f, f, 0.18, 0.25, i * 0.05)); }
    playShoot(type) {
      if (type === 'laser') this.tone('sawtooth', 800, 200, 0.09, 0.08);
      else if (type === 'missile') this.tone('square', 260, 90, 0.18, 0.12);
      else this.tone('sine', 600, 220, 0.11, 0.12);
    }
    playExplosion(heavy = false) {
      if (!this.enabled || !this.ctx) return;
      const t = this.ctx.currentTime, dur = heavy ? 0.35 : 0.18;
      const buf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * dur), this.ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const src = this.ctx.createBufferSource(); src.buffer = buf;
      const flt = this.ctx.createBiquadFilter(); flt.type = 'lowpass';
      flt.frequency.setValueAtTime(heavy ? 380 : 550, t);
      flt.frequency.exponentialRampToValueAtTime(80, t + dur);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(heavy ? 0.45 : 0.2, t);
      g.gain.exponentialRampToValueAtTime(0.01, t + dur);
      src.connect(flt); flt.connect(g); g.connect(this.ctx.destination);
      src.start(t); src.stop(t + dur + 0.01);
    }
    playEmergencyAlarm() {
      if (!this.enabled || !this.ctx) return;
      for (let i = 0; i < 3; i++) {
        const t = this.ctx.currentTime + i * 0.55;
        const osc = this.ctx.createOscillator(), g = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(520, t);
        osc.frequency.linearRampToValueAtTime(840, t + 0.25);
        osc.frequency.linearRampToValueAtTime(480, t + 0.48);
        g.gain.setValueAtTime(0.01, t);
        g.gain.linearRampToValueAtTime(0.35, t + 0.05);
        g.gain.setValueAtTime(0.35, t + 0.4);
        g.gain.exponentialRampToValueAtTime(0.01, t + 0.52);
        osc.connect(g); g.connect(this.ctx.destination);
        osc.start(t); osc.stop(t + 0.53);
      }
    }
    playStageClear() { [392, 523, 659, 784, 1046].forEach((f, i) => this.tone('sine', f, f, 0.3, 0.22, i * 0.08)); }
    playCoreBreached() { this.tone('sawtooth', 320, 60, 0.85, 0.4); }
  }
  const sfx = new SoundFX();

  // -------------------- GAME STATE --------------------
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0;

  // Load saved 4-tower squad or default to balanced squad
  function loadSavedSquad() {
    try {
      const saved = JSON.parse(localStorage.getItem('cdd_squad'));
      if (Array.isArray(saved) && saved.length === 4 && saved.every(k => TOWER_TYPES[k])) {
        return saved;
      }
    } catch (_) {}
    return ['plasma', 'missile', 'laser', 'buffer'];
  }

  const state = {
    gold: CONFIG.START_GOLD,
    lives: CONFIG.START_LIVES,
    score: 0,
    wave: 0,
    summonCount: 0,
    running: false,
    gameOver: false,
    selectedTower: null,
    evoTarget: null,
    equippedTowers: loadSavedSquad(),
    modalSquad: [],
    draggingTower: null,
    dragOffsetX: 0,
    dragOffsetY: 0,
    dragX: 0,
    dragY: 0,
    dragStartX: 0,
    dragStartY: 0,
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
    activeBoss: null,
    inTransition: false
  };

  function getSummonCost() {
    return CONFIG.SUMMON_COST_BASE + (state.summonCount || 0) * CONFIG.SUMMON_COST_STEP;
  }

  // -------------------- MAP & SPOT GENERATION --------------------
  function generatePath() {
    const margin = 50, segments = 8, pts = [];
    const isPortrait = H > W * 1.15; // Dynamic orientation detection

    if (isPortrait) {
      // Portrait Stream: Flow from top to bottom
      let y = margin;
      const dy = (H - margin * 2) / segments;
      const startX = W * (0.35 + Math.random() * 0.3);
      pts.push({ x: startX, y });
      const freq = 1.0 + Math.random() * 1.2;
      const phaseInit = Math.random() * Math.PI * 2;
      const ampBase = W * (0.24 + Math.random() * 0.12);

      for (let i = 1; i <= segments; i++) {
        y = margin + dy * i;
        const phase = i % 2 === 0 ? 1 : -1;
        const waveOffset = Math.sin(i * freq + phaseInit) * (ampBase * 0.45);
        let x = W * 0.5 + phase * (ampBase * 0.65) + waveOffset;
        x = Math.max(margin + 15, Math.min(W - margin - 15, x));
        pts.push({ x, y });
      }
    } else {
      // Landscape Stream: Flow from left to right
      let x = margin;
      const dx = (W - margin * 2) / segments;
      const startY = H * (0.35 + Math.random() * 0.3);
      pts.push({ x, y: startY });
      const freq = 1.0 + Math.random() * 1.2;
      const phaseInit = Math.random() * Math.PI * 2;
      const ampBase = H * (0.22 + Math.random() * 0.12);

      for (let i = 1; i <= segments; i++) {
        x = margin + dx * i;
        const phase = i % 2 === 0 ? 1 : -1;
        const waveOffset = Math.sin(i * freq + phaseInit) * (ampBase * 0.45);
        let y = H * 0.5 + phase * (ampBase * 0.6) + waveOffset;
        y = Math.max(margin + 20, Math.min(H - margin - 20, y));
        pts.push({ x, y });
      }
    }

    const smooth = [];
    for (let i = 0; i < pts.length - 1; i++) {
      smooth.push(pts[i], {
        x: (pts[i].x + pts[i + 1].x) / 2 + (isPortrait ? (Math.random() - 0.5) * 16 : 0),
        y: (pts[i].y + pts[i + 1].y) / 2 + (!isPortrait ? (Math.random() - 0.5) * 16 : 0)
      });
    }
    smooth.push(pts[pts.length - 1]);
    state.path = smooth;
  }

  function generatePlacementSpots() {
    const spots = [], step = 28, offsets = [55, 75, -55, -75];
    for (let i = 0; i < state.path.length - 1; i++) {
      const a = state.path[i], b = state.path[i + 1];
      const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len, ny = dx / len, count = Math.max(1, Math.floor(len / step));
      for (let s = 0; s < count; s++) {
        const t = (s + 0.5) / count, px = a.x + dx * t, py = a.y + dy * t;
        for (const off of offsets) {
          const sx = px + nx * off, sy = py + ny * off;
          if (sx > 40 && sx < W - 40 && sy > 50 && sy < H - 40) {
            if (!spots.some(sp => Math.hypot(sp.x - sx, sp.y - sy) < 32)) {
              spots.push({ x: sx, y: sy, occupied: false });
            }
          }
        }
      }
    }
    for (let i = spots.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [spots[i], spots[j]] = [spots[j], spots[i]];
    }
    state.placementSpots = spots;
  }

  function reallocateTowers() {
    if (state.towers.length === 0 || state.placementSpots.length === 0) return;
    for (const s of state.placementSpots) s.occupied = false;
    const availableSpots = [...state.placementSpots].sort(() => Math.random() - 0.5);
    for (let i = 0; i < state.towers.length; i++) {
      const tower = state.towers[i];
      const spot = availableSpots[i % availableSpots.length];
      tower.x = spot.x;
      tower.y = spot.y;
      tower.spot = spot;
      spot.occupied = true;
      spawnParticles(tower.x, tower.y, tower.stats.color, 18);
    }
    sfx.playDeploy();
  }

  function reconfigureMapAndTowers() {
    state.draggingTower = null;
    generatePath();
    generatePlacementSpots();
    reallocateTowers();
    spawnFloatingText(W / 2, H * 0.45, 'SECTOR RECONFIGURED!', '#00f0ff');
  }

  // -------------------- UTILITIES --------------------
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const lerp = (a, b, t) => a + (b - a) * t;
  const randomType = () => state.equippedTowers[Math.floor(Math.random() * state.equippedTowers.length)];

  function getTowerStats(type, level) {
    const t = TOWER_TYPES[type] || TOWER_TYPES.plasma, lvl = level;
    return {
      damage: CONFIG.TOWER_DAMAGE_BASE * t.damageMult * (1 + (lvl - 1) * 0.75),
      range: CONFIG.TOWER_RANGE_BASE * t.rangeMult * (1 + (lvl - 1) * 0.12),
      fireRate: CONFIG.TOWER_FIRE_RATE_BASE * t.rateMult * (1 + (lvl - 1) * 0.15),
      color: t.color, colorDim: t.colorDim,
      aoe: t.aoe, aoeRadius: t.aoe ? t.aoeRadius * (1 + (lvl - 1) * 0.1) : 0,
      projectileSpeed: t.projectileSpeed || 320, name: t.name,
      role: t.role, desc: t.desc,
      isBuffer: t.isBuffer, buffDmg: t.buffDmg, buffRate: t.buffRate,
      isMiner: t.isMiner, mineInterval: t.mineInterval, mineBase: t.mineBase,
      isTesla: t.isTesla, isFrost: t.isFrost, slowMult: t.slowMult,
      isPierce: t.isPierce, isBurn: t.isBurn, burnDmg: t.burnDmg,
      isCorrupt: t.isCorrupt, vulnMult: t.vulnMult
    };
  }

  // -------------------- ENTITIES --------------------
  class Tower {
    constructor(x, y, type, level = 1) {
      this.x = x; this.y = y; this.type = type; this.level = level;
      this.cooldown = 0; this.angle = 0; this.target = null;
      this.pulse = Math.random() * Math.PI * 2;
      this.id = Math.random().toString(36).slice(2);
      this.selected = false; this.mergeHighlight = false;
      this.evolved = false; this.evoData = null;
    }
    get stats() {
      const b = getTowerStats(this.type, this.level);
      if (!this.evolved || !this.evoData) return b;
      const e = this.evoData;
      return {
        damage: b.damage * (e.damageMult || 1), range: b.range * (e.rangeMult || 1),
        fireRate: b.fireRate * (e.rateMult || 1), color: e.color || b.color, colorDim: b.colorDim,
        aoe: b.aoe || !!e.aoeBoost, aoeRadius: (b.aoeRadius || 40) * (e.aoeBoost || 1),
        projectileSpeed: b.projectileSpeed, name: e.name || b.name,
        multiShot: e.multiShot || 1, spread: e.spread || 0, pierce: !!e.pierce, heavy: !!e.heavy
      };
    }
    update(dt) {
      this.pulse += dt * 3;
      this.cooldown = Math.max(0, this.cooldown - dt);

      // Support Tower: Overclock Aura
      if (this.type === 'buffer') {
        const rng = this.stats.range;
        const dmgBoost = (this.stats.buffDmg || 0.35) * ((this.evoData && this.evoData.buffDmgBoost) || 1) + (this.level - 1) * 0.05;
        const rateBoost = (this.stats.buffRate || 0.25) + (this.level - 1) * 0.04;
        for (const t of state.towers) {
          if (t !== this && dist(this, t) <= rng) {
            t.buffedDmg = Math.max(t.buffedDmg || 1, 1 + dmgBoost);
            t.buffedRate = Math.max(t.buffedRate || 1, 1 + rateBoost);
          }
        }
        return;
      }

      // Economy Tower: Crypto Miner - Only generates money when mobs are actively on stage
      if (this.type === 'miner') {
        const hasMobs = state.waveActive && state.enemies.some(e => e.alive && e.hp > 0);
        if (!hasMobs) return;
        this.mineTimer = (this.mineTimer || 0) + dt;
        const interval = (this.evoData && this.evoData.mineInterval) || (this.stats.mineInterval || 6.0);
        if (this.mineTimer >= interval) {
          this.mineTimer = 0;
          const payout = (this.stats.mineBase || 6) + (this.level - 1) * 2 + ((this.evoData && this.evoData.mineBonus) || 0);
          state.gold += payout;
          state.score += payout * 5;
          spawnFloatingText(this.x, this.y - 20, `+${payout}¢`, '#10b981');
          sfx.playDeploy();
          spawnParticles(this.x, this.y, '#10b981', 8);
          updateHUD();
        }
        return;
      }

      // Targeting: Boss takes priority, otherwise closest in range
      this.target = null;
      if (state.activeBoss && state.activeBoss.alive && state.activeBoss.hp > 0 && dist(this, state.activeBoss) <= this.stats.range) {
        this.target = state.activeBoss;
      }
      if (!this.target) {
        let best = Infinity;
        for (const e of state.enemies) {
          if (e.hp <= 0 || !e.alive) continue;
          const d = dist(this, e);
          if (d <= this.stats.range && d < best) { best = d; this.target = e; }
        }
      }

      if (this.target) {
        this.angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
        const effRate = this.stats.fireRate * (this.buffedRate || 1);
        if (this.cooldown <= 0) {
          this.fire();
          this.cooldown = 1 / effRate;
        }
      }
    }
    fire() {
      const s = this.stats, count = s.multiShot || 1, spread = s.spread || 0;
      const effDmg = s.damage * (this.buffedDmg || 1);

      // Melee Arc Welder (Tesla Shock)
      if (this.type === 'tesla') {
        sfx.playShoot('laser');
        this.target.takeDamage(effDmg);
        spawnParticles(this.target.x, this.target.y, '#38bdf8', 6);
        // Chain lightning evolution
        if (this.evoData && this.evoData.chainTargets) {
          let chained = 0;
          for (const en of state.enemies) {
            if (en !== this.target && en.alive && en.hp > 0 && dist(this.target, en) < 80) {
              en.takeDamage(effDmg * 0.7);
              spawnParticles(en.x, en.y, '#7dd3fc', 4);
              chained++;
              if (chained >= this.evoData.chainTargets) break;
            }
          }
        }
        return;
      }

      sfx.playShoot(this.type === 'missile' ? 'missile' : (this.type === 'laser' || this.type === 'railgun') ? 'laser' : 'plasma');

      for (let i = 0; i < count; i++) {
        const offset = count === 1 ? 0 : (i - (count - 1) / 2) * spread;
        state.projectiles.push(new Projectile(
          this.x, this.y, this.target, effDmg, s.projectileSpeed, this.type,
          s.aoe, s.aoeRadius, s.color, offset, s.pierce || s.isPierce, s.heavy,
          { isFrost: s.isFrost, slowMult: s.slowMult, isBurn: s.isBurn, burnDmg: s.burnDmg, isCorrupt: s.isCorrupt, vulnMult: s.vulnMult }
        ));
      }
    }
    draw(ctx, overrideX, overrideY) {
      const s = this.stats, lvl = this.level, size = 12 + lvl * 3.5;
      const glow = 0.45 + Math.sin(this.pulse) * 0.35;
      const dx = overrideX !== undefined ? overrideX : this.x;
      const dy = overrideY !== undefined ? overrideY : this.y;
      const isDrag = overrideX !== undefined, isHL = this.selected || this.mergeHighlight;

      ctx.save();
      ctx.fillStyle = isDrag ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.45)';
      ctx.beginPath();
      ctx.ellipse(dx + 4, dy + 6, size * 0.95, size * 0.42, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.translate(dx, dy);

      const glowR = size * (1.8 + lvl * 0.25);
      const g = ctx.createRadialGradient(0, 0, size * 0.2, 0, 0, glowR);
      g.addColorStop(0, s.color + (isDrag ? '88' : '55'));
      g.addColorStop(0.45, s.color + '22');
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0, 0, glowR, 0, Math.PI * 2); ctx.fill();

      ctx.rotate(this.angle);
      const bodyColor = isHL || isDrag ? '#ffffff' : s.color;
      ctx.fillStyle = 'rgba(8,12,28,0.92)';
      ctx.strokeStyle = bodyColor;
      ctx.lineWidth = 1.8 + lvl * 0.35;
      ctx.shadowColor = bodyColor;
      ctx.shadowBlur = (10 + lvl * 2) * glow;

      if (lvl === 1) this._drawPoly(ctx, 6, size, 0.7);
      else if (lvl === 2) {
        this._drawPoly(ctx, 6, size, 0.7);
        ctx.lineWidth = 1.5; this._drawPoly(ctx, 4, size * 0.55, 0.85);
      } else if (lvl === 3) {
        this._drawPoly(ctx, 8, size, 0.72);
        ctx.beginPath(); ctx.moveTo(size * 0.7, -size * 0.25); ctx.lineTo(size * 1.05, 0); ctx.lineTo(size * 0.7, size * 0.25); ctx.closePath(); ctx.stroke();
      } else if (lvl === 4) {
        this._drawPoly(ctx, 6, size, 0.7);
        ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 0, size * 0.85, 0, Math.PI * 2); ctx.stroke();
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          ctx.beginPath(); ctx.moveTo(Math.cos(a) * size * 0.9, Math.sin(a) * size * 0.65); ctx.lineTo(Math.cos(a) * size * 1.25, Math.sin(a) * size * 0.9); ctx.stroke();
        }
      } else if (lvl === 5) {
        this._drawPoly(ctx, 6, size, 0.68);
        ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(0, 0, size * 0.75, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, size * 1.05, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-size * 1.1, 0); ctx.lineTo(size * 1.1, 0); ctx.moveTo(0, -size * 0.85); ctx.lineTo(0, size * 0.85); ctx.stroke();
      } else {
        this._drawPoly(ctx, 8, size, 0.7);
        ctx.lineWidth = 1.5; this._drawPoly(ctx, 4, size * 0.6, 0.9);
        ctx.beginPath(); ctx.arc(0, 0, size * 0.95, 0, Math.PI * 2); ctx.stroke();
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
          ctx.beginPath(); ctx.arc(Math.cos(a) * size * 1.15, Math.sin(a) * size * 0.85, 3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        }
      }

      ctx.shadowBlur = 10 + lvl * 2; ctx.fillStyle = bodyColor;
      ctx.beginPath(); ctx.arc(0, 0, 3.5 + lvl * 1.1, 0, Math.PI * 2); ctx.fill();
      if (lvl >= 3) {
        ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(0, 0, 1.5 + lvl * 0.3, 0, Math.PI * 2); ctx.fill();
      }

      const bLen = size * (0.55 + lvl * 0.08), bW = 2.5 + lvl * 0.6;
      ctx.fillStyle = bodyColor; ctx.shadowBlur = 6;
      ctx.fillRect(size * 0.35, -bW / 2, bLen, bW);
      if (lvl >= 3) {
        ctx.fillRect(size * 0.3, -bW * 1.8, bLen * 0.6, bW * 0.6);
        ctx.fillRect(size * 0.3, bW * 1.2, bLen * 0.6, bW * 0.6);
      }

      ctx.shadowBlur = 0;
      ctx.fillStyle = this.evolved ? '#f0ff00' : '#fff';
      ctx.font = `bold ${9 + lvl}px Orbitron, sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(this.evolved ? 'EVO' : String(lvl), 0, size * 0.72);
      ctx.restore();

      if (isHL || isDrag) {
        ctx.save();
        ctx.strokeStyle = s.color + (isDrag ? '66' : '44');
        ctx.lineWidth = 1.5; ctx.setLineDash([5, 7]);
        ctx.beginPath(); ctx.arc(dx, dy, s.range, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
      }
    }
    _drawPoly(ctx, sides, radius, yScale) {
      ctx.beginPath();
      for (let i = 0; i < sides; i++) {
        const a = (i / sides) * Math.PI * 2 - Math.PI / 2;
        const px = Math.cos(a) * radius, py = Math.sin(a) * radius * yScale;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
  }

  class Enemy {
    constructor(wave, type = 'drone', bossData = null) {
      this.pathIndex = 0; this.progress = 0;
      this.x = state.path[0].x; this.y = state.path[0].y;
      this.type = type; this.wave = wave;
      this.bossData = bossData; this.isBoss = type === 'boss';
      const scale = 1 + (wave - 1) * 0.2;
      if (this.isBoss && bossData) {
        this.maxHp = CONFIG.ENEMY_HP_BASE * scale * bossData.hpMult;
        this.hp = this.maxHp;
        this.speed = CONFIG.ENEMY_SPEED_BASE * bossData.speedMult;
        this.radius = 28; this.color = bossData.color || '#ff2244';
        this.reward = bossData.reward || 150; this.bossRotation = 0;
      } else {
        this.maxHp = CONFIG.ENEMY_HP_BASE * scale * (type === 'tank' ? 2.5 : type === 'fast' ? 0.7 : 1);
        this.hp = this.maxHp;
        this.speed = CONFIG.ENEMY_SPEED_BASE * (type === 'fast' ? 1.6 : type === 'tank' ? 0.55 : 1) * (1 + (wave - 1) * 0.04);
        this.radius = type === 'tank' ? 16 : type === 'fast' ? 9 : 12;
        this.color = type === 'tank' ? '#ff4444' : type === 'fast' ? '#44ffaa' : '#ff88ff';
        this.reward = Math.floor(8 + wave * 2.5 + (type === 'tank' ? 12 : 0));
      }
      this.alive = true; this.hitFlash = 0; this.angle = 0;
    }
    update(dt) {
      if (!this.alive || this.hp <= 0) return;
      this.hitFlash = Math.max(0, this.hitFlash - dt * 4);
      if (this.isBoss) { this.bossRotation += dt * 2.5; updateBossBar(this); }
      if (this.pathIndex >= state.path.length - 1) {
        this.alive = false;
        state.lives = Math.max(0, state.lives - (this.isBoss ? 5 : 1));
        spawnFloatingText(this.x, this.y, this.isBoss ? 'CRITICAL BREACH -5' : 'VIRUS BREACH', '#ff00aa');
        sfx.playCoreBreached(); updateHUD();
        if (this.isBoss) hideBossBar();
        if (state.lives <= 0) endGame(false);
        return;
      }
      const a = state.path[this.pathIndex], b = state.path[this.pathIndex + 1];
      const segLen = dist(a, b) || 1;
      this.progress += (this.speed * dt) / segLen;
      if (this.progress >= 1) {
        this.progress = 0; this.pathIndex++;
        if (this.pathIndex >= state.path.length - 1) {
          this.x = state.path[state.path.length - 1].x;
          this.y = state.path[state.path.length - 1].y;
          return;
        }
      }
      const na = state.path[this.pathIndex], nb = state.path[this.pathIndex + 1];
      this.x = lerp(na.x, nb.x, this.progress);
      this.y = lerp(na.y, nb.y, this.progress);
      this.angle = Math.atan2(nb.y - na.y, nb.x - na.x);
    }
    takeDamage(amount) {
      this.hp -= amount; this.hitFlash = 1;
      if (this.isBoss) updateBossBar(this);
      if (this.hp <= 0) {
        this.alive = false;
        state.gold += this.reward;
        state.score += this.reward * (this.isBoss ? 25 : 10);
        if (this.isBoss) {
          sfx.playExplosion(true); hideBossBar(); state.activeBoss = null;
          spawnParticles(this.x, this.y, this.color, 45, 60);
          spawnFloatingText(this.x, this.y, `BOSS DESTROYED! +${this.reward}¢`, '#f0ff00');
          // Purge any remaining escorts so wave immediately concludes
          for (const en of state.enemies) {
            if (en.alive && en !== this) {
              en.alive = false;
              spawnParticles(en.x, en.y, '#00f0ff', 8);
            }
          }
          if (state.currentWaveData) state.currentWaveData.enemies = [];
        } else {
          sfx.playExplosion(false); spawnParticles(this.x, this.y, this.color, 12);
          spawnFloatingText(this.x, this.y, `+${this.reward}¢`, '#00ff88');
        }
        updateHUD();
      }
    }
    draw(ctx) {
      if (!this.alive) return;
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.beginPath(); ctx.ellipse(this.x + 3, this.y + 6, this.radius * 1.1, this.radius * 0.45, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.translate(this.x, this.y);
      const col = this.hitFlash > 0 ? '#ffffff' : this.color;

      if (this.isBoss) {
        const g = ctx.createRadialGradient(0, 0, 5, 0, 0, this.radius * 2.4);
        g.addColorStop(0, col + 'aa'); g.addColorStop(0.5, col + '33'); g.addColorStop(1, 'transparent');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, this.radius * 2.4, 0, Math.PI * 2); ctx.fill();

        ctx.save(); ctx.rotate(this.bossRotation);
        ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.shadowColor = col; ctx.shadowBlur = 18;
        ctx.beginPath(); ctx.arc(0, 0, this.radius * 1.25, 0, Math.PI * 2); ctx.stroke();
        for (let i = 0; i < 4; i++) {
          const a = (i / 4) * Math.PI * 2;
          ctx.beginPath(); ctx.moveTo(Math.cos(a) * this.radius * 1.2, Math.sin(a) * this.radius * 1.2);
          ctx.lineTo(Math.cos(a) * this.radius * 1.6, Math.sin(a) * this.radius * 1.6); ctx.stroke();
        }
        ctx.restore();

        ctx.save(); ctx.rotate(-this.bossRotation * 1.4);
        ctx.fillStyle = 'rgba(25, 4, 15, 0.95)'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          const px = Math.cos(a) * this.radius * 0.85, py = Math.sin(a) * this.radius * 0.85;
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = col; ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      } else {
        ctx.rotate(this.angle);
        const g = ctx.createRadialGradient(0, 0, 2, 0, 0, this.radius * 2);
        g.addColorStop(0, col + '88'); g.addColorStop(1, 'transparent');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, this.radius * 2, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = 'rgba(20,10,30,0.9)'; ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.shadowColor = col; ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(this.radius, 0); ctx.lineTo(0, this.radius * 0.7);
        ctx.lineTo(-this.radius * 0.6, this.radius * 0.4); ctx.lineTo(-this.radius * 0.4, 0);
        ctx.lineTo(-this.radius * 0.6, -this.radius * 0.4); ctx.lineTo(0, -this.radius * 0.7);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = col; ctx.beginPath(); ctx.arc(this.radius * 0.2, 0, 3, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();

      if (!this.isBoss && this.hp < this.maxHp) {
        const barW = this.radius * 2.2, ratio = Math.max(0, this.hp / this.maxHp);
        ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(this.x - barW / 2, this.y - this.radius - 10, barW, 4);
        ctx.fillStyle = ratio > 0.4 ? '#00ff88' : '#ff3366'; ctx.fillRect(this.x - barW / 2, this.y - this.radius - 10, barW * ratio, 4);
      }
    }
  }

  class Projectile {
    constructor(x, y, target, damage, speed, type, aoe, aoeR, color, angleOffset = 0, pierce = false, heavy = false, fx = {}) {
      this.x = x; this.y = y; this.target = target; this.damage = damage; this.speed = speed;
      this.type = type; this.aoe = aoe; this.aoeRadius = aoeR; this.color = color;
      this.alive = true; this.trail = []; this.angleOffset = angleOffset;
      this.pierce = pierce; this.heavy = heavy; this.hitList = []; this.life = pierce ? 1.4 : 2.5;
      this.fx = fx || {};
      this.dir = target ? Math.atan2(target.y - y, target.x - x) + angleOffset : angleOffset;
    }
    update(dt) {
      if (!this.alive) return;
      this.life -= dt;
      if (this.life <= 0) { this.alive = false; return; }
      if (!this.pierce && this.target && this.target.alive && this.target.hp > 0) {
        const desired = Math.atan2(this.target.y - this.y, this.target.x - this.x) + this.angleOffset;
        let diff = desired - this.dir;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        this.dir += diff * Math.min(1, dt * 8);
      }
      this.trail.push({ x: this.x, y: this.y });
      if (this.trail.length > 8) this.trail.shift();
      this.x += Math.cos(this.dir) * this.speed * dt;
      this.y += Math.sin(this.dir) * this.speed * dt;

      for (const e of state.enemies) {
        if (!e.alive || e.hp <= 0 || this.hitList.indexOf(e) >= 0) continue;
        const hitDistance = (e.isBoss ? e.radius + 6 : 14) + (this.heavy ? 6 : 0);
        if (dist(this, e) < hitDistance) {
          this.applyHit(e);
          if (!this.pierce) { this.alive = false; return; }
          this.hitList.push(e);
        }
      }
    }
    applyHit(e) {
      if (this.fx.isFrost) { e.slowTimer = 2.4; e.slowMult = this.fx.slowMult || 0.55; }
      if (this.fx.isBurn) { e.burnTimer = 3.0; e.burnDmg = this.fx.burnDmg || 9; }
      if (this.fx.isCorrupt) { e.vulnTimer = 3.5; e.vulnMult = this.fx.vulnMult || 1.35; }

      if (this.aoe) {
        for (const en of state.enemies) {
          if (en.alive && en.hp > 0 && dist(this, en) <= this.aoeRadius) {
            en.takeDamage(this.damage * (en === e ? 1 : 0.55));
            if (this.fx.isFrost) { en.slowTimer = 2.4; en.slowMult = this.fx.slowMult || 0.55; }
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
        const t = this.trail[i], alpha = (i / this.trail.length) * 0.5;
        ctx.fillStyle = this.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
        ctx.beginPath(); ctx.arc(t.x, t.y, (this.heavy ? 3 : 2) + i * 0.3, 0, Math.PI * 2); ctx.fill();
      }
      ctx.shadowColor = this.color; ctx.shadowBlur = this.heavy ? 18 : 12; ctx.fillStyle = this.color;
      ctx.beginPath(); ctx.arc(this.x, this.y, this.heavy ? 6 : 4, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  }

  // -------------------- PARTICLES & FLOATING TEXTS --------------------
  function spawnParticles(x, y, color, count, spread = 30) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2, speed = 40 + Math.random() * (spread * 3);
      state.particles.push({
        x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        life: 0.4 + Math.random() * 0.5, maxLife: 0.6, color, size: 2 + Math.random() * 3.5
      });
    }
  }
  function spawnFloatingText(x, y, text, color) {
    state.floatingTexts.push({ x, y, text, color, life: 1.2, vy: -30 });
  }
  function updateParticles(dt) {
    for (let i = state.particles.length - 1; i >= 0; i--) {
      const p = state.particles[i];
      p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.96; p.vy *= 0.96; p.life -= dt;
      if (p.life <= 0) state.particles.splice(i, 1);
    }
    for (let i = state.floatingTexts.length - 1; i >= 0; i--) {
      const f = state.floatingTexts[i];
      f.y += f.vy * dt; f.life -= dt;
      if (f.life <= 0) state.floatingTexts.splice(i, 1);
    }
  }
  function drawParticles(ctx) {
    for (const p of state.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color + Math.floor(alpha * 200).toString(16).padStart(2, '0');
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2); ctx.fill();
    }
    for (const f of state.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, f.life * 2); ctx.fillStyle = f.color;
      ctx.font = 'bold 14px Orbitron, sans-serif'; ctx.textAlign = 'center';
      ctx.shadowColor = f.color; ctx.shadowBlur = 6;
      ctx.fillText(f.text, f.x, f.y);
      ctx.restore();
    }
  }

  // -------------------- WAVE MANAGEMENT & TRANSITIONS --------------------
  function getWaveConfig(wave) {
    const isBossWave = !!CONFIG.BOSS_WAVES[wave];
    const bossData = CONFIG.BOSS_WAVES[wave] || null;
    const count = 6 + wave * 3, types = [];
    if (isBossWave) {
      const escorts = Math.floor(count * 0.6);
      for (let i = 0; i < escorts; i++) types.push(i % 2 === 0 ? 'fast' : 'tank');
      types.push({ type: 'boss', data: bossData });
    } else {
      for (let i = 0; i < count; i++) {
        let t = 'drone';
        if (wave >= 3 && Math.random() < 0.15 + wave * 0.02) t = 'fast';
        if (wave >= 5 && Math.random() < 0.1 + wave * 0.015) t = 'tank';
        types.push(t);
      }
    }
    return { enemies: types, spawnInterval: Math.max(0.45, 1.3 - wave * 0.06), isBossWave, bossData };
  }

  function startWave() {
    if (state.waveActive || state.gameOver || state.inTransition) return;
    const nextWave = state.wave + 1;
    const waveConfig = getWaveConfig(nextWave);
    if (waveConfig.isBossWave) {
      triggerBossWarning(waveConfig.bossData, () => executeWaveStart(waveConfig));
    } else {
      executeWaveStart(waveConfig);
    }
  }

  function executeWaveStart(waveConfig) {
    state.wave++;
    state.currentWaveData = waveConfig;
    state.waveEnemiesLeft = state.currentWaveData.enemies.length;
    state.waveActive = true;
    state.spawnTimer = 0.5;
    state.spawnInterval = state.currentWaveData.spawnInterval;
    updateHUD();
    document.getElementById('start-wave-btn').disabled = true;
  }

  function triggerBossWarning(bossData, onComplete) {
    const overlay = document.getElementById('boss-warning-overlay');
    document.getElementById('warning-boss-name').textContent = bossData.name;
    overlay.classList.remove('hidden');
    sfx.playEmergencyAlarm();
    setTimeout(() => {
      overlay.classList.add('hidden');
      if (onComplete) onComplete();
    }, 2200);
  }

  function spawnEnemy() {
    if (!state.currentWaveData || state.currentWaveData.enemies.length === 0) return;
    const item = state.currentWaveData.enemies.shift();
    if (typeof item === 'object' && item.type === 'boss') {
      const boss = new Enemy(state.wave, 'boss', item.data);
      state.activeBoss = boss;
      state.enemies.push(boss);
      showBossBar(item.data.name);
    } else {
      state.enemies.push(new Enemy(state.wave, item));
    }
    state.waveEnemiesLeft = state.currentWaveData.enemies.length + state.enemies.filter(e => e.alive).length;
  }

  function showBossBar(name) {
    document.getElementById('boss-name').textContent = name;
    document.getElementById('boss-hp-fill').style.width = '100%';
    document.getElementById('boss-hp-text').textContent = '100%';
    document.getElementById('boss-bar-container').classList.remove('hidden');
  }

  function updateBossBar(boss) {
    const pct = Math.round(Math.max(0, boss.hp / boss.maxHp) * 100);
    const fill = document.getElementById('boss-hp-fill'), txt = document.getElementById('boss-hp-text');
    if (fill) fill.style.width = `${pct}%`;
    if (txt) txt.textContent = `${pct}%`;
  }

  function hideBossBar() {
    document.getElementById('boss-bar-container').classList.add('hidden');
  }

  function checkWaveComplete() {
    if (!state.waveActive) return;
    if (!state.enemies.some(e => e.alive) && (!state.currentWaveData || state.currentWaveData.enemies.length === 0)) {
      state.waveActive = false;
      const isBossWave = !!CONFIG.BOSS_WAVES[state.wave];
      const bonus = 25 + state.wave * 5;
      state.gold += bonus;

      // Surge Miner evolution bonus on wave clear
      for (const t of state.towers) {
        if (t.type === 'miner' && t.evolved && t.evoData && t.evoData.waveBonus) {
          state.gold += t.evoData.waveBonus;
          spawnFloatingText(t.x, t.y - 25, `+${t.evoData.waveBonus}¢ SURGE`, '#10b981');
        }
      }

      updateHUD();
      sfx.playStageClear();
      if (state.wave >= CONFIG.MAX_WAVE) { endGame(true); return; }
      triggerStageTransition(state.wave, bonus, isBossWave);
    }
  }

  function triggerStageTransition(clearedWave, bonus, isBossWave = false) {
    state.inTransition = true;
    const overlay = document.getElementById('stage-transition-overlay');
    document.getElementById('stage-trans-title').textContent = isBossWave ? `APEX BOSS PURGED` : `WAVE ${clearedWave} PURGED`;
    const nextIsBoss = !!CONFIG.BOSS_WAVES[clearedWave + 1];
    const sub = document.getElementById('stage-trans-sub');
    if (isBossWave) {
      sub.textContent = 'TOPOLOGY RECONFIGURED // DEFENSE NODES REALLOCATED';
      sub.style.color = '#00f0ff';
    } else {
      sub.textContent = nextIsBoss ? '⚠️ CRITICAL: APEX SIGNATURE DETECTED IN NEXT SECTOR' : 'DATA INTEGRITY SECURED // NODE RECHARGED';
      sub.style.color = nextIsBoss ? '#ff2244' : '#f0ff00';
    }
    document.getElementById('stage-stats-preview').textContent = `+${bonus}¢ RECHARGE BONUS`;

    overlay.classList.remove('hidden');
    setTimeout(() => overlay.classList.add('show'), 20);

    // Reconfigure map route and randomly reallocate towers upon defeating a stage boss
    if (isBossWave) {
      setTimeout(() => {
        reconfigureMapAndTowers();
      }, 350);
    }

    setTimeout(() => {
      overlay.classList.remove('show');
      setTimeout(() => {
        overlay.classList.add('hidden');
        state.inTransition = false;
        document.getElementById('start-wave-btn').disabled = false;
        const autoCheck = document.getElementById('auto-wave-check');
        if (autoCheck && autoCheck.checked && !state.gameOver && !state.waveActive) startWave();
      }, 400);
    }, isBossWave ? 2200 : 1600);
  }

  // -------------------- SUMMON & MERGE --------------------
  function summonTower() {
    const cost = getSummonCost();
    if (state.gold < cost || state.gameOver || state.inTransition) return;
    const free = state.placementSpots.filter(s => !s.occupied);
    if (free.length === 0) { spawnFloatingText(W / 2, 80, 'NO SPACE', '#ff6600'); return; }

    const spot = free[Math.floor(Math.random() * free.length)];
    const type = randomType();
    const tower = new Tower(spot.x, spot.y, type, 1);
    tower.spot = spot; spot.occupied = true;
    state.towers.push(tower);
    state.gold = Math.max(0, state.gold - cost);
    state.summonCount = (state.summonCount || 0) + 1;
    sfx.playDeploy();
    spawnParticles(spot.x, spot.y, TOWER_TYPES[type].color, 10);
    spawnFloatingText(spot.x, spot.y - 20, 'DEPLOYED', TOWER_TYPES[type].color);
    updateHUD();
  }

  function tryMerge(target, dragged) {
    if (!target || !dragged || target === dragged || target.evolved || dragged.evolved) return false;
    if (target.type !== dragged.type || target.level !== dragged.level || target.level >= CONFIG.MERGE_MAX_LEVEL) return false;

    target.level++; target.pulse = 0;
    if (dragged.spot) dragged.spot.occupied = false;
    const idx = state.towers.indexOf(dragged);
    if (idx >= 0) state.towers.splice(idx, 1);

    sfx.playMerge();
    spawnParticles(target.x, target.y, target.stats.color, 24);
    spawnFloatingText(target.x, target.y - 28, `LV.${target.level}!`, target.stats.color);
    return true;
  }

  function autoUpgrade() {
    if (state.gameOver || !state.running || state.inTransition) return;
    let mergedCount = 0;
    let foundMerge = true;
    let safetyCounter = 0;

    while (foundMerge && safetyCounter < 100) {
      safetyCounter++;
      foundMerge = false;
      // Filter towers: unevolved and level < 5 (Evolution will not upgrade automatically)
      const candidates = state.towers.filter(t => !t.evolved && t.level < 5);
      candidates.sort((a, b) => a.level - b.level);

      for (let i = 0; i < candidates.length; i++) {
        for (let j = i + 1; j < candidates.length; j++) {
          const t1 = candidates[i], t2 = candidates[j];
          if (t1.type === t2.type && t1.level === t2.level) {
            if (tryMerge(t1, t2)) {
              mergedCount++;
              foundMerge = true;
              break;
            }
          }
        }
        if (foundMerge) break;
      }
    }

    if (mergedCount > 0) {
      sfx.playMerge();
      spawnFloatingText(W / 2, H * 0.35, `AUTO MERGED ${mergedCount} PROGRAM${mergedCount > 1 ? 'S' : ''}!`, '#00f0ff');
      updateHUD();
    } else {
      spawnFloatingText(W / 2, H * 0.35, 'NO MERGEABLE UNITS (< LV.5)', '#ff6600');
    }
  }

  function clearHighlights() {
    for (const t of state.towers) { t.mergeHighlight = false; t.selected = false; }
  }

  function findTowerAt(pos, exclude) {
    if (!pos) return null;
    let best = null, bestD = Infinity;
    for (const t of state.towers) {
      if (t === exclude) continue;
      const d = dist(pos, t), hitR = Math.max(40, 26 + t.level * 3.5);
      if (d < hitR && d < bestD) { bestD = d; best = t; }
    }
    return best;
  }

  // -------------------- TOUCH & POINTER INPUT (DRAG & TAP TO MERGE) --------------------
  function getPointerPos(e) {
    const rect = canvas.getBoundingClientRect();
    let cx = e.clientX, cy = e.clientY;
    if (cx === undefined && e.touches && e.touches.length > 0) {
      cx = e.touches[0].clientX; cy = e.touches[0].clientY;
    } else if (cx === undefined && e.changedTouches && e.changedTouches.length > 0) {
      cx = e.changedTouches[0].clientX; cy = e.changedTouches[0].clientY;
    }
    if (cx === undefined) { cx = 0; cy = 0; }
    return {
      x: (cx - rect.left) * (canvas.width / (rect.width || 1)),
      y: (cy - rect.top) * (canvas.height / (rect.height || 1))
    };
  }

  let dragHasMoved = false;

  function onPointerDown(e) {
    if (state.gameOver || !state.running || state.inTransition) return;
    if (e.cancelable && e.preventDefault) e.preventDefault();
    sfx.init();

    const pos = getPointerPos(e), tower = findTowerAt(pos);
    dragHasMoved = false;

    if (!tower) {
      clearHighlights();
      state.selectedTower = null;
      hideTooltip();
      return;
    }

    // Tap-to-Merge: If user taps another matching tower while one is selected
    if (state.selectedTower && state.selectedTower !== tower) {
      if (tryMerge(tower, state.selectedTower)) {
        clearHighlights();
        state.selectedTower = null;
        hideTooltip();
        return;
      }
    }

    if (e.pointerId !== undefined && canvas.setPointerCapture) {
      try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
    }

    state.draggingTower = tower;
    state.dragOffsetX = pos.x - tower.x;
    state.dragOffsetY = pos.y - tower.y;
    state.dragX = tower.x;
    state.dragY = tower.y;
    state.dragStartX = pos.x;
    state.dragStartY = pos.y;

    clearHighlights();
    tower.selected = true;
    state.selectedTower = tower;

    for (const t of state.towers) {
      if (t !== tower && !t.evolved && !tower.evolved && t.type === tower.type && t.level === tower.level && t.level < CONFIG.MERGE_MAX_LEVEL) {
        t.mergeHighlight = true;
      }
    }
    canvas.style.cursor = 'grabbing';
    hideTooltip();
  }

  function onPointerMove(e) {
    if (!state.draggingTower) {
      if (state.gameOver) return;
      if (e.pointerType === 'mouse' || (!e.touches && e.clientX !== undefined)) {
        const t = findTowerAt(getPointerPos(e));
        if (t) showTooltip(t, e); else hideTooltip();
      }
      return;
    }

    if (e.cancelable && e.preventDefault) e.preventDefault();
    const pos = getPointerPos(e);
    const moved = Math.hypot(pos.x - state.dragStartX, pos.y - state.dragStartY);
    if (moved > 10) dragHasMoved = true;

    state.dragX = pos.x - state.dragOffsetX;
    state.dragY = pos.y - state.dragOffsetY;
  }

  function onPointerUp(e) {
    if (!state.draggingTower) return;
    if (e.cancelable && e.preventDefault) e.preventDefault();
    if (e.pointerId !== undefined && canvas.releasePointerCapture) {
      try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}
    }

    const cur = getPointerPos(e), dropPos = { x: state.dragX, y: state.dragY };

    if (dragHasMoved) {
      // Drag-and-drop: check both visual dragged position and finger release position
      const target = findTowerAt(dropPos, state.draggingTower) || findTowerAt(cur, state.draggingTower);
      if (target && tryMerge(target, state.draggingTower)) {
        clearHighlights();
        state.selectedTower = null;
      } else {
        state.selectedTower = state.draggingTower;
      }
    } else {
      // Tap selection / Evolution check
      if (state.draggingTower.level >= 5 && !state.draggingTower.evolved) {
        openEvolutionPanel(state.draggingTower);
        clearHighlights();
        state.selectedTower = null;
      } else {
        state.selectedTower = state.draggingTower;
      }
    }

    state.draggingTower = null;
    canvas.style.cursor = 'crosshair';
    hideTooltip();
  }

  function openEvolutionPanel(tower) {
    const opts = EVOLUTIONS[tower.type];
    if (!opts) return;
    state.evoTarget = tower;
    const [choiceA, choiceB] = opts;
    document.getElementById('evo-name-a').textContent = choiceA.name;
    document.getElementById('evo-detail-a').textContent = choiceA.detail;
    document.getElementById('evo-name-b').textContent = choiceB.name;
    document.getElementById('evo-detail-b').textContent = choiceB.detail;
    document.getElementById('evo-desc').textContent = `Select an advanced form for this Level ${tower.level} ${TOWER_TYPES[tower.type].name} program.`;
    document.getElementById('evo-overlay').classList.remove('hidden');
  }

  function applyEvolution(index) {
    const tower = state.evoTarget, opts = tower ? EVOLUTIONS[tower.type] : null;
    if (!tower || !opts || !opts[index]) return;
    tower.evolved = true; tower.evoData = opts[index]; tower.pulse = 0;
    sfx.playMerge();
    spawnParticles(tower.x, tower.y, opts[index].color, 28);
    spawnFloatingText(tower.x, tower.y - 30, opts[index].name, opts[index].color);
    closeEvolutionPanel();
  }

  function closeEvolutionPanel() {
    state.evoTarget = null;
    document.getElementById('evo-overlay').classList.add('hidden');
  }

  function showTooltip(tower, e) {
    const tip = document.getElementById('tooltip'), s = tower.stats;
    let extra = tower.evolved ? '<br><span style="color:#f0ff00">EVOLVED FORM</span>'
      : (tower.level >= 5 ? '<br><span style="color:#f0ff00">Click to choose EVOLUTION</span>'
      : '<br><span style="opacity:0.7;font-size:10px">Drag onto same type &amp; level to merge</span>');
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

  function hideTooltip() { document.getElementById('tooltip').classList.add('hidden'); }

  // -------------------- RENDER LOOP --------------------
  function drawBackground(ctx) {
    ctx.fillStyle = '#060610'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(0, 80, 120, 0.12)'; ctx.lineWidth = 1;
    const gs = 40;
    for (let x = 0; x < W; x += gs) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += gs) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    const t = performance.now() * 0.0003;
    const g1 = ctx.createRadialGradient(W * 0.3 + Math.sin(t) * 50, H * 0.3, 0, W * 0.3, H * 0.3, 250);
    g1.addColorStop(0, 'rgba(0, 60, 100, 0.12)'); g1.addColorStop(1, 'transparent');
    ctx.fillStyle = g1; ctx.fillRect(0, 0, W, H);

    const g2 = ctx.createRadialGradient(W * 0.7 + Math.cos(t * 1.3) * 40, H * 0.6, 0, W * 0.7, H * 0.6, 220);
    g2.addColorStop(0, 'rgba(80, 0, 60, 0.1)'); g2.addColorStop(1, 'transparent');
    ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H);
  }

  function drawPath(ctx) {
    if (state.path.length < 2) return;
    ctx.save();
    ctx.lineWidth = CONFIG.PATH_WIDTH + 16; ctx.strokeStyle = 'rgba(0, 200, 255, 0.08)';
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(state.path[0].x, state.path[0].y);
    for (let i = 1; i < state.path.length; i++) ctx.lineTo(state.path[i].x, state.path[i].y);
    ctx.stroke();

    ctx.lineWidth = CONFIG.PATH_WIDTH; ctx.strokeStyle = 'rgba(0, 40, 70, 0.85)'; ctx.stroke();
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0, 240, 255, 0.5)';
    ctx.shadowColor = '#00f0ff'; ctx.shadowBlur = 12; ctx.stroke();

    ctx.shadowBlur = 0; ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
    ctx.setLineDash([8, 10]); ctx.stroke(); ctx.setLineDash([]);

    const start = state.path[0], end = state.path[state.path.length - 1];
    ctx.shadowColor = '#00ff88'; ctx.shadowBlur = 20; ctx.fillStyle = 'rgba(0, 255, 136, 0.3)';
    ctx.beginPath(); ctx.arc(start.x, start.y, 22, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#00ff88'; ctx.lineWidth = 2; ctx.stroke();

    ctx.shadowColor = '#ff00aa'; ctx.shadowBlur = 25; ctx.fillStyle = 'rgba(255, 0, 170, 0.25)';
    ctx.beginPath(); ctx.arc(end.x, end.y, 26, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ff00aa'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#ff00aa'; ctx.beginPath(); ctx.arc(end.x, end.y, 8, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawPlacementHints(ctx) {
    if (state.towers.length > 12) return;
    ctx.save();
    for (const s of state.placementSpots) {
      if (s.occupied) continue;
      ctx.fillStyle = 'rgba(0, 240, 255, 0.08)';
      ctx.beginPath(); ctx.arc(s.x, s.y, 6, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  function update(dt) {
    if (state.gameOver) return;
    if (state.waveActive && state.currentWaveData && state.currentWaveData.enemies.length > 0) {
      state.spawnTimer -= dt;
      if (state.spawnTimer <= 0) { spawnEnemy(); state.spawnTimer = state.spawnInterval; }
    }
    for (const t of state.towers) t.update(dt);
    for (const e of state.enemies) e.update(dt);
    for (const p of state.projectiles) p.update(dt);
    state.enemies = state.enemies.filter(e => e.alive);
    state.projectiles = state.projectiles.filter(p => p.alive);
    updateParticles(dt);
    checkWaveComplete();
  }

  function draw() {
    drawBackground(ctx); drawPath(ctx); drawPlacementHints(ctx);
    for (const t of state.towers) {
      if (t === state.draggingTower) { ctx.save(); ctx.globalAlpha = 0.3; t.draw(ctx); ctx.restore(); }
      else t.draw(ctx);
    }
    for (const e of state.enemies) e.draw(ctx);
    for (const p of state.projectiles) p.draw(ctx);
    drawParticles(ctx);
    if (state.draggingTower) {
      state.draggingTower.draw(ctx, state.dragX, state.dragY);
      ctx.save();
      ctx.fillStyle = 'rgba(0, 240, 255, 0.7)'; ctx.font = '13px Orbitron'; ctx.textAlign = 'center';
      ctx.shadowColor = '#00f0ff'; ctx.shadowBlur = 8;
      ctx.fillText('Drop on matching program to MERGE', W / 2, 26);
      ctx.restore();
    }
  }

  function loop(ts) {
    const rawDt = Math.min(0.05, (ts - state.lastTime) / 1000) || 0.016;
    state.lastTime = ts;
    const speedBox = document.getElementById('speed-check');
    const speedMultiplier = (speedBox && speedBox.checked) ? 2 : 1;
    const dt = rawDt * speedMultiplier;
    if (state.running) update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  
  // ============================================================
  // TEAM BUILDER / SQUAD LOADOUT SYSTEM
  // ============================================================
  function renderTitleSquad() {
    const container = document.getElementById('title-squad-chips');
    if (!container) return;
    container.innerHTML = '';
    state.equippedTowers.forEach(k => {
      const t = TOWER_TYPES[k];
      if (!t) return;
      const chip = document.createElement('div');
      chip.className = 'squad-chip';
      chip.style.setProperty('--chip-color', t.color);
      chip.innerHTML = `
        <span class="squad-chip-name">${t.name}</span>
        <span class="squad-chip-role">${t.role}</span>
      `;
      container.appendChild(chip);
    });
  }

  function openTeamModal() {
    state.modalSquad = [...state.equippedTowers];
    renderTeamModal();
    document.getElementById('team-modal').classList.remove('hidden');
  }

  function closeTeamModal() {
    document.getElementById('team-modal').classList.add('hidden');
  }

  function renderTeamModal() {
    const slotsEl = document.getElementById('modal-squad-slots');
    slotsEl.innerHTML = '';
    for (let i = 0; i < 4; i++) {
      const key = state.modalSquad[i];
      const slot = document.createElement('div');
      if (key && TOWER_TYPES[key]) {
        const t = TOWER_TYPES[key];
        slot.className = 'squad-slot-card';
        slot.style.setProperty('--slot-color', t.color);
        slot.innerHTML = `
          <span class="slot-name">${t.name}</span>
          <span class="slot-role">${t.role}</span>
          <span class="slot-remove-badge">× TAP REMOVE</span>
        `;
        slot.addEventListener('click', () => {
          if (state.modalSquad.length > 1) {
            state.modalSquad.splice(i, 1);
            renderTeamModal();
          }
        });
      } else {
        slot.className = 'squad-slot-card empty';
        slot.innerHTML = `<span class="empty-text">+ EMPTY SLOT</span>`;
      }
      slotsEl.appendChild(slot);
    }

    document.getElementById('squad-count-text').textContent = `${state.modalSquad.length}/4`;

    const rosterEl = document.getElementById('modal-roster-grid');
    rosterEl.innerHTML = '';
    ALL_TYPE_KEYS.forEach(k => {
      const t = TOWER_TYPES[k];
      const isEq = state.modalSquad.includes(k);
      const card = document.createElement('div');
      card.className = `roster-card ${isEq ? 'equipped' : ''}`;
      card.style.setProperty('--card-color', t.color);

      let statInfo = '';
      if (t.isBuffer) statInfo = `BUFF: +${Math.round(t.buffDmg * 100)}% DMG | +${Math.round(t.buffRate * 100)}% SPD`;
      else if (t.isMiner) statInfo = `YIELD: +${t.mineBase}¢ every ${t.mineInterval}s`;
      else if (t.isTesla) statInfo = `DMG: High Arc | RNG: Short (55px)`;
      else statInfo = `DMG: ${Math.round(CONFIG.TOWER_DAMAGE_BASE * t.damageMult)} | RNG: ${Math.round(CONFIG.TOWER_RANGE_BASE * t.rangeMult)} | RATE: ${(CONFIG.TOWER_FIRE_RATE_BASE * t.rateMult).toFixed(1)}/s`;

      card.innerHTML = `
        <div class="card-top-row">
          <span class="card-title">${t.name}</span>
          <span class="card-role-tag">${t.role}</span>
        </div>
        <p class="card-desc">${t.desc}</p>
        <div class="card-stats-row">${statInfo}</div>
        <span class="card-status-badge ${isEq ? 'eq' : 'avail'}">${isEq ? '✓ EQUIPPED IN SQUAD' : '+ TAP TO EQUIP'}</span>
      `;

      card.addEventListener('click', () => {
        if (isEq) {
          if (state.modalSquad.length > 1) {
            state.modalSquad = state.modalSquad.filter(x => x !== k);
            renderTeamModal();
          }
        } else {
          if (state.modalSquad.length < 4) {
            state.modalSquad.push(k);
            renderTeamModal();
          } else {
            state.modalSquad[3] = k;
            renderTeamModal();
          }
        }
      });
      rosterEl.appendChild(card);
    });

    const confirmBtn = document.getElementById('team-confirm-btn');
    confirmBtn.disabled = state.modalSquad.length !== 4;
  }

  function confirmTeamLoadout() {
    if (state.modalSquad.length !== 4) return;
    state.equippedTowers = [...state.modalSquad];
    try {
      localStorage.setItem('cdd_squad', JSON.stringify(state.equippedTowers));
    } catch (_) {}
    renderTitleSquad();
    closeTeamModal();
  }

  function setDefaultTeamLoadout() {
    state.modalSquad = ['plasma', 'missile', 'laser', 'buffer'];
    renderTeamModal();
  }

  // -------------------- UI & LIFECYCLE --------------------
  function updateHUD() {
    const cost = getSummonCost();
    document.getElementById('gold').textContent = state.gold;
    document.getElementById('lives').textContent = state.lives;
    document.getElementById('wave').textContent = state.wave;
    document.getElementById('score').textContent = state.score;
    const costEl = document.querySelector('#summon-btn .btn-cost');
    if (costEl) costEl.textContent = `${cost}¢`;
    document.getElementById('summon-btn').disabled = state.gold < cost || state.gameOver || state.inTransition;
  }

  function endGame(won) {
    state.gameOver = true; state.running = false; hideBossBar();
    const overlay = document.getElementById('game-over-overlay');
    const title = document.getElementById('go-title');
    title.textContent = won ? 'CORE SECURED' : 'CORE CORRUPTED';
    title.style.color = won ? '#00ff88' : '#ff00aa';
    document.getElementById('go-sub').textContent = won ? 'MALWARE PURGED — ALL SUBNETS SAFE' : 'SECTOR OVERRUN BY VIRAL ENTITY';
    document.getElementById('go-score').textContent = state.score;
    document.getElementById('go-wave').textContent = `${state.wave}/${CONFIG.MAX_WAVE}`;
    overlay.classList.remove('hidden');
  }

  function restart() {
    state.gold = CONFIG.START_GOLD; state.lives = CONFIG.START_LIVES;
    state.score = 0; state.wave = 0; state.summonCount = 0; state.running = true; state.gameOver = false;
    state.selectedTower = null; state.draggingTower = null;
    state.towers = []; state.enemies = []; state.projectiles = [];
    state.particles = []; state.floatingTexts = [];
    state.waveActive = false; state.waveEnemiesLeft = 0;
    state.currentWaveData = null; state.activeBoss = null; state.inTransition = false;
    for (const s of state.placementSpots) s.occupied = false;
    hideBossBar();
    document.getElementById('game-over-overlay').classList.add('hidden');
    document.getElementById('start-wave-btn').disabled = false;
    updateHUD();
  }

  function resize() {
    const container = document.getElementById('game-container'), hud = document.getElementById('hud');
    const rect = container.getBoundingClientRect();
    const oldW = W, oldH = H;
    W = Math.floor(rect.width);
    H = Math.floor(rect.height - (hud ? hud.offsetHeight : 0));
    canvas.width = W;
    canvas.height = H;

    if (state.path.length === 0) {
      generatePath();
      generatePlacementSpots();
    } else if (oldW && oldH && (W !== oldW || H !== oldH)) {
      const oldIsPortrait = oldH > oldW * 1.15;
      const newIsPortrait = H > W * 1.15;
      if (oldIsPortrait !== newIsPortrait && state.towers.length === 0 && !state.waveActive) {
        // Safe to regenerate path on empty board orientation change
        generatePath();
        generatePlacementSpots();
      } else {
        // Fluid scale existing coordinates
        const sx = W / oldW, sy = H / oldH;
        for (const p of state.path) { p.x *= sx; p.y *= sy; }
        for (const s of state.placementSpots) { s.x *= sx; s.y *= sy; }
        for (const t of state.towers) { t.x *= sx; t.y *= sy; }
      }
    }
  }

  function toggleAudio() {
    sfx.init(); sfx.enabled = !sfx.enabled;
    document.getElementById('audio-icon').textContent = sfx.enabled ? '🔊 SFX ON' : '🔇 SFX OFF';
  }

  function init() {
    resize();
    window.addEventListener('resize', () => {
      const oldW = W, oldH = H; resize();
      if (oldW && oldH && (W !== oldW || H !== oldH)) {
        const sx = W / oldW, sy = H / oldH;
        for (const p of state.path) { p.x *= sx; p.y *= sy; }
        for (const s of state.placementSpots) { s.x *= sx; s.y *= sy; }
        for (const t of state.towers) { t.x *= sx; t.y *= sy; }
      }
    });

    document.getElementById('summon-btn').addEventListener('click', summonTower);
    document.getElementById('start-wave-btn').addEventListener('click', startWave);
    const autoMergeBtn = document.getElementById('auto-merge-btn');
    if (autoMergeBtn) autoMergeBtn.addEventListener('click', autoUpgrade);
    document.getElementById('restart-btn').addEventListener('click', restart);
    document.getElementById('audio-toggle-btn').addEventListener('click', toggleAudio);

        document.getElementById('title-team-btn').addEventListener('click', openTeamModal);
    document.getElementById('team-confirm-btn').addEventListener('click', confirmTeamLoadout);
    document.getElementById('team-preset-btn').addEventListener('click', setDefaultTeamLoadout);
    document.getElementById('team-cancel-btn').addEventListener('click', closeTeamModal);
    renderTitleSquad();

    document.getElementById('title-start-btn').addEventListener('click', () => {
      sfx.init();
      document.getElementById('title-screen-overlay').classList.add('hidden');
      state.running = true;
    });

    const guideModal = document.getElementById('guide-modal');
    document.getElementById('title-guide-btn').addEventListener('click', () => guideModal.classList.toggle('hidden'));
    document.getElementById('close-guide-btn').addEventListener('click', () => guideModal.classList.add('hidden'));

    document.getElementById('evo-choice-a').addEventListener('click', () => applyEvolution(0));
    document.getElementById('evo-choice-b').addEventListener('click', () => applyEvolution(1));
    document.getElementById('evo-cancel').addEventListener('click', closeEvolutionPanel);

    // Modern Pointer Events for Mobile and Desktop
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);

    // Fallback Touch Listeners
    canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        if (e.cancelable && e.preventDefault) e.preventDefault();
        onPointerDown(e.touches[0]);
      }
    }, { passive: false });
    window.addEventListener('touchmove', (e) => {
      if (state.draggingTower && e.touches.length === 1) {
        if (e.cancelable && e.preventDefault) e.preventDefault();
        onPointerMove(e.touches[0]);
      }
    }, { passive: false });
    window.addEventListener('touchend', (e) => {
      if (state.draggingTower) {
        if (e.cancelable && e.preventDefault) e.preventDefault();
        onPointerUp(e.changedTouches[0] || e);
      }
    });

    window.addEventListener('pointerdown', () => sfx.init(), { once: true });
    window.addEventListener('touchstart', () => sfx.init(), { once: true });

    updateHUD();
    requestAnimationFrame(loop);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
