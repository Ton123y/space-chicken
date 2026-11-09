const CONFIG = { width: 800, height: 600, lives: 3, playerSpeed: 285, laserSpeed: 560 };

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const waveEl = document.getElementById('wave');
const creditsEl = document.getElementById('credits');

const defaultSave = {
    credits: 0,
    ownedSkins: ['neon'],
    activeSkin: 'neon',
    fireLevel: 0,
    speedLevel: 0,
    shieldLevel: 0,
    magnetLevel: 0,
    bombLevel: 2,
    armorLevel: 0,
    criticalLevel: 0,
    droneLevel: 0
};

let save = loadSave();
let score = 0;
let lives = CONFIG.lives;
let wave = 1;
let running = false;
let gameOverShown = false;
let player;
let lasers = [];
let eggs = [];
let chickens = [];
let particles = [];
let pickups = [];
let shake = 0;
let lastTime = 0;
let shotCooldown = 0;
let earnedThisRun = 0;
let shieldTime = 0;
let waveIntroActive = false;
let waveIntroToken = 0;
let paused = false;
const waveMessages = [
    'Amazing! Keep going!',
    'Great shot!',
    'You got this!',
    'Nice work!',
    'Stay sharp!',
    'Well done! Next wave!'
];

const keys = {};
const skins = {
    neon:     { name: 'Neon Blue', price: 0, color: '#00f5d4', glow: '#00f5d4', tier: 0, shape: 'dart' },
    gold:     { name: 'Solar Gold', price: 180, color: '#ffd166', glow: '#ff9f1c', tier: 0, shape: 'wings' },
    inferno:  { name: 'Inferno Pink', price: 320, color: '#ff3cac', glow: '#ff175c', tier: 1, shape: 'blade' },
    phantom:  { name: 'Void Purple', price: 500, color: '#b79cff', glow: '#9b5cff', tier: 1, shape: 'stealth' },
    phoenix:  { name: 'Phoenix Firebird', price: 650, color: '#ff7b24', glow: '#ff315b', tier: 2, shape: 'phoenix' },
    cyberjet: { name: 'Cyber-Jet Silver', price: 780, color: '#bfeaff', glow: '#5dbdff', tier: 2, shape: 'jet' },
    spectral: { name: 'Spectral Wraith', price: 920, color: '#69ffca', glow: '#00b8ff', tier: 2, shape: 'spectral' },
    crusher:  { name: 'Gold Crusher', price: 1100, color: '#fff0a1', glow: '#e5a000', tier: 3, shape: 'crusher' },
    raven:    { name: 'Obsidian Raven', price: 1280, color: '#f0f2ff', glow: '#786cff', tier: 3, shape: 'raven' },
    frost:    { name: 'Arctic Valkyrie', price: 1450, color: '#d8ffff', glow: '#42d9ff', tier: 3, shape: 'valkyrie' },
    vortex:   { name: 'Quantum Vortex', price: 1650, color: '#f1aaff', glow: '#9e35ff', tier: 4, shape: 'vortex' },
    plasma:   { name: 'Plasma Ronin', price: 1880, color: '#b8ffdf', glow: '#08ff85', tier: 4, shape: 'ronin' },
    eclipse:  { name: 'Solar Eclipse', price: 2200, color: '#ffcf70', glow: '#ff3d00', tier: 5, shape: 'eclipse' },
    celeste:  { name: 'Celeste Crown', price: 2600, color: '#ffffff', glow: '#87afff', tier: 5, shape: 'celeste' }
};

const shopShipPaths = {
    neon: 'M30 2 38 17 55 44 39 38 30 50 21 38 5 44 22 17Z',
    gold: 'M30 2 35 16 49 21 43 36 30 47 17 36 11 21 25 16Z',
    inferno: 'M30 1 40 13 35 26 58 44 37 38 30 52 23 38 2 44 25 26 20 13Z',
    phantom: 'M30 1 49 48 30 39 11 48Z',
    phoenix: 'M30 2 42 18 58 46 40 37 30 52 20 37 2 46 18 18Z',
    cyberjet: 'M30 3 37 16 56 31 42 39 30 48 18 39 4 31 23 16Z',
    spectral: 'M30 1 49 48 30 39 11 48Z',
    crusher: 'M30 1 42 12 54 16 48 38 36 35 30 52 24 35 12 38 6 16 18 12Z',
    raven: 'M30 2 43 20 54 10 48 34 39 39 30 52 21 39 12 34 6 10 17 20Z',
    frost: 'M30 1 37 19 52 29 46 42 35 36 30 52 25 36 14 42 8 29 23 19Z',
    vortex: 'M30 1 38 14 56 22 48 42 36 36 30 52 24 36 12 42 4 22 22 14Z',
    plasma: 'M30 3 37 16 56 31 42 39 30 48 18 39 4 31 23 16Z',
    eclipse: 'M30 2 42 18 58 46 40 37 30 52 20 37 2 46 18 18Z',
    celeste: 'M30 2 36 14 47 8 44 24 57 38 42 37 30 52 18 37 3 38 16 24 13 8 24 14Z'
};

const stars = Array.from({ length: 150 }, () => ({
    x: Math.random() * CONFIG.width,
    y: Math.random() * CONFIG.height,
    r: Math.random() * 1.8 + .25,
    speed: Math.random() * 18 + 5,
    alpha: Math.random() * .7 + .3
}));

function loadSave() {
    try {
        return { ...defaultSave, ...JSON.parse(localStorage.getItem('spaceChickenSave')) };
    } catch {
        return { ...defaultSave };
    }
}

function persistSave() {
    localStorage.setItem('spaceChickenSave', JSON.stringify(save));
    updateCredits();
}

function updateCredits() {
    creditsEl.textContent = save.credits;
    if (document.getElementById('shopCredits')) document.getElementById('shopCredits').textContent = save.credits;
}

window.addEventListener('keydown', event => {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(event.code)) event.preventDefault();
    keys[event.code] = true;
    if (event.code === 'KeyR' && !running) startGame();
    if (event.code === 'Escape' && !document.getElementById('homeScreen').classList.contains('active')
        && !document.getElementById('shopScreen').classList.contains('active')) {
        if (paused) resumeGame();
        else pauseGame();
    }
});

window.addEventListener('keyup', event => { keys[event.code] = false; });

class Player {
    constructor() {
        this.width = 64;
        this.height = 44;
        this.x = CONFIG.width / 2 - this.width / 2;
        this.y = CONFIG.height - 72;
        this.skin = skins[save.activeSkin] || skins.neon;
    }

    update(dt) {
        const speed = CONFIG.playerSpeed + save.speedLevel * 38;
        if (keys.ArrowLeft || keys.KeyA) this.x -= speed * dt;
        if (keys.ArrowRight || keys.KeyD) this.x += speed * dt;
        if (keys.ArrowUp || keys.KeyW) this.y -= speed * dt;
        if (keys.ArrowDown || keys.KeyS) this.y += speed * dt;
        this.x = Math.max(0, Math.min(CONFIG.width - this.width, this.x));
        this.y = Math.max(360, Math.min(CONFIG.height - this.height, this.y));
    }

