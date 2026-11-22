// The Velvet Vault — deterministic screenshot staging for ?shot=<name>&seed=<n>.
// Each scene sets the live state directly (positions, alarm, screen) so the
// same seed always renders the same frame: no randomness, no autopilot.
import { SCREEN_TITLE, SCREEN_PLAY, SCREEN_WIN, SCREEN_OVER } from './render.js';
import { GUARD_STATE } from './guards.js';

/**
 * Stage the named scene on a fresh state and return the screen to draw.
 * start: title screen. play: mid-heist, thief behind a case, a guard cone
 * and a camera cone sweeping nearby, loot and the alarm meter all in frame.
 * caught: the alarm part-filled, a guard turning toward the thief.
 * end: the win screen at the getaway with the loot secured.
 */
export function stageShot(name, state) {
  state.reset();
  if (name === 'play') {
    // Thief crouched behind the middle display case, sneaking.
    state.player.x = 625;
    state.player.y = 270;
    state.player.sneaking = true;
    state.player.angle = Math.PI / 2;
    state.player.loot = ['painting'];
    // Guard 1 patrols just below the case, cone sweeping toward the thief.
    const g1 = state.guards[0];
    g1.x = 480;
    g1.y = 480;
    g1.angle = -Math.PI / 2 + 0.35;
    g1.state = GUARD_STATE.PATROL;
    // Guard 2 crosses the right aisle, cone toward the vault.
    const g2 = state.guards[1];
    g2.x = 900;
    g2.y = 300;
    g2.angle = Math.PI / 2 - 0.4;
    // Camera 1 sweeps down the centre aisle, cone near the thief.
    state.cameras[0].angle = Math.PI / 2 - 0.25;
    state.cameras[1].angle = Math.PI / 2 + 0.3;
    state.alarm = 0.34;
    state.time = 47;
    state.message = 'Stay out of the cones — sneak to the diamond';
    return SCREEN_PLAY;
  }
  if (name === 'caught') {
    // Thief stepped into guard 2's cone on the right aisle: alarm climbing.
    state.player.x = 880;
    state.player.y = 330;
    state.player.angle = -Math.PI / 2;
    state.player.loot = ['painting'];
    const g2 = state.guards[1];
    g2.x = 900;
    g2.y = 470;
    g2.angle = -Math.PI / 2;
    g2.state = GUARD_STATE.CHASE;
    g2.spotted = true;
    state.cameras[0].angle = Math.PI / 2 + 0.2;
    state.alarm = 0.72;
    state.time = 63;
    state.spottedCount = 0;
    state.message = 'SPOTTED — break line of sight!';
    return SCREEN_PLAY;
  }
  if (name === 'end') {
    // Heist complete: vault cracked, all loot held, thief at the getaway.
    state.player.x = 104;
    state.player.y = 643;
    state.player.angle = Math.PI;
    state.player.loot = ['painting', 'diamond', 'gold'];
    state.player.vaultCracked = true;
    state.ready = true;
    state.alarm = 0.08;
    state.time = 68;
    state.spottedCount = 0;
    state.best = '1:08';
    return SCREEN_WIN;
  }
  if (name === 'over') {
    state.lives = 0;
    state.time = 41;
    return SCREEN_OVER;
  }
  // Default: the title screen.
  return SCREEN_TITLE;
}
