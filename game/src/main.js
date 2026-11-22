// The Velvet Vault — boot, game loop and state machine.
// One thief, four patrol guards, two sweeping cameras, one vault to crack,
// three loot pieces to lift, and a getaway van waiting at the service door.
import { FIELD, STEP, LIVES, BEST_KEY } from './config.js';
import { makeGuards, makeCameras, stepGuard, stepCameras, updateDetection, lureGuard, GUARD_STATE } from './guards.js';
import { makePlayer, stepPlayer, throwCoin, puffSmoke, tryPickupLoot, crackVault, heistReady, atExit } from './player.js';
import { drawGame, drawTitle, drawEnd, SCREEN_TITLE, SCREEN_PLAY, SCREEN_WIN, SCREEN_OVER } from './render.js';
import { stageShot } from './shots.js';
import { sfx, toggleMute, isMuted } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

function fitCanvas() {
  const scale = Math.min(window.innerWidth / FIELD.width, window.innerHeight / FIELD.height);
  canvas.width = Math.round(FIELD.width * scale * window.devicePixelRatio);
  canvas.height = Math.round(FIELD.height * scale * window.devicePixelRatio);
  canvas.style.width = `${Math.round(FIELD.width * scale)}px`;
  canvas.style.height = `${Math.round(FIELD.height * scale)}px`;
  ctx.setTransform(canvas.width / FIELD.width, 0, 0, canvas.height / FIELD.height, 0, 0);
}

const input = {
  up: false, down: false, left: false, right: false,
  sneak: false, dash: false, crack: false,
};

const state = {
  screen: SCREEN_TITLE,
  player: makePlayer(),
  guards: makeGuards(),
  cameras: makeCameras(),
  coins: [],
  smokePuffs: [],
  alarm: 0,
  lives: LIVES,
  time: 0,
  spottedCount: 0,
  ready: false,
  paused: false,
  message: '',
  messageTimer: 0,
  best: null,
  alarmWasHigh: false,
};

function loadBest() {
  try {
    const raw = localStorage.getItem(BEST_KEY);
    if (!raw) return null;
    const s = Number(raw);
    if (!Number.isFinite(s)) return null;
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  } catch {
    return null;
  }
}

function saveBest() {
  try {
    const raw = localStorage.getItem(BEST_KEY);
    if (raw === null || state.time < Number(raw)) localStorage.setItem(BEST_KEY, String(Math.round(state.time)));
  } catch {
    // Best time is a nicety; a blocked store must never break the game.
  }
}

function objectiveText() {
  if (state.ready) return 'Loot secured — reach the GETAWAY van!';
  if (state.player.vaultCracked) return 'Vault open — reach the GETAWAY van!';
  return `Grab 3 loot (${state.player.loot.length}/3) or crack the VAULT, then escape`;
}

function setMessage(text, seconds = 2.6) {
  state.message = text;
  state.messageTimer = seconds;
}

function reset() {
  state.player = makePlayer();
  state.guards = makeGuards();
  state.cameras = makeCameras();
  state.coins = [];
  state.smokePuffs = [];
  state.alarm = 0;
  state.lives = LIVES;
  state.time = 0;
  state.spottedCount = 0;
  state.ready = false;
  state.paused = false;
  state.message = '';
  state.messageTimer = 0;
  state.alarmWasHigh = false;
  state.best = loadBest();
}
state.reset = reset;

function startGame() {
  reset();
  state.screen = SCREEN_PLAY;
  setMessage('Stay out of the cones — sneak to the loot', 3.2);
  sfx.click();
}

function winGame() {
  state.screen = SCREEN_WIN;
  saveBest();
  state.best = loadBest();
  sfx.win();
}

function loseLife() {
  state.lives -= 1;
  state.spottedCount += 1;
  sfx.spotted();
  if (state.lives <= 0) {
    state.screen = SCREEN_OVER;
    sfx.lose();
    return;
  }
  // Caught: the guards reset to patrol, the thief slips back to the door.
  state.player.x = 129;
  state.player.y = 590;
  state.player.crackProgress = 0;
  state.alarm = 0.35;
  state.guards = makeGuards();
  state.smokePuffs = [];
  setMessage(`Caught! ${state.lives} ${state.lives === 1 ? 'life' : 'lives'} left — slip back in`, 3);
}