    shoot() {
        lasers.push(new Laser(this.x + 30, this.y, this.skin.glow));
        if (save.fireLevel >= 2) {
            lasers.push(new Laser(this.x + 10, this.y + 12, this.skin.glow));
            lasers.push(new Laser(this.x + 50, this.y + 12, this.skin.glow));
        }
        if (save.fireLevel >= 3) lasers.push(new Laser(this.x + 30, this.y - 3, '#fff', -0.18));
        if (save.fireLevel >= 4) {
            lasers.push(new Laser(this.x + 30, this.y, '#fff', 0.18));
            lasers.push(new Laser(this.x + 30, this.y, '#fff', -0.18));
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.shadowBlur = 24;
        ctx.shadowColor = this.skin.glow;
        const flame = 18 + Math.random() * 18;
        const exhaust = ctx.createLinearGradient(0, 16, 0, 42 + flame);
        exhaust.addColorStop(0, '#fff'); exhaust.addColorStop(.25, '#72f5ff');
        exhaust.addColorStop(.55, '#8a4cff'); exhaust.addColorStop(1, 'rgba(255,45,149,0)');
        ctx.fillStyle = exhaust;
        ctx.beginPath(); ctx.moveTo(-13, 16); ctx.quadraticCurveTo(0, 34 + flame, 13, 16); ctx.closePath(); ctx.fill();
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = 'rgba(255,255,255,.8)';
        ctx.beginPath(); ctx.moveTo(-4, 17); ctx.quadraticCurveTo(0, 31 + flame * .55, 4, 17); ctx.closePath(); ctx.fill();
        ctx.globalCompositeOperation = 'source-over';

        const hull = ctx.createLinearGradient(-32, 0, 32, 20);
        hull.addColorStop(0, '#101827'); hull.addColorStop(.38, '#4c6078');
        hull.addColorStop(.52, '#d8e8f1'); hull.addColorStop(.68, '#53677f');
        hull.addColorStop(1, '#101827');
        ctx.fillStyle = hull;
        ctx.strokeStyle = this.skin.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        const shipShape = this.skin.shape;
        if (shipShape === 'wings' || shipShape === 'gold') {
            ctx.moveTo(0, -29); ctx.lineTo(7, -7); ctx.lineTo(28, 0); ctx.lineTo(19, 22);
            ctx.lineTo(0, 27); ctx.lineTo(-19, 22); ctx.lineTo(-28, 0); ctx.lineTo(-7, -7); ctx.closePath();
        } else if (shipShape === 'blade' || shipShape === 'inferno') {
            ctx.moveTo(0, -30); ctx.lineTo(14, -12); ctx.lineTo(7, 5); ctx.lineTo(40, 22);
            ctx.lineTo(12, 13); ctx.lineTo(0, 27); ctx.lineTo(-12, 13); ctx.lineTo(-40, 22);
            ctx.lineTo(-7, 5); ctx.lineTo(-14, -12); ctx.closePath();
        } else if (shipShape === 'raven') {
            ctx.moveTo(0, -29); ctx.lineTo(19, -4); ctx.lineTo(36, -19); ctx.lineTo(27, 16);
            ctx.lineTo(14, 23); ctx.lineTo(0, 27); ctx.lineTo(-14, 23); ctx.lineTo(-27, 16);
            ctx.lineTo(-36, -19); ctx.lineTo(-19, -4); ctx.closePath();
        } else if (shipShape === 'valkyrie' || shipShape === 'frost') {
            ctx.moveTo(0, -30); ctx.lineTo(10, -3); ctx.lineTo(32, 12); ctx.lineTo(24, 27);
            ctx.lineTo(8, 18); ctx.lineTo(0, 27); ctx.lineTo(-8, 18); ctx.lineTo(-24, 27);
            ctx.lineTo(-32, 12); ctx.lineTo(-10, -3); ctx.closePath();
        } else if (shipShape === 'stealth' || shipShape === 'spectral') {
            ctx.moveTo(0, -30); ctx.lineTo(28, 21); ctx.lineTo(0, 8); ctx.lineTo(-28, 21); ctx.closePath();
        } else if (shipShape === 'phoenix' || shipShape === 'eclipse') {
            ctx.moveTo(0, -29); ctx.lineTo(18, -5); ctx.lineTo(40, 16); ctx.lineTo(14, 4);
            ctx.lineTo(0, 27); ctx.lineTo(-14, 4); ctx.lineTo(-40, 16); ctx.lineTo(-18, -5); ctx.closePath();
        } else if (shipShape === 'cyberjet' || shipShape === 'jet' || shipShape === 'ronin') {
            ctx.moveTo(0, -28); ctx.lineTo(10, -9); ctx.lineTo(38, 7); ctx.lineTo(17, 19);
            ctx.lineTo(0, 27); ctx.lineTo(-17, 19); ctx.lineTo(-38, 7); ctx.lineTo(-10, -9); ctx.closePath();
        } else if (shipShape === 'crusher' || shipShape === 'vortex' || shipShape === 'celeste') {
            ctx.moveTo(0, -27); ctx.lineTo(-10, -18); ctx.lineTo(-18, -10);
            ctx.lineTo(-40, 16); ctx.lineTo(-16, 10); ctx.lineTo(-9, 21);
            ctx.lineTo(0, 25); ctx.lineTo(9, 21); ctx.lineTo(16, 10);
            ctx.lineTo(40, 16); ctx.lineTo(18, -10); ctx.lineTo(10, -18); ctx.closePath();
        } else {
            ctx.moveTo(0, -24); ctx.lineTo(-12, -12); ctx.lineTo(-34, 18);
            ctx.lineTo(-13, 12); ctx.lineTo(0, 23); ctx.lineTo(13, 12);
            ctx.lineTo(34, 18); ctx.lineTo(12, -12); ctx.closePath();
        }
        ctx.fill(); ctx.stroke();
        if (this.skin.tier >= 3) {
            ctx.strokeStyle = '#fff'; ctx.globalAlpha = .72; ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-22, 14); ctx.lineTo(-8, -13); ctx.lineTo(0, -23);
            ctx.lineTo(8, -13); ctx.lineTo(22, 14);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }
        if (this.skin.tier >= 4) {
            ctx.fillStyle = this.skin.color; ctx.shadowBlur = 14;
            ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(-18, -9); ctx.lineTo(-8, -5); ctx.closePath(); ctx.fill();
            ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(18, -9); ctx.lineTo(8, -5); ctx.closePath(); ctx.fill();
        }
        if (this.skin.tier >= 5) {
            ctx.strokeStyle = this.skin.glow; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.ellipse(0, -5, 25, 18, 0, -0.9, .9); ctx.stroke();
        }
        ctx.fillStyle = '#06101e';
        ctx.beginPath(); ctx.moveTo(-9, 8); ctx.lineTo(0, -15); ctx.lineTo(9, 8); ctx.closePath(); ctx.fill();
        ctx.fillStyle = this.skin.color; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.ellipse(0, -5, 5, 11, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(-27, 13); ctx.lineTo(-12, 7); ctx.moveTo(27, 13); ctx.lineTo(12, 7); ctx.stroke();

        if (shieldTime > 0) {
            ctx.strokeStyle = '#9deaff';
            ctx.globalAlpha = .55 + Math.sin(performance.now() / 90) * .18;
            ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(0, 0, 43, 0, Math.PI * 2); ctx.stroke();
        }
        ctx.restore();
    }
}

class Laser {
    constructor(x, y, color, angle = 0) { this.x = x - 2; this.y = y; this.w = 4; this.h = 18; this.color = color; this.angle = angle; }
    update(dt) { this.y -= CONFIG.laserSpeed * dt; this.x += this.angle * CONFIG.laserSpeed * dt; }
    draw() {
        ctx.save(); ctx.shadowBlur = 18; ctx.shadowColor = this.color;
        ctx.strokeStyle = this.color; ctx.lineWidth = 7; ctx.globalAlpha = .4;
        ctx.beginPath(); ctx.moveTo(this.x + 2, this.y + this.h); ctx.lineTo(this.x + 2, this.y); ctx.stroke();
        ctx.globalAlpha = 1; ctx.lineWidth = 2; ctx.strokeStyle = '#fff';
        ctx.beginPath(); ctx.moveTo(this.x + 2, this.y + this.h); ctx.lineTo(this.x + 2, this.y); ctx.stroke();
        ctx.restore();
    }
}

class Chicken {
    constructor(x, y, variant) {
        this.x = x; this.y = y; this.variant = variant % 4;
        const typeRoll = wave >= 5 && variant === 0 ? 3 : Math.random();
        this.kind = typeRoll === 3 ? 'boss' : wave >= 3 && typeRoll > .86 ? 'armored' : typeRoll < .22 ? 'swift' : 'normal';
        const size = this.kind === 'boss' ? 2.35 : this.kind === 'armored' ? 1.3 : 1;
        this.w = 42 * size; this.h = 34 * size;
        this.hp = this.kind === 'boss' ? 8 : this.kind === 'armored' ? 3 : 1;
        this.baseSpeed = this.kind === 'swift' ? 1.8 : 1;
        this.phase = Math.random() * Math.PI * 2;
        this.baseX = x;
        this.dropTimer = 1.5 + Math.random() * Math.max(.8, 5 - wave);
        this.color = this.kind === 'boss' ? '#ff4d6d' : this.kind === 'armored' ? '#d9e5ef' : this.kind === 'swift' ? '#62f7ff' : ['#ff69b4', '#ffd166', '#5cecff', '#a78bfa'][this.variant];
    }
    update(dt) {
        this.phase += dt * this.baseSpeed;
        this.x = this.baseX + Math.sin(this.phase * 1.1) * 6 * this.baseSpeed;
        this.dropTimer -= dt;
        if (this.dropTimer <= 0) {
            eggs.push(new Egg(this.x + this.w / 2, this.y + this.h));
            const interval = Math.max(.65, 3.7 - wave * .22);
            this.dropTimer = interval + Math.random() * interval;
        }
    }
    draw() {
        ctx.save(); ctx.translate(this.x + this.w / 2, this.y + this.h / 2);
        this.drawArcadeChicken();
        ctx.restore();
    }
        /*
        const pulse = 1 + Math.sin(this.phase * 5) * .035; ctx.scale(pulse, pulse);
        ctx.scale(this.w / 42, this.h / 34);
        ctx.shadowBlur = 10; ctx.shadowColor = this.color;

        // Layered wings and individually shaded tail feathers give the flock an organic silhouette.
        ctx.save();
        ctx.fillStyle = '#bcb8ad';
        ctx.strokeStyle = '#ece9dc';
        ctx.lineWidth = .55;
        ctx.globalAlpha = .92;
        for (const side of [-1, 1]) {
            ctx.save(); ctx.scale(side, 1);
            ctx.beginPath();
            ctx.moveTo(12, -1);
            ctx.quadraticCurveTo(28, -14, 34, 1);
            ctx.quadraticCurveTo(30, 12, 14, 13);
            ctx.closePath();
            ctx.fill(); ctx.stroke();
            for (let i = 0; i < 7; i++) {
                const y = 0 + i * 1.7;
                ctx.beginPath();
                ctx.moveTo(13, y - 3);
                ctx.quadraticCurveTo(24, y - 9, 33 - i * 1.1, y + 3);
                ctx.quadraticCurveTo(23, y + 3, 14, y + 5);
                ctx.fillStyle = i % 2 ? '#9f9b91' : '#d8d5c8';
                ctx.fill();
            }
            ctx.restore();
        }
        ctx.restore();

        const body = ctx.createRadialGradient(-8, -10, 2, 2, 4, 24);
        body.addColorStop(0, '#fffef1');
        body.addColorStop(.22, '#eee8cf');
        body.addColorStop(.52, '#b8aa91');
        body.addColorStop(.78, '#776b61');
        body.addColorStop(1, '#302932');
        ctx.fillStyle = body;
        ctx.beginPath();
        ctx.ellipse(0, 5, 20, 19, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255,255,238,.38)';
        ctx.lineWidth = .7;
        for (let row = 0; row < 5; row++) {
            for (let col = -2; col <= 2; col++) {
                ctx.beginPath();
                ctx.moveTo(col * 6, row * 3 + 4);
                ctx.quadraticCurveTo(col * 6 + 3, row * 3 + 1, col * 6 + 7, row * 3 + 3);
                ctx.stroke();
            }
        }

        // Realistic comb, wattles, layered beak and broad angry eyes.
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#d12c35';
        ctx.beginPath();
        ctx.moveTo(-11, -15); ctx.quadraticCurveTo(-11, -30, -6, -22);
        ctx.quadraticCurveTo(-3, -35, 1, -22); ctx.quadraticCurveTo(7, -33, 8, -20);
        ctx.quadraticCurveTo(14, -26, 12, -13); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#7b1821'; ctx.lineWidth = .7; ctx.stroke();

        ctx.fillStyle = '#f0e9d8';
        ctx.beginPath(); ctx.ellipse(0, -10, 14, 13, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#edaa55';
        ctx.beginPath(); ctx.moveTo(-7, -1); ctx.quadraticCurveTo(0, 11, 8, -1);
        ctx.quadraticCurveTo(0, -5, -7, -1); ctx.fill();
        ctx.strokeStyle = '#9a5120'; ctx.lineWidth = .8;
        ctx.beginPath(); ctx.moveTo(-6, 1); ctx.quadraticCurveTo(0, 5, 7, 1); ctx.stroke();
        ctx.fillStyle = '#d12c35';
        ctx.beginPath(); ctx.ellipse(-10, 0, 4, 6, -.35, 0, Math.PI * 2);
        ctx.ellipse(10, 0, 4, 6, .35, 0, Math.PI * 2); ctx.fill();

        ctx.shadowColor = '#ffe78a'; ctx.shadowBlur = 7;
        ctx.fillStyle = '#f5e8a7';
        ctx.beginPath(); ctx.ellipse(-8, -9, 5.5, 6.2, -.12, 0, Math.PI * 2);
        ctx.ellipse(8, -9, 5.5, 6.2, .12, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#15131b';
        ctx.beginPath(); ctx.arc(-7.4, -8.5, 2.7, 0, Math.PI * 2); ctx.arc(7.4, -8.5, 2.7, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color; ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(-7.4, -9, 1, 0, Math.PI * 2); ctx.arc(7.4, -9, 1, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;

        ctx.strokeStyle = '#160c16'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(-13, -8); ctx.lineTo(-3, -5); ctx.moveTo(13, -8); ctx.lineTo(3, -5); ctx.stroke();
        ctx.strokeStyle = '#ff335f'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(-12, -7); ctx.lineTo(-4, -5); ctx.moveTo(12, -7); ctx.lineTo(4, -5); ctx.stroke();

        if (this.kind === 'armored' || this.kind === 'boss') {
            ctx.strokeStyle = this.kind === 'boss' ? '#ff7b24' : '#9deaff';
            ctx.lineWidth = this.kind === 'boss' ? 4 : 2;
            ctx.beginPath(); ctx.moveTo(-19, -10); ctx.lineTo(0, -24); ctx.lineTo(19, -10); ctx.stroke(); 
            ctx.fillStyle = 'rgba(20,35,54,.8)';
            ctx.beginPath(); ctx.moveTo(-21, 7); ctx.lineTo(-12, -7); ctx.lineTo(12, -7); ctx.lineTo(21, 7); ctx.closePath(); ctx.fill();
        }
        if (this.kind === 'swift') {
            ctx.strokeStyle = '#5cecff'; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(-16, 16); ctx.lineTo(-30, 23); ctx.moveTo(16, 16); ctx.lineTo(30, 23); ctx.stroke();
        }
        ctx.restore();
    }
    */

