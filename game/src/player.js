// The Velvet Vault — the thief: movement, sneak/dash, tools (coin, smoke),
// loot pickup and cracking the vault.
import { PLAYER, TOOLS } from './config.js';
import { ENTRANCE, LOOT, VAULT, EXIT, resolveCircle, solidRects } from './level.js';

export function makePlayer() {
  return {
    x: ENTRANCE.x + ENTRANCE.w / 2,
    y: ENTRANCE.y + ENTRANCE.h / 2,
    angle: -Math.PI / 2,
    sneaking: false,
    dashing: false,
    dashTimer: 0,
    dashCooldown: 0,
    coins: TOOLS.coins,
    smoke: TOOLS.smoke,
    loot: [],
    crackProgress: 0,
    vaultCracked: false,
    moving: false,
  };
}

/** Move the thief; returns nothing, mutates `player` in place. */
export function stepPlayer(player, input, dt) {
  const solids = solidRects();
  let mx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  let my = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  player.moving = mx !== 0 || my !== 0;
  if (player.moving) {
    const len = Math.hypot(mx, my);
    mx /= len;
    my /= len;
    player.angle = Math.atan2(my, mx);
  }
  player.sneaking = !!input.sneak && !player.dashing;
  player.dashCooldown = Math.max(0, player.dashCooldown - dt);
  if (input.dash && player.dashCooldown <= 0 && player.moving && !player.dashing) {
    player.dashing = true;
    player.dashTimer = PLAYER.dashTime;
    player.dashCooldown = PLAYER.dashCooldown;
  }
  let speed = player.sneaking ? PLAYER.sneakSpeed : PLAYER.walkSpeed;
  if (player.dashing) {
    speed = PLAYER.dashSpeed;
    player.dashTimer -= dt;
    if (player.dashTimer <= 0) player.dashing = false;
  }
  const nx = player.x + mx * speed * dt;
  const ny = player.y + my * speed * dt;
  const pos = resolveCircle(nx, ny, PLAYER.radius, solids);
  player.x = Math.max(54, Math.min(1226, pos.x));
  player.y = Math.max(98, Math.min(666, pos.y));
}

/** Throw a coin: it lands ahead of the thief and lures the nearest guard. */
export function throwCoin(player, coins) {
  if (player.coins <= 0) return null;
  player.coins -= 1;
  const cx = player.x + Math.cos(player.angle) * 90;
  const cy = player.y + Math.sin(player.angle) * 90;
  const coin = { x: Math.max(70, Math.min(1210, cx)), y: Math.max(110, Math.min(650, cy)), timer: 4 };
  coins.push(coin);
  return coin;
}

/** Pop a smoke puff at the thief's feet; it blocks every vision cone. */
export function puffSmoke(player, smokePuffs) {
  if (player.smoke <= 0) return false;
  player.smoke -= 1;
  smokePuffs.push({ x: player.x, y: player.y, r: TOOLS.smokeRadius, timer: TOOLS.smokeTime });
  return true;
}

/** Pick up any loot piece the thief is standing on; returns its name or null. */
export function tryPickupLoot(player) {
  for (const piece of LOOT) {
    if (player.loot.includes(piece.id)) continue;
    if (Math.hypot(piece.x - player.x, piece.y - player.y) < 34) {
      player.loot.push(piece.id);
      return piece.name;
    }
  }
  return null;
}

/** Hold F beside the vault to crack it; returns true the moment it opens. */
export function crackVault(player, input, dt) {
  const near = Math.hypot(VAULT.x + VAULT.w / 2 - player.x, VAULT.y + VAULT.h / 2 - player.y) < 130;
  if (!near || player.vaultCracked) {
    player.crackProgress = Math.max(0, player.crackProgress - dt * 2);
    return false;
  }
  if (input.crack) {
    player.crackProgress += dt;
    if (player.crackProgress >= PLAYER.crackTime) {
      player.vaultCracked = true;
      return true;
    }
  } else {
    player.crackProgress = Math.max(0, player.crackProgress - dt * 2);
  }
  return false;
}

/** The heist is ready to end when the vault is cracked or all 3 loot pieces are held. */
export function heistReady(player) {
  return player.vaultCracked || player.loot.length >= LOOT.length;
}

/** Is the thief standing in the glowing getaway exit with the loot secured? */
export function atExit(player) {
  return (
    player.x > EXIT.x - 10 &&
    player.x < EXIT.x + EXIT.w + 10 &&
    player.y > EXIT.y - 10 &&
    player.y < EXIT.y + EXIT.h + 10
  );
}
