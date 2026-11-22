// The Velvet Vault — every tuning number and colour in one place.
// The gallery is a fixed 1280x720 logical floor; the renderer scales it to
// the window, so no rule below depends on the screen size.
export const FIELD = { width: 1280, height: 720 };

/** Fixed simulation step, in seconds: 60 updates a second whatever the display rate. */
export const STEP = 1 / 60;

export const PLAYER = {
  radius: 13,
  walkSpeed: 205,
  sneakSpeed: 115,
  dashSpeed: 430,
  dashTime: 0.22,
  dashCooldown: 1.1,
  crackTime: 3.0,
};

export const GUARD = {
  radius: 14,
  patrolSpeed: 78,
  chaseSpeed: 165,
  /** Degrees of the vision cone. */
  coneHalfAngle: (34 * Math.PI) / 180,
  coneRange: 235,
  /** Seconds a guard investigates a thrown coin. */
  investigateTime: 3.2,
  /** Seconds a guard keeps chasing after losing sight. */
  chaseMemory: 2.5,
};

export const CAMERA = {
  coneHalfAngle: (26 * Math.PI) / 180,
  coneRange: 260,
  sweepSpeed: 0.55,
  sweepArc: 0.85,
};

export const DETECTION = {
  /** Alarm fill per second while fully seen, standing in the open. */
  baseRate: 0.55,
  sneakRate: 0.22,
  dashRate: 0.85,
  /** Alarm fill per second while a camera sees the player. */
  cameraRate: 0.4,
  /** Alarm decay per second while unseen. */
  decayRate: 0.16,
  /** Alarm level at which guards start converging even before a full spot. */
  suspicious: 0.55,
};

export const TOOLS = { coins: 3, smoke: 2, smokeRadius: 95, smokeTime: 5 };

export const LIVES = 3;

export const PALETTE = {
  floor: '#241a2e',
  floorLight: '#2e2138',
  floorDark: '#1c1424',
  wall: '#3a2b4d',
  wallTop: '#4a3860',
  velvet: '#8e1f3c',
  velvetDark: '#5e1428',
  brass: '#d4a94e',
  brassLight: '#f2c94c',
  gold: '#ffd76a',
  lamp: '#ffb85c',
  guard: '#c94f5e',
  guardDark: '#7e2a35',
  camera: '#9aa7b8',
  cone: 'rgba(255, 214, 106, 0.20)',
  coneHot: 'rgba(255, 84, 84, 0.34)',
  coneCam: 'rgba(120, 200, 255, 0.20)',
  player: '#e8e4f0',
  playerCoat: '#3d2b52',
  shadow: 'rgba(0, 0, 0, 0.45)',
  text: '#f4ead8',
  muted: '#b9a8c9',
  danger: '#ff5a5a',
  safe: '#7ee2a0',
  panel: 'rgba(16, 10, 22, 0.88)',
  exit: '#58e39a',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best heist time is kept between visits (this browser only). */
export const BEST_KEY = 'velvet-vault.best-seconds';