    drawArcadeChicken() {
        const pulse = 1 + Math.sin(this.phase * 5) * .035;
        ctx.scale(pulse, pulse);
        ctx.scale(this.w / 42, this.h / 34);
        const wingLift = Math.sin(this.phase * 2.5) * 4;

        ctx.shadowBlur = 12;
        ctx.shadowColor = this.color;

        ctx.save();
        ctx.globalAlpha = .5;
        ctx.strokeStyle = '#fff6b7';
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.ellipse(0, 8, 22, 24, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = '#d6a843';
        ctx.strokeStyle = '#80632d';
        ctx.lineWidth = .8;
        for (const side of [-1, 1]) {
            ctx.save(); ctx.scale(side, 1);
            for (let i = 0; i < 4; i++) {
                ctx.beginPath();
                ctx.moveTo(4 + i, 19);
                ctx.quadraticCurveTo(12 + i * 2, 29 + i * 2, 17 + i * 2, 29 + i);
                ctx.quadraticCurveTo(13 + i, 20, 7 + i, 18);
                ctx.closePath(); ctx.fill(); ctx.stroke();
            }
            ctx.restore();
        }

        ctx.fillStyle = '#fffdf2';
        ctx.strokeStyle = '#d3c68f';
        ctx.lineWidth = 1.1;
        for (const side of [-1, 1]) {
            ctx.save();
            ctx.scale(side, 1);
            ctx.beginPath();
            ctx.moveTo(13, 1);
            ctx.quadraticCurveTo(25, -14 + wingLift, 36, -7);
            ctx.quadraticCurveTo(40, 0, 27, 10);
            ctx.quadraticCurveTo(20, 15, 13, 9);
            ctx.closePath(); ctx.fill(); ctx.stroke();
            ctx.strokeStyle = 'rgba(164,145,96,.46)'; ctx.lineWidth = .65;
            ctx.beginPath();
            ctx.moveTo(14, 9);
            ctx.quadraticCurveTo(27, 2, 37, 12 + wingLift);
            ctx.quadraticCurveTo(37, 18, 24, 18);
            ctx.lineTo(14, 13);
            ctx.closePath(); ctx.fill(); ctx.stroke();
            ctx.strokeStyle = 'rgba(138,122,78,.55)';
            ctx.beginPath();
            ctx.moveTo(17, 8); ctx.quadraticCurveTo(27, 2, 35, 9);
            ctx.moveTo(18, 12); ctx.quadraticCurveTo(27, 8, 34, 13);
            ctx.stroke();
            ctx.restore();
        }

        const body = ctx.createRadialGradient(-8, -10, 2, 0, 5, 24);
        body.addColorStop(0, '#fffbcf');
        body.addColorStop(.38, '#ffd765');
        body.addColorStop(.72, '#efad2d');
        body.addColorStop(1, '#b8661d');
        ctx.fillStyle = body;
        ctx.strokeStyle = '#75552d';
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.ellipse(0, 7, 18, 21, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,210,.32)';
        ctx.beginPath();
        ctx.moveTo(-12, -7); ctx.lineTo(-4, -13); ctx.lineTo(5, -6);
        ctx.lineTo(-3, 1); ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(116,75,30,.18)';
        ctx.beginPath();
        ctx.moveTo(1, 8); ctx.lineTo(17, 1); ctx.lineTo(13, 19);
        ctx.lineTo(4, 27); ctx.closePath(); ctx.fill();

        ctx.strokeStyle = '#d36e29';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-7, 25); ctx.quadraticCurveTo(-7, 31, -11, 34);
        ctx.moveTo(7, 25); ctx.quadraticCurveTo(7, 31, 11, 34);
        ctx.stroke();
        ctx.strokeStyle = '#ffad38'; ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-11, 34); ctx.lineTo(-17, 36); ctx.moveTo(-11, 34); ctx.lineTo(-12, 38);
        ctx.moveTo(11, 34); ctx.lineTo(17, 36); ctx.moveTo(11, 34); ctx.lineTo(12, 38);
        ctx.stroke();

