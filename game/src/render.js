// The Velvet Vault — all procedural drawing: marble floor, velvet ropes,
// display cases, vision cones, cameras, the thief, HUD and overlays.
// Nothing here is an image; every shape is drawn by code on the canvas.
import { FIELD, PALETTE, FONT, GUARD, CAMERA } from './config.js';
import { ROOM, COVER, LAMPS, LOOT, VAULT, EXIT, ENTRANCE } from './level.js';
import { GUARD_STATE } from './guards.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_WIN = 'win';
export const SCREEN_OVER = 'over';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCone(ctx, x, y, angle, halfAngle, range, fill) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - halfAngle, angle + halfAngle);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function drawMarbleFloor(ctx) {
  ctx.fillStyle = PALETTE.floor;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  // Checker of large marble tiles with a faint vein in each.
  const tile = 80;
  for (let ty = 0; ty < FIELD.height / tile; ty += 1) {
    for (let tx = 0; tx < FIELD.width / tile; tx += 1) {
      if ((tx + ty) % 2 === 0) {
        ctx.fillStyle = PALETTE.floorLight;
        ctx.fillRect(tx * tile, ty * tile, tile, tile);
      }
      ctx.strokeStyle = 'rgba(212, 169, 78, 0.10)';
      ctx.lineWidth = 1;
      ctx.strokeRect(tx * tile + 0.5, ty * tile + 0.5, tile, tile);
      ctx.beginPath();
      ctx.moveTo(tx * tile + 12, ty * tile + tile * 0.6);
      ctx.quadraticCurveTo(tx * tile + tile / 2, ty * tile + tile * 0.3, tx * tile + tile - 10, ty * tile + tile * 0.75);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.stroke();
    }
  }
  // Deep-red carpet runner down the middle of the gallery.
  ctx.fillStyle = 'rgba(142, 31, 60, 0.35)';
  ctx.fillRect(ROOM.x + 480, ROOM.y, 240, ROOM.h);
  ctx.strokeStyle = 'rgba(212, 169, 78, 0.5)';
  ctx.lineWidth = 2;
  ctx.strokeRect(ROOM.x + 480, ROOM.y, 240, ROOM.h);
}

