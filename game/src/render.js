// Everything the player sees, drawn on one canvas: the farmyard, the barn and the kitchen
// scrolling past, the turkey and the farmer chasing it, and the title, HUD, pause and end
// screens. All art is drawn here from shapes — no image files.

import {
  ESCAPE_DISTANCE,
  FIELD,
  FONT,
  HEARTS,
  PALETTE,
  TURKEY,
} from './config.js';
import { KIND_BRANCH, KIND_CORN, KIND_FEATHER, KIND_FENCE, KIND_HAYSTACK, KIND_KNIFE, KIND_OVEN, KIND_PUMPKIN, KIND_ROLLING_PIN } from './world.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

const GROUND = FIELD.groundY;

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function stageSky(stage) {
  if (stage === 0) return [PALETTE.farmSkyTop, PALETTE.farmSkyBottom];
  if (stage === 1) return [PALETTE.barnSkyTop, PALETTE.barnSkyBottom];
  return [PALETTE.kitchenSkyTop, PALETTE.kitchenSkyBottom];
}

function stageGround(stage) {
  if (stage === 0) return PALETTE.groundFarm;
  if (stage === 1) return PALETTE.groundBarn;
  return PALETTE.groundKitchen;
}

/** A deterministic pseudo-random value for a scenery slot, so the backdrop never flickers. */
function slotRand(slot, salt) {
  const v = Math.sin(slot * 127.1 + salt * 311.7) * 43758.5453;
  return v - Math.floor(v);
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');

  function fit() {
    const scale = Math.min(window.innerWidth / FIELD.width, window.innerHeight / FIELD.height);
    const width = Math.floor(FIELD.width * scale);
    const height = Math.floor(FIELD.height * scale);
    canvas.width = width * (window.devicePixelRatio || 1);
    canvas.height = height * (window.devicePixelRatio || 1);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(canvas.width / FIELD.width, 0, 0, canvas.height / FIELD.height, 0, 0);
  }
  fit();
  window.addEventListener('resize', fit);

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawCloud(x, y, scale) {
    ctx.fillStyle = 'rgba(255, 250, 235, 0.9)';
    ctx.beginPath();
    ctx.ellipse(x, y, 46 * scale, 18 * scale, 0, 0, Math.PI * 2);
    ctx.ellipse(x - 30 * scale, y + 6 * scale, 30 * scale, 13 * scale, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 32 * scale, y + 6 * scale, 32 * scale, 14 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawBackground(state) {
    const [top, bottom] = stageSky(state.stage);
    const sky = ctx.createLinearGradient(0, 0, 0, GROUND);
    sky.addColorStop(0, top);
    sky.addColorStop(1, bottom);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, FIELD.width, GROUND);

    // The sun, low and autumnal, and slow clouds.
    ctx.fillStyle = '#fff3c4';
    ctx.beginPath();
    ctx.arc(1080, 110, 52, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 243, 196, 0.35)';
    ctx.beginPath();
    ctx.arc(1080, 110, 78, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 5; i += 1) {
      const cx = ((i * 317 + 140 - state.scroll * 0.12) % 1500 + 1500) % 1500 - 110;
      drawCloud(cx, 70 + slotRand(i, 3) * 90, 0.7 + slotRand(i, 7) * 0.6);
    }

    if (state.stage === 2) {
      drawKitchenWalls(state);
    } else {
      drawFarmBackdrop(state);
    }

    // The ground and a moving fence line / floorboards.
    ctx.fillStyle = stageGround(state.stage);
    ctx.fillRect(0, GROUND, FIELD.width, FIELD.height - GROUND);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
    ctx.fillRect(0, GROUND, FIELD.width, 6);
    if (state.stage === 2) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      for (let x = -((state.scroll * 0.5) % 90); x < FIELD.width; x += 90) {
        ctx.fillRect(x, GROUND + 8, 3, FIELD.height - GROUND - 8);
      }
    } else {
      ctx.strokeStyle = 'rgba(60, 40, 20, 0.55)';
      ctx.lineWidth = 5;
      for (let x = -((state.scroll) % 130); x < FIELD.width; x += 130) {
        ctx.beginPath();
        ctx.moveTo(x, GROUND + 14);
        ctx.lineTo(x + 26, GROUND + 14);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + 8, GROUND + 26);
        ctx.lineTo(x + 34, GROUND + 26);
        ctx.stroke();
      }
    }
  }

  function drawFarmBackdrop(state) {
    // Rolling hills, a red barn and a windmill on the horizon.
    ctx.fillStyle = state.stage === 0 ? '#5d8a3c' : '#6d5a33';
    ctx.beginPath();
    ctx.moveTo(0, GROUND);
    for (let x = 0; x <= FIELD.width; x += 80) {
      ctx.lineTo(x, GROUND - 60 - slotRand(Math.floor(x / 80), 11) * 46);
    }
    ctx.lineTo(FIELD.width, GROUND);
    ctx.closePath();
    ctx.fill();

    const barnX = 880 - (state.scroll * 0.25) % 1600;
    ctx.fillStyle = '#a63d2f';
    ctx.fillRect(barnX, GROUND - 150, 150, 150);
    ctx.fillStyle = '#7e2c20';
    ctx.beginPath();
    ctx.moveTo(barnX - 12, GROUND - 148);
    ctx.lineTo(barnX + 75, GROUND - 210);
    ctx.lineTo(barnX + 162, GROUND - 148);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f2e3c2';
    ctx.fillRect(barnX + 60, GROUND - 96, 30, 96);
    ctx.strokeStyle = '#f2e3c2';
    ctx.lineWidth = 4;
    ctx.strokeRect(barnX + 18, GROUND - 128, 34, 34);

    // Fence posts drifting past in the middle distance.
    ctx.fillStyle = '#6b4423';
    for (let x = -((state.scroll * 0.6) % 110); x < FIELD.width; x += 110) {
      ctx.fillRect(x, GROUND - 66, 8, 66);
    }
    ctx.fillRect(0, GROUND - 58, FIELD.width, 6);
    ctx.fillRect(0, GROUND - 38, FIELD.width, 6);

    // Hay bales and pumpkins scattered on the field.
    for (let i = 0; i < 6; i += 1) {
      const bx = ((i * 263 + 90 - state.scroll * 0.8) % 1500 + 1500) % 1500 - 110;
      ctx.fillStyle = '#d9b96a';
      ctx.beginPath();
      ctx.arc(bx, GROUND - 16, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#b3924a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(bx, GROUND - 16, 14, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function drawKitchenWalls(state) {
    // Tiled wall, a window on the night, and pans hanging from a rail.
    ctx.fillStyle = '#e8d9b8';
    ctx.fillRect(0, 0, FIELD.width, GROUND);
    ctx.strokeStyle = 'rgba(120, 90, 60, 0.35)';
    ctx.lineWidth = 2;
    for (let y = 0; y < GROUND; y += 56) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(FIELD.width, y);
      ctx.stroke();
    }
    for (let x = 0; x < FIELD.width; x += 56) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, GROUND);
      ctx.stroke();
    }
    // Window with a dark November night outside.
    ctx.fillStyle = '#2c3a5e';
    roundRect(120, 90, 190, 150, 10);
    ctx.fill();
    ctx.fillStyle = '#f2e3c2';
    ctx.fillRect(208, 90, 12, 150);
    ctx.fillRect(120, 158, 190, 12);
    ctx.fillStyle = '#fff3c4';
    ctx.beginPath();
    ctx.arc(160, 125, 14, 0, Math.PI * 2);
    ctx.fill();
    // Hanging pans.
    ctx.fillStyle = '#3a3a42';
    ctx.fillRect(0, 60, FIELD.width, 8);
    for (let i = 0; i < 5; i += 1) {
      const px = 480 + i * 130;
      ctx.beginPath();
      ctx.arc(px, 108, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.14)';
      ctx.beginPath();
      ctx.arc(px - 8, 100, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3a3a42';
    }
  }

  function drawTurkey(state, x, feetY, alpha) {
    const run = state.runCycle;
    const bob = Math.sin(run * 2) * 3;
    const sliding = state.sliding;
    const hidden = state.hidden;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, feetY + bob * 0.4);
    if (state.invulnerable > 0 && Math.floor(state.time * 12) % 2 === 0) ctx.globalAlpha = alpha * 0.35;

    if (hidden) {
      // Only the tail feathers poke out of the haystack.
      ctx.fillStyle = PALETTE.turkeyTail[2];
      for (let i = -1; i <= 1; i += 1) {
        ctx.save();
        ctx.rotate(i * 0.35);
        ctx.beginPath();
        ctx.ellipse(0, -52, 10, 26, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
      return;
    }

    const bodyH = sliding ? 30 : 52;
    const bodyW = sliding ? 74 : 56;
    // Fanned tail.
    for (let i = 0; i < 5; i += 1) {
      const angle = -0.9 + i * 0.45;
      const color = PALETTE.turkeyTail[i];
      ctx.save();
      ctx.translate(-bodyW / 2 + 4, -bodyH + 8);
      ctx.rotate(angle);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(-6, -26, 11, 30, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 240, 200, 0.85)';
      ctx.beginPath();
      ctx.ellipse(-6, -48, 5, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    // Body.
    ctx.fillStyle = PALETTE.turkeyBody;
    ctx.beginPath();
    ctx.ellipse(0, -bodyH / 2, bodyW / 2, bodyH / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.turkeyDark;
    ctx.beginPath();
    ctx.ellipse(4, -bodyH / 2 + 8, bodyW / 2 - 10, bodyH / 2 - 12, 0, 0, Math.PI * 2);
    ctx.fill();
    // Wing.
    ctx.fillStyle = PALETTE.turkeyDark;
    ctx.beginPath();
    ctx.ellipse(-2, -bodyH / 2 + 2, 20, 12, -0.3 + Math.sin(run * 2) * 0.25, 0, Math.PI * 2);
    ctx.fill();
    // Legs, pumping while running.
    const legSwing = sliding ? 0 : Math.sin(run * 2) * 10;
    ctx.strokeStyle = '#e8a33c';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-8, -4);
    ctx.lineTo(-8 + legSwing, 0);
    ctx.moveTo(8, -4);
    ctx.lineTo(8 - legSwing, 0);
    ctx.stroke();
    // Head, beak, wattle and eye.
    const headY = sliding ? -bodyH - 2 : -bodyH - 12;
    ctx.fillStyle = PALETTE.turkeyHead;
    ctx.beginPath();
    ctx.arc(24, headY, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.beak;
    ctx.beginPath();
    ctx.moveTo(36, headY - 2);
    ctx.lineTo(52, headY + 3);
    ctx.lineTo(36, headY + 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PALETTE.wattle;
    ctx.beginPath();
    ctx.ellipse(38, headY + 12, 5, 9, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1c1410';
    ctx.beginPath();
    ctx.arc(28, headY - 4, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawFarmer(state) {
    // The farmer runs in from the left as the gap closes; off screen while he is far.
    const gapPx = state.farmerGap * 9;
    const x = TURKEY.x - 90 - gapPx;
    if (x < -160) return;
    const run = state.runCycle;
    const legSwing = Math.sin(run * 2.4) * 12;
    ctx.save();
    ctx.translate(x, GROUND);
    // Pitchfork, held high and shaking.
    ctx.strokeStyle = '#8a6b3f';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-34, -120);
    ctx.lineTo(-22, -30);
    ctx.stroke();
    ctx.strokeStyle = '#c9ced6';
    ctx.lineWidth = 4;
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.moveTo(-34 + i * 9, -120);
      ctx.lineTo(-34 + i * 9, -138);
      ctx.stroke();
    }
    // Legs.
    ctx.strokeStyle = PALETTE.farmerOveralls;
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-4, -58);
    ctx.lineTo(-4 + legSwing, 0);
    ctx.moveTo(10, -58);
    ctx.lineTo(10 - legSwing, 0);
    ctx.stroke();
    // Overalls and shirt.
    ctx.fillStyle = PALETTE.farmerOveralls;
    roundRect(-16, -108, 40, 54, 8);
    ctx.fill();
    ctx.fillStyle = PALETTE.farmerShirt;
    roundRect(-18, -122, 44, 22, 8);
    ctx.fill();
    // Arms pumping.
    ctx.strokeStyle = PALETTE.farmerShirt;
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(20, -116);
    ctx.lineTo(34, -96 + Math.sin(run * 2.4) * 6);
    ctx.moveTo(-14, -116);
    ctx.lineTo(-26, -96 - Math.sin(run * 2.4) * 6);
    ctx.stroke();
    // Head and straw hat.
    ctx.fillStyle = PALETTE.farmerSkin;
    ctx.beginPath();
    ctx.arc(4, -138, 17, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.farmerHat;
    ctx.beginPath();
    ctx.ellipse(4, -150, 30, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(4, -156, 18, 10, 0, Math.PI, 0);
    ctx.fill();
    // Angry eyes and moustache.
    ctx.strokeStyle = '#1c1410';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-6, -144);
    ctx.lineTo(0, -141);
    ctx.moveTo(14, -144);
    ctx.lineTo(8, -141);
    ctx.stroke();
    ctx.fillStyle = '#5b3a1e';
    ctx.fillRect(-4, -130, 16, 5);
    // Shout bubble when he is close.
    if (state.alarm) {
      ctx.fillStyle = '#fff6e0';
      roundRect(28, -196, 118, 40, 10);
      ctx.fill();
      ctx.fillStyle = '#a63d2f';
      ctx.font = `bold 22px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText('COME BACK!', 87, -169);
    }
    ctx.restore();
  }

  function drawObstacle(obstacle) {
    const x = obstacle.x;
    if (obstacle.kind === KIND_FENCE) {
      ctx.fillStyle = '#6b4423';
      ctx.fillRect(x, GROUND - 62, 8, 62);
      ctx.fillRect(x + 46, GROUND - 62, 8, 62);
      ctx.fillRect(x - 6, GROUND - 56, 66, 8);
      ctx.fillRect(x - 6, GROUND - 34, 66, 8);
      ctx.fillStyle = '#8a5a2e';
      ctx.beginPath();
      ctx.moveTo(x - 6, GROUND - 62);
      ctx.lineTo(x + 2, GROUND - 74);
      ctx.lineTo(x + 10, GROUND - 62);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + 40, GROUND - 62);
      ctx.lineTo(x + 48, GROUND - 74);
      ctx.lineTo(x + 56, GROUND - 62);
      ctx.closePath();
      ctx.fill();
    } else if (obstacle.kind === KIND_PUMPKIN) {
      ctx.fillStyle = '#e8762a';
      ctx.beginPath();
      ctx.ellipse(x + 27, GROUND - 22, 28, 22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#b85c14';
      ctx.lineWidth = 3;
      for (let i = -1; i <= 1; i += 1) {
        ctx.beginPath();
        ctx.ellipse(x + 27 + i * 10, GROUND - 22, 8, 20, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = '#3d6b1e';
      ctx.fillRect(x + 24, GROUND - 50, 6, 10);
    } else if (obstacle.kind === KIND_BRANCH) {
      // A low branch under a leafy bough: the bough hangs from above the frame, the
      // branch bar sits at head height with leaves and a berry below it, and nothing
      // stands in the turkey's lane at ground level.
      ctx.fillStyle = '#5b3a1e';
      ctx.fillRect(x + 22, GROUND - 172, 14, 56);
      ctx.fillStyle = '#3d6b1e';
      ctx.beginPath();
      ctx.ellipse(x + 29, GROUND - 168, 58, 34, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x - 8, GROUND - 150, 30, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x + 66, GROUND - 150, 28, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#5b3a1e';
      ctx.fillRect(x - 4, GROUND - 118, 62, 12);
      ctx.fillStyle = '#4a7a26';
      for (let i = 0; i < 4; i += 1) {
        ctx.beginPath();
        ctx.ellipse(x + 6 + i * 14, GROUND - 66, 10, 16, 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#e5534b';
      ctx.beginPath();
      ctx.arc(x + 30, GROUND - 70, 6, 0, Math.PI * 2);
      ctx.fill();
    } else if (obstacle.kind === KIND_ROLLING_PIN) {
      ctx.save();
      ctx.translate(x + 27, GROUND - 15);
      ctx.rotate((obstacle.x / 30) % (Math.PI * 2));
      ctx.fillStyle = '#d9b96a';
      roundRect(-27, -11, 54, 22, 10);
      ctx.fill();
      ctx.fillStyle = '#8a6b3f';
      ctx.fillRect(-34, -4, 8, 8);
      ctx.fillRect(26, -4, 8, 8);
      ctx.restore();
    } else if (obstacle.kind === KIND_OVEN) {
      ctx.fillStyle = PALETTE.ovenBody;
      roundRect(x, GROUND - 118, 116, 118, 8);
      ctx.fill();
      ctx.fillStyle = '#2c2c34';
      roundRect(x + 12, GROUND - 96, 92, 62, 6);
      ctx.fill();
      // The fire inside the oven door: an orange tongue with a yellow heart.
      const flicker = 0.75 + Math.sin(Date.now() / 90) * 0.25;
      ctx.fillStyle = PALETTE.ovenFire;
      ctx.globalAlpha = flicker;
      ctx.beginPath();
      ctx.moveTo(x + 22, GROUND - 40);
      ctx.quadraticCurveTo(x + 30, GROUND - 92, x + 52, GROUND - 56);
      ctx.quadraticCurveTo(x + 62, GROUND - 96, x + 78, GROUND - 58);
      ctx.quadraticCurveTo(x + 90, GROUND - 84, x + 94, GROUND - 40);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffd94d';
      ctx.beginPath();
      ctx.moveTo(x + 38, GROUND - 40);
      ctx.quadraticCurveTo(x + 46, GROUND - 70, x + 58, GROUND - 50);
      ctx.quadraticCurveTo(x + 70, GROUND - 70, x + 78, GROUND - 40);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#c9ced6';
      ctx.fillRect(x + 12, GROUND - 112, 92, 8);
      ctx.fillStyle = '#ff4d3d';
      ctx.beginPath();
      ctx.arc(x + 100, GROUND - 108, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff6e0';
      ctx.font = `bold 15px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText('HOT!', x + 58, GROUND - 124);
    } else if (obstacle.kind === KIND_KNIFE) {
      // The blade hangs from a rope and sweeps from knee height to head height; its tip
      // never drops below 30 px above the ground, so a sliding turkey slips under it.
      const lift = (Math.sin(obstacle.swing) + 1) / 2;
      const top = GROUND - 100 - lift * 120;
      ctx.strokeStyle = '#3a2a18';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x + 17, 0);
      ctx.lineTo(x + 17, top);
      ctx.stroke();
      ctx.fillStyle = PALETTE.knifeHandle;
      roundRect(x + 6, top, 22, 22, 5);
      ctx.fill();
      ctx.fillStyle = PALETTE.knifeBlade;
      ctx.beginPath();
      ctx.moveTo(x + 2, top + 20);
      ctx.lineTo(x + 32, top + 20);
      ctx.lineTo(x + 30, top + 70);
      ctx.lineTo(x + 17, top + 82);
      ctx.lineTo(x + 4, top + 70);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath();
      ctx.moveTo(x + 8, top + 26);
      ctx.lineTo(x + 14, top + 26);
      ctx.lineTo(x + 12, top + 62);
      ctx.closePath();
      ctx.fill();
    }
  }

  function drawPickup(pickup) {
    if (pickup.kind === KIND_CORN) {
      ctx.save();
      ctx.translate(pickup.x + 18, pickup.y);
      ctx.rotate(Math.sin(pickup.x / 40) * 0.2);
      ctx.fillStyle = PALETTE.corn;
      ctx.beginPath();
      ctx.ellipse(0, 0, 12, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#d9a92c';
      for (let r = -1; r <= 1; r += 1) {
        ctx.fillRect(-9, r * 10, 18, 3);
      }
      ctx.fillStyle = '#3d6b1e';
      ctx.beginPath();
      ctx.moveTo(0, 20);
      ctx.lineTo(-8, 34);
      ctx.lineTo(8, 34);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    } else {
      ctx.save();
      ctx.translate(pickup.x + 18, pickup.y);
      ctx.rotate(Math.sin(pickup.x / 50) * 0.3);
      ctx.fillStyle = PALETTE.feather;
      ctx.beginPath();
      ctx.ellipse(0, 0, 8, 20, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#b8860b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -20);
      ctx.lineTo(0, 20);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawHaystack(stack, state) {
    ctx.fillStyle = '#d9b96a';
    ctx.beginPath();
    ctx.moveTo(stack.x, GROUND);
    ctx.quadraticCurveTo(stack.x + stack.width / 2, GROUND - stack.height - 14, stack.x + stack.width, GROUND);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#b3924a';
    ctx.lineWidth = 3;
    for (let i = 0; i < 4; i += 1) {
      ctx.beginPath();
      ctx.moveTo(stack.x + 14 + i * 18, GROUND - 10);
      ctx.quadraticCurveTo(stack.x + 20 + i * 18, GROUND - 46, stack.x + 26 + i * 18, GROUND - 66);
      ctx.stroke();
    }
    if (state.hidden) {
      ctx.fillStyle = '#fff6e0';
      ctx.font = `bold 20px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText('SHHH…', stack.x + stack.width / 2, GROUND - stack.height - 24);
    }
  }

  function drawHud(state, best) {
    const progress = Math.min(1, state.distance / ESCAPE_DISTANCE);
    ctx.fillStyle = PALETTE.panel;
    roundRect(16, 14, 420, 92, 12);
    ctx.fill();
    ctx.fillStyle = PALETTE.text;
    ctx.textAlign = 'left';
    ctx.font = `bold 26px ${FONT}`;
    ctx.fillText(`SCORE ${state.score}`, 32, 48);
    ctx.font = `20px ${FONT}`;
    ctx.fillStyle = PALETTE.muted;
    ctx.fillText(`${Math.floor(state.distance)} m / ${ESCAPE_DISTANCE} m  ·  BEST ${Math.max(best, state.score)}`, 32, 78);
    ctx.fillText(['FARMYARD', 'BARN', 'KITCHEN'][state.stage], 32, 98);

    // Hearts.
    for (let i = 0; i < HEARTS; i += 1) {
      const cx = 480 + i * 44;
      const cy = 40;
      ctx.fillStyle = i < state.hearts ? '#ff5a4d' : 'rgba(255, 255, 255, 0.25)';
      ctx.beginPath();
      ctx.moveTo(cx, cy + 12);
      ctx.bezierCurveTo(cx - 18, cy - 4, cx - 10, cy - 18, cx, cy - 8);
      ctx.bezierCurveTo(cx + 10, cy - 18, cx + 18, cy - 4, cx, cy + 12);
      ctx.fill();
    }

    // The farmer gap: how close the chase is.
    ctx.fillStyle = PALETTE.panel;
    roundRect(FIELD.width - 316, 14, 300, 92, 12);
    ctx.fill();
    ctx.fillStyle = state.alarm ? PALETTE.danger : PALETTE.muted;
    ctx.font = `bold 18px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.fillText(state.alarm ? 'HE IS RIGHT BEHIND YOU!' : 'FARMER', FIELD.width - 300, 40);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    roundRect(FIELD.width - 300, 52, 268, 16, 8);
    ctx.fill();
    const gapFrac = Math.max(0, Math.min(1, state.farmerGap / 80));
    ctx.fillStyle = state.alarm ? PALETTE.danger : '#e8a33c';
    roundRect(FIELD.width - 300, 52, 268 * gapFrac, 16, 8);
    ctx.fill();
    ctx.fillStyle = PALETTE.text;
    ctx.font = `16px ${FONT}`;
    ctx.fillText(`${Math.max(0, Math.round(state.farmerGap))} m behind`, FIELD.width - 300, 90);

    // The escape progress bar across the bottom.
    ctx.fillStyle = 'rgba(20, 12, 8, 0.55)';
    ctx.fillRect(0, FIELD.height - 16, FIELD.width, 16);
    ctx.fillStyle = '#e8a33c';
    ctx.fillRect(0, FIELD.height - 16, FIELD.width * progress, 16);
    ctx.fillStyle = PALETTE.text;
    ctx.font = `bold 12px ${FONT}`;
    ctx.textAlign = 'right';
    ctx.fillText('ESCAPE → THE WOODS', FIELD.width - 12, FIELD.height - 4);
  }

  function drawBanner(state) {
    if (state.stageBanner <= 0) return;
    const alpha = Math.min(1, state.stageBanner);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(20, 12, 8, 0.6)';
    ctx.fillRect(0, 250, FIELD.width, 64);
    ctx.fillStyle = PALETTE.text;
    ctx.font = `bold 34px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(state.bannerText, FIELD.width / 2, 294);
    ctx.restore();
  }

  function panel(x, y, w, h) {
    ctx.fillStyle = 'rgba(20, 12, 8, 0.78)';
    roundRect(x, y, w, h, 18);
    ctx.fill();
    ctx.strokeStyle = 'rgba(232, 201, 138, 0.6)';
    ctx.lineWidth = 3;
    roundRect(x, y, w, h, 18);
    ctx.stroke();
  }

  function drawTitle(state, best) {
    drawBackground(state);
    for (const stack of state.haystacks) drawHaystack(stack, state);
    for (const obstacle of state.obstacles) drawObstacle(obstacle);
    drawTurkey(state, TURKEY.x, state.turkeyY, 1);
    drawFarmer(state);

    ctx.fillStyle = 'rgba(20, 12, 8, 0.45)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    panel(240, 84, 800, 420);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffb347';
    ctx.font = `bold 84px ${FONT}`;
    ctx.fillText('GOBBLE DASH', FIELD.width / 2, 190);
    ctx.fillStyle = PALETTE.text;
    ctx.font = `bold 30px ${FONT}`;
    ctx.fillText('The Great Thanksgiving Escape', FIELD.width / 2, 236);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `22px ${FONT}`;
    ctx.fillText('The farmer is coming for dinner. You are dinner. Run 1000 m to the woods!', FIELD.width / 2, 282);
    ctx.fillStyle = PALETTE.text;
    ctx.font = `bold 26px ${FONT}`;
    const blink = Math.floor(state.time * 2) % 2 === 0;
    if (blink) ctx.fillText('PRESS SPACE OR CLICK TO RUN', FIELD.width / 2, 348);
    ctx.font = `20px ${FONT}`;
    ctx.fillStyle = PALETTE.muted;
    ctx.fillText('SPACE / ↑ / W — jump     ↓ / S — slide & hide in haystacks     P — pause     M — mute', FIELD.width / 2, 392);
    ctx.fillText('Dodge fences, pumpkins and rolling pins. Duck the branches and the carving knife.', FIELD.width / 2, 424);
    ctx.fillText('Hop onto the oven to cross it. Hide in a haystack to lose the farmer (+25).', FIELD.width / 2, 452);
    if (best > 0) {
      ctx.fillStyle = '#ffd94d';
      ctx.font = `bold 22px ${FONT}`;
      ctx.fillText(`BEST SCORE ${best}`, FIELD.width / 2, 492);
    }
  }

  function drawPaused() {
    ctx.fillStyle = 'rgba(20, 12, 8, 0.6)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    panel(440, 260, 400, 180);
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.text;
    ctx.font = `bold 40px ${FONT}`;
    ctx.fillText('PAUSED', FIELD.width / 2, 330);
    ctx.font = `20px ${FONT}`;
    ctx.fillStyle = PALETTE.muted;
    ctx.fillText('Press P or Space to keep running', FIELD.width / 2, 372);
    ctx.fillText('The farmer waits for no turkey.', FIELD.width / 2, 402);
  }

  function drawOver(state, best) {
    drawBackground(state);
    for (const stack of state.haystacks) drawHaystack(stack, state);
    for (const obstacle of state.obstacles) drawObstacle(obstacle);
    if (state.escaped) drawTurkey(state, TURKEY.x + 120, state.turkeyY, 1);
    else drawFarmer(state);

    ctx.fillStyle = 'rgba(20, 12, 8, 0.45)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    panel(280, 110, 720, 420);
    ctx.textAlign = 'center';
    if (state.escaped) {
      ctx.fillStyle = '#7ddc5f';
      ctx.font = `bold 76px ${FONT}`;
      ctx.fillText('ESCAPED!', FIELD.width / 2, 210);
      ctx.fillStyle = PALETTE.text;
      ctx.font = `26px ${FONT}`;
      ctx.fillText('You made it to the woods — no Thanksgiving dinner today.', FIELD.width / 2, 258);
      ctx.fillText('The farmer is still looking. Happy Thanksgiving!', FIELD.width / 2, 292);
    } else {
      ctx.fillStyle = PALETTE.danger;
      ctx.font = `bold 76px ${FONT}`;
      ctx.fillText('CAUGHT!', FIELD.width / 2, 210);
      ctx.fillStyle = PALETTE.text;
      ctx.font = `26px ${FONT}`;
      ctx.fillText(`The farmer grabbed you at ${Math.floor(state.distance)} m — so close to the woods.`, FIELD.width / 2, 258);
      ctx.fillText('Next time, jump the fences and hide in the hay.', FIELD.width / 2, 292);
    }
    ctx.fillStyle = '#ffd94d';
    ctx.font = `bold 30px ${FONT}`;
    ctx.fillText(`SCORE ${state.score}`, FIELD.width / 2, 360);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `22px ${FONT}`;
    ctx.fillText(`Distance ${Math.floor(state.distance)} m  ·  Best ${Math.max(best, state.score)}`, FIELD.width / 2, 398);
    const blink = Math.floor(state.time * 2) % 2 === 0;
    if (blink) {
      ctx.fillStyle = PALETTE.text;
      ctx.font = `bold 26px ${FONT}`;
      ctx.fillText('PRESS SPACE OR CLICK TO RUN AGAIN', FIELD.width / 2, 462);
    }
  }

  function draw(state, screen, best) {
    ctx.clearRect(0, 0, FIELD.width, FIELD.height);
    if (screen === SCREEN_TITLE) {
      drawTitle(state, best);
      return;
    }
    if (screen === SCREEN_OVER) {
      drawOver(state, best);
      return;
    }
    drawBackground(state);
    for (const stack of state.haystacks) drawHaystack(stack, state);
    for (const pickup of state.pickups) drawPickup(pickup);
    for (const obstacle of state.obstacles) drawObstacle(obstacle);
    drawTurkey(state, TURKEY.x, state.turkeyY, 1);
    drawFarmer(state);
    if (state.stumbleFlash > 0) {
      ctx.fillStyle = `rgba(255, 60, 40, ${state.stumbleFlash * 0.4})`;
      ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    }
    drawHud(state, best);
    drawBanner(state);
    if (screen === SCREEN_PAUSED) drawPaused();
  }

  return { draw, fit };
}