        ctx.fillStyle = '#ef2836';
        ctx.strokeStyle = '#ae1826';
        ctx.beginPath();
        ctx.moveTo(-11, -13);
        ctx.quadraticCurveTo(-14, -25, -7, -21);
        ctx.quadraticCurveTo(-8, -32, -1, -22);
        ctx.quadraticCurveTo(4, -34, 7, -21);
        ctx.quadraticCurveTo(14, -27, 11, -14);
        ctx.quadraticCurveTo(0, -10, -11, -13);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ff4b42';
        ctx.beginPath();
        ctx.moveTo(-8, -14); ctx.quadraticCurveTo(-5, -28, -2, -18);
        ctx.quadraticCurveTo(2, -29, 4, -17); ctx.quadraticCurveTo(8, -25, 9, -13);
        ctx.closePath(); ctx.fill();

        ctx.fillStyle = '#edca70';
        ctx.strokeStyle = '#75552d';
        ctx.beginPath(); ctx.ellipse(0, -11, 13, 13, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

        ctx.fillStyle = '#f5a623';
        ctx.beginPath(); ctx.moveTo(-8, -8); ctx.quadraticCurveTo(0, -12, 8, -8); ctx.quadraticCurveTo(0, 0, -8, -8); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-8, -3); ctx.quadraticCurveTo(0, 8, 8, -3); ctx.quadraticCurveTo(0, 2, -8, -3); ctx.fill();
        ctx.fillStyle = '#d9821f';
        ctx.beginPath(); ctx.moveTo(-5, -1); ctx.quadraticCurveTo(0, 3, 5, -1);
        ctx.quadraticCurveTo(0, 7, -5, -1); ctx.fill();
        ctx.strokeStyle = '#884f1b'; ctx.beginPath(); ctx.moveTo(-7, -3); ctx.quadraticCurveTo(0, 1, 7, -3); ctx.stroke();