function drawRoom(ctx, time) {
  drawMarbleFloor(ctx);
  // Warm lamp pools on the floor.
  for (const lamp of LAMPS) {
    const g = ctx.createRadialGradient(lamp.x, lamp.y, 4, lamp.x, lamp.y, 130);
    g.addColorStop(0, 'rgba(255, 184, 92, 0.20)');
    g.addColorStop(1, 'rgba(255, 184, 92, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(lamp.x, lamp.y, 130, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.lamp;
    ctx.beginPath();
    ctx.arc(lamp.x, lamp.y, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  // Walls: a thick plum frame with a brass inner edge.
  ctx.fillStyle = PALETTE.wall;
  ctx.fillRect(ROOM.x - 14, ROOM.y - 14, ROOM.w + 28, 14);
  ctx.fillRect(ROOM.x - 14, ROOM.y + ROOM.h, ROOM.w + 28, 14);
  ctx.fillRect(ROOM.x - 14, ROOM.y, 14, ROOM.h);
  ctx.fillRect(ROOM.x + ROOM.w, ROOM.y, 14, ROOM.h);
  ctx.strokeStyle = PALETTE.brass;
  ctx.lineWidth = 2;
  ctx.strokeRect(ROOM.x - 0.5, ROOM.y - 0.5, ROOM.w, ROOM.h);
  // Entrance mat.
  ctx.fillStyle = '#31263f';
  ctx.fillRect(ENTRANCE.x, ENTRANCE.y, ENTRANCE.w, ENTRANCE.h);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = `600 13px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText('SERVICE DOOR', ENTRANCE.x + ENTRANCE.w / 2, ENTRANCE.y + ENTRANCE.h / 2 + 5);
  void time;
}

function drawCover(ctx, time) {
  for (const c of COVER) {
    if (c.kind === 'case') {
      ctx.fillStyle = '#171226';
      rr(ctx, c.x, c.y, c.w, c.h, 6);
      ctx.fill();
      ctx.fillStyle = 'rgba(150, 200, 255, 0.16)';
      rr(ctx, c.x + 4, c.y + 4, c.w - 8, c.h - 8, 4);
      ctx.fill();
      ctx.strokeStyle = PALETTE.brass;
      ctx.lineWidth = 2;
      rr(ctx, c.x, c.y, c.w, c.h, 6);
      ctx.stroke();
      ctx.fillStyle = PALETTE.brassLight;
      ctx.beginPath();
      ctx.arc(c.x + c.w / 2, c.y + c.h / 2, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (c.kind === 'pillar') {
      ctx.fillStyle = PALETTE.shadow;
      ctx.beginPath();
      ctx.ellipse(c.x + c.w / 2 + 5, c.y + c.h / 2 + 6, 30, 26, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#d8cfc0';
      ctx.beginPath();
      ctx.arc(c.x + c.w / 2, c.y + c.h / 2, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#b8ac96';
      ctx.beginPath();
      ctx.arc(c.x + c.w / 2, c.y + c.h / 2, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = PALETTE.brass;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(c.x + c.w / 2, c.y + c.h / 2, 22, 0, Math.PI * 2);
      ctx.stroke();
    } else if (c.kind === 'crate') {
      ctx.fillStyle = '#5a4026';
      rr(ctx, c.x, c.y, c.w, c.h, 4);
      ctx.fill();
      ctx.strokeStyle = '#7d5a34';
      ctx.lineWidth = 2;
      rr(ctx, c.x, c.y, c.w, c.h, 4);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(c.x, c.y);
      ctx.lineTo(c.x + c.w, c.y + c.h);
      ctx.moveTo(c.x + c.w, c.y);
      ctx.lineTo(c.x, c.y + c.h);
      ctx.stroke();
    } else if (c.kind === 'desk') {
      ctx.fillStyle = '#3a2b4d';
      rr(ctx, c.x, c.y, c.w, c.h, 5);
      ctx.fill();
      ctx.strokeStyle = PALETTE.brass;
      ctx.lineWidth = 2;
      rr(ctx, c.x, c.y, c.w, c.h, 5);
      ctx.stroke();
      ctx.fillStyle = PALETTE.brassLight;
      ctx.font = `600 11px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText('CURATOR', c.x + c.w / 2, c.y + c.h / 2 + 4);
    } else if (c.kind === 'plant') {
      ctx.fillStyle = '#2e5a34';
      ctx.beginPath();
      ctx.arc(c.x + c.w / 2, c.y + c.h / 2, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3f7a46';
      ctx.beginPath();
      ctx.arc(c.x + c.w / 2 - 6, c.y + c.h / 2 - 4, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#8a5a30';
      ctx.beginPath();
      ctx.arc(c.x + c.w / 2, c.y + c.h / 2, 7, 0, Math.PI * 2);
      ctx.fill();
    } else if (c.kind === 'rope') {
      // Velvet rope: brass posts with a sagging red cord between them.
      const posts = [c.x, c.x + c.w / 2, c.x + c.w];
      for (const px of posts) {
        ctx.fillStyle = PALETTE.brass;
        ctx.beginPath();
        ctx.arc(px, c.y + c.h / 2, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = PALETTE.velvet;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(c.x, c.y + c.h / 2);
      ctx.quadraticCurveTo(c.x + c.w / 4, c.y + c.h / 2 + 12, c.x + c.w / 2, c.y + c.h / 2);
      ctx.quadraticCurveTo(c.x + (3 * c.w) / 4, c.y + c.h / 2 + 12, c.x + c.w, c.y + c.h / 2);
      ctx.stroke();
    }
  }
  void time;
}

function drawLoot(ctx, player, time) {
  for (const piece of LOOT) {
    if (player.loot.includes(piece.id)) continue;
    const bob = Math.sin(time * 2.4 + piece.x) * 3;
    const glint = 0.55 + 0.45 * Math.sin(time * 3 + piece.x);
    if (piece.kind === 'painting') {
      ctx.fillStyle = '#5e1428';
      ctx.fillRect(piece.x - 22, piece.y - 16 + bob, 44, 32);
      ctx.strokeStyle = PALETTE.brass;
      ctx.lineWidth = 3;
      ctx.strokeRect(piece.x - 22, piece.y - 16 + bob, 44, 32);
      ctx.fillStyle = '#7fb2d9';
      ctx.fillRect(piece.x - 17, piece.y - 11 + bob, 34, 22);
      ctx.fillStyle = '#e8c87a';
      ctx.beginPath();
      ctx.arc(piece.x, piece.y + bob, 6, 0, Math.PI * 2);
      ctx.fill();
    } else if (piece.kind === 'diamond') {
      ctx.save();
      ctx.translate(piece.x, piece.y + bob);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = `rgba(180, 230, 255, ${0.75 + glint * 0.25})`;
      ctx.fillRect(-11, -11, 22, 22);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(-11, -11, 22, 22);
      ctx.restore();
    } else {
      ctx.fillStyle = PALETTE.gold;
      ctx.save();
      ctx.translate(piece.x, piece.y + bob);
      ctx.rotate(-0.12);
      ctx.fillRect(-16, -8, 32, 16);
      ctx.strokeStyle = '#a67c1e';
      ctx.lineWidth = 2;
      ctx.strokeRect(-16, -8, 32, 16);
      ctx.restore();
    }
    ctx.fillStyle = `rgba(255, 215, 106, ${0.35 + glint * 0.4})`;
    ctx.beginPath();
    ctx.arc(piece.x, piece.y + bob, 26 + glint * 6, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawVault(ctx, player, time) {
  const cx = VAULT.x + VAULT.w / 2;
  const cy = VAULT.y + VAULT.h / 2;
  ctx.fillStyle = '#2c2f3a';
  rr(ctx, VAULT.x, VAULT.y, VAULT.w, VAULT.h, 8);
  ctx.fill();
  ctx.strokeStyle = player.vaultCracked ? PALETTE.safe : PALETTE.brass;
  ctx.lineWidth = 3;
  rr(ctx, VAULT.x, VAULT.y, VAULT.w, VAULT.h, 8);
  ctx.stroke();
  ctx.fillStyle = '#454a5c';
  ctx.beginPath();
  ctx.arc(cx, cy, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PALETTE.brassLight;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, 24, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 8; i += 1) {
    const a = (i / 8) * Math.PI * 2 + time * 0.15;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * 18, cy + Math.sin(a) * 18);
    ctx.lineTo(cx + Math.cos(a) * 24, cy + Math.sin(a) * 24);
    ctx.stroke();
  }
  ctx.fillStyle = player.vaultCracked ? PALETTE.safe : PALETTE.text;
  ctx.font = `700 13px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText(player.vaultCracked ? 'OPEN' : 'VAULT', cx, VAULT.y - 8);
  if (!player.vaultCracked && player.crackProgress > 0) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(cx - 40, VAULT.y + VAULT.h + 6, 80, 10);
    ctx.fillStyle = PALETTE.brassLight;
    ctx.fillRect(cx - 40, VAULT.y + VAULT.h + 6, 80 * (player.crackProgress / 3), 10);
  }
  if (!player.vaultCracked) {
    const near = Math.hypot(cx - player.x, cy - player.y) < 130;
    if (near) {
      ctx.fillStyle = PALETTE.text;
      ctx.font = `600 13px ${FONT}`;
      ctx.fillText('Hold F to crack', cx, VAULT.y + VAULT.h + 26);
    }
  }
}

function drawExit(ctx, ready, time) {
  const pulse = ready ? 0.75 + 0.25 * Math.sin(time * 4) : 0.35;
  ctx.fillStyle = `rgba(88, 227, 154, ${0.25 * pulse + 0.1})`;
  ctx.fillRect(EXIT.x - 8, EXIT.y - 8, EXIT.w + 16, EXIT.h + 16);
  ctx.fillStyle = '#0e2a1c';
  rr(ctx, EXIT.x, EXIT.y, EXIT.w, EXIT.h, 6);
  ctx.fill();
  ctx.strokeStyle = PALETTE.exit;
  ctx.lineWidth = ready ? 3 : 2;
  rr(ctx, EXIT.x, EXIT.y, EXIT.w, EXIT.h, 6);
  ctx.stroke();
  ctx.fillStyle = PALETTE.exit;
  ctx.font = `700 15px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText(ready ? 'GETAWAY →' : 'GETAWAY', EXIT.x + EXIT.w / 2, EXIT.y + EXIT.h / 2 + 5);
  if (ready) {
    ctx.fillStyle = PALETTE.text;
    ctx.font = `600 12px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.fillText('ESCAPE NOW →', EXIT.x + EXIT.w + 12, EXIT.y + EXIT.h / 2 + 4);
    ctx.textAlign = 'center';
  }
}

function drawGuards(ctx, guards, time) {
  for (const g of guards) {
    const hot = g.spotted || g.state === GUARD_STATE.CHASE;
    drawCone(ctx, g.x, g.y, g.angle, GUARD.coneHalfAngle, GUARD.coneRange, hot ? PALETTE.coneHot : PALETTE.cone);
    // Shadow + body.
    ctx.fillStyle = PALETTE.shadow;
    ctx.beginPath();
    ctx.ellipse(g.x + 3, g.y + 5, 16, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = g.state === GUARD_STATE.CHASE ? PALETTE.danger : PALETTE.guard;
    ctx.beginPath();
    ctx.arc(g.x, g.y, GUARD.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2a1015';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(g.x, g.y, GUARD.radius, 0, Math.PI * 2);
    ctx.stroke();
    // Cap brim pointing where the guard looks.
    ctx.fillStyle = '#1c0d12';
    ctx.beginPath();
    ctx.arc(g.x + Math.cos(g.angle) * 8, g.y + Math.sin(g.angle) * 8, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.brassLight;
    ctx.beginPath();
    ctx.arc(g.x - Math.cos(g.angle) * 4, g.y - Math.sin(g.angle) * 4, 2.5, 0, Math.PI * 2);
    ctx.fill();
    if (g.state === GUARD_STATE.INVESTIGATE) {
      ctx.fillStyle = PALETTE.brassLight;
      ctx.font = `700 16px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText('?', g.x, g.y - 24);
    }
    if (hot) {
      ctx.fillStyle = PALETTE.danger;
      ctx.font = `700 18px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText('!', g.x, g.y - 24);
    }
  }
  void time;
}

function drawCameras(ctx, cameras, time) {
  for (const c of cameras) {
    drawCone(ctx, c.x, c.y, c.angle, CAMERA.coneHalfAngle, CAMERA.coneRange, c.seen ? PALETTE.coneHot : PALETTE.coneCam);
    ctx.fillStyle = '#1a1d26';
    ctx.beginPath();
    ctx.arc(c.x, c.y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.camera;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(c.x, c.y, 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = c.seen ? PALETTE.danger : PALETTE.danger;
    ctx.beginPath();
    ctx.arc(c.x + Math.cos(c.angle) * 12, c.y + Math.sin(c.angle) * 12, 4, 0, Math.PI * 2);
    ctx.fill();
    if (c.seen) {
      ctx.fillStyle = PALETTE.danger;
      ctx.font = `700 14px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText('REC ●', c.x, c.y - 18);
    }
  }
  void time;
}

function drawPlayer(ctx, player, time) {
  const bob = player.moving ? Math.sin(time * 12) * 1.5 : 0;
  ctx.fillStyle = PALETTE.shadow;
  ctx.beginPath();
  ctx.ellipse(player.x + 3, player.y + 5, 14, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  // Sneak = crouched (smaller, darker); dash = a motion streak.
  if (player.dashing) {
    ctx.strokeStyle = 'rgba(232, 228, 240, 0.5)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(player.x - Math.cos(player.angle) * 26, player.y - Math.sin(player.angle) * 26);
    ctx.lineTo(player.x - Math.cos(player.angle) * 12, player.y - Math.sin(player.angle) * 12);
    ctx.stroke();
  }
  const r = player.sneaking ? 11 : 13;
  ctx.fillStyle = PALETTE.playerCoat;
  ctx.beginPath();
  ctx.arc(player.x, player.y + bob, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PALETTE.player;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(player.x, player.y + bob, r, 0, Math.PI * 2);
  ctx.stroke();
  // Hooded head + eyes looking where the thief faces.
  ctx.fillStyle = PALETTE.player;
  ctx.beginPath();
  ctx.arc(player.x + Math.cos(player.angle) * 4, player.y + Math.sin(player.angle) * 4 + bob, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#14101c';
  ctx.beginPath();
  ctx.arc(player.x + Math.cos(player.angle) * 7, player.y + Math.sin(player.angle) * 7 + bob, 2, 0, Math.PI * 2);
  ctx.fill();
  if (player.sneaking) {
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `600 11px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('sneaking', player.x, player.y - 22);
  }
}

function drawTools(ctx, coins, smokePuffs, time) {
  for (const coin of coins) {
    ctx.fillStyle = PALETTE.gold;
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#a67c1e';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, 5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = `rgba(255, 215, 106, ${0.5 + 0.4 * Math.sin(time * 5)})`;
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, 9, 0, Math.PI * 2);
    ctx.stroke();
  }
  for (const puff of smokePuffs) {
    const alpha = Math.max(0, puff.timer / 5) * 0.5;
    ctx.fillStyle = `rgba(200, 200, 210, ${alpha})`;
    ctx.beginPath();
    ctx.arc(puff.x, puff.y, puff.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** The HUD bar across the top: alarm meter, loot, tools, lives, timer, objective. */
export function drawHUD(ctx, state) {
  ctx.fillStyle = PALETTE.panel;
  ctx.fillRect(0, 0, FIELD.width, 64);
  ctx.strokeStyle = PALETTE.brass;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 64.5);
  ctx.lineTo(FIELD.width, 64.5);
  ctx.stroke();
  ctx.textAlign = 'left';
  ctx.fillStyle = PALETTE.text;
  ctx.font = `700 17px ${FONT}`;
  ctx.fillText('THE VELVET VAULT', 20, 26);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = `600 12px ${FONT}`;
  ctx.fillText(state.objective, 20, 46);

  // Alarm meter — the heart of the HUD, always visible.
  const ax = 330;
  const ay = 16;
  const aw = 300;
  ctx.fillStyle = PALETTE.text;
  ctx.font = `700 13px ${FONT}`;
  ctx.fillText('ALARM', ax, ay + 12);
  ctx.fillStyle = '#241a2e';
  rr(ctx, ax + 62, ay, aw, 18, 9);
  ctx.fill();
  const alarm = state.alarm;
  const alarmColor = alarm < 0.35 ? PALETTE.safe : alarm < 0.7 ? PALETTE.brassLight : PALETTE.danger;
  if (alarm > 0.01) {
    ctx.fillStyle = alarmColor;
    rr(ctx, ax + 62, ay, Math.max(18, aw * alarm), 18, 9);
    ctx.fill();
  }
  ctx.strokeStyle = PALETTE.text;
  ctx.lineWidth = 1.5;
  rr(ctx, ax + 62, ay, aw, 18, 9);
  ctx.stroke();
  ctx.fillStyle = alarm >= 0.7 ? PALETTE.danger : PALETTE.muted;
  ctx.font = `700 12px ${FONT}`;
  ctx.fillText(alarm >= 0.7 ? 'SPOTTED!' : alarm >= 0.35 ? 'SUSPICIOUS' : 'UNSEEN', ax + 62 + aw + 10, ay + 14);

  // Loot, tools, lives, timer on the right.
  const right = 1260;
  ctx.textAlign = 'right';
  ctx.fillStyle = PALETTE.text;
  ctx.font = `700 15px ${FONT}`;
  ctx.fillText(`💎 Loot ${state.player.loot.length}/3${state.player.vaultCracked ? '  ·  VAULT OPEN' : ''}`, right, 26);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = `600 13px ${FONT}`;
  ctx.fillText(`🪙 Coins ${state.player.coins}   💨 Smoke ${state.player.smoke}`, right, 46);
  ctx.fillStyle = PALETTE.text;
  ctx.font = `700 15px ${FONT}`;
  ctx.fillText(`${'♥'.repeat(state.lives)}`, right - 330, 26);
  const t = Math.floor(state.time);
  ctx.fillText(`${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`, right - 330, 46);
  ctx.textAlign = 'left';
}

function drawBanner(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(10, 6, 14, 0.72)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.fillStyle = PALETTE.panel;
  rr(ctx, 340, 150, 600, 380, 14);
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  rr(ctx, 340, 150, 600, 380, 14);
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = accent;
  ctx.font = `700 40px ${FONT}`;
  ctx.fillText(title, 640, 220);
  ctx.fillStyle = PALETTE.text;
  ctx.font = `600 18px ${FONT}`;
  let y = 268;
  for (const line of lines) {
    ctx.fillText(line, 640, y);
    y += 30;
  }
  ctx.fillStyle = PALETTE.muted;
  ctx.font = `600 14px ${FONT}`;
  ctx.fillText('Press R to play again · M to mute', 640, 500);
  ctx.textAlign = 'left';
}

export function drawTitle(ctx, time) {
  drawRoom(ctx, time);
  // A dimmed gallery behind the title, with one guard cone sweeping.
  ctx.fillStyle = 'rgba(10, 6, 14, 0.62)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.brassLight;
  ctx.font = `700 64px ${FONT}`;
  ctx.fillText('THE VELVET VAULT', 640, 220);
  ctx.fillStyle = PALETTE.text;
  ctx.font = `600 22px ${FONT}`;
  ctx.fillText('A night heist in the velvet gallery', 640, 258);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = `600 16px ${FONT}`;
  ctx.fillText('Dodge the guards. Blind the cameras. Crack the vault. Vanish.', 640, 292);
  const rows = [
    'WASD / Arrows — move      Shift — sneak (harder to spot)',
    'Space — dash (fast, but loud)      E — throw a coin to lure a guard',
    'Q — smoke puff (blocks sight)      F — hold to crack the vault',
    'Grab 3 loot pieces or crack the vault, then reach the GETAWAY van.',
    'If the alarm fills, the guards converge — and you lose a life.',
  ];
  let y = 350;
  for (const row of rows) {
    ctx.fillText(row, 640, y);
    y += 28;
  }
  ctx.fillStyle = PALETTE.brassLight;
  ctx.font = `700 20px ${FONT}`;
  ctx.fillText(`— Press Enter or click to begin —`, 640, 540);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = `600 14px ${FONT}`;
  ctx.fillText('P pause · M mute · R restart', 640, 572);
  ctx.textAlign = 'left';
  void time;
}

/** Draw the whole game frame for the current state. */
export function drawGame(ctx, state, time) {
  drawRoom(ctx, time);
  drawVault(ctx, state.player, time);
  drawExit(ctx, state.ready, time);
  drawLoot(ctx, state.player, time);
  drawCover(ctx, time);
  drawTools(ctx, state.coins, state.smokePuffs, time);
  drawCameras(ctx, state.cameras, time);
  drawGuards(ctx, state.guards, time);
  drawPlayer(ctx, state.player, time);
  // Red alarm vignette as the meter climbs.
  if (state.alarm > 0.3) {
    const g = ctx.createRadialGradient(640, 360, 240, 640, 360, 720);
    g.addColorStop(0, 'rgba(255, 40, 40, 0)');
    g.addColorStop(1, `rgba(255, 40, 40, ${(state.alarm - 0.3) * 0.35})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  }
  drawHUD(ctx, state);
  if (state.message) {
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.text;
    ctx.font = `700 20px ${FONT}`;
    ctx.fillText(state.message, 640, 96);
    ctx.textAlign = 'left';
  }
  if (state.paused) {
    ctx.fillStyle = 'rgba(10, 6, 14, 0.6)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.text;
    ctx.font = `700 44px ${FONT}`;
    ctx.fillText('PAUSED', 640, 360);
    ctx.font = `600 16px ${FONT}`;
    ctx.fillText('Press P to resume', 640, 396);
    ctx.textAlign = 'left';
  }
}

export function drawEnd(ctx, state, won) {
  drawGame(ctx, state, 0);
  const mins = Math.floor(state.time / 60);
  const secs = Math.floor(state.time % 60);
  const timeStr = `${mins}:${String(secs).padStart(2, '0')}`;
  const rank = won
    ? state.time < 75 && state.spottedCount === 0
      ? 'S — Ghost Thief'
      : state.time < 120
        ? 'A — Clean Getaway'
        : state.spottedCount === 0
          ? 'B — Silent but Slow'
          : 'C — Loud Getaway'
    : '—';
  if (won) {
    drawBanner(ctx, 'CLEAN GETAWAY!', [
      `Loot: ${state.player.loot.length}/3${state.player.vaultCracked ? '  ·  Vault cracked' : ''}`,
      `Time: ${timeStr}   ·   Times spotted: ${state.spottedCount}`,
      `Rank: ${rank}`,
      state.best !== null ? `Best time: ${state.best}` : 'First clean getaway — the vault is yours.',
    ], PALETTE.safe);
  } else {
    drawBanner(ctx, 'CAUGHT!', [
      'The guards closed in and the alarm screamed.',
      `Loot held: ${state.player.loot.length}/3   ·   Time: ${timeStr}`,
      'Study the cones, use the shadows, and try again.',
    ], PALETTE.danger);
  }
}
