// The screenshot scenes behind ?shot=start|play|kitchen|end. Each one plays the real rules
// forward from a fresh world, steered by a simple autopilot (jump the fences and pumpkins,
// slide under the branches, hide in a haystack when the farmer is close), so the frame is
// what a real run looks like and the same seed always gives the same frame. The end scene's
// pilot never jumps, so the farmer catches it — as a hurried player is caught.

import { ESCAPE_DISTANCE, FIELD, STEP, TURKEY } from './config.js';
import { EVENT_OVER, KIND_BRANCH, KIND_HAYSTACK, KIND_KNIFE, KIND_OVEN } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

const START_SECONDS = 5;
const PLAY_SECONDS = 24;
const KITCHEN_SECONDS = 9;
const END_LIMIT_SECONDS = 120;

function nextObstacle(state) {
  let nearest = null;
  for (const obstacle of state.obstacles) {
    if (obstacle.x + obstacle.width < TURKEY.x - 10) continue;
    if (!nearest || obstacle.x < nearest.x) nearest = obstacle;
  }
  return nearest;
}

function nextHaystack(state) {
  for (const stack of state.haystacks) {
    if (stack.x + stack.width > TURKEY.x && stack.x < TURKEY.x + TURKEY.width + 30) return stack;
  }
  return null;
}

/** Jump what can be jumped, slide under the branches, hide when the farmer closes in. */
function autopilot(state) {
  const control = { jump: false, down: false };
  const obstacle = nextObstacle(state);
  if (state.hidden) {
    control.down = true;
    return control;
  }
  const haystack = nextHaystack(state);
  if (haystack && state.farmerGap < 34 && state.hideCooldown <= 0) {
    control.down = true;
    return control;
  }
  if (obstacle) {
    const gap = obstacle.x - (TURKEY.x + TURKEY.width);
    if (obstacle.kind === KIND_BRANCH || obstacle.kind === KIND_KNIFE) {
      // Low hazards are slipped under: the branch hangs at head height and the knife's
      // tip never drops below a sliding turkey, so hold Down through either.
      if (gap < 210) control.down = true;
    } else if (obstacle.kind === KIND_OVEN) {
      // Hop onto the oven early enough to land on its top and run across it.
      if (gap < ovenWindow(state)) control.jump = state.turkeyY >= supportYOf(state);
    } else if (gap < jumpWindow(state) && gap > -20) {
      control.jump = state.turkeyY >= supportYOf(state);
    }
  }
  return control;
}

/** How close a low hazard must be before the jump: about a tenth of a second of scroll. */
function jumpWindow(state) {
  return state.speed * 26 * 0.12;
}

/** How close the oven must be: a quarter of a second, so the turkey lands on its top. */
function ovenWindow(state) {
  return state.speed * 26 * 0.25;
}

/** The ground under the turkey's feet, as the world sees it (field or oven top). */
function supportYOf(state) {
  let ground = FIELD.groundY;
  for (const obstacle of state.obstacles) {
    if (obstacle.kind !== KIND_OVEN) continue;
    if (TURKEY.x + TURKEY.width <= obstacle.x || TURKEY.x >= obstacle.x + obstacle.width) continue;
    const top = FIELD.groundY - obstacle.height;
    if (state.turkeyY <= top) ground = Math.min(ground, top);
  }
  return ground;
}

/** A pilot that never jumps: it stumbles into everything and gets caught. */
function carelessPilot() {
  return { jump: false, down: false };
}

/**
 * Set `world` to the named scene (start, play, kitchen or end; any other name is start)
 * and return the screen to draw over it and the best score to show.
 */
export function stageShot(name, world) {
  world.reset();
  if (name !== 'play' && name !== 'kitchen' && name !== 'end') {
    for (let index = 0; index < START_SECONDS / STEP; index += 1) world.step(STEP, { jump: false, down: false }, true);
    return { screen: SCREEN_TITLE, best: 0 };
  }
  if (name === 'end') {
    for (let index = 0; index < END_LIMIT_SECONDS / STEP; index += 1) {
      if (world.step(STEP, carelessPilot(), false) & EVENT_OVER) break;
    }
    return { screen: SCREEN_OVER, best: world.state.score };
  }
  // Play the run forward with the good pilot: to the farmyard for `play`, on into the
  // kitchen for `kitchen`, then hold the frame a few seconds into that stage.
  const kitchen = name === 'kitchen';
  const limit = kitchen ? 200 : PLAY_SECONDS;
  for (let index = 0; index < limit / STEP; index += 1) {
    world.step(STEP, autopilot(world.state), false);
    if (kitchen && world.state.stage === 2 && world.state.distance > 730) break;
    if (world.state.over) break;
  }
  if (kitchen) {
    for (let index = 0; index < KITCHEN_SECONDS / STEP; index += 1) {
      world.step(STEP, autopilot(world.state), false);
      if (world.state.over) break;
    }
  }
  const over = world.state.over;
  return { screen: over ? SCREEN_OVER : SCREEN_PLAY, best: world.state.score };
}