        ctx.fillStyle = '#fff';
        ctx.shadowBlur = 7; ctx.shadowColor = '#fff4a3';
        ctx.beginPath();
        ctx.ellipse(-7, -14, 5, 5.5, -.15, 0, Math.PI * 2);
        ctx.ellipse(7, -14, 5, 5.5, .15, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#43301e'; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-11, -16); ctx.quadraticCurveTo(-7, -19, -2, -16);
        ctx.moveTo(11, -16); ctx.quadraticCurveTo(7, -19, 2, -16);
        ctx.stroke();
        ctx.fillStyle = '#211b19';
        ctx.beginPath();
        ctx.arc(-6.5, -13.5, 2.25, 0, Math.PI * 2);
        ctx.arc(6.5, -13.5, 2.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-7.3, -14.3, .55, 0, Math.PI * 2);
        ctx.arc(5.8, -14.3, .55, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#4b3023';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-11, -19); ctx.lineTo(-3, -16);
        ctx.moveTo(11, -19); ctx.lineTo(3, -16);
        ctx.stroke();
        ctx.fillStyle = '#ffd95a';
        ctx.beginPath(); ctx.arc(-6.5, -14.2, .75, 0, Math.PI * 2); ctx.arc(6.5, -14.2, .75, 0, Math.PI * 2); ctx.fill();

        ctx.strokeStyle = '#332319'; ctx.lineWidth = 1.7;
        ctx.beginPath();
        ctx.moveTo(-12, -18); ctx.lineTo(-3, -15);
        ctx.moveTo(12, -18); ctx.lineTo(3, -15);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,239,166,.8)';
        ctx.lineWidth = .7;
        ctx.beginPath();
        ctx.moveTo(-11, -21); ctx.quadraticCurveTo(-7, -23, -3, -20);
        ctx.moveTo(11, -21); ctx.quadraticCurveTo(7, -23, 3, -20);
        ctx.stroke();

        ctx.fillStyle = '#ef2836';
        ctx.beginPath();
        ctx.ellipse(-11, -5, 4, 5.5, -.25, 0, Math.PI * 2);
        ctx.ellipse(11, -5, 4, 5.5, .25, 0, Math.PI * 2);
        ctx.fill();

        if (this.kind === 'armored' || this.kind === 'boss') {
            ctx.fillStyle = 'rgba(42,64,82,.92)';
            ctx.strokeStyle = this.kind === 'boss' ? '#ff8a32' : '#7de6ff';
            ctx.lineWidth = this.kind === 'boss' ? 2.5 : 1.8;
            ctx.beginPath();
            ctx.moveTo(-17, 14); ctx.lineTo(-18, 1); ctx.lineTo(-11, -3);
            ctx.lineTo(0, -6); ctx.lineTo(11, -3); ctx.lineTo(18, 1);
            ctx.lineTo(17, 14); ctx.closePath();
            ctx.fill(); ctx.stroke();
            ctx.fillStyle = this.color;
            ctx.beginPath(); ctx.arc(0, 3, this.kind === 'boss' ? 4 : 2.5, 0, Math.PI * 2); ctx.fill();
        }
        if (this.kind === 'swift') {
            ctx.strokeStyle = '#5cecff'; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(-16, 20); ctx.lineTo(-30, 25); ctx.moveTo(16, 20); ctx.lineTo(30, 25); ctx.stroke();
        }
        if (this.kind === 'boss') {
            ctx.fillStyle = '#2d2638'; ctx.strokeStyle = '#ffb45a'; ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-25, 5); ctx.lineTo(-34, -4); ctx.lineTo(-29, 13); ctx.lineTo(-19, 18); ctx.closePath();
            ctx.moveTo(25, 5); ctx.lineTo(34, -4); ctx.lineTo(29, 13); ctx.lineTo(19, 18); ctx.closePath();
            ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#ffcf62';
            ctx.beginPath();
            ctx.moveTo(-14, -31); ctx.lineTo(-18, -42); ctx.lineTo(-8, -34);
            ctx.lineTo(0, -46); ctx.lineTo(8, -34); ctx.lineTo(18, -42); ctx.lineTo(14, -31); ctx.closePath();
            ctx.fill();
        }
        if (this.kind === 'armored') {
            ctx.fillStyle = '#cbd8df';
            ctx.strokeStyle = '#eef7ff'; ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-17, -24); ctx.quadraticCurveTo(-7, -33, 0, -29);
            ctx.quadraticCurveTo(7, -33, 17, -24); ctx.lineTo(13, -16);
            ctx.lineTo(-13, -16); ctx.closePath(); ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#6f8291';
            ctx.fillRect(-14, -23, 28, 4);
        }
    }
}

