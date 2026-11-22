// The Velvet Vault — guards, cameras and the alarm meter.
// A guard patrols waypoints, sweeps its vision cone, and chases when the
// alarm peaks; a camera sweeps its cone and only feeds the alarm meter.
import { GUARD, CAMERA, DETECTION } from './config.js';
import { GUARD_ROUTES, CAMERAS, hasLineOfSight, insideRoom, resolveCircle, solidRects } from './level.js';

export const GUARD_STATE = { PATROL: 'patrol', INVESTIGATE: 'investigate', CHASE: 'chase', RETURN: 'return' };

function angleTo(ax, ay, bx, by) {
  return Math.atan2(by - ay, bx - ax);
}

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/** Is the target inside a cone (range + half-angle) with a clear line of sight? */
export function inCone(ox, oy, angle, halfAngle, range, tx, ty, smokePuffs) {
  const dx = tx - ox;
  const dy = ty - oy;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return false;
  if (Math.abs(angleDiff(Math.atan2(dy, dx), angle)) > halfAngle) return false;
  return hasLineOfSight(ox, oy, tx, ty, smokePuffs);
}

export function makeGuards() {
  return GUARD_ROUTES.map((route) => ({
    x: route.x,
    y: route.y,
    angle: Math.PI / 2,
    waypoints: route.waypoints,
    wp: 1,
    state: GUARD_STATE.PATROL,
    wait: 0,
    investigate: null,
    investigateTimer: 0,
    chaseTimer: 0,
    home: { x: route.x, y: route.y },
    spotted: false,
  }));
}

export function makeCameras() {
  return CAMERAS.map((c) => ({ x: c.x, y: c.y, baseAngle: c.baseAngle, phase: c.phase, angle: c.baseAngle, seen: false }));
}

/** Step one guard: patrol its loop, walk to a coin, or chase the thief. */
export function stepGuard(g, dt, player, smokePuffs, solids) {
  let speed = GUARD.patrolSpeed;
  let target = null;
  if (g.state === GUARD_STATE.PATROL) {
    target = g.waypoints[g.wp];
    if (Math.hypot(target.x - g.x, target.y - g.y) < 10) {
      g.wp = (g.wp + 1) % g.waypoints.length;
      g.wait = 0.9;
    }
  } else if (g.state === GUARD_STATE.INVESTIGATE && g.investigate) {
    target = g.investigate;
    if (Math.hypot(target.x - g.x, target.y - g.y) < 14) {
      g.investigateTimer -= dt;
      if (g.investigateTimer <= 0) {
        g.state = GUARD_STATE.RETURN;
        g.investigate = null;
      }
    }
  } else if (g.state === GUARD_STATE.CHASE) {
    speed = GUARD.chaseSpeed;
    target = { x: player.x, y: player.y };
    g.chaseTimer -= dt;
    if (g.chaseTimer <= 0) g.state = GUARD_STATE.RETURN;
  } else if (g.state === GUARD_STATE.RETURN) {
    target = g.home;
    if (Math.hypot(target.x - g.x, target.y - g.y) < 12) {
      g.state = GUARD_STATE.PATROL;
      g.wp = 1;
    }
  }
  if (g.wait > 0) {
    g.wait -= dt;
    // Paused at a waypoint: slowly sweep the cone left and right.
    g.angle += Math.sin(Date.now() / 900 + g.x) * 0.35 * dt;
    return;
  }
  if (!target) return;
  const dx = target.x - g.x;
  const dy = target.y - g.y;
  const dist = Math.hypot(dx, dy);
  if (dist > 0.01) {
    const want = Math.atan2(dy, dx);
    g.angle += Math.max(-3.2 * dt, Math.min(3.2 * dt, angleDiff(want, g.angle)));
    const step = Math.min(dist, speed * dt);
    const pos = resolveCircle(g.x + (dx / dist) * step, g.y + (dy / dist) * step, GUARD.radius, solids);
    g.x = Math.max(54, Math.min(1226, pos.x));
    g.y = Math.max(98, Math.min(666, pos.y));
  }
}

/** A guard hears a thrown coin and walks over to look at it. */
export function lureGuard(guards, x, y) {
  let best = null;
  let bestDist = Infinity;
  for (const g of guards) {
    const d = Math.hypot(g.x - x, g.y - y);
    if (d < bestDist) {
      bestDist = d;
      best = g;
    }
  }
  if (best && best.state !== GUARD_STATE.CHASE) {
    best.state = GUARD_STATE.INVESTIGATE;
    best.investigate = { x, y };
    best.investigateTimer = GUARD.investigateTime;
  }
}

/** Sweep each camera cone back and forth around its mount angle. */
export function stepCameras(cameras, time) {
  for (const c of cameras) {
    c.angle = c.baseAngle + Math.sin(time * CAMERA.sweepSpeed + c.phase) * CAMERA.sweepArc;
  }
}

/**
 * Work out what every watcher sees this tick and move the alarm meter.
 * Returns { seenByGuard, seenByCamera, anySeen }. Sneaking slows the fill,
 * dashing speeds it, smoke blocks every cone.
 */
export function updateDetection(state, dt) {
  const { player, guards, cameras, smokePuffs } = state;
  let seenByGuard = false;
  let seenByCamera = false;
  for (const g of guards) {
    const seen = inCone(g.x, g.y, g.angle, GUARD.coneHalfAngle, GUARD.coneRange, player.x, player.y, smokePuffs);
    g.spotted = seen;
    if (seen) seenByGuard = true;
  }
  for (const c of cameras) {
    c.seen = inCone(c.x, c.y, c.angle, CAMERA.coneHalfAngle, CAMERA.coneRange, player.x, player.y, smokePuffs);
    if (c.seen) seenByCamera = true;
  }
  const rate = player.sneaking
    ? DETECTION.sneakRate
    : player.dashing
      ? DETECTION.dashRate
      : DETECTION.baseRate;
  if (seenByGuard) state.alarm = Math.min(1, state.alarm + rate * dt);
  else if (seenByCamera) state.alarm = Math.min(1, state.alarm + DETECTION.cameraRate * dt);
  else state.alarm = Math.max(0, state.alarm - DETECTION.decayRate * dt);

  if (state.alarm >= DETECTION.suspicious) {
    for (const g of guards) {
      if (g.state === GUARD_STATE.PATROL && seenByGuard) {
        g.state = GUARD_STATE.CHASE;
        g.chaseTimer = GUARD.chaseMemory;
      }
    }
  }
  return { seenByGuard, seenByCamera, anySeen: seenByGuard || seenByCamera };
}

export { solidRects, insideRoom };
