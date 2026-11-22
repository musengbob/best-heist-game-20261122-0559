// The Velvet Vault — the gallery floor: walls, cover, ropes, cases, lamps,
// loot, the vault, the getaway exit, guard patrol routes and camera mounts.
// Nothing here moves; guards.js and player.js read these shapes.
import { FIELD } from './config.js';

/** The outer room. The player, guards and cones all live inside it. */
export const ROOM = { x: 40, y: 84, w: 1200, h: 596 };

/** The entrance mat where the thief starts (and restarts after being caught). */
export const ENTRANCE = { x: 84, y: 560, w: 90, h: 60 };

/** The getaway van door: glowing exit, bottom-left once the loot is secured. */
export const EXIT = { x: 52, y: 620, w: 104, h: 46 };

/** The vault: stand beside it and hold F to crack it open. */
export const VAULT = { x: 1120, y: 120, w: 96, h: 84 };

/**
 * Cover pieces. `blocksSight` pieces stop vision cones; every piece stops
 * movement. `kind` picks how render.js draws it: case (glass display case),
 * pillar (marble column), crate (wooden crate), rope (velvet rope line),
 * plant (potted palm), desk (curator desk).
 */
export const COVER = [
  { kind: 'case', x: 300, y: 180, w: 130, h: 64, blocksSight: true },
  { kind: 'case', x: 560, y: 180, w: 130, h: 64, blocksSight: true },
  { kind: 'case', x: 820, y: 180, w: 130, h: 64, blocksSight: true },
  { kind: 'pillar', x: 300, y: 380, w: 46, h: 46, blocksSight: true },
  { kind: 'pillar', x: 620, y: 380, w: 46, h: 46, blocksSight: true },
  { kind: 'pillar', x: 940, y: 380, w: 46, h: 46, blocksSight: true },
  { kind: 'crate', x: 180, y: 300, w: 84, h: 60, blocksSight: true },
  { kind: 'crate', x: 1060, y: 300, w: 84, h: 60, blocksSight: true },
  { kind: 'case', x: 430, y: 520, w: 130, h: 56, blocksSight: true },
  { kind: 'case', x: 760, y: 520, w: 130, h: 56, blocksSight: true },
  { kind: 'desk', x: 180, y: 120, w: 96, h: 48, blocksSight: true },
  { kind: 'plant', x: 1150, y: 520, w: 40, h: 40, blocksSight: false },
  { kind: 'plant', x: 60, y: 120, w: 40, h: 40, blocksSight: false },
  { kind: 'rope', x: 300, y: 300, w: 390, h: 10, blocksSight: false },
  { kind: 'rope', x: 820, y: 470, w: 250, h: 10, blocksSight: false },
];

/** Warm lamp pools that mark safe-ish lit ground (purely visual). */
export const LAMPS = [
  { x: 220, y: 170 }, { x: 480, y: 170 }, { x: 740, y: 170 }, { x: 1000, y: 170 },
  { x: 350, y: 470 }, { x: 690, y: 470 }, { x: 1010, y: 470 }, { x: 220, y: 600 },
];

/** The three loot pieces: a painting, a diamond, a gold bar. */
export const LOOT = [
  { id: 'painting', name: 'Velvet Portrait', x: 365, y: 278, kind: 'painting' },
  { id: 'diamond', name: 'Star Diamond', x: 885, y: 278, kind: 'diamond' },
  { id: 'gold', name: 'Gold Bar', x: 825, y: 608, kind: 'gold' },
];

/** Four patrol guards, each with a loop of waypoints through the gallery. */
export const GUARD_ROUTES = [
  { x: 240, y: 260, waypoints: [{ x: 240, y: 260 }, { x: 240, y: 480 }, { x: 480, y: 480 }, { x: 480, y: 260 }] },
  { x: 640, y: 260, waypoints: [{ x: 640, y: 260 }, { x: 640, y: 480 }, { x: 900, y: 480 }, { x: 900, y: 260 }] },
  { x: 1080, y: 200, waypoints: [{ x: 1080, y: 200 }, { x: 1080, y: 470 }, { x: 960, y: 470 }] },
  { x: 420, y: 620, waypoints: [{ x: 420, y: 620 }, { x: 700, y: 620 }, { x: 700, y: 560 }] },
];

/** Two ceiling cameras, sweeping their cones back and forth. */
export const CAMERAS = [
  { x: 520, y: 110, baseAngle: Math.PI / 2, phase: 0 },
  { x: 980, y: 110, baseAngle: Math.PI / 2, phase: 1.6 },
];

/** A point is inside the walkable room (walls keep everyone in). */
export function insideRoom(x, y, r) {
  return x > ROOM.x + r && x < ROOM.x + ROOM.w - r && y > ROOM.y + r && y < ROOM.y + ROOM.h - r;
}

/** Push a circle (x, y, r) out of every solid rectangle it overlaps. */
export function resolveCircle(x, y, r, solids) {
  for (const s of solids) {
    const cx = Math.max(s.x, Math.min(x, s.x + s.w));
    const cy = Math.max(s.y, Math.min(y, s.y + s.h));
    const dx = x - cx;
    const dy = y - cy;
    const d2 = dx * dx + dy * dy;
    if (d2 < r * r && d2 > 0.0001) {
      const d = Math.sqrt(d2);
      x = cx + (dx / d) * r;
      y = cy + (dy / d) * r;
    } else if (d2 <= 0.0001) {
      // Centre inside the rectangle: push out along the smallest overlap.
      const left = x - s.x;
      const right = s.x + s.w - x;
      const top = y - s.y;
      const bottom = s.y + s.h - y;
      const m = Math.min(left, right, top, bottom);
      if (m === left) x = s.x - r;
      else if (m === right) x = s.x + s.w + r;
      else if (m === top) y = s.y - r;
      else y = s.y + s.h + r;
    }
  }
  return { x, y };
}

/** All rectangles that block movement (cover + vault + room walls as a frame). */
export function solidRects() {
  const solids = COVER.filter((c) => c.kind !== 'rope').map((c) => ({ x: c.x, y: c.y, w: c.w, h: c.h }));
  solids.push({ x: VAULT.x, y: VAULT.y, w: VAULT.w, h: VAULT.h });
  return solids;
}

/** Segment (ax,ay)-(bx,by) hits rectangle r? Used for line of sight. */
export function segmentHitsRect(ax, ay, bx, by, r) {
  const dx = bx - ax;
  const dy = by - ay;
  let tmin = 0;
  let tmax = 1;
  if (dx === 0) {
    if (ax < r.x || ax > r.x + r.w) return false;
  } else {
    let t1 = (r.x - ax) / dx;
    let t2 = (r.x + r.w - ax) / dx;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  }
  if (dy === 0) {
    if (ay < r.y || ay > r.y + r.h) return false;
  } else {
    let t1 = (r.y - ay) / dy;
    let t2 = (r.y + r.h - ay) / dy;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  }
  return true;
}

/** True when nothing sight-blocking stands between the two points. */
export function hasLineOfSight(ax, ay, bx, by, smokePuffs) {
  for (const c of COVER) {
    if (!c.blocksSight) continue;
    if (segmentHitsRect(ax, ay, bx, by, c)) return false;
  }
  if (segmentHitsRect(ax, ay, bx, by, VAULT)) return false;
  for (const puff of smokePuffs) {
    if (segmentHitsRect(ax, ay, bx, by, { x: puff.x - puff.r, y: puff.y - puff.r, w: puff.r * 2, h: puff.r * 2 })) return false;
  }
  return true;
}

export { FIELD };