class Egg {
    constructor(x, y) { this.x = x - 7; this.y = y; this.w = 14; this.h = 20; this.speed = 145 + wave * 17; }
    update(dt) { this.y += this.speed * dt; }
    draw() {
        ctx.save(); ctx.translate(this.x + 7, this.y + 10); ctx.rotate(Math.sin(this.y / 20) * .12);
        const shell = ctx.createRadialGradient(-3, -6, 1, 0, 0, 10);
        shell.addColorStop(0, '#fff'); shell.addColorStop(.55, '#fff2c4'); shell.addColorStop(1, '#c9a85d');
        ctx.shadowBlur = 12; ctx.shadowColor = '#fff1a8'; ctx.fillStyle = shell;
        ctx.beginPath(); ctx.ellipse(0, 0, 7, 10, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x; this.y = y; this.color = color; this.life = 1;
        const angle = Math.random() * Math.PI * 2, speed = 45 + Math.random() * 180;
        this.vx = Math.cos(angle) * speed; this.vy = Math.sin(angle) * speed;
        this.size = Math.random() * 5 + 2;
        this.feather = Math.random() < .35;
        this.rotation = Math.random() * Math.PI * 2;
        this.spin = (Math.random() - .5) * 12;
    }
    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.vy += 48 * dt;
        this.vx *= 1 - dt * .45;
        this.rotation += this.spin * dt;
        this.life -= dt * 1.35;
    }
    draw() {
        ctx.save(); ctx.globalAlpha = Math.max(0, this.life); ctx.fillStyle = this.color; ctx.shadowBlur = 8; ctx.shadowColor = this.color;
        ctx.translate(this.x, this.y); ctx.rotate(this.rotation);
        if (this.feather) {
            ctx.beginPath();
            ctx.moveTo(-this.size * 1.8, 0);
            ctx.quadraticCurveTo(-this.size * .2, -this.size, this.size * 1.8, 0);
            ctx.quadraticCurveTo(this.size * .5, this.size * .9, 0, 0);
            ctx.quadraticCurveTo(-this.size, this.size * .45, -this.size * 1.8, 0);
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = .6;
            ctx.beginPath(); ctx.moveTo(-this.size * 1.4, 0); ctx.quadraticCurveTo(0, -1, this.size * 1.5, 0); ctx.stroke();
        } else ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size * .55);
        ctx.restore();
    }
}

function collides(a, b) { return a.x < b.x + b.w && a.x + (a.w || 0) > b.x && a.y < b.y + b.h && a.y + (a.h || 0) > b.y; }

function explosion(x, y, color) {
    for (let i = 0; i < 24; i++) particles.push(new Particle(x, y, i % 3 === 0 ? '#fff' : color));
    for (let i = 0; i < 12; i++) particles.push(new Particle(x, y, i % 2 ? '#f3efe8' : '#ffcf87'));
}

function useBomb() {
    if (!running || save.bombLevel <= 0) return;
    save.bombLevel--;
    persistSave();
    eggs = [];
    for (let i = chickens.length - 1; i >= 0; i--) {
        const chicken = chickens[i];
        explosion(chicken.x + chicken.w / 2, chicken.y + chicken.h / 2, chicken.color);
        score += 10;
        chickens.splice(i, 1);
    }
    shake = 18;
    updateBombButton();
    updateUI();
    if (!chickens.length && !waveIntroActive) beginWave(wave + 1);
}

function updateBombButton() {
    const button = document.getElementById('bombButton');
    if (button) {
        button.innerHTML = `SMART<br>BOMB · ${save.bombLevel}`;
        button.disabled = !running || save.bombLevel <= 0;
    }
}

function spawnWave() {
    chickens = [];
    eggs = [];
    const columns = Math.min(10, 6 + Math.floor(wave / 2));
    const rows = Math.min(4, 2 + Math.floor(wave / 3));
    const gapX = 62;
    const total = (columns - 1) * gapX;
    const start = (CONFIG.width - total) / 2 - 21;
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
            if (wave % 4 === 3 && row === 0 && col === columns - 1) continue;
            const offset = wave % 4 === 1 && col % 2 ? 30 : 0;
            chickens.push(new Chicken(start + col * gapX, 78 + row * 58 + offset, row * columns + col));
        }
    }
}