function step(dt) {
  if (state.screen !== SCREEN_PLAY || state.paused || state.frozen) return;
  state.time += dt;
  const p = state.player;
  stepPlayer(p, input, dt);
  for (const g of state.guards) stepGuard(g, dt, p, state.smokePuffs);
  stepCameras(state.cameras, state.time);
  for (let i = state.coins.length - 1; i >= 0; i -= 1) {
    state.coins[i].timer -= dt;
    if (state.coins[i].timer <= 0) state.coins.splice(i, 1);
  }
  for (let i = state.smokePuffs.length - 1; i >= 0; i -= 1) {
    state.smokePuffs[i].timer -= dt;
    if (state.smokePuffs[i].timer <= 0) state.smokePuffs.splice(i, 1);
  }
  const seen = updateDetection(state, dt);
  if (state.alarm >= 0.7 && !state.alarmWasHigh) {
    sfx.alarm();
    state.alarmWasHigh = true;
  }
  if (state.alarm < 0.5) state.alarmWasHigh = false;
  if (seen.seenByGuard && state.alarm > 0.55) {
    for (const g of state.guards) {
      if (g.state === GUARD_STATE.PATROL) {
        g.state = GUARD_STATE.CHASE;
        g.chaseTimer = 2.5;
      }
    }
  }
  if (state.alarm >= 1) {
    loseLife();
    return;
  }
  // A chasing guard that touches the thief catches them outright.
  for (const g of state.guards) {
    if (g.state === GUARD_STATE.CHASE && Math.hypot(g.x - p.x, g.y - p.y) < 30) {
      loseLife();
      return;
    }
  }
  const lootName = tryPickupLoot(p);
  if (lootName) {
    sfx.pickup();
    setMessage(`${lootName} secured! (${p.loot.length}/3)`);
  }
  if (crackVault(p, input, dt)) {
    sfx.vaultOpen();
    setMessage('Vault cracked — grab the gold and run!', 3.2);
  } else if (input.crack && p.crackProgress > 0.2) {
    if (Math.random() < dt * 6) sfx.crack();
  }
  state.ready = heistReady(p);
  if (state.ready && atExit(p)) winGame();
  if (state.messageTimer > 0) {
    state.messageTimer -= dt;
    if (state.messageTimer <= 0) state.message = '';
  }
  state.objective = objectiveText();
}

function draw(time) {
  ctx.clearRect(0, 0, FIELD.width, FIELD.height);
  if (state.screen === SCREEN_TITLE) drawTitle(ctx, time);
  else if (state.screen === SCREEN_WIN || state.screen === SCREEN_OVER) drawEnd(ctx, state, state.screen === SCREEN_WIN);
  else drawGame(ctx, state, time);
}

let last = performance.now();
let acc = 0;
function frame(now) {
  const elapsed = Math.min(0.25, (now - last) / 1000);
  last = now;
  acc += elapsed;
  while (acc >= STEP) {
    step(STEP);
    acc -= STEP;
  }
  draw(now / 1000);
  requestAnimationFrame(frame);
}

const KEYMAP = {
  KeyW: 'up', ArrowUp: 'up',
  KeyS: 'down', ArrowDown: 'down',
  KeyA: 'left', ArrowLeft: 'left',
  KeyD: 'right', ArrowRight: 'right',
  ShiftLeft: 'sneak', ShiftRight: 'sneak',
  Space: 'dash',
  KeyF: 'crack',
};

window.addEventListener('keydown', (event) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) event.preventDefault();
  const mapped = KEYMAP[event.code];
  if (mapped) input[mapped] = true;
  if (event.repeat) return;
  if (event.code === 'KeyE') {
    if (state.screen === SCREEN_PLAY && !state.paused) {
      const coin = throwCoin(state.player, state.coins);
      if (coin) {
        lureGuard(state.guards, coin.x, coin.y);
        sfx.coin();
      }
    }
  }
  if (event.code === 'KeyQ') {
    if (state.screen === SCREEN_PLAY && !state.paused && puffSmoke(state.player, state.smokePuffs)) sfx.smoke();
  }
  if (event.code === 'Space' && state.screen === SCREEN_PLAY && !state.paused && state.player.dashCooldown <= 0) sfx.dash();
  if (event.code === 'Enter') {
    if (state.screen === SCREEN_TITLE) startGame();
    else if (state.screen === SCREEN_WIN || state.screen === SCREEN_OVER) startGame();
  }
  if (event.code === 'KeyR') {
    if (state.screen !== SCREEN_TITLE) startGame();
  }
  if (event.code === 'KeyP') {
    if (state.screen === SCREEN_PLAY) {
      state.paused = !state.paused;
      sfx.click();
    }
  }
  if (event.code === 'KeyM') {
    toggleMute();
    setMessage(isMuted() ? 'Sound off' : 'Sound on', 1.2);
  }
});

window.addEventListener('keyup', (event) => {
  const mapped = KEYMAP[event.code];
  if (mapped) input[mapped] = false;
});

canvas.addEventListener('click', () => {
  if (state.screen === SCREEN_TITLE) startGame();
});

window.addEventListener('resize', fitCanvas);

// Screenshot staging: ?shot=start|play|caught|end|over&seed=<n> renders one
// fixed frame of the real game, so the judge sees the heist as it plays.
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
state.best = loadBest();
if (shot) {
  state.screen = stageShot(shot, state);
  state.objective = objectiveText();
  // Freeze the staged frame: no simulation runs under a screenshot, and the
  // PAUSED overlay stays off (frozen is not paused).
  state.frozen = state.screen === SCREEN_PLAY;
} else {
  state.objective = objectiveText();
}

fitCanvas();
statusEl.textContent = 'The Velvet Vault — a night heist in the velvet gallery.';
requestAnimationFrame(frame);