function sleep(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

async function beginWave(nextWave) {
    const token = ++waveIntroToken;
    running = false;
    waveIntroActive = true;
    wave = nextWave;
    chickens = [];
    eggs = [];
    lasers = [];
    const intro = document.getElementById('waveIntro');
    const name = document.getElementById('waveIntroName');
    const countdown = document.getElementById('waveIntroCountdown');
    name.textContent = `WAVE ${wave}`;
    name.style.animation = 'none';
    void name.offsetWidth;
    name.style.animation = '';
    countdown.textContent = '';
    countdown.className = 'wave-intro-countdown';
    updateUI();

    if (nextWave > 1) {
        const motivator = document.getElementById('waveMotivator');
        document.getElementById('motivatorText').textContent = waveMessages[(nextWave - 2) % waveMessages.length];
        motivator.classList.remove('active');
        void motivator.offsetWidth;
        motivator.classList.add('active');
        await sleep(1600);
        if (token !== waveIntroToken) return;
        motivator.classList.remove('active');
        intro.classList.add('active');
    }

    if (nextWave === 1) intro.classList.add('active');
    await sleep(1100);
    if (token !== waveIntroToken) return;
    for (let count = 3; count >= 1; count--) {
        countdown.className = 'wave-intro-countdown';
        countdown.textContent = count;
        void countdown.offsetWidth;
        countdown.className = 'wave-intro-countdown';
        await sleep(700);
        if (token !== waveIntroToken) return;
    }
    countdown.className = 'wave-intro-countdown go';
    countdown.textContent = 'GO!';
    await sleep(450);
    if (token !== waveIntroToken) return;
    intro.classList.remove('active');
    countdown.textContent = '';
    spawnWave();
    waveIntroActive = false;
    gameOverShown = false;
    running = true;
    updateBombButton();
}

function updateUI() {
    scoreEl.textContent = score;
    livesEl.textContent = lives;
    waveEl.textContent = wave;
    updateCredits();
}

function pauseGame() {
    if (!running && !waveIntroActive) return;
    paused = true;
    document.getElementById('pauseScreen').classList.add('active');
    Object.keys(keys).forEach(key => keys[key] = false);
}

async function resumeGame() {
    document.getElementById('pauseScreen').classList.remove('active');
    paused = true;
    const countdown = document.getElementById('resumeCountdown');
    for (let count = 3; count >= 1; count--) {
        countdown.textContent = count;
        countdown.classList.remove('active');
        void countdown.offsetWidth;
        countdown.classList.add('active');
        await sleep(700);
    }
    countdown.textContent = 'GO!';
    countdown.classList.remove('active');
    void countdown.offsetWidth;
    countdown.classList.add('active');
    await sleep(450);
    countdown.classList.remove('active');
    countdown.textContent = '';
    paused = false;
    Object.keys(keys).forEach(key => keys[key] = false);
}

function startGame() {
    document.getElementById('homeScreen').classList.remove('active');
    document.getElementById('shopScreen').classList.remove('active');
    document.getElementById('gameOver').classList.remove('active');
    document.querySelector('.home-button').classList.remove('hidden-in-shop');
    paused = false;
    document.getElementById('pauseScreen').classList.remove('active');
    score = 0; lives = CONFIG.lives; wave = 1; earnedThisRun = 0;
    lasers = []; eggs = []; particles = []; player = new Player();
    shieldTime = 0;
    updateBombButton();
    beginWave(1);
}

function loseLife() {
    if (!running) return;
    if (shieldTime > 0) { shake = 3; return; }
    if (save.armorLevel > 0 && Math.random() < save.armorLevel * .13) {
        shake = 4;
        return;
    }
    lives--; shake = 13; updateUI();
    if (lives <= 0) endGame();
}

function hitByEgg() {
    if (!running || shieldTime > 0) return false;
    lives--;
    shieldTime = 5 + save.shieldLevel;
    shake = 13;
    updateUI();
    if (lives <= 0) endGame();
    return true;
}

function eggTouchesPlayer(egg) {
    const shipHitbox = {
        x: player.x + 8,
        y: player.y + 4,
        w: player.width - 16,
        h: player.height - 8
    };
    return collides(shipHitbox, egg);
}

function endGame() {
    running = false;
    gameOverShown = true;
    const earned = Math.floor(score / 10);
    earnedThisRun = earned;
    save.credits += earned;
    persistSave();
    document.getElementById('finalScore').textContent = score;
    document.getElementById('earnedCredits').textContent = earned;
    document.getElementById('gameOver').classList.add('active');
}

function showHome() {
    waveIntroToken++;
    waveIntroActive = false;
    running = false;
    paused = false;
    document.getElementById('pauseScreen').classList.remove('active');
    document.getElementById('resumeCountdown').classList.remove('active');
    document.querySelector('.home-button').classList.remove('hidden-in-shop');
    document.getElementById('waveIntro').classList.remove('active');
    document.getElementById('waveMotivator').classList.remove('active');
    document.getElementById('gameOver').classList.remove('active');
    document.getElementById('shopScreen').classList.remove('active');
    document.getElementById('homeScreen').classList.add('active');
    updateBombButton();
}

function showShop() {
    waveIntroToken++;
    waveIntroActive = false;
    running = false;
    document.getElementById('waveIntro').classList.remove('active');
    document.getElementById('waveMotivator').classList.remove('active');
    paused = false;
    document.getElementById('pauseScreen').classList.remove('active');
    document.getElementById('homeScreen').classList.remove('active');
    document.getElementById('shopScreen').classList.add('active');
    document.querySelector('.home-button').classList.add('hidden-in-shop');
    renderShop('ships');
}

function buy(item) {
    if (item.type === 'skin') {
        const skin = skins[item.id];
        if (save.ownedSkins.includes(item.id)) { save.activeSkin = item.id; persistSave(); renderShop(); return; }
        if (save.credits < skin.price) return;
        save.credits -= skin.price; save.ownedSkins.push(item.id); save.activeSkin = item.id;
    } else {
        const level = save[item.key] || 0;
        const costs = [120, 260, 480, 800, 1200];
        if (level >= costs.length) return;
        if (save.credits < costs[level]) return;
        save.credits -= costs[level]; save[item.key] = level + 1;
    }
    persistSave(); renderShop();
}

function renderShop(section = 'all') {
    const cards = [];
    if (section !== 'upgrades') {
    for (const [id, skin] of Object.entries(skins)) {
        const owned = save.ownedSkins.includes(id);
        const active = save.activeSkin === id;
        const tierName = ['STANDARD', 'ADVANCED', 'ELITE', 'ARMOR', 'LEGENDARY', 'MYTHIC'][skin.tier];
        const premiumParts = skin.tier >= 3
            ? `<path d="M30 8 36 35 30 44 24 35Z" fill="#fff" opacity=".45"/><path d="M14 24 3 38 19 34ZM46 24 57 38 41 34Z" fill="${skin.color}" opacity=".9"/>`
            : '';
        const mythicParts = skin.tier >= 4
            ? `<path d="M18 12 12 6 20 7 30 1 40 7 48 6 42 12Z" fill="${skin.glow}" opacity=".95"/><circle cx="30" cy="22" r="13" fill="none" stroke="${skin.color}" stroke-width=".8" opacity=".8"/>`
            : '';
        const bodyPath = shopShipPaths[id];
        cards.push(`<article class="shop-card ${owned ? 'owned' : ''}" style="--preview:${skin.color}">
            <svg class="ship-preview" viewBox="0 0 60 56" aria-hidden="true">
                <defs><linearGradient id="hull-${id}" x1="0" x2="1"><stop stop-color="#1b2638"/><stop offset=".5" stop-color="#e9f5ff"/><stop offset="1" stop-color="${skin.color}"/></linearGradient></defs>
                <path d="${bodyPath}" fill="url(#hull-${id})" stroke="${skin.color}" stroke-width="${1.4 + skin.tier * .25}"/>
                <path d="M30 9 36 35 30 43 24 35Z" fill="${skin.glow}" opacity=".82"/>
                <path d="M13 39 7 51 22 45ZM47 39 53 51 38 45Z" fill="${skin.color}" opacity=".68"/>
                <circle cx="30" cy="22" r="4" fill="#fff" filter="drop-shadow(0 0 4px ${skin.glow})"/>
                ${premiumParts}${mythicParts}
            </svg>
            <h3>${skin.name}</h3><p class="skin-tier tier-${skin.tier}">${tierName}</p><p>${active ? 'Equipped' : owned ? 'Owned' : `${skin.price} CR`}</p>
            <button class="buy-button" onclick="buy({type:'skin',id:'${id}'})">${active ? 'Equipped' : owned ? 'Equip' : 'Buy'}</button>
        </article>`);
    }
    }
    if (section !== 'ships') {
    const upgrades = [
        ['fireLevel', 'Fire System', 'Increase fire rate and add lasers'],
        ['speedLevel', 'Thruster Boost', 'Increase ship movement speed'],
        ['shieldLevel', 'Phase Shield', 'Absorb impacts with a temporary shield'],
        ['magnetLevel', 'Credit Magnet', 'Pull score coins from farther away'],
        ['armorLevel', 'Nanofiber Armor', 'Reduce incoming damage and enemy collisions'],
        ['criticalLevel', 'Critical Reactor', 'Chance for lasers to deal double damage'],
        ['droneLevel', 'Wing Drones', 'Deploy synchronized support drones'],
        ['bombLevel', 'Smart Bomb', 'Add a screen-clearing emergency bomb']
    ];
    for (const [key, name, description] of upgrades) {
        const level = save[key] || 0;
        const costs = [120, 260, 480, 800, 1200];
        const disabled = level >= costs.length || save.credits < costs[level];
        cards.push(`<article class="shop-card ${level ? 'owned' : ''}">
            <div style="font-size:42px;color:var(--cyan)">✦</div><h3>${name}</h3>
            <p>${description}<br>Level ${level}/${costs.length}</p>
            <button class="buy-button" onclick="buy({type:'upgrade',key:'${key}'})" ${disabled ? 'disabled' : ''}>${level >= costs.length ? 'Maxed' : key === 'bombLevel' ? `Add Bomb · ${costs[level]} CR` : `Upgrade · ${costs[level]} CR`}</button>
        </article>`);
    }
    }
    document.getElementById('shopGrid').innerHTML = cards.join('');
    document.getElementById('shopCredits').textContent = save.credits;
}

function restartGame() { startGame(); }

function update(dt) {
    player.update(dt);
    shotCooldown -= dt;
    if ((keys.Space || keys.Spacebar) && shotCooldown <= 0) {
        player.shoot(); shotCooldown = Math.max(.12, .38 - save.fireLevel * .055);
        if (save.droneLevel > 0) {
            lasers.push(new Laser(player.x + 1, player.y + 20, player.skin.glow, -.10));
            lasers.push(new Laser(player.x + player.width - 5, player.y + 20, player.skin.glow, .10));
            if (save.droneLevel >= 3) lasers.push(new Laser(player.x + player.width / 2 - 2, player.y, '#fff'));
        }
    }
    if (shieldTime > 0) shieldTime -= dt;

    for (let i = lasers.length - 1; i >= 0; i--) {
        lasers[i].update(dt);
        if (lasers[i].y + lasers[i].h < 0) lasers.splice(i, 1);
    }
    for (let i = eggs.length - 1; i >= 0; i--) {
        eggs[i].update(dt);
        if (eggTouchesPlayer(eggs[i])) {
            eggs.splice(i, 1);
            if (shieldTime <= 0) hitByEgg();
            continue;
        }
        if (eggs[i].y > CONFIG.height) eggs.splice(i, 1);
    }
    for (const chicken of chickens) chicken.update(dt);

    for (let i = lasers.length - 1; i >= 0; i--) {
        for (let j = chickens.length - 1; j >= 0; j--) {
            const chicken = chickens[j];
            if (collides(lasers[i], chicken)) {
                const hitX = lasers[i].x;
                lasers.splice(i, 1);
                const critical = Math.random() < save.criticalLevel * .09;
                chicken.hp -= critical ? 2 : 1;
                if (critical) explosion(hitX, chicken.y, '#fff26d');
                explosion(lasers[i]?.x || chicken.x, chicken.y, chicken.color);
                if (chicken.hp <= 0) {
                    explosion(chicken.x + chicken.w / 2, chicken.y + chicken.h / 2, chicken.color);
                    chickens.splice(j, 1);
                    score += chicken.kind === 'boss' ? 100 : chicken.kind === 'armored' ? 30 : 10;
                    pickups.push({ x: chicken.x + chicken.w / 2, y: chicken.y + chicken.h / 2, w: 10, h: 10, vy: -80, value: 10, spin: Math.random() * Math.PI });
                    if (!chickens.length && !waveIntroActive) beginWave(wave + 1);
                }
                updateUI(); break;
            }
        }
    }
    for (let i = chickens.length - 1; i >= 0; i--) {
        if (collides(player, chickens[i])) { chickens.splice(i, 1); loseLife(); }
    }
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update(dt);
        if (particles[i].life <= 0) particles.splice(i, 1);
    }
    for (let i = pickups.length - 1; i >= 0; i--) {
        const coin = pickups[i];
        coin.vy += 30 * dt;
        coin.y += coin.vy * dt;
        const distance = Math.hypot(player.x + 32 - coin.x, player.y + 22 - coin.y);
        if (save.magnetLevel > 0 && distance < 90 + save.magnetLevel * 70) {
            coin.x += (player.x + 32 - coin.x) * dt * (3 + save.magnetLevel);
            coin.y += (player.y + 22 - coin.y) * dt * (3 + save.magnetLevel);
        }
        if (distance < 25) { score += coin.value; pickups.splice(i, 1); updateUI(); }
    }
}

function drawBackground(dt) {
    const gradient = ctx.createLinearGradient(0, 0, 0, CONFIG.height);
    gradient.addColorStop(0, '#02030f'); gradient.addColorStop(.55, '#09051b'); gradient.addColorStop(1, '#061321');
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);

    const clouds = [
        [155, 145, 180, 155, 92, 255],
        [610, 210, 220, 42, 167, 255],
        [430, 430, 170, 255, 60, 172]
    ];
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    for (const [x, y, radius, r, g, b] of clouds) {
        const cloud = ctx.createRadialGradient(x, y, 5, x, y, radius);
        cloud.addColorStop(0, `rgba(${r},${g},${b},.16)`);
        cloud.addColorStop(.5, `rgba(${r},${g},${b},.055)`);
        cloud.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = cloud; ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }
    ctx.restore();

    ctx.save(); ctx.globalCompositeOperation = 'screen';
    const nebula = ctx.createRadialGradient(220, 180, 10, 220, 180, 320);
    nebula.addColorStop(0, 'rgba(155,92,255,.16)'); nebula.addColorStop(.55, 'rgba(90,167,255,.06)'); nebula.addColorStop(1, 'transparent');
    ctx.fillStyle = nebula; ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);
    ctx.restore();
    for (const star of stars) {
        star.y += star.speed * dt; if (star.y > CONFIG.height) { star.y = 0; star.x = Math.random() * CONFIG.width; }
        ctx.globalAlpha = star.alpha; ctx.fillStyle = star.r > 1.4 ? '#aeefff' : '#fff';
        ctx.fillRect(star.x, star.y, star.r, star.r);
    }
    ctx.globalAlpha = 1;
}

function draw() {
    ctx.save();
    ctx.translate((Math.random() - .5) * shake, (Math.random() - .5) * shake);
    drawBackground(Math.min((performance.now() - lastTime) / 1000 || 0, .05));
    if (player) player.draw();
    lasers.forEach(laser => laser.draw()); eggs.forEach(egg => egg.draw());
    chickens.forEach(chicken => chicken.draw()); particles.forEach(particle => particle.draw());
    ctx.save();
    for (const coin of pickups) {
        const pulse = Math.abs(Math.sin(coin.spin += .12));
        ctx.fillStyle = '#ffd166'; ctx.shadowBlur = 10; ctx.shadowColor = '#ffb300';
        ctx.beginPath(); ctx.ellipse(coin.x, coin.y, 3 + pulse * 3, 6, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
    ctx.restore();
    shake *= .86; if (shake < .2) shake = 0;
}

function loop(time) {
    const dt = Math.min((time - lastTime) / 1000 || 0, .05); lastTime = time;
    if (running && !paused) update(dt);
    draw();
    requestAnimationFrame(loop);
}

window.startGame = startGame;
window.showHome = showHome;
window.showShop = showShop;
window.restartGame = restartGame;
window.pauseGame = pauseGame;
window.resumeGame = resumeGame;
window.buy = buy;

player = new Player();
updateCredits();
updateBombButton();
draw();
requestAnimationFrame(loop);
